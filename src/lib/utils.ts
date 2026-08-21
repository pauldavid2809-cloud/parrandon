import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: 'USD' | 'VES' | 'USDT' = 'USD'): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'USDT') {
    return `${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  }
  return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return dateString;
  }
}

export function generateOrderId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `ORD-${rand}${letter}`;
}

export function generateTicketCodeWithSeat(tableId: string, seatNumber: number): string {
  const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const cleanTable = tableId.toUpperCase();
  const padSeat = String(seatNumber).padStart(2, '0');
  return `PARR-${cleanTable}-S${padSeat}-${randHex}`;
}

// Normaliza números de teléfono locales venezolanos (ej: 04141234567 o 0414-1234567) al formato internacional de WhatsApp (584141234567)
export function cleanPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/[^0-9]/g, '');

  if (digits.startsWith('0')) {
    digits = '58' + digits.substring(1);
  } else if (
    digits.length === 10 &&
    (digits.startsWith('414') || digits.startsWith('424') || digits.startsWith('412') || digits.startsWith('416') || digits.startsWith('426'))
  ) {
    digits = '58' + digits;
  } else if (!digits.startsWith('58') && digits.length > 7) {
    digits = '58' + digits;
  }

  return digits;
}
