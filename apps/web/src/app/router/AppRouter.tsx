import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { MapPage } from '../../pages/MapPage';
import { TripsPage } from '../../pages/TripsPage';
import { NotFoundPage } from '../../pages/NotFoundPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<MapPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
