import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import SkipLink from './components/SkipLink';
import './index.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <ErrorBoundary>
                <SkipLink />
                <App />
            </ErrorBoundary>
        </BrowserRouter>
    </React.StrictMode>,
);
