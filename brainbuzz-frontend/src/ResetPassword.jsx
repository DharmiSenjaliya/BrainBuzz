import React, { useState } from 'react'
import './ResetPassword.css'
import api from './services/api'

function ResetPassword({ onBack }) {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const emailFromUrl = params.get('email') || ''

    const [email, setEmail] = useState(emailFromUrl)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setMessage('Passwords do not match.')
            return
        }

        try {
            setLoading(true)
            setMessage('')

            const response = await api.post('/reset-password', {
                token,
                email,
                password,
                password_confirmation: confirmPassword,
            })

            setMessage(response.data.message || 'Password reset successful!')
        } catch (error) {
            setMessage(
                error.response?.data?.message || 'Unable to reset password.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="reset-password-container">
            <form className="reset-password-form" onSubmit={handleSubmit}>
                <h2>Reset Password</h2>

                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                {message && <p>{message}</p>}

                <button type="submit" disabled={loading || !token}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <button type="button" onClick={onBack}>
                    Back to Login
                </button>
            </form>
        </div>
    )
}

export default ResetPassword