import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import AdminRoute from '../components/Navigation/AdminRoute';
import AdminLayout from './AdminLayout';
import AnalyticsPage from './AnalyticsPage';
import MasterDataPage from './MasterDataPage';

export default function AdminApp() {
  return (
    <UserProvider>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Navigate to="analytics" replace />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="master-data/*" element={<MasterDataPage />} />
          </Route>
        </Route>
      </Routes>
    </UserProvider>
  );
}