'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';

interface IoTDevice {
    id: string;
    name: string;
    type: string;
    status: 'online' | 'offline' | 'warning';
    location: string;
    temperature?: number;
    humidity?: number;
    batteryLevel?: number;
    lastUpdate: string;
}

export default function IoTDashboardPage() {
    const [devices] = useState<IoTDevice[]>([
        {
            id: '1',
            name: 'Airport Sensor A1',
            type: 'Temperature Sensor',
            status: 'online',
            location: 'JFK Terminal 1',
            temperature: 22.5,
            humidity: 45,
            batteryLevel: 87,
            lastUpdate: '2 mins ago',
        },
        {
            id: '2',
            name: 'Hotel Thermostat H1',
            type: 'Smart Thermostat',
            status: 'online',
            location: 'Grand Plaza Hotel - Room 305',
            temperature: 21.0,
            humidity: 50,
            batteryLevel: 95,
            lastUpdate: '1 min ago',
        },
        {
            id: '3',
            name: 'Flight Tracker F1',
            type: 'GPS Tracker',
            status: 'online',
            location: 'Flight JQ-101',
            batteryLevel: 72,
            lastUpdate: '30 secs ago',
        },
        {
            id: '4',
            name: 'Baggage Sensor B1',
            type: 'RFID Sensor',
            status: 'warning',
            location: 'LHR Baggage Claim',
            batteryLevel: 15,
            lastUpdate: '5 mins ago',
        },
        {
            id: '5',
            name: 'Airport Sensor A2',
            type: 'Temperature Sensor',
            status: 'offline',
            location: 'LAX Terminal 2',
            lastUpdate: '2 hours ago',
        },
    ]);

    const onlineCount = devices.filter(d => d.status === 'online').length;
    const warningCount = devices.filter(d => d.status === 'warning').length;
    const offlineCount = devices.filter(d => d.status === 'offline').length;

    const getStatusColor = (status: IoTDevice['status']) => {
        switch (status) {
            case 'online': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'offline': return 'text-red-400 bg-red-400/10 border-red-400/20';
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                        IoT Dashboard
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Monitor connected devices and sensors
                    </p>
                </div>
                <button className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                    Add Device
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center gap-4 bg-gradient-to-br from-[var(--surface-primary)] to-[var(--surface-secondary)] border-b-4 border-b-green-500">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">{onlineCount}</div>
                        <div className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Online</div>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 bg-gradient-to-br from-[var(--surface-primary)] to-[var(--surface-secondary)] border-b-4 border-b-yellow-500">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">{warningCount}</div>
                        <div className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Warning</div>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 bg-gradient-to-br from-[var(--surface-primary)] to-[var(--surface-secondary)] border-b-4 border-b-red-500">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">{offlineCount}</div>
                        <div className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Offline</div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => (
                    <Card key={device.id} className="group hover:border-[var(--brand-primary)] transition-colors duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-white mb-1 group-hover:text-[var(--brand-primary)] transition-colors">{device.name}</h3>
                                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{device.type}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border uppercase flex items-center gap-1 ${getStatusColor(device.status)}`}>
                                {device.status === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>}
                                {device.status === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>}
                                {device.status === 'offline' && <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>}
                                {device.status}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mb-6 text-sm text-[var(--text-secondary)]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-tertiary)]"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            {device.location}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {device.temperature !== undefined && (
                                <div className="bg-[var(--surface-tertiary)] rounded p-2 flex items-center gap-2">
                                    <span className="text-lg">🌡️</span>
                                    <div>
                                        <div className="text-xs text-[var(--text-tertiary)]">Temp</div>
                                        <div className="font-bold">{device.temperature}°C</div>
                                    </div>
                                </div>
                            )}
                            {device.humidity !== undefined && (
                                <div className="bg-[var(--surface-tertiary)] rounded p-2 flex items-center gap-2">
                                    <span className="text-lg">💧</span>
                                    <div>
                                        <div className="text-xs text-[var(--text-tertiary)]">Humidity</div>
                                        <div className="font-bold">{device.humidity}%</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {device.batteryLevel !== undefined && (
                            <div className="mb-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-[var(--text-tertiary)]">Battery</span>
                                    <span className={`font-bold ${device.batteryLevel < 20 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>{device.batteryLevel}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-[var(--surface-tertiary)] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${device.batteryLevel < 20 ? 'bg-red-500' : 'bg-green-500'}`}
                                        style={{ width: `${device.batteryLevel}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-[var(--border-secondary)] flex justify-between items-center text-xs">
                            <span className="text-[var(--text-tertiary)]">Updated {device.lastUpdate}</span>
                            <button className="text-[var(--brand-primary)] hover:text-white font-medium transition-colors">Details →</button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
