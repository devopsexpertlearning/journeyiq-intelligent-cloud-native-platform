'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi } from '@/lib/api';

interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
    phone?: string;
    address?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const savedEmail = localStorage.getItem('user_email');
            const savedName = localStorage.getItem('user_name');
            const savedPhone = localStorage.getItem('user_phone');
            const savedAddress = localStorage.getItem('user_address');

            let userId = '00000000-0000-0000-0000-000000000000';
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.sub) userId = payload.sub;
                else if (payload.user_id) userId = payload.user_id;
            } catch (e) {
                console.warn('Failed to decode token', e);
            }

            try {
                const profile = await userApi.getProfile(userId);
                setUser({
                    id: userId,
                    email: savedEmail || profile.email || 'user@example.com',
                    name: savedName || profile.name || profile.email || 'User',
                    phone: savedPhone || profile.phone || '',
                    address: savedAddress || profile.address || '',
                });
            } catch (profileError) {
                if (savedEmail && savedName) {
                    setUser({
                        id: userId,
                        email: savedEmail,
                        name: savedName,
                        phone: savedPhone || '',
                        address: savedAddress || '',
                    });
                }
            }
        } catch (error) {
            console.error('Failed to refresh user', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem('auth_token');
            
            if (!token) {
                setIsLoading(false);
                return;
            }

            if (token.split('.').length !== 3) {
                localStorage.removeItem('auth_token');
                setIsLoading(false);
                return;
            }

            await refreshUser();
        };

        restoreSession();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await authApi.login(email, password);
            authApi.setToken(response.access_token);

            let userId = '00000000-0000-0000-0000-000000000000';
            try {
                const payload = JSON.parse(atob(response.access_token.split('.')[1]));
                if (payload.sub) userId = payload.sub;
                else if (payload.user_id) userId = payload.user_id;
            } catch (e) {
                console.warn('Failed to decode token', e);
            }

            localStorage.setItem('auth_token', response.access_token);
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_name', email.split('@')[0]);

            setUser({
                id: userId,
                email: email,
                name: email.split('@')[0],
            });
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const register = async (email: string, password: string, name: string) => {
        try {
            await authApi.register(email, password, name);
            await login(email, password);
            localStorage.setItem('user_name', name);
            setUser(prev => prev ? { ...prev, name } : {
                id: '00000000-0000-0000-0000-000000000000',
                email,
                name,
            });
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    };

    const logout = () => {
        authApi.logout();
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_phone');
        localStorage.removeItem('user_address');
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user && !!localStorage.getItem('auth_token'),
        login,
        register,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
