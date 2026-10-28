'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';

export default function QrImage({
  value,
  className,
  dark = '#2a1a12',
  light = '#fffaf0',
  label,
}: {
  value: string;
  className?: string;
  dark?: string;
  light?: string;
  label?: string;
}) {
  const [svg, setSvg] = useState<string>('');
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark, light } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(''));
    return () => {
      alive = false;
    };
  }, [value, dark, light]);
  return (
    <div
      role="img"
      aria-label={label || 'Código QR'}
      className={cn('aspect-square [&>svg]:h-full [&>svg]:w-full', className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
