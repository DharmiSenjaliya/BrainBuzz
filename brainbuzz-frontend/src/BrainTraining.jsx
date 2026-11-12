
import { useEffect, useState, useRef } from 'react'
import api from './services/api'
import './BrainTraining.css'

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5)
const fetchTrainingHistory = async (token) => {
    const response = await api.get('/brain-training/history', {
        headers: { Authorization: `Bearer ${token}` },
    })

    return response.data.results || []
}

function BrainTraining({ onBack }) {
    const [activeGame, setActiveGame] = useState(null)
    const [trainingResults, setTrainingResults] = useState([])
    const [historyLoading, setHistoryLoading] = useState(true)
    const [historyError, setHistoryError] = useState('')
    const memorySavedRef = useRef(false)

    useEffect(() => {
        let isMounted = true

        const loadHistory = async () => {
            const token = localStorage.getItem('brainbuzz_token')

            if (!token) {
                setHistoryError('Log in to see your training progress.')
                setHistoryLoading(false)
                return
            }

            try {
                const results = await fetchTrainingHistory(token)
                if (isMounted) setTrainingResults(results)
            } catch (error) {
                console.error('Brain Training History Error:', error)
                if (isMounted) setHistoryError('Unable to load training history.')
            } finally {
                if (isMounted) setHistoryLoading(false)
            }
        }

        loadHistory()
        return () => { isMounted = false }
    }, [])
   
    // SCORE SAVING
const [saveMessage, setSaveMessage] = useState('')

const saveResult = async (gameData) => {
    const token = localStorage.getItem('brainbuzz_token')

    if (!token) {
        setSaveMessage('Please login to save your score.')
        return
    }

    try {
        await api.post('/brain-training/results', gameData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        setSaveMessage('Score saved successfully! 🎉')

        try {
            setTrainingResults(await fetchTrainingHistory(token))
            setHistoryError('')
        } catch (error) {
            console.error('Brain Training History Refresh Error:', error)
        }
    } catch (error) {
        console.error('Score save error:', error)
        setSaveMessage('Unable to save score. Please try again.')
    }
}


    // MEMORY MATCH
    const [cards, setCards] = useState(() =>
        shuffle(['🧠', '🎯', '🚀', '⭐', '🧠', '🎯', '🚀', '⭐'])
    )
    const [flipped, setFlipped] = useState([])
    const [matched, setMatched] = useState([])
    const [moves, setMoves] = useState(0)

    const startMemory = () => {
        memorySavedRef.current = false
        setCards(shuffle(['🧠', '🎯', '🚀', '⭐', '🧠', '🎯', '🚀', '⭐']))
        setFlipped([])
        setMatched([])
        setMoves(0)
    }

    const flipCard = (index) => {
        if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return

        const next = [...flipped, index]
        setFlipped(next)

        if (next.length === 2) {
            setMoves((m) => m + 1)

           if (cards[next[0]] === cards[next[1]]) {
    const updatedMatched = [...matched, ...next]
    setMatched(updatedMatched)
    setFlipped([])

    if (updatedMatched.length === 8 && !memorySavedRef.current) {
        memorySavedRef.current = true

        const totalMoves = moves + 1
        const score = Math.max(0, 100 - (totalMoves - 4) * 10)

        saveResult({
            game_type: 'memory',
            score,
            best_result: score,
            completed: true,
            details: {
                moves: totalMoves,
                matchedPairs: 4,
            },
        })
    }
} else {
    setTimeout(() => setFlipped([]), 800)
}
        }
    }

    // NUMBER MEMORY
    const [number, setNumber] = useState('')
    const [showNumber, setShowNumber] = useState(false)
    const [numberInput, setNumberInput] = useState('')
    const [numberMessage, setNumberMessage] = useState('')
    const numberSavedRef = useRef(false)

    const startNumber = () => {
        const value = String(Math.floor(1000 + Math.random() * 9000))
        setNumber(value)
        setNumberInput('')
        setNumberMessage('')
        numberSavedRef.current = false
        setShowNumber(true)

        setTimeout(() => setShowNumber(false), 2500)
    }

    const checkNumber = () => {
    if (!number || !numberInput || numberSavedRef.current) return

    const isCorrect = numberInput === number

    setNumberMessage(
        isCorrect
            ? 'Correct! Excellent memory! 🎉'
            : `Not quite! The number was ${number}.`
    )

    numberSavedRef.current = true

    saveResult({
        game_type: 'number',
        score: isCorrect ? 100 : 0,
        best_result: isCorrect ? 1 : 0,
        completed: true,
        details: {
            correct: isCorrect,
            digits: 4,
        },
    })
}

    // REACTION TEST
    const [reactionStatus, setReactionStatus] = useState('idle')
    const [reactionStart, setReactionStart] = useState(0)
    const [reactionTime, setReactionTime] = useState(null)
    const reactionSavedRef = useRef(false)

    const startReaction = () => {
        reactionSavedRef.current = false
        setReactionStatus('waiting')
        setReactionTime(null)

        const delay = 1500 + Math.random() * 3000

        setTimeout(() => {
            setReactionStart(Date.now())
            setReactionStatus('ready')
        }, delay)
    }

    const clickReaction = () => {
    if (reactionStatus === 'waiting') {
        setReactionStatus('early')
    } else if (reactionStatus === 'ready' && !reactionSavedRef.current) {
        const time = Date.now() - reactionStart

        setReactionTime(time)
        setReactionStatus('done')
        reactionSavedRef.current = true

        const score = Math.max(0, Math.round(100 - time / 10))

        saveResult({
            game_type: 'reaction',
            score,
            best_result: time,
            completed: true,
            details: {
                reactionTime: time,
                unit: 'milliseconds',
            },
        })
    }
}

    // PATTERN RECALL
    const colors = ['🔴', '🔵', '🟢', '🟡']
    const [pattern, setPattern] = useState([])
    const [patternInput, setPatternInput] = useState([])
    const [patternMessage, setPatternMessage] = useState('')
    const [showPattern, setShowPattern] = useState(false)
    const [patternLevel, setPatternLevel] = useState(4)
    const [patternFinished, setPatternFinished] = useState(false)
    const patternSavedRef = useRef(false)

    const startPattern = () => {
            patternSavedRef.current = false
        const sequence = Array.from(
            { length: patternLevel },
            () => Math.floor(Math.random() * colors.length)
        )

        setPattern(sequence)
        setPatternInput([])
        setPatternMessage('Remember the sequence...')
        setPatternFinished(false)
        setShowPattern(true)

        setTimeout(() => {
            setShowPattern(false)
            setPatternMessage('Now repeat the sequence!')
        }, 3000)
    }

    const selectPatternColor = (index) => {
        if (showPattern || patternFinished || !pattern.length) return

        const next = [...patternInput, index]
        setPatternInput(next)

        if (index !== pattern[next.length - 1]) {
            setPatternMessage('Incorrect! Try again.')
            setPatternFinished(true)
            return
        }

        if (next.length === pattern.length) {
    setPatternMessage('Perfect! Pattern remembered! 🎉')
    setPatternFinished(true)

    if (!patternSavedRef.current) {
        patternSavedRef.current = true

        const score = pattern.length * 20

        saveResult({
            game_type: 'pattern',
            score,
            best_result: pattern.length,
            completed: true,
            details: {
                patternLength: pattern.length,
                correct: true,
            },
        })
    }

    setPatternLevel((previous) => Math.min(previous + 1, 10))
}
    }
    const games = [
        { id: 'memory', icon: '🃏', title: 'Memory Match', description: 'Find matching pairs of cards.' },
        { id: 'number', icon: '🔢', title: 'Number Memory', description: 'Remember the number and type it.' },
        { id: 'reaction', icon: '⚡', title: 'Reaction Test', description: 'Test how quickly you react.' },
        { id: 'pattern', icon: '🎨', title: 'Pattern Recall', description: 'Remember and repeat the color sequence.' },
    ]
    const completedResults = trainingResults.filter((result) => result.completed)
    const bestScores = games.map((game) => {
        const scores = completedResults
            .filter((result) => result.game_type === game.id)
            .map((result) => Number(result.score) || 0)

        return { ...game, bestScore: scores.length ? Math.max(...scores) : null }
    })
    const scoreTrend = completedResults.slice(0, 8).reverse()
    const highestRecentScore = Math.max(1, ...scoreTrend.map((result) => Number(result.score) || 0))
    const gameTitles = Object.fromEntries(games.map((game) => [game.id, game.title]))

    return (
        <main className="brain-training">
            <button className="training-back" onClick={() => activeGame ? setActiveGame(null) : onBack()}>
                ← {activeGame ? 'All Training Games' : 'Back to Games'}
            </button>

            <header className="training-heading">
                <span>BRAINBUZZ BRAIN TRAINING</span>
                <h1>Train Your Brain 🧠</h1>
                <p>Improve your memory, focus and reaction speed with fun exercises.</p>
            </header>

            {!activeGame && (
                <>
                <section className="training-dashboard" aria-label="Brain training dashboard">
                    <header className="training-dashboard-heading">
                        <div>
                            <span>YOUR PERFORMANCE</span>
                            <h2>Training dashboard</h2>
                        </div>
                        <p>Every session adds to your progress.</p>
                    </header>

                    <div className="training-summary-grid">
                        <article className="training-summary">
                            <span>Total games played</span>
                            <strong>{completedResults.length}</strong>
                        </article>
                        <article className="training-summary">
                            <span>Total score</span>
                            <strong>{completedResults.reduce((total, result) => total + (Number(result.score) || 0), 0)}</strong>
                        </article>
                        <article className="training-summary">
                            <span>Games practiced</span>
                            <strong>{bestScores.filter((game) => game.bestScore !== null).length}<small> / {games.length}</small></strong>
                        </article>
                    </div>

                    <div className="training-dashboard-grid">
                        <section className="training-dashboard-panel">
                            <div className="training-panel-heading">
                                <h3>Best score by game</h3>
                                <span>Personal bests</span>
                            </div>
                            <div className="training-best-list">
                                {bestScores.map((game) => (
                                    <div className="training-best-row" key={game.id}>
                                        <span className="training-best-icon">{game.icon}</span>
                                        <span className="training-best-name">{game.title}</span>
                                        <strong>{game.bestScore ?? '—'}</strong>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="training-dashboard-panel">
                            <div className="training-panel-heading">
                                <h3>Recent game history</h3>
                                <span>Latest 5 sessions</span>
                            </div>
                            {historyLoading ? (
                                <p className="training-empty-state">Loading your sessions...</p>
                            ) : historyError ? (
                                <p className="training-empty-state">{historyError}</p>
                            ) : completedResults.length ? (
                                <div className="training-history-list">
                                    {completedResults.slice(0, 5).map((result) => (
                                        <article className="training-history-row" key={result.id}>
                                            <div>
                                                <strong>{gameTitles[result.game_type] || result.game_type}</strong>
                                                <time dateTime={result.created_at}>
                                                    {new Date(result.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </time>
                                            </div>
                                            <span>+{result.score} pts</span>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="training-empty-state">Finish a training game to start your history.</p>
                            )}
                        </section>
                    </div>

                    <section className="training-dashboard-panel training-progress-panel">
                        <div className="training-panel-heading">
                            <div>
                                <h3>Score progress</h3>
                                <p>Your last 8 completed sessions</p>
                            </div>
                            {scoreTrend.length > 0 && <span>{scoreTrend.length} sessions</span>}
                        </div>
                        {scoreTrend.length ? (
                            <div className="training-trend-chart" role="img" aria-label="Scores from the last eight completed sessions, oldest to newest">
                                {scoreTrend.map((result) => (
                                    <div className="training-trend-column" key={result.id}>
                                        <strong>{result.score}</strong>
                                        <div className="training-trend-track">
                                            <span style={{ height: `${Math.max(8, ((Number(result.score) || 0) / highestRecentScore) * 100)}%` }} />
                                        </div>
                                        <small>{gameTitles[result.game_type]?.split(' ')[0] || 'Game'}</small>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="training-empty-state">
                                {historyLoading ? 'Loading your progress...' : 'Your score trend will appear after your first game.'}
                            </p>
                        )}
                    </section>
                </section>

                <section className="training-grid">
                    {games.map((game) => (
                        <article className="training-card" key={game.id}>
                            <div className="training-icon">{game.icon}</div>
                            <h2>{game.title}</h2>
                            <p>{game.description}</p>
                            <button onClick={() => {
                                setActiveGame(game.id)
                                if (game.id === 'memory') startMemory()
                            }}>
                                Play Now →
                            </button>
                        </article>
                    ))}
                </section>
                </>
            )}

            {activeGame === 'memory' && (
                <section className="training-play">
                    <h2>Memory Match</h2>
                    <p>Moves: {moves} · Matched: {matched.length / 2}/4</p>
                    <div className="memory-grid">
                        {cards.map((card, index) => (
                            <button
                                className="memory-card"
                                key={index}
                                onClick={() => flipCard(index)}
                            >
                                {flipped.includes(index) || matched.includes(index) ? card : '?'}
                            </button>
                        ))}
                    </div>
                    {matched.length === 8 && <h3>Congratulations! You matched all pairs! 🎉</h3>}
                    <p>{saveMessage}</p>
                    <button className="training-action" onClick={startMemory}>Restart Game</button>
                </section>
            )}

            {activeGame === 'number' && (
                <section className="training-play">
                    <h2>Number Memory</h2>
                    <p>Remember the number displayed on screen.</p>
                    {showNumber ? (
                        <div className="memory-number">{number}</div>
                    ) : (
                        <>
                            <input
                                value={numberInput}
                                onChange={(e) => setNumberInput(e.target.value)}
                                placeholder="Enter remembered number"
                                maxLength={4}
                            />
                            <button className="training-action" onClick={checkNumber}>Check Answer</button>
                        </>
                    )}
                    <p>{numberMessage}</p>
                    <button className="training-action" onClick={startNumber}>Start / Try Again</button>
                </section>
            )}

            {activeGame === 'reaction' && (
                <section className="training-play">
                    <h2>Reaction Test</h2>
                    <p>Wait until the box turns green, then click it quickly!</p>
                    <button
                        className={`reaction-box ${reactionStatus === 'ready' ? 'reaction-ready' : ''}`}
                        onClick={clickReaction}
                    >
                        {reactionStatus === 'idle' && 'Press Start'}
                        {reactionStatus === 'waiting' && 'Wait for Green...'}
                        {reactionStatus === 'ready' && 'CLICK NOW!'}
                        {reactionStatus === 'early' && 'Too Early!'}
                        {reactionStatus === 'done' && `${reactionTime} ms`}
                    </button>
                    {reactionTime !== null && <h3>Your reaction: {reactionTime} ms</h3>}
                    <button className="training-action" onClick={startReaction}>Start Test</button>
                </section>
            )}

            {activeGame === 'pattern' && (
                <section className="training-play">
                    <h2>Pattern Recall</h2>
                    <p>Remember the sequence, then repeat it by selecting the colors.</p>
                    {showPattern ? (
                        <div className="pattern-display">
                            {pattern.map((value, i) => <span key={i}>{colors[value]}</span>)}
                        </div>
                    ) : (
                        <>
                            <p>Your sequence: {patternInput.map((value) => colors[value]).join(' ') || '—'}</p>
                            <div className="pattern-buttons">
                                {colors.map((color, index) => (
                                    <button key={color} onClick={() => selectPatternColor(index)}>
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    <h3>{patternMessage}</h3>
                    <button className="training-action" onClick={startPattern}>Start / Try Again</button>
                </section>
            )}
        </main>
    )
}

export default BrainTraining
