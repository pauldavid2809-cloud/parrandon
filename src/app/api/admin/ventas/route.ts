import { route, ok } from '@/lib/api';
import { ventasAdmin } from '@/lib/entradas/ventas';

export const GET = route(async () => ok(await ventasAdmin()), ['admin']);
