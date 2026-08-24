import fs from 'fs';
import path from 'path';
import { EventConfig, Order, Ticket, EventStats, ScanResult, OrderStatus, TableInfo, SeatSelection, SalesChannel, PaymentMethod, Currency } from '@/types';
import { generateOrderId, generateTicketCodeWithSeat } from './utils';
import { generateQrDataUrl } from './qr';
import { supabase, isSupabaseConfigured } from './supabase';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'parrandon_db.json');

export const DEFAULT_CONFIG: EventConfig = {
  eventName: "Parrandón Navideño 2026",
  subtitle: "Seminario Mayor Santo Tomás de Aquino",
  edition: "Gran Fiesta Tradicional y Familiar",
  date: "Sábado, 12 de Diciembre de 2026",
  time: "06:00 PM - 01:00 AM",
  venue: "Bulevar del Seminario Mayor Santo Tomás de Aquino",
  venueAddress: "Sede del Seminario Santo Tomás de Aquino, Maracaibo, Estado Zulia",
  totalQuota: 500,
  totalTables: 50,
  seatsPerTable: 10,
  ticketPriceUsd: 20,
  childTicketPriceUsd: 10,
  currentRateBs: 897.82,
  description: "Una noche inolvidable en el Bulevar del Seminario Santo Tomás de Aquino de Maracaibo: gaitas en vivo, villancicos, bazar navideño, rifas y plato navideño completo.",
  includesMeal: true,
  mealName: "Plato Navideño Tradicional Completo",
  announcement: "¡Preventa activa! 50 mesas numeradas en el Bulevar. Elige tu mesa y sillas hoy.",
  paymentDetails: {
    pagoMovil: {
      bank: "0102 - Banco de Venezuela",
      phone: "0414-7001122",
      docId: "J-30456789-0",
      holder: "Seminario Santo Tomás de Aquino"
    },
    zelle: {
      email: "parrandonseminariosta@gmail.com",
      holder: "Seminario Santo Tomás de Aquino"
    },
    binance: {
      payId: "89342019",
      email: "pagosbinance.seminario@gmail.com",
      network: "USDT (BEP20 / TRC20)",
      address: "0x71C28B89a42f5348911F7Db463Ab35f37E5a7201"
    },
    cash: {
      location: "Oficina de Administración del Seminario y Parroquias Asignadas",
      schedule: "Lunes a Domingo con los Seminaristas"
    },
    paypal: {
      clientId: "BAAycXcLnxs_Yony3FAFx25j6r-6tmdRUKdvVQgyPb-6VTIgWmsgSBjWzNZtdy9TzJn5pnKaGEIUtfCVyg",
      paymentLink: "https://www.paypal.com/ncp/links/7Q68BFZ87W9QG",
      buttonId: "7Q68BFZ87W9QG"
    }
  }
};

interface DatabaseSchema {
  config: EventConfig;
  orders: Order[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function mapDbRowToOrder(row: any): Order {
  return {
    id: row.id,
    createdAt: row.created_at || new Date().toISOString(),
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email || '',
    buyerPhone: row.buyer_phone,
    buyerDocId: row.buyer_doc_id || '',
    quantity: Number(row.quantity) || 1,
    seats: row.seats || [],
    attendees: row.attendees || [],
    paymentMethod: row.payment_method as PaymentMethod,
    paymentReference: row.payment_reference || 'N/A',
    paymentProofUrl: row.payment_proof_url,
    amountPaid: Number(row.amount_paid) || 0,
    currency: row.currency as Currency,
    convertedUsd: Number(row.converted_usd) || 0,
    rateApplied: row.rate_applied ? Number(row.rate_applied) : undefined,
    status: row.status as OrderStatus,
    salesChannel: row.sales_channel as SalesChannel,
    sellerName: row.seller_name,
    parishName: row.parish_name,
    rejectionReason: row.rejection_reason,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by,
    notes: row.notes,
    tickets: row.tickets || []
  };
}

function mapOrderToDbRow(order: Order): any {
  return {
    id: order.id,
    created_at: order.createdAt || new Date().toISOString(),
    buyer_name: order.buyerName || 'Invitado',
    buyer_email: order.buyerEmail || '',
    buyer_phone: order.buyerPhone || '',
    buyer_doc_id: order.buyerDocId || '',
    quantity: Number(order.quantity) || 1,
    seats: Array.isArray(order.seats) ? order.seats : [],
    attendees: Array.isArray(order.attendees) ? order.attendees : [],
    payment_method: order.paymentMethod || 'cash',
    payment_reference: order.paymentReference || 'N/A',
    payment_proof_url: order.paymentProofUrl || null,
    amount_paid: Number(order.amountPaid) || 0,
    currency: order.currency || 'USD',
    converted_usd: Number(order.convertedUsd) || 0,
    rate_applied: order.rateApplied ? Number(order.rateApplied) : null,
    status: order.status || 'pending',
    sales_channel: order.salesChannel || 'online',
    seller_name: order.sellerName || null,
    parish_name: order.parishName || null,
    rejection_reason: order.rejectionReason || null,
    verified_at: order.verifiedAt || null,
    verified_by: order.verifiedBy || null,
    notes: order.notes || null,
    tickets: Array.isArray(order.tickets) ? order.tickets : []
  };
}

// Generate all 50 tables with 10 seats
export function generateAllTables(): TableInfo[] {
  const sectors: Array<'A' | 'B' | 'C' | 'D' | 'E'> = ['A', 'B', 'C', 'D', 'E'];
  const tables: TableInfo[] = [];

  for (const sector of sectors) {
    for (let tableNum = 1; tableNum <= 10; tableNum++) {
      const tableId = `${sector}${tableNum}`;
      const seats = [];
      for (let seatNum = 1; seatNum <= 10; seatNum++) {
        seats.push({
          number: seatNum,
          isOccupied: false,
          isPending: false
        });
      }
      tables.push({
        id: tableId,
        sector,
        number: tableNum,
        totalSeats: 10,
        seats
      });
    }
  }

  return tables;
}

async function getSeedOrders(): Promise<Order[]> {
  const seedOrderId1 = "ORD-7492A";
  const t1Code = generateTicketCodeWithSeat("A1", 1);
  const t2Code = generateTicketCodeWithSeat("A1", 2);
  const qr1 = await generateQrDataUrl(t1Code);
  const qr2 = await generateQrDataUrl(t2Code);

  const seedOrderId2 = "ORD-5183B";
  const t3Code = generateTicketCodeWithSeat("A1", 3);
  const qr3 = await generateQrDataUrl(t3Code);

  const seedOrderId3 = "ORD-8921P";
  const t4Code = generateTicketCodeWithSeat("B2", 1);
  const t5Code = generateTicketCodeWithSeat("B2", 2);
  const qr4 = await generateQrDataUrl(t4Code);
  const qr5 = await generateQrDataUrl(t5Code);

  return [
    {
      id: seedOrderId1,
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      buyerName: "Carlos Eduardo Mendoza",
      buyerEmail: "carlos.mendoza@gmail.com",
      buyerPhone: "+58 414 7568921",
      buyerDocId: "V-18456789",
      quantity: 2,
      seats: [
        { tableId: "A1", seatNumber: 1, sector: "A" },
        { tableId: "A1", seatNumber: 2, sector: "A" }
      ],
      attendees: [
        { name: "Carlos Eduardo Mendoza", docId: "V-18456789", tableId: "A1", seatNumber: 1 },
        { name: "María Fernanda Mendoza", docId: "V-19876543", tableId: "A1", seatNumber: 2 }
      ],
      paymentMethod: "pago_movil",
      paymentReference: "098234",
      paymentProofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600",
      amountPaid: 970,
      currency: "VES",
      convertedUsd: 20,
      rateApplied: 48.50,
      status: "approved",
      salesChannel: "online",
      verifiedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      verifiedBy: "Anabella (Admin)",
      notes: "Venta Online en Bulevar",
      tickets: [
        {
          id: `${seedOrderId1}-T1`,
          orderId: seedOrderId1,
          ticketCode: t1Code,
          tableId: "A1",
          seatNumber: 1,
          sector: "A",
          attendeeName: "Carlos Eduardo Mendoza",
          buyerName: "Carlos Eduardo Mendoza",
          buyerPhone: "+58 414 7568921",
          ticketNumber: 1,
          qrCodeDataUrl: qr1,
          isUsed: false,
          mealServed: false
        },
        {
          id: `${seedOrderId1}-T2`,
          orderId: seedOrderId1,
          ticketCode: t2Code,
          tableId: "A1",
          seatNumber: 2,
          sector: "A",
          attendeeName: "María Fernanda Mendoza",
          buyerName: "Carlos Eduardo Mendoza",
          buyerPhone: "+58 414 7568921",
          ticketNumber: 2,
          qrCodeDataUrl: qr2,
          isUsed: false,
          mealServed: false
        }
      ]
    },
    {
      id: seedOrderId2,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      buyerName: "Gabriela Lucía Ramírez",
      buyerEmail: "gabriela.ramirez@hotmail.com",
      buyerPhone: "+58 424 7123984",
      buyerDocId: "V-22345678",
      quantity: 1,
      seats: [
        { tableId: "A1", seatNumber: 3, sector: "A" }
      ],
      attendees: [
        { name: "Gabriela Lucía Ramírez", docId: "V-22345678", tableId: "A1", seatNumber: 3 }
      ],
      paymentMethod: "zelle",
      paymentReference: "ZEL-9823104",
      paymentProofUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=600",
      amountPaid: 10,
      currency: "USD",
      convertedUsd: 10,
      status: "approved",
      salesChannel: "online",
      verifiedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      verifiedBy: "Anabella (Admin)",
      tickets: [
        {
          id: `${seedOrderId2}-T1`,
          orderId: seedOrderId2,
          ticketCode: t3Code,
          tableId: "A1",
          seatNumber: 3,
          sector: "A",
          attendeeName: "Gabriela Lucía Ramírez",
          buyerName: "Gabriela Lucía Ramírez",
          buyerPhone: "+58 424 7123984",
          ticketNumber: 3,
          qrCodeDataUrl: qr3,
          isUsed: false,
          mealServed: false
        }
      ]
    },
    {
      id: seedOrderId3,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      buyerName: "Dr. Marcos Alarcón",
      buyerEmail: "marcos.alarcon@gmail.com",
      buyerPhone: "+58 414 7112233",
      buyerDocId: "V-12987345",
      quantity: 2,
      seats: [
        { tableId: "B2", seatNumber: 1, sector: "B" },
        { tableId: "B2", seatNumber: 2, sector: "B" }
      ],
      attendees: [
        { name: "Dr. Marcos Alarcón", docId: "V-12987345", tableId: "B2", seatNumber: 1 },
        { name: "Sra. Teresa de Alarcón", docId: "V-13456789", tableId: "B2", seatNumber: 2 }
      ],
      paymentMethod: "cash",
      paymentReference: "EFECTIVO-PARROQUIA",
      amountPaid: 20,
      currency: "USD",
      convertedUsd: 20,
      status: "approved",
      salesChannel: "seminarista_parroquia",
      sellerName: "Hno. Daniel Colmenares",
      parishName: "Basílica de Nuestra Señora de Chiquinquirá (La Chinita)",
      notes: "Venta presencial domingo en misa",
      tickets: [
        {
          id: `${seedOrderId3}-T1`,
          orderId: seedOrderId3,
          ticketCode: t4Code,
          tableId: "B2",
          seatNumber: 1,
          sector: "B",
          attendeeName: "Dr. Marcos Alarcón",
          buyerName: "Dr. Marcos Alarcón",
          buyerPhone: "+58 414 7112233",
          ticketNumber: 4,
          qrCodeDataUrl: qr4,
          isUsed: false,
          mealServed: false
        },
        {
          id: `${seedOrderId3}-T2`,
          orderId: seedOrderId3,
          ticketCode: t5Code,
          tableId: "B2",
          seatNumber: 2,
          sector: "B",
          attendeeName: "Sra. Teresa de Alarcón",
          buyerName: "Dr. Marcos Alarcón",
          buyerPhone: "+58 414 7112233",
          ticketNumber: 5,
          qrCodeDataUrl: qr5,
          isUsed: false,
          mealServed: false
        }
      ]
    }
  ];
}

async function readDb(): Promise<DatabaseSchema> {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const seedOrders = await getSeedOrders();
    const initialData: DatabaseSchema = {
      config: DEFAULT_CONFIG,
      orders: seedOrders
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw) as DatabaseSchema;
    return data;
  } catch (err) {
    console.error('Error reading db file, restoring fallback:', err);
    return {
      config: DEFAULT_CONFIG,
      orders: []
    };
  }
}

function writeDb(data: DatabaseSchema) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getEventConfig(): Promise<EventConfig> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('event_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (data && !error) {
        return {
          eventName: data.event_name,
          subtitle: data.subtitle,
          edition: data.edition,
          date: data.date,
          time: data.time,
          venue: data.venue,
          venueAddress: data.venue_address,
          totalQuota: data.total_quota,
          totalTables: data.total_tables,
          seatsPerTable: data.seats_per_table,
          ticketPriceUsd: Number(data.ticket_price_usd),
          childTicketPriceUsd: Number(data.child_ticket_price_usd),
          currentRateBs: Number(data.current_rate_bs),
          description: data.description,
          includesMeal: data.includes_meal,
          mealName: data.meal_name,
          announcement: data.announcement,
          paymentDetails: data.payment_details || DEFAULT_CONFIG.paymentDetails
        };
      }
    } catch (e) {
      console.warn('Fallo consulta Supabase config, fallback a local:', e);
    }
  }

  const db = await readDb();
  return db.config || DEFAULT_CONFIG;
}

export async function updateEventConfig(updated: Partial<EventConfig>): Promise<EventConfig> {
  if (isSupabaseConfigured && supabase) {
    try {
      const current = await getEventConfig();
      const merged: EventConfig = {
        ...current,
        ...updated,
        paymentDetails: {
          ...current.paymentDetails,
          ...(updated.paymentDetails || {})
        }
      };

      const { error } = await supabase
        .from('event_config')
        .upsert({
          id: 1,
          event_name: merged.eventName,
          subtitle: merged.subtitle,
          edition: merged.edition,
          date: merged.date,
          time: merged.time,
          venue: merged.venue,
          venue_address: merged.venueAddress,
          total_quota: merged.totalQuota,
          total_tables: merged.totalTables,
          seats_per_table: merged.seatsPerTable,
          ticket_price_usd: merged.ticketPriceUsd,
          child_ticket_price_usd: merged.childTicketPriceUsd,
          current_rate_bs: merged.currentRateBs,
          description: merged.description,
          includes_meal: merged.includesMeal,
          meal_name: merged.mealName,
          announcement: merged.announcement,
          payment_details: merged.paymentDetails,
          updated_at: new Date().toISOString()
        });

      if (!error) return merged;
    } catch (e) {
      console.warn('Error actualizando config en Supabase, fallback a local:', e);
    }
  }

  const db = await readDb();
  db.config = {
    ...db.config,
    ...updated,
    paymentDetails: {
      ...db.config.paymentDetails,
      ...(updated.paymentDetails || {})
    }
  };
  writeDb(db);
  return db.config;
}

export async function getAllOrders(): Promise<Order[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        return data.map(mapDbRowToOrder);
      }
    } catch (e) {
      console.warn('Fallo consulta Supabase orders, fallback a local:', e);
    }
  }

  const db = await readDb();
  return db.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrderById(id: string): Promise<Order | null> {
  const cleanId = id.trim().toUpperCase();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .ilike('id', cleanId)
        .single();

      if (data && !error) {
        return mapDbRowToOrder(data);
      }
    } catch (e) {
      console.warn('Fallo getOrderById Supabase:', e);
    }
  }

  const db = await readDb();
  return db.orders.find(o => o.id.toUpperCase() === cleanId) || null;
}

export async function getOrderByTicketCode(code: string): Promise<{ order: Order; ticket: Ticket } | null> {
  const clean = code.trim().toUpperCase();
  const orders = await getAllOrders();
  for (const order of orders) {
    const ticket = order.tickets?.find(t => t.ticketCode.toUpperCase() === clean);
    if (ticket) {
      return { order, ticket };
    }
  }
  return null;
}

// Global search: Order ID, Ticket Code, Cedula, or Phone
export async function searchOrdersOrTickets(query: string): Promise<{
  orders: Order[];
  ticketMatch?: { order: Order; ticket: Ticket } | null;
}> {
  const clean = query.trim().toUpperCase();
  if (!clean) return { orders: [], ticketMatch: null };

  const allOrders = await getAllOrders();
  const normalizedQuery = clean.replace(/[^A-Z0-9]/g, '');

  // 1. Check exact ticket match
  const ticketMatch = await getOrderByTicketCode(clean);

  // 2. Filter matching orders
  const matchedOrders = allOrders.filter(order => {
    const orderIdNorm = order.id.replace(/[^A-Z0-9]/g, '');
    const docIdNorm = (order.buyerDocId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const phoneNorm = (order.buyerPhone || '').replace(/[^0-9]/g, '');
    const queryDigits = clean.replace(/\D/g, '');

    const matchId = orderIdNorm.includes(normalizedQuery);
    const matchDoc = docIdNorm.length > 3 && (docIdNorm.includes(normalizedQuery) || normalizedQuery.includes(docIdNorm));
    const matchPhone = queryDigits.length >= 6 && phoneNorm.includes(queryDigits);
    const matchBuyer = order.buyerName.toUpperCase().includes(clean);
    const matchTicket = order.tickets?.some(t => t.ticketCode.toUpperCase().includes(clean));

    return matchId || matchDoc || matchPhone || matchBuyer || matchTicket;
  });

  return {
    orders: matchedOrders,
    ticketMatch
  };
}

// Get the full 50 tables state with individual 10 seats status
export async function getTablesState(): Promise<TableInfo[]> {
  const orders = await getAllOrders();
  const tables = generateAllTables();

  for (const order of orders) {
    if (order.status === 'rejected') continue;
    const isPending = order.status === 'pending';

    for (const seat of order.seats || []) {
      const table = tables.find(t => t.id === seat.tableId);
      if (table) {
        const seatObj = table.seats.find(s => s.number === seat.seatNumber);
        if (seatObj) {
          seatObj.isOccupied = !isPending;
          seatObj.isPending = isPending;
          seatObj.orderId = order.id;
          const ticket = order.tickets?.find(t => t.tableId === seat.tableId && t.seatNumber === seat.seatNumber);
          if (ticket) {
            seatObj.ticketCode = ticket.ticketCode;
            seatObj.attendeeName = ticket.attendeeName;
          }
        }
      }
    }
  }

  return tables;
}

// Auto-assign available seats strictly in order (Sector A -> B -> C -> D -> E, Table 1 -> 10, Seat 1 -> 10)
export async function autoAssignSeats(quantity: number): Promise<SeatSelection[]> {
  const tables = await getTablesState();
  const selected: SeatSelection[] = [];

  const sortedTables = [...tables].sort((a, b) => {
    if (a.sector !== b.sector) {
      return a.sector.localeCompare(b.sector);
    }
    return a.number - b.number;
  });

  for (const table of sortedTables) {
    const sortedSeats = [...table.seats].sort((a, b) => a.number - b.number);
    for (const seat of sortedSeats) {
      if (!seat.isOccupied && !seat.isPending) {
        selected.push({
          tableId: table.id,
          seatNumber: seat.number,
          sector: table.sector
        });

        if (selected.length === quantity) {
          return selected;
        }
      }
    }
  }

  return selected;
}

export async function createOrder(data: {
  buyerName: string;
  buyerEmail?: string;
  buyerPhone: string;
  buyerDocId?: string;
  quantity: number;
  seats?: SeatSelection[];
  attendees?: Array<{ name: string; docId?: string; isChild?: boolean; tableId?: string; seatNumber?: number }>;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentProofUrl?: string;
  amountPaid: number;
  currency: Currency;
  convertedUsd: number;
  rateApplied?: number;
  salesChannel?: SalesChannel;
  sellerName?: string;
  parishName?: string;
  status?: OrderStatus;
  notes?: string;
}): Promise<Order> {
  const id = generateOrderId();

  let assignedSeats = data.seats || [];
  if (!assignedSeats || assignedSeats.length === 0) {
    assignedSeats = await autoAssignSeats(data.quantity);
  }

  const salesChannel = data.salesChannel || 'online';
  const isAutoApproved = salesChannel === 'seminarista_parroquia' || 
    data.paymentMethod === 'paypal' || 
    (data.paymentMethod === 'cash' && !data.paymentProofUrl);
  const status: OrderStatus = data.status || (isAutoApproved ? 'approved' : 'pending');

  const attendees = data.attendees && data.attendees.length > 0 
    ? data.attendees 
    : assignedSeats.map((s, idx) => ({
        name: `${data.buyerName}${idx > 0 ? ` (Acompañante ${idx + 1})` : ''}`,
        tableId: s.tableId,
        seatNumber: s.seatNumber
      }));

  let tickets: Ticket[] = [];
  if (status === 'approved') {
    tickets = await generateTicketsForSeats(
      id,
      assignedSeats,
      attendees,
      data.buyerName,
      data.buyerPhone
    );
  }

  const newOrder: Order = {
    id,
    createdAt: new Date().toISOString(),
    buyerName: data.buyerName,
    buyerEmail: data.buyerEmail || '',
    buyerPhone: data.buyerPhone,
    buyerDocId: data.buyerDocId || '',
    quantity: data.quantity,
    seats: assignedSeats,
    attendees,
    paymentMethod: data.paymentMethod,
    paymentReference: data.paymentReference || 'N/A',
    paymentProofUrl: data.paymentProofUrl,
    amountPaid: data.amountPaid,
    currency: data.currency,
    convertedUsd: data.convertedUsd,
    rateApplied: data.rateApplied,
    status,
    salesChannel,
    sellerName: data.sellerName,
    parishName: data.parishName,
    notes: data.notes,
    tickets
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const row = mapOrderToDbRow(newOrder);
      const { error } = await supabase.from('orders').insert(row);
      if (error) console.error('Error insertando orden en Supabase:', error);
    } catch (e) {
      console.error('Error guardando en Supabase:', e);
    }
  }

  // Also persist in local fallback
  try {
    const db = await readDb();
    db.orders.unshift(newOrder);
    writeDb(db);
  } catch (e) {}

  return newOrder;
}

export async function generateTicketsForSeats(
  orderId: string,
  seats: SeatSelection[],
  attendees: Array<{ name: string; docId?: string; tableId?: string; seatNumber?: number }>,
  buyerName: string,
  buyerPhone: string
): Promise<Ticket[]> {
  const tickets: Ticket[] = [];

  for (let i = 0; i < seats.length; i++) {
    const seat = seats[i];
    const attendee = attendees[i] || { name: `${buyerName} (Asistente ${i + 1})` };
    const ticketCode = generateTicketCodeWithSeat(seat.tableId, seat.seatNumber);
    const qrCodeDataUrl = await generateQrDataUrl(ticketCode);

    tickets.push({
      id: `${orderId}-T${i + 1}`,
      orderId,
      ticketCode,
      tableId: seat.tableId,
      seatNumber: seat.seatNumber,
      sector: seat.sector,
      attendeeName: attendee.name,
      buyerName,
      buyerPhone,
      ticketNumber: i + 1,
      qrCodeDataUrl,
      isUsed: false,
      mealServed: false
    });
  }

  return tickets;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  options?: { rejectionReason?: string; verifiedBy?: string; notes?: string }
): Promise<Order | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;

  order.status = status;
  order.verifiedAt = new Date().toISOString();
  order.verifiedBy = options?.verifiedBy || 'Anabella (Admin)';
  if (options?.rejectionReason) order.rejectionReason = options.rejectionReason;
  if (options?.notes) order.notes = options.notes;

  if (status === 'approved' && (!order.tickets || order.tickets.length === 0)) {
    order.tickets = await generateTicketsForSeats(
      order.id,
      order.seats,
      order.attendees,
      order.buyerName,
      order.buyerPhone
    );
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const row = mapOrderToDbRow(order);
      await supabase.from('orders').upsert(row);
    } catch (e) {
      console.error('Error actualizando status en Supabase:', e);
    }
  }

  try {
    const db = await readDb();
    const idx = db.orders.findIndex(o => o.id.toUpperCase() === orderId.toUpperCase());
    if (idx !== -1) {
      db.orders[idx] = order;
      writeDb(db);
    }
  } catch (e) {}

  return order;
}

export async function scanTicket(ticketCode: string, scannedBy: string = 'Personal de Puerta'): Promise<ScanResult> {
  const cleanCode = ticketCode.trim().toUpperCase();
  const allOrders = await getAllOrders();

  for (const order of allOrders) {
    const ticketIndex = order.tickets?.findIndex(t => t.ticketCode.toUpperCase() === cleanCode);

    if (ticketIndex !== undefined && ticketIndex !== -1) {
      const ticket = order.tickets[ticketIndex];

      if (order.status !== 'approved') {
        return {
          success: false,
          status: 'pending_payment',
          message: `La orden ${order.id} está pendiente de pago o verificación.`,
          ticket,
          order: {
            id: order.id,
            buyerName: order.buyerName,
            buyerPhone: order.buyerPhone,
            status: order.status
          }
        };
      }

      if (ticket.isUsed) {
        return {
          success: false,
          status: 'already_used',
          message: `¡ALERTA! Esta entrada ya fue utilizada el ${ticket.scannedAt ? new Date(ticket.scannedAt).toLocaleTimeString('es-VE') : 'más temprano'}.`,
          ticket,
          order: {
            id: order.id,
            buyerName: order.buyerName,
            buyerPhone: order.buyerPhone,
            status: order.status
          }
        };
      }

      const now = new Date().toISOString();
      ticket.isUsed = true;
      ticket.scannedAt = now;
      ticket.scannedBy = scannedBy;
      ticket.mealServed = true;
      ticket.mealServedAt = now;

      order.tickets[ticketIndex] = ticket;

      // Update in Supabase
      if (isSupabaseConfigured && supabase) {
        try {
          const row = mapOrderToDbRow(order);
          const { error: sbError } = await supabase.from('orders').upsert(row);
          if (sbError) {
            console.error('Error al guardar escaneo en Supabase:', sbError);
          }
        } catch (e) {
          console.error('Excepción al guardar escaneo en Supabase:', e);
        }
      }

      // Update local db
      try {
        const db = await readDb();
        const oIdx = db.orders.findIndex(o => o.id === order.id);
        if (oIdx !== -1) {
          db.orders[oIdx] = order;
          writeDb(db);
        }
      } catch (e) {}

      return {
        success: true,
        status: 'valid',
        message: `¡ENTRADA VÁLIDA! Bienvenido(a) ${ticket.attendeeName}. Ubicación: Mesa ${ticket.tableId}, Silla ${ticket.seatNumber}. 1 Plato navideño habilitado.`,
        ticket,
        order: {
          id: order.id,
          buyerName: order.buyerName,
          buyerPhone: order.buyerPhone,
          status: order.status
        }
      };
    }
  }

  return {
    success: false,
    status: 'not_found',
    message: 'Código QR no reconocido en el sistema del Seminario.'
  };
}

export async function getEventStats(): Promise<EventStats> {
  const config = await getEventConfig();
  const orders = await getAllOrders();

  let totalSoldTickets = 0;
  let confirmedTickets = 0;
  let pendingTickets = 0;
  let totalRevenueUsd = 0;
  let scannedCount = 0;
  let mealsServedCount = 0;

  const salesByChannel = {
    online: { count: 0, revenueUsd: 0 },
    seminaristas: { count: 0, revenueUsd: 0 },
    taquilla: { count: 0, revenueUsd: 0 }
  };

  const revenueByMethod = {
    pago_movil: { totalVes: 0, totalUsd: 0, count: 0 },
    zelle: { totalUsd: 0, count: 0 },
    binance: { totalUsdt: 0, count: 0 },
    cash: { totalUsd: 0, count: 0 }
  };

  let pendingOrdersCount = 0;
  let approvedOrdersCount = 0;
  let rejectedOrdersCount = 0;

  for (const order of orders) {
    if (order.status === 'approved') {
      approvedOrdersCount++;
      confirmedTickets += order.quantity;
      totalSoldTickets += order.quantity;
      totalRevenueUsd += order.convertedUsd || 0;

      const ch = order.salesChannel || 'online';
      if (ch === 'seminarista_parroquia') {
        salesByChannel.seminaristas.count += order.quantity;
        salesByChannel.seminaristas.revenueUsd += order.convertedUsd || 0;
      } else if (ch === 'taquilla') {
        salesByChannel.taquilla.count += order.quantity;
        salesByChannel.taquilla.revenueUsd += order.convertedUsd || 0;
      } else {
        salesByChannel.online.count += order.quantity;
        salesByChannel.online.revenueUsd += order.convertedUsd || 0;
      }

      if (order.paymentMethod === 'pago_movil') {
        revenueByMethod.pago_movil.totalVes += order.amountPaid || 0;
        revenueByMethod.pago_movil.totalUsd += order.convertedUsd || 0;
        revenueByMethod.pago_movil.count++;
      } else if (order.paymentMethod === 'zelle') {
        revenueByMethod.zelle.totalUsd += order.amountPaid || 0;
        revenueByMethod.zelle.count++;
      } else if (order.paymentMethod === 'binance') {
        revenueByMethod.binance.totalUsdt += order.amountPaid || 0;
        revenueByMethod.binance.count++;
      } else if (order.paymentMethod === 'cash') {
        revenueByMethod.cash.totalUsd += order.amountPaid || 0;
        revenueByMethod.cash.count++;
      }

      for (const ticket of order.tickets || []) {
        if (ticket.isUsed) scannedCount++;
        if (ticket.mealServed) mealsServedCount++;
      }
    } else if (order.status === 'pending') {
      pendingOrdersCount++;
      pendingTickets += order.quantity;
      totalSoldTickets += order.quantity;
    } else if (order.status === 'rejected') {
      rejectedOrdersCount++;
    }
  }

  const availableTickets = Math.max(0, (config.totalQuota || 500) - confirmedTickets - pendingTickets);

  return {
    totalQuota: config.totalQuota || 500,
    totalSoldTickets,
    confirmedTickets,
    pendingTickets,
    availableTickets,
    totalOrders: orders.length,
    pendingOrdersCount,
    approvedOrdersCount,
    rejectedOrdersCount,
    totalRevenueUsd,
    salesByChannel,
    revenueByMethod,
    attendance: {
      scannedCount,
      pendingScanCount: confirmedTickets - scannedCount,
      mealsServedCount
    }
  };
}
