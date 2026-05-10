-- ============================================================
-- BUSPLAN FESTIVAL 2026 - UPDATE (INKL. FACILITY MAP-LINK)
-- ============================================================

-- 1. Neue Tabellenstrukturen anlegen
CREATE TABLE bus_line (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    line_number INT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    route_description TEXT,
    price_eur DECIMAL(4,2) -- Default entfernt, wird beim Insert gesetzt
);

CREATE TABLE bus_stop (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    facility_id BIGINT REFERENCES facility(id) ON DELETE SET NULL -- Referenz für den Lageplan
);

CREATE TABLE bus_departure (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bus_line_id BIGINT REFERENCES bus_line(id) ON DELETE CASCADE,
    bus_stop_id BIGINT REFERENCES bus_stop(id) ON DELETE CASCADE,
    direction VARCHAR(50) NOT NULL, -- 'HINFAHRT' oder 'RUECKFAHRT'
    departure_time TIMESTAMP(6) WITH TIME ZONE NOT NULL
);

-- ============================================================
-- DATEN INSERTS
-- ============================================================

-- 2. Festival-Haltestellen in Attenkirchen als Facility anlegen (Lageplan)
-- Hinweis: Falls deine alte Spalte "type VARCHAR(50)" noch existiert und NOT NULL ist, 
-- müsstest du diese hier evtl. noch im Insert mit 'BUS_STOP' ergänzen.
INSERT INTO facility (name, facility_type_id) VALUES
('Attenkirchen, Bhst. Kreisverkehr B 301', 3),
('Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 3),
('Attenkirchen, Kreisverkehr Hopfenstr.', 3),
('Attenkirchen, Kreisverkehr Nandlstädter Str.', 3),
('Attenkirchen, Kreisverkehr Nandlstädter Str. Behelfshaltestelle', 3);

-- 3. Buslinien anlegen (Preis explizit auf 4.00 € gesetzt)
INSERT INTO bus_line (line_number, name, route_description, price_eur) VALUES
(1, 'Linie 1', 'Mainburg - Au - Attenkirchen', 4.00),
(2, 'Linie 2', 'Freising - Zolling - Attenkirchen', 4.00),
(3, 'Linie 3', 'Allershausen - Palzing - Wolfersdorf - Attenkirchen', 4.00),
(4, 'Linie 4', 'Moosburg - Mauern - Nandlstadt - Attenkirchen', 4.00),
(5, 'Linie 5', 'Wolnzach - Attenkirchen', 4.00);

-- 4. Alle Haltestellen anlegen (Distinct List)
INSERT INTO bus_stop (name) VALUES
('Mainburg, Busbahnhof'),
('Rudelzhausen, Bhst. Pfarrhof'),
('Au, Bhst. Hopfenhalle'),
('Au, Bhst. Penny oder Rathaus'),
('Reichertshausen, Bhst. Kriegerdenkmal'),
('Attenkirchen, Bhst. Kreisverkehr B 301'),
('Freising, Regionalbahnhof Spur 1'),
('Freising, Bhst. Hofbräuhaus'),
('Tüntenhausen, Bhst.'),
('Zolling, Bhst. Freisinger Str.'),
('Thalham, BhSt. Ort'),
('Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.'),
('Allershausen, Bhst. Glonnterrassen'),
('Kirchdorf, Bhst.'),
('Palzing, Abzweigung Wolfersdorf'),
('Wolfersdorf, Bhst.'),
('Gütlsdorf, Bhst.'),
('Attenkirchen, Kreisverkehr Hopfenstr.'),
('Moosburg, Bahnhof'),
('Mauern, Bhst. Rathaus/Alter Wirt'),
('Hörgertshausen, Bhst. Rathaus'),
('Hausmehring, Bhst.'),
('Nandlstadt, Bhst. Marktstraße'),
('Attenkirchen, Kreisverkehr Nandlstädter Str.'),
('Attenkirchen, Kreisverkehr Nandlstädter Str. Behelfshaltestelle'),
('Wolnzach, Bhst. Hopfenmuseum'),
('Geroldshausen, Abzw. Kirchberg'),
('Dürnzhausen, Abzw. Kirchberg'),
('Sünzhausen, Bhst. Staatsstr. 2045'),
('Oberhaindlfing, Bhst.'),
('Unterhaindlfing, Bhst.')
ON CONFLICT DO NOTHING;

-- 5. Die neu angelegten Facilities mit den Bus-Stops verknüpfen
UPDATE bus_stop 
SET facility_id = f.id
FROM facility f
WHERE bus_stop.name = f.name 
  AND f.facility_type_id = 3;

-- 6. Abfahrten (Departures) per CTE importieren
WITH schedule_data (line_nr, stop_name, dir, dep_time) AS (
    VALUES
    -- ==========================================================
    -- LINIE 1: Mainburg - Au - Attenkirchen
    -- ==========================================================
    -- Freitag (12.06.2026) - Hinfahrt
    (1, 'Mainburg, Busbahnhof', 'HINFAHRT', '2026-06-12 18:20:00+02'::TIMESTAMP WITH TIME ZONE),
    (1, 'Mainburg, Busbahnhof', 'HINFAHRT', '2026-06-12 19:20:00+02'),
    (1, 'Mainburg, Busbahnhof', 'HINFAHRT', '2026-06-12 20:20:00+02'),
    (1, 'Rudelzhausen, Bhst. Pfarrhof', 'HINFAHRT', '2026-06-12 18:30:00+02'),
    (1, 'Rudelzhausen, Bhst. Pfarrhof', 'HINFAHRT', '2026-06-12 19:30:00+02'),
    (1, 'Rudelzhausen, Bhst. Pfarrhof', 'HINFAHRT', '2026-06-12 20:30:00+02'),
    (1, 'Au, Bhst. Hopfenhalle', 'HINFAHRT', '2026-06-12 18:35:00+02'),
    (1, 'Au, Bhst. Hopfenhalle', 'HINFAHRT', '2026-06-12 19:35:00+02'),
    (1, 'Au, Bhst. Hopfenhalle', 'HINFAHRT', '2026-06-12 20:35:00+02'),
    (1, 'Au, Bhst. Penny oder Rathaus', 'HINFAHRT', '2026-06-12 18:38:00+02'),
    (1, 'Au, Bhst. Penny oder Rathaus', 'HINFAHRT', '2026-06-12 19:38:00+02'),
    (1, 'Au, Bhst. Penny oder Rathaus', 'HINFAHRT', '2026-06-12 20:38:00+02'),
    (1, 'Reichertshausen, Bhst. Kriegerdenkmal', 'HINFAHRT', '2026-06-12 18:45:00+02'),
    (1, 'Reichertshausen, Bhst. Kriegerdenkmal', 'HINFAHRT', '2026-06-12 19:45:00+02'),
    (1, 'Reichertshausen, Bhst. Kriegerdenkmal', 'HINFAHRT', '2026-06-12 20:45:00+02'),
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'HINFAHRT', '2026-06-12 18:50:00+02'),
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'HINFAHRT', '2026-06-12 19:50:00+02'),
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'HINFAHRT', '2026-06-12 20:50:00+02'),
    -- Freitag (Rückfahrt -> Nacht auf Samstag)
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'RUECKFAHRT', '2026-06-12 23:00:00+02'),
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'RUECKFAHRT', '2026-06-13 00:15:00+02'),
    
    -- Samstag (13.06.2026) - Hinfahrt
    (1, 'Mainburg, Busbahnhof', 'HINFAHRT', '2026-06-13 15:00:00+02'),
    (1, 'Mainburg, Busbahnhof', 'HINFAHRT', '2026-06-13 16:00:00+02'),
    (1, 'Mainburg, Busbahnhof', 'HINFAHRT', '2026-06-13 17:00:00+02'),
    (1, 'Mainburg, Busbahnhof', 'HINFAHRT', '2026-06-13 18:00:00+02'),
    (1, 'Mainburg, Busbahnhof', 'HINFAHRT', '2026-06-13 19:00:00+02'),
    (1, 'Rudelzhausen, Bhst. Pfarrhof', 'HINFAHRT', '2026-06-13 15:10:00+02'),
    (1, 'Rudelzhausen, Bhst. Pfarrhof', 'HINFAHRT', '2026-06-13 16:10:00+02'),
    (1, 'Rudelzhausen, Bhst. Pfarrhof', 'HINFAHRT', '2026-06-13 17:10:00+02'),
    (1, 'Rudelzhausen, Bhst. Pfarrhof', 'HINFAHRT', '2026-06-13 18:10:00+02'),
    (1, 'Rudelzhausen, Bhst. Pfarrhof', 'HINFAHRT', '2026-06-13 19:10:00+02'),
    (1, 'Au, Bhst. Hopfenhalle', 'HINFAHRT', '2026-06-13 15:15:00+02'),
    (1, 'Au, Bhst. Hopfenhalle', 'HINFAHRT', '2026-06-13 16:15:00+02'),
    (1, 'Au, Bhst. Hopfenhalle', 'HINFAHRT', '2026-06-13 17:15:00+02'),
    (1, 'Au, Bhst. Hopfenhalle', 'HINFAHRT', '2026-06-13 18:15:00+02'),
    (1, 'Au, Bhst. Hopfenhalle', 'HINFAHRT', '2026-06-13 19:15:00+02'),
    (1, 'Au, Bhst. Penny oder Rathaus', 'HINFAHRT', '2026-06-13 15:18:00+02'),
    (1, 'Au, Bhst. Penny oder Rathaus', 'HINFAHRT', '2026-06-13 16:18:00+02'),
    (1, 'Au, Bhst. Penny oder Rathaus', 'HINFAHRT', '2026-06-13 17:18:00+02'),
    (1, 'Au, Bhst. Penny oder Rathaus', 'HINFAHRT', '2026-06-13 18:18:00+02'),
    (1, 'Au, Bhst. Penny oder Rathaus', 'HINFAHRT', '2026-06-13 19:18:00+02'),
    (1, 'Reichertshausen, Bhst. Kriegerdenkmal', 'HINFAHRT', '2026-06-13 15:25:00+02'),
    (1, 'Reichertshausen, Bhst. Kriegerdenkmal', 'HINFAHRT', '2026-06-13 16:25:00+02'),
    (1, 'Reichertshausen, Bhst. Kriegerdenkmal', 'HINFAHRT', '2026-06-13 17:25:00+02'),
    (1, 'Reichertshausen, Bhst. Kriegerdenkmal', 'HINFAHRT', '2026-06-13 18:25:00+02'),
    (1, 'Reichertshausen, Bhst. Kriegerdenkmal', 'HINFAHRT', '2026-06-13 19:25:00+02'),
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'HINFAHRT', '2026-06-13 15:30:00+02'),
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'HINFAHRT', '2026-06-13 16:30:00+02'),
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'HINFAHRT', '2026-06-13 17:30:00+02'),
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'HINFAHRT', '2026-06-13 18:30:00+02'),
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'HINFAHRT', '2026-06-13 19:30:00+02'),
    -- Samstag (Rückfahrt -> Nacht auf Sonntag)
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'RUECKFAHRT', '2026-06-13 20:45:00+02'),
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'RUECKFAHRT', '2026-06-13 21:50:00+02'),
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'RUECKFAHRT', '2026-06-13 22:55:00+02'),
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'RUECKFAHRT', '2026-06-14 00:00:00+02'), -- 24.00 Uhr
    (1, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'RUECKFAHRT', '2026-06-14 01:05:00+02'),


    -- ==========================================================
    -- LINIE 2: Freising - Zolling - Attenkirchen
    -- ==========================================================
    -- Freitag (12.06.2026)
    (2, 'Freising, Regionalbahnhof Spur 1', 'HINFAHRT', '2026-06-12 17:55:00+02'),
    (2, 'Freising, Regionalbahnhof Spur 1', 'HINFAHRT', '2026-06-12 19:00:00+02'),
    (2, 'Freising, Bhst. Hofbräuhaus', 'HINFAHRT', '2026-06-12 18:02:00+02'),
    (2, 'Freising, Bhst. Hofbräuhaus', 'HINFAHRT', '2026-06-12 19:07:00+02'),
    (2, 'Tüntenhausen, Bhst.', 'HINFAHRT', '2026-06-12 18:10:00+02'),
    (2, 'Tüntenhausen, Bhst.', 'HINFAHRT', '2026-06-12 19:15:00+02'),
    (2, 'Zolling, Bhst. Freisinger Str.', 'HINFAHRT', '2026-06-12 18:18:00+02'),
    (2, 'Zolling, Bhst. Freisinger Str.', 'HINFAHRT', '2026-06-12 19:23:00+02'),
    (2, 'Thalham, BhSt. Ort', 'HINFAHRT', '2026-06-12 18:25:00+02'),
    (2, 'Thalham, BhSt. Ort', 'HINFAHRT', '2026-06-12 19:28:00+02'),
    (2, 'Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 'HINFAHRT', '2026-06-12 18:30:00+02'),
    (2, 'Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 'HINFAHRT', '2026-06-12 19:32:00+02'),
    -- Freitag (Rückfahrt -> Nacht auf Samstag)
    (2, 'Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 'RUECKFAHRT', '2026-06-12 23:00:00+02'),
    (2, 'Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 'RUECKFAHRT', '2026-06-13 00:15:00+02'),
    
    -- Samstag (13.06.2026)
    (2, 'Freising, Regionalbahnhof Spur 1', 'HINFAHRT', '2026-06-13 15:40:00+02'),
    (2, 'Freising, Regionalbahnhof Spur 1', 'HINFAHRT', '2026-06-13 16:45:00+02'),
    (2, 'Freising, Regionalbahnhof Spur 1', 'HINFAHRT', '2026-06-13 17:50:00+02'),
    (2, 'Freising, Regionalbahnhof Spur 1', 'HINFAHRT', '2026-06-13 18:55:00+02'),
    (2, 'Freising, Bhst. Hofbräuhaus', 'HINFAHRT', '2026-06-13 15:47:00+02'),
    (2, 'Freising, Bhst. Hofbräuhaus', 'HINFAHRT', '2026-06-13 16:52:00+02'),
    (2, 'Freising, Bhst. Hofbräuhaus', 'HINFAHRT', '2026-06-13 17:57:00+02'),
    (2, 'Freising, Bhst. Hofbräuhaus', 'HINFAHRT', '2026-06-13 19:02:00+02'),
    (2, 'Tüntenhausen, Bhst.', 'HINFAHRT', '2026-06-13 15:55:00+02'),
    (2, 'Tüntenhausen, Bhst.', 'HINFAHRT', '2026-06-13 17:00:00+02'),
    (2, 'Tüntenhausen, Bhst.', 'HINFAHRT', '2026-06-13 18:05:00+02'),
    (2, 'Tüntenhausen, Bhst.', 'HINFAHRT', '2026-06-13 19:10:00+02'),
    (2, 'Zolling, Bhst. Freisinger Str.', 'HINFAHRT', '2026-06-13 16:03:00+02'),
    (2, 'Zolling, Bhst. Freisinger Str.', 'HINFAHRT', '2026-06-13 17:08:00+02'),
    (2, 'Zolling, Bhst. Freisinger Str.', 'HINFAHRT', '2026-06-13 18:13:00+02'),
    (2, 'Zolling, Bhst. Freisinger Str.', 'HINFAHRT', '2026-06-13 19:18:00+02'),
    (2, 'Thalham, BhSt. Ort', 'HINFAHRT', '2026-06-13 16:10:00+02'),
    (2, 'Thalham, BhSt. Ort', 'HINFAHRT', '2026-06-13 17:15:00+02'),
    (2, 'Thalham, BhSt. Ort', 'HINFAHRT', '2026-06-13 18:20:00+02'),
    (2, 'Thalham, BhSt. Ort', 'HINFAHRT', '2026-06-13 19:25:00+02'),
    (2, 'Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 'HINFAHRT', '2026-06-13 16:15:00+02'),
    (2, 'Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 'HINFAHRT', '2026-06-13 17:20:00+02'),
    (2, 'Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 'HINFAHRT', '2026-06-13 18:25:00+02'),
    (2, 'Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 'HINFAHRT', '2026-06-13 19:30:00+02'),
    -- Samstag (Rückfahrt -> Nacht auf Sonntag)
    (2, 'Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 'RUECKFAHRT', '2026-06-13 21:45:00+02'),
    (2, 'Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 'RUECKFAHRT', '2026-06-13 22:55:00+02'),
    (2, 'Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 'RUECKFAHRT', '2026-06-14 00:00:00+02'),
    (2, 'Attenkirchen, Bhst. Abzw. Dekan-Götz-Str.', 'RUECKFAHRT', '2026-06-14 01:05:00+02'),


    -- ==========================================================
    -- LINIE 3: Allershausen - Palzing - Wolfersdorf - Attenkirchen
    -- ==========================================================
    -- Freitag (12.06.2026)
    (3, 'Allershausen, Bhst. Glonnterrassen', 'HINFAHRT', '2026-06-12 18:15:00+02'),
    (3, 'Kirchdorf, Bhst.', 'HINFAHRT', '2026-06-12 18:25:00+02'),
    (3, 'Palzing, Abzweigung Wolfersdorf', 'HINFAHRT', '2026-06-12 18:30:00+02'),
    (3, 'Wolfersdorf, Bhst.', 'HINFAHRT', '2026-06-12 18:35:00+02'),
    (3, 'Gütlsdorf, Bhst.', 'HINFAHRT', '2026-06-12 18:45:00+02'),
    (3, 'Attenkirchen, Kreisverkehr Hopfenstr.', 'HINFAHRT', '2026-06-12 18:50:00+02'),
    -- Freitag (Rückfahrt -> Nacht auf Samstag)
    (3, 'Attenkirchen, Kreisverkehr Hopfenstr.', 'RUECKFAHRT', '2026-06-13 00:15:00+02'),
    
    -- Samstag (13.06.2026)
    (3, 'Allershausen, Bhst. Glonnterrassen', 'HINFAHRT', '2026-06-13 18:00:00+02'),
    (3, 'Kirchdorf, Bhst.', 'HINFAHRT', '2026-06-13 18:10:00+02'),
    (3, 'Palzing, Abzweigung Wolfersdorf', 'HINFAHRT', '2026-06-13 18:15:00+02'),
    (3, 'Wolfersdorf, Bhst.', 'HINFAHRT', '2026-06-13 18:20:00+02'),
    (3, 'Gütlsdorf, Bhst.', 'HINFAHRT', '2026-06-13 18:30:00+02'),
    (3, 'Attenkirchen, Kreisverkehr Hopfenstr.', 'HINFAHRT', '2026-06-13 18:35:00+02'),
    -- Samstag (Rückfahrt -> Nacht auf Sonntag)
    (3, 'Attenkirchen, Kreisverkehr Hopfenstr.', 'RUECKFAHRT', '2026-06-13 23:15:00+02'),
    (3, 'Attenkirchen, Kreisverkehr Hopfenstr.', 'RUECKFAHRT', '2026-06-14 01:00:00+02'),


    -- ==========================================================
    -- LINIE 4: Moosburg - Mauern - Nandlstadt - Attenkirchen
    -- ==========================================================
    -- Freitag (12.06.2026)
    (4, 'Moosburg, Bahnhof', 'HINFAHRT', '2026-06-12 18:15:00+02'),
    (4, 'Moosburg, Bahnhof', 'HINFAHRT', '2026-06-12 19:20:00+02'),
    (4, 'Mauern, Bhst. Rathaus/Alter Wirt', 'HINFAHRT', '2026-06-12 18:25:00+02'),
    (4, 'Mauern, Bhst. Rathaus/Alter Wirt', 'HINFAHRT', '2026-06-12 19:30:00+02'),
    (4, 'Hörgertshausen, Bhst. Rathaus', 'HINFAHRT', '2026-06-12 18:35:00+02'),
    (4, 'Hörgertshausen, Bhst. Rathaus', 'HINFAHRT', '2026-06-12 19:40:00+02'),
    (4, 'Hausmehring, Bhst.', 'HINFAHRT', '2026-06-12 18:40:00+02'),
    (4, 'Hausmehring, Bhst.', 'HINFAHRT', '2026-06-12 19:50:00+02'),
    (4, 'Nandlstadt, Bhst. Marktstraße', 'HINFAHRT', '2026-06-12 18:45:00+02'),
    (4, 'Nandlstadt, Bhst. Marktstraße', 'HINFAHRT', '2026-06-12 19:55:00+02'),
    (4, 'Attenkirchen, Kreisverkehr Nandlstädter Str.', 'HINFAHRT', '2026-06-12 18:55:00+02'),
    (4, 'Attenkirchen, Kreisverkehr Nandlstädter Str.', 'HINFAHRT', '2026-06-12 20:05:00+02'),
    -- Freitag (Rückfahrt -> Nacht auf Samstag)
    (4, 'Attenkirchen, Kreisverkehr Nandlstädter Str. Behelfshaltestelle', 'RUECKFAHRT', '2026-06-12 22:30:00+02'),
    (4, 'Attenkirchen, Kreisverkehr Nandlstädter Str. Behelfshaltestelle', 'RUECKFAHRT', '2026-06-13 00:15:00+02'),
    
    -- Samstag (13.06.2026)
    (4, 'Moosburg, Bahnhof', 'HINFAHRT', '2026-06-13 15:20:00+02'),
    (4, 'Moosburg, Bahnhof', 'HINFAHRT', '2026-06-13 16:35:00+02'),
    (4, 'Moosburg, Bahnhof', 'HINFAHRT', '2026-06-13 17:50:00+02'),
    (4, 'Mauern, Bhst. Rathaus/Alter Wirt', 'HINFAHRT', '2026-06-13 15:30:00+02'),
    (4, 'Mauern, Bhst. Rathaus/Alter Wirt', 'HINFAHRT', '2026-06-13 16:45:00+02'),
    (4, 'Mauern, Bhst. Rathaus/Alter Wirt', 'HINFAHRT', '2026-06-13 18:00:00+02'),
    (4, 'Hörgertshausen, Bhst. Rathaus', 'HINFAHRT', '2026-06-13 15:40:00+02'),
    (4, 'Hörgertshausen, Bhst. Rathaus', 'HINFAHRT', '2026-06-13 16:55:00+02'),
    (4, 'Hörgertshausen, Bhst. Rathaus', 'HINFAHRT', '2026-06-13 18:10:00+02'),
    (4, 'Hausmehring, Bhst.', 'HINFAHRT', '2026-06-13 15:45:00+02'),
    (4, 'Hausmehring, Bhst.', 'HINFAHRT', '2026-06-13 17:00:00+02'),
    (4, 'Hausmehring, Bhst.', 'HINFAHRT', '2026-06-13 18:15:00+02'),
    (4, 'Nandlstadt, Bhst. Marktstraße', 'HINFAHRT', '2026-06-13 15:50:00+02'),
    (4, 'Nandlstadt, Bhst. Marktstraße', 'HINFAHRT', '2026-06-13 17:05:00+02'),
    (4, 'Nandlstadt, Bhst. Marktstraße', 'HINFAHRT', '2026-06-13 18:20:00+02'),
    (4, 'Attenkirchen, Kreisverkehr Nandlstädter Str.', 'HINFAHRT', '2026-06-13 16:00:00+02'),
    (4, 'Attenkirchen, Kreisverkehr Nandlstädter Str.', 'HINFAHRT', '2026-06-13 17:15:00+02'),
    (4, 'Attenkirchen, Kreisverkehr Nandlstädter Str.', 'HINFAHRT', '2026-06-13 18:30:00+02'),
    -- Samstag (Rückfahrt -> Nacht auf Sonntag)
    (4, 'Attenkirchen, Kreisverkehr Nandlstädter Str. Behelfshaltestelle', 'RUECKFAHRT', '2026-06-13 21:30:00+02'),
    (4, 'Attenkirchen, Kreisverkehr Nandlstädter Str. Behelfshaltestelle', 'RUECKFAHRT', '2026-06-13 22:40:00+02'),
    (4, 'Attenkirchen, Kreisverkehr Nandlstädter Str. Behelfshaltestelle', 'RUECKFAHRT', '2026-06-14 01:00:00+02'),


    -- ==========================================================
    -- LINIE 5: Wolnzach - Attenkirchen
    -- ==========================================================
    -- Freitag (12.06.2026)
    (5, 'Wolnzach, Bhst. Hopfenmuseum', 'HINFAHRT', '2026-06-12 18:15:00+02'),
    (5, 'Geroldshausen, Abzw. Kirchberg', 'HINFAHRT', '2026-06-12 18:21:00+02'),
    (5, 'Dürnzhausen, Abzw. Kirchberg', 'HINFAHRT', '2026-06-12 18:26:00+02'),
    (5, 'Sünzhausen, Bhst. Staatsstr. 2045', 'HINFAHRT', '2026-06-12 18:31:00+02'),
    (5, 'Oberhaindlfing, Bhst.', 'HINFAHRT', '2026-06-12 18:36:00+02'),
    (5, 'Unterhaindlfing, Bhst.', 'HINFAHRT', '2026-06-12 18:38:00+02'),
    (5, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'HINFAHRT', '2026-06-12 18:45:00+02'),
    -- Freitag (Rückfahrt -> Nacht auf Samstag)
    (5, 'Attenkirchen, Kreisverkehr Hopfenstr.', 'RUECKFAHRT', '2026-06-13 00:15:00+02'),
    
    -- Samstag (13.06.2026)
    (5, 'Wolnzach, Bhst. Hopfenmuseum', 'HINFAHRT', '2026-06-13 15:30:00+02'),
    (5, 'Wolnzach, Bhst. Hopfenmuseum', 'HINFAHRT', '2026-06-13 19:05:00+02'),
    (5, 'Geroldshausen, Abzw. Kirchberg', 'HINFAHRT', '2026-06-13 15:36:00+02'),
    (5, 'Geroldshausen, Abzw. Kirchberg', 'HINFAHRT', '2026-06-13 19:11:00+02'),
    (5, 'Dürnzhausen, Abzw. Kirchberg', 'HINFAHRT', '2026-06-13 15:41:00+02'),
    (5, 'Dürnzhausen, Abzw. Kirchberg', 'HINFAHRT', '2026-06-13 19:16:00+02'),
    (5, 'Sünzhausen, Bhst. Staatsstr. 2045', 'HINFAHRT', '2026-06-13 15:46:00+02'),
    (5, 'Sünzhausen, Bhst. Staatsstr. 2045', 'HINFAHRT', '2026-06-13 19:21:00+02'),
    (5, 'Oberhaindlfing, Bhst.', 'HINFAHRT', '2026-06-13 15:51:00+02'),
    (5, 'Oberhaindlfing, Bhst.', 'HINFAHRT', '2026-06-13 19:26:00+02'),
    (5, 'Unterhaindlfing, Bhst.', 'HINFAHRT', '2026-06-13 15:53:00+02'),
    (5, 'Unterhaindlfing, Bhst.', 'HINFAHRT', '2026-06-13 19:28:00+02'),
    (5, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'HINFAHRT', '2026-06-13 16:00:00+02'),
    (5, 'Attenkirchen, Bhst. Kreisverkehr B 301', 'HINFAHRT', '2026-06-13 19:35:00+02'),
    -- Samstag (Rückfahrt -> Nacht auf Sonntag)
    (5, 'Attenkirchen, Kreisverkehr Hopfenstr.', 'RUECKFAHRT', '2026-06-13 21:30:00+02'),
    (5, 'Attenkirchen, Kreisverkehr Hopfenstr.', 'RUECKFAHRT', '2026-06-14 01:00:00+02')
)
INSERT INTO bus_departure (bus_line_id, bus_stop_id, direction, departure_time)
SELECT l.id, s.id, d.dir, d.dep_time
FROM schedule_data d
JOIN bus_line l ON l.line_number = d.line_nr
JOIN bus_stop s ON s.name = d.stop_name;