import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import api from './services/api'
import './DailyMiniGames.css'

const formatDate = (date) => {
    if (!date) return ''

    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
    })
}

function DailyMiniGames({ onBack }) {
    const [challenge, setChallenge] = useState(null)
    const [streak, setStreak] = useState({})
    const [answers, setAnswers] = useState({})
    const [result, setResult] = useState(null)
    const [history, setHistory] = useState([])
    const [summary, setSummary] = useState({})
    const [currentPage, setCurrentPage] = useState(1)
const [lastPage, setLastPage] = useState(1)
    const [timeLeft, setTimeLeft] = useState(0)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [view, setView] = useState('game')
    const [startedAt, setStartedAt] = useState(null)
    const [initialLoadComplete, setInitialLoadComplete] = useState(false)
    const [gsap, setGsap] = useState(null)
    const splashRef = useRef(null)
    const gameSceneRef = useRef(null)

    useEffect(() => {
        loadGame(true)
    }, [])

    useEffect(() => {
        let isMounted = true

        import('gsap').then(({ gsap: loadedGsap }) => {
            if (isMounted) {
                setGsap(loadedGsap)
            }
        })

        return () => {
            isMounted = false
        }
    }, [])

    useLayoutEffect(() => {
        if (!gsap || initialLoadComplete || !splashRef.current) return

        const motion = gsap.matchMedia()
        const context = gsap.context(() => {
            motion.add('(prefers-reduced-motion: no-preference)', () => {
                const timeline = gsap.timeline({
                    defaults: { ease: 'power3.out' },
                })

                timeline
                    .fromTo(
                        '.mini-splash-mark',
                        {
                            autoAlpha: 0,
                            scale: 0.45,
                            rotationX: 24,
                            rotationY: -150,
                            z: -100,
                        },
                        {
                            autoAlpha: 1,
                            scale: 1,
                            rotationX: 0,
                            rotationY: 0,
                            z: 0,
                            duration: 1.05,
                        }
                    )
                    .fromTo(
                        '.mini-splash-wordmark',
                        { autoAlpha: 0, y: 18, letterSpacing: '12px' },
                        {
                            autoAlpha: 1,
                            y: 0,
                            letterSpacing: '1px',
                            duration: 0.65,
                        },
                        '-=0.35'
                    )
                    .fromTo(
                        '.mini-splash-copy',
                        { autoAlpha: 0, y: 12 },
                        { autoAlpha: 1, y: 0, duration: 0.55 },
                        '-=0.2'
                    )
                    .fromTo(
                        '.mini-splash-loader',
                        { autoAlpha: 0, scaleX: 0.75 },
                        { autoAlpha: 1, scaleX: 1, duration: 0.4 },
                        '-=0.1'
                    )

                gsap.to('.mini-splash-ring', {
                    rotationY: 360,
                    rotationZ: 18,
                    duration: 5,
                    ease: 'none',
                    repeat: -1,
                })

                gsap.to('.mini-splash-mark', {
                    y: -8,
                    duration: 1.2,
                    ease: 'sine.inOut',
                    yoyo: true,
                    repeat: -1,
                })

                gsap.fromTo(
                    '.mini-splash-particle',
                    { autoAlpha: 0.2, scale: 0.55, y: 14 },
                    {
                        autoAlpha: 1,
                        scale: 1,
                        y: -14,
                        duration: 1.1,
                        ease: 'sine.inOut',
                        stagger: 0.18,
                        yoyo: true,
                        repeat: -1,
                    }
                )
            })
        }, splashRef.current)

        return () => {
            motion.revert()
            context.revert()
        }
    }, [gsap, initialLoadComplete])

    useEffect(() => {
        if (
            !initialLoadComplete ||
            loading ||
            !challenge ||
            challenge.is_completed ||
            result ||
            timeLeft <= 0
        ) {
            return
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1))
        }, 1000)

        return () => clearInterval(timer)
    }, [challenge, initialLoadComplete, loading, result, timeLeft])

    useLayoutEffect(() => {
        if (!gsap || !initialLoadComplete || loading || !gameSceneRef.current) return

        const motion = gsap.matchMedia()
        const cardCleanups = []
        const context = gsap.context(() => {
            motion.add('(prefers-reduced-motion: no-preference)', () => {
                const timeline = gsap.timeline({
                    defaults: { ease: 'power3.out' },
                })

                if (view === 'history') {
                    timeline
                        .fromTo(
                            '.mini-history-heading',
                            { autoAlpha: 0, y: 20 },
                            { autoAlpha: 1, y: 0, duration: 0.45 }
                        )
                        .fromTo(
                            '.mini-player-panel > .mini-player-stats',
                            { autoAlpha: 0, y: 22 },
                            { autoAlpha: 1, y: 0, duration: 0.45 },
                            '-=0.2'
                        )
                        .fromTo(
                            '.mini-history-card, .mini-history-empty',
                            { autoAlpha: 0, y: 18, rotateX: -5 },
                            {
                                autoAlpha: 1,
                                y: 0,
                                rotateX: 0,
                                duration: 0.45,
                                stagger: 0.08,
                            },
                            '-=0.15'
                        )
                } else {
                    timeline
                        .fromTo(
                            '.mini-player-header',
                            { autoAlpha: 0, y: -18 },
                            { autoAlpha: 1, y: 0, duration: 0.45 }
                        )
                        .fromTo(
                            '.mini-player-stats > .mini-stat-card',
                            { autoAlpha: 0, y: 22, rotationY: -10, scale: 0.94 },
                            {
                                autoAlpha: 1,
                                y: 0,
                                rotationY: 0,
                                scale: 1,
                                duration: 0.48,
                                stagger: 0.08,
                            },
                            '-=0.15'
                        )
                        .fromTo(
                            '.mini-player-panel',
                            {
                                autoAlpha: 0,
                                y: 30,
                                rotationX: -5,
                                transformPerspective: 1100,
                            },
                            {
                                autoAlpha: 1,
                                y: 0,
                                rotationX: 0,
                                duration: 0.55,
                            },
                            '-=0.18'
                        )
                        .fromTo(
                            '.mini-player-question',
                            {
                                autoAlpha: 0,
                                y: 24,
                                rotationX: -7,
                                scale: 0.97,
                                transformPerspective: 900,
                            },
                            {
                                autoAlpha: 1,
                                y: 0,
                                rotationX: 0,
                                scale: 1,
                                duration: 0.5,
                                stagger: 0.09,
                            },
                            '-=0.2'
                        )
                        .fromTo(
                            '.mini-result-icon, .mini-submit-btn',
                            { autoAlpha: 0, scale: 0.86, y: 12 },
                            {
                                autoAlpha: 1,
                                scale: 1,
                                y: 0,
                                duration: 0.5,
                                stagger: 0.12,
                            },
                            '-=0.2'
                        )
                }

                gsap.utils.toArray('.mini-player-question').forEach(card => {
                    const tiltCard = event => {
                        if (event.pointerType === 'touch') return

                        const bounds = card.getBoundingClientRect()
                        if (!bounds.width || !bounds.height) return

                        const x = (event.clientX - bounds.left) / bounds.width - 0.5
                        const y = (event.clientY - bounds.top) / bounds.height - 0.5

                        gsap.to(card, {
                            rotationY: x * 5,
                            rotationX: y * -5,
                            transformPerspective: 900,
                            duration: 0.3,
                            ease: 'power2.out',
                            overwrite: 'auto',
                        })
                    }
                    const resetCard = () => {
                        gsap.to(card, {
                            rotationY: 0,
                            rotationX: 0,
                            duration: 0.45,
                            ease: 'power2.out',
                            overwrite: 'auto',
                        })
                    }

                    card.addEventListener('pointermove', tiltCard)
                    card.addEventListener('pointerleave', resetCard)
                    cardCleanups.push(() => {
                        card.removeEventListener('pointermove', tiltCard)
                        card.removeEventListener('pointerleave', resetCard)
                    })
                })

                if (result) {
                    gsap.fromTo(
                        '.mini-result h1',
                        { scale: 0.8, autoAlpha: 0 },
                        {
                            scale: 1,
                            autoAlpha: 1,
                            duration: 0.65,
                            ease: 'back.out(1.7)',
                            delay: 0.35,
                        }
                    )
                }
            })
        }, gameSceneRef.current)

        return () => {
            cardCleanups.forEach(cleanup => cleanup())
            motion.revert()
            context.revert()
        }
    }, [gsap, initialLoadComplete, loading, view, challenge?.id, result])

    async function loadGame(opening = false) {
        const minimumSplashTime = opening
            ? new Promise(resolve => window.setTimeout(resolve, 1650))
            : null
        let openedGame = null

        try {
            setLoading(true)
            setError('')

            const response = await api.get('/daily-mini-game')
            const game = response.data.challenge
            openedGame = game

            setChallenge(game)
            setStreak(response.data.streak || {})
            setTimeLeft(game.duration_seconds || 300)

            if (game.is_completed) {
                setResult(game.attempt)
            } else {
                setStartedAt(opening ? null : Date.now())
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Daily Mini Game is not available today.'
            )
        } finally {
            if (minimumSplashTime) {
                await minimumSplashTime
                if (openedGame && !openedGame.is_completed) {
                    setStartedAt(Date.now())
                }
                setInitialLoadComplete(true)
            }
            setLoading(false)
        }
    }

    const updateAnswer = (itemId, value) => {
        setAnswers(prev => ({
            ...prev,
            [itemId]: value
        }))
    }

    const submitGame = async () => {
        if (!challenge || submitting || result) return

        const unanswered = challenge.items.filter(
            item => !String(answers[item.id] || '').trim()
        )

        if (unanswered.length > 0 && timeLeft > 0) {
            setError(`Please answer all ${challenge.items.length} questions.`)
            return
        }

        try {
            setSubmitting(true)
            setError('')

            const duration = startedAt
                ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
                : 0

            const response = await api.post('/daily-mini-game/submit', {
                challenge_id: challenge.id,
                duration_seconds: duration,
                answers: challenge.items.map(item => ({
                    item_id: String(item.id),
                    answer: answers[item.id] || ''
                }))
            })

            setResult(response.data.result)
            setStreak(response.data.streak || {})
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to submit game. Please try again.'
            )
        } finally {
            setSubmitting(false)
        }
    }

    const loadHistory = async (page = 1) => {
    try {
        setLoading(true)
        setError('')

        const response = await api.get(
            `/daily-mini-game/history?page=${page}`
        )

        const historyData = response.data.history

        setHistory(historyData?.data || [])
        setSummary(response.data.summary || {})
        setCurrentPage(historyData?.current_page || 1)
        setLastPage(historyData?.last_page || 1)

        setView('history')
    } catch {
        setError('Unable to load game history.')
    } finally {
        setLoading(false)
    }
}

    const formatTime = seconds => {
        const minutes = Math.floor(seconds / 60)
        const remaining = seconds % 60

        return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
    }

    const totalQuestions = challenge?.items?.length || 0
    const answeredQuestions = challenge?.items?.filter(
        item => String(answers[item.id] || '').trim()
    ).length || 0
    const gameProgress = totalQuestions
        ? Math.round((answeredQuestions / totalQuestions) * 100)
        : 0

    if (!initialLoadComplete) {
        return (
            <div className="mini-game-splash" ref={splashRef} role="status">
                <div className="mini-splash-stars" aria-hidden="true">
                    <span className="mini-splash-particle">✦</span>
                    <span className="mini-splash-particle">✧</span>
                    <span className="mini-splash-particle">✦</span>
                    <span className="mini-splash-particle">✧</span>
                </div>

                <div className="mini-splash-card">
                    <div className="mini-splash-stage" aria-hidden="true">
                        <div className="mini-splash-glow" />
                        <div className="mini-splash-ring" />
                        <div className="mini-splash-mark">🧠</div>
                        <span className="mini-splash-orbit-dot" />
                    </div>

                    <div className="mini-splash-brand">
                        <span className="mini-splash-eyebrow">WELCOME TO THE DAILY ARCADE</span>
                        <h1 className="mini-splash-wordmark">
                            BRAIN<span>BUZZ</span>
                        </h1>
                        <p className="mini-splash-copy">
                            Your next brain-powered challenge is loading.
                        </p>
                    </div>

                    <div className="mini-splash-loader" aria-hidden="true">
                        <span />
                    </div>
                    <p className="mini-splash-status">
                        <span className="mini-splash-status-dot" />
                        POWERING UP YOUR GAME
                    </p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="mini-player-page mini-loading-page">
                <div className="mini-inline-loader" role="status">
                    <span className="mini-inline-spinner" aria-hidden="true">🧩</span>
                    <p>Loading your BrainBuzz game...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="mini-player-page" ref={gameSceneRef}>

            <header className="mini-player-header">
                <button
                    className="mini-header-action mini-back-action"
                    type="button"
                    onClick={onBack}
                >
                    <span aria-hidden="true">←</span> Back
                </button>
                <div className="mini-header-brand">
                    <span className="mini-header-icon" aria-hidden="true">🎮</span>
                    <div>
                        <span className="mini-header-kicker">TODAY'S ARCADE</span>
                        <h1>Daily Mini Games</h1>
                    </div>
                </div>
                <button
                    className="mini-header-action mini-history-action"
                    type="button"
                    onClick={() => loadHistory(1)}
                    disabled={loading}
                >
                    <span aria-hidden="true">📚</span> My History
                </button>
            </header>

            {error && (challenge || view === 'history') && (
                <p className="mini-player-error" role="alert">{error}</p>
            )}

            {view === 'history' ? (
                <section className="mini-player-panel">
                    <div className="mini-history-heading">
                        <span className="mini-section-kicker">YOUR JOURNEY</span>
                        <h2>My Game History</h2>
                        <p>Every game makes your brain a little sharper.</p>
                    </div>

                    <div className="mini-player-stats">
                        <div className="mini-stat-card is-purple">
                            <span className="mini-stat-icon" aria-hidden="true">🎮</span>
                            <div>
                                <span>Total games</span>
                                <strong>{summary.total_games || 0}</strong>
                            </div>
                        </div>
                        <div className="mini-stat-card is-gold">
                            <span className="mini-stat-icon" aria-hidden="true">🏆</span>
                            <div>
                                <span>Total points</span>
                                <strong>{summary.total_points || 0}</strong>
                            </div>
                        </div>
                        <div className="mini-stat-card is-blue">
                            <span className="mini-stat-icon" aria-hidden="true">🔥</span>
                            <div>
                                <span>Current streak</span>
                                <strong>{summary.current_streak || 0}</strong>
                            </div>
                        </div>
                        <div className="mini-stat-card is-pink">
                            <span className="mini-stat-icon" aria-hidden="true">⚡</span>
                            <div>
                                <span>Longest streak</span>
                                <strong>{summary.longest_streak || 0}</strong>
                            </div>
                        </div>
                        <div className="mini-stat-card is-green">
                            <span className="mini-stat-icon" aria-hidden="true">⭐</span>
                            <div>
                                <span>Average score</span>
                                <strong>{summary.average_score || 0}</strong>
                            </div>
                        </div>
                    </div>

                    {history.length === 0 ? (
                        <div className="mini-history-empty">
                            <span aria-hidden="true">🧩</span>
                            <h3>Your story starts with one game</h3>
                            <p>Play today's challenge and your results will show up here.</p>
                        </div>
                    ) : history.map(attempt => (
                        <div className="mini-history-card" key={attempt.id}>
                            <div>
                                <span className="mini-history-type">
                                    {attempt.challenge?.game_type?.replaceAll('_', ' ') || 'Daily game'}
                                </span>
                                <h3>{attempt.challenge?.title || 'Daily Mini Game'}</h3>
                                <p>{formatDate(attempt.challenge?.challenge_date)}</p>
                            </div>
                            <strong className="mini-history-score">
                                {attempt.score} <span>/ {attempt.max_score} pts</span>
                            </strong>
                        </div>
                    ))}

                    <div className="mini-history-pagination">
                        <button
                            onClick={() => loadHistory(currentPage - 1)}
                            disabled={currentPage <= 1 || loading}
                        >
                            Previous
                        </button>

                        <span>
                            Page {currentPage} of {lastPage}
                        </span>

                        <button
                            onClick={() => loadHistory(currentPage + 1)}
                            disabled={currentPage >= lastPage || loading}
                        >
                            Next
                        </button>
                    </div>

                    <button
                        className="mini-return-game-btn"
                        type="button"
                        onClick={() => setView('game')}
                    >
                        <span aria-hidden="true">🎯</span> Back to today's game
                    </button>
                </section>
            ) : !challenge ? (
                <section className="mini-player-panel mini-empty">
                    <span className="mini-empty-icon" aria-hidden="true">🕹️</span>
                    <span className="mini-section-kicker">THE ARCADE IS QUIET</span>
                    <h2>No game is ready just yet</h2>
                    <p>{error || 'Your next brain-powered challenge will appear here soon.'}</p>
                    <button
                        className="mini-return-game-btn"
                        type="button"
                        onClick={loadGame}
                        disabled={loading}
                    >
                        Check again
                    </button>
                </section>
            ) : (
                <>
                    <div className="mini-player-stats">
                        <div className="mini-stat-card is-orange">
                            <span className="mini-stat-icon" aria-hidden="true">🔥</span>
                            <div>
                                <span>Current streak</span>
                                <strong>{streak.current_streak || 0} <small>days</small></strong>
                            </div>
                        </div>
                        <div className="mini-stat-card is-gold">
                            <span className="mini-stat-icon" aria-hidden="true">🏆</span>
                            <div>
                                <span>Best streak</span>
                                <strong>{streak.longest_streak || 0} <small>days</small></strong>
                            </div>
                        </div>
                        <div className="mini-stat-card is-purple">
                            <span className="mini-stat-icon" aria-hidden="true">🎮</span>
                            <div>
                                <span>Games played</span>
                                <strong>{streak.total_days_played || 0} <small>days</small></strong>
                            </div>
                        </div>
                    </div>

                    <section className="mini-player-panel">
                        <div className="mini-player-game-heading">
                            <div>
                                <span className="mini-game-type">
                                    <span aria-hidden="true">✦</span> {challenge.game_type?.replaceAll('_', ' ')}
                                </span>
                                <h2>{challenge.title}</h2>
                                <p>{challenge.instructions}</p>
                            </div>

                            <div
                                className={`mini-player-timer${timeLeft <= 30 && !challenge.is_completed && !result ? ' is-urgent' : ''}`}
                                aria-label={`Time remaining: ${formatTime(timeLeft)}`}
                                role="timer"
                            >
                                <span className="mini-timer-icon" aria-hidden="true">⏱</span>
                                <span>
                                    <small>TIME LEFT</small>
                                    <strong>{formatTime(timeLeft)}</strong>
                                </span>
                            </div>
                        </div>

                        <div className="mini-player-meta">
                            <span className={`mini-difficulty is-${challenge.difficulty?.toLowerCase()}`}>
                                <span aria-hidden="true">✦</span> {challenge.difficulty}
                            </span>
                            <span className="mini-point-goal">
                                <span aria-hidden="true">⭐</span> {challenge.total_points} points up for grabs
                            </span>
                        </div>

                        {!challenge.is_completed && !result && (
                            <div className="mini-player-progress">
                                <div className="mini-progress-heading">
                                    <span>Challenge progress</span>
                                    <strong>{answeredQuestions} <span>/ {totalQuestions}</span> answered</strong>
                                </div>
                                <div
                                    className="mini-progress-track"
                                    role="progressbar"
                                    aria-label="Questions answered"
                                    aria-valuemin={0}
                                    aria-valuemax={totalQuestions || 1}
                                    aria-valuenow={answeredQuestions}
                                >
                                    <span style={{ width: `${gameProgress}%` }} />
                                </div>
                            </div>
                        )}

                        {challenge.is_completed && result ? (
                            <div className="mini-result">
                                <span className="mini-result-icon" aria-hidden="true">🏆</span>
                                <span className="mini-section-kicker">TODAY'S CHALLENGE</span>
                                <h2>Already completed — nice work!</h2>
                                <h1>{result.score} <span>/ {result.max_score} points</span></h1>
                                <div className="mini-result-summary">
                                    <span>✅ {result.correct_answers} correct</span>
                                    <span>↻ {result.wrong_answers} to learn from</span>
                                    <span>✨ {result.bonus_points || 0} bonus points</span>
                                </div>

                                <div className="mini-result-details">
                                    {result.answers?.map(item => (
                                        <div
                                            className={`mini-result-answer${item.is_correct ? ' is-correct' : ' is-incorrect'}`}
                                            key={item.item_id}
                                        >
                                            <strong>
                                                {item.is_correct ? '✓ Correct' : '✗ Incorrect'}
                                            </strong>
                                            <p>Your answer: {item.submitted_answer || 'Not answered'}</p>
                                            <p>Correct answer: {item.correct_answer}</p>
                                            {item.explanation && <p>{item.explanation}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : result ? (
                            <div className="mini-result">
                                <span className="mini-result-icon" aria-hidden="true">🎉</span>
                                <span className="mini-section-kicker">CHALLENGE COMPLETE</span>
                                <h2>Brilliant game!</h2>
                                <h1>{result.total_score} <span>points</span></h1>
                                <div className="mini-result-summary">
                                    <span>✅ {result.correct_answers} correct</span>
                                    <span>↻ {result.wrong_answers} to learn from</span>
                                    <span>✨ {result.bonus_points} bonus points</span>
                                </div>

                                <div className="mini-result-details">
                                    {result.answers?.map(item => (
                                        <div
                                            className={`mini-result-answer${item.is_correct ? ' is-correct' : ' is-incorrect'}`}
                                            key={item.item_id}
                                        >
                                            <strong>
                                                {item.is_correct ? '✓ Correct' : '✗ Incorrect'}
                                            </strong>
                                            <p>Your answer: {item.submitted_answer || 'Not answered'}</p>
                                            <p>Correct answer: {item.correct_answer}</p>
                                            {item.explanation && <p>{item.explanation}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {timeLeft === 0 && (
                                    <p className="mini-player-error">
                                        Time is over! Submit your answers now.
                                    </p>
                                )}

                                <div className="mini-player-questions">
                                    {challenge.items?.map((item, index) => (
                                        <div
                                            className={
                                                `mini-player-question${String(answers[item.id] || '').trim()
                                                    ? ' is-answered'
                                                    : ''}`
                                            }
                                            key={item.id}
                                        >
                                            <h3>
                                                <span className="mini-question-number">
                                                    <small>QUESTION</small>
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>
                                                <span className="mini-question-points">
                                                    <span aria-hidden="true">⭐</span> {item.points} pts
                                                </span>
                                            </h3>

                                            {item.image_url && (
                                                <img
                                                    className="mini-question-image"
                                                    src={item.image_url}
                                                    alt="Game puzzle"
                                                />
                                            )}

                                            {item.scrambled_word && (
                                                <div className="mini-scrambled-word">
                                                    {item.scrambled_word}
                                                </div>
                                            )}

                                            {item.clues && (
    <div className="mini-game-clues">
        <h4>🔎 Detective Clues</h4>
        <p>{item.clues}</p>
    </div>
)}

{item.sequence && (
    <div className="mini-game-sequence">
        <h4>🧩 Find the Missing Pattern</h4>
        <p>{item.sequence}</p>
    </div>
)}

{item.math_puzzle && (
    <div className="mini-game-math">
        <h4>🔢 Number Ninja</h4>
        <p>{item.math_puzzle}</p>
    </div>
)}
                                            <p>{item.prompt}</p>

                                            {item.options?.length > 0 ? (
                                                <div className="mini-player-options">
                                                    {item.options.map((option, optionIndex) => (
                                                        <button
                                                            type="button"
                                                            key={optionIndex}
                                                            className={
                                                                answers[item.id] === String(option)
                                                                    ? 'selected'
                                                                    : ''
                                                            }
                                                            disabled={timeLeft === 0}
                                                            aria-pressed={answers[item.id] === String(option)}
                                                            onClick={() => updateAnswer(item.id, String(option))}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <input
                                                    className="mini-player-answer"
                                                    value={answers[item.id] || ''}
                                                    disabled={timeLeft === 0}
                                                    onChange={e => updateAnswer(item.id, e.target.value)}
                                                    aria-label={`Answer for question ${index + 1}`}
                                                    placeholder="Enter your answer"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="mini-submit-btn"
                                    onClick={submitGame}
                                    disabled={submitting}
                                >
                                    <span>{submitting ? 'Submitting your answers...' : 'Lock in my answers'}</span>
                                    <small>
                                        {answeredQuestions} of {totalQuestions} answered
                                        <span aria-hidden="true"> · </span>
                                        {submitting ? 'Please wait' : "You've got this!"}
                                    </small>
                                </button>
                            </>
                        )}
                    </section>
                </>
            )}
        </div>
    )
}

export default DailyMiniGames
