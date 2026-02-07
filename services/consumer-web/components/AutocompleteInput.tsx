'use client';

import { useState, useRef, useEffect } from 'react';

interface AutocompleteInputProps {
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

// Popular airports for autocomplete
const AIRPORTS = [
    { code: 'JFK', city: 'New York', name: 'John F. Kennedy International' },
    { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International' },
    { code: 'ORD', city: 'Chicago', name: "O'Hare International" },
    { code: 'DFW', city: 'Dallas', name: 'Dallas/Fort Worth International' },
    { code: 'DEN', city: 'Denver', name: 'Denver International' },
    { code: 'SFO', city: 'San Francisco', name: 'San Francisco International' },
    { code: 'SEA', city: 'Seattle', name: 'Seattle-Tacoma International' },
    { code: 'LAS', city: 'Las Vegas', name: 'McCarran International' },
    { code: 'MIA', city: 'Miami', name: 'Miami International' },
    { code: 'ATL', city: 'Atlanta', name: 'Hartsfield-Jackson Atlanta International' },
    { code: 'BOS', city: 'Boston', name: 'Logan International' },
    { code: 'MCO', city: 'Orlando', name: 'Orlando International' },
    { code: 'PHX', city: 'Phoenix', name: 'Phoenix Sky Harbor International' },
    { code: 'IAH', city: 'Houston', name: 'George Bush Intercontinental' },
    { code: 'LHR', city: 'London', name: 'Heathrow' },
    { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle' },
    { code: 'DXB', city: 'Dubai', name: 'Dubai International' },
    { code: 'HND', city: 'Tokyo', name: 'Haneda' },
    { code: 'SIN', city: 'Singapore', name: 'Changi' },
];

export function AutocompleteInput({ label, placeholder, value, onChange, required }: AutocompleteInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredAirports, setFilteredAirports] = useState(AIRPORTS);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (inputValue: string) => {
        onChange(inputValue);

        if (inputValue.length > 0) {
            const filtered = AIRPORTS.filter(airport =>
                airport.city.toLowerCase().includes(inputValue.toLowerCase()) ||
                airport.code.toLowerCase().includes(inputValue.toLowerCase()) ||
                airport.name.toLowerCase().includes(inputValue.toLowerCase())
            );
            setFilteredAirports(filtered);
            setIsOpen(true);
        } else {
            setFilteredAirports(AIRPORTS);
            setIsOpen(false);
        }
    };

    const handleSelect = (airport: typeof AIRPORTS[0]) => {
        onChange(airport.code);
        setIsOpen(false);
    };

    return (
        <div className="autocomplete-wrapper" ref={wrapperRef}>
            <label className="input-label" htmlFor={inputId}>
                {label} {required && <span className="text-error">*</span>}
            </label>
            <div className="autocomplete-input-container">
                <svg className="autocomplete-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    id={inputId}
                    type="text"
                    className="input autocomplete-input"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    required={required}
                />
            </div>

            {isOpen && filteredAirports.length > 0 && (
                <div className="autocomplete-dropdown">
                    {filteredAirports.slice(0, 8).map((airport) => (
                        <button
                            key={airport.code}
                            type="button"
                            className="autocomplete-option"
                            onClick={() => handleSelect(airport)}
                        >
                            <div className="autocomplete-option-code">{airport.code}</div>
                            <div className="autocomplete-option-details">
                                <div className="autocomplete-option-city">{airport.city}</div>
                                <div className="autocomplete-option-name">{airport.name}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
