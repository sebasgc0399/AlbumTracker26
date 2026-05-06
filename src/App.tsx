import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import GroupPage from '@/pages/GroupPage';
import TeamPage from '@/pages/TeamPage';
import SearchPage from '@/pages/SearchPage';
import DuplicatesPage from '@/pages/DuplicatesPage';
import MissingPage from '@/pages/MissingPage';
import BottomNav from '@/components/BottomNav';

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
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
