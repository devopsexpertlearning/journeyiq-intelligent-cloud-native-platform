'use client';

import { useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { Card } from '@/components/Card';

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  activeFlights: number;
}

interface RecentBooking {
  id: string;
  reference: string;
  user: string;
  type: string;
  amount: number;
  status: string;
  date: string;
}

export default function AdminDashboard() {
  const [stats] = useState<DashboardStats>({
    totalUsers: 1247,
    totalBookings: 3891,
    totalRevenue: 487650,
    activeFlights: 156,
  });

  const [recentBookings] = useState<RecentBooking[]>([
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
      user: 'Alice Brown',
      type: 'Flight',
      amount: 1250.00,
      status: 'Cancelled',
      date: '2024-02-13',
    },
    {
      id: '5',
      reference: 'JQ-MNO345',
      user: 'Charlie Wilson',
      type: 'Hotel',
      amount: 890.00,
      status: 'Confirmed',
      date: '2024-02-13',
    },
  ]);

  const bookingColumns = [
    {
      key: 'reference',
      label: 'Reference',
      render: (row: RecentBooking) => (
        <span className="font-mono text-xs font-semibold bg-[var(--surface-tertiary)] px-2 py-1 rounded text-[var(--text-secondary)]">
          {row.reference}
        </span>
      )
    },
    {
      key: 'user',
      label: 'User',
      render: (row: RecentBooking) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
            {row.user.charAt(0)}
          </div>
          <span className="text-sm font-medium">{row.user}</span>
        </div>
      )
    },
    { key: 'type', label: 'Type' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row: RecentBooking) => <span className="font-medium text-white">${row.amount.toFixed(2)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: RecentBooking) => {
        const statusStyles: Record<string, string> = {
          'Confirmed': 'status-success',
          'Pending': 'status-warning',
          'Cancelled': 'status-error'
        };
        return (
          <span className={`status-badge ${statusStyles[row.status] || 'status-neutral'}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      key: 'date',
      label: 'Date',
      render: (row: RecentBooking) => <span className="text-sm text-[var(--text-tertiary)]">{row.date}</span>
    },
  ];

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70 mb-2">
            Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Platform overview and key metrics
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] rounded-lg text-sm font-medium transition-colors border border-[var(--border-primary)]">
            Last 7 Days
          </button>
          <button className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
            Generate Report
          </button>
        </div>
      </header>

      <div className="stats-grid animate-slide-up">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change="12%"
          trend="up"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          change="8%"
          trend="up"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
        />
        <StatCard
          title="Total Revenue"
          value={`$${(stats.totalRevenue / 1000).toFixed(1)}K`}
          change="15%"
          trend="up"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
        />
        <StatCard
          title="Active Flights"
          value={stats.activeFlights}
          change="6 today"
          trend="neutral"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-2 h-8 bg-[var(--brand-accent)] rounded-full"></span>
                Recent Activity
              </h2>
              <button className="text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-medium">View All</button>
            </div>
            <Card noPadding className="overflow-hidden">
              <DataTable
                columns={bookingColumns}
                data={recentBookings}
                emptyMessage="No recent bookings"
              />
            </Card>
          </section>
        </div>

        <div className="space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
              System Status
            </h2>
            <Card className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-[var(--border-secondary)]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-medium">API Gateway</span>
                </div>
                <span className="text-xs text-green-400 font-mono bg-green-400/10 px-2 py-1 rounded">OPERATIONAL</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-[var(--border-secondary)]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-medium">Database Cluster</span>
                </div>
                <span className="text-xs text-green-400 font-mono bg-green-400/10 px-2 py-1 rounded">OPERATIONAL</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="font-medium">Email Service</span>
                </div>
                <span className="text-xs text-yellow-400 font-mono bg-yellow-400/10 px-2 py-1 rounded">DEGRADED</span>
              </div>
            </Card>
          </section>

          <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20">
            <h3 className="font-bold text-lg mb-2 text-blue-100">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium flex justify-between items-center group">
                Add New User
                <span className="text-white/50 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium flex justify-between items-center group">
                Configure Flights
                <span className="text-white/50 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
