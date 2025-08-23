import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../components/admin/AdminDashboard';

const AdminDashboardPage: React.FC = () => {
    return (
        <AdminLayout>
            <AdminDashboard />
        </AdminLayout>
    );
};

export default AdminDashboardPage;