'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BookingDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [booking] = useState({
        id: params.id,
        reference: 'JQ-ABC123',
        user: 'John Doe',
        userEmail: 'john@example.com',
        type: 'Flight',
        status: 'Confirmed',
        amount: 599.99,
        date: '2024-02-15',
        details: {
            airline: 'JourneyIQ Airways',
            flightNumber: 'JQ-101',
            origin: 'New York (JFK)',
            destination: 'London (LHR)',
            departureTime: '2024-02-15 10:00 AM',
            arrivalTime: '2024-02-15 10:00 PM',
            passengers: [{ name: 'John Doe', seat: '12A' }],
        },
    });

    const handleRefund = () => {
        // API call to process refund
        alert('Refund processed (mock)');
        setShowRefundModal(false);
        router.push('/admin/bookings');
    };

    const handleCancel = () => {
        if (confirm('Are you sure you want to cancel this booking?')) {
            // API call to cancel booking
            alert('Booking cancelled (mock)');
            router.push('/admin/bookings');
        }
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Booking Details</h1>
                    <p className="page-subtitle">{booking.reference}</p>
                </div>
                <div className="page-actions">
                    <button className="btn-secondary" onClick={() => router.back()}>
                        Back
                    </button>
                    {booking.status === 'Confirmed' && (
                        <>
                            <button className="btn-warning" onClick={() => setShowRefundModal(true)}>
                                Process Refund
                            </button>
                            <button className="btn-danger" onClick={handleCancel}>
                                Cancel Booking
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="details-grid">
                <div className="details-card">
                    <h2 className="card-title">Booking Information</h2>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">Reference</span>
                            <span className="detail-value">{booking.reference}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">User</span>
                            <span className="detail-value">{booking.user}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{booking.userEmail}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Type</span>
                            <span className="detail-value">{booking.type}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Status</span>
                            <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                                {booking.status}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Amount</span>
                            <span className="detail-value">${booking.amount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="details-card">
                    <h2 className="card-title">Flight Details</h2>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">Airline</span>
                            <span className="detail-value">{booking.details.airline}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Flight Number</span>
                            <span className="detail-value">{booking.details.flightNumber}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Origin</span>
                            <span className="detail-value">{booking.details.origin}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Destination</span>
                            <span className="detail-value">{booking.details.destination}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Departure</span>
                            <span className="detail-value">{booking.details.departureTime}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Arrival</span>
                            <span className="detail-value">{booking.details.arrivalTime}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="details-card" style={{ marginTop: '2rem' }}>
                <h2 className="card-title">Passengers</h2>
                <table className="simple-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Seat</th>
                        </tr>
                    </thead>
                    <tbody>
                        {booking.details.passengers.map((passenger, idx) => (
                            <tr key={idx}>
                                <td>{passenger.name}</td>
                                <td>{passenger.seat}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Refund Modal */}
            {showRefundModal && (
                <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Process Refund</h2>
                        <p>Are you sure you want to process a refund for this booking?</p>
                        <p style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>
                            Refund amount: ${(booking.amount * 0.9).toFixed(2)} (10% cancellation fee)
                        </p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowRefundModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleRefund}>
                                Confirm Refund
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
