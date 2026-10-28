import { route, ok } from '@/lib/api';
import { resumenAdmin } from '@/lib/entradas/service';

export const GET = route(async () => ok({ resumen: await resumenAdmin() }), ['admin']);
