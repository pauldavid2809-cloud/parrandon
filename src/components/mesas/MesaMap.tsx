'use client';

import { useMemo, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import type { MesaPublica } from './useMesas';

// Croquis del Bulevar del Seminario: tarima arriba, baranda negra a la izquierda,
// muro gris a la derecha y el giro del bulevar abajo a la derecha.

const W = 300; // ancho útil del bulevar
const LEFT = 44; // x donde empieza el piso útil
const VW = LEFT + W + 44;
const SECTOR_START = 98;
const SECTOR_LEN = 236;
const ROWS = [76, 138, 200];
const Y_END = SECTOR_START + 5 * SECTOR_LEN;
const TURN_R = 150;
const VH = Y_END + TURN_R + 34;
const R = 26;
const ACROSS: number[][] = [
  [50, 150, 250],
  [37.5, 112.5, 187.5, 262.5],
  [50, 150, 250],
];
const SECTORES = ['A', 'B', 'C', 'D', 'E'] as const;
const SECTOR_NOTE: Record<string, string> = {
  A: 'Frente a la tarima',
  B: 'Centro del bulevar',
  C: 'Centro del bulevar',
  D: 'Junto al bazar',
  E: 'Hacia el giro',
};
const BULBS = ['var(--color-rojo)', 'var(--color-oro)', 'var(--color-verde)', 'var(--color-oro)'];

function tablePos(sector: string, number: number) {
  const s = SECTORES.indexOf(sector as (typeof SECTORES)[number]);
  const s0 = SECTOR_START + s * SECTOR_LEN;
  const idx = number - 1;
  const row = idx < 3 ? 0 : idx < 7 ? 1 : 2;
  const col = row === 0 ? idx : row === 1 ? idx - 3 : idx - 7;
  return { x: LEFT + ACROSS[row][col], y: s0 + ROWS[row] };
}

export type MapMode = 'browse' | 'pick' | 'admin';

export interface MesaMapProps {
  mesas: MesaPublica[];
  selected?: string | null;
  mine?: string | null;
  mode?: MapMode;
  onSelect?: (mesa: MesaPublica) => void;
  className?: string;
}

export default function MesaMap({ mesas, selected, mine, mode = 'browse', onSelect, className }: MesaMapProps) {
  const byId = useMemo(() => new Map(mesas.map((m) => [m.id, m])), [mesas]);

  const handleKey = (e: KeyboardEvent, mesa: MesaPublica) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(mesa);
    }
  };

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className={cn('block h-auto w-full select-none', className)}
      role="group"
      aria-label="Croquis de las 50 mesas del Bulevar del Seminario"
    >
      <defs>
        <pattern id="baldosa" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M13 0 L26 13 L13 26 L0 13 Z" fill="none" stroke="var(--color-paper-3)" strokeWidth="0.8" />
        </pattern>
        <radialGradient id="farol">
          <stop offset="0%" stopColor="var(--color-oro)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-oro)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <Floor />
      <Wall />
      <Railing />
      <Stage />
      {SECTORES.map((s, i) => (
        <StringLights key={s} y={SECTOR_START + i * SECTOR_LEN - 12} seed={i} />
      ))}
      <Awning y={SECTOR_START + 3 * SECTOR_LEN + 96} />

      <text
        x={LEFT + W / 2}
        y={34}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-paper"
        style={{ font: '400 17px var(--font-display)' }}
      >
        Tarima · Gaitas en vivo
      </text>

      {SECTORES.map((s, i) => {
        const s0 = SECTOR_START + i * SECTOR_LEN;
        const llenas = mesas.filter((m) => m.sector === s && m.isFull).length;
        return (
          <g key={s}>
            <text x={LEFT + 2} y={s0 + 30} className="fill-ink" style={{ font: '400 20px var(--font-display)' }}>
              Sector {s}
            </text>
            <text
              x={LEFT + W - 2}
              y={s0 + 29}
              textAnchor="end"
              className="fill-ink-2"
              style={{ font: '700 11.5px var(--font-sans)' }}
            >
              {SECTOR_NOTE[s]}
              {llenas > 0 ? ` · ${llenas} ${llenas === 1 ? 'llena' : 'llenas'}` : ''}
            </text>
          </g>
        );
      })}

      <text
        x={LEFT + 168}
        y={Y_END + 96}
        textAnchor="middle"
        className="fill-ink-2"
        style={{ font: '400 16px var(--font-display)' }}
      >
        Giro del bulevar →
      </text>

      {SECTORES.flatMap((s) =>
        Array.from({ length: 10 }, (_, i) => {
          const id = `${s}${i + 1}`;
          const mesa = byId.get(id);
          const { x, y } = tablePos(s, i + 1);
          return (
            <Table
              key={id}
              id={id}
              x={x}
              y={y}
              mesa={mesa}
              mode={mode}
              isSelected={selected === id}
              isMine={mine === id}
              onActivate={mesa && onSelect ? () => onSelect(mesa) : undefined}
              onKey={mesa ? (e) => handleKey(e, mesa) : undefined}
            />
          );
        })
      )}
    </svg>
  );
}

// ---------- piezas del lugar (coordenadas verticales) ----------

const LF = LEFT - 8;
const RF = LEFT + W + 8;

function Floor() {
  const d = `M ${LF} 70 H ${RF} V ${Y_END} A 30 30 0 0 0 ${RF + 30} ${Y_END + 30} H ${VW + 10} V ${Y_END + TURN_R} H ${LF + TURN_R} A ${TURN_R} ${TURN_R} 0 0 1 ${LF} ${Y_END} Z`;
  return (
    <g>
      <path d={d} fill="var(--color-paper-2)" />
      <path d={d} fill="url(#baldosa)" />
    </g>
  );
}

function Wall() {
  const d = `M ${RF + 9} 66 V ${Y_END} A 21 21 0 0 0 ${RF + 30} ${Y_END + 21} H ${VW + 10}`;
  const shrubs = [];
  for (let y = 96; y < Y_END - 10; y += 46) shrubs.push(y);
  return (
    <g>
      <path d={d} fill="none" stroke="var(--color-paper-3)" strokeWidth="14" />
      <path d={d} fill="none" stroke="var(--color-line)" strokeWidth="14" strokeDasharray="1 21" />
      {shrubs.map((y, i) => (
        <g key={y}>
          <circle cx={RF + 27} cy={y} r={i % 2 ? 6 : 7.5} fill="var(--color-verde)" opacity="0.85" />
          <circle cx={RF + 25} cy={y - 2} r={i % 2 ? 2.5 : 3} fill="var(--color-verde-soft)" opacity="0.5" />
        </g>
      ))}
    </g>
  );
}

function Railing() {
  const x = LEFT - 18;
  const rr = TURN_R + 10;
  const d = `M ${x} 70 V ${Y_END} A ${rr} ${rr} 0 0 0 ${x + rr} ${Y_END + rr} H ${VW + 10}`;
  const posts = [];
  for (let y = 90; y < Y_END; y += 58) posts.push(y);
  return (
    <g>
      <path d={d} fill="none" stroke="var(--color-ink)" strokeWidth="5" />
      <path d={d} fill="none" stroke="var(--color-paper-2)" strokeWidth="1.6" strokeDasharray="2 4" />
      {posts.map((y, i) =>
        i % 2 === 0 ? (
          <g key={y}>
            <circle cx={x} cy={y} r="13" fill="url(#farol)" />
            <circle cx={x} cy={y} r="4.5" fill="var(--color-oro)" stroke="var(--color-ink)" strokeWidth="1.5" />
          </g>
        ) : (
          <rect key={y} x={x - 3.5} y={y - 3.5} width="7" height="7" fill="var(--color-ink)" />
        )
      )}
    </g>
  );
}

function Stage() {
  const x0 = LEFT + 12;
  const x1 = LEFT + W - 12;
  const bumps = [];
  for (let x = x0 + 7; x <= x1 - 7; x += 14) bumps.push(x);
  return (
    <g>
      <rect x={x0} y={8} width={x1 - x0} height={52} rx="10" fill="var(--color-rojo)" />
      {bumps.map((x) => (
        <circle key={x} cx={x} cy={60} r="7" fill="var(--color-rojo)" />
      ))}
      <rect x={x0 + 6} y={14} width={x1 - x0 - 12} height={40} rx="6" fill="none" stroke="var(--color-oro)" strokeWidth="1.2" />
    </g>
  );
}

function StringLights({ y, seed }: { y: number; seed: number }) {
  const x1 = LEFT - 18;
  const x2 = RF + 9;
  const cx = (x1 + x2) / 2;
  const sag = 34;
  const n = 15;
  const bulbs = Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / (n + 1);
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    const by = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + sag) + t * t * y;
    return { bx, by, color: BULBS[(i + seed) % BULBS.length], delay: ((i * 7 + seed * 3) % 10) * 0.28 };
  });
  return (
    <g aria-hidden>
      <path d={`M ${x1} ${y} Q ${cx} ${y + sag} ${x2} ${y}`} fill="none" stroke="var(--color-ink-2)" strokeWidth="0.9" />
      {bulbs.map((b, i) => (
        <circle key={i} cx={b.bx} cy={b.by + 2.5} r="3" fill={b.color} className="bulb" style={{ animationDelay: `${b.delay}s` }} />
      ))}
    </g>
  );
}

function Awning({ y }: { y: number }) {
  const x = RF + 2;
  return (
    <g aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <rect
          key={i}
          x={x}
          y={y + i * 9}
          width="16"
          height="9"
          fill={i % 2 ? 'var(--color-paper)' : 'var(--color-rojo)'}
        />
      ))}
      <rect x={x} y={y} width="16" height="45" fill="none" stroke="var(--color-ink)" strokeWidth="1" />
    </g>
  );
}

// ---------- mesa ----------

function Table({
  id,
  x,
  y,
  mesa,
  mode,
  isSelected,
  isMine,
  onActivate,
  onKey,
}: {
  id: string;
  x: number;
  y: number;
  mesa?: MesaPublica;
  mode: MapMode;
  isSelected: boolean;
  isMine: boolean;
  onActivate?: () => void;
  onKey?: (e: KeyboardEvent) => void;
}) {
  const free = mesa?.free ?? 0;
  const full = mesa?.isFull ?? false;
  const blocked = mesa?.blocked ?? false;

  let fill = 'var(--color-card)';
  let stroke = 'var(--color-verde)';
  let strokeWidth = 2.5;
  let text = 'var(--color-ink)';
  let subColor = 'var(--color-verde-2)';
  let sub = mesa && free === mesa.capacity ? 'Vacía' : `${free} ${free === 1 ? 'libre' : 'libres'}`;
  let dash: string | undefined;

  if (!mesa) {
    sub = '…';
    stroke = 'var(--color-line)';
    subColor = 'var(--color-ink-3)';
  } else if (blocked) {
    fill = 'var(--color-paper-3)';
    stroke = 'var(--color-ink-3)';
    dash = '4 3';
    sub = 'Reservada';
    subColor = 'var(--color-ink-2)';
  } else if (full) {
    fill = 'var(--color-ink-2)';
    stroke = 'var(--color-ink)';
    text = 'var(--color-paper)';
    subColor = 'var(--color-paper)';
    sub = 'Llena';
  } else if (free <= 3) {
    stroke = 'var(--color-oro)';
    strokeWidth = 3.5;
    subColor = 'var(--color-oro-ink)';
  }

  if (mode === 'admin' && mesa) {
    sub = `${mesa.taken}/${mesa.capacity}`;
  }
  if (isMine && !isSelected) {
    fill = 'var(--color-verde)';
    stroke = 'var(--color-verde-2)';
    text = 'var(--color-paper)';
    subColor = 'var(--color-paper)';
    sub = 'Tu mesa';
  }
  if (isSelected) {
    fill = 'var(--color-rojo)';
    stroke = 'var(--color-rojo-2)';
    text = 'var(--color-paper)';
    subColor = 'var(--color-paper)';
    sub = mode === 'admin' && mesa ? `${mesa.taken}/${mesa.capacity}` : 'Elegida';
  }

  const interactive = Boolean(onActivate);
  const label = mesa
    ? `Mesa ${id}. ${blocked ? 'Reservada' : full ? 'Llena' : `${free} ${free === 1 ? 'puesto libre' : 'puestos libres'}`}${isMine ? '. Es tu mesa' : ''}${isSelected ? '. Seleccionada' : ''}`
    : `Mesa ${id}`;

  return (
    <g
      role={interactive ? 'button' : 'img'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={label}
      aria-pressed={interactive ? isSelected : undefined}
      onClick={onActivate}
      onKeyDown={onKey}
      className={cn('mesa outline-none', interactive && 'cursor-pointer')}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    >
      <circle className="mesa-focus" cx={x} cy={y} r={R + 6} fill="none" stroke="var(--color-oro)" strokeWidth="3" />
      {isSelected && <circle cx={x} cy={y} r={R + 6} fill="none" stroke="var(--color-rojo)" strokeWidth="2" />}
      <circle cx={x} cy={y + 2} r={R} fill="rgb(42 26 18 / 0.12)" />
      <circle cx={x} cy={y} r={R} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
      <text
        x={x}
        y={y - 2}
        textAnchor="middle"
        style={{ font: '400 15.5px var(--font-display)', fill: text }}
      >
        {id}
      </text>
      <text
        x={x}
        y={y + 12.5}
        textAnchor="middle"
        style={{ font: '700 10.5px var(--font-sans)', fill: subColor }}
      >
        {sub}
      </text>
    </g>
  );
}
