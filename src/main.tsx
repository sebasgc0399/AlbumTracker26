import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { seedDatabase } from '@/db/seed';

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

const loadingTimer = window.setTimeout(() => {
  rootElement.textContent = 'Cargando catálogo...';
}, 250);

seedDatabase()
  .catch((error) => {
    console.error('Error al inicializar la base de datos:', error);
  })
  .finally(() => {
    window.clearTimeout(loadingTimer);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
