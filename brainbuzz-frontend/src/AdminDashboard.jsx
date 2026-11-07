import React, { useEffect, useState } from 'react'
import './AdminDashboard.css'
import api from './services/api'

function AdminDashboard({ admin, onLogout }) {
    const [feedback, setFeedback] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deletingId, setDeletingId] = useState(null)

    const fetchFeedback = async () => {
        try {
            setLoading(true)
            setError('')

            const token = localStorage.getItem('brainbuzz_admin_token')

            const response = await api.get('/admin/feedback', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            setFeedback(response.data.feedback || [])
        } catch (error) {
            console.error('Feedback Fetch Error:', error)
            setError(
                error.response?.data?.message ||
                'Unable to load feedback.'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFeedback()
    }, [])

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this feedback?')) {
            return
        }

        try {
            setDeletingId(id)

            const token = localStorage.getItem('brainbuzz_admin_token')

            await api.delete(`/admin/feedback/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            setFeedback((previous) =>
                previous.filter((item) => item.id !== id)
            )
        } catch (error) {
            console.error('Feedback Delete Error:', error)
            alert(
                error.response?.data?.message ||
                'Unable to delete feedback.'
            )
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <h2>BrainBuzz Admin Dashboard</h2>
                <button onClick={onLogout}>Logout</button>
            </header>

            <main className="admin-content">
                <h3>Welcome, {admin?.name || 'Admin'}!</h3>
                <p>Manage your BrainBuzz game from here.</p>

                <section className="admin-feedback-section">
                    <h2>Player Feedback</h2>
                    <p>Total Feedback: {feedback.length}</p>

                    <button onClick={fetchFeedback}>
                        Refresh Feedback
                    </button>

                    {loading ? (
                        <p>Loading feedback...</p>
                    ) : error ? (
                        <p className="feedback-error">{error}</p>
                    ) : feedback.length === 0 ? (
                        <p>No feedback available yet.</p>
                    ) : (
                        <div className="admin-feedback-list">
                            {feedback.map((item) => (
                                <div
                                    className="admin-feedback-card"
                                    key={item.id}
                                >
                                    <div>
                                        <h4>
                                            {item.user?.name || 'Unknown User'}
                                        </h4>

                                        <p>{item.user?.email || 'No email'}</p>

                                        <p className="admin-feedback-rating">
                                            {'★'.repeat(item.rating)}
                                            {'☆'.repeat(5 - item.rating)}
                                        </p>

                                        <p>{item.message}</p>

                                        <small>
                                            {new Date(item.created_at).toLocaleString()}
                                        </small>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deletingId === item.id}
                                    >
                                        {deletingId === item.id
                                            ? 'Deleting...'
                                            : 'Delete'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}

export default AdminDashboard