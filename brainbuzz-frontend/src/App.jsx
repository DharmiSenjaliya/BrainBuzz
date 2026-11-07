import { useEffect, useState } from 'react'
import api from './services/api'
import './App.css'
import Leaderboard from './Leaderboard'
import Profile from './Profile'
import HowToPlay from './HowToPlay'
import Feedback from './Feedback'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'
import EditProfile from './EditProfile'
import ChangePassword from './ChangePassword'
import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'
import Achievements from './Achievements'

// NAVBAR COMPONENT
function Navbar({ user, onLogout, theme, onToggleTheme }) {
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notificationLoading, setNotificationLoading] = useState(false)

    const fetchNotifications = async () => {
        const token = localStorage.getItem('brainbuzz_token')
        if (!token) return

        try {
            setNotificationLoading(true)

            const response = await api.get('/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.data.success) {
                setNotifications(response.data.notifications || [])
                setUnreadCount(response.data.unread_count || 0)
            }
        } catch (error) {
            console.error('Notification Fetch Error:', error)
        } finally {
            setNotificationLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    const markAsRead = async (id) => {
        const token = localStorage.getItem('brainbuzz_token')

        try {
            await api.patch(`/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            })

            setNotifications((previous) =>
                previous.map((item) =>
                    item.id === id
                        ? { ...item, is_read: true }
                        : item
                )
            )

            setUnreadCount((previous) => Math.max(0, previous - 1))
        } catch (error) {
            console.error('Mark Read Error:', error)
        }
    }

    const markAllAsRead = async () => {
        const token = localStorage.getItem('brainbuzz_token')

        try {
            await api.patch('/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` },
            })

            setNotifications((previous) =>
                previous.map((item) => ({ ...item, is_read: true }))
            )

            setUnreadCount(0)
        } catch (error) {
            console.error('Mark All Read Error:', error)
        }
    }

    const deleteNotification = async (id) => {
        const token = localStorage.getItem('brainbuzz_token')

        try {
            await api.delete(`/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            const deleted = notifications.find((item) => item.id === id)

            setNotifications((previous) =>
                previous.filter((item) => item.id !== id)
            )

            if (deleted && !deleted.is_read) {
                setUnreadCount((previous) => Math.max(0, previous - 1))
            }
        } catch (error) {
            console.error('Delete Notification Error:', error)
        }
    }

    const handleNotificationBell = () => {
        const next = !showNotifications
        setShowNotifications(next)

        if (next) fetchNotifications()
    }

    return (
        <header className="navbar">
            <h2>🧠 BrainBuzz</h2>

            <div className="user-area">
                <button className="theme-btn" onClick={onToggleTheme}>
                    {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                </button>

                <div className="notification-wrapper">
                    <button
                        type="button"
                        className="notification-bell-btn"
                        onClick={handleNotificationBell}
                        aria-label="Notifications"
                    >
                        🔔
                        {unreadCount > 0 && (
                            <span className="notification-count">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <div>
                                    <h3>Notifications</h3>
                                    <p>{unreadCount} unread</p>
                                </div>

                                <button
                                    type="button"
                                    className="notification-close-btn"
                                    onClick={() => setShowNotifications(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    className="mark-all-read-btn"
                                    onClick={markAllAsRead}
                                >
                                    Mark All as Read
                                </button>
                            )}

                            <div className="notification-list">
                                {notificationLoading ? (
                                    <p className="notification-empty">
                                        Loading notifications...
                                    </p>
                                ) : notifications.length === 0 ? (
                                    <p className="notification-empty">
                                        🔔 No notifications yet.
                                    </p>
                                ) : (
                                    notifications.map((item) => (
                                        <div
                                            className={`notification-item ${
                                                item.is_read ? 'read' : 'unread'
                                            }`}
                                            key={item.id}
                                        >
                                            <div className="notification-item-content">
                                                <h4>
                                                    {item.type === 'achievement'
                                                        ? '🏆 '
                                                        : item.type === 'game'
                                                            ? '🎮 '
                                                            : '📢 '}
                                                    {item.title}
                                                </h4>

                                                <p>{item.message}</p>

                                                <small>
                                                    {item.created_at
                                                        ? new Date(item.created_at).toLocaleString()
                                                        : ''}
                                                </small>
                                            </div>

                                            <div className="notification-actions">
                                                {!item.is_read && (
                                                    <button
                                                        type="button"
                                                        onClick={() => markAsRead(item.id)}
                                                        title="Mark as read"
                                                    >
                                                        ✓
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => deleteNotification(item.id)}
                                                    title="Delete notification"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button
                                type="button"
                                className="notification-refresh-btn"
                                onClick={fetchNotifications}
                            >
                                ↻ Refresh
                            </button>
                        </div>
                    )}
                </div>

                <span>Hi, {user.name}</span>

                <button className="logout-btn" onClick={onLogout}>
                    Logout
                </button>
            </div>
        </header>
    )
}

// MAIN APP
function App() {
    const [isResetPasswordPage, setIsResetPasswordPage] = useState(
        () => window.location.pathname === '/reset-password'
    )

    const [theme, setTheme] = useState(
        localStorage.getItem('brainbuzz_theme') || 'light'
    )

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('brainbuzz_theme', newTheme)
    }

    const [showAchievements, setShowAchievements] = useState(false)
    const [showLeaderboard, setShowLeaderboard] = useState(false)

    const [dashboardStats, setDashboardStats] = useState({
        games_played: 0,
        total_score: 0,
        total_correct: 0,
        total_wrong: 0,
        accuracy: 0,
    })

    const fetchDashboard = async (token) => {
        try {
            const response = await api.get('/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.data.success) {
                setDashboardStats(response.data.stats)
            }
        } catch (error) {
            console.error('Dashboard Error:', error)
        }
    }

    useEffect(() => {
        document.body.className = `${theme}-theme`
    }, [theme])

    const [user, setUser] = useState(null)
    const [authMode, setAuthMode] = useState('login')
    const [authLoading, setAuthLoading] = useState(true)
    const [authSubmitting, setAuthSubmitting] = useState(false)

    const [showProfile, setShowProfile] = useState(
        () => sessionStorage.getItem('brainbuzz_player_page') === 'profile'
    )

    const [showEditProfile, setShowEditProfile] = useState(false)
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)

    useEffect(() => {
        if (showProfile) {
            sessionStorage.setItem('brainbuzz_player_page', 'profile')
        } else {
            sessionStorage.removeItem('brainbuzz_player_page')
        }
    }, [showProfile])

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [authMessage, setAuthMessage] = useState('')

    const [showHowToPlay, setShowHowToPlay] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)

    const [showAdminLogin, setShowAdminLogin] = useState(false)
    const [admin, setAdmin] = useState(null)

    // LEVEL AND GAME STATES
    const [selectedLevel, setSelectedLevel] = useState(1)
    const [levelProgress, setLevelProgress] = useState([])
    const [currentUnlockedLevel, setCurrentUnlockedLevel] = useState(1)

    const [questions, setQuestions] = useState([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

    const [answer, setAnswer] = useState('')
    const [score, setScore] = useState(0)
    const [correctCount, setCorrectCount] = useState(0)
    const [wrongCount, setWrongCount] = useState(0)

    const [attempts, setAttempts] = useState(3)
    const [message, setMessage] = useState('')
    const [showHint, setShowHint] = useState(false)
    const [hintsRemaining, setHintsRemaining] = useState(3)
    const [hintUsedForQuestion, setHintUsedForQuestion] = useState(false)

    const [completed, setCompleted] = useState(false)
    const [answeredCorrectly, setAnsweredCorrectly] = useState(false)
    const [questionFinished, setQuestionFinished] = useState(false)

    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(false)
    const [showDashboard, setShowDashboard] = useState(true)

    const [savingResult, setSavingResult] = useState(false)
    const [resultSaved, setResultSaved] = useState(false)
    const [resultError, setResultError] = useState('')

    const question = questions[currentQuestionIndex]

    const resetGame = () => {
        setCurrentQuestionIndex(0)
        setAnswer('')
        setScore(0)
        setCorrectCount(0)
        setWrongCount(0)
        setAttempts(3)
        setMessage('')
        setShowHint(false)
        setHintsRemaining(3)
        setHintUsedForQuestion(false)
        setCompleted(false)
        setAnsweredCorrectly(false)
        setQuestionFinished(false)
    }

  const fetchLevelProgress = async (token) => {
    try {
        const response = await api.get('/level-progress', {
            headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data.success) {
            const levels = response.data.levels || []

            setLevelProgress(levels)

            const unlockedLevels = levels
                .filter((item) => item.is_unlocked)
                .map((item) => Number(item.level))

            const nextLevel = response.data.current_level ??
                Math.max(1, ...unlockedLevels)

            setCurrentUnlockedLevel(nextLevel)
        }
    } catch (error) {
        console.error('Level Progress Error:', error)
    }
}


    const fetchQuestions = async (token, level = selectedLevel) => {
        try {
            setLoading(true)
            setMessage('')

            const response = await api.get(`/questions?level=${level}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.data.questions?.length > 0) {
                setQuestions(response.data.questions)
                setSelectedLevel(level)
                resetGame()
            } else {
                setQuestions([])
                setMessage(`No questions available in Level ${level}.`)
            }
        } catch (error) {
            console.error('Question API Error:', error.response?.data || error)

            setQuestions([])
            setMessage(
                error.response?.data?.message ||
                'Unable to load questions. Please check the API.'
            )
        } finally {
            setLoading(false)
        }
    }

    // CHECK LOGIN
    useEffect(() => {
        const checkLogin = async () => {
            const adminToken = localStorage.getItem('brainbuzz_admin_token')

            if (adminToken) {
                try {
                    const response = await api.get('/me', {
                        headers: { Authorization: `Bearer ${adminToken}` },
                    })

                    const adminUser = response.data.user

                    if (adminUser?.is_admin) {
                        setAdmin(adminUser)
                        setShowAdminLogin(false)
                        setAuthLoading(false)
                        return
                    }

                    localStorage.removeItem('brainbuzz_admin_token')
                } catch (error) {
                    console.error('Admin Login Check Error:', error)
                    localStorage.removeItem('brainbuzz_admin_token')
                }
            }

            const token = localStorage.getItem('brainbuzz_token')

            if (!token) {
                setAuthLoading(false)
                return
            }

            try {
                const response = await api.get('/me', {
                    headers: { Authorization: `Bearer ${token}` },
                })

                setUser(response.data.user)
                await fetchDashboard(token)
                await fetchLevelProgress(token)
                await fetchQuestions(token, 1)
            } catch (error) {
                console.error('Player Login Check Error:', error)
                localStorage.removeItem('brainbuzz_token')
                setUser(null)
            } finally {
                setAuthLoading(false)
            }
        }

        checkLogin()
    }, [])

    // LOGIN / REGISTER
    const handleAuth = async (e) => {
        e.preventDefault()
        setAuthMessage('')

        if (authMode === 'register' && password !== passwordConfirmation) {
            setAuthMessage('Passwords do not match!')
            return
        }

        try {
            setAuthSubmitting(true)

            const endpoint = authMode === 'register' ? '/register' : '/login'

            const payload = authMode === 'register'
                ? {
                    name,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                }
                : { email, password }

            const response = await api.post(endpoint, payload)

            if (authMode === 'register') {
                setAuthMode('login')
                setPassword('')
                setPasswordConfirmation('')
                setAuthMessage('Registration successful! Please login now.')
                return
            }

            const token = response.data.token

            localStorage.setItem('brainbuzz_token', token)
            setUser(response.data.user)

            await fetchDashboard(token)
            await fetchLevelProgress(token)

            setPassword('')
            setPasswordConfirmation('')
            setAuthMessage('')

            await fetchQuestions(token, 1)
        } catch (error) {
            console.error('Authentication Error:', error)

            const errors = error.response?.data?.errors

            if (errors) {
                const firstError = Object.values(errors)[0]
                setAuthMessage(firstError?.[0] || 'Please check your details.')
            } else {
                setAuthMessage(
                    error.response?.data?.message ||
                    'Something went wrong. Please try again.'
                )
            }
        } finally {
            setAuthSubmitting(false)
        }
    }

    const handleAdminLogin = (adminData) => {
        setAdmin(adminData)
        setShowAdminLogin(false)
    }

    const handleProfileUpdated = (updatedUser) => {
        setUser((previousUser) => ({
            ...previousUser,
            ...updatedUser,
        }))

        setShowEditProfile(false)
        setShowProfile(true)
    }

    // PLAYER LOGOUT
    const handleLogout = async () => {
        const token = localStorage.getItem('brainbuzz_token')

        try {
            if (token) {
                await api.post('/logout', {}, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            }
        } catch (error) {
            console.error('Logout Error:', error)
        } finally {
            localStorage.removeItem('brainbuzz_token')
            sessionStorage.removeItem('brainbuzz_player_page')

            setUser(null)
            setQuestions([])
            setAuthMode('login')
            setMessage('')
            setAuthMessage('')
            setShowAchievements(false)
            setShowLeaderboard(false)
            setLevelProgress([])
            setCurrentUnlockedLevel(1)
            resetGame()
        }
    }

    // ADMIN LOGOUT
    const handleAdminLogout = async () => {
        const token = localStorage.getItem('brainbuzz_admin_token')

        try {
            if (token) {
                await api.post('/admin/logout', {}, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            }
        } catch (error) {
            console.error('Admin Logout Error:', error)
        } finally {
            localStorage.removeItem('brainbuzz_admin_token')
            setAdmin(null)
            setShowAdminLogin(false)
        }
    }

    // START LEVEL
    const startLevel = async (level) => {
        if (level > currentUnlockedLevel) {
            setMessage('Complete the previous level first.')
            return
        }

        const token = localStorage.getItem('brainbuzz_token')
        setResultSaved(false)
        setResultError('')
        setShowDashboard(false)

        await fetchQuestions(token, level)
    }

    // CHECK ANSWER
   // CHECK ANSWER
const checkAnswer = async () => {
    if (!answer.trim()) {
        setMessage('Please enter your answer!')
        return
    }

    if (
        checking ||
        completed ||
        answeredCorrectly ||
        questionFinished ||
        !question
    ) return

    const token = localStorage.getItem('brainbuzz_token')

    if (!token) {
        setMessage('Please login again to continue playing.')
        return
    }

    try {
        setChecking(true)
        setMessage('Checking your answer...')

        const response = await api.post(
            '/check-answer',
            {
                question_id: question.id,
                answer: answer.trim(),
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )

        if (response.data.correct === true) {
            setScore((previous) => previous + response.data.points)
            setCorrectCount((previous) => previous + 1)

            setMessage(
                `🎉 Correct Answer! You earned ${response.data.points} points.`
            )

            setAnsweredCorrectly(true)
            setAnswer('')
        } else {
            const remaining = attempts - 1
            setAttempts(remaining)
            setAnswer('')

            if (remaining === 0) {
                setWrongCount((previous) => previous + 1)
                setQuestionFinished(true)
                setMessage('❌ No attempts left! Move to the next question.')
            } else {
                setMessage(
                    `❌ Wrong Answer! ${remaining} attempts remaining.`
                )
            }
        }
    } catch (error) {
        console.error('Answer API Error:', error)

        setMessage(
            error.response?.data?.message ||
            'Something went wrong. Please try again.'
        )
    } finally {
        setChecking(false)
    }
}

    // NEXT QUESTION / SAVE RESULT
    const nextQuestion = async () => {
        if (currentQuestionIndex + 1 < questions.length) {
            setCurrentQuestionIndex((previous) => previous + 1)
            setAnswer('')
            setAttempts(3)
            setMessage('')
            setShowHint(false)
            setHintUsedForQuestion(false)
            setAnsweredCorrectly(false)
            setQuestionFinished(false)
            return
        }

        const finalCorrect = correctCount
        const totalQuestions = questions.length
        const finalWrong = totalQuestions - finalCorrect
        const finalScore = score
        const passed = totalQuestions > 0 && finalCorrect >= Math.min(3, totalQuestions)  
        setCompleted(true)
        setMessage('')
        setSavingResult(true)
        setResultError('')
        setResultSaved(false)

        try {
            const token = localStorage.getItem('brainbuzz_token')

            const response = await api.post('/game-results', {
                level: selectedLevel,
                score: finalScore,
                correct_answers: finalCorrect,
                wrong_answers: finalWrong,
                total_questions: totalQuestions,
                passed,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.data.success) {
                setResultSaved(true)
                await fetchDashboard(token)
                await fetchLevelProgress(token)
            }
        } catch (error) {
            console.error('Save Result Error:', error)

            setResultError(
                error.response?.data?.message ||
                'Unable to save game result. Please try again.'
            )
        } finally {
            setSavingResult(false)
        }
    }

    // RESET PASSWORD
    if (isResetPasswordPage && !user) {
        return (
            <div className={`app auth-page ${theme}-theme`}>
                <main className="auth-container">
                    <ResetPassword
                        onBack={() => {
                            window.history.replaceState({}, '', '/')
                            setIsResetPasswordPage(false)
                            setAuthMode('login')
                        }}
                    />
                </main>
            </div>
        )
    }

    if (authLoading) {
        return (
            <div className={`app ${theme}-theme`}>
                <h2 className="loading">Checking your account...</h2>
            </div>
        )
    }

    if (showAdminLogin && !admin) {
        return (
            <AdminLogin
                onBack={() => setShowAdminLogin(false)}
                onLogin={handleAdminLogin}
            />
        )
    }

    if (admin) {
        return (
            <AdminDashboard
                admin={admin}
                onLogout={handleAdminLogout}
            />
        )
    }

    if (!user && showForgotPassword) {
        return (
            <div className={`app auth-page ${theme}-theme`}>
                <main className="auth-container">
                    <button
                        className="theme-btn auth-theme-btn"
                        onClick={toggleTheme}
                    >
                        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </button>

                    <ForgotPassword
                        onBack={() => {
                            setShowForgotPassword(false)
                            setAuthMessage('')
                        }}
                    />
                </main>
            </div>
        )
    }

    // LOGIN / REGISTER
    if (!user) {
        return (
            <div className={`app auth-page ${theme}-theme`}>
                <main className="auth-container">
                    <div className="auth-logo">🧠 BrainBuzz</div>

                    <button
                        className="theme-btn auth-theme-btn"
                        onClick={toggleTheme}
                    >
                        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </button>

                    <p className="auth-subtitle">
                        Train Your Brain, Challenge Yourself!
                    </p>

                    <div className="auth-tabs">
                        <button
                            className={authMode === 'login' ? 'auth-tab active' : 'auth-tab'}
                            onClick={() => {
                                setAuthMode('login')
                                setAuthMessage('')
                            }}
                        >
                            Login
                        </button>

                        <button
                            className={authMode === 'register' ? 'auth-tab active' : 'auth-tab'}
                            onClick={() => {
                                setAuthMode('register')
                                setAuthMessage('')
                            }}
                        >
                            Register
                        </button>
                    </div>

                    <h2>
                        {authMode === 'login' ? 'Welcome Back!' : 'Create Account'}
                    </h2>

                    <p className="auth-description">
                        {authMode === 'login'
                            ? 'Login to continue playing BrainBuzz.'
                            : 'Create your account and start playing.'}
                    </p>

                    <form onSubmit={handleAuth} className="auth-form">
                        {authMode === 'register' && (
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        )}

                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password (minimum 8 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                            required
                        />

                        {authMode === 'register' && (
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                minLength={8}
                                required
                            />
                        )}

                        {authMode === 'login' && (
                            <p className="forgot-password-link">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForgotPassword(true)
                                        setAuthMessage('')
                                    }}
                                >
                                    Forgot Password?
                                </button>
                            </p>
                        )}

                        {authMessage && (
                            <p className="auth-message">{authMessage}</p>
                        )}

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={authSubmitting}
                        >
                            {authSubmitting
                                ? 'Please wait...'
                                : authMode === 'login'
                                    ? 'Login'
                                    : 'Create Account'}
                        </button>
                    </form>

                    <p className="auth-switch">
                        {authMode === 'login'
                            ? "Don't have an account?"
                            : 'Already have an account?'}{' '}

                        <button
                            type="button"
                            onClick={() => {
                                setAuthMode(authMode === 'login' ? 'register' : 'login')
                                setAuthMessage('')
                            }}
                        >
                            {authMode === 'login' ? 'Register' : 'Login'}
                        </button>
                    </p>

                    <button
                        type="button"
                        className="dashboard-btn"
                        onClick={() => {
                            setShowAdminLogin(true)
                            setAuthMessage('')
                        }}
                    >
                        🔐 Admin Login
                    </button>
                </main>
            </div>
        )
    }

    const navbar = (
        <Navbar
            user={user}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
        />
    )

    if (loading) {
        return (
            <div className={`app ${theme}-theme`}>
                {navbar}
                <h2 className="loading">Loading BrainBuzz...</h2>
            </div>
        )
    }

    if (showAchievements) {
        return (
            <div className={`app ${theme}-theme`}>
                {navbar}
                <Achievements onBack={() => setShowAchievements(false)} />
            </div>
        )
    }

    if (showLeaderboard) {
        return (
            <div className={`app ${theme}-theme`}>
                {navbar}
                <Leaderboard onBack={() => setShowLeaderboard(false)} />
            </div>
        )
    }

    if (showHowToPlay) {
        return (
            <div className={`app ${theme}-theme`}>
                {navbar}
                <HowToPlay
                    onBack={() => setShowHowToPlay(false)}
                    onStart={() => {
                        setShowHowToPlay(false)
                        startLevel(currentUnlockedLevel)
                    }}
                />
            </div>
        )
    }

    if (showChangePassword) {
        return (
            <div className={`app ${theme}-theme`}>
                {navbar}
                <ChangePassword onBack={() => setShowChangePassword(false)} />
            </div>
        )
    }

    if (showEditProfile) {
        return (
            <div className={`app ${theme}-theme`}>
                {navbar}
                <EditProfile
                    user={user}
                    onBack={() => setShowEditProfile(false)}
                    onProfileUpdated={handleProfileUpdated}
                />
            </div>
        )
    }

    if (showProfile) {
        return (
            <div className={`app ${theme}-theme`}>
                {navbar}
                <Profile
                    user={user}
                    onBack={() => setShowProfile(false)}
                    onEditProfile={() => setShowEditProfile(true)}
                    onChangePassword={() => setShowChangePassword(true)}
                />
            </div>
        )
    }

    if (showFeedback) {
        return (
            <div className={`app ${theme}-theme`}>
                {navbar}
                <Feedback onBack={() => setShowFeedback(false)} />
            </div>
        )
    }

    // DASHBOARD
if (showDashboard) {
        const maxLevelToShow = Math.max(10, currentUnlockedLevel + 4)

        return (
            <div className={`app ${theme}-theme`}>
                {navbar}

                <main className="dashboard-container">
                    <div className="dashboard-welcome">
                        <p className="level">PLAYER DASHBOARD</p>
                        <h1>Welcome, {user.name}! 👋</h1>
                        <p>Ready to challenge your brain today?</p>
                    </div>

                    <div className="dashboard-stats">
                        <div className="stat-card">
                            <span>🎮</span>
                            <h2>{dashboardStats.games_played}</h2>
                            <p>Games Played</p>
                        </div>

                        <div className="stat-card">
                            <span>⭐</span>
                            <h2>{dashboardStats.total_score}</h2>
                            <p>Total Score</p>
                        </div>

                        <div className="stat-card">
                            <span>✅</span>
                            <h2>{dashboardStats.total_correct}</h2>
                            <p>Correct Answers</p>
                        </div>

                        <div className="stat-card">
                            <span>❌</span>
                            <h2>{dashboardStats.total_wrong}</h2>
                            <p>Wrong Answers</p>
                        </div>

                        <div className="stat-card">
                            <span>📊</span>
                            <h2>{dashboardStats.accuracy}%</h2>
                            <p>Accuracy</p>
                        </div>
                    </div>

                    <section className="dashboard-game">
                        <h2>🧠 BrainBuzz Levels</h2>
                        <p>Get at least 3 correct answers out of 5 to unlock the next level.</p>

                        <div className="level-cards">
                            {Array.from({ length: maxLevelToShow }, (_, index) => {
                                const level = index + 1
                                const progress = levelProgress.find(
                                    (item) => Number(item.level) === level
                                )

                                const unlocked = level <= currentUnlockedLevel
                                const isCompleted = Boolean(progress?.is_completed)

                                return (
                                    <div
                                        className={`level-card ${
                                            isCompleted ? 'completed' : ''
                                        } ${unlocked ? 'unlocked' : 'locked'}`}
                                        key={level}
                                    >
                                        <h3>Level {level}</h3>

                                        <p>
                                            {isCompleted
                                                ? '✅ Completed'
                                                : unlocked
                                                    ? '🔓 Unlocked'
                                                    : '🔒 Locked'}
                                        </p>

                                        {progress && (
                                            <div className="level-performance">
                                        <div className="level-stars">
                                            {progress.stars > 0
                                                ? '⭐'.repeat(Number(progress.stars)) + '☆'.repeat(3 - Number(progress.stars))
                                                : '☆☆☆'}
                                        </div>

                                        <small>
                                            Best Correct: {progress.best_correct_answers || 0}/5
                                        </small>

                                    </div>
                                        )}

                                        <button
                                            className="submit-btn"
                                            disabled={!unlocked}
                                            onClick={() => startLevel(level)}
                                        >
                                            {isCompleted
                                                ? 'Play Again'
                                                : unlocked
                                                    ? 'Start Level'
                                                    : 'Locked'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>

                        <button
                            className="dashboard-btn"
                            onClick={() => setShowLeaderboard(true)}
                        >
                            🏆 View Leaderboard
                        </button>

                        <button
                            className="dashboard-btn"
                            onClick={() => setShowAchievements(true)}
                        >
                            🏅 View Achievements
                        </button>

                        <button
                            className="dashboard-btn"
                            onClick={() => setShowHowToPlay(true)}
                        >
                            🎮 How to Play
                        </button>

                        <button
                            className="dashboard-btn"
                            onClick={() => setShowProfile(true)}
                        >
                            👤 My Profile & Game History
                        </button>

                        <button
                            className="dashboard-btn"
                            onClick={() => setShowFeedback(true)}
                        >
                            💬 Share Feedback
                        </button>
                    </section>
                </main>
            </div>
        )
    }

    // NO QUESTIONS
    if (questions.length === 0) {
        return (
            <div className={`app ${theme}-theme`}>
                {navbar}

                <main className="game-container">
                    <h2>{message || 'No questions available.'}</h2>

                    <button
                        className="submit-btn"
                        onClick={() => fetchQuestions(
                            localStorage.getItem('brainbuzz_token'),
                            selectedLevel
                        )}
                    >
                        Try Again
                    </button>

                    <button
                        className="dashboard-btn"
                        onClick={() => setShowDashboard(true)}
                    >
                        Back to Dashboard
                    </button>
                </main>
            </div>
        )
    }

    // FINAL RESULT SCREEN
    if (completed) {
        const totalQuestions = questions.length
        const accuracy = totalQuestions > 0
            ? Math.round((correctCount / totalQuestions) * 100)
            : 0

        const passed = totalQuestions > 0 && correctCount >= Math.min(3, totalQuestions)
        
        let performance = 'Level Failed! 💪 Try Again!'

        if (passed && accuracy === 100) {
            performance = 'Perfect Game! 🏆'
        } else if (passed) {
            performance = 'Level Passed! 🎉'
        }

        return (
            <div className={`app ${theme}-theme`}>
                {navbar}

                <main className="game-container">
                    <p className="level">
                        {passed ? 'LEVEL COMPLETED' : 'LEVEL NOT COMPLETED'}
                    </p>

                    <h1>
                        {passed ? '🎉 Challenge Completed!' : '❌ Level Failed!'}
                    </h1>

                    <p className="subtitle">
                        You have completed all {totalQuestions} questions in Level {selectedLevel}.
                    </p>

                    <h2>{performance}</h2>

                    {savingResult && (
                        <p className="game-message">Saving your result...</p>
                    )}

                    {resultSaved && (
                        <p className="game-message">
                            ✅ Your game result saved successfully!
                        </p>
                    )}

                    {resultError && (
                        <p className="game-message">❌ {resultError}</p>
                    )}

                    <div className="score">
                        <span>⭐ Total Score: {score}</span>
                    </div>

                    <div className="score">
                        <span>✅ Correct Answers: {correctCount}</span>
                        <span>❌ Wrong Answers: {totalQuestions - correctCount}</span>
                    </div>

                    <div className="score">
                        <span>📊 Accuracy: {accuracy}%</span>
                    </div>

                    {!passed && (
                        <button
                            className="submit-btn"
                            disabled={savingResult}
                            onClick={() => startLevel(selectedLevel)}
                        >
                            🔄 Retry Level {selectedLevel}
                        </button>
                    )}

                    {passed && (
                        <button
                            className="submit-btn"
                            disabled={savingResult}
                            onClick={() => startLevel(selectedLevel + 1)}
                        >
                            🚀 Start Level {selectedLevel + 1}
                        </button>
                    )}

                    <button
                        className="dashboard-btn"
                        disabled={savingResult}
                        onClick={async () => {
                            const token = localStorage.getItem('brainbuzz_token')
                            await fetchDashboard(token)
                            await fetchLevelProgress(token)
                            setShowDashboard(true)
                        }}
                    >
                        Back to Dashboard
                    </button>
                </main>
            </div>
        )
    }

    // MAIN GAME SCREEN
    return (
        <div className={`app ${theme}-theme`}>
            {navbar}

            <main className="game-container">
                <div className="game-top-actions">
                    <p className="level">LEVEL {selectedLevel}</p>

                    <button
                        type="button"
                        className="leave-game-btn"
                        onClick={() => {
                            const confirmed = window.confirm(
                                'Are you sure you want to leave this game? Your current progress will not be saved.'
                            )

                            if (confirmed) {
                                resetGame()
                                setShowDashboard(true)
                            }
                        }}
                    >
                        🚪 Leave Game
                    </button>
                </div>

                <p className="subtitle">
                    Question {currentQuestionIndex + 1} of {questions.length}
                </p>

                <h1>{question.title}</h1>

                <p className="subtitle">
                    Find the word that connects all five clues.
                </p>

                <div className="clue-box">
                    {question.clues.map((clue, index) => (
                        <div className="clue" key={index}>
                            {clue}
                        </div>
                    ))}
                </div>

                {!answeredCorrectly && !questionFinished && (
                    <>
                        <input
                            type="text"
                            placeholder="Enter your answer..."
                            className="answer-input"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') checkAnswer()
                            }}
                            disabled={checking}
                        />

                        <button
                            className="submit-btn"
                            onClick={checkAnswer}
                            disabled={checking}
                        >
                            {checking ? 'Checking...' : 'Submit Answer'}
                        </button>
                    </>
                )}

                {message && (
                    <p className="game-message">{message}</p>
                )}

                {!questionFinished && !answeredCorrectly && (
    <div className="hint-section">
        <p className="hints-remaining">
            💡 Hints Remaining: {hintsRemaining}/3
        </p>

        {question.hint ? (
            <>
                <button
                    type="button"
                    className="hint"
                    disabled={!hintUsedForQuestion && hintsRemaining === 0}
                    onClick={() => {
                        if (hintUsedForQuestion) {
                            setShowHint(!showHint)
                            return
                        }

                        if (hintsRemaining > 0) {
                            setHintsRemaining((previous) => previous - 1)
                            setHintUsedForQuestion(true)
                            setShowHint(true)
                        }
                    }}
                >
                    💡 {hintUsedForQuestion
                        ? showHint ? 'Hide Hint' : 'Show Hint'
                        : hintsRemaining > 0
                            ? 'Use Hint'
                            : 'No Hints Remaining'}
                </button>

                {showHint && (
                    <p className="hint-text">
                        {question.hint}
                    </p>
                )}
            </>
        ) : (
            <p className="hint-text">No hint available for this question.</p>
        )}
    </div>
)}

                <div className="score">
                    <span>⭐ Score: {score}</span>
                    <span>❤️ Attempts: {attempts}</span>
                </div>

                {(answeredCorrectly || questionFinished) && (
                    <button className="submit-btn" onClick={nextQuestion}>
                        {currentQuestionIndex + 1 === questions.length
                            ? 'See Final Score'
                            : 'Next Question →'}
                    </button>
                )}
            </main>
        </div>
    )
}

export default App