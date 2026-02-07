'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchWidget, SearchParams } from '@/components/SearchWidget';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { searchApi } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { Flight } from '@/types/flight';
import { getAirlineInfo, formatTime, formatDuration } from '@/lib/flight-utils';

function FlightSearchContent() {
    const searchParams = useSearchParams();
    const [flights, setFlights] = useState<Flight[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();
    const { isAuthenticated } = useAuth();
    const [initialSearchDone, setInitialSearchDone] = useState(false);

    const handleSearch = async (params: SearchParams) => {
        setIsLoading(true);
        try {
            const response = await searchApi.searchFlights({
                origin: params.origin,
                destination: params.destination,
                departure_date: params.departureDate,
                return_date: params.returnDate || null,
                passengers: params.passengers,
                class: params.class,
            });

            const flightData = (response && Array.isArray(response.results)) ? response.results : [];
            setFlights(flightData);

            if (flightData.length === 0) {
                showToast('No flights found for your search criteria', 'info');
            }
        } catch (error: any) {
            console.error("Flight search error:", error);
            showToast(error?.data?.message || 'Failed to search flights', 'error');
            setFlights([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-search on page load if URL params exist
    useEffect(() => {
        if (initialSearchDone) return;

        const origin = searchParams.get('origin');
        const destination = searchParams.get('destination');
        const departureDate = searchParams.get('departure_date');

        if (origin && destination && departureDate) {
            setInitialSearchDone(true);
            handleSearch({
                origin,
                destination,
                departureDate,
                returnDate: searchParams.get('return_date') || '',
                passengers: parseInt(searchParams.get('passengers') || '1'),
                class: (searchParams.get('class') as any) || 'economy',
            });
        }
    }, [searchParams, initialSearchDone]);

    return (
        <div className="search-container">
            <SearchWidget onSearch={handleSearch} isLoading={isLoading} />

            {flights.length > 0 && (
                <div className="results-container">
                    <div className="results-header">
                        <h2>Found {flights.length} flights</h2>
                    </div>

                    <div className="results-grid">
                        {flights.map((flight) => {
                            const airline = getAirlineInfo(flight.flight_number || 'JQ');
                            const seats = flight.available_seats !== undefined ? flight.available_seats : Math.floor(Math.random() * 20) + 2;

                            return (
                                <Card key={flight.id} className="flight-card">
                                    <div className="flight-header">
                                        <div className="flight-airline">
                                            <span className="airline-logo" style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{airline.logo}</span>
                                            <div>
                                                <h3>{airline.name}</h3>
                                                <span className="flight-number">{flight.flight_number}</span>
                                            </div>
                                        </div>
                                        <Badge variant={seats > 5 ? 'success' : 'warning'}>
                                            {seats} seats left
                                        </Badge>
                                    </div>

                                    <div className="flight-route">
                                        <div className="flight-location">
                                            <div className="flight-time">{formatTime(flight.departure_time)}</div>
                                            <div className="flight-city">{flight.origin}</div>
                                        </div>

                                        <div className="flight-duration">
                                            <div className="flight-line" />
                                            <div className="flight-duration-text">{formatDuration(flight.duration_minutes)}</div>
                                        </div>

                                        <div className="flight-location">
                                            <div className="flight-time">{formatTime(flight.arrival_time)}</div>
                                            <div className="flight-city">{flight.destination}</div>
                                        </div>
                                    </div>

                                    <div className="flight-footer">
                                        <div className="flight-price">
                                            <span className="price-label">From</span>
                                            <span className="price-amount">${Number(flight.base_price || 0).toFixed(2)}</span>
                                        </div>
                                        <Button size="sm" onClick={() => {
                                            // Store flight details in sessionStorage for the booking flow
                                            const flightData = {
                                                id: flight.id,
                                                flight_number: flight.flight_number,
                                                airline: getAirlineInfo(flight.flight_number || 'JQ').name,
                                                origin: flight.origin,
                                                destination: flight.destination,
                                                departure_time: flight.departure_time,
                                                arrival_time: flight.arrival_time,
                                                duration_minutes: flight.duration_minutes,
                                                base_price: Number(flight.base_price || 0),
                                                class_type: flight.class_type || 'economy',
                                                available_seats: flight.available_seats
                                            };
                                            sessionStorage.setItem('selected_flight', JSON.stringify(flightData));

                                            const targetUrl = `/booking/passengers?flightId=${flight.id}`;

                                            if (isAuthenticated) {
                                                window.location.href = targetUrl;
                                            } else {
                                                window.location.href = `/login?returnUrl=${encodeURIComponent(targetUrl)}`;
                                            }
                                        }}>Select Flight</Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {!isLoading && flights.length === 0 && (
                <div className="empty-state">
                    <p>Enter your travel details above to search for flights</p>
                </div>
            )}
        </div>
    );
}

export default function FlightSearchPage() {
    return (
        <main className="search-page">
            <div className="search-header">
                <h1 className="search-title">
                    Find Your Perfect <span className="text-gradient">Flight</span>
                </h1>
                <p className="search-subtitle">Search thousands of flights to destinations worldwide</p>
            </div>
            <Suspense fallback={<div className="p-8 text-center">Loading search...</div>}>
                <FlightSearchContent />
            </Suspense>
        </main>
    );
}
