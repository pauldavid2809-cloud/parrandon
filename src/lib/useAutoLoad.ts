'use client';

import { useEffect, useRef } from 'react';

// Ejecuta una carga al montar (en el siguiente tick, no dentro del render del efecto)
// y, si se indica, la repite cada `everyMs`. Siempre usa la versión más reciente de `load`.
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
    const id = everyMs ? setInterval(run, everyMs) : undefined;
    return () => {
      clearTimeout(first);
      if (id) clearInterval(id);
    };
  }, [everyMs]);
}
