'use client';

import { useState, useEffect } from 'react';
import { TableInfo, SeatSelection } from '@/types';
import { 
  Sparkles, 
  X, 
  Check, 
  Users, 
  Music, 
  Utensils, 
  DoorOpen, 
  Info,
  RefreshCw,
  Eye,
  Armchair,
  CheckCircle2,
  Lock,
  ArrowRight,
  CornerDownRight,
  Shield,
  Layers,
  Compass
} from 'lucide-react';

interface SeatingMap2DProps {
  selectedSeats: SeatSelection[];
  onSeatsChange: (seats: SeatSelection[]) => void;
  maxSelectable?: number;
}

export default function SeatingMap2D({
  selectedSeats,
  onSeatsChange,
  maxSelectable = 10,
}: SeatingMap2DProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSector, setActiveSector] = useState<'ALL' | 'A' | 'B' | 'C' | 'D' | 'E'>('ALL');
  const [activeTableModal, setActiveTableModal] = useState<TableInfo | null>(null);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.tables) {
        setTables(data.tables);
        if (activeTableModal) {
          const fresh = data.tables.find((t: TableInfo) => t.id === activeTableModal.id);
          if (fresh) setActiveTableModal(fresh);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 12000);
    return () => clearInterval(interval);
  }, []);

  const isSeatSelected = (tableId: string, seatNumber: number) => {
    return selectedSeats.some(s => s.tableId === tableId && s.seatNumber === seatNumber);
  };

  const toggleSeat = (table: TableInfo, seatNumber: number) => {
    const isSelected = isSeatSelected(table.id, seatNumber);
    if (isSelected) {
      onSeatsChange(selectedSeats.filter(s => !(s.tableId === table.id && s.seatNumber === seatNumber)));
    } else {
      if (selectedSeats.length >= maxSelectable) {
        alert(`Has alcanzado el límite de ${maxSelectable} entradas por compra.`);
        return;
      }
      onSeatsChange([
        ...selectedSeats,
        {
          tableId: table.id,
          seatNumber,
          sector: table.sector
        }
      ]);
    }
  };

  const selectEntireTable = (table: TableInfo) => {
    const freeSeats = table.seats.filter(s => !s.isOccupied && !s.isPending);
    const availableToTake = freeSeats.filter(s => !isSeatSelected(table.id, s.number));
    
    if (selectedSeats.length + availableToTake.length > maxSelectable) {
      alert(`No puedes seleccionar ${availableToTake.length} sillas más. El límite máximo es de ${maxSelectable} entradas.`);
      return;
    }

    const newSelections = availableToTake.map(s => ({
      tableId: table.id,
      seatNumber: s.number,
      sector: table.sector
    }));

    onSeatsChange([...selectedSeats, ...newSelections]);
  };

  const removeSelectedSeat = (tableId: string, seatNumber: number) => {
    onSeatsChange(selectedSeats.filter(s => !(s.tableId === tableId && s.seatNumber === seatNumber)));
  };

  const sectors = ['A', 'B', 'C', 'D', 'E'] as const;

  const sectorNames: Record<string, string> = {
    A: 'Sector A • Frente a Tarima de Gaitas',
    B: 'Sector B • Zona Central del Bulevar',
    C: 'Sector C • Zona Central',
    D: 'Sector D • Zona Bazar y Postres',
    E: 'Sector E • Tramo Final hacia el Giro del Bulevar'
  };

  return (
    <div className="w-full space-y-6 select-none">
      
      {/* Top Banner & Interactive Legend */}
      <div className="rounded-3xl bg-slate-900/90 border border-white/[0.08] p-4 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              Croquis Arquitectónico del Bulevar • 50 Mesas de Banquete (500 Sillas)
            </h3>
          </div>
          <p className="text-xs text-amber-200/90 mt-1 font-medium">
            👇 Toca cualquier mesa para ver sus 10 sillas y reservar tus puestos con plato navideño incluido.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs flex-wrap justify-center bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800">
          <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30 shadow-sm" />
            Silla Libre
          </span>
          <span className="flex items-center gap-1.5 text-amber-300 font-black">
            <span className="h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-amber-400/50 shadow-md animate-pulse" />
            Tu Selección ({selectedSeats.length})
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-3.5 w-3.5 rounded-full bg-slate-800 border border-slate-700" />
            Ocupada
          </span>
        </div>
      </div>

      {/* Selected Seats Top Inline Strip */}
      {selectedSeats.length > 0 && (
        <div className="rounded-3xl border-2 border-amber-400 bg-slate-900/95 p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                Tus Sillas Seleccionadas ({selectedSeats.length} de {maxSelectable} máx):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {selectedSeats.map((seat) => (
                <span
                  key={`${seat.tableId}-${seat.seatNumber}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 text-xs font-bold text-amber-200"
                >
                  <Armchair className="h-3 w-3 text-amber-400" />
                  <span>Mesa {seat.tableId} • Silla #{seat.seatNumber}</span>
                  <button
                    type="button"
                    onClick={() => removeSelectedSeat(seat.tableId, seat.seatNumber)}
                    className="hover:text-rose-400 ml-1 text-slate-400"
                    title="Quitar silla"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Subtotal:</span>
            <span className="text-lg font-black text-emerald-400 font-mono">${selectedSeats.length * 20}.00 USD</span>
          </div>
        </div>
      )}

      {/* MAIN REALISTIC BULEVAR ENVIRONMENT WRAPPER */}
      <div className="relative rounded-3xl border-2 border-amber-500/30 bg-slate-950 shadow-2xl overflow-hidden">
        
        {/* TOP: ESCENARIO PRINCIPAL / TARIMA DE GAITAS */}
        <div className="relative w-full bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 p-6 text-center border-b-4 border-amber-400/80 shadow-2xl">
          {/* Spotlight aura beams radiating down */}
          <div className="absolute inset-0 bg-radial from-amber-400/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-950/80 border border-sky-400/40 px-4 py-1 text-xs font-black text-sky-200 mb-2">
              <Music className="h-4 w-4 text-amber-400 animate-bounce" />
              <span>TARIMA PRINCIPAL • GAITAS Y ACTOS CENTRALES</span>
              <Music className="h-4 w-4 text-amber-400 animate-bounce" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Escenario Frente al Sector A
            </h2>
            <p className="text-xs text-amber-300/90 font-medium mt-0.5">
              Seminario Mayor Santo Tomás de Aquino (Maracaibo)
            </p>
          </div>
        </div>

        {/* MIDDLE: THE BOULEVARD WITH LEFT BLACK RAILING & RIGHT GREY WALL */}
        <div className="relative flex">

          {/* 1. LEFT ARCHITECTURAL BLACK RAILING (BARANDA NEGRA DE HIERRO FORJADO CON FAROLES) */}
          <div className="w-12 sm:w-16 shrink-0 bg-gradient-to-r from-black via-slate-950 to-slate-900 border-r-4 border-black relative flex flex-col justify-between items-center py-6 select-none shadow-2xl">
            {/* Iron Balusters Pattern */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:6px_6px]" />
            
            {/* Railing Posts with Glowing Lanterns */}
            <div className="flex flex-col justify-around h-full space-y-24 z-10">
              {[1, 2, 3, 4, 5, 6].map(post => (
                <div key={post} className="flex flex-col items-center group">
                  <div className="h-3.5 w-3.5 rounded-full bg-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.9)] animate-pulse border border-amber-200" />
                  <div className="w-2 h-12 bg-black rounded-sm mt-0.5 border-x border-slate-700 shadow-md" />
                </div>
              ))}
            </div>

            {/* Vertical Railing Label */}
            <div className="absolute top-1/2 -translate-y-1/2 -rotate-90 text-[9px] sm:text-[10px] font-mono font-black tracking-widest text-slate-400 uppercase whitespace-nowrap pointer-events-none">
              BARANDA NEGRA PERIMETRAL
            </div>
          </div>

          {/* 2. CENTER: THE 50 BANQUET TABLES ON THE BOULEVARD WALKWAY */}
          <div className="flex-1 p-3 sm:p-8 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] space-y-10">
            {sectors.map((sec) => {
              if (activeSector !== 'ALL' && activeSector !== sec) return null;
              const sectorTables = tables.filter(t => t.sector === sec);

              return (
                <div key={sec} className="rounded-3xl border border-white/[0.08] bg-slate-950/90 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-6">
                    <h4 className="text-xs sm:text-sm font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span>{sectorNames[sec]}</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-bold bg-slate-900 px-3 py-1 rounded-full border border-slate-800 font-mono">
                      10 mesas • 100 comensales
                    </span>
                  </div>

                  {/* 10 Realistic Banquet Tables Grid (Clean Spacing & No Text Overlap) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {sectorTables.map((table) => {
                      const freeSeatsCount = table.seats.filter(s => !s.isOccupied && !s.isPending).length;
                      const tableSelectedCount = selectedSeats.filter(s => s.tableId === table.id).length;
                      const isFullyOccupied = freeSeatsCount === 0;

                      return (
                        <div
                          key={table.id}
                          onClick={() => setActiveTableModal(table)}
                          className={`group relative rounded-3xl p-3 sm:p-4 text-center transition-all duration-150 border-2 cursor-pointer flex flex-col items-center justify-between shadow-xl min-w-0 ${
                            tableSelectedCount > 0
                              ? 'border-amber-400 bg-amber-500/15 shadow-amber-500/20 ring-2 sm:ring-4 ring-amber-400/40 scale-[1.02]'
                              : isFullyOccupied
                              ? 'border-slate-800/80 bg-slate-950/70 opacity-60'
                              : 'border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900 to-slate-950 hover:border-amber-400/80 hover:shadow-amber-500/15 hover:scale-[1.02]'
                          }`}
                        >
                          {/* REALISTIC ROUND BANQUET TABLE WITH 10 CHAIRS */}
                          <div className="relative w-28 h-28 sm:w-32 sm:h-32 my-1 flex items-center justify-center shrink-0">
                            
                            {/* 10 Realistic Physical Chairs Surrounding the Table */}
                            {table.seats.map((seat, i) => {
                              const angle = (i * 360) / 10 - 90;
                              const radius = 46; // px from center
                              const rad = (angle * Math.PI) / 180;
                              const x = Math.round(radius * Math.cos(rad));
                              const y = Math.round(radius * Math.sin(rad));

                              const isSelected = isSeatSelected(table.id, seat.number);
                              const isTaken = seat.isOccupied || seat.isPending;

                              return (
                                <div
                                  key={seat.number}
                                  style={{
                                    left: `${56 + x - 7}px`,
                                    top: `${56 + y - 7}px`
                                  }}
                                  className={`absolute h-3.5 w-3.5 rounded-full border shadow-sm transition-transform duration-150 ${
                                    isSelected
                                      ? 'bg-amber-400 border-white ring-2 ring-amber-400 z-10 scale-125'
                                      : isTaken
                                      ? 'bg-slate-800 border-slate-700'
                                      : 'bg-emerald-500 border-emerald-300 group-hover:scale-110'
                                  }`}
                                  title={`Silla #${seat.number}`}
                                />
                              );
                            })}

                            {/* Central Round Table with Fine Gala Navy Tablecloth & Golden Rim */}
                            <div
                              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center text-center shadow-xl border-2 sm:border-4 transition-all ${
                                tableSelectedCount > 0
                                  ? 'bg-gradient-to-br from-blue-900 via-amber-600 to-blue-950 border-amber-300 text-white shadow-amber-500/30'
                                  : isFullyOccupied
                                  ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-slate-500'
                                  : 'bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 border-amber-400/70 text-white group-hover:border-amber-300 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                              }`}
                            >
                              <div className="h-1 w-1 rounded-full bg-amber-400 mb-0.5 shadow-sm" />
                              <span className="text-[9px] font-black tracking-tight leading-none text-sky-200 uppercase">
                                MESA
                              </span>
                              <span className="text-sm sm:text-base font-black text-amber-300 leading-tight">
                                {table.id}
                              </span>
                              <span className="text-[7px] sm:text-[8px] font-bold text-slate-300 mt-0.5">
                                10 Sillas
                              </span>
                            </div>
                          </div>

                          {/* Table Availability Badge (No Wrap / No Overlap) */}
                          <div className="mt-2 w-full flex items-center justify-center min-h-[26px]">
                            {tableSelectedCount > 0 ? (
                              <span className="inline-flex items-center justify-center gap-1 text-amber-300 font-black bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-400/40 text-[10px] sm:text-[11px] whitespace-nowrap leading-none">
                                ✓ {tableSelectedCount} {tableSelectedCount === 1 ? 'silla' : 'sillas'}
                              </span>
                            ) : isFullyOccupied ? (
                              <span className="text-slate-500 font-bold text-[10px] sm:text-[11px] whitespace-nowrap leading-none">
                                Mesa Completa
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-bold text-[10px] sm:text-[11px] whitespace-nowrap leading-none">
                                {freeSeatsCount} de 10 libres
                              </span>
                            )}
                          </div>

                          {/* Action Button (Single Line Fit) */}
                          <div className="w-full mt-2.5 pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              className={`w-full py-2 px-2 rounded-xl text-[10px] sm:text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap ${
                                tableSelectedCount > 0
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-200'
                              }`}
                            >
                              <Eye className="h-3 w-3 shrink-0" />
                              <span>Elegir sillas</span>
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. RIGHT ARCHITECTURAL GREY WALL (MURO GRIS PERIMETRAL DE PIEDRA CON JARDINES) */}
          <div className="w-12 sm:w-16 shrink-0 bg-gradient-to-l from-slate-950 via-slate-800 to-slate-900 border-l-4 border-slate-600 relative flex flex-col justify-between items-center py-6 select-none shadow-2xl">
            {/* Concrete / Stone masonry pattern texture */}
            <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_bottom,#000_2px,transparent_2px)] [background-size:100%_32px]" />

            {/* Architectural wall buttresses */}
            <div className="flex flex-col justify-around h-full space-y-24 z-10">
              {[1, 2, 3, 4, 5, 6].map(block => (
                <div key={block} className="flex flex-col items-center">
                  <div className="w-5 h-8 bg-slate-700 rounded-sm border border-slate-500 shadow-md" />
                  <div className="h-2 w-2 rounded-full bg-emerald-500/70 mt-1" title="Jardines del Seminario" />
                </div>
              ))}
            </div>

            {/* Vertical Muro Label */}
            <div className="absolute top-1/2 -translate-y-1/2 rotate-90 text-[9px] sm:text-[10px] font-mono font-black tracking-widest text-slate-300 uppercase whitespace-nowrap pointer-events-none">
              MURO GRIS PERIMETRAL
            </div>
          </div>

        </div>

        {/* BOTTOM: GRAPHICAL 90-DEGREE CURVE TO THE RIGHT (GIRO REALISTA Y FINAL DEL BULEVAR) */}
        <div className="relative w-full bg-slate-950 border-t-4 border-slate-800">
          
          {/* Visual Pavement & Curving Walkway Architecture */}
          <div className="relative flex items-stretch h-36 sm:h-44 overflow-hidden">
            
            {/* Bottom-Left Curved Black Railing (La baranda curva y cierra la esquina inferior izquierda) */}
            <div className="w-12 sm:w-16 bg-black border-r-4 border-b-4 border-black relative flex items-end justify-center pb-4 rounded-bl-3xl">
              <div className="h-4 w-4 rounded-full bg-amber-400 shadow-[0_0_16px_rgba(245,158,11,1)] animate-pulse" />
            </div>

            {/* Center-to-Right Curving Paved Boulevard Floor (El piso del bulevar gira a la derecha) */}
            <div className="flex-1 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/60 p-4 sm:p-6 flex items-center justify-between border-b-4 border-black relative overflow-hidden">
              
              {/* Graphical Curved Paving Lines */}
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_bottom_left,#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute -left-10 bottom-0 w-64 h-64 border-t-4 border-r-4 border-amber-500/30 rounded-tr-full pointer-events-none" />

              {/* Turning Boulevard Narrative & Graphics */}
              <div className="relative z-10 flex items-center gap-3.5">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/20 text-amber-400 border-2 border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                  <CornerDownRight className="h-8 w-8" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black uppercase border border-amber-500/30 mb-1">
                    <span>GIRO ARQUITECTÓNICO DEL BULEVAR</span>
                  </div>
                  <h4 className="text-base sm:text-xl font-black text-white leading-tight">
                    El Bulevar gira hacia la derecha ➔
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tramo final de mesas (Sector E) donde la caminería dobla a la derecha y concluye el trazado del evento.
                  </p>
                </div>
              </div>

              {/* Right End Terminal Boundary (El bulevar concluye en este extremo) */}
              <div className="relative z-10 flex flex-col items-end text-right shrink-0 bg-slate-950/90 border border-amber-500/30 px-4 py-3 rounded-2xl shadow-xl">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  LÍMITE DEL BULEVAR
                </span>
                <span className="text-xs font-black text-white block mt-0.5">
                  Fin del Paseo
                </span>
              </div>
            </div>

            {/* Right Wall Corner Opening */}
            <div className="w-12 sm:w-16 bg-slate-800 border-l-4 border-slate-600 relative flex items-start justify-center pt-4">
              <div className="w-5 h-8 bg-slate-700 rounded-sm border border-slate-500 shadow-md" />
            </div>

          </div>
        </div>

      </div>

      {/* ROUND TABLE SEAT SELECTION MODAL (EMIL KOWALSKI POLISH) */}
      {activeTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-4 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-xl max-h-[94vh] overflow-y-auto rounded-3xl border-2 border-amber-500/60 bg-slate-900 p-5 sm:p-7 shadow-2xl text-center">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveTableModal(null)}
              className="absolute top-4 right-4 rounded-full bg-slate-800 p-2.5 text-slate-300 hover:text-white hover:bg-slate-700 transition-all active:scale-90 z-30"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3.5 py-1 text-xs font-black text-amber-300 mb-2">
              <span>{sectorNames[activeTableModal.sector]}</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-black text-white">
              Mesa {activeTableModal.id}
            </h3>
            <p className="text-xs text-slate-300 mt-1 font-medium max-w-md mx-auto">
              👇 Toca las sillas verdes para reservarlas individualmente o pulsa <strong>"Seleccionar Mesa Completa"</strong>:
            </p>

            {/* Circular Banquet Table Graphic with 10 Chairs */}
            <div className="w-full flex items-center justify-center overflow-hidden py-2">
              <div className="relative w-[300px] h-[300px] sm:w-80 sm:h-80 flex items-center justify-center select-none scale-95 sm:scale-100 origin-center shrink-0">
                
                {/* Central Round Table Surface */}
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 border-4 border-amber-400 shadow-2xl flex flex-col items-center justify-center text-white z-10 pointer-events-none">
                  <span className="text-[9px] uppercase font-bold text-sky-300 tracking-wider">Bulevar</span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-300">{activeTableModal.id}</span>
                  <span className="text-[8px] font-bold text-slate-300 mt-0.5">10 Comensales</span>
                </div>

                {/* 10 Interactive Physical Chairs */}
                {activeTableModal.seats.map((seat, i) => {
                  const angle = (i * 360) / 10 - 90;
                  const radius = 118; // px from center (160, 160)
                  const rad = (angle * Math.PI) / 180;
                  const x = Math.round(radius * Math.cos(rad));
                  const y = Math.round(radius * Math.sin(rad));

                  const isSelected = isSeatSelected(activeTableModal.id, seat.number);
                  const isTaken = seat.isOccupied || seat.isPending;

                  return (
                    <button
                      key={seat.number}
                      type="button"
                      disabled={isTaken}
                      onClick={() => toggleSeat(activeTableModal, seat.number)}
                      style={{
                        left: `${160 + x - 24}px`,
                        top: `${160 + y - 24}px`
                      }}
                      className={`absolute h-12 w-12 rounded-full flex flex-col items-center justify-center transition-transform duration-150 active:scale-90 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-black shadow-2xl ring-4 ring-amber-300 z-20 scale-110'
                          : isTaken
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60'
                          : 'bg-emerald-600 hover:bg-emerald-500 hover:ring-4 hover:ring-emerald-400/50 text-white shadow-lg border-2 border-emerald-300 z-20'
                      }`}
                      title={isTaken ? `Silla #${seat.number} (Ocupada)` : `Silla #${seat.number} (Toca para elegir)`}
                    >
                      {isSelected ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : (
                        <Armchair className="h-4 w-4 shrink-0" />
                      )}
                      <span className="text-[10px] font-black leading-none mt-0.5">{seat.number}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick 10-Chair Button Matrix */}
            <div className="mt-3 pt-3 border-t border-slate-800 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  Sillas de la Mesa {activeTableModal.id}:
                </span>
                <button
                  type="button"
                  onClick={() => selectEntireTable(activeTableModal)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold underline"
                >
                  ⚡ Seleccionar Mesa Completa (10 Sillas)
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {activeTableModal.seats.map((seat) => {
                  const isSelected = isSeatSelected(activeTableModal.id, seat.number);
                  const isTaken = seat.isOccupied || seat.isPending;

                  return (
                    <button
                      key={seat.number}
                      type="button"
                      disabled={isTaken}
                      onClick={() => toggleSeat(activeTableModal, seat.number)}
                      className={`p-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-md'
                          : isTaken
                          ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800 line-through'
                          : 'bg-slate-950 text-slate-200 border border-slate-700 hover:border-emerald-400 hover:bg-emerald-950/40'
                      }`}
                    >
                      <span className="text-[9px] opacity-75">Silla</span>
                      <strong className="text-xs font-black">#{seat.number}</strong>
                      <span className="text-[9px] font-bold">
                        {isSelected ? '✓' : isTaken ? '✕' : 'Libre'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-300">
                Sillas elegidas en esta mesa: <strong className="text-amber-400 text-sm font-black">{selectedSeats.filter(s => s.tableId === activeTableModal.id).length}</strong>
              </span>

              <button
                type="button"
                onClick={() => setActiveTableModal(null)}
                className="w-full sm:w-auto rounded-2xl bg-amber-400 hover:bg-amber-300 px-8 py-3 text-xs font-black text-slate-950 transition-all shadow-xl shadow-amber-500/30 active:scale-95"
              >
                ✅ Confirmar Selección
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
