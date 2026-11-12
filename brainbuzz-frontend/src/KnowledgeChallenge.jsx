import { useEffect, useState } from 'react'
import api from './services/api'
import './KnowledgeChallenge.css'

const QUESTION_COUNT = 5
const ANSWER_ATTEMPTS = 3

function KnowledgeChallenge({ onBack, onChallengeComplete }) {
    const [categories, setCategories] = useState([])
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [questions, setQuestions] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answer, setAnswer] = useState('')
    const [attempts, setAttempts] = useState(ANSWER_ATTEMPTS)
    const [score, setScore] = useState(0)
    const [correctCount, setCorrectCount] = useState(0)
    const [feedback, setFeedback] = useState('')
    const [feedbackType, setFeedbackType] = useState('')
    const [questionResolved, setQuestionResolved] = useState(false)
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(false)
    const [started, setStarted] = useState(false)
    const [completed, setCompleted] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')

    const token = localStorage.getItem('brainbuzz_token')
    const question = questions[currentIndex]

    useEffect(() => {
        let isMounted = true

        const loadCategories = async () => {
            try {
                const response = await api.get('/categories', {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (isMounted) setCategories(response.data.categories || [])
            } catch (requestError) {
                console.error('Knowledge Challenge Categories Error:', requestError)
                if (isMounted) setError('Unable to load categories. Please try again.')
            } finally {
                if (isMounted) setCategoriesLoading(false)
            }
        }

        loadCategories()
        return () => { isMounted = false }
    }, [token])

    const startChallenge = async () => {
        setLoading(true)
        setError('')
        setFeedback('')
        setScore(0)
        setCorrectCount(0)
        setCurrentIndex(0)
        setAttempts(ANSWER_ATTEMPTS)
        setQuestionResolved(false)
        setCompleted(false)
        setSaved(false)
        setQuestions([])

        try {
            const query = new URLSearchParams({ level: '1' })
            if (selectedCategory !== 'all') query.set('category_id', selectedCategory)

            const response = await api.get(`/questions?${query.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const challengeQuestions = response.data.questions || []

            if (!challengeQuestions.length) {
                setError('No questions are available for this category yet.')
                return
            }

            setQuestions(challengeQuestions.slice(0, QUESTION_COUNT))
            setStarted(true)
        } catch (requestError) {
            console.error('Knowledge Challenge Start Error:', requestError)
            setError(requestError.response?.data?.message || 'Unable to start the challenge.')
        } finally {
            setLoading(false)
        }
    }

    const checkAnswer = async (event) => {
        event.preventDefault()
        if (!answer.trim() || checking || questionResolved || !question) return

        setChecking(true)
        setFeedback('Checking your answer...')
        setFeedbackType('neutral')

        try {
            const response = await api.post('/check-answer', {
                question_id: question.id,
                answer: answer.trim(),
            }, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.data.correct) {
                setScore((previous) => previous + Number(response.data.points || 0))
                setCorrectCount((previous) => previous + 1)
                setFeedback(`Correct! +${response.data.points} points`)
                setFeedbackType('success')
                setQuestionResolved(true)
                setAnswer('')
                return
            }

            const remainingAttempts = attempts - 1
            setAttempts(remainingAttempts)
            setAnswer('')
            setFeedback(remainingAttempts
                ? `Not quite. ${remainingAttempts} ${remainingAttempts === 1 ? 'try' : 'tries'} left.`
                : 'No tries left. Move on to the next question.')
            setFeedbackType('error')
            if (!remainingAttempts) setQuestionResolved(true)
        } catch (requestError) {
            console.error('Knowledge Challenge Answer Error:', requestError)
            setFeedback(requestError.response?.data?.message || 'Unable to check your answer.')
            setFeedbackType('error')
        } finally {
            setChecking(false)
        }
    }

    const saveChallenge = async () => {
        const totalQuestions = questions.length
        const wrongCount = totalQuestions - correctCount
        setSaving(true)
        setError('')

        try {
            await api.post('/game-results', {
                game_mode: 'knowledge',
                level: 1,
                score,
                correct_answers: correctCount,
                wrong_answers: wrongCount,
                total_questions: totalQuestions,
                passed: correctCount >= Math.ceil(totalQuestions * 0.6),
            }, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setSaved(true)
            await onChallengeComplete?.(token)
        } catch (requestError) {
            console.error('Knowledge Challenge Save Error:', requestError)
            setError(requestError.response?.data?.message || 'Your score could not be saved.')
        } finally {
            setSaving(false)
        }
    }

    const moveNext = async () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex((previous) => previous + 1)
            setAnswer('')
            setAttempts(ANSWER_ATTEMPTS)
            setFeedback('')
            setFeedbackType('')
            setQuestionResolved(false)
            return
        }

        setCompleted(true)
        await saveChallenge()
    }

    const resetChallenge = () => {
        setStarted(false)
        setCompleted(false)
        setQuestions([])
        setError('')
        setFeedback('')
        setScore(0)
        setCorrectCount(0)
        setCurrentIndex(0)
        setSaved(false)
    }

    return (
        <main className="knowledge-challenge">
            <button className="knowledge-back" onClick={onBack}>
                <span aria-hidden="true">←</span> Back to Games
            </button>

            <header className="knowledge-header">
                <span className="knowledge-eyebrow">BRAINBUZZ KNOWLEDGE CHALLENGE</span>
                <h1>Curiosity, put to the test.</h1>
                <p>Five questions. Three tries each. How much do you know?</p>
            </header>

            {!started && !completed && (
                <section className="knowledge-setup">
                    <div className="knowledge-setup-copy">
                        <span className="knowledge-globe" aria-hidden="true">🌍</span>
                        <div>
                            <h2>Choose your subject</h2>
                            <p>Pick a topic or mix them all for a surprise round.</p>
                        </div>
                    </div>
                    <label htmlFor="knowledge-category">Category</label>
                    <select
                        id="knowledge-category"
                        value={selectedCategory}
                        onChange={(event) => setSelectedCategory(event.target.value)}
                        disabled={categoriesLoading || loading}
                    >
                        <option value="all">All categories</option>
                        {categories.map((category) => (
                            <option key={category.id} value={String(category.id)}>
                                {category.icon ? `${category.icon} ` : ''}{category.name}
                            </option>
                        ))}
                    </select>
                    <button
                        className="knowledge-primary"
                        onClick={startChallenge}
                        disabled={categoriesLoading || loading}
                    >
                        {loading ? 'Preparing questions...' : categoriesLoading ? 'Loading categories...' : 'Start challenge'}
                        {!loading && !categoriesLoading && <span aria-hidden="true">→</span>}
                    </button>
                </section>
            )}

            {started && !completed && question && (
                <section className="knowledge-round">
                    <div className="knowledge-round-meta">
                        <span>QUESTION {currentIndex + 1} <i>/</i> {questions.length}</span>
                        <strong>{score} <small>PTS</small></strong>
                    </div>
                    <div className="knowledge-progress" aria-label={`Question ${currentIndex + 1} of ${questions.length}`}>
                        <span style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                    </div>
                    <article className="knowledge-question">
                        <span className="knowledge-question-number">0{currentIndex + 1}</span>
                        <h2>{question.title}</h2>
                        {Array.isArray(question.clues) && question.clues.length > 0 && (
                            <ul>
                                {question.clues.map((clue, index) => <li key={`${question.id}-${index}`}>{clue}</li>)}
                            </ul>
                        )}
                    </article>
                    <form className="knowledge-answer-form" onSubmit={checkAnswer}>
                        <label htmlFor="knowledge-answer">Your answer</label>
                        <div>
                            <input
                                id="knowledge-answer"
                                value={answer}
                                onChange={(event) => setAnswer(event.target.value)}
                                placeholder="Type your answer"
                                autoComplete="off"
                                disabled={checking || questionResolved}
                            />
                            <button type="submit" disabled={checking || questionResolved || !answer.trim()}>
                                {checking ? 'Checking...' : 'Check answer'}
                            </button>
                        </div>
                    </form>
                    <div className={`knowledge-feedback ${feedbackType}`} aria-live="polite">
                        {feedback || `${attempts} tries available`}
                    </div>
                    {questionResolved && (
                        <button className="knowledge-next" onClick={moveNext} disabled={saving}>
                            {currentIndex + 1 === questions.length ? 'See results' : 'Next question'} <span aria-hidden="true">→</span>
                        </button>
                    )}
                </section>
            )}

            {completed && (
                <section className="knowledge-results">
                    <span className="knowledge-result-mark" aria-hidden="true">✦</span>
                    <p className="knowledge-eyebrow">ROUND COMPLETE</p>
                    <h2>{correctCount} <span>/ {questions.length}</span></h2>
                    <p className="knowledge-result-label">correct answers</p>
                    <div className="knowledge-result-score">{score} <span>POINTS</span></div>
                    <p className="knowledge-result-status" aria-live="polite">
                        {saving ? 'Saving your result...' : saved ? 'Result saved to your game history.' : 'Your round is complete.'}
                    </p>
                    {error && <p className="knowledge-error" role="alert">{error}</p>}
                    <div className="knowledge-result-actions">
                        {error && <button className="knowledge-secondary" onClick={saveChallenge} disabled={saving}>Retry saving</button>}
                        <button className="knowledge-primary" onClick={resetChallenge}>Play again <span aria-hidden="true">↻</span></button>
                        <button className="knowledge-secondary" onClick={onBack}>Back to games</button>
                    </div>
                </section>
            )}

            {error && !completed && <p className="knowledge-error" role="alert">{error}</p>}
        </main>
    )
}

export default KnowledgeChallenge
