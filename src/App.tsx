import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import HomePage from '@/pages/HomePage';

function GroupPlaceholder() {
  const { groupId } = useParams<{ groupId: string }>();
  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <p className="text-muted-foreground">Grupo {groupId} (pendiente F5)</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/group/:groupId" element={<GroupPlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}
