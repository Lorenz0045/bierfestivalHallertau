import React from 'react';
import { MapContainer, TileLayer, LayersControl, AttributionControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const BaseMap = ({ center = [48.50555, 11.75896], zoom = 17, children, className, style }) => {
    return (
        <MapContainer 
            center={center} 
            zoom={zoom} 
            className={className} 
            style={style}
            attributionControl={false} 
            zoomControl={false}
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