import { useCallback, useEffect, useRef } from 'react';

export interface RequestGuard {
  /** Starts a new request generation and invalidates every older one. */
  begin(): number;
  /** Generation of the latest request, without invalidating anything. */
  current(): number;
  /** True while the component is mounted and no newer request has started. */
  isCurrent(generation: number): boolean;
}

export function useRequestGuard(): RequestGuard {
  const generation = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const begin = useCallback(() => {
    generation.current += 1;
    return generation.current;
  }, []);
  const current = useCallback(() => generation.current, []);
  const isCurrent = useCallback(
    (value: number) => mounted.current && generation.current === value,
    [],
  );

  return { begin, current, isCurrent };
}
