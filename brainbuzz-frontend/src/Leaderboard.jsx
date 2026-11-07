
import './Leaderboard.css'
import { useEffect, useState } from 'react'
import api from './services/api'

function Leaderboard({ onBack }) {
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentUserRank, setCurrentUserRank] = useState(null)

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

            const leaderboard = Array.isArray(data)
                ? data
                : data.leaderboard || data.data || []

            setPlayers(leaderboard)
            setCurrentUserRank(data.current_user_rank ?? null)

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

    const topThree = players.slice(0, 3)

    return (
        <div className="leaderboard-page">

            {/* Header */}
            <div className="leaderboard-header">

                <button
                    className="back-btn"
                    onClick={onBack}
                >
                    ← Back
                </button>

                <h1>🏆 Leaderboard</h1>

                <p>
                    See how you rank against other BrainBuzz players!
                </p>

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
                    <p>
                        Start playing games to appear on the leaderboard.
                    </p>
                </div>

            ) : (

                <>

                    {/* Current Player Rank */}
                    <div className="my-rank-card">
                        <div>
                            <span className="my-rank-label">
                                Your Current Rank
                            </span>

                            <h2>
                                {currentUserRank
                                    ? `#${currentUserRank}`
                                    : 'Not Ranked'}
                            </h2>
                        </div>

                        <div className="my-rank-icon">
                            🏆
                        </div>
                    </div>


                    {/* Top 3 Players */}
                    <div className="top-three-section">

                        <h2>🏆 Top Players</h2>

                        <div className="top-three-grid">

                            {topThree.map((player, index) => {

                                const rank = index + 1

                                return (

                                    <div
                                        key={player.id}
                                        className={`top-player-card rank-${rank}`}
                                    >

                                        <div className="top-player-medal">
                                            {getRankIcon(rank)}
                                        </div>

                                        <div className="top-player-name">
                                            {player.name || 'Player'}
                                        </div>

                                        <div className="top-player-score">
                                            {player.total_score ?? 0}
                                            <span> Points</span>
                                        </div>

                                        <div className="top-player-games">
                                            {player.games_played ?? 0} Games Played
                                        </div>

                                        <div className="top-player-accuracy">
                                            {Number(
                                                player.accuracy ?? 0
                                            ).toFixed(1)}% Accuracy
                                        </div>

                                    </div>

                                )
                            })}

                        </div>

                    </div>


                    {/* Complete Leaderboard */}
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

                                    const rank = player.rank ?? index + 1

                                    const isCurrentPlayer =
                                        currentUserRank !== null &&
                                        rank === currentUserRank

                                    return (

                                        <tr
                                            key={player.id || index}
                                            className={
                                                isCurrentPlayer
                                                    ? 'current-player-row'
                                                    : ''
                                            }
                                        >

                                            <td className="leaderboard-rank">
                                                {getRankIcon(rank)}
                                            </td>

                                            <td className="leaderboard-player">

                                                {player.name ||
                                                    player.username ||
                                                    'Player'}

                                                {isCurrentPlayer && (
                                                    <span className="you-badge">
                                                        YOU
                                                    </span>
                                                )}

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

                    {/* Refresh Button */}
                    <div className="leaderboard-refresh">

                        <button onClick={fetchLeaderboard}>
                            ↻ Refresh Leaderboard
                        </button>

                    </div>

                </>

            )}

        </div>
    )
}

export default Leaderboard
