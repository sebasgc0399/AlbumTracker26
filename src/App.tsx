import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import GroupPage from '@/pages/GroupPage';
import TeamPage from '@/pages/TeamPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="/team/:teamCode" element={<TeamPage />} />
      </Routes>
    </BrowserRouter>
  );
}
