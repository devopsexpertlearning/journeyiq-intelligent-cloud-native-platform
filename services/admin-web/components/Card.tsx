import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function Card({ children, className = '', noPadding = false, ...props }: CardProps) {
    return (
        <div
            className={`card-glass ${noPadding ? '' : 'p-6'} ${className}`.trim()}
            {...props}
        >
            {children}
        </div>
    );
}
