import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
import DailyChallenge from './DailyChallenge'
import DailyMiniGames from './DailyMiniGames'
import GamesHub from './GamesHub'
import BrainTraining from './BrainTraining'
import KnowledgeChallenge from './KnowledgeChallenge'
import BrainDuel from './BrainDuel'
import PlayerBackButton from './PlayerBackButton'
import GameWallpaper3D from './GameWallpaper3D'
import HeroGameBanner from './HeroGameBanner'
import soundService from './services/soundService'
import DailyRewardModal from './DailyRewardModal'
import ShareScoreModal from './ShareScoreModal'
import CoinStoreModal from './CoinStoreModal'
import GameSplashScreen from './GameSplashScreen'

// Temporarily hide Daily Challenge while retaining its player implementation.
const DAILY_CHALLENGE_UI_ENABLED = false
const LEVEL_PAGE_SIZE = 10

const isUsableToken = (token) =>
    typeof token === 'string' &&
    token.trim() !== '' &&
    !['undefined', 'null'].includes(token.trim().toLowerCase())

const extractAuthToken = (data) => {
    if (!data || typeof data !== 'object') return null

    const candidates = [
        data.token,
        data.access_token,
        data.plainTextToken,
        data.data?.token,
        data.data?.access_token,
        data.data?.plainTextToken,
    ]

    for (const candidate of candidates) {
        if (
            typeof candidate === 'string' &&
            candidate.trim() !== '' &&
            !['undefined', 'null'].includes(candidate.trim().toLowerCase())
        ) {
            return candidate.trim()
        }
        if (
            typeof candidate === 'object' &&
            candidate !== null &&
            typeof candidate.plainTextToken === 'string' &&
            candidate.plainTextToken.trim() !== ''
        ) {
            return candidate.plainTextToken.trim()
        }
    }

    return null
}

// NAVBAR COMPONENT
function Navbar({ user, onLogout, onOpenRewards, onOpenStore, score = 0 }) {
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notificationLoading, setNotificationLoading] = useState(false)
    const [isMuted, setIsMuted] = useState(soundService.isMuted())
    const [isBgmMuted, setIsBgmMuted] = useState(soundService.isBgmMuted())

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
            <div className="nav-brand">
                <img src="/clueshift-logo.png" alt="ClueShift" className="nav-brand-logo" />
                <h2>ClueShift</h2>
            </div>

            <div className="user-area">
                <button
                    type="button"
                    className="nav-action-pill rewards"
                    title="Claim Daily Login Rewards & Spin Wheel"
                    onClick={() => {
                        soundService.playClick()
                        if (onOpenRewards) onOpenRewards()
                    }}
                >
                    <span className="pill-icon">🎁</span>
                    <span className="pill-text">Rewards</span>
                </button>

                <button
                    type="button"
                    className="nav-action-pill shop"
                    title="Coin & Lifelines Store (Click to Buy Coins)"
                    onClick={() => {
                        soundService.playClick()
                        if (onOpenStore) onOpenStore()
                    }}
                >
                    <span className="nav-shop-icon">🪙</span>
                    <span className="nav-coin-count">{(score || user?.coins || 0) > 0 ? (score || user?.coins || 0).toLocaleString() : 'Store'}</span>
                    <span className="nav-shop-plus">+</span>
                </button>

                <button
                    type="button"
                    className="nav-audio-toggle"
                    title={isMuted ? 'Turn Sound SFX ON' : 'Turn Sound SFX OFF'}
                    onClick={() => {
                        const next = soundService.toggleSound()
                        setIsMuted(!next)
                    }}
                >
                    {isMuted ? '🔇' : '🔊'}
                </button>

                <button
                    type="button"
                    className="nav-audio-toggle bgm-toggle"
                    title={isBgmMuted ? 'Play Ambient Music' : 'Pause Ambient Music'}
                    onClick={() => {
                        const next = soundService.toggleBgm()
                        setIsBgmMuted(!next)
                    }}
                >
                    {isBgmMuted ? '🔈' : '🎵'}
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

                <span className="user-greeting">Hi, {user.name}</span>

                <button className="logout-btn" onClick={onLogout}>
                    Logout
                </button>
            </div>
        </header>
    )
}

// MAIN APP
function App() {
    const location = useLocation()
    const navigate = useNavigate()
    const syncingRouteRef = useRef(false)
    const [isResetPasswordPage, setIsResetPasswordPage] = useState(
        () => location.pathname === '/reset-password'
    )

    const theme = 'dark'

    const [showAchievements, setShowAchievements] = useState(false)
    const [showLeaderboard, setShowLeaderboard] = useState(false)
    const [showLevelsView, setShowLevelsView] = useState(false)
    const [showDailyChallenge, setShowDailyChallenge] = useState(false)
    const [showDailyMiniGames, setShowDailyMiniGames] = useState(false)
    const [showGamesHub, setShowGamesHub] = useState(false)
    const [selectedGameMode, setSelectedGameMode] = useState(null)

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
    document.body.className = 'dark-theme'
}, [])

    const [user, setUser] = useState(null)
    const [authMode, setAuthMode] = useState('login')
    const [authLoading, setAuthLoading] = useState(true)
    const [initialSplashDone, setInitialSplashDone] = useState(false)
    const [authSubmitting, setAuthSubmitting] = useState(false)

    const [showProfile, setShowProfile] = useState(
        () => location.pathname === '/profile'
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
    const [authMessageType, setAuthMessageType] = useState('')

    const [showHowToPlay, setShowHowToPlay] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)

    const [showAdminLogin, setShowAdminLogin] = useState(
        () => location.pathname.startsWith('/admin')
    )
    const [admin, setAdmin] = useState(null)

    // LEVEL AND GAME STATES
    const [selectedLevel, setSelectedLevel] = useState(1)
    const [levelProgress, setLevelProgress] = useState([])
    const [currentUnlockedLevel, setCurrentUnlockedLevel] = useState(1)
    const [levelPage, setLevelPage] = useState(1)

    // CATEGORY FILTER STATES
    const [playerCategories, setPlayerCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [loadingPlayerCategories, setLoadingPlayerCategories] = useState(false)

    const [questions, setQuestions] = useState([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

    const [answer, setAnswer] = useState('')
    const [score, setScore] = useState(0)
    const [correctCount, setCorrectCount] = useState(0)
    const [_wrongCount, setWrongCount] = useState(0)

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
    const [mobileDashboardTab, setMobileDashboardTab] = useState('play') // 'play' (lobby) | 'levels' | 'stats'

    const [savingResult, setSavingResult] = useState(false)
    const [resultSaved, setResultSaved] = useState(false)
    const [resultError, setResultError] = useState('')
    const [showLevelIntro, setShowLevelIntro] = useState(false)

    // COMMERCIAL EXTENSIONS: REWARDS, STORE, SHARE & LIFELINES
    const [showDailyRewardModal, setShowDailyRewardModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showStoreModal, setShowStoreModal] = useState(false)
    const [scoreToShare, setScoreToShare] = useState(null)
    const [fiftyFiftyRemaining, setFiftyFiftyRemaining] = useState(2)
    const [extraLivesRemaining, setExtraLivesRemaining] = useState(2)
    const [fiftyFiftyActive, setFiftyFiftyActive] = useState(false)
    const [fiftyFiftyChoices, setFiftyFiftyChoices] = useState([])
    const [extraLifeNotice, setExtraLifeNotice] = useState('')

    const question = questions[currentQuestionIndex]

    useEffect(() => {
        syncingRouteRef.current = true
        const path = location.pathname
        const levelMatch = path.match(/^\/game\/level\/([1-9]\d*)$/)
        const isAdminPath = path === '/admin' || path.startsWith('/admin/')

        setIsResetPasswordPage(path === '/reset-password')
        setAuthMode(path === '/register' ? 'register' : 'login')
        setShowAdminLogin(isAdminPath)
        setShowForgotPassword(path === '/forgot-password')
        setShowAchievements(path === '/achievements')
        setShowLeaderboard(path === '/leaderboard')
        setShowLevelsView(path === '/levels')
        setShowDailyMiniGames(path === '/daily-mini-games')
        setShowGamesHub(path === '/games')
        setShowProfile(path === '/profile')
        setShowEditProfile(path === '/profile/edit')
        setShowChangePassword(path === '/profile/change-password')
        setShowHowToPlay(path === '/how-to-play')
        setShowFeedback(path === '/feedback')
        setSelectedGameMode(
            path === '/brain-training'
                ? 'training'
                : path === '/knowledge-challenge'
                    ? 'knowledge'
                    : path === '/brain-duel'
                        ? 'duel'
                        : null
        )
        setShowDashboard(!levelMatch)

        if (levelMatch) {
            setSelectedLevel(Number(levelMatch[1]))
        }
    }, [location.pathname])

    useEffect(() => {
        if (syncingRouteRef.current) {
            syncingRouteRef.current = false
            return
        }

        if (authLoading || admin) return

        let nextPath

        if (isResetPasswordPage) {
            nextPath = '/reset-password'
        } else if (showAdminLogin && !admin) {
            nextPath = '/admin/login'
        } else if (!user) {
            nextPath = showForgotPassword
                ? '/forgot-password'
                : authMode === 'register'
                    ? '/register'
                    : '/login'
        } else if (showAchievements) {
            nextPath = '/achievements'
        } else if (DAILY_CHALLENGE_UI_ENABLED && showDailyChallenge) {
            nextPath = '/daily-challenge'
        } else if (showDailyMiniGames) {
            nextPath = '/daily-mini-games'
        } else if (showLeaderboard) {
            nextPath = '/leaderboard'
        } else if (showLevelsView) {
            nextPath = '/levels'
        } else if (showHowToPlay) {
            nextPath = '/how-to-play'
        } else if (showChangePassword) {
            nextPath = '/profile/change-password'
        } else if (showEditProfile) {
            nextPath = '/profile/edit'
        } else if (showProfile) {
            nextPath = '/profile'
        } else if (showFeedback) {
            nextPath = '/feedback'
        } else if (showGamesHub) {
            nextPath = '/games'
        } else if (selectedGameMode === 'training') {
            nextPath = '/brain-training'
        } else if (selectedGameMode === 'knowledge') {
            nextPath = '/knowledge-challenge'
        } else if (selectedGameMode === 'duel') {
            nextPath = '/brain-duel'
        } else if (showDashboard) {
            nextPath = '/dashboard'
        } else {
            nextPath = `/game/level/${selectedLevel}`
        }

        if (location.pathname !== nextPath) {
            navigate(nextPath)
        }
    }, [
        admin,
        authLoading,
        authMode,
        isResetPasswordPage,
        location.pathname,
        navigate,
        selectedGameMode,
        selectedLevel,
        showAchievements,
        showAdminLogin,
        showChangePassword,
        showDailyChallenge,
        showDailyMiniGames,
        showDashboard,
        showEditProfile,
        showFeedback,
        showForgotPassword,
        showGamesHub,
        showHowToPlay,
        showLeaderboard,
        showLevelsView,
        showProfile,
        user,
    ])

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
        setShowLevelIntro(false)
        setFiftyFiftyRemaining(2)
        setExtraLivesRemaining(2)
        setFiftyFiftyActive(false)
        setFiftyFiftyChoices([])
        setExtraLifeNotice('')
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
            setLevelPage(Math.ceil(nextLevel / LEVEL_PAGE_SIZE))
        }
    } catch (error) {
        console.error('Level Progress Error:', error)
    }
}
 // Fetch Active Categories for Players
const fetchPlayerCategories = async (token) => {
    try {
        setLoadingPlayerCategories(true)

        const response = await api.get('/categories', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        setPlayerCategories(
            response.data.categories || []
        )

    } catch (error) {
        console.error(
            'Player Categories Fetch Error:',
            error.response?.data || error
        )

        setPlayerCategories([])

    } finally {
        setLoadingPlayerCategories(false)
    }
}

    const fetchQuestions = async (
    token,
    level = selectedLevel,
    category = selectedCategory
) => {
    try {
        setLoading(true)
        setMessage('')
        setSelectedCategory(category)

        let endpoint = `/questions?level=${level}`

        if (category !== 'all') {
            endpoint += `&category_id=${category}`
        }

        const response = await api.get(endpoint, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (response.data.questions?.length > 0) {
            setQuestions(response.data.questions)
            setSelectedLevel(level)
            setSelectedCategory(category)
            resetGame()
        } else {
            setQuestions([])

            setMessage(
                category === 'all'
                    ? `No active questions are available in Level ${level}. Add questions for this level in Admin > Question Management.`
                    : `No active questions are available for this category in Level ${level}. Add questions for this level and category in Admin > Question Management.`
            )
        }
    } catch (error) {
        console.error(
            'Question API Error:',
            error.response?.data || error
        )

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

            if (!isUsableToken(token)) {
                localStorage.removeItem('brainbuzz_token')
                setAuthLoading(false)
                return
            }

            try {
                const requestedLevel = Number(
                    window.location.pathname.match(/^\/game\/level\/([1-9]\d*)$/)?.[1]
                ) || 1

                const response = await api.get('/me', {
                    headers: { Authorization: `Bearer ${token}` },
                })

                const loadedUser = response.data.user
                setUser(loadedUser)
                if (loadedUser?.coins !== undefined) {
                    setScore(Number(loadedUser.coins) || 0)
                }
                if (loadedUser?.hints !== undefined) {
                    setHintsRemaining(Number(loadedUser.hints) || 3)
                }
                if (loadedUser?.lifelines !== undefined) {
                    setFiftyFiftyRemaining(Number(loadedUser.lifelines) || 2)
                    setExtraLivesRemaining(Number(loadedUser.lifelines) || 2)
                }
                await fetchDashboard(token)
                await fetchLevelProgress(token)
                await fetchPlayerCategories(token)
                if (requestedLevel > 1) {
                    setSelectedLevel(requestedLevel)
                }
                await fetchQuestions(token, requestedLevel)
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
        setAuthMessageType('')

        const normalizedEmail = email.trim().toLowerCase()

        if (authMode === 'register' && password !== passwordConfirmation) {
            setAuthMessage('Passwords do not match!')
            setAuthMessageType('error')
            return
        }

        try {
            setAuthSubmitting(true)

            const endpoint = authMode === 'register' ? '/register' : '/login'

            const payload = authMode === 'register'
                ? {
                    name: name.trim(),
                    email: normalizedEmail,
                    password,
                    password_confirmation: passwordConfirmation,
                }
                : { email: normalizedEmail, password }

            const response = await api.post(endpoint, payload)

            const token = extractAuthToken(response.data)
            const authUser =
                response.data?.user ||
                response.data?.data?.user ||
                (response.data?.id && response.data?.email ? response.data : null)

            if (authMode === 'register') {
                localStorage.removeItem('brainbuzz_token')
                setUser(null)
                setAuthMode('login')
                setPassword('')
                setPasswordConfirmation('')
                setAuthMessage('Registration successful! Please login with your password.')
                setAuthMessageType('success')
                navigate('/login', { replace: true })
                return
            }

            if (!token) {
                localStorage.removeItem('brainbuzz_token')
                console.error(
                    'Login response is missing a valid token. Response fields:',
                    Object.keys(response.data || {}),
                    response.data
                )
                setAuthMessage('Login response did not include a valid token. Please try again.')
                setAuthMessageType('error')
                return
            }

            localStorage.setItem('brainbuzz_token', token)
            setUser(authUser)
            if (authUser?.coins !== undefined) {
                setScore(Number(authUser.coins) || 0)
            }
            if (authUser?.hints !== undefined) {
                setHintsRemaining(Number(authUser.hints) || 3)
            }
            if (authUser?.lifelines !== undefined) {
                setFiftyFiftyRemaining(Number(authUser.lifelines) || 2)
                setExtraLivesRemaining(Number(authUser.lifelines) || 2)
            }

            await fetchDashboard(token)
            await fetchLevelProgress(token)
            await fetchPlayerCategories(token)

            setPassword('')
            setPasswordConfirmation('')
            setAuthMessage('')
            setAuthMessageType('')

            await fetchQuestions(token, 1)
        } catch (error) {
            console.error('Authentication Error:', error)
            setAuthMessageType('error')

            const errors = error.response?.data?.errors

            if (errors) {
                const firstError = Object.values(errors)[0]
                setAuthMessage(firstError?.[0] || 'Please check your details.')
            } else {
                setAuthMessage(
                    error.response?.data?.message ||
                    'Something went wrong. Please check your credentials.'
                )
            }
        } finally {
            setAuthSubmitting(false)
        }
    }

    const handleAdminLogin = async (adminData) => {
        try {
            const normalizedData = {
                ...adminData,
                email: adminData.email?.trim().toLowerCase(),
            }
            const response = await api.post('/admin/login', normalizedData)

            const token = extractAuthToken(response.data)

            if (!token) {
                alert('Admin login response did not include a valid token.')
                return
            }

            localStorage.setItem('brainbuzz_admin_token', token)

            const adminUser =
                response.data?.user ||
                response.data?.data?.user ||
                response.data

            setAdmin(adminUser)
            setShowAdminLogin(false)

        } catch (error) {
            console.error('Admin Login Error:', error)

            alert(
                error.response?.data?.message ||
                'Admin login failed. Please try again.'
            )
        }
    }

const handlePasswordResetSuccess = (resetEmail) => {
    const normalizedEmail = resetEmail.trim().toLowerCase()

    if (user?.email?.toLowerCase() === normalizedEmail) {
        localStorage.removeItem('brainbuzz_token')
        setUser(null)
    }

    if (admin?.email?.toLowerCase() === normalizedEmail) {
        localStorage.removeItem('brainbuzz_admin_token')
        setAdmin(null)
    }
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
            setPlayerCategories([])
            setSelectedCategory('all')
            setSelectedLevel(1)
            setAuthMode('login')
            setMessage('')
            setAuthMessage('')
            setShowAchievements(false)
            setShowLeaderboard(false)
            setShowLevelsView(false)
            setLevelProgress([])
            setCurrentUnlockedLevel(1)
            setLevelPage(1)
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
            navigate('/admin/login')
        }
    }

    // START LEVEL
    const startLevel = async (level) => {
    if (level > currentUnlockedLevel) {
        setMessage('Complete the previous level first.')
        return
    }

    const token = localStorage.getItem('brainbuzz_token')
    setSelectedLevel(level)
    setResultSaved(false)
    setResultError('')
    setShowDashboard(false)
    setShowLevelIntro(true)

    await fetchQuestions(token, level, selectedCategory)
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
        category_id: selectedCategory === 'all'
            ? null
            : Number(selectedCategory),
    },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )

        if (response.data.correct === true) {
            soundService.playCorrect()
            setScore((previous) => previous + response.data.points)
            setCorrectCount((previous) => previous + 1)

            setMessage(
                `🎉 Correct Answer! You earned ${response.data.points} points.`
            )

            setAnsweredCorrectly(true)
            setAnswer('')
        } else {
            soundService.playWrong()
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

    // Helper to get 50-50 distractor for a question
    const getFiftyFiftyDistractor = (currQ, allQ = []) => {
        if (!currQ || !currQ.answer) return 'Alternate Choice'
        const ans = currQ.answer.trim()
        const ansLower = ans.toLowerCase()

        const knownPairs = {
            'neil armstrong': 'Buzz Aldrin',
            'buzz aldrin': 'Neil Armstrong',
            'saturn': 'Jupiter',
            'jupiter': 'Saturn',
            'mars': 'Venus',
            'sun': 'Moon',
            'moon': 'Sun',
            'venus': 'Mars',
            'earth': 'Mars',
            'apple': 'Microsoft',
            'google': 'Yahoo',
            'cpu': 'RAM',
            'internet': 'Intranet',
            'github': 'GitLab',
            'firewall': 'Antivirus',
            'phishing': 'Malware',
            'vpn': 'Proxy',
            'encryption': 'Hashing',
            'gold': 'Silver',
            'water': 'Hydrogen',
            'clock': 'Hourglass',
            'football': 'Rugby',
            'cricket': 'Baseball',
            'mount everest': 'K2',
            'amazon river': 'Nile River',
            'paris': 'Rome',
            'colosseum': 'Parthenon',
            'great wall': 'Forbidden City',
            'egypt': 'Mesopotamia',
            'leonardo da vinci': 'Michelangelo',
            'tiger': 'Leopard',
            'whale': 'Shark',
            'panda': 'Koala',
        }

        if (knownPairs[ansLower]) {
            return knownPairs[ansLower]
        }

        if (Array.isArray(allQ)) {
            const other = allQ.find((q) => q && q.answer && q.answer.trim().toLowerCase() !== ansLower)
            if (other && other.answer) {
                return other.answer.trim()
            }
        }

        return `${ans} (Alternate)`
    }

    const handleUseFiftyFifty = async () => {
        if (fiftyFiftyActive || fiftyFiftyRemaining <= 0 || !question) return
        soundService.playPowerup()

        // 1. Try to use pre-packaged fifty_fifty_choices from backend question
        if (Array.isArray(question.fifty_fifty_choices) && question.fifty_fifty_choices.length === 2) {
            setFiftyFiftyChoices(question.fifty_fifty_choices)
            setFiftyFiftyActive(true)
            setFiftyFiftyRemaining((prev) => Math.max(0, prev - 1))
            return
        }

        // 2. Fetch from backend lifeline endpoint
        try {
            const token = localStorage.getItem('brainbuzz_token')
            const res = await api.post(
                '/lifeline/fifty-fifty',
                { question_id: question.id },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            if (res.data?.success && Array.isArray(res.data.choices) && res.data.choices.length === 2) {
                setFiftyFiftyChoices(res.data.choices)
                setFiftyFiftyActive(true)
                setFiftyFiftyRemaining((prev) => Math.max(0, prev - 1))
                return
            }
        } catch (err) {
            console.warn('FiftyFifty API error:', err)
        }

        // 3. Fallback if answer exists
        const ans = question.answer ? String(question.answer).trim() : ''
        if (ans) {
            const distractor = getFiftyFiftyDistractor(question, questions)
            const choices = Math.random() > 0.5 ? [ans, distractor] : [distractor, ans]
            setFiftyFiftyChoices(choices)
            setFiftyFiftyActive(true)
            setFiftyFiftyRemaining((prev) => Math.max(0, prev - 1))
            return
        }

        // 4. Default smart fallback
        const defaultPair = ['Hexagon', 'Octagon']
        setFiftyFiftyChoices(defaultPair)
        setFiftyFiftyActive(true)
        setFiftyFiftyRemaining((prev) => Math.max(0, prev - 1))
    }

    const handleUseExtraLife = () => {
        if (extraLivesRemaining <= 0) return
        soundService.playPowerup()
        setExtraLivesRemaining((prev) => prev - 1)
        setAttempts((prev) => prev + 1)
        setExtraLifeNotice('❤️ +1 Extra Attempt Added to your life pool!')
        setTimeout(() => setExtraLifeNotice(''), 3500)
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
            setFiftyFiftyActive(false)
            setFiftyFiftyChoices([])
            setExtraLifeNotice('')
            return
        }

        const finalCorrect = correctCount
        const totalQuestions = questions.length
        const finalWrong = totalQuestions - finalCorrect
        const finalScore = score
        const passed = totalQuestions > 0 && finalCorrect >= Math.min(3, totalQuestions)  
        if (passed) {
            soundService.playWin()
        } else {
            soundService.playWrong()
        }
        setScoreToShare({
            level: selectedLevel,
            score: finalScore,
            correctAnswers: finalCorrect,
            totalQuestions,
            passed,
        })
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
    if (isResetPasswordPage) {
        return (
            <div className={`app auth-page ${theme}-theme`}>
                <ResetPassword
                    key={location.search}
                    backLabel={user || admin ? 'Back to Dashboard' : 'Back to Login'}
                    onSuccess={handlePasswordResetSuccess}
                    onBack={() => {
                        navigate(
                            admin ? '/admin/overview' : user ? '/dashboard' : '/login',
                            { replace: true }
                        )
                        setIsResetPasswordPage(false)
                        setAuthMode('login')
                    }}
                />
            </div>
        )
    }

    if (!initialSplashDone || authLoading) {
        return (
            <GameSplashScreen
                isReady={!authLoading}
                minDuration={2000}
                loadingText={authLoading ? 'Synchronizing Account & Cloud Data...' : 'Launching ClueShift Arcade...'}
                onFinish={() => setInitialSplashDone(true)}
            />
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
                <ForgotPassword
                    onBack={() => {
                        setShowForgotPassword(false)
                        setAuthMessage('')
                    }}
                />
            </div>
        )
    }

    // LOGIN / REGISTER
    if (!user) {
        return (
            <div className={`app auth-page ${theme}-theme game-view-wrapper`}>
                <GameWallpaper3D level={1} />
                <main className="auth-container glassmorphic">
                    <div className="auth-logo">
                        <img src="/clueshift-logo.png" alt="ClueShift" className="auth-logo-img" />
                        <span>ClueShift</span>
                    </div>

                    <p className="auth-subtitle">
                        Train Your Brain, Challenge Yourself!
                    </p>

                    <div className="auth-tabs">
                        <button
                            className={authMode === 'login' ? 'auth-tab active' : 'auth-tab'}
                            onClick={() => {
                                setAuthMode('login')
                                setAuthMessage('')
                                setAuthMessageType('')
                            }}
                        >
                            Login
                        </button>

                        <button
                            className={authMode === 'register' ? 'auth-tab active' : 'auth-tab'}
                            onClick={() => {
                                setAuthMode('register')
                                setAuthMessage('')
                                setAuthMessageType('')
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
                            ? 'Login to continue playing ClueShift.'
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
                            <p className={`auth-message ${authMessageType === 'success' ? 'auth-message-success' : 'auth-message-error'}`}>
                                {authMessageType === 'success' ? '✅ ' : '⚠️ '}
                                {authMessage}
                            </p>
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
                                setAuthMessageType('')
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
        <>
            <Navbar
                user={user}
                score={score}
                onLogout={handleLogout}
                theme={theme}
                onOpenRewards={() => setShowDailyRewardModal(true)}
                onOpenStore={() => setShowStoreModal(true)}
            />

            <DailyRewardModal
                isOpen={showDailyRewardModal}
                onClose={() => setShowDailyRewardModal(false)}
                onRewardClaimed={(reward) => {
                    setScore((prev) => prev + (reward.coins || 0))
                    if (reward.hints) setHintsRemaining((prev) => prev + reward.hints)
                    if (reward.lifelines) {
                        setFiftyFiftyRemaining((prev) => prev + reward.lifelines)
                        setExtraLivesRemaining((prev) => prev + reward.lifelines)
                    }
                }}
            />

            <ShareScoreModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                scoreData={scoreToShare}
                playerName={user?.name}
            />

            <CoinStoreModal
                isOpen={showStoreModal}
                onClose={() => setShowStoreModal(false)}
                onPurchaseComplete={(pack) => {
                    const addedCoins = pack.coins || 0
                    setScore((prev) => prev + addedCoins)
                    setUser((prev) => prev ? { ...prev, coins: (prev.coins || 0) + addedCoins } : prev)
                    if (pack.type === 'purchase') {
                        setHintsRemaining((prev) => prev + 2)
                        setFiftyFiftyRemaining((prev) => prev + 2)
                        setExtraLivesRemaining((prev) => prev + 2)
                    }
                }}
            />
        </>
    )

    const totalLevelPages = Math.max(
        levelPage + 1,
        Math.ceil((currentUnlockedLevel + 4) / LEVEL_PAGE_SIZE)
    )
    const maxLevelToShow = totalLevelPages * LEVEL_PAGE_SIZE
    const firstLevelOnPage = (levelPage - 1) * LEVEL_PAGE_SIZE + 1
    const visibleLevelCount = Math.min(
        LEVEL_PAGE_SIZE,
        maxLevelToShow - firstLevelOnPage + 1
    )

    if (loading) {
        return (
            <GameSplashScreen
                minDuration={750}
                loadingText="Loading Questions & Clues..."
            />
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

    if (DAILY_CHALLENGE_UI_ENABLED && showDailyChallenge) {
    return (
        <div className={`app ${theme}-theme`}>
            {navbar}
            <DailyChallenge
                onBack={() => setShowDailyChallenge(false)}
            />
        </div>
    )
}


if (showDailyMiniGames) {
    return (
        <div className={`app ${theme}-theme`}>
            {navbar}
            <DailyMiniGames
                onBack={() => setShowDailyMiniGames(false)}
            />
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

    if (showLevelsView) {
        return (
            <div className={`app ${theme}-theme game-view-wrapper`}>
                <GameWallpaper3D level={currentUnlockedLevel} />
                {navbar}
                <main className="dashboard-container levels-standalone-view">
                    <PlayerBackButton
                        onBack={() => setShowLevelsView(false)}
                        label="Back to Lobby"
                    />
                    <section className="dashboard-game" style={{ marginTop: '1rem' }}>
                        <div className="dashboard-game-heading">
                            <span className="dashboard-section-kicker">MAIN CAMPAIGN</span>
                            <h2><span aria-hidden="true">⚡</span> ClueShift Levels (1-100)</h2>
                            <p>Choose an unlocked level to play. Clear at least 3 questions to unlock the next level.</p>
                        </div>

                        <div className="player-category-filter">
                            <label htmlFor="player-category-levels-view">
                                Choose Category
                            </label>
                            <select
                                id="player-category-levels-view"
                                value={selectedCategory}
                                onChange={(e) =>
                                    fetchQuestions(
                                        localStorage.getItem('brainbuzz_token'),
                                        selectedLevel,
                                        e.target.value
                                    )
                                }
                                disabled={loadingPlayerCategories}
                            >
                                <option value="all">All Categories</option>
                                {playerCategories.map((category) => (
                                    <option key={category.id} value={String(category.id)}>
                                        {category.icon ? `${category.icon} ` : ''}
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="level-cards">
                            {Array.from({ length: visibleLevelCount }, (_, index) => {
                                const level = firstLevelOnPage + index
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
                                                        ? '⭐'.repeat(Number(progress.stars)) +
                                                          '☆'.repeat(3 - Number(progress.stars))
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
                                            onClick={() => {
                                                setShowLevelsView(false)
                                                startLevel(level)
                                            }}
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

                        {totalLevelPages > 1 && (
                            <nav className="level-pagination" aria-label="Level pages">
                                <button
                                    type="button"
                                    onClick={() => setLevelPage((page) => Math.max(1, page - 1))}
                                    disabled={levelPage === 1}
                                >
                                    ← Earlier levels
                                </button>
                                <span>
                                    Levels {firstLevelOnPage}–{firstLevelOnPage + visibleLevelCount - 1}
                                    <small>PAGE {levelPage} · ENDLESS LEVELS</small>
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setLevelPage((page) => Math.min(totalLevelPages, page + 1))
                                    }
                                    disabled={levelPage >= totalLevelPages}
                                >
                                    More levels: {levelPage * LEVEL_PAGE_SIZE + 1}–{(levelPage + 1) * LEVEL_PAGE_SIZE} →
                                </button>
                            </nav>
                        )}
                    </section>
                </main>
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


    // CLUESHIFT GAMES HUB
if (showGamesHub) {
    return (
        <div className={`app ${theme}-theme`}>
            {navbar}

           
<GamesHub
    onBack={() => setShowGamesHub(false)}
    onSelectMode={(modeId) => {
        setSelectedGameMode(modeId)

        if (modeId === 'iq') {
            setShowGamesHub(false)
            startLevel(selectedLevel)
            return
        }

        if (modeId === 'training') {
            setShowGamesHub(false)
            setMessage('Brain Training mode is coming next.')
            return
        }

        if (modeId === 'knowledge') {
            setShowGamesHub(false)
            setSelectedGameMode('knowledge')
            return
        }

        if (modeId === 'duel') {
            setShowGamesHub(false)
            setSelectedGameMode('duel')
        }
    }}
/>

        </div>
    )
}

    // CLUESHIFT BRAIN TRAINING
if (selectedGameMode === 'training') {
    return (
        <div className={`app ${theme}-theme`}>
            {navbar}

            <BrainTraining
                onBack={() => {
                    setSelectedGameMode(null)
                    setShowGamesHub(true)
                }}
            />
        </div>
    )
}

if (selectedGameMode === 'knowledge') {
    return (
        <div className={`app ${theme}-theme`}>
            {navbar}

            <KnowledgeChallenge
                onBack={() => {
                    setSelectedGameMode(null)
                    setShowGamesHub(true)
                }}
                onChallengeComplete={fetchDashboard}
            />
        </div>
    )
}

if (selectedGameMode === 'duel') {
    return (
        <div className={`app ${theme}-theme`}>
            {navbar}

            <BrainDuel
                onBack={() => {
                    setSelectedGameMode(null)
                    setShowGamesHub(true)
                }}
                onDuelComplete={() => fetchDashboard(localStorage.getItem('brainbuzz_token'))}
            />
        </div>
    )
}
  
    // DASHBOARD
    if (showDashboard) {
        return (
            <div className={`app ${theme}-theme`}>
                {navbar}

                <main className={`dashboard-container dashboard-arcade tab-active-${mobileDashboardTab}`}>
                    <HeroGameBanner
                        currentLevel={currentUnlockedLevel}
                        onPlay={() => startLevel(currentUnlockedLevel)}
                        onExploreGames={() => setShowGamesHub(true)}
                        onLeaderboard={() => setShowLeaderboard(true)}
                        onViewLevels={() => {
                            soundService.playClick()
                            setShowLevelsView(true)
                        }}
                    />

                    <section className="dashboard-stats" aria-label="Your game statistics">
                        <article className="stat-card stat-card-games">
                            <span className="stat-icon" aria-hidden="true">🎮</span>
                            <div><p>Games played</p><h2>{dashboardStats.games_played}</h2></div>
                            <i className="stat-card-glow" aria-hidden="true" />
                        </article>

                        <article className="stat-card stat-card-score">
                            <span className="stat-icon" aria-hidden="true">⭐</span>
                            <div><p>Total score</p><h2>{dashboardStats.total_score}</h2></div>
                            <i className="stat-card-glow" aria-hidden="true" />
                        </article>

                        <article className="stat-card stat-card-correct">
                            <span className="stat-icon" aria-hidden="true">✅</span>
                            <div><p>Correct answers</p><h2>{dashboardStats.total_correct}</h2></div>
                            <i className="stat-card-glow" aria-hidden="true" />
                        </article>

                        <article className="stat-card stat-card-wrong">
                            <span className="stat-icon" aria-hidden="true">🧩</span>
                            <div><p>Wrong answers</p><h2>{dashboardStats.total_wrong}</h2></div>
                            <i className="stat-card-glow" aria-hidden="true" />
                        </article>

                        <article className="stat-card stat-card-accuracy">
                            <span className="stat-icon" aria-hidden="true">🎯</span>
                            <div><p>Accuracy</p><h2>{dashboardStats.accuracy}%</h2></div>
                            <i className="stat-card-glow" aria-hidden="true" />
                        </article>
                    </section>

                    <section className="games-hub-promo">
                        <div className="games-hub-promo-content">
                            <h2>Arcade Games Hub</h2>
                            <p>PvP Duels, Speed Training &amp; Knowledge Challenges.</p>
                        </div>

                        <button
                            className="games-hub-promo-button"
                            onClick={() => setShowGamesHub(true)}
                        >
                            Play Other Modes <span>→</span>
                        </button>
                    </section>

                    <section className="dashboard-game" id="campaign-levels-section">
                        <div className="dashboard-game-heading">
                            <span className="dashboard-section-kicker">MAIN CAMPAIGN</span>
                            <h2><span aria-hidden="true">⚡</span> ClueShift Levels</h2>
                            <p>Clear at least 3 questions to unlock the next level.</p>
                        </div>
                      
                      <div className="player-category-filter">
    <label htmlFor="player-category">
        Choose Category
    </label>

    <select
        id="player-category"
        value={selectedCategory}
        onChange={(e) =>
    fetchQuestions(
        localStorage.getItem('brainbuzz_token'),
        selectedLevel,
        e.target.value
    )
}
        disabled={loadingPlayerCategories}
    >
        <option value="all">
            All Categories        

        </option>

        {playerCategories.map((category) => (
            <option
                key={category.id}
                value={String(category.id)}
            >
                {category.icon
                    ? `${category.icon} `
                    : ''}
                {category.name}
            </option>
        ))}
    </select>
</div>
                        <div className="level-cards">
                            {Array.from({ length: visibleLevelCount }, (_, index) => {
                                const level = firstLevelOnPage + index
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
                                                {totalLevelPages > 1 && (
                                                    <nav className="level-pagination" aria-label="Level pages">
                                                        <button
                                                            type="button"
                                                            onClick={() => setLevelPage(page => Math.max(1, page - 1))}
                                                            disabled={levelPage === 1}
                                                        >
                                                            ← Earlier levels
                                                        </button>
                                                        <span>
                                                            Levels {firstLevelOnPage}–{firstLevelOnPage + visibleLevelCount - 1}
                                                            <small>PAGE {levelPage} · ENDLESS LEVELS</small>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setLevelPage(page => Math.min(totalLevelPages, page + 1))}
                                                            disabled={levelPage >= totalLevelPages}
                                                        >
                                                            More levels: {levelPage * LEVEL_PAGE_SIZE + 1}–{(levelPage + 1) * LEVEL_PAGE_SIZE} →
                                                        </button>
                                                    </nav>
                                                )}
                                                <section className="dashboard-shortcuts" aria-label="Player shortcuts">
                                                    <div className="dashboard-shortcuts-heading">
                                                        <div>
                                                            <span className="dashboard-section-kicker">EXPLORE THE ARCADE</span>
                                                            <h2>More ways to play</h2>
                                                        </div>
                                                        <span>YOUR PLAYER HUB</span>
                                                    </div>
                                                    {DAILY_CHALLENGE_UI_ENABLED && (
                                                        <button
                                                            className="dashboard-btn"
                                                            type="button"
                                                            onClick={() => setShowDailyChallenge(true)}
                                                        >
                                                            <span className="dashboard-shortcut-icon">🎯</span>
                                                            <span className="dashboard-shortcut-copy">Daily Challenge<small>Take on a fresh challenge</small></span>
                                                            <i aria-hidden="true">↗</i>
                                                        </button>
                                                    )}

                                                    <button
                                                        className="dashboard-btn shortcut-minigames"
                                                        type="button"
                                                        onClick={() => setShowDailyMiniGames(true)}
                                                    >
                                                        <span className="dashboard-shortcut-icon">🕹️</span>
                                                        <span className="dashboard-shortcut-copy">Daily Mini Games<small>Quick games, big brain energy</small></span>
                                                        <i aria-hidden="true">↗</i>
                                                    </button>

                                                    <button
                                                        className="dashboard-btn shortcut-leaderboard"
                                                        type="button"
                                                        onClick={() => setShowLeaderboard(true)}
                                                    >
                                                        <span className="dashboard-shortcut-icon">🏆</span>
                                                        <span className="dashboard-shortcut-copy">Leaderboard<small>See where you rank</small></span>
                                                        <i aria-hidden="true">↗</i>
                                                    </button>

                                                    <button
                                                        className="dashboard-btn shortcut-achievements"
                                                        type="button"
                                                        onClick={() => setShowAchievements(true)}
                                                    >
                                                        <span className="dashboard-shortcut-icon">🏅</span>
                                                        <span className="dashboard-shortcut-copy">Achievements<small>Check your latest milestones</small></span>
                                                        <i aria-hidden="true">↗</i>
                                                    </button>

                                                    <button
                                                        className="dashboard-btn shortcut-how-to-play"
                                                        type="button"
                                                        onClick={() => setShowHowToPlay(true)}
                                                    >
                                                        <span className="dashboard-shortcut-icon">🎮</span>
                                                        <span className="dashboard-shortcut-copy">How to Play<small>Learn the rules and power-ups</small></span>
                                                        <i aria-hidden="true">↗</i>
                                                    </button>

                                                    <button
                                                        className="dashboard-btn shortcut-profile"
                                                        type="button"
                                                        onClick={() => setShowProfile(true)}
                                                    >
                                                        <span className="dashboard-shortcut-icon">👤</span>
                                                        <span className="dashboard-shortcut-copy">My Profile & History<small>Review your player journey</small></span>
                                                        <i aria-hidden="true">↗</i>
                                                    </button>

                                                    <button
                                                        className="dashboard-btn shortcut-feedback"
                                                        type="button"
                                                        onClick={() => setShowFeedback(true)}
                                                    >
                                                        <span className="dashboard-shortcut-icon">💬</span>
                                                        <span className="dashboard-shortcut-copy">Share Feedback<small>Help make ClueShift better</small></span>
                                                        <i aria-hidden="true">↗</i>
                                                    </button>
                                                </section>
                    </section>
                </main>

                {/* Real Mobile Game Console Bottom Nav Bar */}
                <nav className="mobile-game-bottom-nav" aria-label="Game Navigation">
                    <button
                        type="button"
                        className={`mobile-nav-btn ${mobileDashboardTab === 'play' ? 'active' : ''}`}
                        onClick={() => {
                            soundService.playClick()
                            setMobileDashboardTab('play')
                        }}
                    >
                        <span className="mobile-nav-icon">🎮</span>
                        <span className="mobile-nav-label">Play</span>
                    </button>

                    <button
                        type="button"
                        className={`mobile-nav-btn ${mobileDashboardTab === 'levels' || showLevelsView ? 'active' : ''}`}
                        onClick={() => {
                            soundService.playClick()
                            setShowLevelsView(true)
                        }}
                    >
                        <span className="mobile-nav-icon">⚡</span>
                        <span className="mobile-nav-label">Levels</span>
                    </button>

                    <button
                        type="button"
                        className={`mobile-nav-btn ${mobileDashboardTab === 'stats' ? 'active' : ''}`}
                        onClick={() => {
                            soundService.playClick()
                            setMobileDashboardTab('stats')
                        }}
                    >
                        <span className="mobile-nav-icon">📊</span>
                        <span className="mobile-nav-label">Stats</span>
                    </button>

                    <button
                        type="button"
                        className="mobile-nav-btn"
                        onClick={() => {
                            soundService.playClick()
                            setShowGamesHub(true)
                        }}
                    >
                        <span className="mobile-nav-icon">🕹️</span>
                        <span className="mobile-nav-label">Arcade</span>
                    </button>
                </nav>
            </div>
        )
    }

    // NO QUESTIONS
    if (questions.length === 0) {
        return (
            <div className={`app ${theme}-theme game-view-wrapper`}>
                <GameWallpaper3D level={selectedLevel} />
                {navbar}

                <main className="game-container glassmorphic">
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

                    <PlayerBackButton onClick={() => setShowDashboard(true)} />
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
            <div className={`app ${theme}-theme game-view-wrapper`}>
                <GameWallpaper3D level={selectedLevel} />
                {navbar}

                <main className="game-container glassmorphic">
                    <p className="level">
                        {passed ? 'LEVEL COMPLETED' : 'LEVEL NOT COMPLETED'}
                    </p>

                    <h1>
                        {passed ? '🎉 Challenge Completed!' : '❌ Level Failed!'}
                    </h1>

                    <p className="subtitle">
                        You have completed all {totalQuestions} questions in Level {selectedLevel}.
                    </p>
                    <div className="game-category-label">
    📂 {
        selectedCategory === 'all'
            ? 'All Categories'
            : playerCategories.find(
                (category) =>
                    String(category.id) === String(selectedCategory)
            )?.name || 'Selected Category'
    }
</div>

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
                        type="button"
                        className="share-score-trigger-btn"
                        onClick={() => {
                            soundService.playClick()
                            setScoreToShare({
                                level: selectedLevel,
                                score,
                                correctAnswers: correctCount,
                                totalQuestions,
                                passed,
                            })
                            setShowShareModal(true)
                        }}
                    >
                        📤 Share Score Card & Challenge Friends
                    </button>

                    <PlayerBackButton
                        disabled={savingResult}
                        onClick={async () => {
                            const token = localStorage.getItem('brainbuzz_token')
                            await fetchDashboard(token)
                            await fetchLevelProgress(token)
                            await fetchPlayerCategories(token)
                            setShowDashboard(true)
                        }}
                    />
                </main>
            </div>
        )
    }

    // MAIN GAME SCREEN
    return (
        <div className={`app ${theme}-theme game-view-wrapper`}>
            <GameWallpaper3D level={selectedLevel} />
            {navbar}

            {showLevelIntro && (
                <div className="level-intro-overlay">
                    <div className="level-intro-card">
                        <div className="level-intro-icon-wrapper">
                            <span className="level-intro-icon">🧠</span>
                        </div>
                        <span className="level-intro-badge">Level {selectedLevel} Ready</span>
                        <h2>Level {selectedLevel} Challenge</h2>
                        <p className="level-intro-desc">
                            Find the secret word that connects all 5 clues. Stay sharp, test your logic, and level up!
                        </p>
                        <div className="level-intro-rules">
                            <div className="level-intro-rule-pill"><span>❓</span> 5 Questions</div>
                            <div className="level-intro-rule-pill"><span>❤️</span> 3 Attempts</div>
                            <div className="level-intro-rule-pill"><span>💡</span> 3 Hints</div>
                        </div>
                        <button
                            type="button"
                            className="level-intro-start-btn"
                            onClick={() => setShowLevelIntro(false)}
                        >
                            🚀 START GAMEPLAY
                        </button>
                    </div>
                </div>
            )}

            <main className="game-container glassmorphic">
                <div className="game-top-actions">
                    <p className="level">LEVEL {selectedLevel}</p>

                    <PlayerBackButton
                        onClick={() => {
                            const confirmed = window.confirm(
                                'Are you sure you want to leave this game? Your current progress will not be saved.'
                            )

                            if (confirmed) {
                                resetGame()
                                setShowDashboard(true)
                            }
                        }}
                    />
                </div>

                <p className="subtitle">
                    Question {currentQuestionIndex + 1} of {questions.length}
                </p>

                <div className="game-category-label">
    📂 {
        selectedCategory === 'all'
            ? 'All Categories'
            : playerCategories.find(
                (category) =>
                    String(category.id) === String(selectedCategory)
            )?.name || 'Selected Category'
    }
</div>

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
                    <div className="game-lifelines-bar">
                        <div className="lifelines-btn-row">
                            <button
                                type="button"
                                className={`lifeline-chip ${showHint ? 'active' : ''}`}
                                disabled={!hintUsedForQuestion && hintsRemaining === 0}
                                onClick={() => {
                                    soundService.playPowerup()
                                    if (hintUsedForQuestion) {
                                        setShowHint(!showHint)
                                        return
                                    }
                                    if (hintsRemaining > 0) {
                                        setHintsRemaining((prev) => prev - 1)
                                        setHintUsedForQuestion(true)
                                        setShowHint(true)
                                    }
                                }}
                            >
                                <span>💡</span> Hint ({hintsRemaining})
                            </button>

                            <button
                                type="button"
                                className={`lifeline-chip ${fiftyFiftyActive ? 'active' : ''}`}
                                disabled={fiftyFiftyActive || fiftyFiftyRemaining === 0}
                                onClick={handleUseFiftyFifty}
                                title="50-50 Lifeline: Get 2 choices (1 correct, 1 wrong)"
                            >
                                <span>✂️</span> 50-50 ({fiftyFiftyRemaining})
                            </button>

                            <button
                                type="button"
                                className="lifeline-chip"
                                disabled={extraLivesRemaining === 0}
                                onClick={handleUseExtraLife}
                                title="Add +1 extra attempt to your life pool"
                            >
                                <span>❤️</span> +1 Attempt ({extraLivesRemaining})
                            </button>
                        </div>

                        {showHint && question.hint && (
                            <p className="hint-text">💡 <strong>Hint:</strong> {question.hint}</p>
                        )}

                        {extraLifeNotice && (
                            <div className="extra-life-banner">
                                {extraLifeNotice}
                            </div>
                        )}

                        {fiftyFiftyActive && fiftyFiftyChoices.length === 2 && (
                            <div className="fifty-fifty-box">
                                <div className="fifty-fifty-badge">✂️ 50-50 LIFELINE: 1 IS CORRECT, 1 IS WRONG</div>
                                <div className="fifty-fifty-options-grid">
                                    {fiftyFiftyChoices.map((choice, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className="fifty-choice-card"
                                            onClick={() => {
                                                soundService.playClick()
                                                setAnswer(choice)
                                            }}
                                        >
                                            <span className="choice-tag">{idx === 0 ? 'A' : 'B'}</span>
                                            <span className="choice-text">{choice}</span>
                                            <span className="choice-tap">Tap to Select</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="fifty-fifty-subtext">👆 Click an option above to fill your answer directly!</p>
                            </div>
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