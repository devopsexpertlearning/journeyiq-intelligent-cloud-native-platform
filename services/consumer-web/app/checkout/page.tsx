'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { bookingsApi, paymentApi } from '@/lib/api';
import { useToast } from '@/components/Toast';

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('bookingId');
    const { showToast } = useToast();

    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingBooking, setIsLoadingBooking] = useState(true);
    const [booking, setBooking] = useState<any>(null);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [paymentData, setPaymentData] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        billingAddress: '',
        city: '',
        zipCode: '',
        country: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchBooking = async () => {
            if (!bookingId) {
                setIsLoadingBooking(false);
                return;
            }

            try {
                // First try to load from sessionStorage (complete booking data)
                const checkoutBookingData = sessionStorage.getItem('checkout_booking');
                console.log('checkout_booking found:', !!checkoutBookingData);
                
                if (checkoutBookingData) {
                    try {
                        const checkoutBooking = JSON.parse(checkoutBookingData);
                        console.log('checkout_booking parsed, id:', checkoutBooking.id, 'extras:', checkoutBooking.extras, 'seats:', checkoutBooking.seats);
                        // Use checkout_booking if it exists (it's the most recent complete data from review page)
                        if (checkoutBooking.extras?.length > 0 || checkoutBooking.seats?.length > 0 || checkoutBooking.total_amount) {
                            console.log('Using checkout_booking data');
                            setBooking(checkoutBooking);
                            setIsLoadingBooking(false);
                            return;
                        }
                    } catch (e) {
                        console.error("Failed to parse checkout booking", e);
                    }
                } else {
                    console.log('No checkout_booking found in sessionStorage');
                }

                // Try to load individual sessionStorage data
                const storedFlight = sessionStorage.getItem('selected_flight');
                const passengersData = sessionStorage.getItem('booking_flow_passengers');
                const seatsData = sessionStorage.getItem('booking_flow_seats');
                const extrasData = sessionStorage.getItem('booking_flow_extras');

                // Add-ons definitions with prices
                const addOnsDefinitions = [
                    { id: 'baggage', name: 'Extra Baggage (23kg)', price: 50 },
                    { id: 'meal', name: 'Premium Meal', price: 25 },
                    { id: 'insurance', name: 'Travel Insurance', price: 35 },
                    { id: 'priority', name: 'Priority Boarding', price: 15 },
                    { id: 'lounge', name: 'Airport Lounge Access', price: 45 },
                    { id: 'wifi', name: 'In-Flight WiFi', price: 20 }
                ];

                if (storedFlight && passengersData && !bookingId.includes('not-found')) {
                    try {
                        const flightData = JSON.parse(storedFlight);
                        const passengersInfo = JSON.parse(passengersData);
                        const seatsInfo = seatsData ? JSON.parse(seatsData) : { seats: [] };
                        const extrasInfo = extrasData ? JSON.parse(extrasData) : { extras: [] };

                        // Seats are already stored with complete info from seats page
                        const seatsWithDetails = (seatsInfo.seats || []).map((seat: any) => ({
                            id: seat.id,
                            name: seat.name,
                            price: Number(seat.price) || 0
                        }));

                        // Map extras with proper info
                        const extrasWithDetails = (extrasInfo.extras || []).map((extra: any) => {
                            const addonInfo = addOnsDefinitions.find((a: any) => a.id === extra.id);
                            return {
                                id: extra.id,
                                name: addonInfo?.name || extra.id,
                                price: addonInfo?.price || 0,
                                quantity: extra.quantity || 1
                            };
                        });

                        setBooking({
                            id: bookingId || 'pending',
                            status: 'PENDING_PAYMENT',
                            resource_details: {
                                flight_number: flightData.flight_number || 'JQ-000',
                                airline: flightData.airline || 'JourneyIQ Air',
                                origin: flightData.origin || 'Origin',
                                destination: flightData.destination || 'Destination',
                                departure_time: flightData.departure_time || new Date().toISOString(),
                                arrival_time: flightData.arrival_time || new Date().toISOString(),
                                duration_minutes: flightData.duration_minutes || 0,
                                price: flightData.base_price || 299.00,
                                currency: 'USD',
                                class_type: flightData.class_type || 'Economy',
                                aircraft: flightData.aircraft || 'Boeing 737-800'
                            },
                            passengers: passengersInfo.passengers || [],
                            extras: extrasWithDetails,
                            seats: seatsWithDetails
                        });
                        setIsLoadingBooking(false);
                        return;
                    } catch (e) {
                        console.error("Failed to restore from sessionStorage", e);
                    }
                }

                // Fall back to API call
                if (bookingId === '00000000-0000-0000-0000-000000000000') {
                    setBooking({
                        id: bookingId,
                        status: 'PENDING_PAYMENT',
                        resource_details: {
                            flight_number: 'JQ-452',
                            airline: 'JourneyIQ Air',
                            origin: 'Los Angeles (LAX)',
                            destination: 'New York (JFK)',
                            departure_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                            arrival_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 5.5 * 60 * 60 * 1000).toISOString(),
                            duration_minutes: 330,
                            price: 299.00,
                            currency: 'USD',
                            class_type: 'Economy',
                            aircraft: 'Boeing 737-800'
                        },
                        passengers: [
                            { first_name: 'John', last_name: 'Doe', title: 'Mr.', date_of_birth: '1985-03-15', passport_number: 'AB1234567', email: 'john.doe@email.com', phone: '+1-555-123-4567' },
                            { first_name: 'Jane', last_name: 'Doe', title: 'Ms.', date_of_birth: '1988-07-22', passport_number: 'CD7654321', email: 'jane.doe@email.com', phone: '+1-555-987-6543' }
                        ],
                        extras: [
                            { id: 'baggage', name: 'Extra Baggage (23kg)', price: 45.00, quantity: 2 },
                            { id: 'meal', name: 'Premium Meal', price: 25.00, quantity: 2 }
                        ],
                        seats: [
                            { id: '12A', name: 'Window Seat', price: 35.00 },
                            { id: '12B', name: 'Middle Seat', price: 25.00 }
                        ],
                        contact_email: 'john.doe@email.com',
                        contact_phone: '+1-555-123-4567'
                    });
                } else {
                    const data = await bookingsApi.get(bookingId);
                    setBooking(data);
                }
            } catch (err) {
                console.error("Failed to load booking", err);
                showToast("Failed to load booking details", "error");
            } finally {
                setIsLoadingBooking(false);
            }
        };

        fetchBooking();
    }, [bookingId, showToast]);

    const calculateTotals = () => {
        if (!booking) return { base: 0, taxes: 0, extras: 0, seats: 0, total: 0, paxCount: 0, baseFareUnit: 0 };

        console.log('calculateTotals - booking.total_amount:', booking.total_amount);
        console.log('calculateTotals - booking.resource_details?.price:', booking.resource_details?.price);
        console.log('calculateTotals - booking.passengers?.length:', booking.passengers?.length);
        console.log('calculateTotals - booking.extras:', booking.extras);
        console.log('calculateTotals - booking.seats:', booking.seats);

        // Use total_amount from stored booking data directly
        const apiTotal = Number(booking.total_amount) || 0;
        const baseFare = Number(booking.resource_details?.price) || 0;
        const passengerCount = booking.passengers?.length || 1;
        const flightTotal = baseFare * passengerCount;

        console.log('calculateTotals - apiTotal:', apiTotal, 'baseFare:', baseFare, 'flightTotal:', flightTotal);

        // Calculate extras total - extras stored in checkout_booking have price and quantity
        const extrasTotal = (booking.extras?.reduce((sum: number, item: any) => {
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.quantity) || 1;
            return sum + (itemPrice * itemQty);
        }, 0) || 0);

        // Calculate seats total - seats stored in checkout_booking have price
        const seatsTotal = (booking.seats?.reduce((sum: number, item: any) => {
            return sum + (Number(item.price) || 0);
        }, 0) || 0);

        console.log('calculateTotals - extrasTotal:', extrasTotal, 'seatsTotal:', seatsTotal);

        // Calculate taxes the same way as review page (15% of base fare per passenger)
        const TAX_RATE = 0.15;
        const taxes = baseFare * TAX_RATE * passengerCount;

        console.log('calculateTotals - taxes:', taxes);

        // Final total
        const finalTotal = flightTotal + taxes + extrasTotal + seatsTotal;

        console.log('calculateTotals - finalTotal:', finalTotal);

        return {
            base: flightTotal,
            paxCount: passengerCount,
            baseFareUnit: baseFare,
            taxes: taxes,
            extras: extrasTotal,
            seats: seatsTotal,
            total: finalTotal
        };
    };

    const totals = calculateTotals();

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    const formatExpiryDate = (value: string) => {
        const v = value.replace(/\D/g, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const handleInputChange = (field: string, value: string) => {
        if (field === 'cardNumber') {
            value = formatCardNumber(value);
        } else if (field === 'expiryDate') {
            value = formatExpiryDate(value);
        }
        setPaymentData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const cleanCardNum = paymentData.cardNumber.replace(/\s/g, '');

        if (!/^\d{16}$/.test(cleanCardNum)) newErrors.cardNumber = 'Please enter a valid 16-digit card number';
        if (!/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
        if (!/^\d{3,4}$/.test(paymentData.cvv)) newErrors.cvv = 'CVV must be 3 or 4 digits';
        if (!paymentData.cardName.trim()) newErrors.cardName = 'Cardholder name is required';
        if (!paymentData.billingAddress.trim()) newErrors.billingAddress = 'Billing address is required';
        if (!paymentData.city.trim()) newErrors.city = 'City is required';
        if (!paymentData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            showToast('Please fix the errors in the form', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            const [expMonth, expYear] = paymentData.expiryDate.split('/');

            await paymentApi.processPayment({
                booking_id: bookingId || '00000000-0000-0000-0000-000000000000',
                amount: totals.total,
                currency: 'USD',
                payment_method: {
                    type: 'credit_card',
                    card_number: paymentData.cardNumber.replace(/\s/g, ''),
                    expiry_month: expMonth,
                    expiry_year: '20' + expYear,
                    cvv: paymentData.cvv,
                    cardholder_name: paymentData.cardName
                },
                billing_address: {
                    street: paymentData.billingAddress,
                    city: paymentData.city,
                    postal_code: paymentData.zipCode,
                    country: paymentData.country || 'United States'
                }
            });

            showToast('Payment successful! Your booking is confirmed.', 'success');
            router.push(`/checkout/success?bookingId=${bookingId || '00000000-0000-0000-0000-000000000000'}`);
        } catch (error: any) {
            const msg = error?.data?.detail || error?.data?.message || 'Payment failed. Please try again.';

            if (msg.includes('Not Found') && bookingId === '00000000-0000-0000-0000-000000000000') {
                router.push('/checkout/success?bookingId=00000000-0000-0000-0000-000000000000');
                return;
            }
            showToast(msg, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Date TBD';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
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

    if (!isMounted) {
        return (
            <div className="booking-container text-center p-8">
                <div className="loading-spinner"></div>
                <p className="mt-4 text-[var(--text-secondary)]">Loading checkout...</p>
            </div>
        );
    }

    if (isLoadingBooking && bookingId) {
        return (
            <div className="booking-container text-center p-8">
                <div className="loading-spinner"></div>
                <p className="mt-4 text-[var(--text-secondary)]">Loading checkout...</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="booking-container text-center p-8">
                <h2 className="text-2xl font-bold mb-4">No Booking Found</h2>
                <p className="text-[var(--text-secondary)] mb-6">We couldn't find any booking to checkout.</p>
                <Button onClick={() => router.push('/')}>Return to Home</Button>
            </div>
        );
    }

    const flight = booking.resource_details || {};
    const originCode = flight.origin?.match(/\(([^)]+)\)/)?.[1] || 'LAX';
    const destCode = flight.destination?.match(/\(([^)]+)\)/)?.[1] || 'JFK';

    return (
        <div className="booking-layout">
            <div className="booking-header">
                <h1 className="booking-title">Secure Checkout</h1>
                <p className="booking-subtitle">Complete your booking securely</p>
            </div>

            <div className="booking-content">
                <div className="booking-main">
                    <Card className="review-section">
                        <div className="section-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                            </svg>
                            <h2>Flight Summary</h2>
                        </div>

                        <div className="flight-info-card">
                            <div className="airline-header">
                                <div className="airline-logo">{flight.airline?.substring(0, 2) || 'JQ'}</div>
                                <div>
                                    <div className="airline-name">{flight.airline || 'JourneyIQ Air'}</div>
                                    <div className="flight-number">{flight.flight_number || 'JQ-000'} • {flight.aircraft || 'Boeing 737-800'}</div>
                                </div>
                            </div>

                            <div className="flight-route">
                                <div className="route-point">
                                    <div className="route-time">{formatTime(flight.departure_time)}</div>
                                    <div className="route-location">{originCode}</div>
                                    <div className="route-date">{formatDate(flight.departure_time)}</div>
                                </div>

                                <div className="route-line">
                                    <div className="route-duration">{Math.floor((flight.duration_minutes || 0) / 60)}h {(flight.duration_minutes || 0) % 60}m</div>
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
                                    <div className="route-location">{destCode}</div>
                                    <div className="route-date">{formatDate(flight.arrival_time)}</div>
                                </div>
                            </div>

                            <div className="flight-meta">
                                <Badge variant="info">{flight.class_type || 'Economy Class'}</Badge>
                                <Badge variant="success">{booking.passengers?.length || 1} Passenger(s)</Badge>
                            </div>
                        </div>
                    </Card>

                    <Card className="review-section">
                        <div className="section-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <h2>Passengers</h2>
                        </div>

                        <div className="passengers-list">
                            {booking.passengers?.map((passenger: any, index: number) => (
                                <div key={index} className="passenger-item">
                                    <div className="passenger-number">{index + 1}</div>
                                    <div className="passenger-details">
                                        <div className="passenger-name">
                                            {passenger.title || 'Mr./Ms.'} {passenger.first_name} {passenger.last_name}
                                        </div>
                                        <div className="passenger-info">
                                            DOB: {passenger.date_of_birth || 'N/A'} • Passport: {passenger.passport_number || 'N/A'}
                                        </div>
                                        {(passenger.email || passenger.phone) && (
                                            <div className="passenger-contact">
                                                {passenger.email && <span>{passenger.email}</span>}
                                                {passenger.email && passenger.phone && <span> • </span>}
                                                {passenger.phone && <span>{passenger.phone}</span>}
                                            </div>
                                        )}
                                    </div>
                                    {booking.seats?.[index] && (
                                        <Badge variant="info">Seat {booking.seats[index].id}</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {booking.extras?.length > 0 && (
                        <Card className="review-section">
                            <div className="section-header">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                                <h2>Add-ons & Services</h2>
                            </div>

                            <div className="extras-list">
                                {booking.extras.map((extra: any, index: number) => (
                                    <div key={index} className="extra-item">
                                        <div className="extra-info">
                                            <span className="extra-name">{extra.name}</span>
                                            {extra.quantity > 1 && (
                                                <span className="extra-quantity">x{extra.quantity}</span>
                                            )}
                                        </div>
                                        <div className="extra-price">${(extra.price * (extra.quantity || 1)).toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {booking.seats?.length > 0 && (
                        <Card className="review-section">
                            <div className="section-header">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                </svg>
                                <h2>Seat Upgrades</h2>
                            </div>

                            <div className="extras-list">
                                {booking.seats.map((seat: any, index: number) => (
                                    <div key={index} className="extra-item">
                                        <div className="extra-info">
                                            <span className="extra-name">Seat {seat.id} - {seat.name}</span>
                                        </div>
                                        <div className="extra-price">${(seat.price || 0).toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    <Card className="review-section">
                        <div className="section-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                            <h2>Payment Details</h2>
                        </div>

                        <form onSubmit={handlePayment} className="payment-form">
                            <div className="credit-card-visual">
                                <div className="card-front">
                                    <div className="card-chip"></div>
                                    <div className="card-number-display">{paymentData.cardNumber || '**** **** **** ****'}</div>
                                    <div className="card-bottom">
                                        <div className="card-holder-display">{paymentData.cardName || 'CARD HOLDER'}</div>
                                        <div className="card-expiry-display">{paymentData.expiryDate || 'MM/YY'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="payment-fields-grid">
                                <div className="md:col-span-2">
                                    <Input
                                        label="Card Number"
                                        placeholder="1234 5678 9012 3456"
                                        value={paymentData.cardNumber}
                                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                                        maxLength={19}
                                        required
                                        onFocus={() => setActiveField('cardNumber')}
                                        className={errors.cardNumber ? 'input-error' : ''}
                                    />
                                    {errors.cardNumber && <p className="input-error-text">{errors.cardNumber}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <Input
                                        label="Cardholder Name"
                                        placeholder="John Doe"
                                        value={paymentData.cardName}
                                        onChange={(e) => handleInputChange('cardName', e.target.value)}
                                        required
                                        onFocus={() => setActiveField('cardName')}
                                        className={errors.cardName ? 'input-error' : ''}
                                    />
                                    {errors.cardName && <p className="input-error-text">{errors.cardName}</p>}
                                </div>

                                <div>
                                    <Input
                                        label="Expiry Date"
                                        placeholder="MM/YY"
                                        value={paymentData.expiryDate}
                                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                                        required
                                        maxLength={5}
                                        onFocus={() => setActiveField('expiryDate')}
                                        className={errors.expiryDate ? 'input-error' : ''}
                                    />
                                    {errors.expiryDate && <p className="input-error-text">{errors.expiryDate}</p>}
                                </div>

                                <div>
                                    <Input
                                        label="CVV"
                                        placeholder="123"
                                        type="password"
                                        maxLength={4}
                                        value={paymentData.cvv}
                                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                                        required
                                        onFocus={() => setActiveField('cvv')}
                                        onBlur={() => setActiveField(null)}
                                        className={errors.cvv ? 'input-error' : ''}
                                    />
                                    {errors.cvv && <p className="input-error-text">{errors.cvv}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <div className="billing-section-title">Billing Address</div>
                                </div>

                                <div className="md:col-span-2">
                                    <Input
                                        label="Street Address"
                                        placeholder="123 Main Street"
                                        value={paymentData.billingAddress}
                                        onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                                        required
                                        className={errors.billingAddress ? 'input-error' : ''}
                                    />
                                    {errors.billingAddress && <p className="input-error-text">{errors.billingAddress}</p>}
                                </div>

                                <div>
                                    <Input
                                        label="City"
                                        placeholder="Los Angeles"
                                        value={paymentData.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                        required
                                        className={errors.city ? 'input-error' : ''}
                                    />
                                    {errors.city && <p className="input-error-text">{errors.city}</p>}
                                </div>

                                <div>
                                    <Input
                                        label="ZIP Code"
                                        placeholder="90001"
                                        value={paymentData.zipCode}
                                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                        required
                                        className={errors.zipCode ? 'input-error' : ''}
                                    />
                                    {errors.zipCode && <p className="input-error-text">{errors.zipCode}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <Input
                                        label="Country"
                                        placeholder="United States"
                                        value={paymentData.country}
                                        onChange={(e) => handleInputChange('country', e.target.value)}
                                    />
                                </div>
                            </div>
                        </form>
                    </Card>

                    <div className="trust-badges-section">
                        <div className="trust-badge-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <span>SSL Encrypted</span>
                        </div>
                        <div className="trust-badge-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span>Secure Payment</span>
                        </div>
                        <div className="trust-badge-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Instant Confirmation</span>
                        </div>
                    </div>
                </div>

                <aside className="booking-sidebar">
                    <Card className="price-summary">
                        <h3 className="summary-title">Order Summary</h3>

                        <div className="summary-section">
                            <div className="summary-label">Base Fare ({totals.paxCount} passenger{totals.paxCount !== 1 ? 's' : ''})</div>
                            <div className="summary-value">${totals.base.toFixed(2)}</div>
                        </div>

                        {totals.seats > 0 && (
                            <div className="summary-section">
                                <div className="summary-label">Seat Upgrades</div>
                                <div className="summary-value">${totals.seats.toFixed(2)}</div>
                            </div>
                        )}

                        {totals.extras > 0 && (
                            <div className="summary-section">
                                <div className="summary-label">Add-ons</div>
                                <div className="summary-value">${totals.extras.toFixed(2)}</div>
                            </div>
                        )}

                        <div className="summary-section">
                            <div className="summary-label">Taxes & Fees</div>
                            <div className="summary-value">${totals.taxes.toFixed(2)}</div>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-total">
                            <div className="total-label">Total</div>
                            <div className="total-value">${totals.total.toFixed(2)}</div>
                        </div>

                        <Button
                            type="submit"
                            onClick={handlePayment}
                            isLoading={isProcessing}
                            size="xl"
                            className="w-full mt-6"
                        >
                            Pay ${totals.total.toFixed(2)}
                        </Button>

                        <div className="cancellation-notice">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <span>Free cancellation within 24 hours</span>
                        </div>
                    </Card>

                    <Card className="assistance-card">
                        <div className="assistance-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                        </div>
                        <div className="assistance-content">
                            <div className="assistance-title">Need Help?</div>
                            <div className="assistance-text">Our travel experts are available 24/7</div>
                            <div className="assistance-phone">+1 (888) 123-4567</div>
                        </div>
                    </Card>
                </aside>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <main className="booking-page">
            <Suspense fallback={
                <div className="booking-container text-center p-8">
                    <div className="loading-spinner"></div>
                    <p className="mt-4 text-[var(--text-secondary)]">Loading secure checkout...</p>
                </div>
            }>
                <CheckoutContent />
            </Suspense>
        </main>
    );
}
