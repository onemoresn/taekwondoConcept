import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ThemeProvider } from './context/ThemeProvider';
import { SchoolProvider } from './context/SchoolProvider';
import AppRouter from './routes/AppRouter';
import './styles/tokens.css';
import './styles/app.css';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename || undefined}>
      <ThemeProvider>
        <AuthProvider>
          <SchoolProvider>
            <AppRouter />
          </SchoolProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
