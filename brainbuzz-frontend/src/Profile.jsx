
import { useEffect, useState } from 'react'
import './Profile.css'
import api from './services/api'

function Profile({ user, onBack, onEditProfile, onChangePassword }) {
    const [stats, setStats] = useState({
        games_played: 0,
        total_score: 0,
        total_correct: 0,
        total_wrong: 0,
        accuracy: 0,
    })

    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const name = user?.name || user?.username || 'Player'
    const email = user?.email || 'Email not available'
    const phone = user?.phone || 'Not added'
    const image = user?.profile_image || user?.avatar || user?.profile_photo

    const imageUrl = image
        ? image.startsWith('http')
            ? image
            : `http://127.0.0.1:8000/storage/${image.replace(/^\/?storage\//, '')}`
        : null

    const fetchProfileData = async () => {
        try {
            setLoading(true)
            setError('')

            const token = localStorage.getItem('brainbuzz_token')

            const headers = {
                Authorization: `Bearer ${token}`,
            }

            const [dashboardResponse, historyResponse] = await Promise.all([
                api.get('/dashboard', { headers }),
                api.get('/game-history', { headers }),
            ])

            if (dashboardResponse.data.success) {
                setStats(dashboardResponse.data.stats)
            }

            if (historyResponse.data.success) {
                setHistory(historyResponse.data.results || [])
            }
        } catch (error) {
            console.error('Profile Data Error:', error)
            setError(
                error.response?.data?.message ||
                'Unable to load profile data.'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfileData()
    }, [])

    return (
        <div className="profile-page">

            <div className="profile-header">
                <button className="profile-back-btn" onClick={onBack}>
                    ← Back to Dashboard
                </button>

                <h1>My Profile</h1>
                <p>Manage your account and track your BrainBuzz journey.</p>
            </div>

            <div className="profile-card">

                <div className="profile-avatar">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Profile" />
                    ) : (
                        name.charAt(0).toUpperCase()
                    )}
                </div>

                <h2>{name}</h2>
                <p className="profile-email">{email}</p>

                <div className="profile-details">
                    <div className="profile-detail-item">
                        <span>Email Address</span>
                        <strong>{email}</strong>
                    </div>

                    <div className="profile-detail-item">
                        <span>Phone Number</span>
                        <strong>{phone}</strong>
                    </div>
                </div>

                <div className="profile-actions">
                    <button
                        className="profile-edit-btn"
                        onClick={onEditProfile}
                    >
                        ✏️ Edit Profile
                    </button>

                    <button
                        className="profile-password-btn"
                        onClick={onChangePassword}
                    >
                        🔒 Change Password
                    </button>
                </div>
            </div>

            <section className="profile-stats-section">
                <h2>My Game Statistics</h2>

                {loading ? (
                    <p>Loading statistics...</p>
                ) : error ? (
                    <p className="profile-error">{error}</p>
                ) : (
                    <div className="profile-stats-grid">

                        <div className="profile-stat-card">
                            <span>🎮</span>
                            <h3>{stats.games_played}</h3>
                            <p>Games Played</p>
                        </div>

                        <div className="profile-stat-card">
                            <span>🏆</span>
                            <h3>{stats.total_score}</h3>
                            <p>Total Score</p>
                        </div>

                        <div className="profile-stat-card">
                            <span>✅</span>
                            <h3>{stats.total_correct}</h3>
                            <p>Correct Answers</p>
                        </div>

                        <div className="profile-stat-card">
                            <span>❌</span>
                            <h3>{stats.total_wrong}</h3>
                            <p>Wrong Answers</p>
                        </div>

                        <div className="profile-stat-card">
                            <span>🎯</span>
                            <h3>{stats.accuracy}%</h3>
                            <p>Accuracy</p>
                        </div>

                    </div>
                )}
            </section>

            <section className="game-history-section">

                <div className="game-history-header">
                    <h2>My Game History</h2>

                    <button onClick={fetchProfileData} disabled={loading}>
                        {loading ? 'Loading...' : '↻ Refresh'}
                    </button>
                </div>

                {loading ? (
                    <p>Loading game history...</p>
                ) : error ? (
                    <p className="profile-error">{error}</p>
                ) : history.length === 0 ? (
                    <div className="no-game-history">
                        <span>🎮</span>
                        <h3>No Games Played Yet</h3>
                        <p>
                            Start playing BrainBuzz to see your game history here.
                        </p>
                    </div>
                ) : (
                    <div className="game-history-list">

                        {history.map((game) => (
                            <div className="game-history-card" key={game.id}>

                                <div className="game-history-info">
                                    <h3>Level {game.level}</h3>
                                    <p>
                                        {new Date(game.created_at).toLocaleString()}
                                    </p>
                                </div>

                                <div className="game-history-score">
                                    <strong>{game.score} Points</strong>
                                    <span>
                                        {game.correct_answers} Correct / {game.wrong_answers} Wrong
                                    </span>
                                </div>

                                <div className="game-history-status">
                                    <span className={game.passed ? 'game-passed' : 'game-failed'}>
                                        {game.passed ? 'Passed' : 'Failed'}
                                    </span>
                                </div>

                            </div>
                        ))}

                    </div>
                )}

            </section>

        </div>
    )
}

export default Profile
