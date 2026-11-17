import { useState } from 'react'
import './ResetPassword.css'
import api from './services/api'

function ResetPassword({ onBack, onSuccess, backLabel = 'Back to Login' }) {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const emailFromUrl = params.get('email') || ''

    const [email, setEmail] = useState(emailFromUrl)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [completed, setCompleted] = useState(false)

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
            setCompleted(true)
            onSuccess?.(email)
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

                {!token && (
                    <p>
                        This reset link is invalid or incomplete. Go back to login
                        and request a new password reset link.
                    </p>
                )}

                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                />

                <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                />

                <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                />

                {message && <p>{message}</p>}

                <button type="submit" disabled={loading || !token || completed}>
                    {loading ? 'Resetting...' : completed ? 'Password Reset' : 'Reset Password'}
                </button>

                <button type="button" onClick={onBack}>
                    {backLabel}
                </button>
            </form>
        </div>
    )
}

export default ResetPassword