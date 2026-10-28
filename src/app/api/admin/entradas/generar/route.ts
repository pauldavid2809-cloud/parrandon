import { route, ok } from '@/lib/api';
import { generarEntradas } from '@/lib/entradas/service';

export const POST = route(async () => ok({ count: await generarEntradas() }), ['admin']);
