import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'info';
    className?: string;
}

export function Badge({ children, variant = 'info', className = '' }: BadgeProps) {
    return (
        <span className={`badge badge-${variant} ${className}`.trim()}>
            {children}
        </span>
    );
}
