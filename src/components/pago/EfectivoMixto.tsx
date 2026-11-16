'use client';

import { Field, TextInput } from '@/components/ui';
import { dinero, leerMonto } from '@/lib/entradas/pago';

// Zelle + efectivo: cuánto se pagó en efectivo. Lo demás va por Zelle y se muestra al escribir.
export default function EfectivoMixto({
  id,
  totalUsd,
  value,
  onChange,
  error,
  label = '¿Cuánto pagó en efectivo?',
}: {
  id: string;
  totalUsd: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}) {
  const efectivo = leerMonto(value);
  const zelle = totalUsd > 0 && efectivo > 0 && efectivo < totalUsd ? Math.round((totalUsd - efectivo) * 100) / 100 : null;
  const hint =
    zelle != null
      ? `El resto, ${dinero(zelle)}, por Zelle.`
      : totalUsd > 0
        ? `De ${dinero(totalUsd)}. El resto va por Zelle.`
        : 'El resto va por Zelle.';
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <TextInput id={id} inputMode="decimal" placeholder="10" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}
