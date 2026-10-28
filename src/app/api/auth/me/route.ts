import { route, ok } from '@/lib/api';
import { getRoles } from '@/lib/auth';

export const GET = route(async () => ok({ roles: await getRoles() }));
