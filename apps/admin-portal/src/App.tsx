/**
 * SUVIDHA Admin Portal - Main Application
 */

import { Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import KiosksPage from './pages/KiosksPage';
import GrievancesPage from './pages/GrievancesPage';
import UsersPage from './pages/UsersPage';

function App() {
    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/kiosks" element={<KiosksPage />} />
                <Route path="/grievances" element={<GrievancesPage />} />
                <Route path="/users" element={<UsersPage />} />
            </Route>
        </Routes>
    );
}

export default App;
