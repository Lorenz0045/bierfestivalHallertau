import React from 'react';
import { MapContainer, TileLayer, LayersControl, AttributionControl } from 'react-leaflet';
import { createLayerComponent } from '@react-leaflet/core';
import * as protomapsL from 'protomaps-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Approximate bounds for the festival area (Hallertau center +/- 0.02 degrees)
// This restricts the visible map area and saves Map API tiles/tokens.
const FESTIVAL_BOUNDS = L.latLngBounds(
    [48.50526, 11.75660], // South West 48.49950184977375, 11.747427129572412 // 48.50396659022299, 11.755612083985735 // 48.505260100155766, 11.756601807429128
    [48.50740, 11.76023]  // North East 48.51183197823702, 11.766351596755545 //  48.50740418106468, 11.760225854250459
);

const PMTILES_URL = "https://app.hallertauer-bierfestival.de/mapdata/attenkirchen.pmtiles";

/**
 * Native React-Leaflet Komponente erstellen aus dem Protomaps-Plugin.
 * Das ist notwendig, damit die LayersControl von React-Leaflet diesen Layer 
 * korrekt ein- und ausschalten kann.
 */
const PMTilesLayer = createLayerComponent(
    function createLayer(props, context) {
        const layer = protomapsL.leafletLayer({
            url: props.url,
            flavor: props.flavor || 'light', // Du kannst hier auch 'dark', 'grayscale' etc. übergeben
            lang: props.lang || 'de',
            attribution: props.attribution
        });
        return { instance: layer, context };
    },
    function updateLayer(instance, props, prevProps) {
        // Hier könnten dynamische Updates von Props (wie URL-Änderungen) behandelt werden.
        // Für statische Karten-URLs im Regelbetrieb nicht zwingend notwendig.
    }
);
// center // 48.50625898173736, 11.758379007005969
const BaseMap = ({ center = [48.50626, 11.75838], zoom = 19, children, className, style }) => {
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
            minZoom={19}
        >
            <AttributionControl prefix={false} position="bottomleft" />

            <PMTilesLayer
                url={PMTILES_URL}
                flavor="light"
                attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Hier werden später Marker, Polygone etc. reingereicht */}
            {children}
        </MapContainer>
    );
};

export default BaseMap;