import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'btn';
    const variantStyles = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
        danger: 'btn-danger',
    };
    const sizeStyles = {
        sm: 'btn-sm',
        md: 'btn-md',
        lg: 'btn-lg',
        xl: 'btn-xl',
    };

    const classes = [
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        isLoading && 'btn-loading',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            className={classes}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <span className="btn-spinner" />
                    <span className="btn-loading-text">Loading...</span>
                </>
            ) : (
                <>
                    {leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
                    <span className="btn-text">{children}</span>
                    {rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
                </>
            )}
        </button>
    );
}
