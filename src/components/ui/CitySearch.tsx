import { useEffect, useRef, useState } from 'react';
import { PALESTINE_LOCATIONS, type PalestineLocation } from '../../data/palestineLocations';

interface Props {
  label?: string;
  value: string;
  onChange: (city: string, governorate: string) => void;
  error?: string;
  placeholder?: string;
}

export function CitySearch({ label, value, onChange, error, placeholder = 'ابحث عن مدينة أو قرية…' }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(0);

  useEffect(() => { setQuery(value); }, [value]);

  const matches: PalestineLocation[] = query.trim().length === 0
    ? []
    : PALESTINE_LOCATIONS.filter(l =>
        l.city.includes(query) || l.governorate.includes(query)
      ).slice(0, 12);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  function pick(loc: PalestineLocation) {
    onChange(loc.city, loc.governorate);
    setQuery(loc.city);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || matches.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, matches.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); pick(matches[focused]); }
    if (e.key === 'Escape')    { setOpen(false); }
  }

  const grouped = matches.reduce<Record<string, PalestineLocation[]>>((acc, loc) => {
    (acc[loc.governorate] ??= []).push(loc);
    return acc;
  }, {});

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {label && (
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </p>
      )}
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); setOpen(true); setFocused(0); }}
        onFocus={() => { if (query.trim()) setOpen(true); }}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 12,
          border: error ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
          color: '#0f172a',
          background: '#fff',
          fontFamily: 'inherit',
        }}
        dir="rtl"
        autoComplete="off"
      />
      {error && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>{error}</p>
      )}
      {open && matches.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          right: 0,
          left: 0,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 500,
          maxHeight: 280,
          overflowY: 'auto',
        }}>
          {Object.entries(grouped).map(([gov, locs]) => (
            <div key={gov}>
              <div style={{
                padding: '6px 12px 4px',
                fontSize: 10,
                fontWeight: 800,
                color: '#94a3b8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderBottom: '1px solid #f1f5f9',
              }}>
                {gov}
              </div>
              {locs.map((loc, i) => {
                const globalIdx = matches.indexOf(loc);
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); pick(loc); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 16px',
                      textAlign: 'right',
                      background: globalIdx === focused ? '#f0f9ff' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#0f172a',
                      fontFamily: 'inherit',
                    }}
                  >
                    {loc.city}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
