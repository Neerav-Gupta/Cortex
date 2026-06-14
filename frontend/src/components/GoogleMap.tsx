import { useEffect, useRef, useState } from "react";
import { Sym } from "@/components/ui/sym";
import { useTokenColors } from "@/hooks/use-token-colors";
import {
  GOOGLE_MAPS_API_KEY,
  MAP_STYLE_LIGHT,
  MAP_STYLE_NIGHT,
  loadGoogleMaps,
} from "@/lib/google-maps";

interface GoogleMapProps {
  /** Marker location + map center. When null, the map shows the default region. */
  lat: number | null;
  lon: number | null;
  /** Tooltip / accessible label for the survey point. */
  label?: string;
  className?: string;
}

/** Centre of the continental US — the resting view before an address is picked. */
const DEFAULT_CENTER = { lat: 39.5, lng: -98.35 };
const DEFAULT_ZOOM = 4;
const FOCUS_ZOOM = 15;

/**
 * A Google map skinned to the Fieldbook palette. The survey-point marker
 * (redline dot, paper ring, ink outer ring — §6.8) is drawn as an SVG icon so
 * it re-colors with the theme. Falls back to a quiet placeholder when no API
 * key is configured.
 */
/** Reads the current theme straight from <html data-theme> and stays in sync. */
function useThemeName(): "light" | "night" {
  const read = (): "light" | "night" =>
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "night"
      ? "night"
      : "light";

  const [theme, setTheme] = useState<"light" | "night">(read);

  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(read()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  return theme;
}

export function GoogleMap({ lat, lon, label, className }: GoogleMapProps) {
  const theme = useThemeName();
  const c = useTokenColors(["--redline", "--paper", "--ink", "--ink-3"]);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // One-time map init.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          keyboardShortcuts: false,
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-skin on theme change.
  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    mapRef.current.setOptions({
      styles: theme === "night" ? MAP_STYLE_NIGHT : MAP_STYLE_LIGHT,
    });
  }, [status, theme]);

  // Place / move the survey-point marker and pan to it.
  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.google?.maps) return;
    const maps = window.google.maps;
    const map = mapRef.current;

    if (lat == null || lon == null) {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
      return;
    }

    const position = { lat, lng: lon };
    // Survey point: ink outer ring → paper ring → redline core.
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r="9" fill="${c["--paper"]}" stroke="${c["--ink"]}" stroke-width="1"/>
        <circle cx="13" cy="13" r="5" fill="${c["--redline"]}" stroke="${c["--paper"]}" stroke-width="2"/>
      </svg>`;
    const icon: google.maps.Icon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new maps.Size(26, 26),
      anchor: new maps.Point(13, 13),
    };

    if (!markerRef.current) {
      markerRef.current = new maps.Marker({ map, position, icon, title: label });
    } else {
      markerRef.current.setOptions({ position, icon, title: label });
      markerRef.current.setMap(map);
    }

    map.panTo(position);
    map.setZoom(FOCUS_ZOOM);
  }, [status, lat, lon, label, c]);

  if (status === "error") {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-[var(--r-lg)] border border-rule bg-paper-2 p-8 text-center ${className ?? ""}`}
      >
        <Sym name="map" lg className="text-ink-3" />
        <p className="max-w-xs text-sm text-ink-2">
          {GOOGLE_MAPS_API_KEY
            ? "Couldn't load the map. Search still works on the right."
            : "Map needs a Google Maps key. Set VITE_GOOGLE_MAPS_API_KEY to enable it — search still works on the right."}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative isolate overflow-hidden rounded-[var(--r-lg)] border border-rule shadow ${className ?? ""}`}
    >
      <div ref={containerRef} className="h-full w-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-paper-2">
          <Sym name="progress_activity" className="animate-spin text-ink-3" />
        </div>
      )}
    </div>
  );
}
