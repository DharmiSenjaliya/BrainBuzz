import { useCallback, useEffect, useRef, useState } from 'react'
import api from './services/api'
import PlayerBackButton from './PlayerBackButton'

const ACTIVE_DUEL_KEY = 'brainbuzz_active_duel'

function BrainDuel({ onBack, onDuelComplete }) {
    const [duel, setDuel] = useState(null)
    const [inviteCode, setInviteCode] = useState('')
    const [answer, setAnswer] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState('')
    const [feedback, setFeedback] = useState('')
    const onDuelCompleteRef = useRef(onDuelComplete)
    const completedDuelRef = useRef(null)
    const duelCode = duel?.invite_code
    const duelStatus = duel?.status

    useEffect(() => {
        onDuelCompleteRef.current = onDuelComplete
    }, [onDuelComplete])

    const acceptDuel = useCallback((nextDuel) => {
        setDuel((previous) => {
            if (!previous || previous.invite_code !== nextDuel.invite_code) return nextDuel

            const statusRank = { waiting: 0, active: 1, completed: 2, expired: 2 }
            if (statusRank[nextDuel.status] < statusRank[previous.status]) return previous

            return {
                ...nextDuel,
                you: {
                    ...nextDuel.you,
                    progress: Math.max(previous.you.progress, nextDuel.you.progress),
                    score: Math.max(previous.you.score, nextDuel.you.score),
                    correct_answers: Math.max(previous.you.correct_answers, nextDuel.you.correct_answers),
                },
                opponent: {
                    ...nextDuel.opponent,
                    progress: Math.max(previous.opponent.progress, nextDuel.opponent.progress),
                    score: Math.max(previous.opponent.score, nextDuel.opponent.score),
                    correct_answers: Math.max(previous.opponent.correct_answers, nextDuel.opponent.correct_answers),
                },
            }
        })
        if (nextDuel.status === 'completed' && completedDuelRef.current !== nextDuel.invite_code) {
            completedDuelRef.current = nextDuel.invite_code
            onDuelCompleteRef.current?.()
        }
        setInviteCode(nextDuel.invite_code)
        localStorage.setItem(ACTIVE_DUEL_KEY, nextDuel.invite_code)
        setError('')
    }, [])

    const fetchDuel = useCallback(async (code, showError = true) => {
        try {
            const response = await api.get(`/brain-duels/${encodeURIComponent(code)}`)
            acceptDuel(response.data.duel)
        } catch (requestError) {
            console.error('Brain Duel Refresh Error:', requestError)
            if (showError) {
                setError(requestError.response?.data?.message || 'Unable to load this duel.')
            }
        }
    }, [acceptDuel])

    useEffect(() => {
        const savedCode = localStorage.getItem(ACTIVE_DUEL_KEY)
        if (!savedCode) return undefined

        let isActive = true
        api.get(`/brain-duels/${encodeURIComponent(savedCode)}`)
            .then((response) => {
                if (isActive) acceptDuel(response.data.duel)
            })
            .catch((requestError) => {
                console.error('Brain Duel Restore Error:', requestError)
                if (isActive) {
                    setError(requestError.response?.data?.message || 'Unable to restore your active duel.')
                }
            })

        return () => {
            isActive = false
        }
    }, [acceptDuel])

    useEffect(() => {
        if (!duelCode || !['waiting', 'active'].includes(duelStatus)) return undefined

        const timer = window.setInterval(() => {
            fetchDuel(duelCode, false)
        }, 3000)

        return () => window.clearInterval(timer)
    }, [duelCode, duelStatus, fetchDuel])

    const createDuel = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await api.post('/brain-duels')
            acceptDuel(response.data.duel)
        } catch (requestError) {
            console.error('Brain Duel Create Error:', requestError)
            setError(requestError.response?.data?.message || 'Unable to create a duel.')
        } finally {
            setLoading(false)
        }
    }

    const joinDuel = async (event) => {
        event.preventDefault()
        if (inviteCode.trim().length !== 8) {
            setError('Enter the 8-character invite code.')
            return
        }

        setLoading(true)
        setError('')
        try {
            const response = await api.post('/brain-duels/join', {
                invite_code: inviteCode.trim().toUpperCase(),
            })
            acceptDuel(response.data.duel)
        } catch (requestError) {
            console.error('Brain Duel Join Error:', requestError)
            setError(requestError.response?.data?.message || 'Unable to join this duel.')
        } finally {
            setLoading(false)
        }
    }

    const submitAnswer = async (event) => {
        event.preventDefault()
        const question = duel?.questions?.[duel.you.progress]
        if (!question || !answer.trim() || submitting) return

        setSubmitting(true)
        setFeedback('')
        setError('')
        try {
            const response = await api.post(
                `/brain-duels/${encodeURIComponent(duel.invite_code)}/answer`,
                { question_id: question.id, answer: answer.trim() }
            )
            acceptDuel(response.data.duel)
            setFeedback(response.data.correct ? 'Correct! Points added.' : 'Not quite — your rival is still in the race!')
            setAnswer('')
        } catch (requestError) {
            console.error('Brain Duel Answer Error:', requestError)
            setError(requestError.response?.data?.message || 'Unable to submit your answer.')
        } finally {
            setSubmitting(false)
        }
    }

    const copyInviteCode = async () => {
        try {
            await navigator.clipboard.writeText(duel.invite_code)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1800)
        } catch (clipboardError) {
            console.error('Brain Duel Copy Invite Error:', clipboardError)
            setError('Copy is unavailable here. Select and copy the invite code manually.')
        }
    }

    const startAnotherDuel = () => {
        localStorage.removeItem(ACTIVE_DUEL_KEY)
        setDuel(null)
        setInviteCode('')
        setAnswer('')
        setFeedback('')
        setError('')
        completedDuelRef.current = null
    }

    const currentQuestion = duel?.questions?.[duel.you.progress]
    const isComplete = duel?.status === 'completed'
    const resultLabel = isComplete
        ? duel.you.score === duel.opponent.score
            ? 'A perfect tie!'
            : duel.you.score > duel.opponent.score
                ? 'You won the duel!'
                : 'Your rival takes this round.'
        : ''

    return (
        <main className="brain-duel-page">
            <PlayerBackButton onClick={onBack} />

            <header className="brain-duel-hero">
                <div>
                    <span className="brain-duel-eyebrow">BRAINBUZZ // HEAD-TO-HEAD</span>
                    <h1>Brain <span>Duel</span></h1>
                    <p>Five questions. One rival. Outsmart each other.</p>
                </div>
                <div className="brain-duel-orb" aria-hidden="true">
                    <i className="brain-duel-orbit brain-duel-orbit-one" />
                    <i className="brain-duel-orbit brain-duel-orbit-two" />
                    <span>⚡</span>
                </div>
            </header>

            {error && <p className="brain-duel-error" role="alert">{error}</p>}

            {!duel && (
                <section className="brain-duel-lobby">
                    <article className="brain-duel-panel brain-duel-create">
                        <span className="brain-duel-panel-icon" aria-hidden="true">✦</span>
                        <p className="brain-duel-kicker">HOST A MATCH</p>
                        <h2>Challenge a friend</h2>
                        <p>Create a private duel and share its invite code. Your rival can join from their own account.</p>
                        <button className="brain-duel-primary" onClick={createDuel} disabled={loading}>
                            {loading ? 'Creating duel...' : 'Create invite duel'} <span aria-hidden="true">→</span>
                        </button>
                    </article>

                    <article className="brain-duel-panel brain-duel-join">
                        <span className="brain-duel-panel-icon" aria-hidden="true">⌘</span>
                        <p className="brain-duel-kicker">JOIN A MATCH</p>
                        <h2>Enter the arena</h2>
                        <p>Have an invite code? Enter it here to join your friend’s duel.</p>
                        <form onSubmit={joinDuel}>
                            <label htmlFor="brain-duel-code">8-character invite code</label>
                            <input
                                id="brain-duel-code"
                                value={inviteCode}
                                onChange={(event) => setInviteCode(event.target.value.toUpperCase().slice(0, 8))}
                                placeholder="e.g. A4K9P2XZ"
                                autoComplete="off"
                                maxLength={8}
                                disabled={loading}
                            />
                            <button className="brain-duel-secondary" type="submit" disabled={loading || inviteCode.trim().length !== 8}>
                                {loading ? 'Joining...' : 'Join duel'} <span aria-hidden="true">↗</span>
                            </button>
                        </form>
                    </article>
                </section>
            )}

            {duel && (
                <section className="brain-duel-arena">
                    <div className="brain-duel-scoreboard">
                        <article className="brain-duel-player-card is-you">
                            <span className="brain-duel-player-label">YOU</span>
                            <strong>{duel.you.name}</strong>
                            <span className="brain-duel-player-score">{duel.you.score}<small>PTS</small></span>
                            <span className="brain-duel-player-progress">{duel.you.progress} / {duel.questions.length} solved</span>
                        </article>
                        <div className="brain-duel-versus" aria-label="versus">VS</div>
                        <article className="brain-duel-player-card">
                            <span className="brain-duel-player-label">RIVAL</span>
                            <strong>{duel.opponent.name}</strong>
                            <span className="brain-duel-player-score">{duel.opponent.score}<small>PTS</small></span>
                            <span className="brain-duel-player-progress">{duel.opponent.progress} / {duel.questions.length} solved</span>
                        </article>
                    </div>

                    {duel.status === 'waiting' && (
                        <article className="brain-duel-panel brain-duel-waiting">
                            <span className="brain-duel-live-dot" />
                            <p className="brain-duel-kicker">ARENA CREATED</p>
                            <h2>Waiting for your rival</h2>
                            <p>Send this invite code to another BrainBuzz player to start the duel.</p>
                            <div className="brain-duel-invite">
                                <code>{duel.invite_code}</code>
                                <button className="brain-duel-secondary" onClick={copyInviteCode}>
                                    {copied ? 'Copied!' : 'Copy code'}
                                </button>
                            </div>
                            <small className="brain-duel-poll-note">This screen updates automatically when they join.</small>
                        </article>
                    )}

                    {duel.status === 'active' && currentQuestion && (
                        <article className="brain-duel-question-card">
                            <div className="brain-duel-question-meta">
                                <span>ROUND {duel.you.progress + 1} <i>/</i> {duel.questions.length}</span>
                                <strong>{currentQuestion.points} <small>PTS</small></strong>
                            </div>
                            <div className="brain-duel-progress-track">
                                <span style={{ width: `${(duel.you.progress / duel.questions.length) * 100}%` }} />
                            </div>
                            <p className="brain-duel-kicker">THINK FAST, THINK CLEAR</p>
                            <h2>{currentQuestion.title}</h2>
                            {Array.isArray(currentQuestion.clues) && currentQuestion.clues.length > 0 && (
                                <ul>
                                    {currentQuestion.clues.map((clue, index) => (
                                        <li key={`${currentQuestion.id}-${index}`}>{clue}</li>
                                    ))}
                                </ul>
                            )}
                            <form onSubmit={submitAnswer}>
                                <label htmlFor="brain-duel-answer">Your answer</label>
                                <div className="brain-duel-answer-row">
                                    <input
                                        id="brain-duel-answer"
                                        value={answer}
                                        onChange={(event) => setAnswer(event.target.value)}
                                        placeholder="Type your answer..."
                                        autoComplete="off"
                                        disabled={submitting}
                                    />
                                    <button className="brain-duel-primary" type="submit" disabled={submitting || !answer.trim()}>
                                        {submitting ? 'Checking...' : 'Lock answer'} <span aria-hidden="true">↗</span>
                                    </button>
                                </div>
                            </form>
                            {feedback && <p className="brain-duel-feedback" aria-live="polite">{feedback}</p>}
                            <p className="brain-duel-rival-status">
                                Rival progress: {duel.opponent.progress} / {duel.questions.length}
                            </p>
                        </article>
                    )}

                    {duel.status === 'active' && !currentQuestion && (
                        <article className="brain-duel-panel brain-duel-waiting">
                            <span className="brain-duel-live-dot" />
                            <p className="brain-duel-kicker">ANSWERS LOCKED</p>
                            <h2>You’re done — waiting on your rival</h2>
                            <p>Your score is saved. The final result appears when both players finish.</p>
                        </article>
                    )}

                    {isComplete && (
                        <article className="brain-duel-panel brain-duel-result">
                            <span className="brain-duel-panel-icon" aria-hidden="true">
                                {duel.you.score >= duel.opponent.score ? '🏆' : '⚡'}
                            </span>
                            <p className="brain-duel-kicker">DUEL COMPLETE</p>
                            <h2>{resultLabel}</h2>
                            <p>{duel.you.score} points against {duel.opponent.score} — every point counted.</p>
                            <button className="brain-duel-primary" onClick={startAnotherDuel}>
                                Play another duel <span aria-hidden="true">↻</span>
                            </button>
                        </article>
                    )}

                    {duel.status === 'expired' && (
                        <article className="brain-duel-panel brain-duel-result">
                            <p className="brain-duel-kicker">ARENA CLOSED</p>
                            <h2>This duel has expired</h2>
                            <PlayerBackButton onClick={startAnotherDuel} />
                        </article>
                    )}
                </section>
            )}
        </main>
    )
}

export default BrainDuel
