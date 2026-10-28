'use client';

import { useAutoLoad } from '@/lib/useAutoLoad';
import { useCallback, useState } from 'react';
import type { MesaEstado, MesasResumen } from '@/lib/entradas/types';

export type MesaPublica = Pick<
  MesaEstado,
  'id' | 'sector' | 'number' | 'capacity' | 'taken' | 'free' | 'isFull' | 'blocked' | 'label'
>;

// Estado de las mesas en vivo (se refresca solo).
export function useMesas(pollMs = 15000) {
  const [mesas, setMesas] = useState<MesaPublica[]>([]);
  const [resumen, setResumen] = useState<MesasResumen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/mesas', { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMesas(data.mesas);
      setResumen(data.resumen);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el croquis.');
    } finally {
      setLoading(false);
    }
  }, []);

  useAutoLoad(refresh, pollMs || undefined);

  return { mesas, resumen, error, loading, refresh };
}
