
import { useState } from 'react'
import api from './services/api'
import './Feedback.css'

function Feedback({ onBack }) {
    const [rating, setRating] = useState(5)
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSuccess('')
        setError('')

        if (!message.trim()) {
            setError('Please enter your feedback.')
            return
        }

        try {
            setLoading(true)

            const token = localStorage.getItem('brainbuzz_token')

            await api.post(
                '/feedback',
                {
                    rating,
                    message: message.trim(),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            setSuccess('Thank you! Your feedback has been submitted.')
            setMessage('')
            setRating(5)
        } catch (err) {
            console.error('Feedback error:', err)
            setError(
                err.response?.data?.message ||
                'Unable to submit feedback. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="feedback-page">
            <div className="feedback-header">
                <button className="feedback-back-btn" onClick={onBack}>
                    ← Back
                </button>

                <h1>💬 Share Your Feedback</h1>
                <p>Your suggestions help us improve BrainBuzz!</p>
            </div>

            <form className="feedback-card" onSubmit={handleSubmit}>
                <h2>How was your experience?</h2>

                <div className="feedback-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={`feedback-star ${
                                star <= rating ? 'active' : ''
                            }`}
                            onClick={() => setRating(star)}
                            aria-label={`Rate ${star} stars`}
                        >
                            ★
                        </button>
                    ))}
                </div>

                <p className="feedback-rating-label">
                    {rating === 5
                        ? 'Excellent!'
                        : rating === 4
                        ? 'Very Good!'
                        : rating === 3
                        ? 'Good'
                        : rating === 2
                        ? 'Needs Improvement'
                        : 'Poor'}
                </p>

                <label htmlFor="feedback-message">
                    Your Feedback
                </label>

                <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think..."
                    rows="6"
                    maxLength="1000"
                />

                <div className="feedback-character-count">
                    {message.length}/1000
                </div>

                {success && (
                    <div className="feedback-success">{success}</div>
                )}

                {error && (
                    <div className="feedback-error">{error}</div>
                )}

                <button
                    className="feedback-submit-btn"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </form>
        </div>
    )
}

export default Feedback
