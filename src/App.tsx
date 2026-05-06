import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import GroupPage from '@/pages/GroupPage';
import TeamPage from '@/pages/TeamPage';
import SpecialPage from '@/pages/SpecialPage';
import SearchPage from '@/pages/SearchPage';
import DuplicatesPage from '@/pages/DuplicatesPage';
import MissingPage from '@/pages/MissingPage';
import SharedListPage from '@/pages/SharedListPage';
import CambiatonPage from '@/pages/CambiatonPage';
import SettingsPage from '@/pages/SettingsPage';
import BottomNav from '@/components/BottomNav';
import MilestoneOverlay from '@/components/MilestoneOverlay';
import UpdatePrompt from '@/components/UpdatePrompt';
import { MilestoneProvider } from '@/hooks/useMilestoneWatcher';
import { subscribeToSystemTheme } from '@/lib/theme';

const HIDE_NAV_PATHS: readonly string[] = ['/share', '/cambiaton', '/settings'];

function ConditionalBottomNav() {
  const location = useLocation();
  if (HIDE_NAV_PATHS.includes(location.pathname)) return null;
  return <BottomNav />;
}

export default function App() {
  useEffect(() => subscribeToSystemTheme(), []);

  return (
    <BrowserRouter>
      <MilestoneProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/group/:groupId" element={<GroupPage />} />
          <Route path="/team/:teamCode" element={<TeamPage />} />
          <Route path="/special/:sectionId" element={<SpecialPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/duplicates" element={<DuplicatesPage />} />
          <Route path="/missing" element={<MissingPage />} />
          <Route path="/share" element={<SharedListPage />} />
          <Route path="/cambiaton" element={<CambiatonPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <ConditionalBottomNav />
        <MilestoneOverlay />
        <UpdatePrompt />
      </MilestoneProvider>
    </BrowserRouter>
  );
}
