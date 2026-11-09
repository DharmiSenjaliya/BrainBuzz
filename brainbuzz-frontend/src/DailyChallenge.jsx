import { useEffect, useState } from 'react'
import api from './services/api'
import './DailyChallenge.css'

function DailyChallenge({ onBack }) {
    const [challenge, setChallenge] = useState(null)
    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState({})
    const [streak, setStreak] = useState({
        current_streak: 0,
        longest_streak: 0,
    })
    const [attempt, setAttempt] = useState(null)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [hintVisible, setHintVisible] = useState({})
    const [history, setHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [historyError, setHistoryError] = useState('')
    const [historyPage, setHistoryPage] = useState(1)
    const [historyLastPage, setHistoryLastPage] = useState(1)

    const [historySummary, setHistorySummary] = useState({
    total_challenges: 0,
    total_points: 0,
    total_bonus: 0,
    best_streak: 0,
})

    const authConfig = {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('brainbuzz_token')}`,
        },
    }

    const fetchChallenge = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await api.get('/daily-challenge', authConfig)
            const data = response.data

            setChallenge(data.challenge)
            setQuestions(data.challenge?.questions || [])
           const savedAttempt = data.challenge?.attempt || null

setAttempt(savedAttempt)
setResult(savedAttempt)

setStreak(data.streak || {
    current_streak: 0,
    longest_streak: 0,
})
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load today’s challenge.'
            )
        } finally {
            setLoading(false)
        }
    }

     const fetchHistory = async (page = 1) => {
    try {
        setHistoryLoading(true)
        setHistoryError('')

        const response = await api.get(
            `/daily-challenge/history?page=${page}`,
            authConfig
        )

        const historyData = response.data.history
    
        setHistorySummary(response.data.summary || {
    total_challenges: 0,
    total_points: 0,
    total_bonus: 0,
    best_streak: 0,
})

        setHistory(historyData.data || [])
        setHistoryPage(historyData.current_page || 1)
        setHistoryLastPage(historyData.last_page || 1)
        setShowHistory(true)
    } catch (err) {
        setHistoryError(
            err.response?.data?.message ||
            'Unable to load challenge history.'
        )
    } finally {
        setHistoryLoading(false)
    }
}


    useEffect(() => {
        fetchChallenge()
    }, [])

    const handleAnswerChange = (questionId, value) => {
        setAnswers(previous => ({
            ...previous,
            [questionId]: value,
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (questions.length !== 5) {
            setError('Today’s challenge must contain 5 questions.')
            return
        }

        const unanswered = questions.filter(
            question => !answers[question.id]?.trim()
        )

        if (unanswered.length > 0) {
            setError('Please answer all 5 questions before submitting.')
            return
        }

        try {
            setSubmitting(true)
            setError('')

            const response = await api.post(
                '/daily-challenge/submit',
                {
                    challenge_id: challenge.id,
                    answers: questions.map(question => ({
                        question_id: question.id,
                        answer: answers[question.id].trim(),
                    })),
                },
                authConfig
            )

            const data = response.data

            setResult(data.attempt || data)
            setAttempt(data.attempt || data)

            if (data.streak) {
                setStreak(data.streak)
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to submit challenge. Please try again.'
            )
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <main className="daily-challenge-page">
                <p className="daily-loading">Loading Daily Challenge...</p>
            </main>
        )
    }

    if (error && !challenge) {
        return (
            <main className="daily-challenge-page">
                <div className="daily-error">{error}</div>
                <button className="daily-back-btn" onClick={onBack}>
                    Back to Dashboard
                </button>
            </main>
        )
    }

    if (!challenge) {
        return (
            <main className="daily-challenge-page">
                <h2>No Daily Challenge Available</h2>
                <button className="daily-back-btn" onClick={onBack}>
                    Back to Dashboard
                </button>
            </main>
        )
    }

    const completed = Boolean(attempt || result)

    return (
        <main className="daily-challenge-page">
            <div className="daily-challenge-header">
                <div>
                    <p className="daily-eyebrow">BRAINBUZZ SPECIAL</p>
                    <h1>🎯 Daily Challenge</h1>
                    <p>Complete all 5 questions and earn bonus points!</p>
                </div>

                <div className="daily-header-actions">
    <button
        className="daily-history-btn"
        onClick={() => {
            if (showHistory) {
                setShowHistory(false)
            } else {
                fetchHistory(1)
            }
        }}
        disabled={historyLoading}
    >
        {historyLoading
            ? 'Loading...'
            : showHistory
                ? '← Back to Challenge'
                : '📅 Challenge History'}
    </button>

                <button className="daily-back-btn" onClick={onBack}>
                    ← Dashboard
                </button>
            </div>
            </div>

            <div className="daily-stats">
                <div className="daily-stat-card">
                    <span>🎯</span>
                    <strong>5</strong>
                    <small>Questions</small>
                </div>

                <div className="daily-stat-card">
                    <span>⭐</span>
                    <strong>+{challenge.bonus_points}</strong>
                    <small>Bonus Points</small>
                </div>

                <div className="daily-stat-card">
                    <span>🔥</span>
                    <strong>{streak.current_streak || 0}</strong>
                    <small>Current Streak</small>
                </div>

                <div className="daily-stat-card">
                    <span>🏆</span>
                    <strong>{streak.longest_streak || 0}</strong>
                    <small>Best Streak</small>
                </div>
            </div>

          
          {showHistory ? (
    <section className="daily-history-section">
        <div className="daily-history-summary">
    <div className="daily-history-summary-card">
        <div className="daily-history-summary-icon">🎯</div>
        <div>
            <span>Total Challenges</span>
            <strong>{historySummary.total_challenges}</strong>
        </div>
    </div>

    <div className="daily-history-summary-card">
        <div className="daily-history-summary-icon">⭐</div>
        <div>
            <span>Total Points</span>
            <strong>{historySummary.total_points}</strong>
        </div>
    </div>

    <div className="daily-history-summary-card">
        <div className="daily-history-summary-icon">🎁</div>
        <div>
            <span>Total Bonus</span>
            <strong>+{historySummary.total_bonus}</strong>
        </div>
    </div>

    <div className="daily-history-summary-card">
        <div className="daily-history-summary-icon">🏆</div>
        <div>
            <span>Best Streak</span>
            <strong>{historySummary.best_streak}</strong>
        </div>
    </div>
</div>
        <div className="daily-form-heading">
            <h2>📅 Daily Challenge History</h2>
            <span>{history.length} Records</span>
        </div>

        {historyError && (
            <div className="daily-error">{historyError}</div>
        )}

        {historyLoading ? (
            <p className="daily-loading">Loading history...</p>
        ) : history.length === 0 ? (
            <div className="daily-history-empty">
                <h3>No History Found</h3>
                <p>You have not completed any previous challenges yet.</p>
            </div>
        ) : (
            <>
                <div className="daily-history-list">
                    {history.map(item => (
                        <article
                            className="daily-history-card"
                            key={item.id}
                        >
                            <div>
                                <h3>
                                    {item.challenge?.challenge_date
                                        ? new Date(
                                            item.challenge.challenge_date
                                        ).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })
                                        : 'Daily Challenge'}
                                </h3>
                                <p>
                                    Completed: {item.completed_at
                                        ? new Date(item.completed_at).toLocaleString('en-IN')
                                        : 'N/A'}
                                </p>
                            </div>

                            <div className="daily-history-stats">
                                <span>✅ {item.correct_answers} Correct</span>
                                <span>❌ {item.wrong_answers} Wrong</span>
                                <strong>⭐ {item.score} Points</strong>
                                <small>+{item.bonus_points} Bonus</small>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="daily-history-pagination">
                    <button
                        className="daily-back-btn"
                        disabled={historyPage <= 1 || historyLoading}
                        onClick={() => fetchHistory(historyPage - 1)}
                    >
                        ← Previous
                    </button>

                    <span>
                        Page {historyPage} of {historyLastPage}
                    </span>

                    <button
                        className="daily-back-btn"
                        disabled={historyPage >= historyLastPage || historyLoading}
                        onClick={() => fetchHistory(historyPage + 1)}
                    >
                        Next →
                    </button>
                </div>
            </>
        )}
    </section>
            ) : completed ? (
                <section className="daily-completed-card">
                    <div className="daily-completed-icon">🏆</div>
                    <h2>Today's Challenge Completed!</h2>
                    <p>You have already submitted today's challenge.</p>

                    <div className="daily-result-grid">
                        <div>
                            <strong>{result?.correct_answers ?? 0}</strong>
                            <span>Correct Answers</span>
                        </div>
                        <div>
                            <strong>{result?.wrong_answers ?? 0}</strong>
                            <span>Wrong Answers</span>
                        </div>
                        <div>
                            <strong>{result?.score ?? 0}</strong>
                            <span>Total Score</span>
                        </div>
                        <div>
                            <strong>+{result?.bonus_points ?? 0}</strong>
                            <span>Bonus Earned</span>
                        </div>
                    </div>

                    <p className="daily-streak-message">
                        🔥 Your current streak: {streak.current_streak || 0} days
                    </p>
                </section>
            ) : (
                <form className="daily-question-form" onSubmit={handleSubmit}>
                    <div className="daily-form-heading">
                        <h2>Today's Questions</h2>
                        <span>{questions.length} / 5 Questions</span>
                    </div>

                    {error && <div className="daily-error">{error}</div>}

                    {questions.map((question, index) => (
                        <article className="daily-question-card" key={question.id}>
                            <div className="daily-question-top">
                                <span>QUESTION {index + 1}</span>
                                <small>{question.points} points</small>
                            </div>

                            <h3>{question.title}</h3>

                            <div className="daily-clues">
                                {question.clues?.map((clue, clueIndex) => (
                                    <p key={clueIndex}>
                                        <span>{clueIndex + 1}.</span> {clue}
                                    </p>
                                ))}
                            </div>

                            {question.hint && (
                                <div className="daily-hint-area">
                                    <button
                                        type="button"
                                        className="daily-hint-btn"
                                        onClick={() => setHintVisible(previous => ({
                                            ...previous,
                                            [question.id]: !previous[question.id],
                                        }))}
                                    >
                                        💡 {hintVisible[question.id] ? 'Hide Hint' : 'Show Hint'}
                                    </button>

                                    {hintVisible[question.id] && (
                                        <p>{question.hint}</p>
                                    )}
                                </div>
                            )}

                            <input
                                type="text"
                                placeholder="Enter your answer..."
                                value={answers[question.id] || ''}
                                onChange={event => handleAnswerChange(
                                    question.id,
                                    event.target.value
                                )}
                                disabled={submitting}
                                required
                            />
                        </article>
                    ))}

                    <div className="daily-submit-area">
                        <p>Complete all 5 questions to claim your bonus!</p>
                        <button
                            type="submit"
                            className="daily-submit-btn"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Daily Challenge'}
                        </button>
                    </div>
                </form>
            )}
        </main>
    )
}

export default DailyChallenge
