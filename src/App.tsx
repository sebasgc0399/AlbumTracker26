import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import GroupPage from '@/pages/GroupPage';
import TeamPage from '@/pages/TeamPage';
import SearchPage from '@/pages/SearchPage';
import DuplicatesPage from '@/pages/DuplicatesPage';
import MissingPage from '@/pages/MissingPage';
import SharedListPage from '@/pages/SharedListPage';
import CambiatonPage from '@/pages/CambiatonPage';
import BottomNav from '@/components/BottomNav';

const HIDE_NAV_PATHS: readonly string[] = ['/share', '/cambiaton'];

function ConditionalBottomNav() {
  const location = useLocation();
  if (HIDE_NAV_PATHS.includes(location.pathname)) return null;
  return <BottomNav />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="/team/:teamCode" element={<TeamPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/duplicates" element={<DuplicatesPage />} />
        <Route path="/missing" element={<MissingPage />} />
        <Route path="/share" element={<SharedListPage />} />
        <Route path="/cambiaton" element={<CambiatonPage />} />
      </Routes>
      <ConditionalBottomNav />
    </BrowserRouter>
  );
}
