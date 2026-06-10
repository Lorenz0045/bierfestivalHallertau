import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import TopBeersAnalytics from './pages/analytics/TopBeersAnalytics';
import BeerDetailAnalytics from './pages/analytics/BeerDetailAnalytics';
import BreweryAnalytics from './pages/analytics/BreweryAnalytics';
import TavernAnalytics from './pages/analytics/TavernAnalytics';
import CityAnalytics from './pages/analytics/CityAnalytics';
import MasterDataAnalytics from './pages/analytics/MasterDataAnalytics';
import styles from './AnalyticsPage.module.css';

const AnalyticsPage = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Auswertungen</h1>
        <nav className={styles.subNav}>
          <NavLink to="/admin/analytics/top-beers" className={({isActive}) => isActive ? styles.active : ''}>Top Biere</NavLink>
          <NavLink to="/admin/analytics/beer-details" className={({isActive}) => isActive ? styles.active : ''}>Bierauswertungen</NavLink>
          <NavLink to="/admin/analytics/breweries" className={({isActive}) => isActive ? styles.active : ''}>Brauereien</NavLink>
          <NavLink to="/admin/analytics/taverns" className={({isActive}) => isActive ? styles.active : ''}>Schenken</NavLink>
          <NavLink to="/admin/analytics/cities" className={({isActive}) => isActive ? styles.active : ''}>Orte</NavLink>
          <NavLink to="/admin/analytics/master-data" className={({isActive}) => isActive ? styles.active : ''}>Stammdaten</NavLink>
        </nav>
      </header>

      <div className={styles.content}>
        <Routes>
          <Route path="/" element={<Navigate to="top-beers" replace />} />
          <Route path="top-beers" element={<TopBeersAnalytics />} />
          <Route path="beer-details" element={<BeerDetailAnalytics />} />
          <Route path="breweries" element={<BreweryAnalytics />} />
          <Route path="taverns" element={<TavernAnalytics />} />
          <Route path="cities" element={<CityAnalytics />} />
          <Route path="master-data" element={<MasterDataAnalytics />} />
        </Routes>
      </div>
    </div>
  );
};

export default AnalyticsPage;