'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { AutocompleteInput } from '@/components/AutocompleteInput';
import Link from 'next/link';
import { Input } from '@/components/Input';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels'>('flights');
  const [searchData, setSearchData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    location: '',
    checkIn: '',
    checkOut: '',
  });

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  const handleFlightSearch = () => {
    const params = new URLSearchParams();
    if (searchData.origin) params.append('origin', searchData.origin);
    if (searchData.destination) params.append('destination', searchData.destination);
    if (searchData.departureDate) params.append('departure_date', searchData.departureDate);

    router.push(`/search/flights?${params.toString()}`);
  };

  const handleHotelSearch = () => {
    const params = new URLSearchParams();
    if (searchData.location) params.append('location', searchData.location);
    if (searchData.checkIn) params.append('checkin', searchData.checkIn);
    if (searchData.checkOut) params.append('checkout', searchData.checkOut);

    router.push(`/search/hotels?${params.toString()}`);
  };

  return (
    <main className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient-orb hero-gradient-orb-1"></div>
          <div className="hero-gradient-orb hero-gradient-orb-2"></div>
          <div className="hero-gradient-orb hero-gradient-orb-3"></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge animate-slide-down">
            <span className="hero-badge-icon">✈️</span>
            <span>Your Journey Starts Here</span>
          </div>

          <h1 className="hero-title animate-slide-up">
            Discover Your Next
            <br />
            <span className="text-gradient">Adventure</span>
          </h1>

          <p className="hero-subtitle animate-slide-up">
            Book flights, hotels, and experiences with AI-powered recommendations.
            <br />
            Travel smarter with JourneyIQ.
          </p>

          {/* Search Widget */}
          <div className="hero-search-widget animate-scale-in">
            <div className="search-tabs">
              <button
                className={`search-tab ${activeTab === 'flights' ? 'search-tab-active' : ''}`}
                onClick={() => setActiveTab('flights')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
                Flights
              </button>
              <button
                className={`search-tab ${activeTab === 'hotels' ? 'search-tab-active' : ''}`}
                onClick={() => setActiveTab('hotels')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Hotels
              </button>
            </div>

            <div className="search-form">
              {activeTab === 'flights' ? (
                <>
                  <div className="search-input-group">
                    <AutocompleteInput
                      label=""
                      placeholder="From where?"
                      value={searchData.origin}
                      onChange={(val) => setSearchData(prev => ({ ...prev, origin: val }))}
                    />
                    <AutocompleteInput
                      label=""
                      placeholder="To where?"
                      value={searchData.destination}
                      onChange={(val) => setSearchData(prev => ({ ...prev, destination: val }))}
                    />
                    <div className="input-container">
                      <svg className="input-icon-left" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <input
                        type="date"
                        className="input input-with-left-icon"
                        placeholder="Departure"
                        aria-label="Departure Date"
                        value={searchData.departureDate}
                        onChange={(e) => setSearchData(prev => ({ ...prev, departureDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleFlightSearch}
                    className="search-submit-btn"
                  >
                    Search Flights
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Button>
                </>
              ) : (
                <>
                  <div className="search-input-group">
                    <div className="input-container">
                      <svg className="input-icon-left" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                      <input
                        type="text"
                        className="input input-with-left-icon"
                        placeholder="City or hotel name"
                        aria-label="Location"
                        value={searchData.location}
                        onChange={(e) => setSearchData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    <div className="input-container">
                      <svg className="input-icon-left" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <input
                        type="date"
                        className="input input-with-left-icon"
                        placeholder="Check-in"
                        aria-label="Check-in Date"
                        value={searchData.checkIn}
                        onChange={(e) => setSearchData(prev => ({ ...prev, checkIn: e.target.value }))}
                      />
                    </div>
                    <div className="input-container">
                      <svg className="input-icon-left" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <input
                        type="date"
                        className="input input-with-left-icon"
                        placeholder="Check-out"
                        aria-label="Check-out Date"
                        value={searchData.checkOut}
                        onChange={(e) => setSearchData(prev => ({ ...prev, checkOut: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleHotelSearch}
                    className="search-submit-btn"
                  >
                    Search Hotels
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="hero-quick-links animate-fade-in">
            <span className="quick-links-label">Already have an account?</span>
            <Link href="/login" className="quick-link">
              Sign In
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Why Choose JourneyIQ?</h2>
            <p className="section-subtitle">
              Experience the future of travel booking with AI-powered intelligence
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon feature-icon-blue">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3 className="feature-title">AI-Powered Search</h3>
              <p className="feature-description">
                Our intelligent system finds the best deals and routes tailored to your preferences
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-purple">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="feature-title">Secure Booking</h3>
              <p className="feature-description">
                Bank-level encryption and secure payment processing for peace of mind
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-cyan">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="feature-title">24/7 Support</h3>
              <p className="feature-description">
                AI travel assistant available round the clock to help with your journey
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-green">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <h3 className="feature-title">Instant E-Tickets</h3>
              <p className="feature-description">
                Download your tickets immediately after booking, no waiting required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-value">1M+</div>
            <div className="stat-label">Happy Travelers</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-value">500+</div>
            <div className="stat-label">Destinations</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-value">24/7</div>
            <div className="stat-label">Support</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-value">4.9★</div>
            <div className="stat-label">User Rating</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Start Your Journey?</h2>
          <p className="cta-subtitle">
            Join millions of travelers who trust JourneyIQ for their adventures
          </p>
          <div className="cta-buttons">
            <Button variant="primary" size="xl" onClick={() => router.push('/register')}>
              Create Free Account
            </Button>
            <Button variant="ghost" size="xl" onClick={() => router.push('/search/flights')}>
              Explore Destinations
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
