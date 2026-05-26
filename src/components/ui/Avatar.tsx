import {
  forwardRef,
  useState,
  type HTMLAttributes,
} from "react";
import { cn } from "../../lib/cn";
import styles from "./Avatar.module.css";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square";
export type AvatarTone = "accent" | "neutral";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Size of the avatar. Defaults to `"md"`. */
  size?: AvatarSize;
  /** User display name — used to derive initials and as default `alt`. */
  name?: string;
  /** Image URL. Falls back to initials if missing or fails to load. */
  src?: string;
  /** Image `alt` text. Falls back to `name`. */
  alt?: string;
  /** Shape of the avatar. Defaults to `"circle"`. */
  shape?: AvatarShape;
  /** Background tone when showing initials. Defaults to `"accent"`. */
  tone?: AvatarTone;
}

/**
 * Derive initials from a name: first letter of the first 1-2 whitespace-
 * separated words, uppercased. Returns "?" when name is missing/blank.
 */
function getInitials(name?: string): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0].charAt(0);
  const second = words.length > 1 ? words[1].charAt(0) : "";
  return (first + second).toUpperCase();
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  {
    size = "md",
    name,
    src,
    alt,
    shape = "circle",
    tone = "accent",
    className,
    ...rest
  },
  ref,
) {
  const [imgError, setImgError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setImgError(false);
  }

  const showImage = Boolean(src) && !imgError;
  const initials = getInitials(name);

  return (
    <span
      ref={ref}
      className={cn(
        styles.avatar,
        styles[`size_${size}`],
        styles[`shape_${shape}`],
        // Tone styles drive the initials fallback background; harmless behind images.
        styles[`tone_${tone}`],
        className,
      )}
      {...rest}
    >
      {showImage ? (
        <img
          className={styles.image}
          src={src}
          alt={alt ?? name ?? ""}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={styles.initials} aria-label={name || "User"}>
          {initials}
        </span>
      )}
    </span>
  );
});
