'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [user] = useState({
        id: params.id,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        role: 'Customer',
        status: 'Active',
        joinedDate: '2024-01-15',
        totalBookings: 5,
        totalSpent: 2999.95,
    });

    const [bookings] = useState([
        { id: '1', reference: 'JQ-ABC123', type: 'Flight', amount: 599.99, date: '2024-02-15' },
        { id: '2', reference: 'JQ-DEF456', type: 'Hotel', amount: 450.00, date: '2024-02-10' },
    ]);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this user?')) {
            // API call to delete user
            router.push('/admin/users');
        }
    };

    const toggleStatus = () => {
        // API call to toggle user status
        alert('Status toggled (mock)');
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Details</h1>
                    <p className="page-subtitle">{user.email}</p>
                </div>
                <div className="page-actions">
                    <button className="btn-secondary" onClick={() => router.back()}>
                        Back
                    </button>
                    <button className="btn-danger" onClick={handleDelete}>
                        Delete User
                    </button>
                </div>
            </div>

            <div className="details-grid">
                <div className="details-card">
                    <h2 className="card-title">Profile Information</h2>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">Name</span>
                            <span className="detail-value">{user.name}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{user.email}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{user.phone}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Role</span>
                            <span className="detail-value">{user.role}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Status</span>
                            <span className={`status-badge status-${user.status.toLowerCase()}`}>
                                {user.status}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Joined Date</span>
                            <span className="detail-value">{user.joinedDate}</span>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={toggleStatus} style={{ marginTop: '1rem' }}>
                        Toggle Status
                    </button>
                </div>

                <div className="details-card">
                    <h2 className="card-title">Statistics</h2>
                    <div className="stats-list">
                        <div className="stat-item">
                            <span className="stat-label">Total Bookings</span>
                            <span className="stat-value">{user.totalBookings}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Spent</span>
                            <span className="stat-value">${user.totalSpent.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="details-card" style={{ marginTop: '2rem' }}>
                <h2 className="card-title">Booking History</h2>
                <table className="simple-table">
                    <thead>
                        <tr>
                            <th>Reference</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr key={booking.id}>
                                <td>{booking.reference}</td>
                                <td>{booking.type}</td>
                                <td>${booking.amount.toFixed(2)}</td>
                                <td>{booking.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
