import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import BreweryManager from './pages/BreweryManager';
import BeerManager from './pages/BeerManager';
import SponsorManager from './pages/SponsorManager';
import LookupManager from './pages/LookupManager';
import GastronomyManager from './pages/GastronomyManager';
import StageManager from './pages/StageManager';
import TavernManager from './pages/TavernManager';
import EventManager from './pages/EventManager';
import FacilityManager from './pages/FacilityManager';
import styles from './MasterDataPage.module.css';

const MasterDataPage = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Stammdatenpflege</h1>
        <nav className={styles.subNav}>
          <NavLink to="/admin/master-data/breweries" className={({isActive}) => isActive ? styles.active : ''}>Brauereien</NavLink>
          <NavLink to="/admin/master-data/beers" className={({isActive}) => isActive ? styles.active : ''}>Biere</NavLink>
          <NavLink to="/admin/master-data/sponsors" className={({isActive}) => isActive ? styles.active : ''}>Sponsoren</NavLink>
          <NavLink to="/admin/master-data/gastronomy" className={({isActive}) => isActive ? styles.active : ''}>Gastronomie</NavLink>
          <NavLink to="/admin/master-data/taverns" className={({isActive}) => isActive ? styles.active : ''}>Schenken</NavLink>
          <NavLink to="/admin/master-data/stages" className={({isActive}) => isActive ? styles.active : ''}>Bühnen</NavLink>
          <NavLink to="/admin/master-data/events" className={({isActive}) => isActive ? styles.active : ''}>Programm</NavLink>
          <NavLink to="/admin/master-data/facilities" className={({isActive}) => isActive ? styles.active : ''}>Einrichtungen</NavLink>
          <NavLink to="/admin/master-data/lookups" className={({isActive}) => isActive ? styles.active : ''}>Lookups</NavLink>
        </nav>
      </header>

      <div className={styles.content}>
        <Routes>
          <Route path="/" element={<Navigate to="breweries" replace />} />
          <Route path="breweries" element={<BreweryManager />} />
          <Route path="beers" element={<BeerManager />} />
          <Route path="sponsors" element={<SponsorManager />} />
          <Route path="gastronomy" element={<GastronomyManager />} />
          <Route path="taverns" element={<TavernManager />} />
          <Route path="stages" element={<StageManager />} />
          <Route path="events" element={<EventManager />} />
          <Route path="facilities" element={<FacilityManager />} />
          <Route path="lookups" element={<LookupManager />} />
        </Routes>
      </div>
    </div>
  );
};

export default MasterDataPage;