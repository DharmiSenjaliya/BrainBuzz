
import { useEffect, useState } from 'react'
import api from './services/api'
import './Achievements.css'

function Achievements({ onBack }) {
    const [achievements, setAchievements] = useState([])
    const [earnedCount, setEarnedCount] = useState(0)
    const [totalAchievements, setTotalAchievements] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchAchievements()
    }, [])

    const fetchAchievements = async () => {
        try {
            setLoading(true)
            setError('')

            const token = localStorage.getItem('brainbuzz_token')

            const response = await api.get('/achievements', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = response.data

            const achievementList = Array.isArray(data)
                ? data
                : data.achievements || data.data || []

            setAchievements(achievementList)
            setEarnedCount(
                data.earned_count ??
                achievementList.filter(item => item.earned).length
            )
            setTotalAchievements(
                data.total_achievements ?? achievementList.length
            )
        } catch (err) {
            console.error('Achievements error:', err)
            setError(
                err.response?.data?.message ||
                'Unable to load achievements. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="achievements-page">
            <div className="achievements-header">
                <button
                    className="achievements-back-btn"
                    onClick={onBack}
                >
                    ← Back
                </button>

                <h1>My Achievements</h1>
                <p>Celebrate your BrainBuzz milestones!</p>
            </div>

            {loading ? (
                <div className="achievements-message">
                    Loading achievements...
                </div>
            ) : error ? (
                <div className="achievements-message achievements-error">
                    <p>{error}</p>
                    <button onClick={fetchAchievements}>
                        Try Again
                    </button>
                </div>
            ) : (
                <>
                    <div className="achievements-summary">
                        <div>
                            <span className="summary-number">
                                {earnedCount}/{totalAchievements}
                            </span>
                            <span className="summary-label">
                                Achievements Earned
                            </span>
                        </div>

                        <div className="summary-progress-track">
                            <div
                                className="summary-progress-fill"
                                style={{
                                    width: `${
                                        totalAchievements > 0
                                            ? (earnedCount / totalAchievements) * 100
                                            : 0
                                    }%`,
                                }}
                            />
                        </div>
                    </div>

                    {achievements.length === 0 ? (
                        <div className="achievements-message">
                            <div className="achievements-empty-icon">🏆</div>
                            <h3>No Achievements Yet</h3>
                            <p>Keep playing games to earn your first badge!</p>
                        </div>
                    ) : (
                        <div className="achievements-grid">
                            {achievements.map((item, index) => {
                                const earned =
                                    item.earned ??
                                    item.is_earned ??
                                    item.unlocked ??
                                    false

                                const target = Number(item.target || 1)
                                const progress = Math.min(
                                    Number(item.progress || 0),
                                    target
                                )

                                const percentage = target > 0
                                    ? Math.min((progress / target) * 100, 100)
                                    : 0

                                return (
                                    <div
                                        className={`achievement-card ${
                                            earned ? 'earned' : 'locked'
                                        }`}
                                        key={item.id || index}
                                    >
                                        <div className="achievement-icon">
                                            {item.icon || item.emoji || '🏆'}
                                        </div>

                                        <h3>
                                            {item.name || item.title || 'Achievement'}
                                        </h3>

                                        <p>
                                            {item.description ||
                                                'Keep playing to achieve this milestone.'}
                                        </p>

                                        <div className="achievement-progress-info">
                                            <span>Progress</span>
                                            <strong>
                                                {progress}/{target}
                                            </strong>
                                        </div>

                                        <div className="achievement-progress-track">
                                            <div
                                                className="achievement-progress-fill"
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            />
                                        </div>

                                        <span className="achievement-status">
                                            {earned ? '✓ Earned' : '🔒 Locked'}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default Achievements
