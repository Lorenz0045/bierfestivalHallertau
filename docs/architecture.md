# Bierfestival Hallertau – Architektur-Dokumentation

## Inhaltsverzeichnis

1. [Technologie-Stack](#technologie-stack)
2. [Architektur-Überblick](#architektur-überblick)
3. [Datenmodell](#datenmodell)
4. [Frontend-Architektur](#frontend-architektur)
5. [Backend-Architektur](#backend-architektur)
6. [Tracking & Datenschutz (DSGVO)](#tracking--datenschutz-dsgvo)
7. [Caching-Strategie](#caching-strategie)
8. [Konventionen & Patterns](#konventionen--patterns)

---

## Technologie-Stack

| Schicht | Technologie | Version/Details |
|---------|-------------|-----------------|
| **Frontend** | React + Vite | SPA, Mobile-First |
| **Styling** | CSS Modules | Pro Komponente isoliert |
| **Backend** | Quarkus (Java) | REST-API, Panache ORM |
| **Datenbank** | PostgreSQL | Hosted bei qordio.de |
| **Auth** | Keycloak | JWT-basiert, nur Admin-Bereich |
| **Karte** | Leaflet (React-Leaflet) | OpenStreetMap Tiles |
| **Deployment** | Docker Compose + Nginx | Multi-Container Setup |

---

## Architektur-Überblick

```
┌──────────────────┐     ┌───────────────────┐     ┌──────────────┐
│  React Frontend  │────▶│  Quarkus Backend   │────▶│  PostgreSQL  │
│  (Vite SPA)      │◀────│  (REST API)        │◀────│  Database    │
└──────────────────┘     └───────────────────┘     └──────────────┘
        │                        │
        ▼                        ▼
┌──────────────────┐     ┌───────────────────┐
│  LocalStorage    │     │  Keycloak (Auth)   │
│  (Tracking)      │     │  (Admin only)      │
└──────────────────┘     └───────────────────┘
```

### Prinzipien
- **Mobile-First**: Die öffentliche App ist primär für Smartphone-Nutzer auf dem Festival konzipiert.
- **Offline-Resilient**: Stammdaten werden aggressiv im Frontend-Cache gehalten (`cacheService`).
- **Privacy-by-Design**: Tracking-Daten werden primär lokal im `localStorage` gespeichert. Die Synchronisation mit dem Backend erfolgt nur bei expliziter Zustimmung im Cookie-Banner (Kategorie "Festival Auswertung").

---

## Datenmodell

### Stammdaten (Masterdata)

| Entity | Tabelle | Beschreibung |
|--------|---------|--------------|
| `Brewery` | `brewery` | Brauereien mit Ort, Landkreis, Website, Logo |
| `Beer` | `beer` | Biere mit Referenz zu Brewery & BeerType, Alkohol, Stammwürze (°P), mehrzeilige Beschreibung (TEXT) |
| `Tavern` | `tavern` | Schenken (Ausschankstellen) auf dem Festival mit Koordinaten |
| `TavernBeer` | `tavern_beer` | M:N-Zuordnung Schenke↔Bier mit `sort_order` |
| `Gastronomy` | `gastronomy` | Gastronomie-Betriebe mit Typ, Koordinaten |
| `CraftMarket` | `craft_market` | Handwerkermärkte mit Beschreibung (TEXT), Website, Koordinaten, Icon |
| `Stage` | `stage` | Bühnen mit Koordinaten |
| `Event` | `event` | Programmpunkte mit Start/Ende (`LocalDateTime`), Tagesname, Bühne |
| `Facility` | `facility` | Einrichtungen (WC, Büro, Bushaltestelle) mit FacilityType |
| `Sponsor` | `sponsor` | Sponsoren mit Logo, Website |

### Lookup-Tabellen

| Entity | Tabelle | Beschreibung |
|--------|---------|--------------|
| `BeerType` | `beer_type` | Biersorte (z.B. Helles, Weizen) |
| `FacilityType` | `facility_type` | Einrichtungsart (z.B. WC, Büro) mit Standard-Icon |
| `GastronomyType` | `gastronomy_type` | Gastronomie-Kategorie |

### Tracking-Tabellen

| Entity | Tabelle | Beschreibung |
|--------|---------|--------------|
| `UserBeerInteraction` | `user_beer_interaction` | Merkliste, Rating pro `device_id` + `beer_id` |
| `UserDrinkEvent` | `user_drink_event` | Einzelne Trink-Zeitstempel pro `device_id` + `beer_id` |

---

## Frontend-Architektur

### Verzeichnisstruktur

```
src/
├── admin/                  # Admin-Bereich (Keycloak-geschützt)
│   ├── components/         # Wiederverwendbare Admin-Komponenten (DataTable, GenericFormModal)
│   ├── contexts/           # UserContext (Keycloak-Instance)
│   └── pages/              # Ein Manager pro Entity (BeerManager, BreweryManager, ...)
├── components/
│   ├── map/                # Leaflet-Komponenten (BaseMap, IconFactory)
│   ├── Navigation/         # Navbar (Bottom), TopBar
│   └── UI/                 # Wiederverwendbare UI-Elemente (BottomSheet, CookieBanner, ScrollToTop)
├── hooks/                  # Custom Hooks (useTracking)
├── pages/                  # Öffentliche Seiten (HomePage, ProgrammPage, SchenkenPage)
└── services/               # API/Cache/Tracking/Device Services
```

### Wichtige Designentscheidungen

1. **GenericFormModal**: Ein einziger, konfigurierbarer Form-Modal wird für alle Admin-CRUD-Operationen verwendet. Die Feld-Konfiguration erfolgt deklarativ per Array (`type: 'text' | 'select' | 'checkbox' | 'image' | 'textarea' | 'number' | 'datetime-local'`).

2. **BottomSheet**: Ausgelagerte, wiederverwendbare Modal-Komponente (`components/UI/BottomSheet.jsx`) für alle Overlay-Darstellungen.

3. **cacheService**: Statische API-Daten werden beim ersten Abruf im `localStorage` gecacht und bei nachfolgenden Aufrufen sofort geliefert (kein Netzwerk-Roundtrip).

4. **Timestamps (LocalDateTime)**: Event-Zeiten werden im Backend als `LocalDateTime` (ohne Timezone) gespeichert und als ISO-String ohne `Z`-Suffix an das Frontend geliefert. Das Frontend darf diese **niemals** durch `new Date()` jagen, sondern muss sie als rohen String per `substring()` verarbeiten, um Timezone-Shifts zu vermeiden.

---

## Backend-Architektur

### REST-API Pattern

Jede Entity folgt einem einheitlichen Muster:

```
/api/{entity-plural}          GET    → Liste aller Einträge (PermitAll)
/api/{entity-plural}          POST   → Neuen Eintrag anlegen (admin)
/api/{entity-plural}/{id}     PUT    → Eintrag aktualisieren (admin)
/api/{entity-plural}/{id}     DELETE → Eintrag löschen (admin)
```

### DTO-Pattern

- **ReadDto** (`XyzDto`): Enthält aufgelöste Referenzen (z.B. `BreweryDto` statt nur `brewery_id`).
- **WriteDto** (`XyzCreateUpdateDto` / `XyzUpdateDto`): Enthält ID-Referenzen für verknüpfte Entities (z.B. `{ id: 42 }`).

### FileService

Bilder werden über `/api/admin/uploads/image` hochgeladen. Der `FileService` verwaltet das physische Löschen alter Bilder beim Update/Delete.

---

## Tracking & Datenschutz (DSGVO)

### Cookie-Banner Kategorien

| Kategorie | localStorage-Key | Beschreibung |
|-----------|------------------|-------------|
| **Notwendig** | `necessary: true` (immer) | Lokale Datenspeicherung für "Mein Festivalbesuch", Geo-Location (nach Browser-Freigabe) |
| **Festival Auswertung** | `festivalSync: true` | Anonyme Synchronisation von Trink- und Bewertungsdaten mit dem Backend (für Bier-Kür) |
| **Marketing** | `marketing: true` | Google Analytics 4 |

### Tracking-Fluss

1. **Immer lokal**: Alle Interaktionen (Merken, Getrunken, Bewerten) werden sofort im `localStorage` unter `bierfestival_tracking` gespeichert.
2. **Optional sync**: Nur wenn `festivalSync === true`, wird ein Fire-and-Forget Request an `/api/tracking/{beerId}/...` gesendet.
3. **Device-ID**: Anonyme UUIDv4 (`deviceId`), gespeichert im `localStorage` über den `deviceService`.
4. **Kein Auto-Restore**: Es wird bewusst kein Server→Client Sync durchgeführt. Die Daten leben und sterben mit dem Browser des Geräts.

### Geschäftsregel

- Ein Bier darf erst bewertet werden, wenn mindestens ein lokaler `drinkTimestamp` existiert.
- Fällt der Counter auf 0 zurück (Minus-Button), wird eine vorhandene Bewertung automatisch gelöscht.

---

## Caching-Strategie

Der `cacheService.js` cached alle statischen API-Daten (Schenken, Biere, Events, ...) im `localStorage`:

```javascript
fetchCachedData('/api/taverns') → localStorage['cache_/api/taverns']
```

- **TTL**: Konfigurierbar (Standard: Session-basiert).
- **Zweck**: Minimierung des Datenverkehrs auf dem Festival (schlechtes Mobilfunknetz).

---

## Konventionen & Patterns

### Namensgebung

| Kontext | Konvention | Beispiel |
|---------|------------|---------|
| Java Entity | PascalCase Singular | `CraftMarket.java` |
| DB Tabelle | snake_case Singular | `craft_market` |
| REST Endpoint | kebab-case Plural | `/api/craft-markets` |
| React Page | PascalCase + `Page` | `SchenkenPage.jsx` |
| Admin Manager | PascalCase + `Manager` | `CraftMarketManager.jsx` |
| CSS Module | camelCase | `styles.beerItem` |

### UI-Labels (Deutsch)

| Backend-Feld | Frontend-Label |
|-------------|---------------|
| `region` | **Landkreis** (nicht "Region") |
| `originalGravity` | **Stammwürze** (immer mit Einheit **°P**) |
| `alcoholPercentage` | **Alkoholgehalt** (immer mit Einheit **%**) |
| `description` (Beer) | **Beschreibung** (mehrzeilig, max 2000 Zeichen) |

### Neuen Entity-Typ anlegen (Checkliste)

1. Entity-Klasse in `entity/masterdata/` erstellen (Panache)
2. Resource-Klasse in `resource/` erstellen (DTO + CRUD)
3. SQL-Migration in `bierfestival-db-queries/t_master_data` ergänzen
4. Frontend `Manager.jsx` in `admin/pages/` erstellen
5. In `MasterDataPage.jsx` importieren, NavLink + Route hinzufügen
6. **Diese Dokumentation aktualisieren!**

---

## Festival-Konfiguration

Die App ist so konzipiert, dass sie für zukünftige Festivals **ohne Code-Änderungen** wiederverwendet werden kann. Alle Festival-spezifischen Daten (Programm, Schenken, Biere, Bühnen, ...) werden über das Admin-Backend gepflegt.

**Aktuell**: Bierfestival Hallertau, 12.–14. Juni 2026 (Freitag bis Sonntag)
