import { CircleMarker, MapContainer, TileLayer, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface PropertyMapProps {
  lat: number;
  lon: number;
  address: string;
}

export function PropertyMap({ lat, lon, address }: PropertyMapProps) {
  return (
    <div className="relative z-0 isolate h-64 w-full overflow-hidden rounded-lg border border-border">
      <MapContainer
        center={[lat, lon]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <CircleMarker
          center={[lat, lon]}
          radius={10}
          pathOptions={{ color: "#2dd4bf", fillColor: "#2dd4bf", fillOpacity: 0.6, weight: 2 }}
        >
          <LeafletTooltip>{address}</LeafletTooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
