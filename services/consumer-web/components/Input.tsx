import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            fullWidth = false,
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
        const hasError = !!error;

        return (
            <div className={`input-wrapper ${fullWidth ? 'input-full-width' : ''}`}>
                {label && (
                    <label htmlFor={inputId} className="input-label">
                        {label}
                    </label>
                )}
                <div className="input-container">
                    {leftIcon && React.cloneElement(leftIcon as any, {
                        className: `input-icon-left ${(leftIcon as any).props?.className || ''}`
                    })}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`input ${hasError ? 'input-error' : ''} ${leftIcon ? 'input-with-left-icon' : ''
                            } ${rightIcon ? 'input-with-right-icon' : ''} ${className}`}
                        {...props}
                    />
                    {rightIcon && React.cloneElement(rightIcon as any, {
                        className: `input-icon-right ${(rightIcon as any).props?.className || ''}`
                    })}
                </div>
                {error && <span className="input-error-text">{error}</span>}
                {helperText && !error && (
                    <span className="input-helper-text">{helperText}</span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            label,
            error,
            helperText,
            fullWidth = false,
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
        const hasError = !!error;

        return (
            <div className={`input-wrapper ${fullWidth ? 'input-full-width' : ''}`}>
                {label && (
                    <label htmlFor={textareaId} className="input-label">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={`textarea ${hasError ? 'input-error' : ''} ${className}`}
                    {...props}
                />
                {error && <span className="input-error-text">{error}</span>}
                {helperText && !error && (
                    <span className="input-helper-text">{helperText}</span>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
