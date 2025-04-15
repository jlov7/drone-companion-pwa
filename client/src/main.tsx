import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for offline functionality
// Only register in production to avoid issues in development
const isProduction = import.meta.env.MODE === 'production';

if (isProduction && 'serviceWorker' in navigator) {
  try {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.log('Service Worker registration skipped in development mode');
        });
    });
  } catch (error) {
    console.log('Service Worker registration failed:', error);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
