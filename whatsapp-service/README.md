# Microservicio de WhatsApp 24/7 (Baileys Socket)

Este servicio independiente mantiene una sesión de WhatsApp activa las 24 horas y despacha automáticamente las entradas y códigos QR cuando se aprueba una compra.

---

## 🚀 Despliegue Gratuito en Render.com (Recomendado - 3 Minutos)

1. **Crear cuenta en [Render.com](https://render.com)** (puedes iniciar sesión con tu cuenta de GitHub).
2. Haz clic en **"New +" ➔ "Web Service"**.
3. Selecciona tu repositorio de GitHub: `pauldavid2809-cloud/parrandon`.
4. Configura los siguientes campos:
   - **Name:** `parrandon-whatsapp-bot`
   - **Root Directory:** `whatsapp-service`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** `Free`
5. Haz clic en **"Create Web Service"**.
6. Una vez desplegado, abre la URL que te da Render (ej: `https://parrandon-whatsapp-bot.onrender.com`).
7. **Escanea el código QR** con el WhatsApp del Seminario (`Dispositivos Vinculados ➔ Vincular Dispositivo`).
8. En tu panel de **Vercel** (*Settings ➔ Environment Variables*), agrega:
   ```env
   WHATSAPP_BOT_URL=https://parrandon-whatsapp-bot.onrender.com
   ```
9. ¡Listo! Vercel enviará los mensajes automáticamente a través de este servicio.

---

## 💻 Ejecución en Local (Para Pruebas)

```bash
cd whatsapp-service
npm install
npm start
```
Abre en tu navegador `http://localhost:3001` y escanea el código QR.
