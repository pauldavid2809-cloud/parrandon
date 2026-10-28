'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CameraScanner from '@/components/CameraScanner';
import { Notice } from '@/components/ui';

const CODE_RE = /P\d{3,4}-[2-9A-HJ-NP-Z]{8}/i;

export default function ActivarScanner({ autoStart }: { autoStart: boolean }) {
  const router = useRouter();
  const [wrong, setWrong] = useState(false);
  return (
    <div>
      <CameraScanner
        autoStart={autoStart}
        onResult={(text) => {
          const match = text.toUpperCase().match(CODE_RE);
          if (!match) {
            setWrong(true);
            return;
          }
          router.push(`/e/${match[0]}`);
        }}
      />
      {wrong && (
        <Notice tone="warn" className="mt-3" title="Ese QR no es de una entrada del Parrandón">
          Apunta al QR impreso en tu entrada, al lado del número.
        </Notice>
      )}
    </div>
  );
}
