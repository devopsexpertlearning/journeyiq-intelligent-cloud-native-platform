'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';
import { DataTable } from '@/components/DataTable';

interface Hotel {
    id: string;
    name: string;
    location: string;
    rating: number;
    pricePerNight: number;
    availableRooms: number;
    amenities: string[];
}

export default function HotelsInventoryPage() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [hotels] = useState<Hotel[]>([
        {
            id: '1',
            name: 'Grand Plaza Hotel',
            location: 'London, UK',
            rating: 4.5,
            pricePerNight: 150.00,
            availableRooms: 12,
            amenities: ['WiFi', 'Pool', 'Gym'],
        },
        {
            id: '2',
            name: 'Skyline Resort',
            location: 'Tokyo, Japan',
            rating: 4.8,
            pricePerNight: 220.00,
            availableRooms: 8,
            amenities: ['WiFi', 'Spa', 'Restaurant'],
        },
        {
            id: '3',
            name: 'Ocean View Inn',
            location: 'Miami, USA',
            rating: 4.2,
            pricePerNight: 180.00,
            availableRooms: 15,
            amenities: ['WiFi', 'Beach Access', 'Pool'],
        },
    ]);

    const columns = [
        {
            key: 'name',
            label: 'Hotel Name',
            render: (row: Hotel) => (
                <div className="font-medium text-white">{row.name}</div>
            )
        },
        {
            key: 'location',
            label: 'Location',
            render: (row: Hotel) => (
                <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {row.location}
                </div>
            )
        },
        {
            key: 'rating',
            label: 'Rating',
            render: (hotel: Hotel) => (
                <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-semibold">{hotel.rating}</span>
                </div>
            ),
        },
        {
            key: 'pricePerNight',
            label: 'Price/Night',
            render: (hotel: Hotel) => <span className="font-semibold text-white">${hotel.pricePerNight.toFixed(2)}</span>,
        },
        {
            key: 'availableRooms',
            label: 'Available Rooms',
            render: (row: Hotel) => (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${row.availableRooms > 5 ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                    {row.availableRooms} rooms
                </span>
            )
        },
        {
            key: 'amenities',
            label: 'Amenities',
            render: (hotel: Hotel) => (
                <div className="flex gap-1 flex-wrap">
                    {hotel.amenities.map(a => (
                        <span key={a} className="text-[10px] px-1.5 py-0.5 bg-[var(--surface-tertiary)] rounded text-[var(--text-tertiary)] border border-[var(--border-secondary)]">
                            {a}
                        </span>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <div className="animate-fade-in space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                        Hotel Inventory
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Manage hotel listings and room availability
                    </p>
                </div>
                <button
                    className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    onClick={() => setShowAddModal(true)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                    Add Hotel
                </button>
            </header>

            <Card className="overflow-hidden border-t-4 border-t-purple-500">
                <DataTable
                    columns={columns}
                    data={hotels}
                    emptyMessage="No hotels in inventory"
                />
            </Card>

            {/* Add Hotel Modal Placeholder */}
            {showAddModal && (
                <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                    <Card className="w-full max-w-2xl bg-[var(--bg-secondary)]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-[var(--border-secondary)] pb-4">
                            <h2 className="text-xl font-bold">Add New Hotel</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-[var(--text-tertiary)] hover:text-white">✕</button>
                        </div>
                        {/* Simplified form for demo */}
                        <div className="p-4 text-center text-[var(--text-secondary)]">
                            Hotel form modal placeholder
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-secondary)]">
                            <button className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-white" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded text-sm font-medium hover:bg-[var(--brand-primary-hover)]" onClick={() => { alert('Hotel added'); setShowAddModal(false); }}>Add Hotel</button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
