import './Leaderboard.css'
import { useEffect, useState } from 'react'
import api from './services/api'

function Leaderboard({ onBack }) {
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    const fetchLeaderboard = async () => {
        try {
            setLoading(true)
            setError('')

            const token = localStorage.getItem('brainbuzz_token')

            const response = await api.get('/leaderboard', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = response.data

            setPlayers(
                Array.isArray(data)
                    ? data
                    : data.leaderboard || data.data || []
            )
        } catch (err) {
            console.error('Leaderboard error:', err)
            setError(
                err.response?.data?.message ||
                'Unable to load leaderboard. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }

    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇'
        if (rank === 2) return '🥈'
        if (rank === 3) return '🥉'
        return `#${rank}`
    }

    return (
        <div className="leaderboard-page">
            <div className="leaderboard-header">
                <button
                    className="back-btn"
                    onClick={onBack}
                >
                    ← Back
                </button>

                <h1>🏆 Leaderboard</h1>
                <p>See how you rank against other BrainBuzz players!</p>
            </div>

            {loading ? (
                <div className="leaderboard-loading">
                    Loading leaderboard...
                </div>
            ) : error ? (
                <div className="leaderboard-error">
                    <p>{error}</p>
                    <button onClick={fetchLeaderboard}>
                        Try Again
                    </button>
                </div>
            ) : players.length === 0 ? (
                <div className="leaderboard-empty">
                    <h3>No Players Yet!</h3>
                    <p>Start playing games to appear on the leaderboard.</p>
                </div>
            ) : (
                <div className="leaderboard-table-wrapper">
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Games Played</th>
                                <th>Total Score</th>
                                <th>Accuracy</th>
                            </tr>
                        </thead>

                        <tbody>
                            {players.map((player, index) => {
                                const rank = index + 1

                                return (
                                    <tr key={player.id || index}>
                                        <td className="leaderboard-rank">
                                            {getRankIcon(rank)}
                                        </td>

                                        <td className="leaderboard-player">
                                            {player.name ||
                                                player.username ||
                                                'Player'}
                                        </td>

                                        <td>
                                            {player.games_played ?? 0}
                                        </td>

                                        <td className="leaderboard-score">
                                            {player.total_score ??
                                                player.score ??
                                                0}
                                        </td>

                                        <td>
                                            {Number(
                                                player.accuracy ?? 0
                                            ).toFixed(1)}%
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default Leaderboard
