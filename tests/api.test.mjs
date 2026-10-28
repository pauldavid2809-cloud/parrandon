// Pruebas de la API del sistema de entradas.
// Uso: en una terminal `rm -f .data/entradas_local.json && PARRANDON_LOCAL_DB=1 npm run dev -- -p 3100`,
// y en otra `npm run test:api`. Necesita la base local recién creada (genera las 500 entradas).

const B = 'http://localhost:3100';
const results = [];
let section = '';

function sec(name) {
  section = name;
  console.log(`\n## ${name}`);
}
function check(name, cond, detail = '') {
  results.push({ section, name, ok: Boolean(cond) });
  console.log(`${cond ? '  ✓' : '  ✗'} ${name}${cond ? '' : `  → ${detail}`}`);
}

class Client {
  constructor(ip) {
    this.cookie = '';
    this.ip = ip;
  }
  async req(method, path, body, raw) {
    const headers = {};
    if (this.cookie) headers.cookie = this.cookie;
    if (this.ip) headers['x-forwarded-for'] = this.ip;
    let payload;
    if (raw) payload = raw;
    else if (body !== undefined) {
      headers['content-type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const res = await fetch(B + path, { method, headers, body: payload, redirect: 'manual' });
    const set = res.headers.get('set-cookie');
    if (set) {
      const m = set.match(/prn_session=([^;]*)/);
      if (m) this.cookie = m[1] ? `prn_session=${m[1]}` : '';
    }
    let json = null;
    try {
      json = await res.json();
    } catch {}
    return { status: res.status, json, headers: res.headers };
  }
  get(p) {
    return this.req('GET', p);
  }
  post(p, b) {
    return this.req('POST', p, b ?? {});
  }
  patch(p, b) {
    return this.req('PATCH', p, b);
  }
  del(p) {
    return this.req('DELETE', p);
  }
}

const PROOF = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const anon = new Client();
const admin = new Client();
const puerta = new Client();
const cocina = new Client();
const taquilla = new Client();

function report(code, extra = {}) {
  return anon.post(`/api/entradas/${code}/reportar`, {
    firstName: 'Ana',
    lastName: 'Pérez',
    cedula: 'V-12.345.678',
    phone: '0414-1234567',
    method: 'pago_movil',
    reference: '123456',
    proofUrl: PROOF,
    ...extra,
  });
}

(async () => {
  // ---------------------------------------------------------------- acceso
  sec('Acceso y sesiones');
  const protegidos = [
    ['GET', '/api/admin/resumen'],
    ['GET', '/api/admin/entradas'],
    ['POST', '/api/admin/entradas/generar'],
    ['GET', '/api/admin/estado'],
    ['POST', '/api/admin/lotes'],
    ['GET', '/api/admin/parroquias'],
    ['GET', '/api/admin/mesas'],
    ['GET', '/api/admin/pins'],
    ['POST', '/api/puerta/escanear'],
    ['POST', '/api/puerta/ingresar'],
    ['POST', '/api/puerta/activar'],
    ['POST', '/api/puerta/mesa'],
    ['GET', '/api/puerta/resumen'],
    ['GET', '/api/cocina'],
    ['POST', '/api/cocina/despachar'],
    ['POST', '/api/cocina/deshacer'],
    ['POST', '/api/taquilla/buscar'],
    ['POST', '/api/taquilla/vender'],
    ['GET', '/api/taquilla/resumen'],
    ['GET', '/api/orders'],
    ['POST', '/api/orders/ORD-1/status'],
    ['POST', '/api/config'],
    ['GET', '/api/whatsapp/status'],
    ['POST', '/api/whatsapp/send'],
    ['POST', '/api/whatsapp/disconnect'],
  ];
  let todos401 = true;
  for (const [m, p] of protegidos) {
    const r = await anon.req(m, p, m === 'GET' ? undefined : {});
    if (r.status !== 401) {
      todos401 = false;
      console.log(`     ${m} ${p} → ${r.status}`);
    }
  }
  check(`Sin sesión, las ${protegidos.length} rutas protegidas responden 401`, todos401);

  let r = await anon.post('/api/auth/login', { role: 'admin', secret: 'mala' });
  check('Contraseña de admin incorrecta → 401', r.status === 401, r.status);
  r = await anon.post('/api/auth/login', { role: 'puerta', secret: '123456' });
  check('PIN de puerta sin configurar → 409 con aviso', r.status === 409 && r.json?.reason === 'pin_no_configurado', JSON.stringify(r.json));
  r = await admin.post('/api/auth/login', { role: 'admin', secret: '#Seminario31' });
  check('Admin entra con su contraseña', r.status === 200 && admin.cookie, r.status);
  r = await admin.post('/api/admin/pins', { role: 'puerta', pin: '1234' });
  check('PIN de 4 dígitos se rechaza (mínimo 6)', r.status === 400, r.status);
  for (const [role, pin] of [['puerta', '111111'], ['cocina', '222222'], ['taquilla', '333333']]) {
    r = await admin.post('/api/admin/pins', { role, pin });
    check(`Admin define PIN de ${role}`, r.status === 200, JSON.stringify(r.json));
  }
  r = await puerta.post('/api/auth/login', { role: 'puerta', secret: '111111' });
  check('Puerta entra con su PIN', r.status === 200);
  await cocina.post('/api/auth/login', { role: 'cocina', secret: '222222' });
  await taquilla.post('/api/auth/login', { role: 'taquilla', secret: '333333' });
  r = await puerta.get('/api/cocina');
  check('La sesión de puerta NO abre cocina', r.status === 401, r.status);
  r = await puerta.get('/api/admin/resumen');
  check('La sesión de puerta NO abre administración', r.status === 401, r.status);
  r = await cocina.post('/api/puerta/escanear', { input: '1' });
  check('La sesión de cocina NO abre puerta', r.status === 401, r.status);
  const forged = new Client();
  forged.cookie = 'prn_session=' + Buffer.from(JSON.stringify({ roles: ['admin'], exp: Date.now() + 1e9 })).toString('base64url') + '.firmafalsa';
  r = await forged.get('/api/admin/resumen');
  check('Cookie falsificada (sin firma válida) → 401', r.status === 401, r.status);
  // IP propia para que el bloqueo no alcance a quien use el servidor después
  const bruto = new Client('203.0.113.7');
  let bloqueado = false;
  for (let i = 0; i < 10; i++) {
    const x = await bruto.req('POST', '/api/auth/login', { role: 'cocina', secret: String(100000 + i) });
    if (x.status === 429) bloqueado = true;
  }
  check('Tras varios PIN errados desde la misma IP → 429', bloqueado);
  r = await new Client('203.0.113.7').post('/api/auth/login', { role: 'admin', secret: '#Seminario31' });
  check('…pero eso no bloquea a otra área (admin sigue entrando)', r.status === 200, r.status);

  // ---------------------------------------------------------------- generación
  sec('Generación de entradas');
  r = await admin.get('/api/admin/estado');
  check('Estado: base lista, 0 entradas, PINs definidos', r.json?.storeReady && r.json?.generadas === 0 && r.json?.pins?.puerta, JSON.stringify(r.json));
  r = await admin.post('/api/admin/entradas/generar');
  check('Genera 500 entradas', r.json?.count === 500, JSON.stringify(r.json));
  r = await admin.post('/api/admin/entradas/generar');
  check('No se pueden generar dos veces (409)', r.status === 409, r.status);
  r = await admin.get('/api/admin/entradas');
  const E = r.json.entradas;
  const byNum = (n) => E.find((e) => e.number === n);
  check('Números 1..500 sin repetir', new Set(E.map((e) => e.number)).size === 500 && Math.min(...E.map((e) => e.number)) === 1 && Math.max(...E.map((e) => e.number)) === 500);
  check('Códigos únicos con formato P001-XXXXXXXX', new Set(E.map((e) => e.code)).size === 500 && E.every((e) => /^P\d{3}-[2-9A-HJ-NP-Z]{8}$/.test(e.code)));
  const sems = {};
  E.filter((e) => e.holderType === 'seminarista').forEach((e) => (sems[e.holderId] = (sems[e.holderId] || 0) + 1));
  check('39 seminaristas con 6 entradas cada uno (#001–#234)', Object.keys(sems).length === 39 && Object.values(sems).every((v) => v === 6) && byNum(234).holderType === 'seminarista' && byNum(235).holderType === 'sin_asignar');
  check('#001–#006 son del primer seminarista del directorio', [1, 2, 3, 4, 5, 6].every((n) => byNum(n).holderId === 't4-1') && byNum(7).holderId === 't4-2');

  // ---------------------------------------------------------------- vista pública
  sec('Vista pública de una entrada');
  const c = (n) => byNum(n).code;
  r = await anon.get(`/api/entradas/${c(10)}`);
  check('Ver entrada por su código', r.status === 200 && r.json.entrada.number === 10);
  check('La vista pública no trae datos internos (notas, verificador, capture)', !('notes' in r.json.entrada) && !('verifiedBy' in r.json.entrada) && !('paymentProofUrl' in r.json.entrada));
  r = await anon.get(`/api/entradas/${c(10).toLowerCase()}`);
  check('Código en minúsculas también funciona', r.status === 200);
  r = await anon.get('/api/entradas/P010-AAAAAAAA');
  check('Código inventado → 404', r.status === 404);
  r = await anon.get('/api/entradas/10');
  check('Número solo (sin secreto) no abre la entrada → 404', r.status === 404);
  r = await anon.get('/api/mesas');
  check('Croquis público: 50 mesas, 500 puestos libres', r.json.mesas.length === 50 && r.json.resumen.puestosLibres === 500);
  check('El croquis público no expone nombres de mesa ni de personas', r.json.mesas.every((m) => m.label === null && !('gente' in m)));

  // ---------------------------------------------------------------- reporte del comprador
  sec('Reporte de pago del comprador');
  r = await report(c(10), { firstName: 'A' });
  check('Nombre muy corto → 400', r.status === 400 && /nombre/i.test(r.json.error));
  r = await report(c(10), { lastName: '' });
  check('Sin apellido → 400', r.status === 400 && /apellido/i.test(r.json.error), r.json?.error);
  r = await report(c(10), { cedula: '' });
  check('Sin cédula → 400', r.status === 400 && /cédula/i.test(r.json.error), r.json?.error);
  r = await report(c(10), { cedula: 'V-' });
  check('Solo la letra de la cédula → 400', r.status === 400 && /cédula/i.test(r.json.error));
  r = await report(c(10), { cedula: '04141234567' });
  check('Un teléfono en el campo de cédula → 400', r.status === 400 && /cédula/i.test(r.json.error));
  r = await report(c(10), { cedula: 'V-12' });
  check('Cédula muy corta → 400', r.status === 400 && /cédula/i.test(r.json.error));
  r = await report(c(10), { phone: '123' });
  check('Teléfono inválido → 400', r.status === 400 && /teléfono/i.test(r.json.error));
  r = await report(c(10), { method: 'efectivo_usd' });
  check('Efectivo no se acepta por la web → 400', r.status === 400);
  r = await report(c(10), { reference: '12' });
  check('Referencia corta → 400', r.status === 400);
  r = await report(c(10), { proofUrl: '' });
  check('Sin capture → 400', r.status === 400 && /capture/i.test(r.json.error));
  r = await report(c(10), { proofUrl: 'javascript:alert(1)' });
  check('Capture con URL peligrosa → 400', r.status === 400, JSON.stringify(r.json));
  r = await report(c(10), { proofUrl: 'https://evil.example.com/x.png' });
  check('Capture de otro sitio → 400', r.status === 400);
  r = await report(c(10), { tableId: 'A1', firstName: '  Ana  María ', lastName: 'Pérez  de León', cedula: 'v 12.345.678' });
  check('Reporte válido con mesa A1 → por verificar y mesa apartada', r.status === 200 && r.json.entrada.status === 'por_verificar' && r.json.entrada.tableId === 'A1', JSON.stringify(r.json));
  check('…quien tiene el QR ve su cédula a medias', r.json.entrada.attendeeCedula === 'V-••.•••.678', r.json.entrada.attendeeCedula);
  check('…nombre y apellido limpios y el nombre completo armado', r.json.entrada.attendeeFirstName === 'Ana María' && r.json.entrada.attendeeLastName === 'Pérez de León' && r.json.entrada.attendeeName === 'Ana María Pérez de León', JSON.stringify(r.json.entrada));
  r = await anon.get(`/api/entradas/${c(10)}`);
  check('La página pública de la entrada nunca trae la cédula completa', !JSON.stringify(r.json).includes('12345678') && !JSON.stringify(r.json).includes('12.345'));
  r = await admin.get(`/api/admin/entradas/${c(10)}`);
  check('Administración ve la cédula completa y normalizada', r.json?.entrada?.attendeeCedula === 'V-12345678', r.json?.entrada?.attendeeCedula);
  r = await report(c(15), { cedula: 'E-84.123.456' });
  check('Cédula de extranjero (E) se acepta', r.status === 200);
  r = await report(c(16), { cedula: 'P-ab 123456' });
  r = await admin.get(`/api/admin/entradas/${c(16)}`);
  check('Pasaporte (P) se acepta con letras', r.json?.entrada?.attendeeCedula === 'P-AB123456', r.json?.entrada?.attendeeCedula);
  r = await report(c(17), { cedula: '9876543' });
  r = await admin.get(`/api/admin/entradas/${c(17)}`);
  check('Solo números → se asume V', r.json?.entrada?.attendeeCedula === 'V-9876543', r.json?.entrada?.attendeeCedula);
  r = await report(c(10));
  check('Segundo reporte de la misma entrada → 409', r.status === 409 && r.json.reason === 'ya_reportada');
  const dobles = await Promise.all([report(c(11)), report(c(11)), report(c(11))]);
  check('Tres reportes simultáneos de la misma entrada: solo uno pasa', dobles.filter((x) => x.status === 200).length === 1, dobles.map((x) => x.status).join(','));
  r = await anon.post(`/api/entradas/${c(11)}/mesa`, { tableId: 'A1' });
  check('Escoger mesa después de reportar', r.status === 200 && r.json.entrada.tableId === 'A1');
  r = await anon.post(`/api/entradas/${c(12)}/mesa`, { tableId: 'A1' });
  check('Sin reportar pago no se puede apartar mesa', r.status === 409, JSON.stringify(r.json));
  r = await report(c(13), { tableId: 'Z9' });
  check('Mesa inexistente: el pago queda reportado y avisa de la mesa', r.status === 200 && r.json.entrada.status === 'por_verificar' && !r.json.entrada.tableId && r.json.mesaError);

  // ---------------------------------------------------------------- capacidad
  sec('Capacidad de las mesas');
  for (let n = 20; n <= 31; n++) await report(c(n));
  const claims = await Promise.all(Array.from({ length: 12 }, (_, i) => anon.post(`/api/entradas/${c(20 + i)}/mesa`, { tableId: 'B2' })));
  const okB2 = claims.filter((x) => x.status === 200).length;
  check('12 entradas pidiendo la mesa B2 a la vez: entran 10', okB2 === 10, `${okB2} entraron`);
  r = await anon.get('/api/mesas');
  const B2 = r.json.mesas.find((m) => m.id === 'B2');
  check('B2 aparece llena (10/10) y cuenta en "mesas llenas"', B2.isFull && B2.taken === 10 && r.json.resumen.mesasLlenas === 1);
  const sinMesa = claims.findIndex((x) => x.status !== 200);
  r = await anon.post(`/api/entradas/${c(20 + sinMesa)}/mesa`, { tableId: 'B2' });
  check('Mesa llena → mensaje "se acaba de llenar"', r.status === 409 && /llen/i.test(r.json.error));
  const enB2 = claims.findIndex((x) => x.status === 200);
  r = await anon.post(`/api/entradas/${c(20 + enB2)}/mesa`, { tableId: 'B3' });
  check('Cambiar de B2 a B3 libera un puesto en B2', r.status === 200);
  r = await anon.get('/api/mesas');
  check('B2 queda con 9 y B3 con 1', r.json.mesas.find((m) => m.id === 'B2').taken === 9 && r.json.mesas.find((m) => m.id === 'B3').taken === 1);
  await admin.patch('/api/admin/mesas', { id: 'C1', blocked: true, label: 'Familia del Padre Jorge' });
  r = await anon.post(`/api/entradas/${c(20 + sinMesa)}/mesa`, { tableId: 'C1' });
  check('Mesa reservada por la organización → no se puede escoger', r.status === 409 && /reservada/i.test(r.json.error));
  r = await anon.get('/api/mesas');
  check('La mesa reservada sale con 0 libres y sin su nombre interno', r.json.mesas.find((m) => m.id === 'C1').free === 0 && r.json.mesas.find((m) => m.id === 'C1').label === null);
  r = await admin.patch(`/api/admin/entradas/${c(20 + sinMesa)}`, { action: 'mesa', tableId: 'C1', force: true });
  check('Administración sí puede sentar en una mesa reservada (forzar)', r.status === 200 && r.json.entrada.tableId === 'C1');

  // ---------------------------------------------------------------- verificación
  sec('Verificación de pagos');
  r = await admin.patch(`/api/admin/entradas/${c(10)}`, { action: 'aprobar' });
  check('Aprobar → activa', r.json?.entrada?.status === 'activa' && r.json.entrada.verifiedBy);
  r = await admin.patch(`/api/admin/entradas/${c(10)}`, { action: 'aprobar' });
  check('Aprobar dos veces → error', r.status === 400 || r.status === 409);
  r = await admin.patch(`/api/admin/entradas/${c(11)}`, { action: 'rechazar', reason: 'No aparece el pago en la cuenta.' });
  check('Rechazar → sin vender, mesa liberada, motivo guardado', r.json?.entrada?.status === 'sin_vender' && !r.json.entrada.tableId && r.json.entrada.rejectionReason);
  r = await anon.get(`/api/entradas/${c(11)}`);
  check('El comprador ve el motivo del rechazo', r.json.entrada.rejectionReason === 'No aparece el pago en la cuenta.');
  r = await report(c(11), { tableId: 'A2' });
  check('Puede reportar de nuevo tras el rechazo', r.status === 200 && r.json.entrada.status === 'por_verificar');
  r = await anon.get(`/api/entradas/${c(11)}`);
  check('El motivo anterior se borra al reportar otra vez', !r.json.entrada.rejectionReason);

  // ---------------------------------------------------------------- puerta
  sec('Puerta');
  r = await puerta.post('/api/puerta/escanear', { input: `https://parrandon-seven.vercel.app/e/${c(10)}` });
  check('Escanear enlace del QR de entrada activa → "adelante" con mesa', r.json.state === 'adelante' && r.json.entrada.tableId === 'A1', JSON.stringify(r.json).slice(0, 120));
  r = await puerta.post('/api/puerta/escanear', { input: c(10) });
  check('Segundo escaneo → "ya ingresó"', r.json.state === 'ya_ingreso');
  r = await puerta.post('/api/puerta/escanear', { input: '#11' });
  check('Por número (QR dañado), pago por verificar → pide confirmación', r.json.state === 'por_verificar');
  r = await puerta.post('/api/puerta/ingresar', { code: c(11) });
  check('Dejar pasar con pago por verificar', r.json.state === 'adelante');
  const doble = await Promise.all([puerta.post('/api/puerta/escanear', { input: c(21) }), puerta.post('/api/puerta/escanear', { input: c(21) })]);
  check('Dos puertas escanean la misma entrada a la vez: no entra dos veces', doble.filter((x) => x.json?.state === 'adelante').length <= 1, doble.map((x) => x.json?.state).join(','));
  r = await puerta.post('/api/puerta/escanear', { input: c(13) });
  check('Pagada pero sin mesa → "sin mesa"', r.json.state === 'sin_mesa');
  r = await puerta.post('/api/puerta/mesa', { code: c(13), tableId: 'B2' });
  check('Sentarle en B2 (le quedaba 1 puesto) y entra', r.json?.state === 'adelante' && r.json.entrada.tableId === 'B2', JSON.stringify(r.json));
  r = await puerta.post('/api/puerta/escanear', { input: c(40) });
  check('Entrada sin vender → "sin activar" con su lote', r.json.state === 'sin_activar' && r.json.entrada.holderName);
  r = await puerta.post('/api/puerta/activar', { code: c(40), firstName: 'Luis', lastName: 'Gómez', method: 'efectivo_usd', tableId: 'B4' });
  check('Activar en puerta sin cédula → 400', r.status === 400 && /cédula/i.test(r.json.error), r.json?.error);
  r = await puerta.post('/api/puerta/activar', { code: c(40), firstName: 'Luis', lastName: 'Gómez', cedula: 'V-20111222', method: 'efectivo_usd', tableId: 'B2', soldBy: 'Seminarista X' });
  check('Activar en puerta en mesa llena → error claro', r.status === 409 && /llen/i.test(r.json.error));
  r = await puerta.post('/api/puerta/activar', { code: c(40), firstName: 'Luis', lastName: 'Gómez', cedula: 'V-20111222', method: 'efectivo_usd', tableId: 'B4', soldBy: 'Seminarista X' });
  check('Reintentar con otra mesa → entra, queda marcada "activada en puerta"', r.json?.state === 'adelante' && r.json.entrada.doorActivated && r.json.entrada.status === 'por_verificar', JSON.stringify(r.json));
  check('…la puerta ve el nombre completo y la cédula', r.json?.entrada?.attendeeName === 'Luis Gómez' && r.json.entrada.attendeeCedula === 'V-20111222');
  r = await puerta.post('/api/puerta/escanear', { input: 'P999-ZZZZZZZZ' });
  check('Código que no existe → "no existe"', r.json.state === 'no_existe');
  r = await puerta.post('/api/puerta/escanear', { input: 'https://google.com' });
  check('QR ajeno → "no existe"', r.json.state === 'no_existe');
  await admin.patch(`/api/admin/entradas/${c(41)}`, { action: 'anular', reason: 'Entrada perdida' });
  r = await puerta.post('/api/puerta/escanear', { input: c(41) });
  check('Entrada anulada → "anulada"', r.json.state === 'anulada');
  r = await puerta.get('/api/puerta/resumen');
  check('Resumen de puerta cuenta los que entraron', r.json.ingresaron >= 4 && r.json.recientes.length >= 4, JSON.stringify(r.json).slice(0, 100));

  // ---------------------------------------------------------------- cocina
  sec('Cocina');
  r = await cocina.get('/api/cocina');
  const mA1 = r.json.mesas.find((m) => m.id === 'A1');
  check('Cocina ve llegadas en vivo y platos por servir por mesa', r.json.llegadas.length >= 4 && mA1.llegaron === 1 && mA1.porServir === 1, JSON.stringify(mA1));
  r = await cocina.post('/api/cocina/despachar', { tableId: 'A1' });
  check('Despachar A1 sirve el plato de quien llegó', r.json.count === 1);
  const deshacer = r.json.codes;
  r = await cocina.post('/api/cocina/despachar', { tableId: 'A1' });
  check('Despachar de nuevo sin llegadas nuevas → aviso', r.status === 400);
  r = await cocina.post('/api/cocina/deshacer', { codes: deshacer });
  r = await cocina.get('/api/cocina');
  check('Deshacer devuelve el plato a pendientes', r.json.mesas.find((m) => m.id === 'A1').porServir === 1);
  await cocina.post('/api/cocina/despachar', { tableId: 'A1' });
  await report(c(14), { tableId: 'A1' });
  await puerta.post('/api/puerta/ingresar', { code: c(14) });
  await cocina.post('/api/cocina/despachar', { tableId: 'A1' });
  r = await cocina.get('/api/cocina');
  const a1 = r.json.mesas.find((m) => m.id === 'A1');
  check('Despacho parcial: llegó otro a A1 después y se sirvió aparte', a1.servidos === 2 && a1.porServir === 0, JSON.stringify(a1));

  // ---------------------------------------------------------------- taquilla
  sec('Taquilla');
  r = await admin.post('/api/admin/lotes', { from: 481, to: 500, type: 'taquilla' });
  check('Asignar #481–#500 a taquilla', r.json?.count === 20);
  r = await taquilla.post('/api/taquilla/buscar', { input: '481' });
  check('Buscar por número', r.json?.entrada?.number === 481 && r.json.entrada.holderType === 'taquilla');
  r = await taquilla.post('/api/taquilla/vender', { code: c(481), firstName: 'Carmen', lastName: 'Soto', cedula: 'V-15222333', method: 'zelle', tableId: 'D1' });
  check('Zelle sin referencia → 400', r.status === 400);
  r = await taquilla.post('/api/taquilla/vender', { code: c(481), firstName: 'Carmen', lastName: 'Soto', cedula: 'V-15222333', method: 'efectivo_usd', tableId: 'B2' });
  check('Mesa llena → error y la entrada vuelve a quedar sin vender', r.status === 409);
  r = await taquilla.post('/api/taquilla/buscar', { input: '481' });
  check('…sigue sin vender después del error', r.json.entrada.status === 'sin_vender' && !r.json.entrada.attendeeName);
  const ventas = await Promise.all([
    taquilla.post('/api/taquilla/vender', { code: c(482), firstName: 'Pedro', lastName: 'Uno', cedula: 'V-11111111', method: 'efectivo_usd', tableId: 'D1' }),
    taquilla.post('/api/taquilla/vender', { code: c(482), firstName: 'Pedro', lastName: 'Dos', cedula: 'V-22222222', method: 'efectivo_usd', tableId: 'D1' }),
  ]);
  check('Dos cajas venden la misma entrada a la vez: solo una venta pasa', ventas.filter((x) => x.status === 200).length === 1, ventas.map((x) => x.status).join(','));
  r = await taquilla.post('/api/taquilla/vender', { code: c(481), firstName: 'Carmen', lastName: 'Soto', cedula: 'V-15222333', method: 'pago_movil', reference: '778899', tableId: 'D1' });
  check('Venta con Pago Móvil: activa y ya ingresó', r.json?.entrada?.status === 'activa' && r.json.entrada.checkedInAt);
  r = await taquilla.get('/api/taquilla/resumen');
  check('Caja de la noche suma por método', r.json.cantidad === 2 && r.json.totales.efectivo_usd === 20 && r.json.totales.pago_movil > 0, JSON.stringify(r.json.totales));

  // ---------------------------------------------------------------- lotes y parroquias
  sec('Lotes y parroquias');
  r = await admin.post('/api/admin/parroquias', { name: 'Parroquia Santa Bárbara', contact: 'Sra. Rosa' });
  const parr = r.json?.parroquias?.[0];
  check('Crear parroquia', parr?.id === 'parroquia-santa-barbara');
  r = await admin.post('/api/admin/parroquias', { name: 'Parroquia Santa Bárbara' });
  check('No se repite la misma parroquia', r.status === 400);
  r = await admin.post('/api/admin/lotes', { from: 235, to: 260, type: 'parroquia', id: parr.id });
  check('Asignar #235–#260 a la parroquia', r.json?.count === 26);
  r = await admin.post('/api/admin/lotes', { from: 261, to: 280, type: 'padre_jorge' });
  check('Asignar #261–#280 al Padre Jorge', r.json?.count === 20);
  r = await admin.post('/api/admin/lotes', { from: 300, to: 290, type: 'padre_jorge' });
  check('Rango al revés → 400', r.status === 400);
  r = await admin.post('/api/admin/lotes', { from: 1, to: 2, type: 'parroquia', id: 'no-existe' });
  check('Parroquia inexistente → 400', r.status === 400);
  r = await anon.get(`/api/vendedores/lote?type=parroquia&id=${parr.id}`);
  check('El portal de vendedores muestra el lote sin códigos', r.json.lote.length === 26 && !JSON.stringify(r.json).includes('P235-'));
  r = await admin.del(`/api/admin/parroquias?id=${parr.id}`);
  check('No se puede borrar una parroquia con entradas', r.status === 400);
  r = await admin.post('/api/admin/parroquias', { id: parr.id, name: 'Parroquia Santa Bárbara (Casco)' });
  r = await admin.get('/api/admin/entradas');
  check('Renombrar la parroquia actualiza sus entradas', r.json.entradas.find((e) => e.number === 240).holderName === 'Parroquia Santa Bárbara (Casco)');

  // ---------------------------------------------------------------- vendedor
  sec('Vendedor registra una venta');
  r = await anon.post('/api/vendedores/reportar', {
    code: c(50),
    firstName: 'Jorge',
    lastName: 'Ruiz',
    cedula: 'V-18765432',
    phone: '0412-5550000',
    method: 'zelle',
    reference: 'ZL998877',
    proofUrl: PROOF,
    sellerName: 'Otro Seminarista',
  });
  check('Venta del vendedor queda por verificar', r.json?.entrada?.status === 'por_verificar' && r.json.entrada.reportedBy === 'vendedor');
  r = await anon.post('/api/vendedores/reportar', { code: c(51), firstName: 'Jorge', lastName: 'Ruiz', phone: '0412-5550000', method: 'zelle', reference: 'ZL998878', proofUrl: PROOF });
  check('El vendedor también tiene que poner la cédula', r.status === 400 && /cédula/i.test(r.json.error));
  r = await anon.post('/api/vendedores/reportar', { code: 'P050', firstName: 'x' });
  check('Sin el código completo (secreto) no se puede registrar', r.status === 400);

  // ---------------------------------------------------------------- fecha del evento
  sec('Cambio de mesa y fecha del evento');
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas' }).format(new Date());
  r = await admin.post('/api/config', { eventDateIso: hoy });
  check('Configurar el día del evento (hoy)', r.json?.config?.eventDateIso === hoy, JSON.stringify(r.json).slice(0, 120));
  r = await anon.get(`/api/entradas/${c(22)}`);
  check('El día del evento no se puede cambiar de mesa', r.json.rules.canChangeTable === false && r.json.rules.isEventDay === true);
  const conMesa = r.json.entrada.tableId ? 22 : 21;
  r = await anon.post(`/api/entradas/${c(conMesa)}/mesa`, { tableId: 'E5' });
  check('…intento de cambio rechazado', r.status === 400 && /cerraron|ingresó/.test(r.json.error), JSON.stringify(r.json));
  await report(c(60));
  r = await anon.post(`/api/entradas/${c(60)}/mesa`, { tableId: 'E5' });
  check('…pero quien no tenía mesa sí puede escoger una', r.status === 200);
  await admin.post('/api/config', { eventDateIso: '2026-12-11' });

  // ---------------------------------------------------------------- donaciones y archivos
  sec('Donaciones, órdenes y archivos');
  r = await anon.post('/api/orders', { buyerName: 'X', buyerPhone: '1', quantity: 2, paymentMethod: 'cash', amountPaid: 40, currency: 'USD', convertedUsd: 40 });
  check('Ya no se pueden comprar entradas online por la API', r.status === 400);
  r = await anon.post('/api/orders', { isDonation: true, buyerName: 'Rosa Díaz', buyerPhone: '04145550000', paymentMethod: 'zelle', paymentReference: 'Z1', paymentProofUrl: PROOF, amountPaid: 25, currency: 'USD', convertedUsd: 25, status: 'approved' });
  check('Donación pública queda pendiente aunque pidan "approved"', r.status === 201 && r.json.order.status === 'pending');
  const ordId = r.json.order.id;
  r = await anon.get(`/api/orders/${ordId}`);
  check('El comprobante público no muestra teléfono ni capture', r.json.order.buyerName === 'Rosa' && !('buyerPhone' in r.json.order) && !('paymentProofUrl' in r.json.order));
  r = await admin.get(`/api/orders/${ordId}`);
  check('Administración sí ve la donación completa', r.json.order.buyerPhone === '04145550000');
  const fd = new FormData();
  fd.append('file', new Blob(['<script>alert(1)</script>'], { type: 'text/html' }), 'x.html');
  r = await anon.req('POST', '/api/upload-proof', undefined, fd);
  check('Subir un archivo que no es imagen → 400', r.status === 400);
  const fd2 = new FormData();
  fd2.append('file', new Blob([Buffer.from(PROOF.split(',')[1], 'base64')], { type: 'image/png' }), 'c.png');
  r = await anon.req('POST', '/api/upload-proof', undefined, fd2);
  check('Subir una imagen funciona', r.json?.success && r.json.url.startsWith('data:image/png'));

  // ---------------------------------------------------------------- admin varias
  sec('Acciones de administración');
  r = await admin.patch(`/api/admin/entradas/${c(70)}`, { action: 'marcar_pagada', firstName: 'Teresa', lastName: 'Paz', method: 'efectivo_usd' });
  check('Registrar pago recibido → activa (administración puede omitir la cédula)', r.json?.entrada?.status === 'activa' && r.json.entrada.attendeeName === 'Teresa Paz' && !r.json.entrada.attendeeCedula, JSON.stringify(r.json));
  r = await admin.patch(`/api/admin/entradas/${c(70)}`, { action: 'editar', notes: 'Pagó en la oficina' });
  check('Editar solo las notas no toca la persona', r.json?.entrada?.notes === 'Pagó en la oficina' && r.json.entrada.attendeeName === 'Teresa Paz', JSON.stringify(r.json));
  r = await admin.patch(`/api/admin/entradas/${c(70)}`, { action: 'editar', firstName: 'Teresa', lastName: 'Paz', cedula: 'V-12' });
  check('Editar con una cédula inválida → 400', r.status === 400 && /cédula/i.test(r.json.error));
  r = await admin.patch(`/api/admin/entradas/${c(70)}`, { action: 'editar', firstName: 'Teresa', lastName: 'Paz Rincón', cedula: 'V-7.654.321' });
  check('Editar nombre, apellido y cédula', r.json?.entrada?.attendeeName === 'Teresa Paz Rincón' && r.json.entrada.attendeeCedula === 'V-7654321' && r.json.entrada.notes === 'Pagó en la oficina', JSON.stringify(r.json));
  r = await admin.patch(`/api/admin/entradas/${c(70)}`, { action: 'editar', firstName: '', lastName: '', cedula: 'V-', phone: '' });
  check('No se puede dejar sin nombre una entrada vendida', r.status === 400);
  r = await admin.patch(`/api/admin/entradas/${c(70)}`, { action: 'marcar_pagada', firstName: 'Otra', lastName: 'Persona', method: 'efectivo_usd' });
  check('Registrar pago dos veces → error', r.status === 400 || r.status === 409);
  r = await admin.patch(`/api/admin/entradas/${c(10)}`, { action: 'anular' });
  check('No se puede anular una entrada que ya entró', r.status === 400);
  r = await admin.patch(`/api/admin/entradas/${c(10)}`, { action: 'deshacer_ingreso' });
  check('Deshacer ingreso', r.json?.entrada && !r.json.entrada.checkedInAt);
  r = await admin.patch(`/api/admin/entradas/${c(41)}`, { action: 'restaurar' });
  check('Restaurar entrada anulada', r.json?.entrada?.status === 'sin_vender');
  // Reiniciar: #14 está en A1, ya entró y comió (ver cocina).
  r = await anon.patch(`/api/admin/entradas/${c(14)}`, { action: 'reiniciar' });
  check('Reiniciar sin sesión de admin → 401', r.status === 401);
  r = await cocina.patch(`/api/admin/entradas/${c(14)}`, { action: 'reiniciar' });
  check('Cocina no puede reiniciar entradas', r.status === 401);
  const mesasAntes = (await anon.get('/api/mesas')).json.mesas.find((m) => m.id === 'A1').taken;
  r = await admin.patch(`/api/admin/entradas/${c(14)}`, { action: 'reiniciar' });
  const re = r.json?.entrada;
  check(
    'Reiniciar deja la entrada sin vender, sin datos, sin mesa, sin ingreso ni plato',
    re && re.status === 'sin_vender' && !re.attendeeName && !re.attendeeFirstName && !re.attendeeLastName && !re.attendeeCedula && !re.attendeePhone && !re.tableId && !re.paymentReference && !re.paymentProofUrl && !re.checkedInAt && !re.mealServedAt && !re.doorActivated && !re.reportedBy,
    JSON.stringify(re)
  );
  check('…conserva número, código y lote', re && re.number === 14 && re.code === c(14) && re.holderId === byNum(14).holderId);
  check('…y anota lo que había', re && /Reiniciada por Administración/.test(re.notes) && /Ana Pérez/.test(re.notes) && /V-12345678/.test(re.notes) && /mesa A1/.test(re.notes), re?.notes);
  const mesasDespues = (await anon.get('/api/mesas')).json.mesas.find((m) => m.id === 'A1').taken;
  check('…y libera su puesto en la mesa', mesasDespues === mesasAntes - 1, `${mesasAntes} → ${mesasDespues}`);
  r = await cocina.get('/api/cocina');
  check('…y sale de la cocina', !r.json.llegadas.some((l) => l.number === 14));
  r = await puerta.post('/api/puerta/escanear', { input: c(14) });
  check('…en la puerta aparece como "sin activar"', r.json?.state === 'sin_activar', JSON.stringify(r.json));
  r = await report(c(14), { tableId: 'A3' });
  check('Después de reiniciar se puede reportar de nuevo', r.status === 200 && r.json.entrada.tableId === 'A3');

  r = await admin.patch(`/api/admin/entradas/${c(10)}`, { action: 'inventada' });
  check('Acción desconocida → 400', r.status === 400);
  r = await admin.get('/api/admin/resumen');
  const R = r.json.resumen;
  check('Resumen consistente (vendidas = por verificar + activas)', R.vendidas === R.porVerificar + R.activas && R.generadas === 500, JSON.stringify({ v: R.vendidas, p: R.porVerificar, a: R.activas }));
  check('Resumen: mesas llenas cuadran con el croquis', R.mesas.mesasLlenas >= 1);

  // ---------------------------------------------------------------- salida
  r = await puerta.post('/api/auth/logout');
  r = await puerta.get('/api/puerta/resumen');
  check('Cerrar sesión quita el acceso', r.status === 401);

  const fallas = results.filter((x) => !x.ok);
  console.log(`\nRESULTADO: ${results.length - fallas.length}/${results.length} pruebas pasaron`);
  if (fallas.length) {
    console.log('Fallaron:');
    fallas.forEach((f) => console.log(` - [${f.section}] ${f.name}`));
    process.exitCode = 1;
  }
})();
