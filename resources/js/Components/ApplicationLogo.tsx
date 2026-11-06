import React, { ImgHTMLAttributes } from 'react';
import { asset } from '@/utils/asset';

export default function ApplicationLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src={asset('images/logo_alcaldia.png')}
            alt="Alcaldía de Acacías - PuntoTIC"
            {...props}
        />
    );
}

