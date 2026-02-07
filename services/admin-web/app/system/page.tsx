'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';

interface ServiceHealth {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    uptime: string;
}

export default function SystemHealthPage() {
    const [services] = useState<ServiceHealth[]>([
        { name: 'API Gateway', status: 'healthy', responseTime: 45, uptime: '99.9%' },
        { name: 'Auth Service', status: 'healthy', responseTime: 32, uptime: '99.8%' },
        { name: 'User Service', status: 'healthy', responseTime: 28, uptime: '99.9%' },
        { name: 'Booking Service', status: 'healthy', responseTime: 56, uptime: '99.7%' },
        { name: 'Flight Service', status: 'healthy', responseTime: 41, uptime: '99.9%' },
        { name: 'Hotel Service', status: 'healthy', responseTime: 38, uptime: '99.8%' },
        { name: 'Payment Service', status: 'healthy', responseTime: 67, uptime: '99.9%' },
        { name: 'Notification Service', status: 'degraded', responseTime: 125, uptime: '98.5%' },
        { name: 'Search Service', status: 'healthy', responseTime: 52, uptime: '99.6%' },
        { name: 'Analytics Service', status: 'healthy', responseTime: 73, uptime: '99.4%' },
        { name: 'Review Service', status: 'healthy', responseTime: 35, uptime: '99.9%' },
        { name: 'AI Agent Service', status: 'healthy', responseTime: 89, uptime: '99.2%' },
        { name: 'IoT Service', status: 'healthy', responseTime: 44, uptime: '99.7%' },
        { name: 'Database (Primary)', status: 'healthy', responseTime: 12, uptime: '99.99%' },
        { name: 'Redis Cache', status: 'healthy', responseTime: 8, uptime: '99.95%' },
    ]);

    const getStatusColor = (status: ServiceHealth['status']) => {
        switch (status) {
            case 'healthy': return 'text-green-400';
            case 'degraded': return 'text-yellow-400';
            case 'down': return 'text-red-400';
        }
    };

    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    const downCount = services.filter(s => s.status === 'down').length;

    return (
        <div className="animate-fade-in space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                        System Health
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Monitor all microservices and infrastructure
                    </p>
                </div>
                <div className="flex gap-2 text-sm font-mono text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Healthy</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Degraded</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Down</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center justify-between bg-gradient-to-br from-[var(--surface-primary)] to-[var(--surface-secondary)] border-b-4 border-b-green-500">
                    <div>
                        <div className="text-4xl font-bold text-white mb-1">{healthyCount}</div>
                        <div className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Healthy Services</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                </Card>
                <Card className="flex items-center justify-between bg-gradient-to-br from-[var(--surface-primary)] to-[var(--surface-secondary)] border-b-4 border-b-yellow-500">
                    <div>
                        <div className="text-4xl font-bold text-white mb-1">{degradedCount}</div>
                        <div className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Degraded Services</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </div>
                </Card>
                <Card className="flex items-center justify-between bg-gradient-to-br from-[var(--surface-primary)] to-[var(--surface-secondary)] border-b-4 border-b-red-500">
                    <div>
                        <div className="text-4xl font-bold text-white mb-1">{downCount}</div>
                        <div className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Down Services</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {services.map((service) => (
                    <Card key={service.name} className="group hover:border-[var(--brand-primary)] transition-colors duration-200">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-white group-hover:text-[var(--brand-primary)] transition-colors">{service.name}</h3>
                            <span className={`${getStatusColor(service.status)}`}>
                                {service.status === 'healthy' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                {service.status === 'degraded' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>}
                                {service.status === 'down' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-[var(--surface-tertiary)] p-2 rounded">
                                <div className="text-[var(--text-tertiary)] mb-0.5">Response Time</div>
                                <div className={`font-mono font-bold ${service.responseTime > 100 ? 'text-yellow-400' : 'text-white'}`}>{service.responseTime}ms</div>
                            </div>
                            <div className="bg-[var(--surface-tertiary)] p-2 rounded">
                                <div className="text-[var(--text-tertiary)] mb-0.5">Uptime</div>
                                <div className="font-mono font-bold text-white">{service.uptime}</div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
