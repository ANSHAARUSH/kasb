import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

console.log("Mounting application...");
console.log("[main.tsx] Script loaded. Attempting to find root element...");
const rootElement = document.getElementById('root');

if (!rootElement) {
    console.error("[main.tsx] FATAL: Root element not found!");
} else {
    console.log("[main.tsx] Root element found. Mounting React app...");
    createRoot(rootElement).render(
        <StrictMode>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </StrictMode>,
    )
    console.log("[main.tsx] React render call completed.");
}
