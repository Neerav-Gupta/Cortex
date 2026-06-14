/**
 * Lightweight loader for the Google Maps JS API.
 *
 * Loads the script once (subsequent calls reuse the same promise) and resolves
 * when `window.google.maps` is ready. The key comes from Vite env
 * (`VITE_GOOGLE_MAPS_API_KEY`); when it's absent the map falls back to a quiet
 * placeholder rather than throwing — search still works (census-backed).
 */

export const GOOGLE_MAPS_API_KEY: string | undefined = import.meta.env
  .VITE_GOOGLE_MAPS_API_KEY;

let loaderPromise: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window !== "undefined" && window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (loaderPromise) return loaderPromise;

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error("missing-google-maps-key"));
  }

  loaderPromise = new Promise((resolve, reject) => {
    // Use a global callback so the promise resolves only once `google.maps` is
    // fully populated. (With `loading=async`, the namespace isn't ready at the
    // script's `onload`, which is why a plain onload check fails.)
    const callbackName = "__cortexInitGoogleMaps";
    (window as unknown as Record<string, () => void>)[callbackName] = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("google-maps-load-failed"));
    };

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      v: "weekly",
      loading: "async",
      callback: callbackName,
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("google-maps-load-failed"));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

/**
 * Map style arrays that pull the basemap into the Fieldbook palette — muted,
 * low-saturation, ink-on-paper — so Google's default brand colors don't fight
 * the design system. One per theme.
 */
export const MAP_STYLE_LIGHT: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#ECECEC" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#84888C" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#F5F5F5" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#D7D7D5" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#E2E5E0" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FCFCFC" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#D7D7D5" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#E7E7E5" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#84888C" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#D9DEE2" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#84888C" }] },
];

export const MAP_STYLE_NIGHT: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#060708" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7F8082" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#020202" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#303133" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0C130C" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#0D0F11" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#303133" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#101315" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7F8082" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#04060A" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#7F8082" }] },
];
