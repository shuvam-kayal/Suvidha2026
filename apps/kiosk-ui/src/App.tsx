/**
 * SUVIDHA Kiosk UI - Main Application
 * Updated with protected routes and auth integration
 */

import { Routes, Route } from 'react-router-dom';
import KioskLayout from './layouts/KioskLayout';
import ProtectedRoute from './components/ProtectedRoute';
import WelcomePage from './pages/WelcomePage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ServicesPage from './pages/ServicesPage';

function App() {
    return (
        <Routes>
            {/* Welcome screen - Touch to start */}
            <Route path="/" element={<WelcomePage />} />

            {/* Kiosk layout with header/footer */}
            <Route element={<KioskLayout />}>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Protected routes - require authentication */}
                <Route
                    path="/services/:type"
                    element={
                        <ProtectedRoute>
                            <ServicesPage />
                        </ProtectedRoute>
                    }
                />
            </Route>
        </Routes>
    );
}

export default App;
