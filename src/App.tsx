import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import GroupPage from '@/pages/GroupPage';
import TeamPage from '@/pages/TeamPage';
import DuplicatesPage from '@/pages/DuplicatesPage';
import BottomNav from '@/components/BottomNav';

function SearchPlaceholder() {
  return <div className="p-4 pb-20">Búsqueda (pendiente F6)</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="/team/:teamCode" element={<TeamPage />} />
        <Route path="/search" element={<SearchPlaceholder />} />
        <Route path="/duplicates" element={<DuplicatesPage />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
