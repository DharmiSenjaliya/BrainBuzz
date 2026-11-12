import { useState } from 'react'
import api from './services/api'
import './Feedback.css'

function Feedback({ onBack }) {
    const [rating, setRating] = useState(5)
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const ratingDetails = {
        1: { label: 'Poor', emoji: '😞', text: 'We will try to improve!' },
        2: { label: 'Needs Improvement', emoji: '😕', text: 'Thanks for your honesty!' },
        3: { label: 'Good', emoji: '🙂', text: 'Glad you enjoyed it!' },
        4: { label: 'Very Good', emoji: '😄', text: 'We appreciate your support!' },
        5: { label: 'Excellent', emoji: '🤩', text: 'Awesome! Thank you!' },
    }

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
            if (!token) {
    setError('Please login to submit feedback.')
    return
}

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

            <div className="feedback-topbar">
                <button className="feedback-back-btn" onClick={onBack}>
                    <span>←</span>
                    Back to Dashboard
                </button>

                <span className="feedback-brand">
                    <span className="feedback-brand-icon">B</span>
                    BrainBuzz
                </span>
            </div>

            <div className="feedback-content">

                <div className="feedback-intro">
                    <span className="feedback-eyebrow">
                        <span className="feedback-live-dot"></span>
                        YOUR VOICE MATTERS
                    </span>

                    <h1>
                        Help us make
                        <span> BrainBuzz better.</span>
                    </h1>

                    <p>
                        Your feedback helps us create a smarter,
                        better and more enjoyable gaming experience.
                    </p>
                </div>

                <form className="feedback-card" onSubmit={handleSubmit}>

                    <div className="feedback-card-heading">
                        <div>
                            <span className="feedback-step">YOUR EXPERIENCE</span>
                            <h2>How was your experience?</h2>
                            <p>Rate your overall experience with BrainBuzz.</p>
                        </div>

                        <div className="feedback-heading-icon">✦</div>
                    </div>

                    <div className="feedback-rating-box">

                        <div className="feedback-stars">
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

                        <div className="feedback-rating-result">
                            <span className="feedback-rating-emoji">
                                {ratingDetails[rating].emoji}
                            </span>

                            <div>
                                <strong>{ratingDetails[rating].label}</strong>
                                <small>{ratingDetails[rating].text}</small>
                            </div>
                        </div>

                    </div>

                    <div className="feedback-divider"></div>

                    <div className="feedback-message-heading">
                        <label htmlFor="feedback-message">
                            Tell us more
                        </label>
                        <span>Required</span>
                    </div>

                    <textarea
                        id="feedback-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Share your thoughts, suggestions or ideas..."
                        rows="6"
                        maxLength="1000"
                    />

                    <div className="feedback-character-count">
                        <span>We'd love to hear your thoughts.</span>
                        <strong>{message.length}/1000</strong>
                    </div>

                    {success && (
                        <div className="feedback-success">
                            <span>✓</span> {success}
                        </div>
                    )}

                    {error && (
                        <div className="feedback-error">
                            <span>!</span> {error}
                        </div>
                    )}

                    <button
                        className="feedback-submit-btn"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Submit Feedback'}
                        {!loading && <span>→</span>}
                    </button>

                    <p className="feedback-privacy">
                        🔒 Your feedback is valuable and helps us improve.
                    </p>

                </form>

                <div className="feedback-footer">
                    Made with <span>♥</span> for the BrainBuzz community
                </div>

            </div>
        </div>
    )
}

export default Feedback




