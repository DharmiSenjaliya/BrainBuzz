import React, { useState } from 'react'
import './ForgotPassword.css'
import api from './services/api'

function ForgotPassword({ onBack }) {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setLoading(true)
            setMessage('')

            const response = await api.post('/forgot-password', { email })

            setMessage(response.data.message || 'Password reset link sent.')
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                'Unable to send password reset link.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="forgot-password-container">
            <form className="forgot-password-form" onSubmit={handleSubmit}>
                <h2>Forgot Password?</h2>
                <p>Enter your registered email address.</p>

                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                {message && <p className="forgot-message">{message}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button type="button" onClick={onBack}>
                    Back to Login
                </button>
            </form>
        </div>
    )
}

export default ForgotPassword