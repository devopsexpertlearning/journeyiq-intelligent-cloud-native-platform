import React from 'react';
import { Card } from './Card';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
}

export function StatCard({ title, value, change, trend = 'neutral', icon }: StatCardProps) {
    const trendColors = {
        up: 'text-green-400 bg-green-400/10',
        down: 'text-red-400 bg-red-400/10',
        neutral: 'text-gray-400 bg-gray-400/10',
    };

    return (
        <Card className="relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">{title}</h3>
                    <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
                </div>
                {icon && (
                    <div className="p-2 rounded-lg bg-[var(--surface-secondary)] text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-colors duration-300">
                        {icon}
                    </div>
                )}
            </div>

            {change && (
                <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${trendColors[trend]}`}>
                        {trend === 'up' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"></polyline></svg>}
                        {trend === 'down' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>}
                        {change}
                    </span>
                    <span className="text-[var(--text-tertiary)]">vs last month</span>
                </div>
            )}

            {/* Decoration */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500" />
        </Card>
    );
}
