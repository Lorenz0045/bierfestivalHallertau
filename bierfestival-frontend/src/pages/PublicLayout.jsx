import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navigation/Navbar';
import TopBar from '../components/Navigation/TopBar';
import Footer from '../components/Footer/Footer';

const PublicLayout = () => {
  return (
    <>
      <TopBar />
      <main>
        <Outlet />
      </main>
      <Navbar />
      <Footer />
    </>
  );
};

export default PublicLayout;