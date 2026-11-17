import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import api from './services/api'
import PlayerBackButton from './PlayerBackButton'
import './Leaderboard.css'

const formatNumber = value => Number(value || 0).toLocaleString()

function Leaderboard({ onBack }) {
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')
    const [currentUserRank, setCurrentUserRank] = useState(null)
    const [introComplete, setIntroComplete] = useState(false)
    const pageRef = useRef(null)

    useEffect(() => {
        fetchLeaderboard(true)
    }, [])

    useLayoutEffect(() => {
        if (!introComplete || !pageRef.current) return undefined

        let isActive = true
        let animationContext
        const tiltCleanups = []

        import('gsap')
            .then(({ gsap }) => {
                if (!isActive || !pageRef.current) return

                animationContext = gsap.context(() => {
                    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                        return
                    }

                    const intro = gsap.timeline({
                        defaults: { ease: 'power3.out' },
                    })

                    intro
                        .fromTo(
                            '.leaderboard-hero-copy',
                            { autoAlpha: 0, y: 20 },
                            { autoAlpha: 1, y: 0, duration: 0.48 }
                        )
                        .fromTo(
                            '.my-rank-card',
                            {
                                autoAlpha: 0,
                                y: 24,
                                rotationX: -7,
                                transformPerspective: 1100,
                            },
                            { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.55 },
                            '-=0.15'
                        )
                        .fromTo(
                            '.top-player-card',
                            { autoAlpha: 0, y: 30, rotationY: -10, scale: 0.94 },
                            {
                                autoAlpha: 1,
                                y: 0,
                                rotationY: 0,
                                scale: 1,
                                stagger: 0.1,
                                duration: 0.52,
                            },
                            '-=0.2'
                        )
                        .fromTo(
                            '.leaderboard-table-wrapper',
                            { autoAlpha: 0, y: 20 },
                            { autoAlpha: 1, y: 0, duration: 0.42 },
                            '-=0.15'
                        )

                    gsap.utils.toArray('.top-player-card').forEach(card => {
                        const tilt = event => {
                            if (event.pointerType === 'touch') return

                            const bounds = card.getBoundingClientRect()
                            if (!bounds.width || !bounds.height) return
                            const x = (event.clientX - bounds.left) / bounds.width - 0.5
                            const y = (event.clientY - bounds.top) / bounds.height - 0.5

                            gsap.to(card, {
                                rotationY: x * 7,
                                rotationX: y * -7,
                                transformPerspective: 1000,
                                duration: 0.3,
                                ease: 'power2.out',
                                overwrite: 'auto',
                            })
                        }
                        const reset = () => gsap.to(card, {
                            rotationX: 0,
                            rotationY: 0,
                            duration: 0.4,
                            ease: 'power2.out',
                            overwrite: 'auto',
                        })

                        card.addEventListener('pointermove', tilt)
                        card.addEventListener('pointerleave', reset)
                        tiltCleanups.push(() => {
                            card.removeEventListener('pointermove', tilt)
                            card.removeEventListener('pointerleave', reset)
                        })
                    })
                }, pageRef)
            })
            .catch(animationError => {
                console.error('Unable to load leaderboard animation:', animationError)
            })

        return () => {
            isActive = false
            tiltCleanups.forEach(cleanup => cleanup())
            animationContext?.revert()
        }
    }, [introComplete])

    async function fetchLeaderboard(showIntro = false) {
        const minimumIntro = showIntro
            ? new Promise(resolve => window.setTimeout(resolve, 1250))
            : null

        try {
            if (showIntro) {
                setLoading(true)
            } else {
                setRefreshing(true)
            }
            setError('')

            const token = localStorage.getItem('brainbuzz_token')
            const response = await api.get('/leaderboard', {
                headers: { Authorization: `Bearer ${token}` },
            })

            const data = response.data
            const leaderboard = Array.isArray(data)
                ? data
                : data.leaderboard || data.data || []

            setPlayers(leaderboard)
            setCurrentUserRank(data.current_user_rank ?? null)
        } catch (requestError) {
            console.error('Leaderboard error:', requestError)
            setError(
                requestError.response?.data?.message ||
                'Unable to load leaderboard. Please try again.'
            )
        } finally {
            if (minimumIntro) {
                await minimumIntro
                setIntroComplete(true)
            }
            setLoading(false)
            setRefreshing(false)
        }
    }

    const getRankIcon = rank => {
        if (rank === 1) return '🥇'
        if (rank === 2) return '🥈'
        if (rank === 3) return '🥉'
        return `#${rank}`
    }

    const topThree = players.slice(0, 3)
    const normalizedRank = currentUserRank === null
        ? null
        : Number(currentUserRank)
    const currentPlayer = normalizedRank === null
        ? null
        : players.find((player, index) =>
            (Number(player.rank) || index + 1) === normalizedRank
        )
    const podiumOrder = topThree.length === 3
        ? [topThree[1], topThree[0], topThree[2]]
        : topThree

    if (!introComplete) {
        return (
            <main className="leaderboard-splash" role="status" aria-label="Loading leaderboard">
                <div className="leaderboard-splash-card">
                    <div className="leaderboard-splash-mark" aria-hidden="true">
                        🧠<span>B</span>
                    </div>
                    <p className="leaderboard-splash-eyebrow">BRAINBUZZ ARCADE</p>
                    <h1>Loading the <span>champions</span></h1>
                    <p className="leaderboard-splash-copy">Finding your place on the leaderboard...</p>
                    <div className="leaderboard-splash-track" aria-hidden="true"><span /></div>
                    <p className="leaderboard-splash-status">✦ &nbsp; POWERING UP THE PODIUM</p>
                </div>
            </main>
        )
    }

    return (
        <main className="leaderboard-page" ref={pageRef}>
            <header className="leaderboard-header">
                <PlayerBackButton onClick={onBack} />

                <div className="leaderboard-hero-copy">
                    <span className="leaderboard-eyebrow">
                        <span className="leaderboard-live-dot" />
                        BRAINBUZZ CHAMPIONSHIP
                    </span>
                    <h1>Hall of <span>Legends</span></h1>
                    <p>Every great score tells a story. See how your journey ranks.</p>
                </div>

                <div className="leaderboard-season-chip">
                    <span aria-hidden="true">⚡</span> ALL-TIME RANKS
                </div>
            </header>

            {loading ? (
                <div className="leaderboard-state leaderboard-loading">
                    <span className="leaderboard-state-icon" aria-hidden="true">🏆</span>
                    <h2>Updating the arena</h2>
                    <p>Bringing the latest player scores together...</p>
                    <span className="leaderboard-state-spinner" aria-hidden="true" />
                </div>
            ) : error ? (
                <div className="leaderboard-state leaderboard-error" role="alert">
                    <span className="leaderboard-state-icon" aria-hidden="true">⚠️</span>
                    <h2>Leaderboard unavailable</h2>
                    <p>{error}</p>
                    <button type="button" onClick={() => fetchLeaderboard()}>
                        Try again <span aria-hidden="true">↻</span>
                    </button>
                </div>
            ) : players.length === 0 ? (
                <div className="leaderboard-state leaderboard-empty">
                    <span className="leaderboard-state-icon" aria-hidden="true">🕹️</span>
                    <p className="leaderboard-eyebrow">THE ARENA IS READY</p>
                    <h2>Be the first legend</h2>
                    <p>Start playing BrainBuzz and your name will appear here.</p>
                    <PlayerBackButton onClick={onBack} />
                </div>
            ) : (
                <>
                    <section className="my-rank-card" aria-label="Your leaderboard rank">
                        <div className="my-rank-copy">
                            <span className="my-rank-label">YOUR PLACE IN THE ARENA</span>
                            <h2>{normalizedRank ? `#${normalizedRank}` : 'UNRANKED'}</h2>
                            <p>
                                {normalizedRank
                                    ? 'Keep playing and climb to the top!'
                                    : 'Play a game to earn your first rank.'}
                            </p>
                            {currentPlayer && (
                                <span className="my-rank-player-name">
                                    <span className="rank-avatar">{(currentPlayer.name || 'P').charAt(0).toUpperCase()}</span>
                                    {currentPlayer.name || currentPlayer.username || 'Player'}
                                </span>
                            )}
                        </div>
                        <div className="my-rank-trophy" aria-hidden="true">
                            <span className="trophy-orbit trophy-orbit-one" />
                            <span className="trophy-orbit trophy-orbit-two" />
                            <span className="my-rank-icon">🏆</span>
                            <span className="trophy-spark trophy-spark-one">✦</span>
                            <span className="trophy-spark trophy-spark-two">✧</span>
                        </div>
                        <div className="my-rank-stats">
                            <div>
                                <span>YOUR SCORE</span>
                                <strong>{formatNumber(currentPlayer?.total_score ?? currentPlayer?.score)}</strong>
                            </div>
                            <div>
                                <span>PLAYED</span>
                                <strong>{formatNumber(currentPlayer?.games_played)}</strong>
                            </div>
                        </div>
                    </section>

                    <section className="top-three-section" aria-labelledby="leaderboard-podium-heading">
                        <div className="leaderboard-section-heading">
                            <div>
                                <span className="leaderboard-eyebrow">THE ELITE</span>
                                <h2 id="leaderboard-podium-heading">Champions podium</h2>
                            </div>
                            <span className="podium-season-label">TOP 3 PLAYERS</span>
                        </div>

                        <div className={`top-three-grid${topThree.length === 3 ? ' has-podium' : ''}`}>
                            {podiumOrder.map(player => {
                                const rank = Number(player.rank) || players.indexOf(player) + 1
                                const name = player.name || player.username || 'Player'

                                return (
                                    <article
                                        key={player.id}
                                        className={`top-player-card rank-${rank}`}
                                    >
                                        <span className="podium-place">
                                            {rank === 1 ? 'CHAMPION' : rank === 2 ? 'RUNNER UP' : 'TOP PLAYER'}
                                        </span>
                                        <div className="top-player-medal" aria-label={`Rank ${rank}`}>
                                            {getRankIcon(rank)}
                                        </div>
                                        <div className="top-player-avatar" aria-hidden="true">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <h3 className="top-player-name">{name}</h3>
                                        <div className="top-player-score">
                                            {formatNumber(player.total_score ?? player.score)}
                                            <span> XP</span>
                                        </div>
                                        <div className="top-player-stats">
                                            <span>🎮 {formatNumber(player.games_played)} games</span>
                                            <span>🎯 {Number(player.accuracy ?? 0).toFixed(1)}% accuracy</span>
                                        </div>
                                        <div className="podium-base" aria-hidden="true">
                                            <strong>{String(rank).padStart(2, '0')}</strong>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    </section>

                    <section className="leaderboard-rankings-section">
                        <div className="leaderboard-section-heading rankings-heading">
                            <div>
                                <span className="leaderboard-eyebrow">THE FULL ARENA</span>
                                <h2>Player rankings</h2>
                            </div>
                            <span className="rankings-player-count">
                                <span /> {players.length} players
                            </span>
                        </div>

                        <div className="leaderboard-table-wrapper">
                            <table className="leaderboard-table">
                                <thead>
                                    <tr>
                                        <th scope="col">RANK</th>
                                        <th scope="col">PLAYER</th>
                                        <th scope="col">GAMES</th>
                                        <th scope="col">TOTAL XP</th>
                                        <th scope="col">ACCURACY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((player, index) => {
                                        const rank = Number(player.rank) || index + 1
                                        const isCurrentPlayer =
                                            normalizedRank !== null &&
                                            rank === normalizedRank
                                        const name = player.name || player.username || 'Player'

                                        return (
                                            <tr
                                                key={player.id || index}
                                                className={isCurrentPlayer ? 'current-player-row' : ''}
                                            >
                                                <td className="leaderboard-rank">
                                                    <span className={`rank-number${rank <= 3 ? ` is-top-${rank}` : ''}`}>
                                                        {getRankIcon(rank)}
                                                    </span>
                                                </td>
                                                <td className="leaderboard-player">
                                                    <span className="leaderboard-row-avatar" aria-hidden="true">
                                                        {name.charAt(0).toUpperCase()}
                                                    </span>
                                                    <span className="leaderboard-row-name">{name}</span>
                                                    {isCurrentPlayer && <span className="you-badge">YOU</span>}
                                                </td>
                                                <td>{formatNumber(player.games_played)}</td>
                                                <td className="leaderboard-score">
                                                    {formatNumber(player.total_score ?? player.score)}
                                                </td>
                                                <td>
                                                    <span className="accuracy-value">
                                                        {Number(player.accuracy ?? 0).toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <footer className="leaderboard-refresh">
                        <p>Keep playing. Keep climbing. Your next high score is waiting.</p>
                        <button
                            type="button"
                            onClick={() => fetchLeaderboard()}
                            disabled={refreshing}
                        >
                            <span className={refreshing ? 'refresh-spinning' : ''} aria-hidden="true">↻</span>
                            {refreshing ? 'Refreshing scores...' : 'Refresh leaderboard'}
                        </button>
                    </footer>
                </>
            )}
        </main>
    )
}

export default Leaderboard
