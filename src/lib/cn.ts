import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names safely. `clsx` handles conditionals; `twMerge` dedupes
 * conflicting utility classes (kept for safety even while Tailwind is dormant).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
