const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const AUTH_DIR = path.join(__dirname, 'auth_info');

let sock = null;
let qrRaw = null;
let qrCodeDataUrl = null;
let isConnected = false;
let connectedUser = null;
let connectionState = 'connecting';

function formatPhone(phone) {
  let clean = phone.toString().replace(/\D/g, '');
  if (clean.startsWith('04')) {
    clean = '58' + clean.slice(1);
  } else if (clean.startsWith('4') && clean.length === 10) {
    clean = '58' + clean;
  }
  if (!clean.includes('@s.whatsapp.net')) {
    clean = clean + '@s.whatsapp.net';
  }
  return clean;
}

async function connectToWhatsApp() {
  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      auth: state,
      browser: ['Parrandon Navideño 2026', 'Chrome', '1.0.0'],
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrRaw = qr;
        qrCodeDataUrl = await qrcode.toDataURL(qr);
        isConnected = false;
        connectionState = 'qr_ready';
        console.log('⚡ Nuevo código QR generado. Escanéalo en la interfaz web.');
      }

      if (connection === 'open') {
        isConnected = true;
        qrRaw = null;
        qrCodeDataUrl = null;
        connectionState = 'connected';
        connectedUser = sock.user;
        console.log(`✅ ¡WhatsApp Conectado con éxito! Número: ${sock.user?.id || 'Seminario'}`);
      }

      if (connection === 'close') {
        isConnected = false;
        connectionState = 'disconnected';
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`⚠️ Conexión cerrada. Motivo: ${statusCode}. Reconectando: ${shouldReconnect}`);

        if (statusCode === DisconnectReason.loggedOut) {
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (e) {}
        }

        if (shouldReconnect) {
          setTimeout(connectToWhatsApp, 3000);
        }
      }
    });

  } catch (err) {
    console.error('Error al inicializar Baileys:', err);
    setTimeout(connectToWhatsApp, 5000);
  }
}

// Visual Web Dashboard to scan QR easily from any browser/mobile
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bot de WhatsApp • Parrandón Navideño 2026</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
      <div class="max-w-md w-full rounded-3xl border border-amber-500/30 bg-slate-900/90 p-6 text-center shadow-2xl space-y-5">
        <div class="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm">
          <span>🎄 Parrandón Navideño 2026</span>
        </div>
        <h1 class="text-xl font-black text-white">Microservicio de WhatsApp 24/7</h1>

        ${isConnected ? `
          <div class="rounded-2xl bg-emerald-950/80 border border-emerald-500/40 p-5 text-center space-y-2">
            <span class="text-3xl">✅</span>
            <h2 class="text-base font-bold text-emerald-400">WhatsApp Conectado</h2>
            <p class="text-xs text-slate-300">Vinculado a: <strong>${connectedUser?.name || connectedUser?.id?.split(':')[0] || 'Seminario'}</strong></p>
            <p class="text-[11px] text-slate-400 pt-2">El bot está listo para despachar mensajes automáticos.</p>
          </div>
          <form action="/disconnect" method="POST" onsubmit="return confirm('¿Desconectar sesión de WhatsApp?')">
            <button type="submit" class="w-full rounded-xl bg-rose-950 border border-rose-700/60 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900">
              Cerrar Sesión / Desconectar
            </button>
          </form>
        ` : qrCodeDataUrl ? `
          <div class="space-y-3">
            <p class="text-xs text-slate-300">Abre WhatsApp en tu teléfono ➔ Dispositivos Vinculados ➔ Vincular dispositivo y escanea este código:</p>
            <div class="inline-block p-3 bg-white rounded-2xl shadow-inner border-4 border-amber-500/40">
              <img src="${qrCodeDataUrl}" alt="QR WhatsApp" class="w-56 h-56 mx-auto object-contain" />
            </div>
            <p class="text-[10px] text-amber-300/80">Este código se actualiza automáticamente cada 30 segundos.</p>
          </div>
        ` : `
          <div class="p-8 text-center text-xs text-slate-400">
            <div class="animate-spin text-2xl mb-2">⏳</div>
            Iniciando socket de WhatsApp y generando QR...
          </div>
        `}

        <div class="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
          Seminario Mayor Santo Tomás de Aquino • Puerto ${PORT}
        </div>
      </div>
      <script>
        ${!isConnected ? 'setTimeout(() => window.location.reload(), 10000);' : ''}
      </script>
    </body>
    </html>
  `);
});

// JSON Status endpoint for Next.js
app.get('/status', (req, res) => {
  res.json({
    success: true,
    isConnected,
    connectionState,
    qrCodeDataUrl,
    connectedUser: connectedUser ? {
      id: connectedUser.id,
      name: connectedUser.name
    } : null
  });
});

// Send Message Endpoint
app.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Campos phone y message requeridos' });
    }

    if (!isConnected || !sock) {
      return res.status(503).json({
        success: false,
        error: 'El bot de WhatsApp no está conectado. Escanea el código QR primero.'
      });
    }

    const jid = formatPhone(phone);
    const result = await sock.sendMessage(jid, { text: message });

    return res.json({
      success: true,
      messageId: result?.key?.id,
      recipient: jid
    });
  } catch (error) {
    console.error('Error enviando mensaje por WhatsApp:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Disconnect Endpoint
app.post('/disconnect', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    } catch (e) {}
    isConnected = false;
    connectedUser = null;
    qrRaw = null;
    qrCodeDataUrl = null;
    setTimeout(connectToWhatsApp, 1000);
    return res.redirect('/');
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Microservicio WhatsApp corriendo en http://localhost:${PORT}`);
  connectToWhatsApp();
});
