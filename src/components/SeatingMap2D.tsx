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
  Lock
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
      const res = await fetch('/api/tables');
      const data = await res.json();
      if (data.success && data.tables) {
        setTables(data.tables);
        // If modal is open, refresh active table
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
    const interval = setInterval(fetchTables, 15000);
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

  const removeSelectedSeat = (tableId: string, seatNumber: number) => {
    onSeatsChange(selectedSeats.filter(s => !(s.tableId === tableId && s.seatNumber === seatNumber)));
  };

  const sectors = ['A', 'B', 'C', 'D', 'E'] as const;

  const sectorNames: Record<string, string> = {
    A: 'Sector A • Frente a Tarima de Gaitas',
    B: 'Sector B • Zona Central del Bulevar',
    C: 'Sector C • Zona Central',
    D: 'Sector D • Zona Cercana a Bazar y Postres',
    E: 'Sector E • Zona Lateral Familiar'
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Top Banner / Legend */}
      <div className="rounded-3xl bg-slate-900/95 border-2 border-amber-500/30 p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-400 animate-ping" />
            <h3 className="text-base font-black text-white flex items-center gap-2">
              Croquis 2D del Bulevar • 50 Mesas Redondas (500 Sillas)
            </h3>
          </div>
          <p className="text-xs text-amber-200/90 mt-1 font-medium">
            👇 Haz clic sobre cualquier mesa para entrar y elegir tus sillas (1 a 10).
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs flex-wrap justify-center bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
            Silla Libre
          </span>
          <span className="flex items-center gap-1.5 text-amber-300 font-bold">
            <span className="h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-amber-400/40" />
            Tu Selección ({selectedSeats.length})
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="h-3.5 w-3.5 rounded-full bg-rose-900 border border-rose-700" />
            Ocupada
          </span>
        </div>
      </div>

      {/* Sector Tabs Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveSector('ALL')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 ${
            activeSector === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Todo el Bulevar (50 Mesas)
        </button>
        {sectors.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => setActiveSector(sec)}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 ${
              activeSector === sec
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Sector {sec} (Mesas {sec}1 - {sec}10)
          </button>
        ))}
      </div>

      {/* 2D BULEVAR MAP CONTAINER */}
      <div className="relative rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* STAGE (TARIMA PRINCIPAL) EN AZUL MARINO INSTITUCIONAL */}
        <div className="w-full max-w-xl mx-auto rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 p-4 text-center text-white mb-10 shadow-2xl border-2 border-amber-400/60">
          <div className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest">
            <Music className="h-5 w-5 text-amber-300 animate-bounce" />
            <span>🎸 TARIMA PRINCIPAL & GAITAS EN VIVO 🎤</span>
            <Music className="h-5 w-5 text-amber-300 animate-bounce" />
          </div>
          <span className="text-xs text-sky-200 font-bold block mt-1">
            Frente al Sector A • Seminario Santo Tomás de Aquino
          </span>
        </div>

        {/* BULEVAR LAYOUT - 50 TABLES IN ZIGZAG */}
        <div className="space-y-10">
          {sectors.map((sec) => {
            if (activeSector !== 'ALL' && activeSector !== sec) return null;
            const sectorTables = tables.filter(t => t.sector === sec);

            return (
              <div key={sec} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 sm:p-6 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
                  <h4 className="text-sm font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    {sectorNames[sec]}
                  </h4>
                  <span className="text-xs text-slate-400 font-semibold bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                    10 mesas • 100 comensales
                  </span>
                </div>

                {/* ZIGZAG GRID OF TABLES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
                  {sectorTables.map((table, index) => {
                    const freeSeatsCount = table.seats.filter(s => !s.isOccupied && !s.isPending).length;
                    const tableSelectedCount = selectedSeats.filter(s => s.tableId === table.id).length;
                    const isFullyOccupied = freeSeatsCount === 0;

                    // Zigzag offset for alternating tables
                    const isZigzag = index % 2 === 1;

                    return (
                      <div
                        key={table.id}
                        onClick={() => setActiveTableModal(table)}
                        className={`group relative rounded-3xl p-4 text-center transition-all duration-200 border-2 cursor-pointer flex flex-col items-center justify-between ${
                          isZigzag ? 'sm:translate-y-3' : ''
                        } ${
                          tableSelectedCount > 0
                            ? 'border-amber-400 bg-amber-500/15 shadow-xl shadow-amber-500/25 ring-4 ring-amber-400/40'
                            : isFullyOccupied
                            ? 'border-slate-800 bg-slate-950/60 opacity-60'
                            : 'border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/20'
                        }`}
                      >
                        {/* Realistic Banquet Round Table with 10 surrounding Chair Dots (Rock-solid Absolute Positioning) */}
                        <div className="relative w-28 h-28 my-2 flex items-center justify-center">
                          
                          {/* 10 Mini Chair Dots positioned with explicit left/top */}
                          {table.seats.map((seat, i) => {
                            const angle = (i * 360) / 10 - 90;
                            const radius = 46; // px from center (56, 56)
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
                                className={`absolute h-3.5 w-3.5 rounded-full border shadow-sm ${
                                  isSelected
                                    ? 'bg-amber-400 border-white ring-2 ring-amber-400 z-10'
                                    : isTaken
                                    ? 'bg-rose-900 border-rose-700'
                                    : 'bg-emerald-500 border-emerald-300'
                                }`}
                                title={`Silla #${seat.number}`}
                              />
                            );
                          })}

                          {/* Central Round Table Surface */}
                          <div
                            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center text-center shadow-2xl border-4 ${
                              tableSelectedCount > 0
                                ? 'bg-gradient-to-br from-blue-900 to-amber-500 border-amber-300 text-white'
                                : isFullyOccupied
                                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-slate-400'
                                : 'bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 border-amber-400/80 text-white group-hover:border-amber-300'
                            }`}
                          >
                            <span className="text-xs font-black tracking-tight leading-none text-sky-200">
                              MESA
                            </span>
                            <span className="text-base font-black text-amber-300">
                              {table.id}
                            </span>
                            <span className="text-[8px] font-bold opacity-80 mt-0.5">
                              10 Sillas
                            </span>
                          </div>
                        </div>

                        {/* Availability Status */}
                        <div className="mt-2 text-xs font-bold">
                          {tableSelectedCount > 0 ? (
                            <span className="text-amber-300 font-extrabold bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                              ✓ {tableSelectedCount} {tableSelectedCount === 1 ? 'silla elegida' : 'sillas elegidas'}
                            </span>
                          ) : isFullyOccupied ? (
                            <span className="text-rose-400 font-semibold text-[11px]">
                              Mesa Completa
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold text-[11px]">
                              {freeSeatsCount} de 10 libres
                            </span>
                          )}
                        </div>

                        {/* Big Interactive Call To Action Button */}
                        <div className="w-full mt-3 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            className={`w-full py-2 px-2.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                              tableSelectedCount > 0
                                ? 'bg-amber-400 text-slate-950 font-black'
                                : 'bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-200'
                            }`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Tocar para elegir sillas</span>
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

        {/* SIDE LANDMARKS */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-6 text-xs text-slate-300">
          <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <DoorOpen className="h-6 w-6 text-emerald-400 shrink-0" />
            <div>
              <strong className="text-white text-sm block">Acceso Principal al Bulevar</strong>
              <span className="text-slate-400">Recepción, Validación de QR y Bienvenida</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <Utensils className="h-6 w-6 text-amber-400 shrink-0" />
            <div>
              <strong className="text-white text-sm block">Estación de Cocina y Comida</strong>
              <span className="text-slate-400">Despacho de Hallacas, Pan de Jamón y Ponche</span>
            </div>
          </div>
        </div>

      </div>

      {/* SELECTED SEATS BAR (Summary of Choices) */}
      {selectedSeats.length > 0 && (
        <div className="rounded-3xl border-2 border-amber-500 bg-gradient-to-r from-slate-950 via-amber-950/50 to-slate-950 p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs uppercase font-black tracking-wider text-amber-400">
                Tus Asientos Seleccionados en el Bulevar ({selectedSeats.length}):
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {selectedSeats.map((seat) => (
                <span
                  key={`${seat.tableId}-${seat.seatNumber}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 px-3 py-1.5 text-xs font-black text-amber-300 shadow-md"
                >
                  <Armchair className="h-3.5 w-3.5 text-amber-400" />
                  <span>Mesa {seat.tableId} • Silla #{seat.seatNumber}</span>
                  <button
                    type="button"
                    onClick={() => removeSelectedSeat(seat.tableId, seat.seatNumber)}
                    className="hover:text-rose-400 ml-1 text-slate-400"
                    title="Eliminar asiento"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="text-right shrink-0 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Total a Pagar ($20 c/u):</span>
            <span className="text-xl font-black text-emerald-400">
              ${selectedSeats.length * 20}.00 USD
            </span>
          </div>
        </div>
      )}

      {/* ROUND TABLE SEAT SELECTION MODAL (STABLE, JITTER-FREE) */}
      {activeTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl max-h-[95vh] overflow-y-auto rounded-3xl border-2 border-amber-500/60 bg-slate-900 p-5 sm:p-7 shadow-2xl text-center">
            
            {/* Close */}
            <button
              type="button"
              onClick={() => setActiveTableModal(null)}
              className="absolute top-4 right-4 rounded-full bg-slate-800 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors z-30"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3.5 py-1 text-xs font-black text-amber-300 mb-2">
              <span>{sectorNames[activeTableModal.sector]}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Mesa {activeTableModal.id}
            </h3>
            <p className="text-xs text-amber-200 mt-1 font-semibold max-w-md mx-auto">
              👇 Haz clic en las sillas verdes o en los botones para elegirlas:
            </p>

            {/* Circular Banquet Table Visualization with 10 Stable Chairs (320px x 320px, Center: 160, 160) */}
            <div className="relative w-80 h-80 mx-auto my-4 flex items-center justify-center select-none">
              
              {/* Central Table Surface (Festive Navy Blue Tablecloth) */}
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 border-4 border-amber-400 shadow-2xl flex flex-col items-center justify-center text-white z-10 pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider">Bulevar</span>
                <span className="text-2xl font-black text-white">{activeTableModal.id}</span>
                <span className="text-[9px] text-amber-300 font-bold mt-0.5">10 Comensales</span>
              </div>

              {/* 10 Realistic Interactive Chairs with Rock-solid left/top positioning (NO TRANSFORM JITTER) */}
              {activeTableModal.seats.map((seat, i) => {
                const angle = (i * 360) / 10 - 90;
                const radius = 115; // px from center (160, 160)
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
                    className={`absolute h-12 w-12 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-black shadow-2xl ring-4 ring-amber-400/80 z-20'
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
                    <span className="text-[11px] font-black leading-none mt-0.5">{seat.number}</span>
                  </button>
                );
              })}
            </div>

            {/* Direct Quick 10-Chair Button Grid */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-left">
              <span className="text-[11px] font-bold text-slate-400 block mb-2 text-center sm:text-left">
                Lista de las 10 Sillas de la Mesa {activeTableModal.id}:
              </span>
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
                      className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-md'
                          : isTaken
                          ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800 line-through'
                          : 'bg-slate-950 text-slate-200 border border-slate-700 hover:border-emerald-400 hover:bg-emerald-950/40'
                      }`}
                    >
                      <span className="text-[10px] opacity-75">Silla</span>
                      <strong className="text-xs">#{seat.number}</strong>
                      <span className="text-[9px]">
                        {isSelected ? '✓ Elegida' : isTaken ? 'Ocupada' : 'Libre'}
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
                className="w-full sm:w-auto rounded-2xl bg-amber-500 hover:bg-amber-400 px-8 py-3 text-xs font-black text-slate-950 transition-all shadow-xl shadow-amber-500/30"
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
