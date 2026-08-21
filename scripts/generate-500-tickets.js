const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const sharp = require('sharp');

const OUTPUT_DIR = path.join(__dirname, '..', 'entradas_500_qr');
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'entradas_500_qr');

const SECTORS = ['A', 'B', 'C', 'D', 'E'];
const TABLES_PER_SECTOR = 10;
const SEATS_PER_TABLE = 10;

const sectorDescriptions = {
  A: 'Sector A • Frente a Tarima de Gaitas',
  B: 'Sector B • Zona Central del Bulevar',
  C: 'Sector C • Zona Central',
  D: 'Sector D • Zona Cercana a Bazar y Postres',
  E: 'Sector E • Zona Lateral Familiar'
};

async function generateAll500TicketsWithNavyTheme() {
  console.log('🔵 Generando las 500 entradas en color Azul Marino Institucional del Seminario...');

  // Ensure directories exist
  [OUTPUT_DIR, PUBLIC_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    for (const sec of SECTORS) {
      const secDir = path.join(dir, `Sector_${sec}`);
      if (!fs.existsSync(secDir)) fs.mkdirSync(secDir, { recursive: true });
    }
  });

  const allTickets = [];
  let totalCount = 0;

  for (const sector of SECTORS) {
    for (let tableNum = 1; tableNum <= TABLES_PER_SECTOR; tableNum++) {
      const tableId = `${sector}${tableNum}`;
      const padTable = String(tableNum).padStart(2, '0');

      for (let seatNum = 1; seatNum <= SEATS_PER_TABLE; seatNum++) {
        totalCount++;
        const padSeat = String(seatNum).padStart(2, '0');
        const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        const ticketCode = `PARR-${tableId}-S${padSeat}-${randHex}`;
        const filePrefix = `Mesa_${sector}${padTable}_Silla_${padSeat}`;

        // 1. Generate Crisp Navy Blue QR Code Buffer (600x600)
        const qrBuffer = await QRCode.toBuffer(ticketCode, {
          errorCorrectionLevel: 'H',
          width: 600,
          margin: 2,
          color: {
            dark: '#0a192f', // Deep Institutional Navy Blue
            light: '#ffffff'
          }
        });

        // 2. Circular Center Emblem (170x170 px)
        const centerBadgeSvg = Buffer.from(`
          <svg width="170" height="170" viewBox="0 0 170 170" xmlns="http://www.w3.org/2000/svg">
            <circle cx="85" cy="85" r="82" fill="#ffffff" stroke="#f59e0b" stroke-width="4" />
            <circle cx="85" cy="85" r="74" fill="#0a192f" stroke="#38bdf8" stroke-width="2" />
            <text x="85" y="44" font-family="'Segoe UI', Arial, sans-serif" font-size="11" font-weight="900" fill="#f59e0b" text-anchor="middle" letter-spacing="2">SECTOR ${sector}</text>
            <text x="85" y="76" font-family="'Segoe UI', Arial, sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle">MESA ${tableId}</text>
            <line x1="35" y1="87" x2="135" y2="87" stroke="#f59e0b" stroke-width="2" />
            <text x="85" y="112" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="900" fill="#38bdf8" text-anchor="middle">SILLA #${seatNum}</text>
            <text x="85" y="134" font-family="'Segoe UI', Arial, sans-serif" font-size="9" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="1">PARRANDÓN 2026</text>
          </svg>
        `);

        // 3. Composite Center Emblem directly on QR Code
        const qrWithCenterPng = await sharp(qrBuffer)
          .composite([{ input: centerBadgeSvg, gravity: 'center' }])
          .png({ quality: 100 })
          .toBuffer();

        // 4. Generate Full Boarding Pass in Navy Blue & White Theme (600x920)
        // We will composite the QR with center logo inside the boarding pass
        const resizedQrForCard = await sharp(qrWithCenterPng)
          .resize(320, 320)
          .png()
          .toBuffer();

        const passCardSvgTemplate = Buffer.from(`
          <svg width="600" height="920" viewBox="0 0 600 920" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="navyHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0a192f" />
                <stop offset="50%" stop-color="#0f2744" />
                <stop offset="100%" stop-color="#1b3b6f" />
              </linearGradient>
              <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#06101e" />
                <stop offset="50%" stop-color="#0a192f" />
                <stop offset="100%" stop-color="#050b14" />
              </linearGradient>
            </defs>

            <!-- Card Background with Gold Border -->
            <rect x="15" y="15" width="570" height="890" rx="32" fill="url(#cardBg)" stroke="#f59e0b" stroke-width="4" />

            <!-- Top Navy Blue Banner -->
            <path d="M 17 45 Q 17 17 47 17 L 553 17 Q 583 17 583 45 L 583 145 L 17 145 Z" fill="url(#navyHeader)" />
            <text x="300" y="50" font-family="'Segoe UI', Arial, sans-serif" font-size="13" font-weight="800" fill="#fde68a" text-anchor="middle" letter-spacing="2">
              SEMINARIO MAYOR SANTO TOMÁS DE AQUINO
            </text>
            <text x="300" y="88" font-family="'Segoe UI', Arial, sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">
              PARRANDÓN NAVIDEÑO 2026
            </text>
            <text x="300" y="120" font-family="'Segoe UI', Arial, sans-serif" font-size="13" font-weight="600" fill="#93c5fd" text-anchor="middle">
              Sábado 12 de Diciembre • 6:00 PM • Bulevar Seminario Maracaibo
            </text>

            <!-- Location Badge (Mesa y Silla) -->
            <g transform="translate(50, 165)">
              <rect x="0" y="0" width="500" height="85" rx="20" fill="#0f2744" stroke="#38bdf8" stroke-width="2" />
              
              <text x="130" y="32" font-family="'Segoe UI', Arial, sans-serif" font-size="12" font-weight="800" fill="#94a3b8" text-anchor="middle">
                MESA ASIGNADA
              </text>
              <text x="130" y="68" font-family="'Segoe UI', Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">
                ${tableId}
              </text>

              <line x1="250" y1="15" x2="250" y2="70" stroke="#334155" stroke-width="2" />

              <text x="370" y="32" font-family="'Segoe UI', Arial, sans-serif" font-size="12" font-weight="800" fill="#94a3b8" text-anchor="middle">
                SILLA NUMERADA
              </text>
              <text x="370" y="68" font-family="'Segoe UI', Arial, sans-serif" font-size="34" font-weight="900" fill="#f59e0b" text-anchor="middle">
                #${seatNum}
              </text>
            </g>

            <!-- White Frame for QR Code -->
            <g transform="translate(130, 275)">
              <rect x="0" y="0" width="340" height="340" rx="24" fill="#ffffff" stroke="#f59e0b" stroke-width="4" />
            </g>

            <!-- Ticket Code -->
            <text x="300" y="655" font-family="'Courier New', monospace" font-size="16" font-weight="900" fill="#fde68a" text-anchor="middle" letter-spacing="2">
              ${ticketCode}
            </text>
            <text x="300" y="680" font-family="'Segoe UI', Arial, sans-serif" font-size="12" font-weight="700" fill="#64748b" text-anchor="middle">
              PASE DIGITAL N° ${totalCount} DE 500 • SECTOR ${sector}
            </text>

            <!-- Meal Inclusion Box -->
            <g transform="translate(50, 710)">
              <rect x="0" y="0" width="500" height="52" rx="16" fill="#0f2744" stroke="#f59e0b" stroke-width="2" />
              <text x="250" y="33" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="800" fill="#fde68a" text-anchor="middle">
                🍲 INCLUYE 1 PLATO NAVIDEÑO COMPLETO + PONCHE
              </text>
            </g>

            <!-- Footer -->
            <text x="300" y="805" font-family="'Segoe UI', Arial, sans-serif" font-size="11" font-weight="600" fill="#94a3b8" text-anchor="middle">
              Presenta este código QR en la entrada del Seminario Santo Tomás.
            </text>
            <text x="300" y="825" font-family="'Segoe UI', Arial, sans-serif" font-size="10" font-weight="500" fill="#64748b" text-anchor="middle">
              Válido para 1 sola persona • Escaneo único al ingreso • Maracaibo, Estado Zulia
            </text>
          </svg>
        `);

        // Composite Pass Card: Pass Template + QR image at (140, 285)
        const passCardPngBuffer = await sharp(passCardSvgTemplate)
          .composite([{ input: resizedQrForCard, top: 285, left: 140 }])
          .png({ quality: 100 })
          .toBuffer();

        // Write files to output directories
        const secOutDir = path.join(OUTPUT_DIR, `Sector_${sector}`);
        const secPubDir = path.join(PUBLIC_DIR, `Sector_${sector}`);

        const qrPngFilename = `${filePrefix}_QR.png`;
        const passPngFilename = `${filePrefix}_Pase.png`;

        fs.writeFileSync(path.join(secOutDir, qrPngFilename), qrWithCenterPng);
        fs.writeFileSync(path.join(secPubDir, qrPngFilename), qrWithCenterPng);

        fs.writeFileSync(path.join(secOutDir, passPngFilename), passCardPngBuffer);
        fs.writeFileSync(path.join(secPubDir, passPngFilename), passCardPngBuffer);

        allTickets.push({
          number: totalCount,
          sector,
          tableId,
          seatNum,
          ticketCode,
          qrPngFilename,
          passPngFilename,
          sectorFolder: `Sector_${sector}`
        });
      }
    }
  }

  // 5. Generate Updated Master Index HTML in Navy Blue Theme
  const indexHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>500 Entradas con QR - Seminario Mayor Santo Tomás de Aquino</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #06101e; color: #f8fafc; margin: 0; padding: 20px; }
    header { text-align: center; max-width: 900px; margin: 0 auto 30px; }
    h1 { color: #f59e0b; margin-bottom: 6px; font-size: 26px; }
    p.sub { color: #93c5fd; font-size: 14px; margin-top: 0; }
    .filters { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 30px; }
    .btn { background: #0a192f; color: #cbd5e1; border: 1px solid #1e3a8a; padding: 10px 18px; border-radius: 14px; cursor: pointer; font-weight: bold; font-size: 13px; transition: all 0.2s; }
    .btn:hover { background: #1e3a8a; color: white; }
    .btn.active { background: #f59e0b; color: #0a192f; border-color: #f59e0b; font-weight: 900; }
    .btn-print { background: #0284c7; color: white; border-color: #0284c7; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; max-width: 1400px; margin: 0 auto; }
    .card { background: #0a192f; border: 2px solid #1e3a8a; border-radius: 24px; padding: 16px; text-align: center; transition: all 0.2s; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    .card:hover { transform: translateY(-4px); border-color: #f59e0b; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.2); }
    .badge { display: inline-block; background: #f59e0b; color: #0a192f; font-weight: 900; font-size: 11px; padding: 4px 12px; border-radius: 12px; margin-bottom: 10px; }
    .table-title { font-size: 22px; font-weight: 900; color: #ffffff; margin-bottom: 2px; }
    .seat-title { font-size: 15px; font-weight: bold; color: #38bdf8; margin-bottom: 12px; }
    .qr-img { width: 210px; height: 210px; border-radius: 16px; margin: 0 auto 12px; display: block; border: 3px solid #f59e0b; background: white; }
    .code { font-family: monospace; font-size: 11px; color: #fde68a; background: #06101e; padding: 5px 10px; border-radius: 8px; display: inline-block; margin-bottom: 12px; border: 1px solid #1e3a8a; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .action-btn { font-size: 11px; font-weight: bold; padding: 8px; border-radius: 10px; text-decoration: none; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
    .btn-qr { background: #0284c7; color: white; }
    .btn-qr:hover { background: #38bdf8; }
    .btn-pase { background: #f59e0b; color: #0a192f; }
    .btn-pase:hover { background: #fbbf24; }
    @media print {
      body { background: white; color: black; padding: 0; }
      .filters, .actions, header p { display: none; }
      .card { border: 1px solid #ccc; background: white; color: black; page-break-inside: avoid; margin-bottom: 20px; }
      .code { color: black; background: #eee; }
      .table-title { color: black; }
    }
  </style>
</head>
<body>
  <header>
    <h1>🔵 Catálogo Institucional de las 500 Entradas con QR</h1>
    <p class="sub">Seminario Mayor Santo Tomás de Aquino • Parrandón Navideño 2026 • Bulevar Paramillo</p>
  </header>

  <div class="filters">
    <button class="btn active" onclick="filterSector('ALL')">Todas (500 Entradas)</button>
    <button class="btn" onclick="filterSector('A')">Sector A (Mesas A1-A10)</button>
    <button class="btn" onclick="filterSector('B')">Sector B (Mesas B1-B10)</button>
    <button class="btn" onclick="filterSector('C')">Sector C (Mesas C1-C10)</button>
    <button class="btn" onclick="filterSector('D')">Sector D (Mesas D1-D10)</button>
    <button class="btn" onclick="filterSector('E')">Sector E (Mesas E1-E10)</button>
    <button class="btn btn-print" onclick="window.print()">🖨️ Imprimir Catálogo</button>
  </div>

  <div class="grid" id="ticketGrid">
    ${allTickets.map(t => `
      <div class="card" data-sector="${t.sector}">
        <span class="badge">SECTOR ${t.sector}</span>
        <div class="table-title">MESA ${t.tableId}</div>
        <div class="seat-title">SILLA #${t.seatNum} (Entrada N° ${t.number})</div>
        <img class="qr-img" src="./${t.sectorFolder}/${t.qrPngFilename}" alt="QR Mesa ${t.tableId} Silla ${t.seatNum}">
        <div class="code">${t.ticketCode}</div>
        <div class="actions">
          <a class="action-btn btn-qr" href="./${t.sectorFolder}/${t.qrPngFilename}" download="${t.qrPngFilename}">💾 Bajar QR</a>
          <a class="action-btn btn-pase" href="./${t.sectorFolder}/${t.passPngFilename}" target="_blank">🎫 Ver Pase</a>
        </div>
      </div>
    `).join('')}
  </div>

  <script>
    function filterSector(sec) {
      document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        if (sec === 'ALL' || card.getAttribute('data-sector') === sec) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf-8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), indexHtml, 'utf-8');

  // CSV
  const csvLines = ['Numero,Sector,Mesa,Silla,CodigoQR,RutaQRPng,RutaPasePng'];
  allTickets.forEach(t => {
    csvLines.push(`${t.number},${t.sector},${t.tableId},${t.seatNum},${t.ticketCode},./${t.sectorFolder}/${t.qrPngFilename},./${t.sectorFolder}/${t.passPngFilename}`);
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, '500_entradas_lista.csv'), csvLines.join('\n'), 'utf-8');
  fs.writeFileSync(path.join(PUBLIC_DIR, '500_entradas_lista.csv'), csvLines.join('\n'), 'utf-8');

  console.log(`✅ ¡Completado con éxito! Las 500 entradas en Azul Marino Oficial fueron generadas en:`);
  console.log(`📁 ${OUTPUT_DIR}`);
}

generateAll500TicketsWithNavyTheme().catch(err => {
  console.error('Error al generar las entradas en Azul Marino:', err);
});
