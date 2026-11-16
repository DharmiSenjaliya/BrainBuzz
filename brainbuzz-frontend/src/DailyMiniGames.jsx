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

    if (loading) {
        return <div className="mini-player-page">Loading Daily Mini Games...</div>
    }

    return (
        <div className="mini-player-page">

            <div className="mini-player-header">
                <button onClick={onBack}>← Back</button>
                <h1>Daily Mini Games</h1>
                <button onClick={loadHistory}>My History</button>
            </div>

            {error && <p className="mini-player-error">{error}</p>}

            {view === 'history' ? (
                <section className="mini-player-panel">
                    <h2>My Game History</h2>

                    <div className="mini-player-stats">
                        <div>Total Games: {summary.total_games || 0}</div>
                        <div>Total Points: {summary.total_points || 0}</div>
                        <div>Current Streak: {summary.current_streak || 0}</div>
                        <div>Longest Streak: {summary.longest_streak || 0}</div>
                        <div>Average Score: {summary.average_score || 0}</div>
                    </div>

                    {history.length === 0 ? (
                        <p>No games played yet.</p>
                    ) : history.map(attempt => (
                        <div className="mini-history-card" key={attempt.id}>
                            <h3>{attempt.challenge?.title || 'Daily Mini Game'}</h3>
                            <p>
                                {attempt.challenge?.game_type} ·
                                {' '}{formatDate(attempt.challenge?.challenge_date)}
                            </p>
                            <strong>
                                {attempt.score} / {attempt.max_score} points
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

                    <button onClick={() => setView('game')}>
                        Back to Today's Game
                    </button>
                </section>
            ) : !challenge ? (
                <section className="mini-player-panel mini-empty">
                    <h2>Daily Mini Game</h2>
                    <p>{error || 'No published mini game available today.'}</p>
                </section>
            ) : (
                <>
                    <div className="mini-player-stats">
                        <div>🔥 Current Streak: {streak.current_streak || 0}</div>
                        <div>🏆 Best Streak: {streak.longest_streak || 0}</div>
                        <div>🎮 Played: {streak.total_days_played || 0} days</div>
                    </div>

                    <section className="mini-player-panel">
                        <div className="mini-player-game-heading">
                            <div>
                                <span className="mini-game-type">
                                    {challenge.game_type?.replaceAll('_', ' ')}
                                </span>
                                <h2>{challenge.title}</h2>
                                <p>{challenge.instructions}</p>
                            </div>

                            <div className="mini-player-timer">
                                ⏱ {formatTime(timeLeft)}
                            </div>
                        </div>

                        <div className="mini-player-meta">
                            <span>Difficulty: {challenge.difficulty}</span>
                            <span>Total Points: {challenge.total_points}</span>
                        </div>

                        {challenge.is_completed && result ? (
    <div className="mini-result">
        <h2>Game Already Completed!</h2>
        <h1>{result.score} / {result.max_score} Points</h1>
        <p>Correct Answers: {result.correct_answers}</p>
        <p>Wrong Answers: {result.wrong_answers}</p>
        <p>Bonus: {result.bonus_points || 0}</p>

        <div className="mini-result-details">
            {result.answers?.map(item => (
                <div key={item.item_id}>
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
                                <h2>🎉 Game Completed!</h2>
                                <h1>{result.total_score} Points</h1>
                                <p>Correct: {result.correct_answers}</p>
                                <p>Wrong: {result.wrong_answers}</p>
                                <p>Bonus: {result.bonus_points}</p>

                                <div className="mini-result-details">
                                    {result.answers?.map(item => (
                                        <div key={item.item_id}>
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
                                        <div className="mini-player-question" key={item.id}>
                                            <h3>
                                                Question {index + 1}
                                                <span>{item.points} Points</span>
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
                                                            onClick={() => updateAnswer(item.id, String(option))}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <input
                                                    value={answers[item.id] || ''}
                                                    disabled={timeLeft === 0}
                                                    onChange={e => updateAnswer(item.id, e.target.value)}
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
                                    {submitting ? 'Submitting...' : 'Submit Game'}
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
