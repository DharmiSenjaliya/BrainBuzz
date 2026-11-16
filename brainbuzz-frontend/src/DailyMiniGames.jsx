import { useEffect, useState } from 'react'
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

    useEffect(() => {
        loadGame()
    }, [])

    useEffect(() => {
        if (!challenge || challenge.is_completed || result || timeLeft <= 0) {
            return
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1))
        }, 1000)

        return () => clearInterval(timer)
    }, [challenge, result, timeLeft])

    const loadGame = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await api.get('/daily-mini-game')
            const game = response.data.challenge

            setChallenge(game)
            setStreak(response.data.streak || {})
            setTimeLeft(game.duration_seconds || 300)

            if (game.is_completed) {
                setResult(game.attempt)
            } else {
                setStartedAt(Date.now())
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Daily Mini Game is not available today.'
            )
        } finally {
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
    } catch (err) {
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

    if (loading) {
        return (
            <div className="mini-player-page">
                <div className="mini-player-loading" role="status">
                    <span className="mini-loading-icon" aria-hidden="true">🎮</span>
                    <h2>Getting today's game ready</h2>
                    <p>Warming up your brain-powered challenge...</p>
                    <span className="mini-loading-bar" aria-hidden="true" />
                </div>
            </div>
        )
    }

    return (
        <div className="mini-player-page">

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
