import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import '../styles/index.css';

/* ── Apply saved theme synchronously before paint ── */
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
document.documentElement.classList.toggle('dark',  isDark);
document.documentElement.classList.toggle('light', !isDark);
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

// Unconditionally purge legacy streak keys
try {
  localStorage.removeItem('algomind_streak_cache');
  localStorage.removeItem('algomind_app_streak');
  localStorage.removeItem('algomind_streak');
  sessionStorage.removeItem('algomind_streak_cache');
  sessionStorage.removeItem('algomind_app_streak');
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
