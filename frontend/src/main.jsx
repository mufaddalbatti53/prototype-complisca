import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

//init
try {
  sessionStorage.removeItem('compliscan_local_rules');
} catch (e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
