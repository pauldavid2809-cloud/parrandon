import { route, ok } from '@/lib/api';
import { cocinaEstado } from '@/lib/entradas/service';

export const GET = route(async () => ok(await cocinaEstado()), ['cocina']);
