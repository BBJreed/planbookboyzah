import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App-test';
import './styles/global.css';
import './styles/mobile.css';

// Check if service worker is supported and register it
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Add mobile viewport meta tag if not present
const viewportMeta = document.querySelector('meta[name="viewport"]');
if (!viewportMeta) {
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  document.getElementsByTagName('head')[0].appendChild(meta);
}

// Add theme color meta tag for mobile
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
if (!themeColorMeta) {
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = '#3b82f6';
  document.getElementsByTagName('head')[0].appendChild(meta);
}

// Add mobile web app capable meta tag
const mobileWebAppMeta = document.querySelector('meta[name="mobile-web-app-capable"]');
if (!mobileWebAppMeta) {
  const meta = document.createElement('meta');
  meta.name = 'mobile-web-app-capable';
  meta.content = 'yes';
  document.getElementsByTagName('head')[0].appendChild(meta);
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);