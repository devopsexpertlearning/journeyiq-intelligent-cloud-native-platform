'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    },
    {
        label: 'Users',
        href: '/users',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    },
    {
        label: 'Bookings',
        href: '/bookings',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
    },
    {
        label: 'Flights',
        href: '/inventory/flights',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
    },
    {
        label: 'Hotels',
        href: '/inventory/hotels',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 21h18"></path><path d="M5 21V7l8-4 8 4v14"></path><path d="M17 10v4"></path><path d="M12 10v4"></path><path d="M7 10v4"></path></svg>
    },
    {
        label: 'IoT Devices',
        href: '/iot',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path><line x1="2" y1="20" x2="2.01" y2="20"></line></svg>
    },
    {
        label: 'Notifications',
        href: '/notifications',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
    },
    {
        label: 'System Health',
        href: '/system',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="admin-sidebar">
            <div className="mb-8 pl-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold text-xl">
                        J
                    </div>
                    <span className="text-xl font-bold tracking-tight">
                        Journey<span className="text-gradient">IQ</span>
                    </span>
                </Link>
            </div>

            <nav className="sidebar-nav">
                <p className="px-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Platform</p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname?.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className={`nav-icon ${isActive ? 'text-[var(--brand-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                                {item.icon}
                            </span>
                            <span className="nav-label">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] shadow-[0_0_8px_var(--brand-primary)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto border-t border-[var(--border-secondary)] pt-6">
                <div className="flex items-center gap-3 px-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--surface-tertiary)] to-[var(--surface-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] font-medium">
                        AD
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">Admin User</span>
                        <span className="text-xs text-[var(--text-tertiary)]">Super Admin</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
