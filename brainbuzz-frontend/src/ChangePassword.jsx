import React, { useState } from 'react'
import './ChangePassword.css'
import api from './services/api'

function ChangePassword({ onBack }) {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            setMessage('New password and confirm password do not match.')
            return
        }

        try {
            setLoading(true)
            setMessage('')

const token = localStorage.getItem('brainbuzz_token')
            const response = await api.post(
                '/change-password',
                {
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: confirmPassword,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )

            setMessage(response.data.message || 'Password changed successfully!')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error) {
            setMessage(
                error.response?.data?.message || 'Unable to change password.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="change-password-container">
            <form className="change-password-form" onSubmit={handleSubmit}>
                <h2>Change Password</h2>

                <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

                <button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                </button>

                <button type="button" onClick={onBack}>
                    Back
                </button>
            </form>
        </div>
    )
}

export default ChangePassword