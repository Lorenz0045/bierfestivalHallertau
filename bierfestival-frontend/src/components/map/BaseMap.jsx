import React from 'react';
import { MapContainer, TileLayer, LayersControl, AttributionControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Approximate bounds for the festival area (Hallertau center +/- 0.02 degrees)
// This restricts the visible map area and saves Map API tiles/tokens.
const FESTIVAL_BOUNDS = L.latLngBounds(
    [48.48555, 11.73896], // South West
    [48.52555, 11.77896]  // North East
);

const BaseMap = ({ center = [48.50555, 11.75896], zoom = 17, children, className, style }) => {
    return (
        <MapContainer 
            center={center} 
            zoom={zoom} 
            className={className} 
            style={style}
            attributionControl={false} 
            zoomControl={false}
            maxBounds={FESTIVAL_BOUNDS}
            maxBoundsViscosity={1.0}
            minZoom={15}
        >
            <AttributionControl prefix={false} position="bottomleft" />
            
            <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Straßenkarte">
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxNativeZoom={19}
                        maxZoom={25}
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellit">
                    <TileLayer
                        attribution='Tiles &copy; Esri'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        maxNativeZoom={18} 
                        maxZoom={25}
                    />
                </LayersControl.BaseLayer>
            </LayersControl>

            {/* Hier werden später Marker, Polygone etc. reingereicht */}
            {children}
        </MapContainer>
    );
};

export default BaseMap;