import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
    hover?: boolean;
}

export function Card({
    children,
    className = '',
    variant = 'default',
    padding = 'md',
    onClick,
    hover = false,
}: CardProps) {
    const baseStyles = 'card';
    const variantStyles = {
        default: 'card-default',
        glass: 'card-glass',
        elevated: 'card-elevated',
    };
    const paddingStyles = {
        none: 'card-padding-none',
        sm: 'card-padding-sm',
        md: 'card-padding-md',
        lg: 'card-padding-lg',
    };

    const classes = [
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        hover && 'card-hover',
        onClick && 'card-clickable',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes} onClick={onClick}>
            {children}
        </div>
    );
}

export interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
    return <div className={`card-header ${className}`}>{children}</div>;
}

export interface CardBodyProps {
    children: React.ReactNode;
    className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
    return <div className={`card-body ${className}`}>{children}</div>;
}

export interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
    return <div className={`card-footer ${className}`}>{children}</div>;
}
