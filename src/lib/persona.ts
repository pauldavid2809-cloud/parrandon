// Datos de quien usa la entrada: nombre, apellido, cédula y teléfono.
// Se usa igual en el navegador (para avisar antes de enviar) y en el servidor (que decide).

export type TipoDocumento = 'V' | 'E' | 'P';

// V venezolano, E extranjero residente, P pasaporte (como en los formularios de los bancos).
export const TIPOS_DOCUMENTO: TipoDocumento[] = ['V', 'E', 'P'];

// Acepta "V-12.345.678", "v12345678", "12345678" (V por defecto) o "P-AB123456".
// Devuelve la forma guardada ("V-12345678") o null si no es válida.
export function normalizarCedula(raw: unknown): string | null {
  const s = String(raw ?? '').toUpperCase().replace(/\s+/g, '');
  const m = s.match(/^([VEP])?-?(.*)$/);
  if (!m) return null;
  const tipo = (m[1] || 'V') as TipoDocumento;
  if (tipo === 'P') {
    const num = m[2].replace(/[^0-9A-Z]/g, '');
    return num.length >= 5 && num.length <= 15 ? `P-${num}` : null;
  }
  const num = m[2].replace(/\D/g, '').replace(/^0+/, '');
  return num.length >= 4 && num.length <= 9 ? `${tipo}-${num}` : null;
}

// "V-12345678" → "V-12.345.678"
export function formatCedula(cedula: string | null | undefined): string {
  if (!cedula) return '';
  const [tipo, num = ''] = cedula.split('-');
  if (tipo === 'P' || !/^\d+$/.test(num)) return cedula;
  return `${tipo}-${num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

// Para quien solo tiene el QR en la mano: "V-••.•••.678".
export function ocultarCedula(cedula: string | null | undefined): string | null {
  if (!cedula) return null;
  const f = formatCedula(cedula);
  const [tipo, resto = ''] = [f.slice(0, 2), f.slice(2)];
  const visibles = 3;
  let alnum = resto.replace(/[^0-9A-Z]/g, '').length;
  return (
    tipo +
    resto.replace(/[0-9A-Z]/g, (c) => {
      alnum--;
      return alnum < visibles ? c : '•';
    })
  );
}

const LETRA = /\p{L}/u;

export function limpiarNombre(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

export interface PersonaInput {
  firstName?: unknown;
  lastName?: unknown;
  cedula?: unknown;
  phone?: unknown;
}

export interface ReglasPersona {
  cedula: boolean; // obligatoria
  phone: boolean; // obligatorio
}

export const MENSAJES_PERSONA = {
  firstName: 'Escribe el nombre de quien va a usar la entrada.',
  lastName: 'Escribe el apellido de quien va a usar la entrada.',
  cedula: 'Escribe una cédula válida, por ejemplo V-12345678. Si es un niño sin cédula, usa la de su representante.',
  phone: 'Escribe un teléfono válido, por ejemplo 0414-1234567.',
} as const;

export type CampoPersona = keyof typeof MENSAJES_PERSONA;

// Errores por campo; vacío si todo está bien.
export function erroresPersona(input: PersonaInput, reglas: ReglasPersona): Partial<Record<CampoPersona, string>> {
  const e: Partial<Record<CampoPersona, string>> = {};
  const first = limpiarNombre(input.firstName);
  const last = limpiarNombre(input.lastName);
  if (first.length < 2 || !LETRA.test(first)) e.firstName = MENSAJES_PERSONA.firstName;
  if (last.length < 2 || !LETRA.test(last)) e.lastName = MENSAJES_PERSONA.lastName;
  const cedulaRaw = String(input.cedula ?? '').replace(/^[VEP]-?$/i, '').trim();
  if ((reglas.cedula || cedulaRaw) && !normalizarCedula(cedulaRaw)) e.cedula = MENSAJES_PERSONA.cedula;
  const phoneDigits = String(input.phone ?? '').replace(/\D/g, '');
  if ((reglas.phone || phoneDigits) && (phoneDigits.length < 10 || phoneDigits.length > 15)) e.phone = MENSAJES_PERSONA.phone;
  return e;
}
