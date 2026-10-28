'use client';

import { formatNumber } from '@/lib/site';
import { HOLDER_LABEL, type Entrada } from '@/lib/entradas/types';
import { buildEntradasPdf, entradasCsv, type PrintEvent } from './entradasPdf';

// Carpeta (ZIP) con todas las entradas: el PDF completo para la imprenta y un PDF por
// lote (cada seminarista, parroquia, Padre Jorge, taquilla), más los códigos en CSV.
// Se arma en el navegador de administración: los códigos no pasan por ningún otro lado.

const RAIZ = 'Entradas Parrandón 2026';

interface Lote {
  carpeta: string; // '' = en la raíz
  nombre: string;
  entradas: Entrada[];
}

// Windows no acepta \ / : * ? " < > | en nombres de archivo.
function nombreArchivo(nombre: string) {
  return nombre.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function numeros(entradas: Entrada[]) {
  return entradas.map((e) => e.number).sort((a, b) => a - b);
}

// "#001-#006" si son seguidas; si no, cuántas son (para el nombre del archivo).
function rangoCorto(entradas: Entrada[]) {
  const n = numeros(entradas);
  if (n.length === 1) return `#${formatNumber(n[0])}`;
  return n[n.length - 1] - n[0] + 1 === n.length ? `#${formatNumber(n[0])}-#${formatNumber(n[n.length - 1])}` : `${n.length} entradas`;
}

// "#281-#290, #300, #305-#310" (para el LEEME).
function rangos(entradas: Entrada[]) {
  const n = numeros(entradas);
  const partes: string[] = [];
  for (let i = 0; i < n.length; ) {
    let j = i;
    while (j + 1 < n.length && n[j + 1] === n[j] + 1) j++;
    partes.push(i === j ? `#${formatNumber(n[i])}` : `#${formatNumber(n[i])}-#${formatNumber(n[j])}`);
    i = j + 1;
  }
  return partes.join(', ');
}

function lotes(entradas: Entrada[]): Lote[] {
  const porLote = new Map<string, Lote>();
  for (const e of [...entradas].sort((a, b) => a.number - b.number)) {
    const [key, carpeta, nombre] =
      e.holderType === 'seminarista'
        ? [`s:${e.holderId ?? e.holderName}`, 'Seminaristas', e.holderName || 'Seminarista']
        : e.holderType === 'parroquia'
          ? [`p:${e.holderId ?? e.holderName}`, 'Parroquias', e.holderName || 'Parroquia']
          : [e.holderType, '', HOLDER_LABEL[e.holderType]];
    const lote = porLote.get(key) ?? { carpeta, nombre, entradas: [] };
    lote.entradas.push(e);
    porLote.set(key, lote);
  }
  // Seminaristas y parroquias primero, en el orden de sus números; después los demás.
  const orden = (l: Lote) => (l.carpeta === 'Seminaristas' ? 0 : l.carpeta === 'Parroquias' ? 1 : 2);
  return [...porLote.values()].sort((a, b) => orden(a) - orden(b) || a.entradas[0].number - b.entradas[0].number);
}

function leeme(todas: Entrada[], lista: Lote[], archivos: Map<Lote, string>, pdfTodas: string) {
  const ahora = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'short', timeStyle: 'short' });
  const anuladas = todas.filter((e) => e.status === 'anulada');
  const l: string[] = [
    'PARRANDÓN NAVIDEÑO 2026 · ENTRADAS',
    '',
    `Carpeta armada el ${ahora} (hora de Venezuela): ${todas.length} entradas (${rangos(todas)}).`,
    '',
    'QUÉ HAY AQUÍ',
    `- ${pdfTodas}: todas, cuatro por hoja A4 con línea de corte y talón. Es el archivo para la imprenta.`,
    '- Seminaristas: un PDF por seminarista con sus entradas.',
    '- Parroquias: un PDF por parroquia con su lote.',
    '- Padre Jorge, Taquilla y Sin asignar: un PDF por lote.',
    '- Códigos de las entradas.csv: número, código, enlace del QR, responsable y estado, por si la imprenta imprime datos variables.',
    '',
    'LOTES',
  ];
  let carpeta: string | null = null;
  for (const lote of lista) {
    if (lote.carpeta !== carpeta && lote.carpeta) l.push(`${lote.carpeta}:`);
    carpeta = lote.carpeta;
    l.push(`${lote.carpeta ? '  ' : ''}${archivos.get(lote)}: ${rangos(lote.entradas)}`);
  }
  if (anuladas.length) {
    l.push('', `OJO: ${anuladas.length} anulada(s), no las entregues: ${rangos(anuladas)}.`);
  }
  l.push(
    '',
    'IMPORTANTE',
    'Cada QR activa su entrada. Guarda esta carpeta en un lugar privado y compártela solo con la imprenta',
    'y con quien reparte cada lote. Si cambias lotes en Administración, vuelve a descargar la carpeta.'
  );
  // Saltos de línea de Windows para que el Bloc de notas lo muestre bien.
  return l.join('\r\n');
}

export async function buildCarpetaZip(
  entradas: Entrada[],
  event: PrintEvent,
  onProgress?: (hechas: number, total: number) => void
): Promise<Blob> {
  const { zip, strToU8 } = await import('fflate');
  const todas = [...entradas].sort((a, b) => a.number - b.number);
  const lista = lotes(todas);
  const total = todas.length * 2; // el PDF completo + los PDF por lote
  let hechas = 0;

  const pdf = async (ts: Entrada[]) => {
    const base = hechas;
    const doc = await buildEntradasPdf(
      ts.map((e) => ({ number: e.number, code: e.code })),
      event,
      (n) => onProgress?.(base + n, total)
    );
    hechas += ts.length;
    return new Uint8Array(doc.output('arraybuffer'));
  };

  const files: Record<string, Uint8Array> = {};
  const archivos = new Map<Lote, string>();
  const pdfTodas = `Todas las entradas ${rangoCorto(todas)} (imprenta).pdf`;
  files[`${RAIZ}/${pdfTodas}`] = await pdf(todas);

  let seminarista = 0;
  for (const lote of lista) {
    const prefijo = lote.carpeta === 'Seminaristas' ? `${String(++seminarista).padStart(2, '0')} - ` : '';
    const base = `${prefijo}${nombreArchivo(lote.nombre)} (${rangoCorto(lote.entradas)})`;
    let ruta = [RAIZ, lote.carpeta, `${base}.pdf`].filter(Boolean).join('/');
    for (let i = 2; files[ruta]; i++) ruta = [RAIZ, lote.carpeta, `${base} ${i}.pdf`].filter(Boolean).join('/');
    files[ruta] = await pdf(lote.entradas);
    archivos.set(lote, `${prefijo}${lote.nombre}`);
  }

  files[`${RAIZ}/Códigos de las entradas.csv`] = strToU8(entradasCsv(todas));
  files[`${RAIZ}/LEEME.txt`] = strToU8(leeme(todas, lista, archivos, pdfTodas));

  const data = await new Promise<Uint8Array>((resolve, reject) =>
    zip(files, { level: 6 }, (err, out) => (err ? reject(err) : resolve(out)))
  );
  return new Blob([data as BlobPart], { type: 'application/zip' });
}
