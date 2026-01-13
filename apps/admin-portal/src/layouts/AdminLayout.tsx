/**
 * Admin Layout with Sidebar Navigation
 */

import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Monitor, AlertCircle, Users, Settings, LogOut } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/kiosks', icon: Monitor, label: 'Kiosks' },
    { path: '/grievances', icon: AlertCircle, label: 'Grievances' },
    { path: '/users', icon: Users, label: 'Users' },
];

export default function AdminLayout() {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold text-white">SUVIDHA Admin</h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                clsx('sidebar-link', isActive && 'sidebar-link-active')
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700">
                    <button className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
                    <h2 className="text-lg font-semibold">Admin Portal</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">Welcome, Admin</span>
                        <Settings className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white" />
                    </div>
                </header>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
