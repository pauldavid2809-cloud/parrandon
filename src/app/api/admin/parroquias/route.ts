import { route, ok, fail, readJson } from '@/lib/api';
import { store } from '@/lib/entradas/store';

export const GET = route(async () => ok({ parroquias: await store().listParroquias() }), ['admin']);

function slug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export const POST = route(async (req) => {
  const body = await readJson(req);
  const name = String(body.name ?? '').trim().slice(0, 120);
  if (name.length < 3) return fail('Escribe el nombre de la parroquia.');
  const existing = await store().listParroquias();
  const id = typeof body.id === 'string' && body.id ? body.id : slug(name) || `parroquia-${Date.now()}`;
  const current = existing.find((p) => p.id === id);
  if (!body.id && current) return fail('Ya existe una parroquia con ese nombre.');
  await store().upsertParroquia({
    id,
    name,
    contact: String(body.contact ?? '').trim().slice(0, 120) || null,
    createdAt: current?.createdAt || new Date().toISOString(),
  });
  if (current && current.name !== name) {
    const entradas = await store().listEntradas();
    const codes = entradas.filter((e) => e.holderType === 'parroquia' && e.holderId === id).map((e) => e.code);
    await store().updateEntradas(codes, { holderName: name });
  }
  return ok({ parroquias: await store().listParroquias() });
}, ['admin']);

export const DELETE = route(async (req) => {
  const id = req.nextUrl.searchParams.get('id') || '';
  const entradas = await store().listEntradas();
  const assigned = entradas.filter((e) => e.holderType === 'parroquia' && e.holderId === id).length;
  if (assigned) return fail(`Esta parroquia tiene ${assigned} entradas asignadas. Reasígnalas antes de eliminarla.`);
  await store().deleteParroquia(id);
  return ok({ parroquias: await store().listParroquias() });
}, ['admin']);
