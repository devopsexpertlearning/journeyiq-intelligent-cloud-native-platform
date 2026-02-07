'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { StarRating } from '@/components/StarRating';
import { AuthGuard } from '@/components/AuthGuard';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';

export default function SubmitReviewPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        bookingId: '',
        rating: 0,
        title: '',
        comment: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.rating === 0) {
            showToast('Please select a rating', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/reviews', {
                resource_id: formData.bookingId,
                resource_type: 'booking',
                rating: formData.rating,
                title: formData.title,
                comment: formData.comment,
            });

            showToast('Review submitted successfully!', 'success');
            router.push('/dashboard');
        } catch (error: any) {
            showToast(error?.data?.message || 'Failed to submit review', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthGuard>
            <main className="booking-page">
                <div className="booking-header">
                    <h1 className="booking-title">Write a Review</h1>
                    <p className="booking-subtitle">Share your experience with other travelers</p>
                </div>

                <Card className="review-form-card">
                    <form onSubmit={handleSubmit} className="review-form">
                        <Input
                            label="Booking Reference"
                            placeholder="JQ-ABC123"
                            value={formData.bookingId}
                            onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                            required
                        />

                        <div className="input-wrapper">
                            <label className="input-label">Overall Rating *</label>
                            <StarRating
                                rating={formData.rating}
                                onChange={(rating) => setFormData({ ...formData, rating })}
                                size="lg"
                            />
                        </div>

                        <Input
                            label="Review Title"
                            placeholder="Great flight experience!"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />

                        <div className="input-wrapper">
                            <label className="input-label">Your Review *</label>
                            <textarea
                                className="input"
                                rows={6}
                                placeholder="Tell us about your experience..."
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                required
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className="booking-actions">
                            <Button variant="secondary" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isSubmitting}>
                                Submit Review
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </AuthGuard>
    );
}
