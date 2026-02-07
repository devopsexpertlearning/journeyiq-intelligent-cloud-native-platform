'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/DataTable';
import { Card } from '@/components/Card';

interface Booking {
    id: string;
    reference: string;
    user: string;
    type: string;
    amount: number;
    status: string;
    date: string;
}

export default function BookingsPage() {
    const router = useRouter();
    const [bookings] = useState<Booking[]>([
        {
            id: '1',
            reference: 'JQ-ABC123',
            user: 'John Doe',
            type: 'Flight',
            amount: 599.99,
            status: 'Confirmed',
            date: '2024-02-15',
        },
        {
            id: '2',
            reference: 'JQ-DEF456',
            user: 'Jane Smith',
            type: 'Hotel',
            amount: 450.00,
            status: 'Confirmed',
            date: '2024-02-14',
        },
        {
            id: '3',
            reference: 'JQ-GHI789',
            user: 'Bob Johnson',
            type: 'Flight',
            amount: 799.99,
            status: 'Pending',
            date: '2024-02-14',
        },
        {
            id: '4',
            reference: 'JQ-JKL012',
            user: 'Alice Williams',
            type: 'Hotel',
            amount: 350.00,
            status: 'Cancelled',
            date: '2024-02-13',
        },
        {
            id: '5',
            reference: 'JQ-MNO345',
            user: 'Charlie Wilson',
            type: 'Flight',
            amount: 1250.00,
            status: 'Confirmed',
            date: '2024-02-13',
        },
    ]);

    const columns = [
        {
            key: 'reference',
            label: 'Reference',
            render: (row: Booking) => (
                <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                    {row.reference}
                </span>
            )
        },
        {
            key: 'user',
            label: 'User',
            render: (row: Booking) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                        {row.user.charAt(0)}
                    </div>
                    <span>{row.user}</span>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Type',
            render: (row: Booking) => (
                <span className="flex items-center gap-2">
                    <span className="opacity-70">{row.type === 'Flight' ? '✈️' : '🏨'}</span>
                    {row.type}
                </span>
            )
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (booking: Booking) => <span className="font-semibold text-white">${booking.amount.toFixed(2)}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (booking: Booking) => {
                const statusStyles: Record<string, string> = {
                    'Confirmed': 'status-success',
                    'Pending': 'status-warning',
                    'Cancelled': 'status-error'
                };
                return (
                    <span className={`status-badge ${statusStyles[booking.status] || 'status-neutral'}`}>
                        {booking.status}
                    </span>
                );
            }
        },
        { key: 'date', label: 'Date' },
    ];

    return (
        <div className="animate-fade-in space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                        Booking Management
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        View and manage all platform bookings
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] rounded-lg text-sm font-medium transition-colors border border-[var(--border-primary)] flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        Filter
                    </button>
                    <button className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                        New Booking
                    </button>
                </div>
            </header>

            <Card className="overflow-hidden border-t-4 border-t-[var(--brand-accent)]">
                <DataTable
                    columns={columns}
                    data={bookings}
                    onRowClick={(booking) => router.push(`/admin/bookings/${booking.id}`)}
                    emptyMessage="No bookings found"
                />
            </Card>
        </div>
    );
}
