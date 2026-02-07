'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function ProfilePage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
    });

    // Sync form data with user when user changes
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
            }));
        }
    }, [user]);

    // Load additional profile data from localStorage on mount
    useEffect(() => {
        const savedPhone = localStorage.getItem('user_phone');
        const savedAddress = localStorage.getItem('user_address');
        setFormData(prev => ({
            ...prev,
            phone: savedPhone || '',
            address: savedAddress || '',
        }));
        setIsLoading(false);
    }, []);

    const handleSave = async () => {
        try {
            // Save additional profile data to localStorage
            localStorage.setItem('user_phone', formData.phone);
            localStorage.setItem('user_address', formData.address);

            // In a real app, this would call an API to update the user profile
            showToast('Profile updated successfully', 'success');
            setIsEditing(false);
        } catch (error) {
            showToast('Failed to update profile', 'error');
        }
    };

    if (isLoading) {
        return (
            <main className="dashboard-page">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">My Profile</h1>
                </div>
                <div className="dashboard-container">
                    <Card className="profile-card">
                        <div className="loading-spinner"></div>
                        <p>Loading profile...</p>
                    </Card>
                </div>
            </main>
        );
    }

    return (
        <AuthGuard>
            <main className="dashboard-page">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">My Profile</h1>
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </Button>
                    )}
                </div>

                <Card className="profile-card">
                    <div className="profile-avatar">
                        <div className="avatar-circle">
                            {(formData.name || user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                    </div>

                    <div className="profile-form">
                        <Input
                            label="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            disabled={!isEditing}
                        />

                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={!isEditing}
                        />

                        <Input
                            label="Phone Number"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            disabled={!isEditing}
                        />

                        <Input
                            label="Address"
                            placeholder="123 Main St, City, Country"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            disabled={!isEditing}
                        />

                        {isEditing && (
                            <div className="profile-actions">
                                <Button variant="secondary" onClick={() => {
                                    // Reset form to current user data
                                    setFormData({
                                        name: user?.name || '',
                                        email: user?.email || '',
                                        phone: localStorage.getItem('user_phone') || '',
                                        address: localStorage.getItem('user_address') || '',
                                    });
                                    setIsEditing(false);
                                }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave}>
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            </main>
        </AuthGuard>
    );
}
