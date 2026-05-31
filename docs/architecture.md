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
| **Datenbank** | PostgreSQL | Hosted bei app.hallertauer-bierfestival.de |
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
│  (Tracking +     │     │  (Admin only)      │
│   Retry Queue)   │     └───────────────────┘
└──────────────────┘
```

### Prinzipien
- **Mobile-First**: Die öffentliche App ist primär für Smartphone-Nutzer auf dem Festival konzipiert.
- **Offline-Resilient**: Stammdaten werden aggressiv im Frontend-Cache gehalten (`cacheService`). Tracking-Sync-Fehler werden silent in eine Retry-Queue gestellt.
- **Privacy-by-Design**: Tracking-Daten werden primär lokal im `localStorage` gespeichert. Die Synchronisation mit dem Backend erfolgt nur bei expliziter Zustimmung im Cookie-Banner (Kategorie "Festival Auswertung").

---

## Datenmodell

### Stammdaten (Masterdata)

| Entity | Tabelle | Beschreibung |
|--------|---------|--------------|
| `Brewery` | `brewery` | Brauereien mit Referenz zu City + District, Website, Logo |
| `Beer` | `beer` | Biere mit Referenz zu Brewery & BeerType, Alkohol, Stammwürze (°P), mehrzeilige Beschreibung (TEXT), `isNonAlcoholic` Flag |
| `Tavern` | `tavern` | Schenken (Ausschankstellen) auf dem Festival mit Koordinaten |
| `TavernBeer` | `tavern_beer` | M:N-Zuordnung Schenke↔Bier mit `sort_order` |
| `Gastronomy` | `gastronomy` | Gastronomie-Betriebe mit Typ, Referenz zu City, Koordinaten |
| `CraftMarket` | `craft_market` | Handwerkermärkte mit Beschreibung (TEXT), Website, Referenz zu City, Koordinaten, Icon |
| `Stage` | `stage` | Bühnen mit Koordinaten |
| `Event` | `event` | Programmpunkte mit Start/Ende (`LocalDateTime`), Tagesname, Bühne |
| `Facility` | `facility` | Einrichtungen (WC, Büro, Bushaltestelle) mit FacilityType |
| `Sponsor` | `sponsor` | Sponsoren mit Logo, Website, Referenz zu City |
| `BusLine` | `bus_line` | Buslinie mit Nummer, Name, Routenbeschreibung, Preis |
| `BusStop` | `bus_stop` | Bushaltestelle mit optionaler Referenz zu Facility (für Karten-Jump) |
| `BusDeparture` | `bus_departure` | Einzelne Abfahrt: Linie, Haltestelle, Richtung (HINFAHRT/RUECKFAHRT), Zeitstempel |

### Lookup-Tabellen

| Entity | Tabelle | API-Endpoint | Beschreibung |
|--------|---------|-------------|--------------|
| `BeerType` | `beer_type` | `/api/beer-types` | Biersorte (z.B. Helles, Weizen) |
| `FacilityType` | `facility_type` | `/api/facility-types` | Einrichtungsart (z.B. WC, Büro) mit Standard-Icon |
| `GastronomyType` | `gastronomy_type` | `/api/gastronomy-types` | Gastronomie-Kategorie |
| `City` | `city` | `/api/cities` | Orte (werden von Brewery, Sponsor, Gastronomy, CraftMarket referenziert) |
| `District` | `district` | `/api/districts` | Landkreise (werden von Brewery referenziert) |

> **Wichtig**: Ort und Landkreis sind normalisierte Lookup-Tabellen. Keine Entity speichert Ort/Landkreis als String-Feld. Stattdessen wird immer eine FK-Referenz (`city_id`, `district_id`) verwendet.

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
|   └── UI/                 # Wiederverwendbare UI-Elemente (BottomSheet, BeerCard, SponsorBanner, CookieBanner)
├── hooks/                  # Custom Hooks (useTracking)
├── pages/                  # Öffentliche Seiten (HomePage, SuchePage, AnreisePage, ProgrammPage, SchenkenPage, MeinBesuchPage, Legal-Pages)
└── services/               # API/Cache/Tracking/Device Services
```

### Wichtige Designentscheidungen

1. **GenericFormModal**: Ein einziger, konfigurierbarer Form-Modal wird für alle Admin-CRUD-Operationen verwendet. Die Feld-Konfiguration erfolgt deklarativ per Array (`type: 'text' | 'select' | 'checkbox' | 'image' | 'textarea' | 'number' | 'datetime-local'`).

   **Erweiterte Select-Features:**
   - **Suchfeld**: Bei > 5 Optionen erscheint automatisch ein Suchfilter über dem Select.
   - **Inline-Lookup-Erstellung**: Wenn ein Feld `lookupEndpoint` hat, wird ein `+`-Button neben dem Select angezeigt. Darüber kann direkt im Modal ein neuer Lookup-Wert erstellt werden (POST an `lookupEndpoint`).
   - **`onLookupCreated`-Callback**: Der Parent (Manager-Page) erhält den neu erstellten Eintrag und aktualisiert seine lokale Options-Liste sofort, ohne die gesamte Seite neu zu laden.

2. **Conditional Fields (`disabledWhen`)**: Formularfelder können über `disabledWhen: { field: 'isNonAlcoholic', value: true }` bedingt ausgegraut werden. Der Wert bleibt erhalten, wird aber nicht mehr editierbar.

3. **BottomSheet**: Wiederverwendbare Modal-Komponente mit optionalem Zurück-Pfeil (für Drilldown-Navigation Beer→Brewery) und Grab-Handle.

4. **cacheService**: Statische API-Daten werden beim ersten Abruf im `localStorage` gecacht und bei nachfolgenden Aufrufen sofort geliefert (kein Netzwerk-Roundtrip).

5. **Timestamps (LocalDateTime)**: Event-Zeiten werden im Backend als `LocalDateTime` (ohne Timezone) gespeichert und als ISO-String ohne `Z`-Suffix an das Frontend geliefert. Das Frontend darf diese **niemals** durch `new Date()` jagen, sondern muss sie als rohen String per `substring()` verarbeiten, um Timezone-Shifts zu vermeiden.

6. **Wiederverwendbare Kacheln (`EventItem` & `BeerCard`)**: Um Redundanzen zu vermeiden, werden für die Darstellung von Programmpunkten und Bieren einheitliche Komponenten verwendet. Diese werden in den Overlays (Lageplan, Schenken, Suche) sowie auf den Hauptseiten (`ProgrammPage`) gleichermaßen genutzt.

7. **Client-Side Data Enrichment (Offline-First)**: Da z.B. in der `Tavern` Entity nur eine flache Liste von Bieren ausgeliefert wird, lädt das Frontend an betroffenen Stellen (Schenken/Lageplan) parallel den `/api/beers` Endpoint via `cacheService` und reichert die Bier-Kacheln clientseitig mit den vollständigen Metadaten (wie Description, originalGravity) an, ohne zusätzliche Backend-Last zu erzeugen.

---

## Backend-Architektur

### Map-Daten

Vector Tiles Liegen als .pmtiles Datei ab und werden vom nginx proxy ausgeliefert (Range Requests) und dann 1 Jahr vom Client gecached.
Protomaps und leaflet rendern das ganze im react-frontend. Dort ist die URL zum server hart codiert.

Vector-Tile Daten können über protomaps runtergeladen werden: https://docs.protomaps.com/basemaps/downloads

Beispielcommand: pmtiles extract https://build.protomaps.com/20260524.pmtiles C:\Users\loren\Downloads\attenkirchen.pmtiles --maxzoom=16 --bbox=11.744,48.499,11.775,48.512

### REST-API Pattern

Jede Entity folgt einem einheitlichen Muster:

```
/api/{entity-plural}          GET    → Liste aller Einträge (PermitAll)
/api/{entity-plural}          POST   → Neuen Eintrag anlegen (admin)
/api/{entity-plural}/{id}     PUT    → Eintrag aktualisieren (admin)
/api/{entity-plural}/{id}     DELETE → Eintrag löschen (admin)
```

### DTO-Pattern

- **ReadDto** (`XyzDto`): Enthält aufgelöste Referenzen als verschachtelte `LookupDto` (z.B. `{ id: 1, name: "München" }` statt nur `city_id`).
- **WriteDto** (`XyzUpdateDto`): Enthält ID-Referenzen als `RefId`-Objekte (z.B. `city: { id: 42 }`).

### Lookup-Referenz-Pattern

Alle Lookup-FK-Referenzen (City, District, GastronomyType, BeerType) folgen dem gleichen Schema:

**Entity:**
```java
@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "city_id")
public City city;
```

**WriteDto:**
```java
public RefId city;
public static class RefId { public Long id; }
```

**mapDto:**
```java
if (dto.city != null && dto.city.id != null) {
    entity.city = City.findById(dto.city.id);
} else {
    entity.city = null;
}
```

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

### Retry-Queue (Offline-Resilient Sync)

Fehlgeschlagene Sync-Requests werden **silent** in eine `localStorage`-basierte Retry-Queue (`bierfestival_sync_queue`) geschrieben:

- **Trigger**: Netzwerkfehler oder HTTP 5xx Antworten.
- **Retry-Intervall**: 30 Sekunden.
- **Max. Versuche**: 20 (~10 Minuten).
- **4xx-Fehler**: Werden als permanente Fehler erkannt und nicht erneut versucht.
- **App-Start**: Beim Laden des `trackingService`-Moduls wird geprüft, ob noch Einträge in der Queue sind, und der Timer ggf. automatisch gestartet.
- **User-Sichtbarkeit**: **Keine**. Der User erhält niemals eine Fehlermeldung. Sync läuft vollständig im Hintergrund.

### Geschäftsregel

- Ein Bier darf erst bewertet werden, wenn mindestens ein lokaler `drinkTimestamp` existiert.
- Fällt der Counter auf 0 zurück (Minus-Button), wird eine vorhandene Bewertung automatisch gelöscht.

### Alkoholfrei-Logik

- Wenn `isNonAlcoholic === true`, wird das `alcoholPercentage`-Feld im Admin-Formular ausgegraut (nicht editierbar, Wert bleibt bestehen).
- In allen öffentlichen Anzeigen wird bei alkoholfreien Bieren **"< 0,5%"** statt des gespeicherten Werts angezeigt.

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
| `city` (FK) | **Ort** (Select-Dropdown mit Lookup) |
| `district` (FK) | **Landkreis** (Select-Dropdown mit Lookup) |
| `originalGravity` | **Stammwürze** (immer mit Einheit **°P**) |
| `alcoholPercentage` | **Alkoholgehalt** (immer mit Einheit **%**) |
| `description` (Beer) | **Beschreibung** (mehrzeilig, max 2000 Zeichen) |
| `isNonAlcoholic` | **Alkoholfrei** (Checkbox, beeinflusst Alkohol-Anzeige) |

### Lookup-Felder im GenericFormModal (Checkliste)

1. Im `formFields`-Array `type: 'select'`, `options: [...]` und `lookupEndpoint: '/api/...'` setzen.
2. Im Manager den State für die Lookup-Daten anlegen und im `loadData` mitladen.
3. Beim Bearbeiten das Item vorbereiten: `cityId: item.city?.id || ''`.
4. Im Submit das Format `city: { id: parseInt(formData.cityId) }` erzeugen.
5. `onLookupCreated`-Callback implementieren, der den neuen Eintrag in den lokalen State einfügt.

### Neuen Entity-Typ anlegen (Checkliste)

1. Entity-Klasse in `entity/masterdata/` erstellen (Panache)
2. Resource-Klasse in `resource/` erstellen (ReadDto, UpdateDto mit RefId, mapDto)
3. SQL-Migration in `bierfestival-db-queries/t_master_data` ergänzen
4. Frontend `Manager.jsx` in `admin/pages/` erstellen
5. In `MasterDataPage.jsx` importieren, NavLink + Route hinzufügen
6. Lookup-Daten (Cities, Districts, Types) im Manager-State laden
7. `onLookupCreated` implementieren

---

## Festival-Konfiguration

Die App ist so konzipiert, dass sie für zukünftige Festivals **ohne Code-Änderungen** wiederverwendet werden kann. Alle Festival-spezifischen Daten (Programm, Schenken, Biere, Bühnen, ...) werden über das Admin-Backend gepflegt.

**Aktuell**: Bierfestival Hallertau, 12.–14. Juni 2026 (Freitag bis Sonntag)

---

## Design-System (Redesign 2026)

### Farbpalette (basierend auf Logo)

| Variable | Wert | Verwendung |
|----------|------|------------|
| `--bf-primary-green` | `#54B947` | Primärfarbe, aktive Tabs, CTAs |
| `--bf-dark-green` | `#1B5E20` | Header-Gradient, Überschriften |
| `--bf-gold` | `#EEDB3C` | Rating-Krüge, Akzente |
| `--bf-accent-blue` | `#6478A8` | Alkoholfrei-Badge |
| `--bf-bg` | `#FAFAF5` | Warmer Off-White Hintergrund |

### Navigation

- **TopBar**: Dunkelgrün-Gradient, Logo links, Mein Besuch rechts (Gold bei aktiv).
- **Navbar**: 5 Tabs. Lageplan-Button ist erhöht in grünem Kreis.
- **Lazy Loading**: Nur Admin lazy. Öffentliche Seiten sofort verfügbar.

### Einheitlicher Seiten-Header

Alle Tabs (Suche, Anreise, Programm, Schenken) nutzen dasselbe Header-Pattern:
- Großes Icon (`headerIcon`, 2rem, grün)
- Titel (1.3rem, dunkelgrün, 700)
- Untertitel (0.8rem, grau)

### BeerCard-Komponente

Zentrale Kachel (`components/UI/BeerCard.jsx`), wiederverwendet überall:
- **Merken**: Bookmark-Toggle
- **Getrunken**: Plus/Minus-Counter
- **Bewertung**: 5 Bierkrüge (FaBeer), Gold wenn gefüllt. **Immer aktiv** – Bewertung erfordert KEIN vorheriges Trinken (UX-Entscheidung).
- **Schenke-Links**: Zeigt an, in welchen Schenken das Bier erhältlich ist. Jump-Button zur ersten Schenke auf der Karte.
- **Brauerei-Klick**: Öffnet Brauerei-Detail (BottomSheet mit Zurück-Pfeil).
- **Expand**: Beschreibung, Stammwürze, Details.

### Icon-Größen (Cards & Overlays)

- **Schenken & Bühnen**: 120×120px (`poiImgLarge`)
- **Alle anderen** (Gastro, Facilities, Marktstände, Sponsoren): 80×80px (`poiImgSmall`)
- **Ort-Cards** in Suche-Tab: 48×48px, `object-fit: contain`
- **Karten-Marker**: 44×44px (IconFactory)
- Alle Icons nutzen `object-fit: contain` mit Padding und grauem Hintergrund, damit hochgeladene quadratische Icons korrekt dargestellt werden.
- **Ausnahme: Lageplan** hier werden die Icons wie Original hochgeladen verwendet. Für potenzielles zukünftiges Styling kann: .imageIconInner in MapIcons.module.css verwendet werden.

### Overlay-Navigation (Stack-basiert)

Die SuchePage verwendet ein **Overlay-Stack**-Pattern:
- `overlayStack: [{type, data, title}]`
- Navigation: `pushOverlay()` → Drilldown, `popOverlay()` → Zurück
- Ein einzelnes `<BottomSheet>` rendert den obersten Stack-Eintrag
- Zurück-Pfeil erscheint automatisch bei Stack-Tiefe > 1
- `closeAllOverlays()` schließt alles

### Bühnen-Programm (Tagesaufteilung)

Sowohl in Lageplan-Overlays als auch in Suche-Overlays werden Bühnen-Events nach Tagen gruppiert:
- Sub-Komponente `StageEventsByDay` mit eigenen Day-Tabs
- Datum aus ISO-String via `substring(0,10)` extrahiert (kein Timezone-Shift)
- Chronologische Sortierung innerhalb eines Tages

### Namenskonventionen

| Alt | Neu |
|-----|-----|
| Handwerkerstand | **Marktstand** |
| Handwerkermarkt (Backend-Entity bleibt) | **Marktstand** (Frontend-Label) |

Die Backend-Entity heißt weiterhin `CraftMarket` / `craft-markets`, nur im Frontend wird einheitlich **Marktstand** angezeigt.

### SponsorBanner

Auto-Scroll alle 5s um 2 Logos, 4 sichtbar, pausiert bei Touch (8s Cooldown). Klick öffnet Detail-BottomSheet.

### Bus-API

| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/bus/lines` | GET | Alle Buslinien |
| `/api/bus/stops` | GET | Alle Haltestellen mit Facility-Referenz |
| `/api/bus/schedule` | GET | Vollständiger Fahrplan gruppiert nach Linie |

**Nachtfahrt-Regel**: 00:00–04:00 Uhr → Vortag.
**Rückfahrt**: Nur Abfahrtszeit + Karten-Jump-Button zur Haltestelle.

### Mein Besuch – Aggregation

- Tagesfilter mit Nachtfahrt-Regel
- Gemerkte/Bewertete/Getrunkene Biere
- Initial 5 Einträge, Mehr/Weniger-Button

### Kategorie-Icons (Suche-Tab)

Statt Emojis werden echte Icons aus `public/icons/` verwendet:
- `Bühne_ms.webp` für Bühnen
- `Gastro_os.webp` für Gastronomie
- `Marktstand.ms.webp` für Marktstände
- Schenken/Brauereien/Sponsoren nutzen ihre eigenen hochgeladenen Icons

---

## Admin-Architektur: GenericFormModal

### Datenerhalt bei Bearbeitung

`GenericFormModal` initialisiert `formData` mit **allen** Feldern aus `initialData` (Spread), nicht nur den im Formular sichtbaren. Dadurch bleiben Felder wie `lat`, `lon`, `type` etc. erhalten, auch wenn sie nicht im Formular bearbeitbar sind.

```javascript
const defaultData = initialData ? { ...initialData } : {};
```

Dies verhindert, dass beim Speichern nicht sichtbare Felder überschrieben/gelöscht werden.
