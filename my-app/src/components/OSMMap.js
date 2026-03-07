import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';



// Base icon setup (only used for the selected marker when not using divIcon)
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Two colored classic map pin icons
const currentIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const yellowIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const getStatusIcon = (status) => {
  if (status === "Resolved") return greenIcon;
  if (status === "In Progress") return yellowIcon;
  return redIcon; // Pending
};

// (Search control removed by request)

function ClickToMark({ onSet }) {
  useMapEvents({
    click(e) {
      onSet(e.latlng);
    },
  });
  return null;
}

export default function OSMMap({ height = 420, value, onChange, selectable = true }) {
  const [currentPos, setCurrentPos] = React.useState(null);
  const [selectedPos, setSelectedPos] = React.useState(value || { lat: 11.2588, lng: 75.7804 });
  const [posts, setPosts] = React.useState([]);

React.useEffect(() => {
  if (selectable) return; // only for TrackProgress page

  fetch("http://localhost:5001/api/map-posts")
    .then(res => res.json())
    .then(data => setPosts(data))
    .catch(err => console.error(err));
}, [selectable]);

  React.useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pnt = { lat: p.coords.latitude, lng: p.coords.longitude };
        setCurrentPos(pnt);
        // Initialize selected to current only once if not provided
        setSelectedPos((prev) => (value ? prev : pnt));
        onChange && onChange(value ? value : pnt);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange, value]);

  const handleSet = (ll) => {
    const pnt = { lat: ll.lat, lng: ll.lng };
    setSelectedPos(pnt);
    onChange && onChange(pnt);
  };

  const center = selectedPos || currentPos || { lat: 11.2588, lng: 75.7804 };

  return (
    <MapContainer center={center} zoom={14} style={{ width: '100%', height, borderRadius: 8 }} scrollWheelZoom>
      <TileLayer attribution='© OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {selectable && <ClickToMark onSet={handleSet} />}
      {/* {currentPos && <Marker position={currentPos} icon={currentIcon} />} */}
      {selectable && selectedPos && <Marker position={selectedPos} icon={selectedIcon} />}
      {!selectable &&
  posts.map((post) => {
    if (!post.mappointer) return null;

    const [lat, lng] = post.mappointer.split(",").map(Number);

    return (
      <Marker
        key={post.post_id}
        position={[lat, lng]}
        icon={getStatusIcon(post.status)}
      />
    );
  })}
    </MapContainer>
  );
}


