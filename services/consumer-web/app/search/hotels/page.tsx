'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { AutocompleteInput } from '@/components/AutocompleteInput';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';

interface Hotel {
    id: string;
    name: string;
    location: string;
    rating: number;
    price_per_night: number;
    available_rooms: number;
    amenities: string[];
}

function HotelSearchContent() {
    const searchParams = useSearchParams();
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();
    const [searchData, setSearchData] = useState({
        location: '',
        checkIn: '',
        checkOut: '',
        guests: 1,
    });
    const [initialSearchDone, setInitialSearchDone] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.post<{ hotels?: Hotel[]; results?: Hotel[] }>('/search/hotels', {
                location: searchData.location,
                checkin: searchData.checkIn,
                checkout: searchData.checkOut,
                guests: searchData.guests
            });

            const hotelData = response.results || response.hotels || [];
            setHotels(hotelData);

            if (hotelData.length === 0) {
                showToast('No hotels found for your search criteria', 'info');
            }
        } catch (error: any) {
            showToast(error?.data?.message || 'Failed to search hotels', 'error');
            setHotels([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-search on page load if URL params exist
    useEffect(() => {
        if (initialSearchDone) return;

        const location = searchParams.get('location');
        const checkIn = searchParams.get('checkin');
        const checkOut = searchParams.get('checkout');
        const guests = searchParams.get('guests');

        if (location) {
            setSearchData({
                location: location,
                checkIn: checkIn || '',
                checkOut: checkOut || '',
                guests: guests ? parseInt(guests) : 1
            });

            if (checkIn && checkOut) {
                setInitialSearchDone(true);
                // We need to pass the values directly since state update might not be instant
                // But handleSearch uses state, so let's defer it slightly or update logic
                // Better approach: handleSearch calls API with passed values or state
            }
        }
    }, [searchParams]);

    // Trigger search when initial params are set
    useEffect(() => {
        if (initialSearchDone && searchData.location && searchData.checkIn && searchData.checkOut) {
            handleSearch();
        }
    }, [initialSearchDone]); // Only depend on this flag toggle

    return (
        <div className="search-container">
            <form onSubmit={handleSearch} className="search-widget">
                <div className="search-grid">
                    <AutocompleteInput
                        label="Location"
                        placeholder="City or hotel name"
                        value={searchData.location}
                        onChange={(val) => setSearchData({ ...searchData, location: val })}
                        required
                    />
                    <Input
                        type="date"
                        label="Check-in"
                        value={searchData.checkIn}
                        onChange={(e) => setSearchData({ ...searchData, checkIn: e.target.value })}
                        required
                        leftIcon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        }
                    />
                    <Input
                        type="date"
                        label="Check-out"
                        value={searchData.checkOut}
                        onChange={(e) => setSearchData({ ...searchData, checkOut: e.target.value })}
                        required
                        leftIcon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        }
                    />
                    <div className="input-wrapper">
                        <label className="input-label">Guests</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            className="input"
                            value={searchData.guests}
                            onChange={(e) => setSearchData({ ...searchData, guests: parseInt(e.target.value) })}
                        />
                    </div>
                </div>
                <Button type="submit" isLoading={isLoading} className="search-submit">
                    Search Hotels
                </Button>
            </form>

            {hotels.length > 0 && (
                <div className="results-container">
                    <div className="results-header">
                        <h2>Found {hotels.length} hotels</h2>
                    </div>

                    <div className="results-grid">
                        {hotels.map((hotel) => (
                            <Card key={hotel.id} className="hotel-card">
                                <div className="hotel-header">
                                    <div>
                                        <h3 className="hotel-name">{hotel.name}</h3>
                                        <p className="hotel-location">{hotel.location}</p>
                                    </div>
                                    <div className="hotel-rating">
                                        ⭐ {hotel.rating.toFixed(1)}
                                    </div>
                                </div>

                                <div className="hotel-amenities">
                                    {hotel.amenities.slice(0, 4).map((amenity, idx) => (
                                        <Badge key={idx} variant="info">{amenity}</Badge>
                                    ))}
                                </div>

                                <div className="hotel-footer">
                                    <div className="hotel-price">
                                        <span className="price-label">Per night from</span>
                                        <span className="price-amount">${hotel.price_per_night.toFixed(2)}</span>
                                    </div>
                                    <Button size="sm">View Details</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {!isLoading && hotels.length === 0 && (
                <div className="empty-state">
                    <p>Enter your travel details above to search for hotels</p>
                </div>
            )}
        </div>
    );
}

export default function HotelSearchPage() {
    return (
        <main className="search-page">
            <div className="search-header">
                <h1 className="search-title">
                    Find Your Perfect <span className="text-gradient">Hotel</span>
                </h1>
                <p className="search-subtitle">Discover amazing places to stay worldwide</p>
            </div>
            <Suspense fallback={<div className="p-8 text-center">Loading search...</div>}>
                <HotelSearchContent />
            </Suspense>
        </main>
    );
}
