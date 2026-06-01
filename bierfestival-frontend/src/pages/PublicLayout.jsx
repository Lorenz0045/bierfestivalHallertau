import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navigation/Navbar';
import TopBar from '../components/Navigation/TopBar';

const PublicLayout = () => {
  
  return (
    <>
      <TopBar />
      <main>
        <Outlet />
      </main>
      <Navbar />
    </>
  );
};

export default PublicLayout;