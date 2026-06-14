import { CircleMarker, MapContainer, TileLayer, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTokenColors } from "@/hooks/use-token-colors";

interface PropertyMapProps {
  lat: number;
  lon: number;
  address: string;
}

export function PropertyMap({ lat, lon, address }: PropertyMapProps) {
  const c = useTokenColors(["--redline", "--paper", "--ink"]);

  return (
    <div className="relative z-0 isolate h-64 w-full overflow-hidden rounded-[var(--r-lg)] border border-rule shadow">
      <MapContainer
        center={[lat, lon]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        {/* Light, desaturated basemap so the map sits inside the paper palette. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {/* Survey point: ink outer ring + paper ring + redline dot. */}
        <CircleMarker
          center={[lat, lon]}
          radius={9}
          pathOptions={{ color: c["--ink"], weight: 1, fillColor: c["--paper"], fillOpacity: 1 }}
        />
        <CircleMarker
          center={[lat, lon]}
          radius={5}
          pathOptions={{ color: c["--paper"], weight: 2, fillColor: c["--redline"], fillOpacity: 1 }}
        >
          <LeafletTooltip>{address}</LeafletTooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
