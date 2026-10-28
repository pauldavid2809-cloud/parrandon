import 'server-only';
import type { Entrada } from './types';

// Datos que ve el personal (puerta, taquilla) al escanear.
export function staffView(e: Entrada) {
  return {
    code: e.code,
    number: e.number,
    status: e.status,
    holderType: e.holderType,
    holderName: e.holderName,
    attendeeName: e.attendeeName,
    attendeeCedula: e.attendeeCedula,
    attendeePhone: e.attendeePhone,
    tableId: e.tableId,
    paymentMethod: e.paymentMethod,
    paymentReference: e.paymentReference,
    reportedBy: e.reportedBy,
    doorActivated: e.doorActivated,
    rejectionReason: e.rejectionReason,
    checkedInAt: e.checkedInAt,
  };
}

export type StaffView = ReturnType<typeof staffView>;
