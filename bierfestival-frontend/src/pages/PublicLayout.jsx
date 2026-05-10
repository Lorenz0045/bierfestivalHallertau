import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navigation/Navbar';
import TopBar from '../components/Navigation/TopBar';

const PublicLayout = () => {
  const location = useLocation();
  const isMapPage = location.pathname === '/';

  return (
    <>
      <TopBar />
      <main style={isMapPage ? { paddingBottom: 0 } : undefined}>
        <Outlet />
      </main>
      <Navbar />
    </>
  );
};

export default PublicLayout;