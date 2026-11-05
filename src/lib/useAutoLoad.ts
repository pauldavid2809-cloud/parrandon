'use client';

import { useEffect, useRef } from 'react';

// Ejecuta una carga al montar (en el siguiente tick, no dentro del render del efecto)
// y, si se indica, la repite cada `everyMs`. Siempre usa la versión más reciente de `load`.
// Mientras la pantalla no se ve (otra pestaña, teléfono bloqueado) no se repite: cada vuelta
// gasta datos de Supabase. Al volver a verse, carga en el momento y sigue.
export function useAutoLoad(load: () => unknown, everyMs?: number) {
  const ref = useRef(load);
  useEffect(() => {
    ref.current = load;
  }, [load]);
  useEffect(() => {
    const run = () => {
      ref.current();
    };
    const first = setTimeout(run, 0);
    if (!everyMs) return () => clearTimeout(first);

    let id: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (!id) id = setInterval(run, everyMs);
    };
    const stop = () => {
      if (id) clearInterval(id);
      id = undefined;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else if (!id) {
        run();
        start();
      }
    };
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(first);
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [everyMs]);
}
