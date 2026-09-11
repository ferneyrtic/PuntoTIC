import React, { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/logo_alcaldia.png"
            alt="Alcaldía de Acacías - PuntoTIC"
            {...props}
        />
    );
}

