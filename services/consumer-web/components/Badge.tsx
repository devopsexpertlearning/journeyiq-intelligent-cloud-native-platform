import React from 'react';

export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Badge({
    children,
    variant = 'neutral',
    size = 'md',
    className = '',
}: BadgeProps) {
    const baseStyles = 'badge';
    const variantStyles = {
        success: 'badge-success',
        warning: 'badge-warning',
        error: 'badge-error',
        info: 'badge-info',
        neutral: 'badge-neutral',
    };
    const sizeStyles = {
        sm: 'badge-sm',
        md: 'badge-md',
        lg: 'badge-lg',
    };

    const classes = [
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return <span className={classes}>{children}</span>;
}
