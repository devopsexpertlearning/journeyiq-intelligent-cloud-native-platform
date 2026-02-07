'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { bookingsApi, ticketingApi, notificationApi } from '@/lib/api';
import { useToast } from '@/components/Toast';

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
    class_type?: string;
}

interface Booking {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
    resource_type: string;
    resource_details?: FlightDetails;
    passengers: any[];
    contact_email?: string;
    contact_phone?: string;
}

interface PriceBreakdown {
    base_fare: number;
    taxes: number;
    extras: number;
    total: number;
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('bookingId');
    const { showToast } = useToast();

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [emailSending, setEmailSending] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            if (!bookingId) {
                setLoading(false);
                return;
            }

            try {
                const data = await bookingsApi.get(bookingId);
                console.log('API Booking data:', data);

                const flight = data.resource_details || {};
                const originCode = flight.origin_code || flight.origin?.match(/\(([^)]+)\)/)?.[1] || flight.origin?.split(' ')[0] || 'LAX';
                const destCode = flight.destination_code || flight.destination?.match(/\(([^)]+)\)/)?.[1] || flight.destination?.split(' ')[0] || 'JFK';

                const passengerCount = data.passengers?.length || 1;
                const baseFare = flight.price || 0;
                const taxes = baseFare * passengerCount * 0.15;
                const total = data.total_amount || (baseFare * passengerCount + taxes);

                setBooking({
                    id: data.id || bookingId,
                    status: data.status || 'CONFIRMED',
                    total_amount: total,
                    created_at: data.created_at || new Date().toISOString(),
                    resource_type: data.resource_type || 'FLIGHT',
                    resource_details: {
                        ...flight,
                        origin_code: originCode,
                        destination_code: destCode
                    },
                    passengers: data.passengers || [],
                    contact_email: data.passengers?.[0]?.email || data.contact_email || 'passenger@example.com',
                    contact_phone: data.passengers?.[0]?.phone || data.contact_phone || '+1-555-000-0000'
                });
            } catch (error) {
                console.error('Failed to fetch booking from API', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId]);

    const handleDownloadTicket = async () => {
        if (!bookingId || !booking) return;
        setDownloading(true);
        try {
            const passenger = booking.passengers?.[0] || { first_name: 'Passenger', last_name: 'One' };

            const ticketRes = await ticketingApi.generate(bookingId, {
                first_name: passenger.first_name,
                last_name: passenger.last_name,
                seat_number: '12A'
            });

            if (ticketRes.ticket_id) {
                const downloadUrl = ticketingApi.getDownloadUrl(ticketRes.ticket_id);
                window.open(downloadUrl, '_blank');
                showToast('E-Ticket downloaded successfully!', 'success');
            }
        } catch (error: any) {
            console.error('Ticket Error', error);
            showToast('Failed to download ticket. Please try again.', 'error');
        } finally {
            setDownloading(false);
        }
    };

    const handleEmailConfirmation = async () => {
        if (!booking || !bookingId) return;
        setEmailSending(true);
        try {
            const passenger = booking.passengers?.[0] || { first_name: 'Passenger', last_name: 'One' };
            const flight = booking.resource_details || {} as any;

            // Safer parsing of codes
            const originCode = flight.origin_code ||
                (flight.origin?.includes('(') ? flight.origin.split('(')[1]?.replace(')', '') : flight.origin) ||
                'Unknown';

            const destCode = flight.destination_code ||
                (flight.destination?.includes('(') ? flight.destination.split('(')[1]?.replace(')', '') : flight.destination) ||
                'Unknown';

            const content = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0;">✈️ Booking Confirmed!</h1>
                    <p style="margin: 10px 0 0 0;">Confirmation: ${booking.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div style="padding: 30px; background: #f5f5f5;">
                    <h2 style="color: #333;">Flight Details</h2>
                    <p><strong>${flight.airline || 'JourneyIQ Air'}</strong> - ${flight.flight_number}</p>
                    <p>${originCode} → ${destCode}</p>
                    <p>${formatDate(flight.departure_time)} at ${formatTime(flight.departure_time)}</p>
                    <h2 style="color: #333; margin-top: 20px;">Passenger</h2>
                    <p>${passenger.first_name} ${passenger.last_name}</p>
                    <h2 style="color: #333; margin-top: 20px;">Total Paid</h2>
                    <p style="font-size: 24px; font-weight: bold; color: #667eea;">$${(booking.total_amount || 0).toFixed(2)}</p>
                    <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/bookings/${booking.id}" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px;">View Booking Details</a>
                </div>
            </div>`;

            await notificationApi.sendBookingConfirmation(
                bookingId,
                booking.contact_email || 'passenger@example.com',
                `Your JourneyIQ Booking Confirmation - ${booking.id.substring(0, 8).toUpperCase()}`,
                content
            );
            showToast('Confirmation email sent successfully!', 'success');
        } catch (error: any) {
            console.error('Email Error', error);
            showToast('Failed to send email. Please try again.', 'error');
        } finally {
            setEmailSending(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Date TBD';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return '--:--';
        try {
            return new Date(dateString).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return '--:--';
        }
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'Date TBD';
        try {
            return new Date(dateString).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    if (loading) {
        return (
            <div className="booking-container text-center p-8">
                <div className="loading-spinner"></div>
                <p className="mt-4 text-[var(--text-secondary)]">Generating your confirmation...</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="booking-container text-center p-8">
                <h2 className="text-2xl font-bold mb-4">Booking Not Found</h2>
                <p className="text-[var(--text-secondary)] mb-6">We could not locate your booking details.</p>
                <Link href="/">
                    <Button>Return to Home</Button>
                </Link>
            </div>
        );
    }

    const flight = booking.resource_details || {} as any;
    const originCode = flight.origin_code || flight.origin?.match(/\(([^)]+)\)/)?.[1] || flight.origin?.split(' ')[0] || 'LAX';
    const destCode = flight.destination_code || flight.destination?.match(/\(([^)]+)\)/)?.[1] || flight.destination?.split(' ')[0] || 'JFK';
    const prices: PriceBreakdown = {
        base_fare: (flight.price || 0) * (booking.passengers?.length || 1),
        taxes: ((flight.price || 0) * (booking.passengers?.length || 1)) * 0.15,
        extras: 0,
        total: booking.total_amount || ((flight.price || 0) * (booking.passengers?.length || 1) * 1.15)
    };

    return (
        <div className="booking-layout">
            <div className="booking-header" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <h1 className="booking-title" style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>Booking Confirmed!</h1>
                <p style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Confirmation number: <strong style={{ color: 'var(--brand-primary)' }}>{booking.id.substring(0, 8).toUpperCase()}</strong>
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                    A confirmation email has been sent to <strong>{booking.contact_email}</strong>
                </p>
            </div>

            <div className="booking-content" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', padding: '0 20px' }}>
                <div className="booking-main">
                    <Card className="review-section mb-6">
                        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                            </svg>
                            <h2 style={{ margin: 0 }}>Flight Details</h2>
                            <div className="ml-auto"><Badge variant="success">{booking.status}</Badge></div>
                        </div>

                        <div style={{ background: 'var(--surface-secondary)', padding: '20px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ width: '48px', height: '48px', background: 'var(--brand-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', marginRight: '16px' }}>
                                    {flight.airline?.substring(0, 2) || 'JQ'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>{flight.airline || 'JourneyIQ Air'}</div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{flight.flight_number}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatTime(flight.departure_time)}</div>
                                    <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '4px' }}>{originCode}</div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{formatDate(flight.departure_time)}</div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'center', padding: '0 20px' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{Math.floor((flight.duration_minutes || 0) / 60)}h {(flight.duration_minutes || 0) % 60}m</div>
                                    <div style={{ borderTop: '2px solid var(--border-primary)', marginTop: '8px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 8px' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--brand-primary)">
                                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatTime(flight.arrival_time)}</div>
                                    <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '4px' }}>{destCode}</div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{formatDate(flight.arrival_time)}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                <Badge variant="info">Economy</Badge>
                                <Badge variant="neutral">Terminal 4</Badge>
                                <Badge variant="neutral">Gate D4</Badge>
                            </div>
                        </div>
                    </Card>

                    <Card className="review-section mb-6">
                        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <h2 style={{ margin: 0 }}>Passengers ({booking.passengers?.length || 0})</h2>
                        </div>

                        {booking.passengers?.length > 0 ? (
                            booking.passengers.map((passenger: any, index: number) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'var(--surface-secondary)', borderRadius: '8px', marginBottom: '8px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{index + 1}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600' }}>{passenger.title || 'Mr./Ms.'} {passenger.first_name} {passenger.last_name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            DOB: {passenger.date_of_birth?.split('T')[0] || 'N/A'} • Passport: {passenger.passport_number || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No passenger information available</p>
                        )}
                    </Card>

                    <Card className="review-section mb-6">
                        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                            <h2 style={{ margin: 0 }}>Payment Information</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Payment Status</div>
                                <Badge variant="success">{booking.status}</Badge>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Payment Method</div>
                                <div style={{ fontWeight: '500' }}>Credit Card</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Booked On</div>
                                <div style={{ fontWeight: '500' }}>{formatDateTime(booking.created_at)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Contact Email</div>
                                <div style={{ fontWeight: '500' }}>{booking.contact_email}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Contact Phone</div>
                                <div style={{ fontWeight: '500' }}>{booking.contact_phone}</div>
                            </div>
                        </div>
                    </Card>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                        <Button onClick={handleDownloadTicket} isLoading={downloading} size="xl" style={{ flex: 1 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download E-Ticket (PDF)
                        </Button>
                        <Button onClick={handleEmailConfirmation} variant="secondary" size="xl" style={{ flex: 1 }} isLoading={emailSending}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            Email Confirmation
                        </Button>
                    </div>
                </div>

                <aside className="booking-sidebar">
                    <Card className="price-summary">
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Booking Summary</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>Base Fare ({booking.passengers?.length || 0} passenger{(booking.passengers?.length || 0) !== 1 ? 's' : ''})</div>
                            <div>${prices.base_fare.toFixed(2)}</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>Taxes & Fees</div>
                            <div>${prices.taxes.toFixed(2)}</div>
                        </div>

                        <div style={{ height: '1px', background: 'var(--border-primary)', margin: '16px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: '600', fontSize: '16px' }}>Total Paid</div>
                            <div style={{ fontWeight: '700', fontSize: '20px', color: 'var(--brand-primary)' }}>${prices.total.toFixed(2)}</div>
                        </div>
                    </Card>

                    <div style={{ marginTop: '16px', background: 'var(--surface-secondary)', padding: '20px', borderRadius: '12px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Important Information</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <span>Check-in opens 24 hours before departure</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <span>Arrive at least 3 hours before international flights</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <span>Bring valid passport and travel documents</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <span>Gate closes 20 minutes before departure</span>
                            </li>
                        </ul>
                    </div>

                    <Link href="/dashboard" style={{ display: 'block', marginTop: '16px' }}>
                        <Button variant="secondary" style={{ width: '100%' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            View All Bookings
                        </Button>
                    </Link>
                </aside>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <main className="booking-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '20px' }}>
            <Suspense fallback={
                <div className="booking-container text-center p-8">
                    <div className="loading-spinner"></div>
                    <p className="mt-4 text-[var(--text-secondary)]">Loading confirmation...</p>
                </div>
            }>
                <SuccessContent />
            </Suspense>
        </main>
    );
}
