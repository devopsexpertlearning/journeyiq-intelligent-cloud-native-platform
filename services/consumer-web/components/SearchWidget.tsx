'use client';

import { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { AutocompleteInput } from './AutocompleteInput';

interface SearchWidgetProps {
    onSearch: (params: SearchParams) => void;
    isLoading?: boolean;
}

export interface SearchParams {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    class: 'economy' | 'business' | 'first';
}

export function SearchWidget({ onSearch, isLoading = false }: SearchWidgetProps) {
    const [formData, setFormData] = useState<SearchParams>({
        origin: '',
        destination: '',
        departureDate: '',
        returnDate: '',
        passengers: 1,
        class: 'economy',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="search-widget">
            <div className="search-grid">
                <AutocompleteInput
                    label="From"
                    placeholder="City or Airport"
                    value={formData.origin}
                    onChange={(val) => setFormData({ ...formData, origin: val })}
                    required
                />

                <AutocompleteInput
                    label="To"
                    placeholder="City or Airport"
                    value={formData.destination}
                    onChange={(val) => setFormData({ ...formData, destination: val })}
                    required
                />

                <Input
                    type="date"
                    label="Departure"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
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
                    label="Return (Optional)"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
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
                    <label className="input-label">Passengers</label>
                    <input
                        type="number"
                        min="1"
                        max="9"
                        className="input"
                        value={formData.passengers}
                        onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
                    />
                </div>

                <div className="input-wrapper">
                    <label className="input-label">Class</label>
                    <select
                        className="input"
                        value={formData.class}
                        onChange={(e) => setFormData({ ...formData, class: e.target.value as any })}
                    >
                        <option value="economy">Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                    </select>
                </div>
            </div>

            <Button type="submit" isLoading={isLoading} className="search-submit">
                Search Flights
            </Button>
        </form>
    );
}
