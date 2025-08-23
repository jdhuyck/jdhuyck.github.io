import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout } from '../../lib/authUtils';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    return (
        <div className='min-h-screen bg-gray-50'>
            {/* Header */}
            <header className='bg-white shadow-sm'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='flex justify-between items-center h-16'>
                        <h1 className='text-2xl font-bold text-gray-900'>Blog Admin</h1>
                        <nav className='flex space-x-8'>
                            <Link
                                to="/admin"
                                className={`px-3 py-2 rounded-md text-sm font-medium ${
                                    isActive('/admin')
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/admin/new"
                                className={`px-3 py-2 rounded-md text-sm font-medium ${
                                    isActive('/admin/new')
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                New Post
                            </Link>
                            <Link
                                to="/blog"
                                className='px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700'
                            >
                                View Blog
                            </Link>
                            <button
                                onClick={handleLogout}
                                className='px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700'
                            >
                                Logout
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;