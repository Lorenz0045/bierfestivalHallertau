import React from 'react';
import { MapContainer, TileLayer, LayersControl, AttributionControl } from 'react-leaflet';
import { createLayerComponent } from '@react-leaflet/core';
import * as protomapsL from 'protomaps-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Approximate bounds for the festival area (Hallertau center +/- 0.02 degrees)
// This restricts the visible map area and saves Map API tiles/tokens.
const FESTIVAL_BOUNDS = L.latLngBounds(
    [48.49950, 11.74742], // South West 48.49950184977375, 11.747427129572412
    [48.51183, 11.76635]  // North East 48.51183197823702, 11.766351596755545
);

const PMTILES_URL = "https://qordio.de/mapdata/attenkirchen.pmtiles";

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
            minZoom={16}
        >
            <AttributionControl prefix={false} position="bottomleft" />

            <LayersControl position="topright">

                <LayersControl.BaseLayer checked name="Self-Hosted (Flavor: Light)">
                    <PMTilesLayer
                        url={PMTILES_URL}
                        flavor="light"
                        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Self-Hosted (Flavor: Dark)">
                    <PMTilesLayer
                        url={PMTILES_URL}
                        flavor="dark"
                        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Self-Hosted (Flavor: Grayscale)">
                    <PMTilesLayer
                        url={PMTILES_URL}
                        flavor="grayscale"
                        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Self-Hosted (Flavor: Black)">
                    <PMTilesLayer
                        url={PMTILES_URL}
                        flavor="black"
                        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Self-Hosted (Flavor: White)">
                    <PMTilesLayer
                        url={PMTILES_URL}
                        flavor="white"
                        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                </LayersControl.BaseLayer>

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