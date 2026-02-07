'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/DataTable';
import { Card } from '@/components/Card';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    joinedDate: string;
    totalBookings: number;
}

export default function UsersPage() {
    const router = useRouter();
    const [users] = useState<User[]>([
        {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'Customer',
            status: 'Active',
            joinedDate: '2024-01-15',
            totalBookings: 5,
        },
        {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'Customer',
            status: 'Active',
            joinedDate: '2024-01-20',
            totalBookings: 3,
        },
        {
            id: '3',
            name: 'Bob Johnson',
            email: 'bob@example.com',
            role: 'Customer',
            status: 'Inactive',
            joinedDate: '2024-02-01',
            totalBookings: 1,
        },
        {
            id: '4',
            name: 'Admin User',
            email: 'admin@journeyiq.com',
            role: 'Admin',
            status: 'Active',
            joinedDate: '2023-12-01',
            totalBookings: 0,
        },
    ]);

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (row: User) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-tertiary)] border border-[var(--border-secondary)] flex items-center justify-center text-[var(--brand-primary)] font-bold">
                        {row.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-medium text-[var(--text-primary)]">{row.name}</div>
                    </div>
                </div>
            )
        },
        { key: 'email', label: 'Email' },
        {
            key: 'role',
            label: 'Role',
            render: (row: User) => (
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${row.role === 'Admin'
                        ? 'bg-purple-400/10 text-purple-400 border border-purple-400/20'
                        : 'bg-[var(--surface-tertiary)] text-[var(--text-secondary)] border border-[var(--border-secondary)]'
                    }`}>
                    {row.role}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (user: User) => (
                <span className={`status-badge ${user.status === 'Active' ? 'status-success' : 'status-error'}`}>
                    {user.status}
                </span>
            ),
        },
        { key: 'totalBookings', label: 'Bookings', render: (row: User) => <span className="text-center block">{row.totalBookings}</span> },
        { key: 'joinedDate', label: 'Joined Date', render: (row: User) => <span className="text-[var(--text-tertiary)] text-xs">{row.joinedDate}</span> },
    ];

    return (
        <div className="animate-fade-in space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                        User Management
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Manage platform users and their accounts
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                        Add User
                    </button>
                </div>
            </header>

            <Card className="overflow-hidden border-t-4 border-t-purple-500">
                <DataTable
                    columns={columns}
                    data={users}
                    onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
                    emptyMessage="No users found"
                />
            </Card>
        </div>
    );
}
