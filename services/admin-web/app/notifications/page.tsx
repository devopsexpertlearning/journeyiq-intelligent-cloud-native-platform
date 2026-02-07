'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';

interface Notification {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'warning',
            title: 'Low Battery Alert',
            message: 'IoT Device "Baggage Sensor B1" battery level is below 20%',
            timestamp: '5 mins ago',
            read: false,
        },
        {
            id: '2',
            type: 'error',
            title: 'Device Offline',
            message: 'Temperature Sensor "Airport Sensor A2" has been offline for 2 hours',
            timestamp: '2 hours ago',
            read: false,
        },
        {
            id: '3',
            type: 'success',
            title: 'Booking Confirmed',
            message: 'New booking JQ-XYZ789 has been confirmed',
            timestamp: '3 hours ago',
            read: true,
        },
        {
            id: '4',
            type: 'info',
            title: 'System Update',
            message: 'Payment Service has been updated to version 2.1.0',
            timestamp: '5 hours ago',
            read: true,
        },
        {
            id: '5',
            type: 'warning',
            title: 'High Response Time',
            message: 'Notification Service response time is above 100ms',
            timestamp: '6 hours ago',
            read: true,
        },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'info': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
            case 'warning': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
            case 'error': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
            case 'success': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
        }
    };

    const getNotificationStyles = (type: Notification['type']) => {
        switch (type) {
            case 'info': return 'border-blue-500/50 bg-blue-500/5';
            case 'warning': return 'border-yellow-500/50 bg-yellow-500/5';
            case 'error': return 'border-red-500/50 bg-red-500/5';
            case 'success': return 'border-green-500/50 bg-green-500/5';
        }
    };

    const getIconColor = (type: Notification['type']) => {
        switch (type) {
            case 'info': return 'text-blue-500 bg-blue-500/10';
            case 'warning': return 'text-yellow-500 bg-yellow-500/10';
            case 'error': return 'text-red-500 bg-red-500/10';
            case 'success': return 'text-green-500 bg-green-500/10';
        }
    };

    return (
        <div className="animate-fade-in space-y-8 max-w-4xl mx-auto">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                        Notifications
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        className="px-4 py-2 bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] rounded-lg text-sm font-medium transition-colors border border-[var(--border-primary)]"
                        onClick={markAllAsRead}
                    >
                        Mark All as Read
                    </button>
                )}
            </header>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <Card className="text-center py-12">
                        <div className="w-16 h-16 mx-auto bg-[var(--surface-tertiary)] rounded-full flex items-center justify-center text-[var(--text-tertiary)] mb-4">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">No notifications</h3>
                        <p className="text-[var(--text-secondary)]">You're all caught up!</p>
                    </Card>
                ) : (
                    notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`flex flex-col md:flex-row gap-4 relative transition-all duration-200 border-l-4 ${getNotificationStyles(notification.type)} ${!notification.read ? 'shadow-lg shadow-black/20' : 'opacity-80 hover:opacity-100'
                                }`}
                        >
                            <div className="flex-shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(notification.type)}`}>
                                    {getNotificationIcon(notification.type)}
                                </div>
                            </div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-semibold text-lg ${!notification.read ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                                        {notification.title}
                                        {!notification.read && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse"></span>}
                                    </h3>
                                    <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">{notification.timestamp}</span>
                                </div>
                                <p className="text-[var(--text-secondary)] text-sm mb-0">{notification.message}</p>
                            </div>
                            <div className="flex md:flex-col gap-2 justify-end md:justify-center">
                                {!notification.read && (
                                    <button
                                        className="p-2 hover:bg-[var(--surface-tertiary)] rounded-full text-[var(--brand-primary)] transition-colors"
                                        onClick={() => markAsRead(notification.id)}
                                        title="Mark as read"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </button>
                                )}
                                <button
                                    className="p-2 hover:bg-[var(--surface-tertiary)] rounded-full text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                                    onClick={() => deleteNotification(notification.id)}
                                    title="Delete"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
