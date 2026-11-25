import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { OfflineProvider } from './context/OfflineContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <OfflineProvider>
          <App />
        </OfflineProvider>
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>
);
