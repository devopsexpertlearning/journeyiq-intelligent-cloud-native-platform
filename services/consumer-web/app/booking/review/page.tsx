'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Flight } from '@/types/flight';
import { getAirlineInfo, formatTime, formatDuration } from '@/lib/flight-utils';
import { bookingsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ExtraWithDetails {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

function BookingReviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const flightId = searchParams.get('flightId');
    const { user } = useAuth();
    const { showToast } = useToast();

    const [flight, setFlight] = useState<Flight | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [passengers, setPassengers] = useState<any[]>([]);
    const [seats, setSeats] = useState<any[]>([]);
    const [extras, setExtras] = useState<any[]>([]);

    useEffect(() => {
        const loadBookingData = async () => {
            // First try to load from sessionStorage (faster)
            const storedFlight = sessionStorage.getItem('selected_flight');
            const passengersData = sessionStorage.getItem('booking_flow_passengers');
            const seatsData = sessionStorage.getItem('booking_flow_seats');
            const extrasData = sessionStorage.getItem('booking_flow_extras');

            // Load passengers
            if (passengersData) {
                try {
                    const data = JSON.parse(passengersData);
                    setPassengers(data.passengers || []);
                } catch (e) {
                    console.error("Failed to restore passengers", e);
                }
            }

            // Load seats
            if (seatsData) {
                try {
                    const data = JSON.parse(seatsData);
                    setSeats(data.seats || []);
                } catch (e) {
                    console.error("Failed to restore seats", e);
                }
            }

            // Load extras
            if (extrasData) {
                try {
                    const data = JSON.parse(extrasData);
                    setExtras(data.extras || []);
                } catch (e) {
                    console.error("Failed to restore extras", e);
                }
            }

            // If we have stored flight data, use it directly (avoid API call)
            if (storedFlight) {
                try {
                    const flightData = JSON.parse(storedFlight);
                    setFlight({
                        id: flightData.id,
                        flight_number: flightData.flight_number,
                        origin: flightData.origin,
                        destination: flightData.destination,
                        departure_time: flightData.departure_time,
                        arrival_time: flightData.arrival_time,
                        duration_minutes: flightData.duration_minutes,
                        base_price: flightData.base_price,
                        class_type: flightData.class_type,
                        available_seats: flightData.available_seats
                    });
                    setIsLoading(false);
                    return;
                } catch (e) {
                    console.error("Failed to restore flight data", e);
                }
            }

            // Otherwise fetch from API
            if (flightId) {
                try {
                    const data = await api.get<Flight>(`/search/flights/${flightId}`);
                    setFlight(data);
                } catch (error) {
                    console.error("Failed to fetch flight details", error);
                    showToast("Failed to load flight details", "error");
                }
            }

            setIsLoading(false);
        };

        loadBookingData();
    }, [flightId, showToast]);

    if (isLoading) {
        return (
            <div className="booking-container text-center p-8">
                <div className="loading-spinner"></div>
                <p>Loading booking details...</p>
            </div>
        );
    }

    if (!flight) {
        return (
            <div className="booking-container text-center p-8">
                <h2>Flight not found</h2>
                <Button onClick={() => router.push('/')} className="mt-4">Return to Search</Button>
            </div>
        );
    }

    const airline = getAirlineInfo(flight.flight_number);
    const basePrice = Number(flight.base_price || 0);
    const TAX_RATE = 0.15;
    const taxes = basePrice * TAX_RATE;

    // Define add-ons with prices (should match extras page)
    const addOnsDefinitions = [
        { id: 'baggage', name: 'Extra Baggage', price: 50 },
        { id: 'meal', name: 'Premium Meal', price: 25 },
        { id: 'insurance', name: 'Travel Insurance', price: 35 },
        { id: 'priority', name: 'Priority Boarding', price: 15 },
        { id: 'lounge', name: 'Airport Lounge Access', price: 45 },
        { id: 'wifi', name: 'In-Flight WiFi', price: 20 }
    ];

    // Calculate seat upgrades total
    const seatsData = typeof window !== 'undefined' ? sessionStorage.getItem('booking_flow_seats') : null;
    const seatUpgradesTotal = seatsData ? JSON.parse(seatsData).totalPrice : 0;

    // Map extras to include names and prices from definitions
    const extrasWithDetails: ExtraWithDetails[] = extras.map(extra => {
        const definition = addOnsDefinitions.find(a => a.id === extra.id);
        return {
            id: extra.id,
            name: definition?.name || extra.id,
            price: definition?.price || 0,
            quantity: extra.quantity || 1
        };
    });

    // Calculate extras total
    const extrasTotal = extrasWithDetails.reduce((sum, extra) =>
        sum + (extra.price * extra.quantity), 0
    );

    const passengerCount = passengers.length || 1;
    const totalBaseFare = basePrice * passengerCount;
    // Taxes are per passenger
    const totalTaxes = (basePrice * TAX_RATE) * passengerCount;

    const grandTotal = totalBaseFare + totalTaxes + seatUpgradesTotal + extrasTotal;

    const handleProceedToPayment = async () => {
        setIsLoading(true);
        try {
            // Get userId
            let userId = user?.id;
            if (!userId) {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        userId = payload.sub || payload.user_id;
                    } catch (e) { console.error(e); }
                }
            }

            if (!userId) {
                showToast("User not authenticated", "error");
                router.push('/login');
                return;
            }

            // Construct payload
            const payload = {
                flight_id: flightId,
                user_id: userId,
                passengers: passengers.map((p: any) => ({
                    first_name: p.firstName,
                    last_name: p.lastName,
                    date_of_birth: p.dateOfBirth,
                    passport_number: p.passportNumber
                })),
                class_type: "economy",
                add_ons: extras.flatMap(extra =>
                    Array(extra.quantity).fill(extra.id)
                )
            };

            // Create booking
            const booking = await bookingsApi.createBooking(payload);

            if (booking && booking.id) {
                // Store complete booking data for checkout page before clearing
                const seatsData = sessionStorage.getItem('booking_flow_seats');
                const seatsStorage = seatsData ? JSON.parse(seatsData) : { seats: [], totalPrice: 0 };
                const extrasData = sessionStorage.getItem('booking_flow_extras');
                const extrasStorage = extrasData ? JSON.parse(extrasData) : { extras: [], total: 0 };

                // Seats are already stored with complete info from seats page
                const seatsWithDetails = (seatsStorage.seats || []).map((seat: any) => ({
                    id: seat.id,
                    name: seat.name,
                    price: Number(seat.price) || 0
                }));

                // Map extras with proper info
                const extrasWithDetails = extrasStorage.extras.map((extra: any) => {
                    const addonInfo = addOnsDefinitions.find((a: any) => a.id === extra.id);
                    return {
                        id: extra.id,
                        name: addonInfo?.name || extra.id,
                        price: addonInfo?.price || 0,
                        quantity: extra.quantity || 1
                    };
                });

                const completeBooking = {
                    id: booking.id,
                    flight_id: booking.flight_id,
                    status: booking.status,
                    total_amount: booking.total_amount,
                    resource_details: {
                        flight_number: flight.flight_number,
                        origin: flight.origin,
                        destination: flight.destination,
                        price: flight.base_price,
                        currency: 'USD',
                        class_type: 'Economy',
                        departure_time: flight.departure_time,
                        arrival_time: flight.arrival_time,
                        duration_minutes: flight.duration_minutes,
                        airline: airline.name,
                        aircraft: flight.aircraft_type || 'Boeing 737-800'
                    },
                    passengers: passengers,
                    seats: seatsWithDetails,
                    extras: extrasWithDetails,
                    price_breakdown: {
                        base_fare: totalBaseFare,
                        taxes: 0, // Taxes calculated in checkout
                        seat_upgrades: seatUpgradesTotal,
                        add_ons: extrasTotal,
                        total: grandTotal
                    }
                };
                sessionStorage.setItem('checkout_booking', JSON.stringify(completeBooking));
                console.log('Stored checkout_booking:', completeBooking.id, completeBooking.total_amount, completeBooking.extras, completeBooking.seats);

                // Clear session storage
                sessionStorage.removeItem('booking_flow_passengers');
                sessionStorage.removeItem('booking_flow_seats');
                sessionStorage.removeItem('booking_flow_extras');

                showToast("Booking created successfully!", "success");
                router.push(`/checkout?bookingId=${booking.id}`);
            } else {
                showToast("Failed to create booking", "error");
            }

        } catch (error: any) {
            console.error("Booking Error", error);
            showToast(error.message || "Failed to create booking", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="booking-layout">
            {/* Progress Indicator */}
            <div className="booking-progress">
                <div className="progress-step completed">
                    <div className="step-number">✓</div>
                    <div className="step-label">Passengers</div>
                </div>
                <div className="progress-line completed"></div>
                <div className="progress-step completed">
                    <div className="step-number">✓</div>
                    <div className="step-label">Seats</div>
                </div>
                <div className="progress-line completed"></div>
                <div className="progress-step completed">
                    <div className="step-number">✓</div>
                    <div className="step-label">Extras</div>
                </div>
                <div className="progress-line completed"></div>
                <div className="progress-step active">
                    <div className="step-number">4</div>
                    <div className="step-label">Review</div>
                </div>
            </div>

            <div className="booking-content">
                {/* Main Content */}
                <div className="booking-main">
                    {/* Flight Details */}
                    <Card className="review-section">
                        <div className="section-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                            </svg>
                            <h2>Flight Details</h2>
                        </div>

                        <div className="flight-info-card">
                            <div className="airline-header">
                                <div className="airline-logo">{airline.logo}</div>
                                <div>
                                    <div className="airline-name">{airline.name}</div>
                                    <div className="flight-number">{flight.flight_number}</div>
                                </div>
                            </div>

                            <div className="flight-route">
                                <div className="route-point">
                                    <div className="route-time">{formatTime(flight.departure_time)}</div>
                                    <div className="route-location">{flight.origin}</div>
                                    <div className="route-date">{new Date(flight.departure_time).toLocaleDateString()}</div>
                                </div>

                                <div className="route-line">
                                    <div className="route-duration">{formatDuration(flight.duration_minutes)}</div>
                                    <div className="route-arrow">
                                        <svg width="100%" height="2" viewBox="0 0 100 2">
                                            <line x1="0" y1="1" x2="100" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                        </svg>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="route-point">
                                    <div className="route-time">{formatTime(flight.arrival_time)}</div>
                                    <div className="route-location">{flight.destination}</div>
                                    <div className="route-date">{new Date(flight.arrival_time).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="flight-meta">
                                <Badge variant="info">Economy Class</Badge>
                                <Badge variant="success">{flight.available_seats} seats available</Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Passenger Details */}
                    <Card className="review-section">
                        <div className="section-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <h2>Passengers ({passengers.length})</h2>
                        </div>

                        {passengers.length > 0 ? (
                            <div className="passengers-list">
                                {passengers.map((passenger, index) => (
                                    <div key={index} className="passenger-item">
                                        <div className="passenger-number">{index + 1}</div>
                                        <div className="passenger-details">
                                            <div className="passenger-name">
                                                {passenger.title} {passenger.firstName} {passenger.lastName}
                                            </div>
                                            <div className="passenger-info">
                                                DOB: {passenger.dateOfBirth} • Passport: {passenger.passportNumber}
                                            </div>
                                        </div>
                                        {seats[index] && (
                                            <Badge variant="info">Seat {seats[index].id}</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-state">No passenger information available</p>
                        )}
                    </Card>

                    {/* Add-ons */}
                    {extrasWithDetails.length > 0 && (
                        <Card className="review-section">
                            <div className="section-header">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                                <h2>Add-ons</h2>
                            </div>

                            <div className="extras-list">
                                {extrasWithDetails.map((extra, index) => (
                                    <div key={index} className="extra-item">
                                        <div className="extra-info">
                                            <span className="extra-name">{extra.name}</span>
                                            {extra.quantity > 1 && (
                                                <span className="extra-quantity">x{extra.quantity}</span>
                                            )}
                                        </div>
                                        <div className="extra-price">${(extra.price * extra.quantity).toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    <div className="booking-actions">
                        <Button variant="secondary" onClick={() => router.back()}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Go Back
                        </Button>
                        <Button onClick={handleProceedToPayment}>
                            Proceed to Payment
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                        </Button>
                    </div>
                </div>

                {/* Sticky Sidebar - Price Summary */}
                <aside className="booking-sidebar">
                    <Card className="price-summary">
                        <h3 className="summary-title">Price Summary</h3>

                        <div className="summary-section">
                            <div className="summary-label">Base Fare ({passengerCount} passenger{passengerCount !== 1 ? 's' : ''})</div>
                            <div className="summary-value">${totalBaseFare.toFixed(2)}</div>
                        </div>

                        <div className="summary-section">
                            <div className="summary-label">Taxes & Fees</div>
                            <div className="summary-value">${totalTaxes.toFixed(2)}</div>
                        </div>

                        {seatUpgradesTotal > 0 && (
                            <div className="summary-section">
                                <div className="summary-label">Seat Upgrades</div>
                                <div className="summary-value">${seatUpgradesTotal.toFixed(2)}</div>
                            </div>
                        )}

                        {extrasTotal > 0 && (
                            <div className="summary-section">
                                <div className="summary-label">Add-ons</div>
                                <div className="summary-value">${extrasTotal.toFixed(2)}</div>
                            </div>
                        )}

                        <div className="summary-divider"></div>

                        <div className="summary-total">
                            <div className="total-label">Total Amount</div>
                            <div className="total-value">${grandTotal.toFixed(2)}</div>
                        </div>

                        <div className="trust-badges">
                            <div className="trust-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                <span>Secure Payment</span>
                            </div>
                            <div className="trust-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Instant Confirmation</span>
                            </div>
                            <div className="trust-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                <span>24/7 Support</span>
                            </div>
                        </div>
                    </Card>
                </aside>
            </div>
        </div>
    );
}

export default function BookingReviewPage() {
    return (
        <main className="booking-page">
            <div className="booking-header">
                <h1 className="booking-title">Review Your Booking</h1>
                <p className="booking-subtitle">Please review all details before proceeding to payment</p>
            </div>
            <Suspense fallback={
                <div className="booking-container text-center p-8">
                    <div className="loading-spinner"></div>
                    <p>Loading booking details...</p>
                </div>
            }>
                <BookingReviewContent />
            </Suspense>
        </main>
    );
}
