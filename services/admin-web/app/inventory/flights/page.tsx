'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';
import { DataTable } from '@/components/DataTable';

interface Flight {
    id: string;
    flightNumber: string;
    airline: string;
    origin: string;
    destination: string;
    departureTime: string;
    price: number;
    availableSeats: number;
}

export default function FlightsInventoryPage() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [flights] = useState<Flight[]>([
        {
            id: '1',
            flightNumber: 'JQ-101',
            airline: 'JourneyIQ Airways',
            origin: 'JFK',
            destination: 'LHR',
            departureTime: '2024-02-15 10:00',
            price: 599.99,
            availableSeats: 45,
        },
        {
            id: '2',
            flightNumber: 'JQ-102',
            airline: 'JourneyIQ Airways',
            origin: 'LAX',
            destination: 'NRT',
            departureTime: '2024-02-16 14:00',
            price: 899.99,
            availableSeats: 32,
        },
        {
            id: '3',
            flightNumber: 'JQ-103',
            airline: 'SkyHigh Airlines',
            origin: 'ORD',
            destination: 'CDG',
            departureTime: '2024-02-17 08:00',
            price: 749.99,
            availableSeats: 18,
        },
    ]);

    const columns = [
        {
            key: 'flightNumber',
            label: 'Flight Number',
            render: (row: Flight) => (
                <span className="font-mono font-bold text-[var(--brand-primary)] bg-[var(--brand-primary-light)] px-2 py-0.5 rounded text-xs">
                    {row.flightNumber}
                </span>
            )
        },
        {
            key: 'airline',
            label: 'Airline',
            render: (row: Flight) => <span className="font-medium">{row.airline}</span>
        },
        {
            key: 'route',
            label: 'Route',
            render: (flight: Flight) => (
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-[var(--text-secondary)]">{flight.origin}</span>
                    <span className="text-[var(--text-tertiary)]">→</span>
                    <span className="text-[var(--text-secondary)]">{flight.destination}</span>
                </div>
            ),
        },
        { key: 'departureTime', label: 'Departure', render: (row: Flight) => <span className="text-[var(--text-secondary)] text-xs">{row.departureTime}</span> },
        {
            key: 'price',
            label: 'Price',
            render: (flight: Flight) => <span className="font-semibold text-white">${flight.price.toFixed(2)}</span>,
        },
        {
            key: 'availableSeats',
            label: 'Available Seats',
            render: (row: Flight) => (
                <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-[var(--surface-tertiary)] rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${(row.availableSeats / 100) * 100}%` }} />
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">{row.availableSeats}</span>
                </div>
            )
        },
    ];

    return (
        <div className="animate-fade-in space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                        Flight Inventory
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Manage flight listings and availability
                    </p>
                </div>
                <button
                    className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    onClick={() => setShowAddModal(true)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                    Add Flight
                </button>
            </header>

            <Card className="overflow-hidden border-t-4 border-t-blue-500">
                <DataTable
                    columns={columns}
                    data={flights}
                    emptyMessage="No flights in inventory"
                />
            </Card>

            {/* Add Flight Modal - Placeholder for improved modal implementation */}
            {showAddModal && (
                <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                    <Card className="w-full max-w-2xl bg-[var(--bg-secondary)]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-[var(--border-secondary)] pb-4">
                            <h2 className="text-xl font-bold">Add New Flight</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-[var(--text-tertiary)] hover:text-white">✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Flight Number</label>
                                <input type="text" className="w-full px-3 py-2 bg-[var(--surface-tertiary)] rounded border border-[var(--border-secondary)] focus:border-[var(--brand-primary)] outline-none" placeholder="JQ-104" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Airline</label>
                                <input type="text" className="w-full px-3 py-2 bg-[var(--surface-tertiary)] rounded border border-[var(--border-secondary)] focus:border-[var(--brand-primary)] outline-none" placeholder="JourneyIQ Airways" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Origin</label>
                                <input type="text" className="w-full px-3 py-2 bg-[var(--surface-tertiary)] rounded border border-[var(--border-secondary)] focus:border-[var(--brand-primary)] outline-none" placeholder="JFK" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Destination</label>
                                <input type="text" className="w-full px-3 py-2 bg-[var(--surface-tertiary)] rounded border border-[var(--border-secondary)] focus:border-[var(--brand-primary)] outline-none" placeholder="LHR" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-secondary)]">
                            <button className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-white" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded text-sm font-medium hover:bg-[var(--brand-primary-hover)]" onClick={() => { alert('Flight added'); setShowAddModal(false); }}>Add Flight</button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
