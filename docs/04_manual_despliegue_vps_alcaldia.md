# MANUAL DE DESPLIEGUE, CONFIGURACIÓN Y MANTENIMIENTO EN VPS PRIVADO
## Plataforma de Gestión y Analítica — Puntos Vive Digital (PVD)
### Alcaldía Municipal de Acacías — Meta | Secretaría de las TIC

---

| Metadato del Documento | Detalle Institucional |
|---|---|
| **Proyecto:** | Plataforma de Registro, Gestión Comunitaria y Analítica PVD |
| **Entorno Objetivo:** | Servidor Privado Virtual (VPS) — Infraestructura Alcaldía de Acacías |
| **Sistema Operativo Base:**| Ubuntu Server 22.04 LTS / 24.04 LTS (64-bit) |
| **Servidor Web / Runtime:**| Nginx 1.24+ / PHP 8.2+ FPM |
| **Base de Datos:** | SQLite 3 WAL (Configuración por defecto) / PostgreSQL 15+ |
| **Versión del Manual:** | 2.0.0 (Guía Oficial de Puesta en Producción) |
| **Fecha de Publicación:** | Septiembre de 2026 |

---

## 1. ESPECIFICACIONES DE INFRAESTRUCTURA DEL SERVIDOR

### 1.1 Requisitos Mínimos y Recomendados de Hardware (VPS)

| Componente | Requisito Mínimo | Requisito Recomendado (Alcaldía) |
|---|---|---|
| **Procesador (vCPU)** | 2 vCPU (x86_64) | 4 vCPU dedicados |
| **Memoria RAM** | 4 GB | 8 GB con 2 GB Swap |
| **Almacenamiento** | 40 GB SSD / NVMe | 80 GB NVMe en RAID |
| **Ancho de Banda** | 50 Mbps simétricos | 100 Mbps simétricos |
| **Dirección IP** | 1 IP Pública Fija (IPv4) | 1 IP Pública Fija con Firewall Perimetral |
| **Puertos Abiertos** | 80 (HTTP), 443 (HTTPS), 22 (SSH seguro)| Restricción SSH solo a IPs de la Alcaldía |

---

## 2. GUÍA DE INSTALACIÓN PASO A PASO EN EL VPS

### Paso 1: Actualización del Sistema Operativo
Conéctese vía SSH al VPS como usuario `root` o con privilegios `sudo`:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y software-properties-common curl wget git unzip htop ufw fail2ban
```

---

### Paso 2: Instalación de PHP 8.2 y Extensiones Requeridas
Agregue el repositorio oficial de Ondřej Surý e instale PHP-FPM con las librerías necesarias para Laravel y PhpSpreadsheet:

```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

sudo apt install -y php8.2-fpm php8.2-cli php8.2-common \
    php8.2-sqlite3 php8.2-mysql php8.2-pgsql \
    php8.2-mbstring php8.2-xml php8.2-curl \
    php8.2-zip php8.2-gd php8.2-bcmath \
    php8.2-intl php8.2-readline
```

Verifique la instalación:
```bash
php -v
# Debe retornar: PHP 8.2.x o superior
```

---

### Paso 3: Instalación de Composer y Node.js (Vite)
Descargue el gestor de dependencias oficial de PHP:

```bash
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
composer --version
```

Instale Node.js 20 LTS (necesario para compilación de assets Tailwind/Vite si se compilan en servidor):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

---

### Paso 4: Instalación y Configuración del Servidor Web Nginx

Instale el paquete de Nginx:
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

### Paso 5: Despliegue del Código Fuente y Permisos de Linux

Clone o extraiga el proyecto en el directorio estándar `/var/www/`:

```bash
sudo mkdir -p /var/www/pvd-acacias
sudo chown -R $USER:$USER /var/www/pvd-acacias
cd /var/www/pvd-acacias

# Clonar repositorio institucional o copiar archivos
# git clone <url-repositorio-alcaldia> .

# Instalar dependencias de producción de PHP
composer install --no-dev --optimize-autoloader

# Compilar assets para producción
npm install
npm run build
```

#### Asignación Estricta de Permisos de Seguridad
El servidor web (`www-data`) debe tener permisos de escritura sobre `storage`, la base de datos y la caché:

```bash
sudo chown -R www-data:www-data /var/www/pvd-acacias
sudo chmod -R 755 /var/www/pvd-acacias
sudo chmod -R 775 /var/www/pvd-acacias/storage
sudo chmod -R 775 /var/www/pvd-acacias/bootstrap/cache
sudo chmod -R 775 /var/www/pvd-acacias/database
```

---

### Paso 6: Configuración del Archivo `.env` de Producción

Cree o ajuste el archivo de variables de entorno:
```bash
cp .env.example .env
nano .env
```

Asegúrese de establecer los siguientes parámetros críticos de seguridad:
```ini
APP_NAME="PVD Acacías"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://pvd.acacias.gov.co

LOG_CHANNEL=daily
LOG_LEVEL=info

# Configuración de Base de Datos SQLite (Concurrencia WAL)
DB_CONNECTION=sqlite
DB_DATABASE=/var/www/pvd-acacias/database/database.sqlite

# Configuración de Sesión y Caché
SESSION_DRIVER=file
SESSION_LIFETIME=120
CACHE_STORE=file
```

Genere la clave de cifrado de la aplicación:
```bash
php artisan key:generate
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

### Paso 7: Configuración de Nginx VirtualHost (Bloque de Servidor)

Cree el archivo de configuración en `/etc/nginx/sites-available/pvd-acacias.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name pvd.acacias.gov.co; # O la dirección IP del VPS

    root /var/www/pvd-acacias/public;
    index index.php index.html;

    # Opciones de seguridad de cabeceras HTTP
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    charset utf-8;
    client_max_body_size 50M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    # Caché estática para assets Vite/Tailwind
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }

    # Procesamiento de PHP con PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        fastcgi_read_timeout 300;
    }

    # Bloqueo estricto de archivos ocultos y configuración sensible
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Active el sitio y reinicie Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/pvd-acacias.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Paso 8: Configuración de Certificado SSL / TLS (HTTPS)

Para habilitar cifrado TLS 1.3 con Let's Encrypt:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pvd.acacias.gov.co
```
Certbot configurará automáticamente la renovación periódica y el redireccionamiento obligatorio de HTTP a HTTPS.

---

## 3. TAREAS PROGRAMADAS Y AUTOMATIZACIÓN (CRON)

Para el cálculo de predicciones y mantenimiento de sesiones, agregue el cron de Laravel:

```bash
sudo crontab -u www-data -e
```
Agregue la siguiente línea:
```cron
* * * * * cd /var/www/pvd-acacias && php artisan schedule:run >> /dev/null 2>&1
```

---

## 4. POLÍTICA DE COPIAS DE SEGURIDAD (BACKUPS DIARIOS)

Cree un script de respaldo automatizado en `/usr/local/bin/backup_pvd.sh`:

```bash
sudo nano /usr/local/bin/backup_pvd.sh
```

Pegue el siguiente contenido:
```bash
#!/bin/bash
# Backup Diario de Base de Datos PVD Acacías
FECHA=$(date +"%Y%m%d_%H%M%S")
DESTINO="/var/backups/pvd"
ORIGEN_DB="/var/www/pvd-acacias/database/database.sqlite"

mkdir -p $DESTINO

# Copia de seguridad en caliente con SQLite
sqlite3 $ORIGEN_DB ".backup '$DESTINO/pvd_backup_$FECHA.sqlite'"

# Comprimir en gzip
gzip -9 "$DESTINO/pvd_backup_$FECHA.sqlite"

# Conservar únicamente los últimos 30 días de backups
find $DESTINO -name "pvd_backup_*.sqlite.gz" -mtime +30 -delete

echo "[$(date)] Respaldo completado: pvd_backup_$FECHA.sqlite.gz" >> /var/log/pvd_backups.log
```

Otorgue permisos de ejecución y prográmelo en el crontab del sistema (`sudo crontab -e`):
```bash
sudo chmod +x /usr/local/bin/backup_pvd.sh
```
```cron
0 2 * * * /usr/local/bin/backup_pvd.sh # Se ejecuta todas las madrugadas a las 2:00 a.m.
```

---

## 5. PLAN DE RECUPERACIÓN ANTE DESASTRES (DISASTER RECOVERY - DRP)

En caso de contingencia o fallo de hardware:
1. Instale un nuevo servidor siguiendo los pasos 1 a 6 de este manual.
2. Descargue la copia de seguridad comprimida más reciente desde el almacenamiento externo o repositorio seguro.
3. Descomprima y restaure la base de datos:
   ```bash
   gunzip -c /var/backups/pvd/pvd_backup_YYYYMMDD_HHMMSS.sqlite.gz > /var/www/pvd-acacias/database/database.sqlite
   sudo chown www-data:www-data /var/www/pvd-acacias/database/database.sqlite
   sudo chmod 664 /var/www/pvd-acacias/database/database.sqlite
   ```
4. Limpie y regenere la caché:
   ```bash
   cd /var/www/pvd-acacias
   php artisan optimize:clear && php artisan optimize
   ```
5. El sistema estará 100% operativo en menos de **10 minutos**, preservando los 23.847 ciudadanos y todo el historial.
