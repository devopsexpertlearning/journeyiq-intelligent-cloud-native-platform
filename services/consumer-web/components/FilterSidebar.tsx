'use client';

import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface FilterSidebarProps {
    onFilterChange: (filters: SearchFilters) => void;
}

export interface SearchFilters {
    priceRange: [number, number];
    stops: string[];
    airlines: string[];
    departureTime: string[];
}

export function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
    const [filters, setFilters] = useState<SearchFilters>({
        priceRange: [0, 2000],
        stops: [],
        airlines: [],
        departureTime: [],
    });

    const handlePriceChange = (value: number, index: 0 | 1) => {
        const newRange: [number, number] = [...filters.priceRange] as [number, number];
        newRange[index] = value;
        const updated = { ...filters, priceRange: newRange };
        setFilters(updated);
        onFilterChange(updated);
    };

    const toggleFilter = (category: keyof Omit<SearchFilters, 'priceRange'>, value: string) => {
        const current = filters[category];
        const updated = {
            ...filters,
            [category]: current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value],
        };
        setFilters(updated);
        onFilterChange(updated);
    };

    const clearFilters = () => {
        const reset: SearchFilters = {
            priceRange: [0, 2000],
            stops: [],
            airlines: [],
            departureTime: [],
        };
        setFilters(reset);
        onFilterChange(reset);
    };

    return (
        <Card className="filter-sidebar">
            <div className="filter-header">
                <h3>Filters</h3>
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear All
                </Button>
            </div>

            <div className="filter-section">
                <h4 className="filter-title">Price Range</h4>
                <div className="price-inputs">
                    <input
                        type="number"
                        className="input"
                        value={filters.priceRange[0]}
                        onChange={(e) => handlePriceChange(parseInt(e.target.value), 0)}
                        placeholder="Min"
                    />
                    <span>-</span>
                    <input
                        type="number"
                        className="input"
                        value={filters.priceRange[1]}
                        onChange={(e) => handlePriceChange(parseInt(e.target.value), 1)}
                        placeholder="Max"
                    />
                </div>
                <input
                    type="range"
                    min="0"
                    max="2000"
                    value={filters.priceRange[1]}
                    onChange={(e) => handlePriceChange(parseInt(e.target.value), 1)}
                    className="price-slider"
                />
            </div>

            <div className="filter-section">
                <h4 className="filter-title">Stops</h4>
                <label className="filter-checkbox">
                    <input
                        type="checkbox"
                        checked={filters.stops.includes('nonstop')}
                        onChange={() => toggleFilter('stops', 'nonstop')}
                    />
                    <span>Non-stop</span>
                </label>
                <label className="filter-checkbox">
                    <input
                        type="checkbox"
                        checked={filters.stops.includes('1-stop')}
                        onChange={() => toggleFilter('stops', '1-stop')}
                    />
                    <span>1 Stop</span>
                </label>
                <label className="filter-checkbox">
                    <input
                        type="checkbox"
                        checked={filters.stops.includes('2+-stops')}
                        onChange={() => toggleFilter('stops', '2+-stops')}
                    />
                    <span>2+ Stops</span>
                </label>
            </div>

            <div className="filter-section">
                <h4 className="filter-title">Departure Time</h4>
                <label className="filter-checkbox">
                    <input
                        type="checkbox"
                        checked={filters.departureTime.includes('morning')}
                        onChange={() => toggleFilter('departureTime', 'morning')}
                    />
                    <span>Morning (6AM - 12PM)</span>
                </label>
                <label className="filter-checkbox">
                    <input
                        type="checkbox"
                        checked={filters.departureTime.includes('afternoon')}
                        onChange={() => toggleFilter('departureTime', 'afternoon')}
                    />
                    <span>Afternoon (12PM - 6PM)</span>
                </label>
                <label className="filter-checkbox">
                    <input
                        type="checkbox"
                        checked={filters.departureTime.includes('evening')}
                        onChange={() => toggleFilter('departureTime', 'evening')}
                    />
                    <span>Evening (6PM - 12AM)</span>
                </label>
            </div>

            <div className="filter-section">
                <h4 className="filter-title">Airlines</h4>
                {['JourneyIQ Airways', 'SkyHigh Airlines', 'CloudJet'].map(airline => (
                    <label key={airline} className="filter-checkbox">
                        <input
                            type="checkbox"
                            checked={filters.airlines.includes(airline)}
                            onChange={() => toggleFilter('airlines', airline)}
                        />
                        <span>{airline}</span>
                    </label>
                ))}
            </div>
        </Card>
    );
}
