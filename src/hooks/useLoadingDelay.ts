import { useEffect, useState } from "react";

/** Returns true for the first `ms` milliseconds after mount, then false. */
export function useLoadingDelay(ms = 300): boolean {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setIsLoading(false), ms);
    return () => clearTimeout(id);
  }, [ms]);
  return isLoading;
}
