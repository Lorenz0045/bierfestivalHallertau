import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import BreweryManager from './pages/BreweryManager';
import BeerManager from './pages/BeerManager';
import SponsorManager from './pages/SponsorManager';
import LookupManager from './pages/LookupManager';
import styles from './MasterDataPage.module.css';

const MasterDataPage = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Stammdatenpflege</h1>
        <nav className={styles.subNav}>
          <NavLink to="breweries" className={({isActive}) => isActive ? styles.active : ''}>Brauereien</NavLink>
          <NavLink to="beers" className={({isActive}) => isActive ? styles.active : ''}>Biere</NavLink>
          <NavLink to="sponsors" className={({isActive}) => isActive ? styles.active : ''}>Sponsoren</NavLink>
          <NavLink to="lookups" className={({isActive}) => isActive ? styles.active : ''}>Lookups</NavLink>
        </nav>
      </header>

      <div className={styles.content}>
        <Routes>
          <Route path="/" element={<Navigate to="breweries" replace />} />
          <Route path="breweries" element={<BreweryManager />} />
          <Route path="beers" element={<BeerManager />} />
          <Route path="sponsors" element={<SponsorManager />} />
          <Route path="lookups" element={<LookupManager />} />
        </Routes>
      </div>
    </div>
  );
};

export default MasterDataPage;