import React, { useEffect, useMemo, useState } from 'react'
import './AdminDashboard.css'
import api from './services/api'

function AdminDashboard({ admin, onLogout }) {
    const [activeTab, setActiveTab] = useState('overview')

    const [questions, setQuestions] = useState([])
    const [feedback, setFeedback] = useState([])
    const [players, setPlayers] = useState([])
    const [loadingPlayers, setLoadingPlayers] = useState(true)
    const [playersError, setPlayersError] = useState('')
    const [searchPlayer, setSearchPlayer] = useState('')

    const [loadingQuestions, setLoadingQuestions] = useState(true)
    const [loadingFeedback, setLoadingFeedback] = useState(true)

    const [questionError, setQuestionError] = useState('')
    const [feedbackError, setFeedbackError] = useState('')

    const [searchQuestion, setSearchQuestion] = useState('')
    const [questionLevelFilter, setQuestionLevelFilter] = useState('all')
    const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('all')

    const [showQuestionForm, setShowQuestionForm] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState(null)

    const [deletingQuestionId, setDeletingQuestionId] = useState(null)
    const [deletingFeedbackId, setDeletingFeedbackId] = useState(null)

    const [questionForm, setQuestionForm] = useState({
        title: '',
        clues: ['', ''],
        answer: '',
        hint: '',
        level: 1,
        points: 10,
        is_active: true,
    })

    const token = localStorage.getItem('brainbuzz_admin_token')

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }

    const fetchQuestions = async () => {
        try {
            setLoadingQuestions(true)
            setQuestionError('')

            const response = await api.get(
                '/admin/questions',
                authConfig
            )

            setQuestions(response.data.questions || [])
        } catch (error) {
            console.error('Questions Fetch Error:', error)

            setQuestionError(
                error.response?.data?.message ||
                'Unable to load questions.'
            )
        } finally {
            setLoadingQuestions(false)
        }
    }

    const fetchFeedback = async () => {
        try {
            setLoadingFeedback(true)
            setFeedbackError('')

            const response = await api.get(
                '/admin/feedback',
                authConfig
            )

            setFeedback(response.data.feedback || [])
        } catch (error) {
            console.error('Feedback Fetch Error:', error)

            setFeedbackError(
                error.response?.data?.message ||
                'Unable to load feedback.'
            )
        } finally {
            setLoadingFeedback(false)
        }
    }

    const fetchPlayers = async (search = '') => {
    try {
        setLoadingPlayers(true)
        setPlayersError('')

        const response = await api.get(
            `/admin/players${search ? `?search=${encodeURIComponent(search)}` : ''}`,
            authConfig
        )

        setPlayers(response.data.players || [])
    } catch (error) {
        console.error('Players Fetch Error:', error)

        setPlayersError(
            error.response?.data?.message ||
            'Unable to load players.'
        )
    } finally {
        setLoadingPlayers(false)
    }
}

    useEffect(() => {
        fetchQuestions()
        fetchFeedback()
        fetchPlayers()
    }, [])

    // Automatic Player Search
useEffect(() => {
    if (activeTab !== 'players') {
        return
    }

    const searchTimer = setTimeout(() => {
        fetchPlayers(searchPlayer)
    }, 400)

    return () => clearTimeout(searchTimer)
}, [searchPlayer, activeTab])

    const activeQuestions = questions.filter(
        (question) => Boolean(question.is_active)
    ).length

    const inactiveQuestions = questions.length - activeQuestions

    const averageRating =
        feedback.length > 0
            ? (
                feedback.reduce(
                    (total, item) => total + Number(item.rating || 0),
                    0
                ) / feedback.length
            ).toFixed(1)
            : '0.0'

    const filteredQuestions = useMemo(() => {
        return questions.filter((question) => {
            const search = searchQuestion.toLowerCase().trim()

            const matchesSearch =
                !search ||
                question.title?.toLowerCase().includes(search) ||
                question.answer?.toLowerCase().includes(search)

            const matchesLevel =
                questionLevelFilter === 'all' ||
                String(question.level) === String(questionLevelFilter)

            return matchesSearch && matchesLevel
        })
    }, [questions, searchQuestion, questionLevelFilter])

    const filteredFeedback = useMemo(() => {
        return feedback.filter((item) => {
            if (feedbackRatingFilter === 'all') {
                return true
            }

            return String(item.rating) === String(feedbackRatingFilter)
        })
    }, [feedback, feedbackRatingFilter])

    const resetQuestionForm = () => {
        setQuestionForm({
            title: '',
            clues: ['', ''],
            answer: '',
            hint: '',
            level: 1,
            points: 10,
            is_active: true,
        })

        setEditingQuestion(null)
        setShowQuestionForm(false)
    }

    const openAddQuestion = () => {
        setEditingQuestion(null)

        setQuestionForm({
            title: '',
            clues: ['', ''],
            answer: '',
            hint: '',
            level: 1,
            points: 10,
            is_active: true,
        })

        setShowQuestionForm(true)
    }

    const openEditQuestion = (question) => {
        setEditingQuestion(question)

        let clues = Array.isArray(question.clues)
            ? question.clues
            : []

        if (clues.length < 2) {
            clues = [...clues, '']
        }

        setQuestionForm({
            title: question.title || '',
            clues,
            answer: question.answer || '',
            hint: question.hint || '',
            level: question.level || 1,
            points: question.points || 10,
            is_active: Boolean(question.is_active),
        })

        setShowQuestionForm(true)
    }

    const handleQuestionInput = (e) => {
        const { name, value, type, checked } = e.target

        setQuestionForm((previous) => ({
            ...previous,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleClueChange = (index, value) => {
        setQuestionForm((previous) => {
            const clues = [...previous.clues]
            clues[index] = value

            return {
                ...previous,
                clues,
            }
        })
    }

    const addClue = () => {
        if (questionForm.clues.length >= 5) {
            return
        }

        setQuestionForm((previous) => ({
            ...previous,
            clues: [...previous.clues, ''],
        }))
    }

    const removeClue = (index) => {
        if (questionForm.clues.length <= 1) {
            return
        }

        setQuestionForm((previous) => ({
            ...previous,
            clues: previous.clues.filter(
                (_, clueIndex) => clueIndex !== index
            ),
        }))
    }

    const handleQuestionSubmit = async (e) => {
        e.preventDefault()

        const cleanedClues = questionForm.clues
            .map((clue) => clue.trim())
            .filter(Boolean)

        if (cleanedClues.length === 0) {
            alert('Please enter at least one clue.')
            return
        }

        try {
            const payload = {
                title: questionForm.title.trim(),
                clues: cleanedClues,
                answer: questionForm.answer.trim(),
                hint: questionForm.hint.trim() || null,
                level: Number(questionForm.level),
                points: Number(questionForm.points),
                is_active: Boolean(questionForm.is_active),
            }

            if (editingQuestion) {
                await api.put(
                    `/questions/${editingQuestion.id}`,
                    payload,
                    authConfig
                )
            } else {
                await api.post(
                    '/questions',
                    payload,
                    authConfig
                )
            }

            await fetchQuestions()
            resetQuestionForm()

        } catch (error) {
            console.error('Question Save Error:', error)

            alert(
                error.response?.data?.message ||
                'Unable to save question.'
            )
        }
    }

    const handleDeleteQuestion = async (id) => {
        if (
            !window.confirm(
                'Are you sure you want to delete this question?'
            )
        ) {
            return
        }

        try {
            setDeletingQuestionId(id)

            await api.delete(
                `/questions/${id}`,
                authConfig
            )

            setQuestions((previous) =>
                previous.filter((question) => question.id !== id)
            )

        } catch (error) {
            console.error('Question Delete Error:', error)

            alert(
                error.response?.data?.message ||
                'Unable to delete question.'
            )
        } finally {
            setDeletingQuestionId(null)
        }
    }

    const handleToggleQuestion = async (question) => {
        try {
            await api.put(
                `/questions/${question.id}`,
                {
                    is_active: !Boolean(question.is_active),
                },
                authConfig
            )

            setQuestions((previous) =>
                previous.map((item) =>
                    item.id === question.id
                        ? {
                            ...item,
                            is_active: !Boolean(item.is_active),
                        }
                        : item
                )
            )

        } catch (error) {
            console.error('Question Status Error:', error)

            alert(
                error.response?.data?.message ||
                'Unable to update question status.'
            )
        }
    }

    const handleDeleteFeedback = async (id) => {
    if (
        !window.confirm(
            'Are you sure you want to delete this feedback?'
        )
    ) {
        return
    }

    try {
        setDeletingFeedbackId(id)

        await api.delete(
            `/admin/feedback/${id}`,
            authConfig
        )

        setFeedback((previous) =>
            previous.filter((item) => item.id !== id)
        )

    } catch (error) {
        console.error('Feedback Delete Error:', error)

        alert(
            error.response?.data?.message ||
            'Unable to delete feedback.'
        )
    } finally {
        setDeletingFeedbackId(null)
    }
}

// Update Player Active / Inactive Status
const handlePlayerStatusToggle = async (player) => {
    try {
        const newStatus = !Boolean(player.is_active)

        await api.put(
            `/admin/players/${player.id}/status`,
            {
                is_active: newStatus
            },
            authConfig
        )

        setPlayers((previous) =>
            previous.map((item) =>
                item.id === player.id
                    ? { ...item, is_active: newStatus }
                    : item
            )
        )

    } catch (error) {
        console.error('Player Status Error:', error)

        alert(
            error.response?.data?.message ||
            'Unable to update player status.'
        )
    }
}

// Delete Player
const handleDeletePlayer = async (id) => {
    if (
        !window.confirm(
            'Are you sure you want to delete this player?'
        )
    ) {
        return
    }

    try {
        await api.delete(
            `/admin/players/${id}`,
            authConfig
        )

        setPlayers((previous) =>
            previous.filter((player) => player.id !== id)
        )

        alert('Player deleted successfully.')

    } catch (error) {
        console.error('Player Delete Error:', error)

        alert(
            error.response?.data?.message ||
            'Unable to delete player.'
        )
    }
}

    return (
        <div className="admin-dashboard">

            <header className="admin-header">
                <div className="admin-brand">
                    <div className="admin-logo">B</div>

                    <div>
                        <h2>BrainBuzz Admin</h2>
                        <span>Management Dashboard</span>
                    </div>
                </div>

                <div className="admin-header-right">
                    <div className="admin-user">
                        <div className="admin-avatar">
                            {(admin?.name || 'A')
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {admin?.name || 'Admin'}
                            </strong>

                            <small>Administrator</small>
                        </div>
                    </div>

                    <button
                        className="admin-logout-btn"
                        onClick={onLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className="admin-layout">

              <aside className="admin-sidebar">

    <button
        className={`admin-nav-btn ${
            activeTab === 'overview' ? 'active' : ''
        }`}
        onClick={() => setActiveTab('overview')}
    >
        <span>▦</span>
        Overview
    </button>

    <button
        className={`admin-nav-btn ${
            activeTab === 'questions' ? 'active' : ''
        }`}
        onClick={() => setActiveTab('questions')}
    >
        <span>?</span>
        Questions
    </button>

    <button
        className={`admin-nav-btn ${
            activeTab === 'feedback' ? 'active' : ''
        }`}
        onClick={() => setActiveTab('feedback')}
    >
        <span>💬</span>
        Feedback
    </button>

    <button
        className={`admin-nav-btn ${
            activeTab === 'players' ? 'active' : ''
        }`}
        onClick={() => {
            setActiveTab('players')
            fetchPlayers()
        }}
    >
        <span>👥</span>
        Players
    </button>

</aside>

                <main className="admin-main">

                    {activeTab === 'overview' && (
                        <>
                            <div className="admin-page-heading">
                                <div>
                                    <span className="admin-eyebrow">
                                        DASHBOARD
                                    </span>

                                    <h1>Welcome back, {admin?.name || 'Admin'} 👋</h1>

                                    <p>
                                        Manage BrainBuzz content and player feedback from one place.
                                    </p>
                                </div>

                                <button
                                    className="admin-primary-btn"
                                    onClick={openAddQuestion}
                                >
                                    + Add Question
                                </button>
                            </div>

                            <div className="admin-stats-grid">

                                <div className="admin-stat-card">
                                    <div className="admin-stat-icon purple">
                                        ?
                                    </div>

                                    <div>
                                        <span>Total Questions</span>
                                        <strong>{questions.length}</strong>
                                    </div>
                                </div>

                                <div className="admin-stat-card">
                                    <div className="admin-stat-icon green">
                                        ✓
                                    </div>

                                    <div>
                                        <span>Active Questions</span>
                                        <strong>{activeQuestions}</strong>
                                    </div>
                                </div>

                                <div className="admin-stat-card">
                                    <div className="admin-stat-icon orange">
                                        💬
                                    </div>

                                    <div>
                                        <span>Total Feedback</span>
                                        <strong>{feedback.length}</strong>
                                    </div>
                                </div>

                                <div className="admin-stat-card">
                                    <div className="admin-stat-icon blue">
                                        ★
                                    </div>

                                    <div>
                                        <span>Average Rating</span>
                                        <strong>{averageRating}</strong>
                                    </div>
                                </div>

                            </div>

                            <div className="admin-overview-grid">

                                <section className="admin-panel-card">
                                    <div className="admin-panel-header">
                                        <div>
                                            <h2>Question Overview</h2>
                                            <p>Current question status</p>
                                        </div>

                                        <button
                                            onClick={() =>
                                                setActiveTab('questions')
                                            }
                                        >
                                            Manage
                                        </button>
                                    </div>

                                    <div className="admin-progress-row">
                                        <div>
                                            <span>Active</span>
                                            <strong>
                                                {activeQuestions}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Inactive</span>
                                            <strong>
                                                {inactiveQuestions}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="admin-progress">
                                        <div
                                            style={{
                                                width: questions.length
                                                    ? `${(activeQuestions / questions.length) * 100}%`
                                                    : '0%',
                                            }}
                                        ></div>
                                    </div>

                                    <p className="admin-progress-text">
                                        {questions.length
                                            ? `${Math.round(
                                                (activeQuestions /
                                                    questions.length) *
                                                100
                                            )}% of questions are active`
                                            : 'No questions available'}
                                    </p>
                                </section>

                                <section className="admin-panel-card">
                                    <div className="admin-panel-header">
                                        <div>
                                            <h2>Recent Feedback</h2>
                                            <p>Latest player responses</p>
                                        </div>

                                        <button
                                            onClick={() =>
                                                setActiveTab('feedback')
                                            }
                                        >
                                            View All
                                        </button>
                                    </div>

                                    {loadingFeedback ? (
                                        <p className="admin-muted">
                                            Loading feedback...
                                        </p>
                                    ) : feedback.length === 0 ? (
                                        <p className="admin-muted">
                                            No feedback yet.
                                        </p>
                                    ) : (
                                        <div className="admin-mini-feedback-list">
                                            {feedback
                                                .slice(0, 4)
                                                .map((item) => (
                                                    <div
                                                        className="admin-mini-feedback"
                                                        key={item.id}
                                                    >
                                                        <div className="admin-mini-avatar">
                                                            {(item.user?.name ||
                                                                'U')
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {item.user?.name ||
                                                                    'Unknown User'}
                                                            </strong>

                                                            <p>
                                                                {item.message}
                                                            </p>
                                                        </div>

                                                        <span>
                                                            {'★'.repeat(
                                                                Number(
                                                                    item.rating
                                                                )
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </section>

                            </div>
                        </>
                    )}

                    {activeTab === 'questions' && (
                        <section>

                            <div className="admin-page-heading">
                                <div>
                                    <span className="admin-eyebrow">
                                        CONTENT MANAGEMENT
                                    </span>

                                    <h1>Questions</h1>

                                    <p>
                                        Add, edit and manage BrainBuzz questions.
                                    </p>
                                </div>

                                <button
                                    className="admin-primary-btn"
                                    onClick={openAddQuestion}
                                >
                                    + Add Question
                                </button>
                            </div>

                            <div className="admin-toolbar">

                                <input
                                    type="text"
                                    placeholder="Search question or answer..."
                                    value={searchQuestion}
                                    onChange={(e) =>
                                        setSearchQuestion(e.target.value)
                                    }
                                />

                                <select
                                    value={questionLevelFilter}
                                    onChange={(e) =>
                                        setQuestionLevelFilter(
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="all">
                                        All Levels
                                    </option>

                                    {Array.from(
                                        { length: Math.max(5, ...questions.map(q => Number(q.level) || 1)) + 1 },
                                        (_, i) => i + 1
                                    ).map((level) => (
                                        <option
                                            key={level}
                                            value={level}
                                        >
                                            Level {level}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    className="admin-refresh-btn"
                                    onClick={fetchQuestions}
                                >
                                    ↻ Refresh
                                </button>

                            </div>

                            {loadingQuestions ? (
                                <div className="admin-empty-state">
                                    Loading questions...
                                </div>
                            ) : questionError ? (
                                <div className="admin-error-box">
                                    {questionError}
                                </div>
                            ) : filteredQuestions.length === 0 ? (
                                <div className="admin-empty-state">
                                    No questions found.
                                </div>
                            ) : (
                                <div className="admin-table-wrapper">

                                    <table className="admin-table">

                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Question</th>
                                                <th>Level</th>
                                                <th>Points</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredQuestions.map(
                                                (question) => (
                                                    <tr key={question.id}>
                                                        <td>
                                                            #{question.id}
                                                        </td>

                                                        <td>
                                                            <div className="admin-question-title">
                                                                {question.title}
                                                            </div>

                                                            <small>
                                                                Answer: {question.answer}
                                                            </small>
                                                        </td>

                                                        <td>
                                                            <span className="admin-level-badge">
                                                                Level {question.level}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <strong>
                                                                {question.points}
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            <button
                                                                className={`admin-status-btn ${
                                                                    question.is_active
                                                                        ? 'active'
                                                                        : 'inactive'
                                                                }`}
                                                                onClick={() =>
                                                                    handleToggleQuestion(
                                                                        question
                                                                    )
                                                                }
                                                            >
                                                                {question.is_active
                                                                    ? 'Active'
                                                                    : 'Inactive'}
                                                            </button>
                                                        </td>

                                                        <td>
                                                            <div className="admin-action-buttons">

                                                                <button
                                                                    className="admin-edit-btn"
                                                                    onClick={() =>
                                                                        openEditQuestion(
                                                                            question
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>

                                                                <button
                                                                    className="admin-delete-btn"
                                                                    onClick={() =>
                                                                        handleDeleteQuestion(
                                                                            question.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        deletingQuestionId ===
                                                                        question.id
                                                                    }
                                                                >
                                                                    {deletingQuestionId ===
                                                                    question.id
                                                                        ? 'Deleting...'
                                                                        : 'Delete'}
                                                                </button>

                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>

                                    </table>

                                </div>
                            )}

                        </section>
                    )}

                    {activeTab === 'feedback' && (
                        <section>

                            <div className="admin-page-heading">
                                <div>
                                    <span className="admin-eyebrow">
                                        PLAYER VOICE
                                    </span>

                                    <h1>Feedback</h1>

                                    <p>
                                        Review what players think about BrainBuzz.
                                    </p>
                                </div>

                                <div className="admin-feedback-total">
                                    {feedback.length} Responses
                                </div>
                            </div>

                            <div className="admin-toolbar">

                                <select
                                    value={feedbackRatingFilter}
                                    onChange={(e) =>
                                        setFeedbackRatingFilter(
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="all">
                                        All Ratings
                                    </option>

                                    {[5, 4, 3, 2, 1].map((rating) => (
                                        <option
                                            key={rating}
                                            value={rating}
                                        >
                                            {rating} Stars
                                        </option>
                                    ))}
                                </select>

                                <button
                                    className="admin-refresh-btn"
                                    onClick={fetchFeedback}
                                >
                                    ↻ Refresh
                                </button>

                            </div>

                            {loadingFeedback ? (
                                <div className="admin-empty-state">
                                    Loading feedback...
                                </div>
                            ) : feedbackError ? (
                                <div className="admin-error-box">
                                    {feedbackError}
                                </div>
                            ) : filteredFeedback.length === 0 ? (
                                <div className="admin-empty-state">
                                    No feedback found.
                                </div>
                            ) : (
                                <div className="admin-feedback-grid">

                                    {filteredFeedback.map((item) => (
                                        <div
                                            className="admin-feedback-card"
                                            key={item.id}
                                        >
                                            <div className="admin-feedback-top">

                                                <div className="admin-feedback-user">

                                                    <div className="admin-feedback-avatar">
                                                        {(item.user?.name ||
                                                            'U')
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <h3>
                                                            {item.user?.name ||
                                                                'Unknown User'}
                                                        </h3>

                                                        <p>
                                                            {item.user?.email ||
                                                                'No email'}
                                                        </p>
                                                    </div>

                                                </div>

                                                <button
                                                    className="admin-delete-btn"
                                                    onClick={() =>
                                                        handleDeleteFeedback(
                                                            item.id
                                                        )
                                                    }
                                                    disabled={
                                                        deletingFeedbackId ===
                                                        item.id
                                                    }
                                                >
                                                    {deletingFeedbackId ===
                                                    item.id
                                                        ? 'Deleting...'
                                                        : 'Delete'}
                                                </button>

                                            </div>

                                            <div className="admin-feedback-stars">
                                                {'★'.repeat(
                                                    Number(item.rating)
                                                )}
                                                {'☆'.repeat(
                                                    5 -
                                                    Number(item.rating)
                                                )}
                                            </div>

                                            <p className="admin-feedback-message">
                                                {item.message}
                                            </p>

                                            <small className="admin-feedback-date">
                                                {new Date(
                                                    item.created_at
                                                ).toLocaleString()}
                                            </small>

                                        </div>
                                    ))}

                                </div>
                            )}

                        </section>
                    )}
                 

                    {/* PLAYERS MANAGEMENT SECTION */}
                    {activeTab === 'players' && (
                        <section className="admin-section">

                            <div className="admin-page-heading">
                                <div>
                                    <span className="admin-eyebrow">
                                        USER MANAGEMENT
                                    </span>

                                    <h1>Player Management</h1>

                                    <p>
                                        Manage registered BrainBuzz players.
                                    </p>
                                </div>
                            </div>

                            <div className="admin-player-toolbar">

<div className="admin-player-search">
    <input
        type="text"
        placeholder="Search by name, email or phone..."
        value={searchPlayer}
        onChange={(e) => setSearchPlayer(e.target.value)}
    />
</div>

                            </div>

                            {loadingPlayers ? (
                                <div className="admin-empty-state">
                                    Loading players...
                                </div>
                            ) : playersError ? (
                                <div className="admin-error-message">
                                    {playersError}
                                </div>
                            ) : players.length === 0 ? (
                                <div className="admin-empty-state">
                                    <h3>No Players Found</h3>
                                    <p>
                                        No registered players available.
                                    </p>
                                </div>
                            ) : (
                                <div className="admin-players-table-wrapper">

                                    <table className="admin-players-table">

                                        <thead>
                                            <tr>
                                                <th>Player</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Joined Date</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {players.map((player) => (
                                                <tr key={player.id}>

                                                    <td>
                                                        <div className="admin-player-info">

                                                            <div className="admin-player-avatar">
                                                                {player.profile_image ? (
                                                                    <img
                                                                        src={
                                                                            player.profile_image.startsWith('http')
                                                                                ? player.profile_image
                                                                                : `http://127.0.0.1:8000/storage/${player.profile_image}`
                                                                        }
                                                                        alt={player.name}
                                                                    />
                                                                ) : (
                                                                    (player.name || 'U')
                                                                        .charAt(0)
                                                                        .toUpperCase()
                                                                )}
                                                            </div>

                                                            <strong>
                                                                {player.name}
                                                            </strong>

                                                        </div>
                                                    </td>

                                                    <td>
                                                        {player.email || 'N/A'}
                                                    </td>

                                                    <td>
                                                        {player.phone || 'N/A'}
                                                    </td>

                                                    <td>
                                                        {player.created_at
                                                            ? new Date(
                                                                player.created_at
                                                            ).toLocaleDateString()
                                                            : 'N/A'}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`admin-player-status ${
                                                                player.is_active
                                                                    ? 'active'
                                                                    : 'inactive'
                                                            }`}
                                                        >
                                                            {player.is_active
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="admin-player-actions">

                                                            <button
                                                                className={`admin-player-toggle ${
                                                                    player.is_active
                                                                        ? 'deactivate'
                                                                        : 'activate'
                                                                }`}
                                                                onClick={() =>
                                                                    handlePlayerStatusToggle(player)
                                                                }
                                                            >
                                                                {player.is_active
                                                                    ? 'Deactivate'
                                                                    : 'Activate'}
                                                            </button>

                                                            <button
                                                                className="admin-delete-btn"
                                                                onClick={() =>
                                                                    handleDeletePlayer(player.id)
                                                                }
                                                            >
                                                                Delete
                                                            </button>

                                                        </div>
                                                    </td>

                                                </tr>
                                            ))}
                                        </tbody>

                                    </table>

                                </div>
                            )}

                        </section>
                    )}

                </main>
            </div>

            {showQuestionForm && (
                <div
                    className="admin-modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            resetQuestionForm()
                        }
                    }}
                >

                    <div className="admin-question-modal">

                        <div className="admin-modal-header">
                            <div>
                                <span className="admin-eyebrow">
                                    {editingQuestion
                                        ? 'EDIT QUESTION'
                                        : 'NEW QUESTION'}
                                </span>

                                <h2>
                                    {editingQuestion
                                        ? 'Edit Question'
                                        : 'Add Question'}
                                </h2>
                            </div>

                            <button
                                className="admin-modal-close"
                                onClick={resetQuestionForm}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleQuestionSubmit}>

                            <label>Question</label>

                            <input
                                type="text"
                                name="title"
                                value={questionForm.title}
                                onChange={handleQuestionInput}
                                placeholder="Enter question"
                                required
                                maxLength={255}
                            />

                            <label>Answer</label>

                            <input
                                type="text"
                                name="answer"
                                value={questionForm.answer}
                                onChange={handleQuestionInput}
                                placeholder="Enter correct answer"
                                required
                                maxLength={255}
                            />

                            <div className="admin-form-row">

                                <div>
                                    <label>Level</label>

                                    <input
                                        type="number"
                                        name="level"
                                        min="1"
                                        step="1"
                                        value={questionForm.level}
                                        onChange={handleQuestionInput}
                                        placeholder="Enter level number"
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Points</label>

                                    <input
                                        type="number"
                                        name="points"
                                        min="0"
                                        value={questionForm.points}
                                        onChange={handleQuestionInput}
                                    />
                                </div>

                            </div>

                            <label>Clues</label>

                            <div className="admin-clues">

                                {questionForm.clues.map(
                                    (clue, index) => (
                                        <div
                                            className="admin-clue-row"
                                            key={index}
                                        >
                                            <input
                                                type="text"
                                                value={clue}
                                                onChange={(e) =>
                                                    handleClueChange(
                                                        index,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Clue ${index + 1}`}
                                            />

                                            {questionForm.clues.length >
                                                1 && (
                                                <button
                                                    type="button"
                                                    className="admin-remove-clue"
                                                    onClick={() =>
                                                        removeClue(
                                                            index
                                                        )
                                                    }
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    )
                                )}

                            </div>

                            {questionForm.clues.length < 5 && (
                                <button
                                    type="button"
                                    className="admin-add-clue"
                                    onClick={addClue}
                                >
                                    + Add Clue
                                </button>
                            )}

                            <label>Hint</label>

                            <textarea
                                name="hint"
                                value={questionForm.hint}
                                onChange={handleQuestionInput}
                                placeholder="Optional hint"
                                rows="3"
                            ></textarea>

                            <label className="admin-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={questionForm.is_active}
                                    onChange={handleQuestionInput}
                                />

                                <span>
                                    Question is active
                                </span>
                            </label>

                            <div className="admin-modal-actions">

                                <button
                                    type="button"
                                    className="admin-cancel-btn"
                                    onClick={resetQuestionForm}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="admin-primary-btn"
                                >
                                    {editingQuestion
                                        ? 'Update Question'
                                        : 'Create Question'}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    )
}

export default AdminDashboard