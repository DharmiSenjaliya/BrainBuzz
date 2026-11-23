import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './Profile.css'
import api, { getStorageUrl } from './services/api'
import PlayerBackButton from './PlayerBackButton'

const initialStats = {
    games_played: 0,
    total_score: 0,
    total_correct: 0,
    total_wrong: 0,
    accuracy: 0,
}

const formatNumber = value => Number(value || 0).toLocaleString()

const formatGameDate = value => {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? 'Date unavailable'
        : date.toLocaleString()
}

function Profile({ user, onBack, onEditProfile, onChangePassword }) {
    const [stats, setStats] = useState(initialStats)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')
    const pageRef = useRef(null)

    const name = user?.name || user?.username || 'Player'
    const email = user?.email || 'Email not available'
    const phone = user?.phone || 'Not added'
    const image = user?.profile_image || user?.avatar || user?.profile_photo
    const imageUrl = image ? getStorageUrl(image) : null
    const accuracy = Math.max(0, Math.min(Number(stats.accuracy || 0), 100))

    const requestProfileData = useCallback(async () => {
        const token = localStorage.getItem('brainbuzz_token')
        const headers = { Authorization: `Bearer ${token}` }
        const [dashboardResponse, historyResponse] = await Promise.all([
            api.get('/dashboard', { headers }),
            api.get('/game-history', { headers }),
        ])

        return {
            stats: dashboardResponse.data.success
                ? dashboardResponse.data.stats
                : null,
            history: historyResponse.data.success
                ? historyResponse.data.results || []
                : null,
        }
    }, [])

    const fetchProfileData = useCallback(async ({ silent = false } = {}) => {
        try {
            if (silent) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }
            setError('')

            const result = await requestProfileData()
            if (result.stats) setStats(result.stats)
            if (result.history) setHistory(result.history)
        } catch (requestError) {
            console.error('Profile Data Error:', requestError)
            setError(
                requestError.response?.data?.message ||
                'Unable to load profile data.'
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [requestProfileData])

    useEffect(() => {
        let isActive = true

        requestProfileData()
            .then(result => {
                if (!isActive) return
                if (result.stats) setStats(result.stats)
                if (result.history) setHistory(result.history)
            })
            .catch(requestError => {
                if (!isActive) return
                console.error('Profile Data Error:', requestError)
                setError(
                    requestError.response?.data?.message ||
                    'Unable to load profile data.'
                )
            })
            .finally(() => {
                if (isActive) setLoading(false)
            })

        return () => {
            isActive = false
        }
    }, [requestProfileData])

    useLayoutEffect(() => {
        if (loading || error || !pageRef.current) return undefined
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return undefined
        }

        let isActive = true
        let animationContext

        import('gsap')
            .then(({ gsap }) => {
                if (!isActive || !pageRef.current) return

                animationContext = gsap.context(() => {
                    gsap.timeline({ defaults: { ease: 'power3.out' } })
                        .fromTo(
                            '.profile-hero-copy',
                            { autoAlpha: 0, y: 20 },
                            { autoAlpha: 1, y: 0, duration: 0.45 }
                        )
                        .fromTo(
                            '.profile-card',
                            {
                                autoAlpha: 0,
                                y: 24,
                                rotationX: -5,
                                transformPerspective: 1100,
                            },
                            { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.52 },
                            '-=0.16'
                        )
                        .fromTo(
                            '.profile-stat-card',
                            { autoAlpha: 0, y: 18, scale: 0.96 },
                            {
                                autoAlpha: 1,
                                y: 0,
                                scale: 1,
                                stagger: 0.07,
                                duration: 0.4,
                            },
                            '-=0.15'
                        )
                        .fromTo(
                            '.game-history-card',
                            { autoAlpha: 0, x: -14 },
                            {
                                autoAlpha: 1,
                                x: 0,
                                stagger: 0.06,
                                duration: 0.35,
                            },
                            '-=0.12'
                        )
                }, pageRef)
            })
            .catch(animationError => {
                console.error('Unable to load profile animation:', animationError)
            })

        return () => {
            isActive = false
            animationContext?.revert()
        }
    }, [loading, error, history.length])

    const statItems = [
        {
            label: 'Games played',
            value: formatNumber(stats.games_played),
            icon: '🎮',
            accent: 'violet',
        },
        {
            label: 'Total score',
            value: formatNumber(stats.total_score),
            icon: '🏆',
            accent: 'gold',
        },
        {
            label: 'Correct answers',
            value: formatNumber(stats.total_correct),
            icon: '✅',
            accent: 'mint',
        },
        {
            label: 'Wrong answers',
            value: formatNumber(stats.total_wrong),
            icon: '🧩',
            accent: 'pink',
        },
        {
            label: 'Accuracy',
            value: `${accuracy.toFixed(1)}%`,
            icon: '🎯',
            accent: 'cyan',
        },
    ]

    return (
        <main className="profile-page" ref={pageRef}>
            <header className="profile-header">
                <PlayerBackButton onClick={onBack} />
                <div className="profile-hero-copy">
                    <span className="profile-eyebrow">
                        <span className="profile-live-dot" />
                        PLAYER CONTROL CENTER
                    </span>
                    <h1>Your profile, <span>your progress.</span></h1>
                    <p>Manage your player card and relive the games that brought you here.</p>
                </div>
                <span className="profile-hero-mark" aria-hidden="true">✦</span>
            </header>

            <section className="profile-card" aria-label="Player account">
                <div className="profile-card-backdrop" aria-hidden="true" />
                <div className="profile-identity">
                    <div className="profile-avatar">
                        {imageUrl ? (
                            <img src={imageUrl} alt={`${name}'s profile`} />
                        ) : (
                            name.charAt(0).toUpperCase()
                        )}
                        <span className="profile-avatar-status" title="Player profile" />
                    </div>

                    <div className="profile-identity-copy">
                        <span className="profile-player-tag">CLUESHIFT PLAYER</span>
                        <h2>{name}</h2>
                        <p className="profile-email">{email}</p>
                    </div>

                    <div className="profile-actions">
                        <button
                            className="profile-edit-btn"
                            type="button"
                            onClick={onEditProfile}
                        >
                            <span aria-hidden="true">✎</span> Edit profile
                        </button>
                        <button
                            className="profile-password-btn"
                            type="button"
                            onClick={onChangePassword}
                        >
                            <span aria-hidden="true">⌑</span> Change password
                        </button>
                    </div>
                </div>

                <div className="profile-details">
                    <div className="profile-detail-item">
                        <span><i aria-hidden="true">✉</i> Email address</span>
                        <strong>{email}</strong>
                    </div>
                    <div className="profile-detail-item">
                        <span><i aria-hidden="true">☎</i> Phone number</span>
                        <strong>{phone}</strong>
                    </div>
                    <div className="profile-account-chip">
                        <span /> PLAYER ACCOUNT
                    </div>
                </div>
            </section>

            <section className="profile-stats-section" aria-labelledby="profile-stats-heading">
                <div className="profile-section-heading">
                    <div>
                        <span className="profile-section-kicker">YOUR GAMEPLAY</span>
                        <h2 id="profile-stats-heading">Player statistics</h2>
                    </div>
                    {loading && <span className="profile-section-loading">SYNCING...</span>}
                </div>

                {loading ? (
                    <div className="profile-section-state" role="status">
                        <span className="profile-state-spinner" aria-hidden="true" />
                        Loading your stats...
                    </div>
                ) : error ? (
                    <div className="profile-section-state profile-error" role="alert">
                        {error}
                    </div>
                ) : (
                    <div className="profile-stats-grid">
                        {statItems.map(item => (
                            <article
                                className={`profile-stat-card profile-stat-${item.accent}`}
                                key={item.label}
                            >
                                <span className="profile-stat-icon" aria-hidden="true">{item.icon}</span>
                                <span className="profile-stat-label">{item.label}</span>
                                <strong>{item.value}</strong>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="game-history-section" aria-labelledby="game-history-heading">
                <div className="game-history-header">
                    <div>
                        <span className="profile-section-kicker">YOUR RECENT RUNS</span>
                        <h2 id="game-history-heading">Game history</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => fetchProfileData({ silent: true })}
                        disabled={loading || refreshing}
                    >
                        <span className={refreshing ? 'profile-refresh-spinning' : ''} aria-hidden="true">↻</span>
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {loading ? (
                    <div className="profile-section-state" role="status">
                        <span className="profile-state-spinner" aria-hidden="true" />
                        Loading your game history...
                    </div>
                ) : error ? (
                    <div className="profile-section-state profile-error" role="alert">
                        <span>{error}</span>
                        <button type="button" onClick={() => fetchProfileData()}>
                            Try again
                        </button>
                    </div>
                ) : history.length === 0 ? (
                    <div className="no-game-history">
                        <span className="no-history-icon" aria-hidden="true">🕹️</span>
                        <span className="profile-section-kicker">YOUR FIRST RUN IS WAITING</span>
                        <h3>No games played yet</h3>
                        <p>Start playing ClueShift and your game sessions will appear here.</p>
                    </div>
                ) : (
                    <div className="game-history-list">
                        {history.map((game, index) => (
                            <article className="game-history-card" key={game.id || `${game.created_at}-${index}`}>
                                <div className="game-history-level">
                                    <span className="game-history-game-icon" aria-hidden="true">🎮</span>
                                    <span>
                                        <small>CHALLENGE</small>
                                        <strong>Level {game.level}</strong>
                                    </span>
                                </div>

                                <div className="game-history-info">
                                    <span className="game-history-date-label">PLAYED ON</span>
                                    <p>{formatGameDate(game.created_at)}</p>
                                </div>

                                <div className="game-history-score">
                                    <strong>{formatNumber(game.score)} <span>PTS</span></strong>
                                    <span className="game-history-answer-counts">
                                        <i>{game.correct_answers} correct</i>
                                        <i>{game.wrong_answers} wrong</i>
                                    </span>
                                </div>

                                <div className="game-history-status">
                                    <span className={game.passed ? 'game-passed' : 'game-failed'}>
                                        <i aria-hidden="true">{game.passed ? '✓' : '↻'}</i>
                                        {game.passed ? 'Passed' : 'Try again'}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}

export default Profile
