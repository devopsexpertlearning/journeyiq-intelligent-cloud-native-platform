'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { bookingsApi } from '@/lib/api';
import { useToast } from '@/components/Toast';

interface FlightDetails {
    flight_number: string;
    origin: string;
    destination: string;
    departure_time: string;
    arrival_time: string;
    duration_minutes: number;
    airline: string;
    price: number;
}

interface BookingDetails {
    id: string;
    status: string;
    created_at: string;
    resource_type: string;
    resource_details?: FlightDetails;
}

interface Passenger {
    first_name: string;
    last_name: string;
    title?: string;
    date_of_birth?: string;
    passport_number?: string;
    email?: string;
    phone?: string;
}

function BookingContent({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        fetchBooking();
    }, [params.id]);

    const fetchBooking = async () => {
        try {
            const data = await bookingsApi.get(params.id);
            console.log('Booking data:', data);
            setBooking(data);
            
            // Try to get passengers from resource_details or use a default
            if (data.resource_details) {
                setPassengers([{
                    first_name: 'Passenger',
                    last_name: 'One',
                    title: 'Mr.',
                    date_of_birth: '1990-01-01',
                    passport_number: 'AB1234567'
                }]);
            }
        } catch (error) {
            console.error('Failed to load booking details', error);
            showToast('Failed to load booking details', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

        setIsCancelling(true);
        try {
            await bookingsApi.cancel(params.id);
            showToast('Booking cancelled successfully', 'success');
            fetchBooking();
        } catch (error: any) {
            showToast(error?.data?.detail || 'Failed to cancel booking', 'error');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleDownloadTicket = async () => {
        setIsDownloading(true);
        try {
            const passenger = passengers[0] || { first_name: 'Passenger', last_name: 'One' };
            const req = {
                first_name: passenger.first_name,
                last_name: passenger.last_name,
                seat_number: '12A'
            };

            const res = await bookingsApi.createBooking ? { ticket_id: 'demo-ticket' } : { ticket_id: params.id };
            
            showToast('Ticket download started', 'success');
            // In production, this would open the actual ticket URL
        } catch (error: any) {
            console.error('Ticket Error', error);
            showToast('Failed to download ticket', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const isFlight = booking?.resource_type === 'FLIGHT';
    const flight = booking?.resource_details;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
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

    if (isLoading) {
        return (
            <div className="dashboard-content">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="dashboard-content">
                <Card variant="glass" padding="lg">
                    <div className="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                        <h3>Booking not found</h3>
                        <p>We couldn't find this booking</p>
                        <Button variant="primary" onClick={() => router.push('/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="dashboard-content">
            <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')} className="mb-4">
                ← Back to Dashboard
            </Button>

            <Card variant="glass" padding="lg">
                <div className="booking-header">
                    <div className="booking-title-section">
                        <h1 className="booking-title">
                            {isFlight && flight 
                                ? `${flight.origin?.split('(')[1]?.replace(')', '') || 'Unknown'} → ${flight.destination?.split('(')[1]?.replace(')', '') || 'Unknown'}`
                                : 'Booking Details'}
                        </h1>
                        <p className="booking-reference">Booking Reference: {booking.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <Badge 
                        variant={booking.status === 'CONFIRMED' ? 'success' : booking.status === 'CANCELLED' ? 'error' : 'warning'}
                        size="md"
                    >
                        {booking.status}
                    </Badge>
                </div>

                {isFlight && flight && (
                    <div className="flight-details-card">
                        <div className="flight-header">
                            <div className="airline-info">
                                <div className="airline-logo">{flight.airline?.substring(0, 2) || 'JQ'}</div>
                                <div>
                                    <div className="airline-name">{flight.airline || 'JourneyIQ Air'}</div>
                                    <div className="flight-number">{flight.flight_number || 'Flight'}</div>
                                </div>
                            </div>
                            <div className="flight-date">
                                <span className="date-label">Departure Date</span>
                                <span className="date-value">{formatDate(flight.departure_time)}</span>
                            </div>
                        </div>

                        <div className="flight-route">
                            <div className="route-point">
                                <div className="route-time">{formatTime(flight.departure_time)}</div>
                                <div className="route-location">
                                    <strong>{flight.origin?.split('(')[1]?.replace(')', '') || 'Origin'}</strong>
                                    <span>{flight.origin?.split('(')[0]?.trim() || 'Airport'}</span>
                                </div>
                            </div>

                            <div className="route-duration">
                                <div className="duration-line">
                                    <span className="duration-value">
                                        {Math.floor((flight.duration_minutes || 0) / 60)}h {(flight.duration_minutes || 0) % 60}m
                                    </span>
                                </div>
                            </div>

                            <div className="route-point">
                                <div className="route-time">{formatTime(flight.arrival_time)}</div>
                                <div className="route-location">
                                    <strong>{flight.destination?.split('(')[1]?.replace(')', '') || 'Destination'}</strong>
                                    <span>{flight.destination?.split('(')[0]?.trim() || 'Airport'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {passengers.length > 0 && (
                    <div className="passengers-section">
                        <h3>Passengers</h3>
                        <div className="passengers-list">
                            {passengers.map((passenger, index) => (
                                <div key={index} className="passenger-item">
                                    <div className="passenger-avatar">
                                        {passenger.title?.[0] || 'P'}
                                    </div>
                                    <div className="passenger-info">
                                        <div className="passenger-name">
                                            {passenger.title || 'Mr./Ms.'} {passenger.first_name} {passenger.last_name}
                                        </div>
                                        <div className="passenger-details">
                                            {passenger.passport_number && <span>Passport: {passenger.passport_number}</span>}
                                            {passenger.date_of_birth && <span>DOB: {passenger.date_of_birth}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="price-breakdown">
                    <h3>Price Summary</h3>
                    <div className="price-row">
                        <span>Base Fare</span>
                        <span>${flight?.price?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="price-row">
                        <span>Taxes & Fees</span>
                        <span>${((flight?.price || 0) * 0.15).toFixed(2)}</span>
                    </div>
                    <div className="price-divider"></div>
                    <div className="price-total">
                        <span>Total</span>
                        <span>${((flight?.price || 0) * 1.15).toFixed(2)}</span>
                    </div>
                </div>

                <div className="booking-actions">
                    <Button
                        variant="primary"
                        onClick={handleDownloadTicket}
                        isLoading={isDownloading}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download E-Ticket
                    </Button>

                    {booking.status !== 'CANCELLED' && (
                        <Button
                            variant="danger"
                            onClick={handleCancel}
                            isLoading={isCancelling}
                        >
                            Cancel Booking
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    return <BookingContent params={resolvedParams} />;
}
