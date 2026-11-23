import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './AdminDashboard.css'
import api, { getStorageUrl } from './services/api'
import {
    LayoutDashboard,
    FileQuestion,
    Folder,
    MessageCircle,
    Users,
    Trophy,
    Target,
    Sparkles,
    CheckCircle2,
    Star,
    Gamepad2,
    ChartNoAxesColumnIncreasing,
    Medal,
    RefreshCw,
    X,
    Plus,
    Settings as SettingsIcon,
    Download,
    Upload,
    Bot,
} from 'lucide-react'
import AdminDailyMiniGames from './AdminDailyMiniGames'
import AdminCsvImportModal from './AdminCsvImportModal'
import AdminAiQuestionModal from './AdminAiQuestionModal'
import AdminAnalyticsView from './AdminAnalyticsView'
import AdminSettingsTab from './AdminSettingsTab'

// Temporarily hide Daily Challenge while retaining its admin implementation.
const DAILY_CHALLENGE_UI_ENABLED = false
const ADMIN_TAB_PATHS = {
    overview: '/admin/overview',
    questions: '/admin/questions',
    categories: '/admin/categories',
    feedback: '/admin/feedback',
    players: '/admin/players',
    leaderboard: '/admin/leaderboard',
    'daily-mini-games': '/admin/daily-mini-games',
    settings: '/admin/settings',
}

function AdminDashboard({ admin, onLogout }) {
    const location = useLocation()
    const navigate = useNavigate()
    const activeTab = Object.keys(ADMIN_TAB_PATHS).find(
        (tab) => ADMIN_TAB_PATHS[tab] === location.pathname
    ) || 'overview'
    const setActiveTab = (tab) => {
        const path = ADMIN_TAB_PATHS[tab]

        if (path && location.pathname !== path) {
            navigate(path)
        }
    }

    useEffect(() => {
        const isTabPath = Object.values(ADMIN_TAB_PATHS).includes(location.pathname)

        if (location.pathname.startsWith('/admin') && !isTabPath) {
            navigate('/admin/overview', { replace: true })
        }
    }, [location.pathname, navigate])

    // Daily Challenge Management
const [dailyChallenges, setDailyChallenges] = useState([])
const [dailyChallengeCurrentPage, setDailyChallengeCurrentPage] = useState(1)
const DAILY_CHALLENGES_PER_PAGE = 5
const [loadingDailyChallenges, setLoadingDailyChallenges] = useState(false)
const [dailyChallengeError, setDailyChallengeError] = useState('')
const [dailyChallengeSuccess, setDailyChallengeSuccess] = useState('')
const [savingDailyChallenge, setSavingDailyChallenge] = useState(false)
const [editingDailyChallenge, setEditingDailyChallenge] = useState(null)
const [commentingDailyChallenge, setCommentingDailyChallenge] = useState(null)
const [dailyChallengeComment, setDailyChallengeComment] = useState('')
const [dailyChallengeCommentError, setDailyChallengeCommentError] = useState('')
const [savingDailyChallengeComment, setSavingDailyChallengeComment] = useState(false)

const [dailyChallengeForm, setDailyChallengeForm] = useState({
    challenge_date: new Date().toLocaleDateString('en-CA'),
    question_ids: [],
    bonus_points: 50,
    is_active: true,
})

    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
    const [isAiModalOpen, setIsAiModalOpen] = useState(false)
    const [exportingCsv, setExportingCsv] = useState(false)

    const handleExportCsv = async () => {
        try {
            setExportingCsv(true)
            const token = localStorage.getItem('brainbuzz_token')
            const response = await api.get('/admin/questions/export-csv', {
                headers: { Authorization: `Bearer ${token}` },
                params: { token },
                responseType: 'blob',
            })
            const blob = new Blob([response.data], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `clueshift-questions-${new Date().toISOString().slice(0, 10)}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            console.error('Export CSV Error:', err)
            const token = localStorage.getItem('brainbuzz_token')
            window.open(`${api.defaults.baseURL || '/api'}/admin/questions/export-csv?token=${token}`, '_blank')
        } finally {
            setExportingCsv(false)
        }
    }

    const [questions, setQuestions] = useState([])
    // Category Management
const [categories, setCategories] = useState([])
const [loadingCategories, setLoadingCategories] = useState(false)
const [categoryError, setCategoryError] = useState('')
const [categorySuccess, setCategorySuccess] = useState('')
const [savingCategory, setSavingCategory] = useState(false)
const [showCategoryForm, setShowCategoryForm] = useState(false)
const [editingCategory, setEditingCategory] = useState(null)
const [searchCategory, setSearchCategory] = useState('')
const [categoryCurrentPage, setCategoryCurrentPage] = useState(1)
const CATEGORIES_PER_PAGE = 5

const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
    is_active: true,
})
    const [feedback, setFeedback] = useState([])
    const [players, setPlayers] = useState([])
    const [loadingPlayers, setLoadingPlayers] = useState(true)
    const [playersError, setPlayersError] = useState('')
    const [searchPlayer, setSearchPlayer] = useState('')
    const [playerCurrentPage, setPlayerCurrentPage] = useState(1)
const PLAYERS_PER_PAGE = 5
    // Leaderboard Management
    const [leaderboard, setLeaderboard] = useState([])
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
    const [leaderboardError, setLeaderboardError] = useState('')
    const [searchLeaderboard, setSearchLeaderboard] = useState('')
    const [leaderboardCurrentPage, setLeaderboardCurrentPage] = useState(1)
    const LEADERBOARD_PER_PAGE = 5

    const [loadingQuestions, setLoadingQuestions] = useState(true)
    const [loadingFeedback, setLoadingFeedback] = useState(true)

    const [questionError, setQuestionError] = useState('')
    const [feedbackError, setFeedbackError] = useState('')

    const [searchQuestion, setSearchQuestion] = useState('')
    const [questionLevelFilter, setQuestionLevelFilter] = useState('all')
    const [questionCategoryFilter, setQuestionCategoryFilter] = useState('all')
    const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('all')
    const [feedbackCurrentPage, setFeedbackCurrentPage] = useState(1)
const FEEDBACK_PER_PAGE = 5
    const [questionCurrentPage, setQuestionCurrentPage] = useState(1)
const QUESTIONS_PER_PAGE = 5

    const [showQuestionForm, setShowQuestionForm] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState(null)

    const [deletingQuestionId, setDeletingQuestionId] = useState(null)
    const [deletingFeedbackId, setDeletingFeedbackId] = useState(null)

    const [questionForm, setQuestionForm] = useState({
    category_id: '',
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

setQuestions(
    Array.isArray(response.data.questions)
        ? response.data.questions
        : []
)        } catch (error) {
            console.error('Questions Fetch Error:', error)

            setQuestionError(
                error.response?.data?.message ||
                'Unable to load questions.'
            )
        } finally {
            setLoadingQuestions(false)
        }
    }

        // Fetch Categories
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true)
            setCategoryError('')

            const response = await api.get(
                '/admin/categories',
                authConfig
            )

            setCategories(response.data.categories || [])

        } catch (error) {
            console.error('Categories Fetch Error:', error)

            setCategoryError(
                error.response?.data?.message ||
                'Unable to load categories.'
            )
        } finally {
            setLoadingCategories(false)
        }
    }

        // Handle Category Form Input
    const handleCategoryInput = (e) => {
        const { name, value, type, checked } = e.target

        setCategoryForm((previous) => ({
            ...previous,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    // Open Add Category Form
    const openAddCategory = () => {
        setEditingCategory(null)

        setCategoryForm({
            name: '',
            description: '',
            icon: '',
            is_active: true,
        })

        setCategoryError('')
        setCategorySuccess('')
        setShowCategoryForm(true)
    }

    // Open Edit Category Form
    const openEditCategory = (category) => {
        setEditingCategory(category)

        setCategoryForm({
            name: category.name || '',
            description: category.description || '',
            icon: category.icon || '',
            is_active: Boolean(category.is_active),
        })

        setCategoryError('')
        setCategorySuccess('')
        setShowCategoryForm(true)
    }

    // Reset Category Form
    const resetCategoryForm = () => {
        setCategoryForm({
            name: '',
            description: '',
            icon: '',
            is_active: true,
        })

        setEditingCategory(null)
        setShowCategoryForm(false)
        setCategoryError('')
    }

        // Save Category
    const handleCategorySubmit = async (e) => {
        e.preventDefault()

        try {
            setSavingCategory(true)
            setCategoryError('')
            setCategorySuccess('')

            const payload = {
                name: categoryForm.name.trim(),
                description: categoryForm.description.trim() || null,
                icon: categoryForm.icon.trim() || null,
                is_active: Boolean(categoryForm.is_active),
            }

            if (editingCategory) {
                await api.put(
                    `/admin/categories/${editingCategory.id}`,
                    payload,
                    authConfig
                )

                setCategorySuccess('Category updated successfully!')
            } else {
                await api.post(
                    '/admin/categories',
                    payload,
                    authConfig
                )

                setCategorySuccess('Category created successfully!')
            }

            setShowCategoryForm(false)
            setEditingCategory(null)

            await fetchCategories()

        } catch (error) {
            console.error('Category Save Error:', error)

            setCategoryError(
                error.response?.data?.message ||
                'Unable to save category.'
            )
        } finally {
            setSavingCategory(false)
        }
    }

    // Delete Category
    const handleDeleteCategory = async (category) => {
        if (
            !window.confirm(
                `Delete "${category.name}" category? Its questions will remain uncategorized.`
            )
        ) {
            return
        }

        try {
            await api.delete(
                `/admin/categories/${category.id}`,
                authConfig
            )

            setCategorySuccess('Category deleted successfully!')

            await fetchCategories()
            await fetchQuestions()

        } catch (error) {
            console.error('Category Delete Error:', error)

            setCategoryError(
                error.response?.data?.message ||
                'Unable to delete category.'
            )
        }
    }

    // Fetch Daily Challenges
const fetchDailyChallenges = async () => {
    try {
        setLoadingDailyChallenges(true)
        setDailyChallengeError('')

        const response = await api.get(
            '/admin/daily-challenges',
            authConfig
        )

        setDailyChallenges(response.data.challenges || [])
    } catch (error) {
        console.error('Daily Challenges Fetch Error:', error)

        setDailyChallengeError(
            error.response?.data?.message ||
            'Unable to load daily challenges.'
        )
    } finally {
        setLoadingDailyChallenges(false)
    }
}
      
    // Handle Daily Challenge Form
const handleDailyChallengeInput = (e) => {
    const { name, value, type, checked } = e.target

    setDailyChallengeForm((previous) => ({
        ...previous,
        [name]: type === 'checkbox' ? checked : value,
    }))
}

// Select / Deselect Challenge Questions
const toggleDailyChallengeQuestion = (questionId) => {
    setDailyChallengeForm((previous) => {
        const selected = previous.question_ids

        if (selected.includes(questionId)) {
            return {
                ...previous,
                question_ids: selected.filter((id) => id !== questionId),
            }
        }

        if (selected.length >= 5) {
            setDailyChallengeError('You can select exactly 5 questions.')
            return previous
        }

        setDailyChallengeError('')

        return {
            ...previous,
            question_ids: [...selected, questionId],
        }
    })
}

// Reset Daily Challenge Form
const resetDailyChallengeForm = () => {
    setEditingDailyChallenge(null)

    setDailyChallengeForm({
        challenge_date: new Date().toLocaleDateString('en-CA'),
        question_ids: [],
        bonus_points: 50,
        is_active: true,
    })

    setDailyChallengeError('')
    setDailyChallengeSuccess('')
}

// Create / Update Daily Challenge
const handleDailyChallengeSubmit = async (e) => {
    e.preventDefault()

    if (dailyChallengeForm.question_ids.length !== 5) {
        setDailyChallengeError('Please select exactly 5 questions.')
        return
    }

    try {
        setSavingDailyChallenge(true)
        setDailyChallengeError('')
        setDailyChallengeSuccess('')

        const payload = {
            ...dailyChallengeForm,
            bonus_points: Number(dailyChallengeForm.bonus_points),
        }

        if (editingDailyChallenge) {
            await api.put(
                `/admin/daily-challenges/${editingDailyChallenge.id}`,
                payload,
                authConfig
            )
            setDailyChallengeSuccess('Daily challenge updated successfully.')
        } else {
            await api.post(
                '/admin/daily-challenges',
                payload,
                authConfig
            )
            setDailyChallengeSuccess('Daily challenge created successfully.')
        }

        resetDailyChallengeForm()
        await fetchDailyChallenges()
    } catch (error) {
        setDailyChallengeError(
            error.response?.data?.message ||
            'Unable to save daily challenge.'
        )
    } finally {
        setSavingDailyChallenge(false)
    }
}

// Edit Daily Challenge
const handleEditDailyChallenge = (challenge) => {
    setEditingDailyChallenge(challenge)

    setDailyChallengeForm({
        challenge_date: String(challenge.challenge_date).slice(0, 10),
        question_ids: (challenge.question_ids || []).map(Number),
        bonus_points: challenge.bonus_points,
        is_active: Boolean(challenge.is_active),
    })

    setDailyChallengeError('')
    setDailyChallengeSuccess('')
    setActiveTab('daily-challenges')
}

const openDailyChallengeComment = (challenge) => {
    setCommentingDailyChallenge(challenge)
    setDailyChallengeComment(challenge.admin_comment || '')
    setDailyChallengeCommentError('')
}

const closeDailyChallengeComment = () => {
    setCommentingDailyChallenge(null)
    setDailyChallengeCommentError('')
}

const handleDailyChallengeCommentSubmit = async (e) => {
    e.preventDefault()

    if (!commentingDailyChallenge) {
        return
    }

    const adminComment = dailyChallengeComment.trim() || null

    try {
        setSavingDailyChallengeComment(true)
        setDailyChallengeCommentError('')

        await api.patch(
            `/admin/daily-challenges/${commentingDailyChallenge.id}/comment`,
            { admin_comment: adminComment },
            authConfig
        )

        setDailyChallenges((previous) =>
            previous.map((challenge) =>
                challenge.id === commentingDailyChallenge.id
                    ? { ...challenge, admin_comment: adminComment }
                    : challenge
            )
        )
        setDailyChallengeSuccess('Admin comment saved successfully.')
        setCommentingDailyChallenge(null)
    } catch (error) {
        console.error('Daily Challenge Comment Save Error:', error)
        setDailyChallengeCommentError(
            error.response?.data?.message ||
            'Unable to save admin comment.'
        )
    } finally {
        setSavingDailyChallengeComment(false)
    }
}

// Delete Daily Challenge
const handleDeleteDailyChallenge = async (challenge) => {
    if (Number(challenge.attempts_count || 0) > 0) {
        setDailyChallengeError('Challenges with attempts cannot be deleted.')
        return
    }

    if (!window.confirm('Are you sure you want to delete this daily challenge?')) {
        return
    }

    try {
        setDailyChallengeError('')
        setDailyChallengeSuccess('')

        await api.delete(
            `/admin/daily-challenges/${challenge.id}`,
            authConfig
        )

        setDailyChallengeSuccess('Daily challenge deleted successfully.')
        await fetchDailyChallenges()
    } catch (error) {
        setDailyChallengeError(
            error.response?.data?.message ||
            'Unable to delete daily challenge.'
        )
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

   // Fetch Admin Leaderboard
const fetchLeaderboard = async (search = '') => {
    try {
        setLoadingLeaderboard(true)
        setLeaderboardError('')

        const response = await api.get(
            `/admin/leaderboard${search ? `?search=${encodeURIComponent(search)}` : ''}`,
            authConfig
        )

        setLeaderboard(response.data.leaderboard || [])

    } catch (error) {
        console.error('Leaderboard Fetch Error:', error)

        setLeaderboardError(
            error.response?.data?.message ||
            'Unable to load leaderboard.'
        )
    } finally {
        setLoadingLeaderboard(false)
    }
}

    useEffect(() => {
    fetchQuestions()
    fetchFeedback()
    fetchPlayers()
    if (DAILY_CHALLENGE_UI_ENABLED) {
        fetchDailyChallenges()
    }
    fetchCategories()
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


// Automatic Leaderboard Search
useEffect(() => {
    if (activeTab !== 'leaderboard') {
        return
    }

    const searchTimer = setTimeout(() => {
        fetchLeaderboard(searchLeaderboard)
    }, 400)

    return () => clearTimeout(searchTimer)
}, [searchLeaderboard, activeTab])


    // LEADERBOARD PAGINATION

const totalLeaderboardPages = Math.ceil(
    leaderboard.length / LEADERBOARD_PER_PAGE
)

const leaderboardPageNumbers = useMemo(() => {
    if (totalLeaderboardPages <= 3) {
        return Array.from(
            { length: totalLeaderboardPages },
            (_, index) => index + 1
        )
    }

    if (leaderboardCurrentPage <= 2) {
        return [1, 2, 3, '...', totalLeaderboardPages]
    }

    if (leaderboardCurrentPage >= totalLeaderboardPages - 1) {
        return [
            1,
            '...',
            totalLeaderboardPages - 2,
            totalLeaderboardPages - 1,
            totalLeaderboardPages
        ]
    }

    return [
        1,
        '...',
        leaderboardCurrentPage - 1,
        leaderboardCurrentPage,
        leaderboardCurrentPage + 1,
        '...',
        totalLeaderboardPages
    ]
}, [totalLeaderboardPages, leaderboardCurrentPage])

const paginatedLeaderboard = useMemo(() => {
    const startIndex =
        (leaderboardCurrentPage - 1) * LEADERBOARD_PER_PAGE

    return leaderboard.slice(
        startIndex,
        startIndex + LEADERBOARD_PER_PAGE
    )
}, [leaderboard, leaderboardCurrentPage])

useEffect(() => {
    setLeaderboardCurrentPage(1)
}, [searchLeaderboard])

useEffect(() => {
    if (
        totalLeaderboardPages === 0 &&
        leaderboardCurrentPage !== 1
    ) {
        setLeaderboardCurrentPage(1)
    } else if (
        totalLeaderboardPages > 0 &&
        leaderboardCurrentPage > totalLeaderboardPages
    ) {
        setLeaderboardCurrentPage(totalLeaderboardPages)
    }
}, [totalLeaderboardPages, leaderboardCurrentPage])


         // DAILY CHALLENGES PAGINATION

    const totalDailyChallengePages = Math.ceil(
        dailyChallenges.length / DAILY_CHALLENGES_PER_PAGE
    )

    const dailyChallengePageNumbers = useMemo(() => {
        if (totalDailyChallengePages <= 3) {
            return Array.from(
                { length: totalDailyChallengePages },
                (_, index) => index + 1
            )
        }

        if (dailyChallengeCurrentPage <= 2) {
            return [1, 2, 3, '...', totalDailyChallengePages]
        }

        if (dailyChallengeCurrentPage >= totalDailyChallengePages - 1) {
            return [
                1,
                '...',
                totalDailyChallengePages - 2,
                totalDailyChallengePages - 1,
                totalDailyChallengePages
            ]
        }

        return [
            1,
            '...',
            dailyChallengeCurrentPage - 1,
            dailyChallengeCurrentPage,
            dailyChallengeCurrentPage + 1,
            '...',
            totalDailyChallengePages
        ]
    }, [totalDailyChallengePages, dailyChallengeCurrentPage])

    const paginatedDailyChallenges = useMemo(() => {
        const startIndex =
            (dailyChallengeCurrentPage - 1) * DAILY_CHALLENGES_PER_PAGE

        return dailyChallenges.slice(
            startIndex,
            startIndex + DAILY_CHALLENGES_PER_PAGE
        )
    }, [dailyChallenges, dailyChallengeCurrentPage])

    useEffect(() => {
        setDailyChallengeCurrentPage(1)
    }, [dailyChallenges.length])

    useEffect(() => {
        if (
            totalDailyChallengePages === 0 &&
            dailyChallengeCurrentPage !== 1
        ) {
            setDailyChallengeCurrentPage(1)
        } else if (
            totalDailyChallengePages > 0 &&
            dailyChallengeCurrentPage > totalDailyChallengePages
        ) {
            setDailyChallengeCurrentPage(totalDailyChallengePages)
        }
    }, [totalDailyChallengePages, dailyChallengeCurrentPage])

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

            const matchesCategory =
                questionCategoryFilter === 'all' ||
                (
                    questionCategoryFilter === 'uncategorized'
                        ? !question.category_id
                        : String(question.category_id) ===
                          String(questionCategoryFilter)
                )

            return matchesSearch && matchesLevel && matchesCategory
        })
    }, [
        questions,
        searchQuestion,
        questionLevelFilter,
        questionCategoryFilter,
    ])

        const totalQuestionPages = Math.ceil(
        filteredQuestions.length / QUESTIONS_PER_PAGE
    )

const questionPageNumbers = useMemo(() => {
    if (totalQuestionPages <= 3) {
        return Array.from(
            { length: totalQuestionPages },
            (_, index) => index + 1
        )
    }

    if (questionCurrentPage <= 2) {
        return [1, 2, 3, '...', totalQuestionPages]
    }

    if (questionCurrentPage >= totalQuestionPages - 1) {
        return [
            1,
            '...',
            totalQuestionPages - 2,
            totalQuestionPages - 1,
            totalQuestionPages
        ]
    }

    return [
        1,
        '...',
        questionCurrentPage - 1,
        questionCurrentPage,
        questionCurrentPage + 1,
        '...',
        totalQuestionPages
    ]
}, [totalQuestionPages, questionCurrentPage])



    const paginatedQuestions = useMemo(() => {
        const startIndex =
            (questionCurrentPage - 1) * QUESTIONS_PER_PAGE

        return filteredQuestions.slice(
            startIndex,
            startIndex + QUESTIONS_PER_PAGE
        )
    }, [filteredQuestions, questionCurrentPage])

    useEffect(() => {
        setQuestionCurrentPage(1)
    }, [
        searchQuestion,
        questionLevelFilter,
        questionCategoryFilter,
    ])


    // CATEGORY PAGINATION

    const filteredCategories = useMemo(() => {
        const search = searchCategory.toLowerCase().trim()

        return categories.filter((category) => {
            return (
                !search ||
                category.name?.toLowerCase().includes(search) ||
                category.description?.toLowerCase().includes(search)
            )
        })
    }, [categories, searchCategory])

    const totalCategoryPages = Math.ceil(
        filteredCategories.length / CATEGORIES_PER_PAGE
    )

    const categoryPageNumbers = useMemo(() => {
        if (totalCategoryPages <= 3) {
            return Array.from(
                { length: totalCategoryPages },
                (_, index) => index + 1
            )
        }

        if (categoryCurrentPage <= 2) {
            return [1, 2, 3, '...', totalCategoryPages]
        }

        if (categoryCurrentPage >= totalCategoryPages - 1) {
            return [
                1,
                '...',
                totalCategoryPages - 2,
                totalCategoryPages - 1,
                totalCategoryPages
            ]
        }

        return [
            1,
            '...',
            categoryCurrentPage - 1,
            categoryCurrentPage,
            categoryCurrentPage + 1,
            '...',
            totalCategoryPages
        ]
    }, [totalCategoryPages, categoryCurrentPage])

    const paginatedCategories = useMemo(() => {
        const startIndex =
            (categoryCurrentPage - 1) * CATEGORIES_PER_PAGE

        return filteredCategories.slice(
            startIndex,
            startIndex + CATEGORIES_PER_PAGE
        )
    }, [filteredCategories, categoryCurrentPage])

    useEffect(() => {
        setCategoryCurrentPage(1)
    }, [searchCategory])

    useEffect(() => {
        if (totalCategoryPages === 0 && categoryCurrentPage !== 1) {
            setCategoryCurrentPage(1)
        } else if (
            totalCategoryPages > 0 &&
            categoryCurrentPage > totalCategoryPages
        ) {
            setCategoryCurrentPage(totalCategoryPages)
        }
    }, [totalCategoryPages, categoryCurrentPage])

    
    const filteredFeedback = useMemo(() => {
        return feedback.filter((item) => {
            if (feedbackRatingFilter === 'all') {
                return true
            }

            return String(item.rating) === String(feedbackRatingFilter)
        })
    }, [feedback, feedbackRatingFilter])

    const feedbackSummary = useMemo(() => {
        const ratings = [5, 4, 3, 2, 1].map((rating) => ({
            rating,
            count: feedback.filter(
                (item) => Number(item.rating) === rating
            ).length,
        }))
        const total = feedback.length
        const positiveCount = ratings
            .filter(({ rating }) => rating >= 4)
            .reduce((count, item) => count + item.count, 0)

        return {
            total,
            ratings,
            averageRating: total
                ? feedback.reduce(
                      (sum, item) => sum + Number(item.rating || 0),
                      0
                  ) / total
                : 0,
            positiveCount,
            positivePercentage: total
                ? Math.round((positiveCount / total) * 100)
                : 0,
        }
    }, [feedback])


// FEEDBACK PAGINATION

const totalFeedbackPages = Math.ceil(
    filteredFeedback.length / FEEDBACK_PER_PAGE
)

const feedbackPageNumbers = useMemo(() => {
    if (totalFeedbackPages <= 3) {
        return Array.from(
            { length: totalFeedbackPages },
            (_, index) => index + 1
        )
    }

    if (feedbackCurrentPage <= 2) {
        return [1, 2, 3, '...', totalFeedbackPages]
    }

    if (feedbackCurrentPage >= totalFeedbackPages - 1) {
        return [
            1,
            '...',
            totalFeedbackPages - 2,
            totalFeedbackPages - 1,
            totalFeedbackPages
        ]
    }

    return [
        1,
        '...',
        feedbackCurrentPage - 1,
        feedbackCurrentPage,
        feedbackCurrentPage + 1,
        '...',
        totalFeedbackPages
    ]
}, [totalFeedbackPages, feedbackCurrentPage])

const paginatedFeedback = useMemo(() => {
    const startIndex =
        (feedbackCurrentPage - 1) * FEEDBACK_PER_PAGE

    return filteredFeedback.slice(
        startIndex,
        startIndex + FEEDBACK_PER_PAGE
    )
}, [filteredFeedback, feedbackCurrentPage])

useEffect(() => {
    setFeedbackCurrentPage(1)
}, [feedbackRatingFilter])

useEffect(() => {
    if (totalFeedbackPages === 0 && feedbackCurrentPage !== 1) {
        setFeedbackCurrentPage(1)
    } else if (
        totalFeedbackPages > 0 &&
        feedbackCurrentPage > totalFeedbackPages
    ) {
        setFeedbackCurrentPage(totalFeedbackPages)
    }
}, [totalFeedbackPages, feedbackCurrentPage])


// PLAYER PAGINATION

const totalPlayerPages = Math.ceil(
    players.length / PLAYERS_PER_PAGE
)

const playerPageNumbers = useMemo(() => {
    if (totalPlayerPages <= 3) {
        return Array.from(
            { length: totalPlayerPages },
            (_, index) => index + 1
        )
    }

    if (playerCurrentPage <= 2) {
        return [1, 2, 3, '...', totalPlayerPages]
    }

    if (playerCurrentPage >= totalPlayerPages - 1) {
        return [
            1,
            '...',
            totalPlayerPages - 2,
            totalPlayerPages - 1,
            totalPlayerPages
        ]
    }

    return [
        1,
        '...',
        playerCurrentPage - 1,
        playerCurrentPage,
        playerCurrentPage + 1,
        '...',
        totalPlayerPages
    ]
}, [totalPlayerPages, playerCurrentPage])

const paginatedPlayers = useMemo(() => {
    const startIndex =
        (playerCurrentPage - 1) * PLAYERS_PER_PAGE

    return players.slice(
        startIndex,
        startIndex + PLAYERS_PER_PAGE
    )
}, [players, playerCurrentPage])

useEffect(() => {
    setPlayerCurrentPage(1)
}, [searchPlayer])

useEffect(() => {
    if (totalPlayerPages === 0 && playerCurrentPage !== 1) {
        setPlayerCurrentPage(1)
    } else if (
        totalPlayerPages > 0 &&
        playerCurrentPage > totalPlayerPages
    ) {
        setPlayerCurrentPage(totalPlayerPages)
    }
}, [totalPlayerPages, playerCurrentPage])


        const resetQuestionForm = () => {
        setQuestionForm({
            category_id: '',
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
    category_id: '',
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
            category_id: question.category_id
    ? String(question.category_id)
    : '',
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
                category_id: questionForm.category_id
                    ? Number(questionForm.category_id)
                    : null,
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
                    is_active: !question.is_active,
                },
                authConfig
            )

            setQuestions((previous) =>
                previous.map((item) =>
                    item.id === question.id
                        ? {
                            ...item,
                            is_active: !item.is_active,
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
        const newStatus = !player.is_active

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
                    <img src="/clueshift-logo.png" alt="ClueShift" className="admin-logo-img" />

                    <div>
                        <h2>ClueShift Admin</h2>
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
        <span><LayoutDashboard size={18} /></span>
        Overview
    </button>

    <button
        className={`admin-nav-btn ${
            activeTab === 'questions' ? 'active' : ''
        }`}
        onClick={() => setActiveTab('questions')}
    >
        <span><FileQuestion size={18} /></span>
        Questions
    </button>


        <button
        className={`admin-nav-btn ${
            activeTab === 'categories' ? 'active' : ''
        }`}
        onClick={() => {
            setActiveTab('categories')
            fetchCategories()
        }}
    >
        <span><Folder size={18} /></span>
        Categories
    </button>

    <button
        className={`admin-nav-btn ${
            activeTab === 'feedback' ? 'active' : ''
        }`}
        onClick={() => setActiveTab('feedback')}
    >
        <span><MessageCircle size={18} /></span>
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
        <span><Users size={18} /></span>
        Players
    </button>

    <button
    className={`admin-nav-btn ${
        activeTab === 'leaderboard' ? 'active' : ''
    }`}
    onClick={() => {
        setActiveTab('leaderboard')
        fetchLeaderboard()
    }}
>
    <span><Trophy size={18} /></span>
    Leaderboard
</button>

{DAILY_CHALLENGE_UI_ENABLED && (
    <button
        className={`admin-nav-btn ${
            activeTab === 'daily-challenges' ? 'active' : ''
        }`}
        onClick={() => {
            setActiveTab('daily-challenges')
            fetchDailyChallenges()
        }}
    >
       <span><Target size={18} /></span>
        Daily Challenges
    </button>
)}

<button
    className={`admin-nav-btn ${
        activeTab === 'daily-mini-games' ? 'active' : ''
    }`}
    onClick={() => setActiveTab('daily-mini-games')}
>
    <span><Gamepad2 size={18} /></span>
    Daily Mini Games
</button>

<button
    className={`admin-nav-btn ${
        activeTab === 'settings' ? 'active' : ''
    }`}
    onClick={() => setActiveTab('settings')}
>
    <span><SettingsIcon size={18} /></span>
    Settings
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

                                    <h1>Welcome back, {admin?.name || 'Admin'}</h1>

                                    <p>
                                        Manage ClueShift content and player feedback from one place.
                                    </p>
                                </div>

                                <div className="admin-heading-actions">
                                    <button
                                        className="admin-secondary-btn"
                                        onClick={() => setIsCsvModalOpen(true)}
                                    >
                                        <Upload size={16} /> Import CSV
                                    </button>
                                    <button
                                        className="admin-secondary-btn"
                                        onClick={handleExportCsv}
                                        disabled={exportingCsv}
                                    >
                                        <Download size={16} /> {exportingCsv ? 'Exporting...' : 'Export CSV'}
                                    </button>
                                    <button
                                        className="admin-secondary-btn ai-action-btn"
                                        onClick={() => setIsAiModalOpen(true)}
                                    >
                                        <Bot size={16} /> AI Generator
                                    </button>
                                    <button
                                        className="admin-primary-btn"
                                        onClick={openAddQuestion}
                                    >
                                        + Add Question
                                    </button>
                                </div>
                            </div>

                            <AdminAnalyticsView />

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
                                        Add, edit and manage ClueShift questions.
                                    </p>
                                </div>

                                <div className="admin-heading-actions">
                                    <button
                                        className="admin-secondary-btn"
                                        onClick={() => setIsCsvModalOpen(true)}
                                    >
                                        <Upload size={16} /> Import CSV
                                    </button>
                                    <button
                                        className="admin-secondary-btn"
                                        onClick={handleExportCsv}
                                        disabled={exportingCsv}
                                    >
                                        <Download size={16} /> {exportingCsv ? 'Exporting...' : 'Export CSV'}
                                    </button>
                                    <button
                                        className="admin-secondary-btn ai-action-btn"
                                        onClick={() => setIsAiModalOpen(true)}
                                    >
                                        <Bot size={16} /> AI Generator
                                    </button>
                                    <button
                                        className="admin-primary-btn"
                                        onClick={openAddQuestion}
                                    >
                                        + Add Question
                                    </button>
                                </div>
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
                                                            <select
                                    value={questionCategoryFilter}
                                    onChange={(e) =>
                                        setQuestionCategoryFilter(e.target.value)
                                    }
                                >
                                    <option value="all">
                                        All Categories
                                    </option>

                                    <option value="uncategorized">
                                        Uncategorized
                                    </option>

                                    {categories.map((category) => (
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
                        <>
                            <div className="admin-table-wrapper">

                                    <table className="admin-table">

                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Question</th>
                                                <th>Category</th>
                                                <th>Level</th>
                                                <th>Points</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                 {paginatedQuestions.map(
                                                (question) => (
                                                    <tr key={question.id}>

                                                        <td>
                                                            #{question.id}
                                                        </td>

                                                        <td>
                                                            <div className="admin-question-title">
                                                                {question.title}
                                                            </div>

                                                            <div className="admin-question-answer">
                                                                <strong>Answer:</strong> {question.answer}
                                                            </div>
                                                        </td>

                                                        <td>
                                                            {question.category ? (
                                                                <>
                                                                    {question.category.icon
                                                                        ? `${question.category.icon} `
                                                                        : ''}
                                                                    {question.category.name}
                                                                </>
                                                            ) : (
                                                                'Uncategorized'
                                                            )}
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

                                <div className="admin-pagination">
                                    <span className="admin-pagination-info">
                                        Showing {
                                            filteredQuestions.length === 0
                                                ? 0
                                                : (questionCurrentPage - 1) * QUESTIONS_PER_PAGE + 1
                                        } - {
                                            Math.min(
                                                questionCurrentPage * QUESTIONS_PER_PAGE,
                                                filteredQuestions.length
                                            )
                                        } of {filteredQuestions.length} questions
                                    </span>

                                    <div className="admin-pagination-buttons">
                                        <button
                                            type="button"
                                            disabled={questionCurrentPage === 1}
                                            onClick={() => setQuestionCurrentPage(page => page - 1)}
                                        >
                                            Previous
                                        </button>

                                      
{questionPageNumbers.map((page, index) =>
    page === '...' ? (
        <span
            key={`ellipsis-${index}`}
            className="admin-pagination-ellipsis"
        >
            ...
        </span>
    ) : (
        <button
            type="button"
            key={page}
            className={questionCurrentPage === page ? 'active' : ''}
            onClick={() => setQuestionCurrentPage(page)}
        >
            {page}
        </button>
    )
)}


                                        <button
                                            type="button"
                                            disabled={
                                                questionCurrentPage >= totalQuestionPages ||
                                                totalQuestionPages === 0
                                            }
                                            onClick={() => setQuestionCurrentPage(page =>
                                                Math.min(page + 1, totalQuestionPages)
                                            )}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                              </>
                            )}

                        </section>
                    )}
                                         {activeTab === 'categories' && (
                        <section>
                            <div className="admin-page-heading">
                                <div>
                                    <span className="admin-eyebrow">
                                        CONTENT MANAGEMENT
                                    </span>
                                    <h1>Categories</h1>
                                    <p>
                                        Manage question categories for ClueShift.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="admin-primary-btn"
                                    onClick={openAddCategory}
                                >
                                    + Add Category
                                </button>
                            </div>

                            {categorySuccess && (
                                <div className="admin-success-box">
                                    {categorySuccess}
                                </div>
                            )}

                            {categoryError && (
                                <div className="admin-error-box">
                                    {categoryError}
                                </div>
                            )}

                            <div className="admin-toolbar">
                                <input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={searchCategory}
                                    onChange={(e) =>
                                        setSearchCategory(e.target.value)
                                    }
                                />
                            </div>

                            {loadingCategories ? (
                                <div className="admin-loading">
                                    Loading categories...
                                </div>
                            ) : (
                                <>
                                <div className="admin-table-wrapper">
                                    <table className="admin-table admin-daily-challenge-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Category</th>
                                                <th>Description</th>
                                                <th>Questions</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                          
{paginatedCategories.map((category) => (
    <tr key={category.id}>
        <td>{category.id}</td>

        <td>
            {category.icon ? `${category.icon} ` : ''}
            {category.name}
        </td>

        <td>
            {category.description || '—'}
        </td>

        <td>
            {category.questions_count || 0}
        </td>

        <td>
            <span
                className={
                    category.is_active
                        ? 'admin-status-active'
                        : 'admin-status-inactive'
                }
            >
                {category.is_active ? 'Active' : 'Inactive'}
            </span>
        </td>

        <td>
            <button
                className="admin-edit-btn"
                onClick={() => openEditCategory(category)}
            >
                Edit
            </button>

            <button
                className="admin-delete-btn"
                onClick={() => handleDeleteCategory(category)}
            >
                Delete
            </button>
        </td>
    </tr>
))}

{filteredCategories.length === 0 && (
    <tr>
        <td colSpan="6">
            No categories found.
        </td>
    </tr>
)}

                                        </tbody>
                                    </table>
                                </div>

<div className="admin-pagination">
    <div className="admin-pagination-info">
        Showing {filteredCategories.length === 0 ? 0 : (categoryCurrentPage - 1) * CATEGORIES_PER_PAGE + 1} - {Math.min(categoryCurrentPage * CATEGORIES_PER_PAGE, filteredCategories.length)} of {filteredCategories.length} categories
    </div>

    <div className="admin-pagination-buttons">
        <button
            type="button"
            disabled={categoryCurrentPage === 1}
            onClick={() => setCategoryCurrentPage(page => page - 1)}
        >
            Previous
        </button>

        {categoryPageNumbers.map((page, index) =>
            page === '...' ? (
                <span
                    className="admin-pagination-ellipsis"
                    key={`category-ellipsis-${index}`}
                >
                    ...
                </span>
            ) : (
                <button
                    type="button"
                    key={page}
                    className={categoryCurrentPage === page ? 'active' : ''}
                    onClick={() => setCategoryCurrentPage(page)}
                >
                    {page}
                </button>
            )
        )}

        <button
            type="button"
            disabled={categoryCurrentPage >= totalCategoryPages || totalCategoryPages === 0}
            onClick={() => setCategoryCurrentPage(page => Math.min(page + 1, totalCategoryPages))}
        >
            Next
        </button>
    </div>
</div>

                                </>
                            )}
                        </section>
                    )}


                   
{activeTab === 'feedback' && (
    <section className="admin-section admin-feedback-section">
        <div className="admin-feedback-heading">
            <div>
                <span className="admin-eyebrow">PLAYER VOICE</span>
                <h1>Player Feedback</h1>
                <p>See how players feel about their ClueShift experience.</p>
            </div>

            <button
                type="button"
                className="admin-refresh-btn admin-feedback-refresh"
                onClick={fetchFeedback}
                disabled={loadingFeedback}
            >
                <RefreshCw
                    size={16}
                    className={loadingFeedback ? 'admin-refresh-spinning' : ''}
                />
                {loadingFeedback ? 'Refreshing...' : 'Refresh feedback'}
            </button>
        </div>

        <div className="admin-feedback-summary">
            <article className="admin-feedback-stat">
                <div className="admin-feedback-stat-icon">
                    <MessageCircle size={19} />
                </div>
                <span className="admin-feedback-stat-label">Total responses</span>
                <strong>{feedbackSummary.total}</strong>
                <span className="admin-feedback-stat-note">Player submissions</span>
            </article>

            <article className="admin-feedback-stat">
                <div className="admin-feedback-stat-icon is-rating">
                    <Star size={19} />
                </div>
                <span className="admin-feedback-stat-label">Average rating</span>
                <strong>
                    {feedbackSummary.total
                        ? feedbackSummary.averageRating.toFixed(1)
                        : '—'}
                    <small>/ 5</small>
                </strong>
                <span className="admin-feedback-stat-note">
                    Across all responses
                </span>
            </article>

            <article className="admin-feedback-stat">
                <div className="admin-feedback-stat-icon is-positive">
                    <CheckCircle2 size={19} />
                </div>
                <span className="admin-feedback-stat-label">Positive ratings</span>
                <strong>{feedbackSummary.positivePercentage}%</strong>
                <span className="admin-feedback-stat-note">
                    {feedbackSummary.positiveCount} rated 4 or 5 stars
                </span>
            </article>
        </div>

        <div className="admin-feedback-breakdown">
            <div className="admin-feedback-breakdown-heading">
                <div>
                    <h2>Rating breakdown</h2>
                    <p>Select a rating to filter responses</p>
                </div>
                {feedbackRatingFilter !== 'all' && (
                    <button
                        type="button"
                        className="admin-feedback-clear-filter"
                        onClick={() => setFeedbackRatingFilter('all')}
                    >
                        Clear filter
                    </button>
                )}
            </div>

            <div className="admin-feedback-rating-list">
                {feedbackSummary.ratings.map(({ rating, count }) => (
                    <button
                        type="button"
                        className={`admin-feedback-rating-row ${
                            String(rating) === feedbackRatingFilter
                                ? 'active'
                                : ''
                        }`}
                        key={rating}
                        onClick={() => setFeedbackRatingFilter(String(rating))}
                        aria-pressed={String(rating) === feedbackRatingFilter}
                        aria-label={`Filter ${rating} star feedback, ${count} responses`}
                    >
                        <span className="admin-feedback-rating-label">
                            {rating} <span aria-hidden="true">★</span>
                        </span>
                        <span className="admin-feedback-rating-track">
                            <span
                                style={{
                                    width: `${
                                        feedbackSummary.total
                                            ? (count / feedbackSummary.total) * 100
                                            : 0
                                    }%`,
                                }}
                            />
                        </span>
                        <span className="admin-feedback-rating-count">
                            {count}
                        </span>
                    </button>
                ))}
            </div>
        </div>

        <div className="admin-feedback-toolbar">
            <div>
                <h2>Recent responses</h2>
                <p>
                    Showing {filteredFeedback.length} of {feedback.length}{' '}
                    responses
                </p>
            </div>

            <label className="admin-feedback-filter">
                <span>Filter by rating</span>
                <select
                    value={feedbackRatingFilter}
                    onChange={(e) => setFeedbackRatingFilter(e.target.value)}
                >
                    <option value="all">All ratings</option>
                    {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                            {rating} stars
                        </option>
                    ))}
                </select>
            </label>
        </div>

        {loadingFeedback ? (
            <div className="admin-feedback-grid" aria-label="Loading feedback">
                {[1, 2, 3, 4].map((item) => (
                    <div className="admin-feedback-skeleton" key={item}>
                        <span />
                        <span />
                        <span />
                        <span />
                    </div>
                ))}
            </div>
        ) : feedbackError ? (
            <div className="admin-feedback-state is-error">
                <h2>Feedback could not be loaded</h2>
                <p>{feedbackError}</p>
                <button
                    type="button"
                    className="admin-refresh-btn"
                    onClick={fetchFeedback}
                >
                    Try again
                </button>
            </div>
        ) : filteredFeedback.length === 0 ? (
            <div className="admin-feedback-state">
                <div className="admin-feedback-state-icon">
                    <MessageCircle size={24} />
                </div>
                <h2>
                    {feedback.length
                        ? 'No responses for this rating'
                        : 'No feedback yet'}
                </h2>
                <p>
                    {feedback.length
                        ? 'Try another rating or clear the current filter.'
                        : 'Player reviews will appear here once they share their thoughts.'}
                </p>
                {feedback.length > 0 && (
                    <button
                        type="button"
                        className="admin-feedback-clear-filter"
                        onClick={() => setFeedbackRatingFilter('all')}
                    >
                        Show all feedback
                    </button>
                )}
            </div>
        ) : (
            <>
                <div className="admin-feedback-grid">
                    {paginatedFeedback.map((item) => {
                        const submittedAt = new Date(item.created_at)
                        const formattedDate = Number.isNaN(submittedAt.getTime())
                            ? 'Date unavailable'
                            : submittedAt.toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                              })
                        const rating = Number(item.rating) || 0

                        return (
                            <article
                                className="admin-feedback-card"
                                key={item.id}
                            >
                                <div className="admin-feedback-card-header">
                                    <div className="admin-feedback-user">
                                        <div
                                            className="admin-feedback-avatar"
                                            aria-hidden="true"
                                        >
                                            {(item.user?.name || 'U')
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="admin-feedback-user-info">
                                            <h3>
                                                {item.user?.name || 'Unknown User'}
                                            </h3>
                                            <p>
                                                {item.user?.email || 'No email provided'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="admin-feedback-delete"
                                        onClick={() =>
                                            handleDeleteFeedback(item.id)
                                        }
                                        disabled={deletingFeedbackId === item.id}
                                        aria-label={`Delete feedback from ${
                                            item.user?.name || 'Unknown User'
                                        }`}
                                    >
                                        {deletingFeedbackId === item.id
                                            ? 'Deleting...'
                                            : 'Delete'}
                                    </button>
                                </div>

                                <div className="admin-feedback-card-rating">
                                    <div
                                        className="admin-feedback-stars"
                                        role="img"
                                        aria-label={`${rating} out of 5 stars`}
                                    >
                                        {Array.from({ length: 5 }, (_, index) => (
                                            <Star
                                                key={index}
                                                size={16}
                                                fill={
                                                    index < rating
                                                        ? 'currentColor'
                                                        : 'none'
                                                }
                                            />
                                        ))}
                                    </div>
                                    <span>{rating}/5</span>
                                </div>

                                <p className="admin-feedback-message">
                                    {item.message || 'No written comment provided.'}
                                </p>

                                <footer className="admin-feedback-card-footer">
                                    <span>Submitted</span>
                                    <time dateTime={item.created_at}>
                                        {formattedDate}
                                    </time>
                                </footer>
                            </article>
                        )
                    })}
                </div>

                <div className="admin-pagination">
                    <div className="admin-pagination-info">
                        Showing {(feedbackCurrentPage - 1) * FEEDBACK_PER_PAGE + 1}
                        {' - '}
                        {Math.min(
                            feedbackCurrentPage * FEEDBACK_PER_PAGE,
                            filteredFeedback.length
                        )}
                        {' of '}
                        {filteredFeedback.length} feedback
                    </div>

                    <div className="admin-pagination-buttons">
                        <button
                            type="button"
                            disabled={feedbackCurrentPage === 1}
                            onClick={() =>
                                setFeedbackCurrentPage((page) => page - 1)
                            }
                        >
                            Previous
                        </button>

                        {feedbackPageNumbers.map((page, index) =>
                            page === '...' ? (
                                <span
                                    className="admin-pagination-ellipsis"
                                    key={`feedback-ellipsis-${index}`}
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    key={page}
                                    className={
                                        feedbackCurrentPage === page
                                            ? 'active'
                                            : ''
                                    }
                                    onClick={() => setFeedbackCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            )
                        )}

                        <button
                            type="button"
                            disabled={
                                feedbackCurrentPage >= totalFeedbackPages ||
                                totalFeedbackPages === 0
                            }
                            onClick={() =>
                                setFeedbackCurrentPage((page) =>
                                    Math.min(page + 1, totalFeedbackPages)
                                )
                            }
                        >
                            Next
                        </button>
                    </div>
                </div>
            </>
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
                                        Manage registered ClueShift players.
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
                                            {paginatedPlayers.map((player) => (
                                                <tr key={player.id}>

                                                    <td>
                                                        <div className="admin-player-info">

                                                            <div className="admin-player-avatar">
                                                                {player.profile_image ? (
                                                                    <img
                                                                        src={getStorageUrl(player.profile_image)}
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
                                      
<div className="admin-pagination">
    <div className="admin-pagination-info">
        Showing {(playerCurrentPage - 1) * PLAYERS_PER_PAGE + 1}
        {' - '}
        {Math.min(
            playerCurrentPage * PLAYERS_PER_PAGE,
            players.length
        )}
        {' of '}
        {players.length} players
    </div>

    <div className="admin-pagination-buttons">
        <button
            type="button"
            disabled={playerCurrentPage === 1}
            onClick={() =>
                setPlayerCurrentPage((page) => page - 1)
            }
        >
            Previous
        </button>

        {playerPageNumbers.map((page, index) =>
            page === '...' ? (
                <span
                    className="admin-pagination-ellipsis"
                    key={`player-ellipsis-${index}`}
                >
                    ...
                </span>
            ) : (
                <button
                    type="button"
                    key={page}
                    className={
                        playerCurrentPage === page ? 'active' : ''
                    }
                    onClick={() => setPlayerCurrentPage(page)}
                >
                    {page}
                </button>
            )
        )}

        <button
            type="button"
            disabled={playerCurrentPage >= totalPlayerPages}
            onClick={() =>
                setPlayerCurrentPage((page) =>
                    Math.min(page + 1, totalPlayerPages)
                )
            }
        >
            Next
        </button>
    </div>
</div>
                                    </div>
                                )}

                            </section>
                        )}

                    {/* ADMIN LEADERBOARD SECTION */}
    {activeTab === 'leaderboard' && (
        <section className="admin-section">

            <div className="admin-page-heading">
                <div>
                    <span className="admin-eyebrow">
                        PERFORMANCE ANALYTICS
                    </span>

                    <h1>Leaderboard Management</h1>

                    <p>
                        Track player rankings and game performance.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="admin-player-toolbar">
                <div className="admin-player-search">
                    <input
                        type="text"
                        placeholder="Search player by name or email..."
                        value={searchLeaderboard}
                        onChange={(e) =>
                            setSearchLeaderboard(e.target.value)
                        }
                    />
                </div>
            </div>

            {/* LEADERBOARD SUMMARY CARDS */}
    {!loadingLeaderboard && !leaderboardError && (
        <div className="leaderboard-summary-grid">

            <div className="leaderboard-summary-card">
                <span className="summary-icon"><Users size={22} /></span>
                <p>Total Ranked Players</p>
                <h2>{leaderboard.length}</h2>
            </div>

            <div className="leaderboard-summary-card">
                <span className="summary-icon"><Gamepad2 size={22} /></span>
                <p>Total Games Played</p>
                <h2>
                    {leaderboard.reduce(
                        (total, player) =>
                            total + Number(player.games_played || 0),
                        0
                    )}
                </h2>
            </div>

            <div className="leaderboard-summary-card">
                <span className="summary-icon"><Medal size={22} /></span>
                <p>Highest Player Score</p>
                <h2>
                    {leaderboard.length
                        ? Math.max(
                            ...leaderboard.map(
                                (player) => Number(player.total_score || 0)
                            )
                        )
                        : 0}
                </h2>
            </div>

            <div className="leaderboard-summary-card">
                <span className="summary-icon"><ChartNoAxesColumnIncreasing size={22} /></span>
                <p>Average Accuracy</p>
                <h2>
                    {leaderboard.length
                        ? (
                            leaderboard.reduce(
                                (total, player) =>
                                    total + Number(player.accuracy || 0),
                                0
                            ) / leaderboard.length
                        ).toFixed(2)
                        : '0.00'}%
                </h2>
            </div>

        </div>
        
    )}


            {/* Leaderboard Table */}
            {loadingLeaderboard ? (
                <div className="admin-empty-state">
                    Loading leaderboard...
                </div>
            ) : leaderboardError ? (
                <div className="admin-error-message">
                    {leaderboardError}
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="admin-empty-state">
                    <h3>No Leaderboard Data</h3>
                    <p>
                        Players' game results will appear here.
                    </p>
                </div>
            ) : (
                <div className="admin-players-table-wrapper">

                    <table className="admin-players-table">

                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Total Score</th>
                                <th>Games Played</th>
                                <th>Correct</th>
                                <th>Wrong</th>
                                <th>Accuracy</th>
                                <th>Highest Score</th>
                                <th>Levels Passed</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedLeaderboard.map((player) => (
                                <tr key={player.user_id}>

                                    <td>
                                        <strong>
                                            {player.rank <= 3
                                                ? <Medal size={20} />
                                                : `#${player.rank}`}
                                        </strong>
                                    </td>

                                    <td>
                                        <div className="admin-player-info">
                                            <div className="admin-player-avatar">
                                                {(player.name || 'U')
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div>
                                                <strong>{player.name}</strong>
                                                <div>
                                                    <small>{player.email}</small>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        <strong>{player.total_score}</strong>
                                    </td>

                                    <td>{player.games_played}</td>

                                    <td>{player.correct_answers}</td>

                                    <td>{player.wrong_answers}</td>

                                    <td>
                                        <strong>
                                            {player.accuracy}%
                                        </strong>
                                    </td>

                                    <td>{player.highest_score}</td>

                                    <td>{player.levels_passed}</td>

                                </tr>
                            ))}
                        </tbody>

                    </table>

                    {/* LEADERBOARD PAGINATION */}
                    <div className="admin-pagination">

                        <div className="admin-pagination-info">
                            Showing {(leaderboardCurrentPage - 1) * LEADERBOARD_PER_PAGE + 1}
                            {' - '}
                            {Math.min(
                                leaderboardCurrentPage * LEADERBOARD_PER_PAGE,
                                leaderboard.length
                            )}
                            {' of '}
                            {leaderboard.length} players
                        </div>

                        <div className="admin-pagination-buttons">

                            <button
                                type="button"
                                disabled={leaderboardCurrentPage === 1}
                                onClick={() =>
                                    setLeaderboardCurrentPage((page) => page - 1)
                                }
                            >
                                Previous
                            </button>

                            {leaderboardPageNumbers.map((page, index) =>
                                page === '...' ? (
                                    <span
                                        className="admin-pagination-ellipsis"
                                        key={`leaderboard-ellipsis-${index}`}
                                    >
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        key={page}
                                        className={
                                            leaderboardCurrentPage === page
                                                ? 'active'
                                                : ''
                                        }
                                        onClick={() =>
                                            setLeaderboardCurrentPage(page)
                                        }
                                    >
                                        {page}
                                    </button>
                                )
                            )}

                            <button
                                type="button"
                                disabled={
                                    leaderboardCurrentPage >= totalLeaderboardPages
                                }
                                onClick={() =>
                                    setLeaderboardCurrentPage((page) =>
                                        Math.min(page + 1, totalLeaderboardPages)
                                    )
                                }
                            >
                                Next
                            </button>

                        </div>
                    </div>

                </div>
            )}

        </section>
    )}

    {/* DAILY CHALLENGE MANAGEMENT */}
    {DAILY_CHALLENGE_UI_ENABLED && activeTab === 'daily-challenges' && (
        <section className="admin-section">

            <div className="admin-page-heading">
                <div>
                    <span className="admin-eyebrow">GAME MANAGEMENT</span>
                    <h1>Daily Challenges</h1>
                    <p>Create and manage daily challenges for players.</p>
                </div>

                <button
                    className="admin-primary-btn"
                    onClick={resetDailyChallengeForm}
                >
                    + New Challenge
                </button>
            </div>

            {dailyChallengeError && (
                <div className="admin-error-message">
                    {dailyChallengeError}
                </div>
            )}

            {dailyChallengeSuccess && (
                <div className="admin-success-message">
                    {dailyChallengeSuccess}
                </div>
            )}

            {/* CREATE / EDIT FORM */}
            <div className="admin-content-card admin-daily-form">

                <h2>
                    {editingDailyChallenge
                        ? 'Edit Daily Challenge'
                        : 'Create Daily Challenge'}
                </h2>

                <form onSubmit={handleDailyChallengeSubmit}>

                    <div className="admin-daily-form-grid">

                        <div>
                            <label>Challenge Date</label>
                            <input
                                type="date"
                                name="challenge_date"
                                value={dailyChallengeForm.challenge_date}
                                onChange={handleDailyChallengeInput}
                                required
                            />
                        </div>

                        <div>
                            <label>Bonus Points</label>
                            <input
                                type="number"
                                name="bonus_points"
                                min="0"
                                max="10000"
                                value={dailyChallengeForm.bonus_points}
                                onChange={handleDailyChallengeInput}
                                required
                            />
                        </div>

                    </div>

                    <label className="admin-checkbox-label">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={dailyChallengeForm.is_active}
                            onChange={handleDailyChallengeInput}
                        />
                        <span>Challenge is active</span>
                    </label>

                    <div className="admin-daily-question-heading">
                        <h3>Select 5 Questions</h3>
                        <strong>
                            {dailyChallengeForm.question_ids.length}/5 Selected
                        </strong>
                    </div>

                    {loadingQuestions ? (
                        <p>Loading questions...</p>
                    ) : (
                        <div className="admin-daily-question-list">

                            {questions
                                .filter((question) => Boolean(question.is_active))
                                .map((question) => {
                                    const selected =
                                        dailyChallengeForm.question_ids.includes(
                                            Number(question.id)
                                        )

                                    return (
                                        <label
                                            key={question.id}
                                            className={`admin-daily-question-option ${
                                                selected ? 'selected' : ''
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={() =>
                                                    toggleDailyChallengeQuestion(
                                                        Number(question.id)
                                                    )
                                                }
                                            />

                                            <span>
                                                <strong>{question.title}</strong>
                                                <small>
                                                    Level {question.level} | {question.points} points
                                                </small>
                                            </span>
                                        </label>
                                    )
                                })}

                        </div>
                    )}

                    <div className="admin-modal-actions">

                        {editingDailyChallenge && (
                            <button
                                type="button"
                                className="admin-cancel-btn"
                                onClick={resetDailyChallengeForm}
                            >
                                Cancel Edit
                            </button>
                        )}

                        <button
                            type="submit"
                            className="admin-primary-btn"
                            disabled={
                                savingDailyChallenge ||
                                dailyChallengeForm.question_ids.length !== 5
                            }
                        >
                            {savingDailyChallenge
                                ? 'Saving...'
                                : editingDailyChallenge
                                    ? 'Update Challenge'
                                    : 'Create Challenge'}
                        </button>

                    </div>

                </form>
            </div>

            {/* CHALLENGE LIST */}
            <div className="admin-content-card">

                <div className="admin-daily-list-heading">
                    <h2>All Daily Challenges</h2>

                    <button
                        className="admin-refresh-btn"
                        onClick={fetchDailyChallenges}
                        disabled={loadingDailyChallenges}
                    >
                        {loadingDailyChallenges ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {loadingDailyChallenges ? (
                    <div className="admin-empty-state">
                        Loading daily challenges...
                    </div>
                ) : dailyChallenges.length === 0 ? (
                    <div className="admin-empty-state">
                        No daily challenges created yet.
                    </div>
                ) : (
                        <>
                    <div className="admin-table-wrapper">
                        <table className="admin-table">

                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Questions</th>
                                    <th>Bonus</th>
                                    <th>Attempts</th>
                                    <th>Status</th>
                                    <th>Admin Comment</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedDailyChallenges.map((challenge) => (
                                    <tr key={challenge.id}>

                                        <td>
                                            <strong>
                                                {String(challenge.challenge_date).slice(0, 10)}
                                            </strong>
                                        </td>

                                        <td>
                                            {(challenge.question_ids || []).length} Questions
                                        </td>

                                        <td>
                                            +{challenge.bonus_points}
                                        </td>

                                        <td>
                                            {challenge.attempts_count || 0}
                                        </td>

                                        <td>
                                            <span className={`admin-daily-status ${
                                                challenge.is_active ? 'active' : 'inactive'
                                            }`}>
                                                {challenge.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="admin-daily-comment-preview">
                                                {challenge.admin_comment || 'No comment added'}
                                            </div>
                                        </td>

                                        <td>
                                            <div className="admin-daily-actions">

                                                <button
                                                    type="button"
                                                    className="comment"
                                                    onClick={() =>
                                                        openDailyChallengeComment(challenge)
                                                    }
                                                >
                                                    {challenge.admin_comment
                                                        ? 'Edit Comment'
                                                        : 'Add Comment'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEditDailyChallenge(challenge)
                                                    }
                                                    disabled={
                                                        Number(challenge.attempts_count || 0) > 0
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="delete"
                                                    onClick={() =>
                                                        handleDeleteDailyChallenge(challenge)
                                                    }
                                                    disabled={
                                                        Number(challenge.attempts_count || 0) > 0
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

                    {/* DAILY CHALLENGES PAGINATION */}
                    <div className="admin-pagination">

                        <div className="admin-pagination-info">
                            Showing {(dailyChallengeCurrentPage - 1) * DAILY_CHALLENGES_PER_PAGE + 1}
                            {' - '}
                            {Math.min(
                                dailyChallengeCurrentPage * DAILY_CHALLENGES_PER_PAGE,
                                dailyChallenges.length
                            )}
                            {' of '}
                            {dailyChallenges.length} challenges
                        </div>

                        <div className="admin-pagination-buttons">

                            <button
                                type="button"
                                disabled={dailyChallengeCurrentPage === 1}
                                onClick={() =>
                                    setDailyChallengeCurrentPage((page) => page - 1)
                                }
                            >
                                Previous
                            </button>

                            {dailyChallengePageNumbers.map((page, index) =>
                                page === '...' ? (
                                    <span
                                        className="admin-pagination-ellipsis"
                                        key={`daily-challenge-ellipsis-${index}`}
                                    >
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        key={page}
                                        className={
                                            dailyChallengeCurrentPage === page
                                                ? 'active'
                                                : ''
                                        }
                                        onClick={() =>
                                            setDailyChallengeCurrentPage(page)
                                        }
                                    >
                                        {page}
                                    </button>
                                )
                            )}

                            <button
                                type="button"
                                disabled={
                                    dailyChallengeCurrentPage >= totalDailyChallengePages
                                }
                                onClick={() =>
                                    setDailyChallengeCurrentPage((page) =>
                                        Math.min(page + 1, totalDailyChallengePages)
                                    )
                                }
                            >
                                Next
                            </button>

                        </div>
                    </div>

                   </>
                )}
           
            </div>

            {commentingDailyChallenge && (
                <div
                    className="admin-modal-overlay"
                    onClick={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !savingDailyChallengeComment
                        ) {
                            closeDailyChallengeComment()
                        }
                    }}
                >
                    <div
                        className="admin-question-modal admin-daily-comment-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="daily-challenge-comment-title"
                    >
                        <div className="admin-modal-header">
                            <div>
                                <span className="admin-eyebrow">
                                    ADMIN ONLY
                                </span>
                                <h2 id="daily-challenge-comment-title">
                                    {commentingDailyChallenge.admin_comment
                                        ? 'Edit Challenge Comment'
                                        : 'Add Challenge Comment'}
                                </h2>
                                <p>
                                    {String(
                                        commentingDailyChallenge.challenge_date
                                    ).slice(0, 10)}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={closeDailyChallengeComment}
                                disabled={savingDailyChallengeComment}
                                aria-label="Close comment editor"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleDailyChallengeCommentSubmit}>
                            <label htmlFor="daily-challenge-admin-comment">
                                Internal comment
                            </label>
                            <textarea
                                id="daily-challenge-admin-comment"
                                value={dailyChallengeComment}
                                onChange={(event) =>
                                    setDailyChallengeComment(event.target.value)
                                }
                                placeholder="Write an internal note about this challenge..."
                                rows={5}
                                maxLength={5000}
                                autoFocus
                            />
                            <p className="admin-daily-comment-help">
                                This note is visible only in the admin panel.
                                Leave it blank to clear the comment.
                            </p>

                            {dailyChallengeCommentError && (
                                <div className="admin-error-box">
                                    {dailyChallengeCommentError}
                                </div>
                            )}

                            <div className="admin-modal-actions">
                                <button
                                    type="button"
                                    className="admin-cancel-btn"
                                    onClick={closeDailyChallengeComment}
                                    disabled={savingDailyChallengeComment}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="admin-primary-btn"
                                    disabled={savingDailyChallengeComment}
                                >
                                    {savingDailyChallengeComment
                                        ? 'Saving...'
                                        : 'Save Comment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </section>
    )}
    {activeTab === 'daily-mini-games' && (
    <section className="admin-section">
        <AdminDailyMiniGames />
    </section>
)}
    {activeTab === 'settings' && (
    <section className="admin-section">
        <AdminSettingsTab />
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
                                <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleQuestionSubmit}>

                                                        <label>Category</label>

                                <select
                                    name="category_id"
                                    value={questionForm.category_id}
                                    onChange={handleQuestionInput}
                                >
                                    <option value="">Uncategorized</option>

                                    {categories
                                        .filter((category) =>
                                            Boolean(category.is_active)
                                        )
                                        .map((category) => (
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
                                                        <X size={18} />
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
                                    <Plus size={16} />
                                    <span>Add Clue</span>
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

                {showCategoryForm && (
                    <div
                        className="admin-modal-overlay"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                resetCategoryForm()
                            }
                        }}
                    >
                        <div className="admin-question-modal">
                            <div className="admin-modal-header">
                                <div>
                                    <span className="admin-eyebrow">
                                        {editingCategory
                                            ? 'EDIT CATEGORY'
                                            : 'NEW CATEGORY'}
                                    </span>

                                    <h2>
                                        {editingCategory
                                            ? 'Edit Category'
                                            : 'Add Category'}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="admin-modal-close"
                                    onClick={resetCategoryForm}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCategorySubmit}>
                                <label>Category Name</label>

                                <input
                                    type="text"
                                    name="name"
                                    value={categoryForm.name}
                                    onChange={handleCategoryInput}
                                    placeholder="Example: General Knowledge"
                                    maxLength={255}
                                    required
                                />

                                <label>Description</label>

                                <textarea
                                    name="description"
                                    value={categoryForm.description}
                                    onChange={handleCategoryInput}
                                    placeholder="Enter category description"
                                    rows="3"
                                />

                                <label>Category Icon (Emoji)</label>

                                <input
                                    type="text"
                                    name="icon"
                                    value={categoryForm.icon}
                                    onChange={handleCategoryInput}
                                    placeholder="Example: 📚"
                                    maxLength={50}
                                />

                                <label className="admin-checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={categoryForm.is_active}
                                        onChange={handleCategoryInput}
                                    />

                                    <span>Category is active</span>
                                </label>

                                <div className="admin-modal-actions">
                                    <button
                                        type="button"
                                        className="admin-cancel-btn"
                                        onClick={resetCategoryForm}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="admin-primary-btn"
                                        disabled={savingCategory}
                                    >
                                        {savingCategory
                                            ? 'Saving...'
                                            : editingCategory
                                                ? 'Update Category'
                                                : 'Create Category'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <AdminCsvImportModal
                    isOpen={isCsvModalOpen}
                    onClose={() => setIsCsvModalOpen(false)}
                    onImportSuccess={() => fetchQuestions()}
                />

                <AdminAiQuestionModal
                    isOpen={isAiModalOpen}
                    onClose={() => setIsAiModalOpen(false)}
                    categories={categories}
                    onGenerateSuccess={() => fetchQuestions()}
                />

            </div>
        )
    }

    export default AdminDashboard
