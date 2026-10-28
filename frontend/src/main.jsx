import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// On fresh page load or hard refresh, reset any temporary rules sandbox to statutory defaults
try {
  sessionStorage.removeItem('compliscan_local_rules');
} catch (e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
