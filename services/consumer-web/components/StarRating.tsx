'use client';

import { useState } from 'react';

interface StarRatingProps {
    rating: number;
    onChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ rating, onChange, readonly = false, size = 'md' }: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizeClasses = {
        sm: 'star-sm',
        md: 'star-md',
        lg: 'star-lg',
    };

    const handleClick = (value: number) => {
        if (!readonly && onChange) {
            onChange(value);
        }
    };

    return (
        <div className={`star-rating ${sizeClasses[size]}`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`star ${star <= (hoverRating || rating) ? 'filled' : 'empty'
                        }`}
                    onClick={() => handleClick(star)}
                    onMouseEnter={() => !readonly && setHoverRating(star)}
                    onMouseLeave={() => !readonly && setHoverRating(0)}
                    disabled={readonly}
                >
                    ★
                </button>
            ))}
        </div>
    );
}
