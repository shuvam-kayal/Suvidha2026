/**
 * SUVIDHA Kiosk UI - Main Application
 * Touch-optimized routes with authentication and billing
 */

import { Routes, Route } from 'react-router-dom';
import KioskLayout from './layouts/KioskLayout';
import ProtectedRoute from './components/ProtectedRoute';
import WelcomePage from './pages/WelcomePage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ServicesPage from './pages/ServicesPage';
import BillsPage from './pages/BillsPage';
import BillDetailsPage from './pages/BillDetailsPage';
import PaymentPage from './pages/PaymentPage';

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

                {/* Billing routes */}
                <Route
                    path="/bills/:type"
                    element={
                        <ProtectedRoute>
                            <BillsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/bill/:billId"
                    element={
                        <ProtectedRoute>
                            <BillDetailsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pay/:billId"
                    element={
                        <ProtectedRoute>
                            <PaymentPage />
                        </ProtectedRoute>
                    }
                />
            </Route>
        </Routes>
    );
}

export default App;
