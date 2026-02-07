'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { useToast } from '@/components/Toast';

interface SeatInfo {
    id: string;
    type: 'standard' | 'extra-legroom' | 'premium';
    price: number;
    status: 'available' | 'occupied' | 'selected';
}

function SeatSelectionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const flightId = searchParams.get('flightId');
    const passengersCount = parseInt(searchParams.get('passengers') || '1');

    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [flightData, setFlightData] = useState<any>(null);

    // Restore state from sessionStorage on mount
    useEffect(() => {
        const stored = sessionStorage.getItem('booking_flow_seats');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (data.seats) {
                    setSelectedSeats(data.seats);
                }
            } catch (e) {
                console.error("Failed to restore seats", e);
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

    // Mock seat layout with types and pricing
    const rows = 20;
    const seatsPerRow = ['A', 'B', 'C', 'D', 'E', 'F'];
    const occupiedSeats = ['1A', '1B', '2C', '3D', '4E', '5A', '6B', '7C', '10D', '12A'];
    const premiumRows = [1, 2]; // First 2 rows are premium
    const extraLegroomRows = [10, 11, 12]; // Exit rows

    const getSeatInfo = (rowNum: number, letter: string): SeatInfo => {
        const seatId = `${rowNum}${letter}`;
        let type: 'standard' | 'extra-legroom' | 'premium' = 'standard';
        let price = 0;

        if (premiumRows.includes(rowNum)) {
            type = 'premium';
            price = 50;
        } else if (extraLegroomRows.includes(rowNum)) {
            type = 'extra-legroom';
            price = 25;
        }

        return {
            id: seatId,
            type,
            price,
            status: occupiedSeats.includes(seatId) ? 'occupied' :
                selectedSeats.includes(seatId) ? 'selected' : 'available'
        };
    };

    const toggleSeat = (seatId: string, seatInfo: SeatInfo) => {
        if (seatInfo.status === 'occupied') return;

        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(selectedSeats.filter(s => s !== seatId));
        } else {
            if (selectedSeats.length >= passengersCount) {
                showToast(`You can only select ${passengersCount} seat(s)`, 'info');
                return;
            }
            setSelectedSeats([...selectedSeats, seatId]);
        }
    };

    const getSeatClass = (seatInfo: SeatInfo) => {
        const baseClass = 'seat';
        const typeClass = `seat-${seatInfo.type}`;
        const statusClass = `seat-${seatInfo.status}`;
        return `${baseClass} ${typeClass} ${statusClass}`;
    };

    const getTotalPrice = () => {
        return selectedSeats.reduce((total, seatId) => {
            const rowNum = parseInt(seatId.match(/\d+/)?.[0] || '0');
            const letter = seatId.match(/[A-F]/)?.[0] || 'A';
            const seatInfo = getSeatInfo(rowNum, letter);
            return total + seatInfo.price;
        }, 0);
    };

    const handleContinue = () => {
        if (selectedSeats.length === 0) {
            showToast('Please select at least one seat', 'error');
            return;
        }

        if (selectedSeats.length < passengersCount) {
            showToast(`Please select ${passengersCount} seat(s) for all passengers`, 'info');
            return;
        }

        // Save to sessionStorage with complete seat info
        const seatsWithDetails = selectedSeats.map(seatId => {
            const rowNum = parseInt(seatId.replace(/[A-F]/g, ''));
            const letter = seatId.replace(/[0-9]/g, '');
            let type = 'standard';
            let price = 0;

            if (premiumRows.includes(rowNum)) {
                type = 'premium';
                price = 50;
            } else if (extraLegroomRows.includes(rowNum)) {
                type = 'extra-legroom';
                price = 25;
            }

            return {
                id: seatId,
                name: `${type === 'standard' ? 'Standard Seat' : type === 'extra-legroom' ? 'Extra Legroom' : 'Premium Seat'}`,
                price: price
            };
        });

        sessionStorage.setItem('booking_flow_seats', JSON.stringify({
            seats: seatsWithDetails,
            totalPrice: getTotalPrice()
        }));

        showToast('Seats selected successfully', 'success');
        router.push(`/booking/extras?flightId=${flightId}&passengers=${passengersCount}`);
    };

    const handleGoBack = () => {
        // Don't clear session data when going back - user might want to edit
        router.back();
    };

    // Price calculations - use stored flight data
    const BASE_FARE = flightData?.base_price || 299.00;
    const TAXES_FEES = BASE_FARE * 0.15; // 15% taxes and fees
    const seatsPrice = getTotalPrice();
    const totalBaseFare = BASE_FARE * passengersCount;
    const totalTaxes = TAXES_FEES * passengersCount;
    const grandTotal = totalBaseFare + totalTaxes + seatsPrice;

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
                <div className="progress-step active">
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
                    <Card className="seat-map-card">
                        {/* Legend */}
                        <div className="seat-legend">
                            <div className="legend-item">
                                <div className="seat seat-standard seat-available"></div>
                                <span>Standard (Free)</span>
                            </div>
                            <div className="legend-item">
                                <div className="seat seat-extra-legroom seat-available"></div>
                                <span>Extra Legroom (+$25)</span>
                            </div>
                            <div className="legend-item">
                                <div className="seat seat-premium seat-available"></div>
                                <span>Premium (+$50)</span>
                            </div>
                            <div className="legend-item">
                                <div className="seat seat-occupied"></div>
                                <span>Occupied</span>
                            </div>
                            <div className="legend-item">
                                <div className="seat seat-selected"></div>
                                <span>Your Selection</span>
                            </div>
                        </div>

                        {/* Seat Map */}
                        <div className="seat-map-wrapper">
                            <div className="seat-map-header">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                                </svg>
                                <span>Front of Aircraft</span>
                            </div>

                            <div className="seat-map">
                                {Array.from({ length: rows }, (_, rowIndex) => {
                                    const rowNum = rowIndex + 1;
                                    return (
                                        <div key={rowNum} className="seat-row">
                                            <span className="row-number">{rowNum}</span>
                                            <div className="seats-container">
                                                {/* Left side (A, B, C) */}
                                                {seatsPerRow.slice(0, 3).map(letter => {
                                                    const seatInfo = getSeatInfo(rowNum, letter);
                                                    return (
                                                        <button
                                                            key={seatInfo.id}
                                                            className={getSeatClass(seatInfo)}
                                                            onClick={() => toggleSeat(seatInfo.id, seatInfo)}
                                                            disabled={seatInfo.status === 'occupied'}
                                                            title={`${seatInfo.id} - ${seatInfo.type} ${seatInfo.price > 0 ? `+$${seatInfo.price}` : 'Free'}`}
                                                        >
                                                            <span className="seat-letter">{letter}</span>
                                                            {seatInfo.price > 0 && seatInfo.status === 'available' && (
                                                                <span className="seat-price">${seatInfo.price}</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}

                                                {/* Aisle */}
                                                <div className="aisle"></div>

                                                {/* Right side (D, E, F) */}
                                                {seatsPerRow.slice(3).map(letter => {
                                                    const seatInfo = getSeatInfo(rowNum, letter);
                                                    return (
                                                        <button
                                                            key={seatInfo.id}
                                                            className={getSeatClass(seatInfo)}
                                                            onClick={() => toggleSeat(seatInfo.id, seatInfo)}
                                                            disabled={seatInfo.status === 'occupied'}
                                                            title={`${seatInfo.id} - ${seatInfo.type} ${seatInfo.price > 0 ? `+$${seatInfo.price}` : 'Free'}`}
                                                        >
                                                            <span className="seat-letter">{letter}</span>
                                                            {seatInfo.price > 0 && seatInfo.status === 'available' && (
                                                                <span className="seat-price">${seatInfo.price}</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <span className="row-number">{rowNum}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected Seats Info */}
                        {selectedSeats.length > 0 && (
                            <div className="selected-seats-summary">
                                <div className="summary-header">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <strong>Selected Seats ({selectedSeats.length}/{passengersCount})</strong>
                                </div>
                                <div className="selected-seats-list">
                                    {selectedSeats.map(seatId => {
                                        const rowNum = parseInt(seatId.match(/\d+/)?.[0] || '0');
                                        const letter = seatId.match(/[A-F]/)?.[0] || 'A';
                                        const seatInfo = getSeatInfo(rowNum, letter);
                                        return (
                                            <Badge key={seatId} variant="info">
                                                {seatId} {seatInfo.price > 0 && `+$${seatInfo.price}`}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="booking-actions">
                        <Button variant="secondary" onClick={handleGoBack}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Go Back
                        </Button>
                        <Button
                            onClick={handleContinue}
                            disabled={selectedSeats.length === 0}
                        >
                            Continue to Extras
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
                            <div className="summary-value">{passengersCount} Passenger{passengersCount !== 1 ? 's' : ''}</div>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-section">
                            <div className="summary-label">Base Fare</div>
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

                        <div className="seat-tips">
                            <h4 className="tips-title">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                Seat Tips
                            </h4>
                            <ul className="tips-list">
                                <li>Window seats: A & F</li>
                                <li>Aisle seats: C & D</li>
                                <li>Extra legroom at exit rows (10-12)</li>
                                <li>Premium seats in front rows (1-2)</li>
                            </ul>
                        </div>
                    </Card>
                </aside>
            </div>
        </div>
    );
}

export default function SeatSelectionPage() {
    return (
        <main className="booking-page">
            <div className="booking-header">
                <h1 className="booking-title">Select Your Seats</h1>
                <p className="booking-subtitle">Choose your preferred seats for a comfortable journey</p>
            </div>
            <Suspense fallback={
                <div className="booking-container text-center p-8">
                    <div className="loading-spinner"></div>
                    <p>Loading seat map...</p>
                </div>
            }>
                <SeatSelectionContent />
            </Suspense>
        </main>
    );
}
