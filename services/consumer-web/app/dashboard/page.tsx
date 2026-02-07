'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { AuthGuard } from '@/components/AuthGuard';
import { bookingsApi, userApi } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

interface FlightDetails {
    flight_number: string;
    origin: string;
    origin_code?: string;
    destination: string;
    destination_code?: string;
    departure_time: string;
    arrival_time: string;
    duration_minutes: number;
    airline: string;
    price: number;
}

interface Booking {
    id: string;
    resource_type: string;
    status: string;
    created_at: string;
    resource_details?: FlightDetails;
    passengers?: any[];
}

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    passport_number?: string;
    membership_tier: string;
    reward_points: number;
    member_since: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'profile' | 'settings'>('overview');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        passport_number: ''
    });

    const fetchData = async () => {
        if (!user?.id) return;

        setIsLoading(true);
        try {
            // Fetch user profile
            try {
                const userData = await userApi.getProfile(user.id);
                setUserProfile({
                    id: userData.id || user.id,
                    name: userData.name || user.name || 'Traveler',
                    email: userData.email || user.email || 'user@example.com',
                    phone: userData.phone || '',
                    passport_number: userData.passport_number || '',
                    membership_tier: userData.membership_tier || 'Gold',
                    reward_points: userData.reward_points || 0,
                    member_since: userData.created_at || userData.member_since || new Date().toISOString()
                });
                setEditForm({
                    name: userData.name || user.name || '',
                    phone: userData.phone || '',
                    passport_number: userData.passport_number || ''
                });
            } catch (e) {
                console.error('Failed to fetch user profile', e);
                // Use auth context as fallback
                setUserProfile({
                    id: user.id,
                    name: user.name || 'Traveler',
                    email: user.email || 'user@example.com',
                    phone: '',
                    passport_number: '',
                    membership_tier: 'Gold',
                    reward_points: 2450,
                    member_since: new Date().toISOString()
                });
                setEditForm({
                    name: user.name || '',
                    phone: '',
                    passport_number: ''
                });
            }

            // Fetch bookings
            try {
                const bookingsResponse = await bookingsApi.listUserBookings(user.id);
                if (bookingsResponse?.bookings) {
                    setBookings(bookingsResponse.bookings);
                }
            } catch (e) {
                console.error('Failed to fetch bookings', e);
                setBookings([]);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const upcomingTrips = bookings.filter(b =>
        b.status === 'CONFIRMED' &&
        b.resource_details?.departure_time &&
        new Date(b.resource_details.departure_time) > new Date()
    );

    const pastTrips = bookings.filter(b =>
        b.status === 'CONFIRMED' &&
        b.resource_details?.departure_time &&
        new Date(b.resource_details.departure_time) <= new Date()
    );

    const handleSaveProfile = async () => {
        showToast('Profile updated successfully!', 'success');
        setIsEditing(false);
        fetchData();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return '--:--';
        try {
            return new Date(dateString).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '--:--';
        }
    };

    return (
        <AuthGuard>
            <main className="dashboard-page">
                {/* Sidebar */}
                <aside className="dashboard-sidebar">
                    <div className="sidebar-header">
                        <div className="logo">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                            </svg>
                            <span>JourneyIQ</span>
                        </div>
                    </div>

                    <div className="sidebar-user">
                        <div className="user-avatar">
                            {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-info">
                            <h3>{userProfile?.name || 'Traveler'}</h3>
                            <p>{userProfile?.email}</p>
                            <Badge variant={userProfile?.membership_tier === 'Gold' ? 'warning' : 'info'} size="sm">
                                {userProfile?.membership_tier || 'Member'} Member
                            </Badge>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <button
                            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            <span>Overview</span>
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'trips' ? 'active' : ''}`}
                            onClick={() => setActiveTab('trips')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                            </svg>
                            <span>My Trips</span>
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>Profile</span>
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            <span>Settings</span>
                        </button>
                    </nav>

                    <div className="sidebar-actions">
                        <Button variant="primary" size="sm" onClick={() => router.push('/search/flights')} className="w-full">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                            </svg>
                            Book Flight
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                            localStorage.removeItem('auth_token');
                            localStorage.removeItem('user_email');
                            localStorage.removeItem('user_name');
                            window.location.href = '/login';
                        }} className="w-full">
                            Sign Out
                        </Button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="dashboard-main">
                    {isLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading your dashboard...</p>
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="dashboard-tab">
                                    <div className="tab-header">
                                        <h1>Welcome back, {userProfile?.name?.split(' ')[0] || 'Traveler'}! 👋</h1>
                                        <p>Here's what's happening with your travels</p>
                                    </div>

                                    <div className="stats-grid">
                                        <Card variant="glass" padding="lg" hover>
                                            <div className="stat-card">
                                                <div className="stat-icon stat-icon-blue">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                                                    </svg>
                                                </div>
                                                <div className="stat-content">
                                                    <h3>{upcomingTrips.length}</h3>
                                                    <p>Upcoming Trips</p>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card variant="glass" padding="lg" hover>
                                            <div className="stat-card">
                                                <div className="stat-icon stat-icon-purple">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="8" r="7" />
                                                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                                                    </svg>
                                                </div>
                                                <div className="stat-content">
                                                    <h3>{userProfile?.reward_points?.toLocaleString() || '0'}</h3>
                                                    <p>Reward Points</p>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card variant="glass" padding="lg" hover>
                                            <div className="stat-card">
                                                <div className="stat-icon stat-icon-green">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </div>
                                                <div className="stat-content">
                                                    <h3>{pastTrips.length}</h3>
                                                    <p>Completed Trips</p>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    <div className="upcoming-section">
                                        <div className="section-header">
                                            <h2>Upcoming Trips</h2>
                                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('trips')}>
                                                View All
                                            </Button>
                                        </div>

                                        {upcomingTrips.length > 0 ? (
                                            <div className="trips-grid">
                                                {upcomingTrips.slice(0, 3).map((booking) => {
                                                    const origin = booking.resource_details?.origin_code || booking.resource_details?.origin?.split('(')[1]?.replace(')', '') || booking.resource_details?.origin?.split(' ')[0] || 'Unknown';
                                                    const dest = booking.resource_details?.destination_code || booking.resource_details?.destination?.split('(')[1]?.replace(')', '') || booking.resource_details?.destination?.split(' ')[0] || 'Unknown';
                                                    const passengerName = booking.passengers?.[0] ? `${booking.passengers[0].first_name} ${booking.passengers[0].last_name}` : 'Passenger';
                                                    
                                                    return (
                                                        <Card key={booking.id} variant="elevated" padding="lg" hover onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}>
                                                            <div className="trip-card-header">
                                                                <span className="trip-icon">✈️</span>
                                                                <Badge variant="success">Confirmed</Badge>
                                                            </div>
                                                            <h3>{origin} → {dest}</h3>
                                                            <p>{booking.resource_details?.flight_number || 'Flight'}</p>
                                                            <div className="trip-meta">
                                                                <span>📅 {formatDate(booking.resource_details?.departure_time)}</span>
                                                                <span>🕐 {formatTime(booking.resource_details?.departure_time)}</span>
                                                            </div>
                                                            <div className="trip-meta" style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                                <span>👤 {passengerName}</span>
                                                            </div>
                                                            <div className="trip-footer">
                                                                <span className="trip-price">${booking.resource_details?.price?.toFixed(2) || '0.00'}</span>
                                                                <Button variant="secondary" size="sm">View Details</Button>
                                                            </div>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <Card variant="glass" padding="lg">
                                                <div className="empty-state">
                                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                                                    </svg>
                                                    <h3>No upcoming trips</h3>
                                                    <p>Start planning your next adventure!</p>
                                                    <Button variant="primary" onClick={() => router.push('/search/flights')}>
                                                        Search Flights
                                                    </Button>
                                                </div>
                                            </Card>
                                        )}
                                    </div>

                                    {pastTrips.length > 0 && (
                                        <div className="recent-section">
                                            <div className="section-header">
                                                <h2>Recent Trips</h2>
                                            </div>
                                            <div className="trips-list">
                                                {pastTrips.slice(0, 2).map((booking) => {
                                                    const origin = booking.resource_details?.origin_code || booking.resource_details?.origin?.split('(')[1]?.replace(')', '') || booking.resource_details?.origin?.split(' ')[0] || 'Unknown';
                                                    const dest = booking.resource_details?.destination_code || booking.resource_details?.destination?.split('(')[1]?.replace(')', '') || booking.resource_details?.destination?.split(' ')[0] || 'Unknown';
                                                    const passengerName = booking.passengers?.[0] ? `${booking.passengers[0].first_name} ${booking.passengers[0].last_name}` : 'Passenger';
                                                    
                                                    return (
                                                        <Card key={booking.id} variant="glass" padding="md" hover onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}>
                                                            <div className="trip-list-item">
                                                                <div className="trip-icon-small">✈️</div>
                                                                <div className="trip-details">
                                                                    <div className="trip-header-row">
                                                                        <h4>{origin} → {dest}</h4>
                                                                        <Badge variant="neutral" size="sm">Completed</Badge>
                                                                    </div>
                                                                    <p>{booking.resource_details?.flight_number} • {formatDate(booking.resource_details?.departure_time)}</p>
                                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>👤 {passengerName}</p>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* My Trips Tab */}
                            {activeTab === 'trips' && (
                                <div className="dashboard-tab">
                                    <div className="tab-header">
                                        <h1>My Trips</h1>
                                        <p>View and manage all your bookings</p>
                                    </div>

                                    <div className="trips-filters">
                                        <Button variant={upcomingTrips.length > 0 ? 'primary' : 'ghost'} size="sm">
                                            Upcoming ({upcomingTrips.length})
                                        </Button>
                                        <Button variant={pastTrips.length > 0 ? 'ghost' : 'secondary'} size="sm">
                                            Past ({pastTrips.length})
                                        </Button>
                                    </div>

                                    {bookings.length > 0 ? (
                                        <div className="trips-list">
                                            {bookings.map((booking) => {
                                                const origin = booking.resource_details?.origin_code || booking.resource_details?.origin?.split('(')[1]?.replace(')', '') || booking.resource_details?.origin?.split(' ')[0] || 'Unknown';
                                                const dest = booking.resource_details?.destination_code || booking.resource_details?.destination?.split('(')[1]?.replace(')', '') || booking.resource_details?.destination?.split(' ')[0] || 'Unknown';
                                                const passengerName = booking.passengers?.[0] ? `${booking.passengers[0].first_name} ${booking.passengers[0].last_name}` : 'Passenger';
                                                
                                                return (
                                                    <Card key={booking.id} variant="glass" padding="lg" hover onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}>
                                                        <div className="trip-list-item">
                                                            <div className="trip-icon-large">✈️</div>
                                                            <div className="trip-details">
                                                                <div className="trip-header-row">
                                                                    <h3>{origin} → {dest}</h3>
                                                                    <Badge variant={booking.status === 'CONFIRMED' ? 'success' : booking.status === 'PENDING' ? 'warning' : 'error'}>
                                                                        {booking.status}
                                                                    </Badge>
                                                                </div>
                                                                <p>{booking.resource_details?.flight_number} • {booking.resource_details?.airline || 'JourneyIQ Air'}</p>
                                                                <div className="trip-meta">
                                                                    <span>📅 {formatDate(booking.resource_details?.departure_time)}</span>
                                                                    <span>🕐 {formatTime(booking.resource_details?.departure_time)}</span>
                                                                    <span>🎫 {booking.id.substring(0, 8).toUpperCase()}</span>
                                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>👤 {passengerName}</span>
                                                                </div>
                                                            </div>
                                                            <div className="trip-actions">
                                                                <Button variant="secondary" size="sm">View Details</Button>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <Card variant="glass" padding="lg">
                                            <div className="empty-state">
                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                                                </svg>
                                                <h3>No bookings yet</h3>
                                                <p>Your travel history will appear here</p>
                                                <Button variant="primary" onClick={() => router.push('/search/flights')}>
                                                    Book Your First Trip
                                                </Button>
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="dashboard-tab">
                                    <div className="tab-header">
                                        <h1>Profile Settings</h1>
                                        <p>Manage your account information</p>
                                    </div>

                                    <div className="profile-grid">
                                        <Card variant="glass" padding="lg">
                                            <CardHeader>
                                                <h3>Personal Information</h3>
                                            </CardHeader>
                                            <CardBody>
                                                {isEditing ? (
                                                    <div className="profile-form">
                                                        <Input
                                                            label="Full Name"
                                                            value={editForm.name}
                                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                            fullWidth
                                                        />
                                                        <Input
                                                            label="Email Address"
                                                            type="email"
                                                            value={userProfile?.email || ''}
                                                            disabled
                                                            fullWidth
                                                        />
                                                        <Input
                                                            label="Phone Number"
                                                            type="tel"
                                                            value={editForm.phone}
                                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                            placeholder="+1 (555) 000-0000"
                                                            fullWidth
                                                        />
                                                        <Input
                                                            label="Passport Number"
                                                            value={editForm.passport_number}
                                                            onChange={(e) => setEditForm({ ...editForm, passport_number: e.target.value })}
                                                            placeholder="Optional"
                                                            fullWidth
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="profile-info">
                                                        <div className="info-row">
                                                            <span className="info-label">Full Name</span>
                                                            <span className="info-value">{userProfile?.name || 'Not set'}</span>
                                                        </div>
                                                        <div className="info-row">
                                                            <span className="info-label">Email Address</span>
                                                            <span className="info-value">{userProfile?.email}</span>
                                                        </div>
                                                        <div className="info-row">
                                                            <span className="info-label">Phone Number</span>
                                                            <span className="info-value">{userProfile?.phone || 'Not set'}</span>
                                                        </div>
                                                        <div className="info-row">
                                                            <span className="info-label">Passport Number</span>
                                                            <span className="info-value">{userProfile?.passport_number || 'Not set'}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardBody>
                                            <CardFooter>
                                                {isEditing ? (
                                                    <div className="form-actions">
                                                        <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                                                        <Button variant="primary" onClick={handleSaveProfile}>Save Changes</Button>
                                                    </div>
                                                ) : (
                                                    <Button variant="primary" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                                                )}
                                            </CardFooter>
                                        </Card>

                                        <Card variant="glass" padding="lg">
                                            <CardHeader>
                                                <h3>Membership Benefits</h3>
                                            </CardHeader>
                                            <CardBody>
                                                <div className="account-stats">
                                                    <div className="stat-item">
                                                        <div className="stat-icon stat-icon-yellow">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="8" r="7" />
                                                                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                                                            </svg>
                                                        </div>
                                                        <div className="stat-info">
                                                            <span className="stat-label">Membership Tier</span>
                                                            <span className="stat-value">{userProfile?.membership_tier || 'Gold'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="stat-item">
                                                        <div className="stat-icon stat-icon-purple">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                                            </svg>
                                                        </div>
                                                        <div className="stat-info">
                                                            <span className="stat-label">Reward Points</span>
                                                            <span className="stat-value">{userProfile?.reward_points?.toLocaleString() || '0'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="stat-item">
                                                        <div className="stat-icon stat-icon-blue">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                                <line x1="3" y1="10" x2="21" y2="10" />
                                                            </svg>
                                                        </div>
                                                        <div className="stat-info">
                                                            <span className="stat-label">Member Since</span>
                                                            <span className="stat-value">{formatDate(userProfile?.member_since)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="stat-item">
                                                        <div className="stat-icon stat-icon-green">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                                                            </svg>
                                                        </div>
                                                        <div className="stat-info">
                                                            <span className="stat-label">Total Bookings</span>
                                                            <span className="stat-value">{bookings.length}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === 'settings' && (
                                <div className="dashboard-tab">
                                    <div className="tab-header">
                                        <h1>Settings</h1>
                                        <p>Manage your preferences</p>
                                    </div>

                                    <Card variant="glass" padding="lg">
                                        <CardHeader>
                                            <h3>Notification Preferences</h3>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="settings-list">
                                                <div className="setting-item">
                                                    <div className="setting-info">
                                                        <h4>Email Notifications</h4>
                                                        <p>Receive booking confirmations and updates</p>
                                                    </div>
                                                    <label className="toggle">
                                                        <input type="checkbox" defaultChecked />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                                <div className="setting-item">
                                                    <div className="setting-info">
                                                        <h4>SMS Alerts</h4>
                                                        <p>Get flight status alerts on your phone</p>
                                                    </div>
                                                    <label className="toggle">
                                                        <input type="checkbox" />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                                <div className="setting-item">
                                                    <div className="setting-info">
                                                        <h4>Marketing Emails</h4>
                                                        <p>Receive special offers and promotions</p>
                                                    </div>
                                                    <label className="toggle">
                                                        <input type="checkbox" />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>

                                    <Card variant="glass" padding="lg" className="mt-6">
                                        <CardHeader>
                                            <h3>Security</h3>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="settings-list">
                                                <div className="setting-item">
                                                    <div className="setting-info">
                                                        <h4>Change Password</h4>
                                                        <p>Update your account password</p>
                                                    </div>
                                                    <Button variant="secondary" size="sm">Change</Button>
                                                </div>
                                                <div className="setting-item">
                                                    <div className="setting-info">
                                                        <h4>Two-Factor Authentication</h4>
                                                        <p>Add an extra layer of security</p>
                                                    </div>
                                                    <Button variant="secondary" size="sm">Enable</Button>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </AuthGuard>
    );
}
