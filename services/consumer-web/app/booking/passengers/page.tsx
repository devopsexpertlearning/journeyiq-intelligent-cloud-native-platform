'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { useToast } from '@/components/Toast';

interface Passenger {
    type: 'adult' | 'child' | 'infant';
    title: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    passportNumber: string;
    nationality: string;
}

interface ValidationErrors {
    [key: string]: string;
}

function PassengerDetailsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const flightId = searchParams.get('flightId');

    const [passengers, setPassengers] = useState<Passenger[]>([
        {
            type: 'adult',
            title: '',
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            passportNumber: '',
            nationality: ''
        }
    ]);

    const [errors, setErrors] = useState<{ [key: number]: ValidationErrors }>({});
    const [flightData, setFlightData] = useState<any>(null);

    // Restore state from sessionStorage on mount
    useEffect(() => {
        // Restore passengers data
        const stored = sessionStorage.getItem('booking_flow_passengers');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (data.passengers) {
                    setPassengers(data.passengers);
                }
            } catch (e) {
                console.error("Failed to restore passengers", e);
            }
        }

        // Restore flight data from sessionStorage
        const storedFlight = sessionStorage.getItem('selected_flight');
        if (storedFlight) {
            try {
                const data = JSON.parse(storedFlight);
                setFlightData(data);
            } catch (e) {
                console.error("Failed to restore flight data", e);
            }
        }
    }, []);

    // If no flight data and no stored passengers, fetch from API or redirect
    useEffect(() => {
        if (!flightData && !sessionStorage.getItem('selected_flight') && flightId) {
            // Flight ID exists but no stored data - might be direct navigation
            // Continue without flight data, user can still proceed
        }
    }, [flightId, flightData]);

    const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
        const updated = [...passengers];
        updated[index][field] = value as any;
        setPassengers(updated);

        // Clear error for this field
        if (errors[index]?.[field]) {
            const newErrors = { ...errors };
            delete newErrors[index][field];
            setErrors(newErrors);
        }
    };

    const addPassenger = () => {
        setPassengers([...passengers, {
            type: 'adult',
            title: '',
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            passportNumber: '',
            nationality: ''
        }]);
    };

    const removePassenger = (index: number) => {
        if (passengers.length > 1) {
            const newPassengers = passengers.filter((_, i) => i !== index);
            setPassengers(newPassengers);
            // Clear errors for removed passenger
            const newErrors = { ...errors };
            delete newErrors[index];
            setErrors(newErrors);
        }
    };

    const validatePassenger = (passenger: Passenger, index: number): ValidationErrors => {
        const errors: ValidationErrors = {};

        if (!passenger.title) errors.title = 'Title is required';
        if (!passenger.firstName) errors.firstName = 'First name is required';
        if (!passenger.lastName) errors.lastName = 'Last name is required';
        if (!passenger.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
        if (!passenger.passportNumber) errors.passportNumber = 'Passport number is required';
        if (!passenger.nationality) errors.nationality = 'Nationality is required';

        // Validate passport format (basic)
        if (passenger.passportNumber && !/^[A-Z0-9]{6,9}$/i.test(passenger.passportNumber)) {
            errors.passportNumber = 'Invalid passport format';
        }

        return errors;
    };

    const handleContinue = () => {
        // Validate all passengers
        const allErrors: { [key: number]: ValidationErrors } = {};
        let hasErrors = false;

        passengers.forEach((passenger, index) => {
            const passengerErrors = validatePassenger(passenger, index);
            if (Object.keys(passengerErrors).length > 0) {
                allErrors[index] = passengerErrors;
                hasErrors = true;
            }
        });

        if (hasErrors) {
            setErrors(allErrors);
            showToast('Please fill in all required fields correctly', 'error');
            return;
        }

        // Save to sessionStorage
        const bookingData = {
            flightId,
            passengers
        };

        sessionStorage.setItem('booking_flow_passengers', JSON.stringify(bookingData));
        router.push(`/booking/seats?flightId=${flightId}&passengers=${passengers.length}`);
    };

    const handleGoBack = () => {
        // Don't clear session data when going back - user might want to edit
        router.back();
    };

    const getPassengerTypeColor = (type: string) => {
        switch (type) {
            case 'adult': return 'info';
            case 'child': return 'warning';
            case 'infant': return 'success';
            default: return 'info';
        }
    };

    // Price calculations - use stored flight data
    const BASE_FARE = flightData?.base_price || 299.00;
    const TAXES_FEES = BASE_FARE * 0.15; // 15% taxes and fees
    const passengerCount = passengers.length;
    const totalBaseFare = BASE_FARE * passengerCount;
    const totalTaxes = TAXES_FEES * passengerCount;
    const totalPrice = totalBaseFare + totalTaxes;

    // Format date for display
    const formatDisplayDate = (dateString?: string) => {
        if (!dateString) return 'TBD';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return 'TBD';
        }
    };

    // Extract airport codes
    const originCode = flightData?.origin?.match(/\(([^)]+)\)/)?.[1] || 'DEP';
    const destCode = flightData?.destination?.match(/\(([^)]+)\)/)?.[1] || 'ARR';

    return (
        <div className="booking-layout">
            {/* Progress Indicator */}
            <div className="booking-progress">
                <div className="progress-step active">
                    <div className="step-number">1</div>
                    <div className="step-label">Passengers</div>
                </div>
                <div className="progress-line"></div>
                <div className="progress-step">
                    <div className="step-number">2</div>
                    <div className="step-label">Seats</div>
                </div>
                <div className="progress-line"></div>
                <div className="progress-step">
                    <div className="step-number">3</div>
                    <div className="step-label">Extras</div>
                </div>
                <div className="progress-line"></div>
                <div className="progress-step">
                    <div className="step-number">4</div>
                    <div className="step-label">Review</div>
                </div>
            </div>

            <div className="booking-content">
                {/* Main Content */}
                <div className="booking-main">
                    {passengers.map((passenger, index) => (
                        <Card key={index} className="passenger-card">
                            <div className="passenger-header">
                                <h3 className="passenger-title">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Passenger {index + 1}
                                </h3>
                                <div className="passenger-actions">
                                    <Badge variant={getPassengerTypeColor(passenger.type)}>
                                        {passenger.type.charAt(0).toUpperCase() + passenger.type.slice(1)}
                                    </Badge>
                                    {passengers.length > 1 && (
                                        <button
                                            className="remove-passenger-btn"
                                            onClick={() => removePassenger(index)}
                                            title="Remove passenger"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="15" y1="9" x2="9" y2="15" />
                                                <line x1="9" y1="9" x2="15" y2="15" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="form-grid">
                                {/* Title */}
                                <div className="form-group">
                                    <label htmlFor={`title-${index}`}>Title *</label>
                                    <select
                                        id={`title-${index}`}
                                        value={passenger.title}
                                        onChange={(e) => updatePassenger(index, 'title', e.target.value)}
                                        className={errors[index]?.title ? 'error' : ''}
                                    >
                                        <option value="">Select</option>
                                        <option value="Mr">Mr</option>
                                        <option value="Mrs">Mrs</option>
                                        <option value="Ms">Ms</option>
                                        <option value="Dr">Dr</option>
                                    </select>
                                    {errors[index]?.title && <span className="error-message">{errors[index].title}</span>}
                                </div>

                                {/* First Name */}
                                <div className="form-group">
                                    <label htmlFor={`firstName-${index}`}>First Name *</label>
                                    <div className="input-with-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <input
                                            id={`firstName-${index}`}
                                            type="text"
                                            value={passenger.firstName}
                                            onChange={(e) => updatePassenger(index, 'firstName', e.target.value)}
                                            placeholder="John"
                                            className={errors[index]?.firstName ? 'error' : ''}
                                        />
                                    </div>
                                    {errors[index]?.firstName && <span className="error-message">{errors[index].firstName}</span>}
                                </div>

                                {/* Last Name */}
                                <div className="form-group">
                                    <label htmlFor={`lastName-${index}`}>Last Name *</label>
                                    <div className="input-with-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <input
                                            id={`lastName-${index}`}
                                            type="text"
                                            value={passenger.lastName}
                                            onChange={(e) => updatePassenger(index, 'lastName', e.target.value)}
                                            placeholder="Doe"
                                            className={errors[index]?.lastName ? 'error' : ''}
                                        />
                                    </div>
                                    {errors[index]?.lastName && <span className="error-message">{errors[index].lastName}</span>}
                                </div>

                                {/* Date of Birth */}
                                <div className="form-group">
                                    <label htmlFor={`dob-${index}`}>Date of Birth *</label>
                                    <div className="input-with-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <input
                                            id={`dob-${index}`}
                                            type="date"
                                            value={passenger.dateOfBirth}
                                            onChange={(e) => updatePassenger(index, 'dateOfBirth', e.target.value)}
                                            className={errors[index]?.dateOfBirth ? 'error' : ''}
                                        />
                                    </div>
                                    {errors[index]?.dateOfBirth && <span className="error-message">{errors[index].dateOfBirth}</span>}
                                </div>

                                {/* Passport Number */}
                                <div className="form-group">
                                    <label htmlFor={`passport-${index}`}>Passport Number *</label>
                                    <div className="input-with-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <circle cx="12" cy="13" r="2" />
                                            <path d="M12 15v4" />
                                        </svg>
                                        <input
                                            id={`passport-${index}`}
                                            type="text"
                                            value={passenger.passportNumber}
                                            onChange={(e) => updatePassenger(index, 'passportNumber', e.target.value.toUpperCase())}
                                            placeholder="A12345678"
                                            maxLength={9}
                                            className={errors[index]?.passportNumber ? 'error' : ''}
                                        />
                                    </div>
                                    {errors[index]?.passportNumber && <span className="error-message">{errors[index].passportNumber}</span>}
                                </div>

                                {/* Nationality */}
                                <div className="form-group">
                                    <label htmlFor={`nationality-${index}`}>Nationality *</label>
                                    <div className="input-with-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="2" y1="12" x2="22" y2="12" />
                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                        </svg>
                                        <input
                                            id={`nationality-${index}`}
                                            type="text"
                                            value={passenger.nationality}
                                            onChange={(e) => updatePassenger(index, 'nationality', e.target.value)}
                                            placeholder="United States"
                                            className={errors[index]?.nationality ? 'error' : ''}
                                        />
                                    </div>
                                    {errors[index]?.nationality && <span className="error-message">{errors[index].nationality}</span>}
                                </div>
                            </div>
                        </Card>
                    ))}

                    {/* Add Passenger Button */}
                    <button className="add-passenger-btn" onClick={addPassenger}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="16" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        Add Passenger
                    </button>

                    <div className="booking-actions">
                        <Button variant="secondary" onClick={handleGoBack}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Go Back
                        </Button>
                        <Button onClick={handleContinue}>
                            Continue to Seats
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Button>
                    </div>
                </div>

                {/* Sticky Sidebar */}
                <aside className="booking-sidebar">
                    <Card className="price-summary">
                        <h3 className="summary-title">Booking Summary</h3>

                        <div className="summary-section">
                            <div className="summary-label">Flight</div>
                            <div className="summary-value">{originCode} → {destCode}</div>
                        </div>

                        <div className="summary-section">
                            <div className="summary-label">Date</div>
                            <div className="summary-value">{formatDisplayDate(flightData?.departure_time)}</div>
                        </div>

                        <div className="summary-section">
                            <div className="summary-label">Passengers</div>
                            <div className="summary-value">{passengerCount} Passenger{passengerCount !== 1 ? 's' : ''}</div>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-section">
                            <div className="summary-label">Base Fare ({passengerCount} × ${BASE_FARE.toFixed(2)})</div>
                            <div className="summary-value">${totalBaseFare.toFixed(2)}</div>
                        </div>

                        <div className="summary-section">
                            <div className="summary-label">Taxes & Fees (15%)</div>
                            <div className="summary-value">${totalTaxes.toFixed(2)}</div>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-total">
                            <div className="total-label">Total</div>
                            <div className="total-value">${totalPrice.toFixed(2)}</div>
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
                                <span>Best Price Guarantee</span>
                            </div>
                        </div>
                    </Card>
                </aside>
            </div>
        </div>
    );
}

export default function PassengerDetailsPage() {
    return (
        <main className="booking-page">
            <div className="booking-header">
                <h1 className="booking-title">Passenger Details</h1>
                <p className="booking-subtitle">Enter information for all passengers</p>
            </div>
            <Suspense fallback={
                <div className="booking-container text-center p-8">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            }>
                <PassengerDetailsContent />
            </Suspense>
        </main>
    );
}
