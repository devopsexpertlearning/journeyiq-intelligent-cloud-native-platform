import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = `btn-${size}`;
    const loadingClass = isLoading ? 'btn-loading' : '';

    return (
        <button
            className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <span className="spinner-sm" />}
            {children}
        </button>
    );
}
