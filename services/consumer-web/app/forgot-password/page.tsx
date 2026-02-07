'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            showToast('Please enter your email address', 'error');
            return;
        }

        setIsLoading(true);
        try {
            // Mock API call - in real app, call password reset endpoint
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsSubmitted(true);
            showToast('Password reset link sent to your email', 'success');
        } catch (error) {
            showToast('Failed to send reset link', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <main className="hero-container">
                <div className="hero-bg-glow" />

                <div className="auth-container">
                    <div className="auth-header">
                        <h1 className="auth-title">Check Your Email</h1>
                        <p className="auth-subtitle">
                            We've sent a password reset link to <strong>{email}</strong>
                        </p>
                    </div>

                    <div className="auth-footer">
                        <Link href="/login" className="auth-link">
                            ← Back to Login
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="hero-container">
            <div className="hero-bg-glow" />

            <div className="auth-container">
                <div className="auth-header">
                    <h1 className="auth-title">Reset Password</h1>
                    <p className="auth-subtitle">
                        Enter your email address and we'll send you a reset link
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <Input
                        type="email"
                        label="Email Address"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Button type="submit" isLoading={isLoading} className="auth-submit">
                        Send Reset Link
                    </Button>
                </form>

                <div className="auth-footer">
                    <Link href="/login" className="auth-link">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </main>
    );
}
