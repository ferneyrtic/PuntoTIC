<?php

namespace App\Services;

use RuntimeException;
use XMLWriter;
use ZipArchive;

/**
 * Streaming native OOXML (.xlsx) and UTF-8 CSV writer using PHP XMLWriter + ZipArchive.
 *
 * Avoids hydrating PhpSpreadsheet DOM cell/style/auto-size graphs in memory,
 * allowing 50k+ row exports to finish in a couple of seconds with minimal RAM.
 */
class FastSpreadsheetWriter
{
    /**
     * Write an .xlsx file to a temporary path and return the file path.
     *
     * @param  array<int, string>  $headers
     * @param  iterable<int, array<int, mixed>>  $rows
     * @param  array{
     *     headerColor?: string,
     *     sheetTitle?: string,
     *     numericColumns?: array<int, int>,
     *     columnWidths?: array<int, int|float>
     * }  $options
     */
    public function writeXlsx(array $headers, iterable $rows, array $options = []): string
    {
        if (! class_exists(ZipArchive::class) || ! class_exists(XMLWriter::class)) {
            throw new RuntimeException('Las extensiones ZipArchive y XMLWriter son requeridas para exportación rápida XLSX.');
        }

        $headerColor = strtoupper(ltrim((string) ($options['headerColor'] ?? '1B6B35'), '#'));
        if (! preg_match('/^[0-9A-F]{6}$/', $headerColor)) {
            $headerColor = '1B6B35';
        }

        $sheetTitle = $this->sanitizeSheetTitle((string) ($options['sheetTitle'] ?? 'Datos'));
        $numericLookup = array_flip($options['numericColumns'] ?? []);
        $explicitWidths = $options['columnWidths'] ?? [];

        $colCount = count($headers);
        $colLetters = [];
        $widths = [];
        for ($i = 0; $i < $colCount; $i++) {
            $colLetters[$i] = $this->columnLetter($i);
            $headerLen = mb_strlen((string) ($headers[$i] ?? ''), 'UTF-8');
            $widths[$i] = isset($explicitWidths[$i])
                ? (float) $explicitWidths[$i]
                : (float) max(12, min(42, $headerLen + 6));
        }

        // Buffer up to 150 rows first so column widths reflect actual data without O(N*M) scans
        $sampleRows = [];
        $iterator = $this->toIterator($rows);
        while ($iterator->valid() && count($sampleRows) < 150) {
            $row = $iterator->current();
            $sampleRows[] = $row;
            if (! empty($explicitWidths)) {
                $iterator->next();
                continue;
            }
            for ($i = 0; $i < $colCount; $i++) {
                if (isset($explicitWidths[$i])) {
                    continue;
                }
                $val = $row[$i] ?? '';
                if ($val !== null && $val !== '') {
                    $len = mb_strlen((string) $val, 'UTF-8');
                    $candidate = (float) max(12, min(42, $len + 4));
                    if ($candidate > $widths[$i]) {
                        $widths[$i] = $candidate;
                    }
                }
            }
            $iterator->next();
        }

        $sheetTmpPath = tempnam(sys_get_temp_dir(), 'pvd_sheet_');
        $xlsxTmpPath = tempnam(sys_get_temp_dir(), 'pvd_xlsx_');
        if ($sheetTmpPath === false || $xlsxTmpPath === false) {
            throw new RuntimeException('No se pudo crear archivo temporal para exportación XLSX.');
        }

        $writer = new XMLWriter();
        if (! $writer->openURI($sheetTmpPath)) {
            @unlink($sheetTmpPath);
            @unlink($xlsxTmpPath);
            throw new RuntimeException('No se pudo abrir flujo XML para hoja XLSX.');
        }

        $writer->startDocument('1.0', 'UTF-8', 'yes');
        $writer->startElement('worksheet');
        $writer->writeAttribute('xmlns', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');

        // Freeze top header row (A2)
        $writer->startElement('sheetViews');
        $writer->startElement('sheetView');
        $writer->writeAttribute('tabSelected', '1');
        $writer->writeAttribute('workbookViewId', '0');
        $writer->startElement('pane');
        $writer->writeAttribute('ySplit', '1');
        $writer->writeAttribute('topLeftCell', 'A2');
        $writer->writeAttribute('activePane', 'bottomLeft');
        $writer->writeAttribute('state', 'frozen');
        $writer->endElement(); // pane
        $writer->endElement(); // sheetView
        $writer->endElement(); // sheetViews

        $writer->startElement('sheetFormatPr');
        $writer->writeAttribute('defaultRowHeight', '18');
        $writer->endElement();

        if ($colCount > 0) {
            $writer->startElement('cols');
            for ($i = 0; $i < $colCount; $i++) {
                $writer->startElement('col');
                $writer->writeAttribute('min', (string) ($i + 1));
                $writer->writeAttribute('max', (string) ($i + 1));
                $writer->writeAttribute('width', (string) $widths[$i]);
                $writer->writeAttribute('customWidth', '1');
                $writer->endElement();
            }
            $writer->endElement(); // cols
        }

        $writer->startElement('sheetData');

        // Row 1: Styled Header
        $writer->startElement('row');
        $writer->writeAttribute('r', '1');
        $writer->writeAttribute('ht', '28');
        $writer->writeAttribute('customHeight', '1');
        for ($i = 0; $i < $colCount; $i++) {
            $this->writeStringCell($writer, $colLetters[$i] . '1', $headers[$i] ?? '', '2');
        }
        $writer->endElement(); // row 1

        $rowIndex = 2;
        foreach ($sampleRows as $row) {
            $this->writeDataRow($writer, $rowIndex, $row, $colCount, $colLetters, $numericLookup);
            $rowIndex++;
        }

        $flushCounter = 0;
        while ($iterator->valid()) {
            $this->writeDataRow($writer, $rowIndex, $iterator->current(), $colCount, $colLetters, $numericLookup);
            $rowIndex++;
            $flushCounter++;
            if (($flushCounter % 1000) === 0) {
                $writer->flush();
            }
            $iterator->next();
        }

        $writer->endElement(); // sheetData
        $writer->endElement(); // worksheet
        $writer->endDocument();
        $writer->flush();
        unset($writer);

        $zip = new ZipArchive();
        if ($zip->open($xlsxTmpPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            @unlink($sheetTmpPath);
            @unlink($xlsxTmpPath);
            throw new RuntimeException('No se pudo empaquetar el archivo ZIP/XLSX.');
        }

        $zip->addFromString('[Content_Types].xml', $this->buildContentTypesXml());
        $zip->addFromString('_rels/.rels', $this->buildRootRelsXml());
        $zip->addFromString('xl/workbook.xml', $this->buildWorkbookXml($sheetTitle));
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->buildWorkbookRelsXml());
        $zip->addFromString('xl/styles.xml', $this->buildStylesXml($headerColor));
        $zip->addFile($sheetTmpPath, 'xl/worksheets/sheet1.xml');

        if (method_exists($zip, 'setCompressionName')) {
            // Deflate level 1 gives maximum speed with good compression on repetitive XML tags
            $zip->setCompressionName('xl/worksheets/sheet1.xml', ZipArchive::CM_DEFLATE, 1);
        }

        $zip->close();
        @unlink($sheetTmpPath);

        return $xlsxTmpPath;
    }

    /**
     * Write a UTF-8 CSV (with Excel-friendly BOM) to a temporary path and return it.
     *
     * @param  array<int, string>  $headers
     * @param  iterable<int, array<int, mixed>>  $rows
     */
    public function writeCsv(array $headers, iterable $rows): string
    {
        $csvTmpPath = tempnam(sys_get_temp_dir(), 'pvd_csv_');
        if ($csvTmpPath === false) {
            throw new RuntimeException('No se pudo crear archivo temporal para exportación CSV.');
        }

        $handle = fopen($csvTmpPath, 'wb');
        if ($handle === false) {
            @unlink($csvTmpPath);
            throw new RuntimeException('No se pudo abrir archivo temporal CSV para escritura.');
        }

        // UTF-8 BOM so Microsoft Excel preserves Spanish accents and ñ automatically
        fwrite($handle, "\xEF\xBB\xBF");
        fputcsv($handle, $headers);

        $colCount = count($headers);
        foreach ($rows as $row) {
            $line = [];
            for ($i = 0; $i < $colCount; $i++) {
                $val = $row[$i] ?? '';
                $line[] = $val === null ? '' : (string) $val;
            }
            fputcsv($handle, $line);
        }

        fclose($handle);

        return $csvTmpPath;
    }

    private function writeDataRow(
        XMLWriter $writer,
        int $rowIndex,
        array $row,
        int $colCount,
        array $colLetters,
        array $numericLookup
    ): void {
        $writer->startElement('row');
        $writer->writeAttribute('r', (string) $rowIndex);

        $rowStr = (string) $rowIndex;
        for ($i = 0; $i < $colCount; $i++) {
            $ref = $colLetters[$i] . $rowStr;
            $val = $row[$i] ?? null;

            if ($val === null || $val === '') {
                $writer->startElement('c');
                $writer->writeAttribute('r', $ref);
                $writer->writeAttribute('s', '1');
                $writer->endElement();
                continue;
            }

            if (isset($numericLookup[$i]) && is_numeric($val)) {
                $writer->startElement('c');
                $writer->writeAttribute('r', $ref);
                $writer->writeAttribute('t', 'n');
                $writer->writeAttribute('s', '1');
                $writer->writeElement('v', (string) $val);
                $writer->endElement();
                continue;
            }

            $this->writeStringCell($writer, $ref, $val, '1');
        }

        $writer->endElement(); // row
    }

    private function writeStringCell(XMLWriter $writer, string $ref, mixed $value, string $styleId): void
    {
        $clean = $this->sanitizeString($value);

        $writer->startElement('c');
        $writer->writeAttribute('r', $ref);
        $writer->writeAttribute('t', 'inlineStr');
        $writer->writeAttribute('s', $styleId);
        $writer->startElement('is');
        $writer->startElement('t');
        if ($clean !== '' && ($clean !== trim($clean))) {
            $writer->writeAttribute('xml:space', 'preserve');
        }
        $writer->text($clean);
        $writer->endElement(); // t
        $writer->endElement(); // is
        $writer->endElement(); // c
    }

    private function sanitizeString(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        $str = (string) $value;
        if (! mb_check_encoding($str, 'UTF-8')) {
            $str = mb_convert_encoding($str, 'UTF-8', 'ISO-8859-1');
        }
        $str = mb_scrub($str, 'UTF-8');

        return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $str) ?? '';
    }

    private function sanitizeSheetTitle(string $title): string
    {
        $title = str_replace(['[', ']', ':', '*', '?', '/', '\\'], ' ', trim($title));
        $title = preg_replace('/\s+/', ' ', $title) ?: 'Datos';

        return mb_substr($title, 0, 31, 'UTF-8');
    }

    private function columnLetter(int $index): string
    {
        $letter = '';
        $num = $index + 1;
        while ($num > 0) {
            $mod = ($num - 1) % 26;
            $letter = chr(65 + $mod) . $letter;
            $num = intdiv($num - $mod - 1, 26);
        }

        return $letter;
    }

    private function toIterator(iterable $rows): \Iterator
    {
        if ($rows instanceof \Iterator) {
            return $rows;
        }
        if ($rows instanceof \IteratorAggregate) {
            return $rows->getIterator();
        }
        if (is_array($rows)) {
            return new \ArrayIterator($rows);
        }

        return (function () use ($rows) {
            foreach ($rows as $row) {
                yield $row;
            }
        })();
    }

    private function buildContentTypesXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            . '<Default Extension="xml" ContentType="application/xml"/>'
            . '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            . '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            . '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            . '</Types>';
    }

    private function buildRootRelsXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            . '</Relationships>';
    }

    private function buildWorkbookXml(string $sheetTitle): string
    {
        $escapedTitle = htmlspecialchars($sheetTitle, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            . '<sheets>'
            . '<sheet name="' . $escapedTitle . '" sheetId="1" r:id="rId1"/>'
            . '</sheets>'
            . '</workbook>';
    }

    private function buildWorkbookRelsXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            . '</Relationships>';
    }

    private function buildStylesXml(string $headerColor): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            . '<fonts count="2">'
            . '<font><sz val="11"/><name val="Calibri"/></font>'
            . '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
            . '</fonts>'
            . '<fills count="3">'
            . '<fill><patternFill patternType="none"/></fill>'
            . '<fill><patternFill patternType="gray125"/></fill>'
            . '<fill><patternFill patternType="solid"><fgColor rgb="FF' . $headerColor . '"/><bgColor indexed="64"/></patternFill></fill>'
            . '</fills>'
            . '<borders count="2">'
            . '<border><left/><right/><top/><bottom/><diagonal/></border>'
            . '<border>'
            . '<left style="thin"><color rgb="FFE5E7EB"/></left>'
            . '<right style="thin"><color rgb="FFE5E7EB"/></right>'
            . '<top style="thin"><color rgb="FFE5E7EB"/></top>'
            . '<bottom style="thin"><color rgb="FFE5E7EB"/></bottom>'
            . '<diagonal/>'
            . '</border>'
            . '</borders>'
            . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            . '<cellXfs count="3">'
            . '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            . '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>'
            . '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
            . '</cellXfs>'
            . '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
            . '</styleSheet>';
    }
}
