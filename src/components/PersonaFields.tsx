'use client';

import { ChevronDown } from 'lucide-react';
import { Field, TextInput } from '@/components/ui';
import { TIPOS_DOCUMENTO, type CampoPersona, type TipoDocumento } from '@/lib/persona';

export interface Persona {
  firstName: string;
  lastName: string;
  cedula: string; // "V-12345678" mientras se escribe
  phone: string;
}

export const PERSONA_VACIA: Persona = { firstName: '', lastName: '', cedula: 'V-', phone: '' };

// Nombre, apellido, cédula y teléfono de quien usa la entrada. Mismo bloque en todas las pantallas.
export default function PersonaFields({
  id = '',
  value,
  onChange,
  errors = {},
  phone = 'required',
  cedula = 'required',
  phoneHint,
}: {
  id?: string;
  value: Persona;
  onChange: (v: Persona) => void;
  errors?: Partial<Record<CampoPersona, string>>;
  phone?: 'required' | 'optional';
  cedula?: 'required' | 'optional';
  phoneHint?: string;
}) {
  const fid = (name: string) => (id ? `${id}-${name}` : name);
  const set = (k: keyof Persona) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nombre" htmlFor={fid('nombre')} error={errors.firstName}>
        <TextInput
          id={fid('nombre')}
          value={value.firstName}
          onChange={(e) => set('firstName')(e.target.value)}
          autoComplete="given-name"
          autoCapitalize="words"
          data-error={Boolean(errors.firstName)}
        />
      </Field>
      <Field label="Apellido" htmlFor={fid('apellido')} error={errors.lastName}>
        <TextInput
          id={fid('apellido')}
          value={value.lastName}
          onChange={(e) => set('lastName')(e.target.value)}
          autoComplete="family-name"
          autoCapitalize="words"
          data-error={Boolean(errors.lastName)}
        />
      </Field>
      <Field
        label={cedula === 'required' ? 'Cédula' : 'Cédula (opcional)'}
        htmlFor={fid('cedula')}
        error={errors.cedula}
        hint="Si es un niño sin cédula, escribe la de su representante."
      >
        <CedulaInput id={fid('cedula')} value={value.cedula} onChange={set('cedula')} invalid={Boolean(errors.cedula)} />
      </Field>
      <Field
        label={phone === 'required' ? 'Teléfono' : 'Teléfono (opcional)'}
        htmlFor={fid('telefono')}
        error={errors.phone}
        hint={phoneHint}
      >
        <TextInput
          id={fid('telefono')}
          type="tel"
          inputMode="tel"
          value={value.phone}
          onChange={(e) => set('phone')(e.target.value)}
          autoComplete="tel"
          placeholder="0414-1234567"
          data-error={Boolean(errors.phone)}
        />
      </Field>
    </div>
  );
}

function CedulaInput({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
}) {
  const tipo = (value.match(/^([VEP])-/)?.[1] ?? 'V') as TipoDocumento;
  const numero = value.replace(/^[VEP]-/, '');
  return (
    <div className="flex">
      <div className="relative shrink-0">
        <select
          aria-label="Tipo de documento"
          value={tipo}
          onChange={(e) => onChange(`${e.target.value}-${numero}`)}
          className="h-12 appearance-none rounded-l-xl border-2 border-r-0 border-line bg-paper-2 pl-4 pr-8 text-base font-bold text-ink transition-colors focus:border-ink focus:outline-none"
        >
          {TIPOS_DOCUMENTO.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2" aria-hidden />
      </div>
      <TextInput
        id={id}
        value={numero}
        onChange={(e) => onChange(`${tipo}-${e.target.value}`)}
        inputMode={tipo === 'P' ? 'text' : 'numeric'}
        autoComplete="off"
        placeholder={tipo === 'P' ? 'N.º de pasaporte' : '12345678'}
        data-error={invalid}
        className="min-w-0 rounded-l-none"
      />
    </div>
  );
}

// Para editar datos ya guardados. Las entradas registradas antes de separar nombre y apellido
// solo tienen el nombre completo: se reparte en la primera palabra y el resto.
export function personaDe(e: {
  attendeeName: string | null;
  attendeeFirstName: string | null;
  attendeeLastName: string | null;
  attendeeCedula: string | null;
  attendeePhone: string | null;
}): Persona {
  const [primero = '', ...resto] = (e.attendeeName || '').trim().split(/\s+/);
  return {
    firstName: e.attendeeFirstName ?? primero,
    lastName: e.attendeeLastName ?? resto.join(' '),
    cedula: e.attendeeCedula || 'V-',
    phone: e.attendeePhone || '',
  };
}
