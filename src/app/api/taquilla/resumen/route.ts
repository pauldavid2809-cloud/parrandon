import { route, ok } from '@/lib/api';
import { resumenTaquilla } from '@/lib/entradas/service';

export const GET = route(async () => ok(await resumenTaquilla()), ['taquilla']);
