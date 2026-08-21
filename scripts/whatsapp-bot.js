const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const http = require('http');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const PORT = 3001;
const AUTH_DIR = path.join(__dirname, '..', '.data', 'whatsapp_auth');

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

let sock = null;
let currentQrCodeDataUrl = null;
let currentRawQr = null;
let connectionState = 'close'; // 'close', 'connecting', 'open', 'qr'
let connectedPhone = null;

// Normalize Venezuelan phones for WhatsApp JID (e.g. 0414-1234567 -> 584141234567@s.whatsapp.net)
function formatPhoneToJid(phone) {
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '58' + cleaned.substring(1);
  } else if (!cleaned.startsWith('58') && cleaned.length === 10) {
    cleaned = '58' + cleaned;
  }
  return `${cleaned}@s.whatsapp.net`;
}

async function startWhatsAppBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  console.log(`🤖 Iniciando WhatsApp Bot v${version.join('.')}...`);

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    browser: ['Parrandón Seminario', 'Chrome', '1.0.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 10000
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentRawQr = qr;
      connectionState = 'qr';
      try {
        currentQrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
        console.log('📲 Nuevo código QR de WhatsApp generado. Escanéalo en el panel admin.');
      } catch (err) {
        console.error('Error generando QR data URL:', err);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      connectionState = 'close';
      currentQrCodeDataUrl = null;
      currentRawQr = null;
      connectedPhone = null;

      console.log(`🔌 Conexión cerrada. Código: ${statusCode}. Reconectar: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(startWhatsAppBot, 3000);
      } else {
        console.log('⚠️ Sesión cerrada por el usuario. Limpiando credenciales...');
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        fs.mkdirSync(AUTH_DIR, { recursive: true });
        setTimeout(startWhatsAppBot, 3000);
      }
    } else if (connection === 'open') {
      connectionState = 'open';
      currentQrCodeDataUrl = null;
      currentRawQr = null;
      connectedPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Conectado';
      console.log(`✅ ¡WHATSAPP OFICIAL CONECTADO EXITOSAMENTE! Número: +${connectedPhone}`);
    } else if (connection === 'connecting') {
      connectionState = 'connecting';
    }
  });
}

// HTTP API Server for Next.js to trigger WhatsApp messages
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // GET /status
  if (req.method === 'GET' && url.pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      state: connectionState,
      isConnected: connectionState === 'open',
      connectedPhone,
      qrCodeDataUrl: currentQrCodeDataUrl
    }));
    return;
  }

  // POST /send
  if (req.method === 'POST' && url.pathname === '/send') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { phone, message } = JSON.parse(body);

        if (!phone || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'phone y message son requeridos' }));
          return;
        }

        if (connectionState !== 'open' || !sock) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'WhatsApp Bot no está conectado. Por favor escanea el código QR en el panel admin.' 
          }));
          return;
        }

        const jid = formatPhoneToJid(phone);
        console.log(`📤 Enviando WhatsApp automático a ${jid}...`);

        const result = await sock.sendMessage(jid, { text: message });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          messageId: result?.key?.id,
          recipient: jid
        }));
      } catch (err) {
        console.error('Error enviando mensaje por WhatsApp:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message || 'Error al enviar mensaje' }));
      }
    });
    return;
  }

  // POST /disconnect
  if (req.method === 'POST' && url.pathname === '/disconnect') {
    try {
      if (sock) {
        await sock.logout();
      }
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      fs.mkdirSync(AUTH_DIR, { recursive: true });
      connectionState = 'close';
      connectedPhone = null;
      setTimeout(startWhatsAppBot, 2000);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'WhatsApp desvinculado exitosamente' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint no encontrado' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Servicio interno de WhatsApp Bot corriendo en http://127.0.0.1:${PORT}`);
  startWhatsAppBot();
});
