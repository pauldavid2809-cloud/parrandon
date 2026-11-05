import type { EventConfig } from '@/types';

// Pago Móvil se puede pausar desde Administración → Configuración. Apagado por defecto:
// por ahora solo se cobra en efectivo y por Zelle.
export function aceptaPagoMovil(config: Pick<EventConfig, 'paymentDetails'> | null | undefined): boolean {
  return config?.paymentDetails?.pagoMovil?.activo === true;
}

export const PAGO_MOVIL_PAUSADO = 'Por ahora no se recibe Pago Móvil. Paga por Zelle, o en efectivo con quien te vendió la entrada.';
