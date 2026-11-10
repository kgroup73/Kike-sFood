import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ToastProvider } from './hooks/useToast';
import ThemePicker from './components/ui/ThemePicker';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
        <ThemePicker />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
