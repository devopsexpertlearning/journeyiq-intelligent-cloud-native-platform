'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { bookingsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

interface AddOn {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: React.ReactNode;
    popular?: boolean;
    allowQuantity?: boolean;
}

interface SelectedExtra {
    id: string;
    quantity: number;
}

function ExtrasContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const flightId = searchParams.get('flightId');

    const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [flightData, setFlightData] = useState<any>(null);

    // Restore state from sessionStorage on mount
    useEffect(() => {
        const stored = sessionStorage.getItem('booking_flow_extras');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (data.extras) {
                    setSelectedExtras(data.extras);
                }
            } catch (e) {
                console.error("Failed to restore extras", e);
            }
        }

        // Restore flight data
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

    const addOns: AddOn[] = [
        {
            id: 'baggage',
            name: 'Extra Baggage',
            description: 'Additional 23kg checked baggage allowance',
            price: 50,
            allowQuantity: true,
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <polyline points="17 11 19 13 23 9" />
                    <rect x="8" y="2" width="8" height="4" rx="1" />
                    <rect x="6" y="6" width="12" height="14" rx="2" />
                </svg>
            )
        },
        {
            id: 'meal',
            name: 'Premium Meal',
            description: 'Upgrade to gourmet in-flight dining experience',
            price: 25,
            popular: true,
            allowQuantity: true,
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                    <line x1="6" y1="1" x2="6" y2="4" />
                    <line x1="10" y1="1" x2="10" y2="4" />
                    <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
            )
        },
        {
            id: 'insurance',
            name: 'Travel Insurance',
            description: 'Comprehensive coverage for peace of mind',
            price: 35,
            popular: true,
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                </svg>
            )
        },
        {
            id: 'priority',
            name: 'Priority Boarding',
            description: 'Be among the first to board the aircraft',
            price: 15,
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            )
        },
        {
            id: 'lounge',
            name: 'Airport Lounge Access',
            description: 'Relax in comfort before your flight',
            price: 45,
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12s2.545-5 7-5c4.454 0 7 5 7 5s-2.546 5-7 5c-4.455 0-7-5-7-5z" />
                    <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                    <path d="M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" />
                    <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" />
                </svg>
            )
        },
        {
            id: 'wifi',
            name: 'In-Flight WiFi',
            description: 'Stay connected throughout your journey',
            price: 20,
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                    <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
            )
        }
    ];

    const getExtraQuantity = (id: string): number => {
        return selectedExtras.find(e => e.id === id)?.quantity || 0;
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity === 0) {
            setSelectedExtras(selectedExtras.filter(e => e.id !== id));
        } else {
            const existing = selectedExtras.find(e => e.id === id);
            if (existing) {
                setSelectedExtras(selectedExtras.map(e =>
                    e.id === id ? { ...e, quantity } : e
                ));
            } else {
                setSelectedExtras([...selectedExtras, { id, quantity }]);
            }
        }
    };

    const toggleExtra = (id: string) => {
        const quantity = getExtraQuantity(id);
        updateQuantity(id, quantity > 0 ? 0 : 1);
    };

    const calculateTotal = () => {
        return selectedExtras.reduce((sum, extra) => {
            const addon = addOns.find(a => a.id === extra.id);
            return sum + (addon?.price || 0) * extra.quantity;
        }, 0);
    };

    const handleContinue = () => {
        // Save extras to session for review page
        sessionStorage.setItem('booking_flow_extras', JSON.stringify({
            extras: selectedExtras,
            total: calculateTotal()
        }));

        router.push(`/booking/review?flightId=${flightId}&passengers=${passengersCount}`);
    };

    const handleGoBack = () => {
        // Don't clear session data when going back - user might want to edit
        router.back();
    };

    // Price calculations - use stored flight data
    const BASE_FARE = flightData?.base_price || 299.00;
    const TAXES_FEES = BASE_FARE * 0.15; // 15% taxes and fees
    const passengersCount = parseInt(searchParams.get('passengers') || '1');
    const seatsData = typeof window !== 'undefined' ? sessionStorage.getItem('booking_flow_seats') : null;
    const seatsPrice = seatsData ? JSON.parse(seatsData).totalPrice : 0;

    const totalBaseFare = BASE_FARE * passengersCount;
    const totalTaxes = TAXES_FEES * passengersCount;
    const extrasTotal = calculateTotal();
    const grandTotal = totalBaseFare + totalTaxes + seatsPrice + extrasTotal;

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
                <div className="progress-step active">
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
                    <div className="extras-grid">
                        {addOns.map(addon => {
                            const quantity = getExtraQuantity(addon.id);
                            const isSelected = quantity > 0;

                            return (
                                <Card
                                    key={addon.id}
                                    className={`extra-card ${isSelected ? 'extra-card-selected' : ''}`}
                                >
                                    {addon.popular && (
                                        <Badge variant="success" className="extra-badge">Popular</Badge>
                                    )}

                                    <div className="extra-icon">
                                        {addon.icon}
                                    </div>

                                    <h3 className="extra-name">{addon.name}</h3>
                                    <p className="extra-description">{addon.description}</p>

                                    <div className="extra-price-tag">${addon.price}</div>

                                    {addon.allowQuantity ? (
                                        <div className="extra-quantity">
                                            <button
                                                className="quantity-btn"
                                                onClick={() => updateQuantity(addon.id, Math.max(0, quantity - 1))}
                                                disabled={quantity === 0}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                </svg>
                                            </button>
                                            <span className="quantity-value">{quantity}</span>
                                            <button
                                                className="quantity-btn"
                                                onClick={() => updateQuantity(addon.id, quantity + 1)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="12" y1="5" x2="12" y2="19" />
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant={isSelected ? "primary" : "secondary"}
                                            size="sm"
                                            onClick={() => toggleExtra(addon.id)}
                                        >
                                            {isSelected ? 'Remove' : 'Add'}
                                        </Button>
                                    )}
                                </Card>
                            );
                        })}
                    </div>

                    <div className="booking-actions">
                        <Button variant="secondary" onClick={handleGoBack}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Go Back
                        </Button>
                        <Button onClick={handleContinue}>
                            Continue to Review
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </Button>
                    </div>
                </div>

                {/* Sticky Sidebar */}
                <aside className="booking-sidebar">
                    <Card className="price-summary">
                        <h3 className="summary-title">Add-ons Summary</h3>

                        {selectedExtras.length > 0 ? (
                            <>
                                {selectedExtras.map(extra => {
                                    const addon = addOns.find(a => a.id === extra.id);
                                    if (!addon) return null;

                                    return (
                                        <div key={extra.id} className="summary-section">
                                            <div className="summary-label">
                                                {addon.name}
                                                {extra.quantity > 1 && ` (x${extra.quantity})`}
                                            </div>
                                            <div className="summary-value">
                                                ${(addon.price * extra.quantity).toFixed(2)}
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="summary-divider"></div>

                                <div className="summary-section">
                                    <div className="summary-label">Base Fare ({passengersCount} × ${BASE_FARE.toFixed(2)})</div>
                                    <div className="summary-value">${totalBaseFare.toFixed(2)}</div>
                                </div>

                                <div className="summary-section">
                                    <div className="summary-label">Taxes & Fees (15%)</div>
                                    <div className="summary-value">${totalTaxes.toFixed(2)}</div>
                                </div>

                                <div className="summary-section">
                                    <div className="summary-label">Seat Upgrades</div>
                                    <div className="summary-value">${seatsPrice.toFixed(2)}</div>
                                </div>

                                <div className="summary-section">
                                    <div className="summary-label">Selected Add-ons</div>
                                    <div className="summary-value">${extrasTotal.toFixed(2)}</div>
                                </div>

                                <div className="summary-divider"></div>

                                <div className="summary-total">
                                    <div className="total-label">Total</div>
                                    <div className="total-value">${grandTotal.toFixed(2)}</div>
                                </div>
                            </>
                        ) : (
                            <>
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
                                    <div className="summary-value">{passengersCount} Passenger{passengersCount !== 1 ? 's' : ''}</div>
                                </div>

                                <div className="summary-divider"></div>

                                <div className="summary-section">
                                    <div className="summary-label">Base Fare ({passengersCount} × ${BASE_FARE.toFixed(2)})</div>
                                    <div className="summary-value">${totalBaseFare.toFixed(2)}</div>
                                </div>

                                <div className="summary-section">
                                    <div className="summary-label">Taxes & Fees (15%)</div>
                                    <div className="summary-value">${totalTaxes.toFixed(2)}</div>
                                </div>

                                <div className="summary-section">
                                    <div className="summary-label">Seat Upgrades</div>
                                    <div className="summary-value">${seatsPrice.toFixed(2)}</div>
                                </div>

                                <div className="summary-divider"></div>

                                <div className="summary-total">
                                    <div className="total-label">Total</div>
                                    <div className="total-value">${grandTotal.toFixed(2)}</div>
                                </div>
                            </>
                        )}

                        <div className="summary-note">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <span>All add-ons are optional and can be added later</span>
                        </div>
                    </Card>
                </aside>
            </div>
        </div>
    );
}

export default function ExtrasPage() {
    return (
        <main className="booking-page">
            <div className="booking-header">
                <h1 className="booking-title">Enhance Your Journey</h1>
                <p className="booking-subtitle">Add optional extras to make your trip more comfortable</p>
            </div>
            <Suspense fallback={
                <div className="booking-container text-center p-8">
                    <div className="loading-spinner"></div>
                    <p>Loading add-ons...</p>
                </div>
            }>
                <ExtrasContent />
            </Suspense>
        </main>
    );
}
