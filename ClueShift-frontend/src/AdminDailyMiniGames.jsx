import React, { useEffect, useState } from 'react'
import api from './services/api'
import './AdminDailyMiniGames.css'

const gameTypes = [
    ['word_shuffle', 'Word Shuffle'],
    ['logic_detective', 'Logic Detective'],
    ['pattern_master', 'Pattern Master'],
    ['visual_detective', 'Visual Detective'],
    ['number_ninja', 'Number Ninja'],
    ['weekend_surprise', 'Weekend Surprise'],
]

const newItem = () => ({
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prompt: '',
    scrambled_word: '',
    sequence: '',
    math_puzzle: '',
    clues: '',
    answer: '',
    points: 20,
    optionsText: '',
    image_url: '',
    explanation: '',
    item_type: 'word_shuffle',
})

const today = () => {
    const date = new Date()
    const offset = date.getTimezoneOffset()
    return new Date(date.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 10)
}

const emptyForm = () => ({
    challenge_date: today(),
    game_type: 'word_shuffle',
    title: '',
    instructions: '',
    difficulty: 'medium',
    duration_seconds: 300,
    total_points: 100,
    bonus_points: 10,
    items: [newItem()],
})

function AdminDailyMiniGames() {
    const [games, setGames] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const loadGames = async () => {
        setLoading(true)
        setError('')

        try {
            const response = await api.get('/admin/daily-mini-games')
            setGames(response.data.challenges || response.data.games || [])
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load games.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadGames()
    }, [])

    const resetForm = () => {
        setForm(emptyForm())
        setEditingId(null)
        setError('')
        setMessage('')
    }

    const updateField = (name, value) => {
        setForm(previous => ({ ...previous, [name]: value }))
    }

    const updateItem = (index, name, value) => {
        setForm(previous => ({
            ...previous,
            items: previous.items.map((item, i) =>
                i === index ? { ...item, [name]: value } : item
            ),
        }))
    }

    const addItem = () => {
        setForm(previous => ({
            ...previous,
            items: [...previous.items, newItem()],
        }))
    }

    const removeItem = (index) => {
        setForm(previous => ({
            ...previous,
            items: previous.items.filter((_, i) => i !== index),
        }))
    }

    const editGame = (game) => {
        const items = (game.content?.items || []).map(item => ({
            ...item,
            optionsText: Array.isArray(item.options)
                ? item.options.join(', ')
                : '',
        }))

        setForm({
            challenge_date: game.challenge_date?.slice(0, 10) || today(),
            game_type: game.game_type,
            title: game.title || '',
            instructions: game.instructions || '',
            difficulty: game.difficulty || 'medium',
            duration_seconds: game.duration_seconds || 300,
            total_points: game.total_points || 100,
            bonus_points: game.bonus_points || 0,
            items: items.length ? items : [newItem()],
        })

        setEditingId(game.id)
        setError('')
        setMessage('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const generateWithAi = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
        const response = await api.post('/admin/daily-mini-games/generate-ai', {
            challenge_date: form.challenge_date,
            game_type: form.game_type,
        })

        setMessage(response.data.message || 'AI game generated successfully.')
        await loadGames()
    } catch (err) {
        setError(
            err.response?.data?.message ||
            (err.request
                ? 'Could not reach the backend. Make sure the Laravel API is running and try again.'
                : err.message) ||
            'AI generation failed.'
        )
    } finally {
        setSaving(false)
    }
}

    const saveGame = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        setMessage('')

        try {
            if (!form.items.length) {
                throw new Error('At least one question is required.')
            }

       const items = form.items.map(item => ({
    id: item.id,
    item_type: item.item_type || 'word_shuffle',
    prompt: item.prompt,
    scrambled_word: item.scrambled_word || null,
    sequence: item.sequence || null,
    math_puzzle: item.math_puzzle || null,
    clues: item.clues || null,
    answer: item.answer,
    points: Number(item.points),
    options: item.optionsText.trim()
        ? item.optionsText.split(',').map(option => option.trim()).filter(Boolean)
        : null,
    image_url: item.image_url || null,
    explanation: item.explanation || null,
}))

            if (items.some(item => !item.prompt.trim() || !item.answer.trim())) {
                throw new Error('Every question must have a question and correct answer.')
            }

            const payload = {
                challenge_date: form.challenge_date,
                game_type: form.game_type,
                title: form.title,
                instructions: form.instructions,
                difficulty: form.difficulty,
                duration_seconds: Number(form.duration_seconds),
                total_points: Number(form.total_points),
                bonus_points: Number(form.bonus_points),
                content: { items },
            }

            if (editingId) {
                await api.put(`/admin/daily-mini-games/${editingId}`, payload)
                setMessage('Game updated successfully.')
            } else {
                await api.post('/admin/daily-mini-games', payload)
                setMessage('Game created successfully.')
            }

            resetForm()
            await loadGames()
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to save game.'
            )
        } finally {
            setSaving(false)
        }
    }

    const performAction = async (id, action) => {
        const labels = {
            'submit-for-approval': 'submit for approval',
            approve: 'approve',
            reject: 'reject',
            publish: 'publish',
            unpublish: 'unpublish',
        }

        if (!window.confirm(`Are you sure you want to ${labels[action]} this game?`)) {
            return
        }

        setError('')
        setMessage('')

        try {
            await api.post(`/admin/daily-mini-games/${id}/${action}`)
            setMessage(`Game ${labels[action]} successful.`)
            await loadGames()
        } catch (err) {
            setError(err.response?.data?.message || 'Action failed.')
        }
    }

    const deleteGame = async (id) => {
        if (!window.confirm('Delete this game permanently?')) return

        try {
            await api.delete(`/admin/daily-mini-games/${id}`)
            setMessage('Game deleted.')
            await loadGames()
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to delete game.')
        }
    }

    const statusColor = {
        published: '#16a34a',
        approved: '#2563eb',
        pending_approval: '#d97706',
        rejected: '#dc2626',
        draft: '#64748b',
    }

    return (
        <div className="admin-mini-games">
            <h1>Daily Mini Games</h1>
            <p>Create and manage daily brain games for players.</p>

            {message && <p className="mini-success">{message}</p>}
            {error && <p className="mini-error">{error}</p>}

            <form onSubmit={saveGame} className="mini-game-form">
                <h2>{editingId ? 'Edit Game' : 'Create New Game'}</h2>

                <label>
                    Challenge Date
                    <input
                        type="date"
                        value={form.challenge_date}
                        onChange={e => updateField('challenge_date', e.target.value)}
                        required
                    />
                </label>

                <label>
                    Game Type
                    <select
                        value={form.game_type}
                        onChange={e => updateField('game_type', e.target.value)}
                    >
                        {gameTypes.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </label>

                <label>
                    Game Title
                    <input
                        value={form.title}
                        onChange={e => updateField('title', e.target.value)}
                        placeholder="Enter game title"
                        required
                    />
                </label>

                <label>
                    Instructions
                    <textarea
                        value={form.instructions}
                        onChange={e => updateField('instructions', e.target.value)}
                        placeholder="Explain how to play"
                        required
                    />
                </label>

                <label>
                    Difficulty
                    <select
                        value={form.difficulty}
                        onChange={e => updateField('difficulty', e.target.value)}
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </label>

                <label>
                    Duration (seconds)
                    <input
                        type="number"
                        min="1"
                        value={form.duration_seconds}
                        onChange={e => updateField('duration_seconds', e.target.value)}
                        required
                    />
                </label>

                <label>
                    Total Points
                    <input
                        type="number"
                        min="1"
                        value={form.total_points}
                        onChange={e => updateField('total_points', e.target.value)}
                        required
                    />
                </label>

                <label>
                    Bonus Points
                    <input
                        type="number"
                        min="0"
                        value={form.bonus_points}
                        onChange={e => updateField('bonus_points', e.target.value)}
                    />
                </label>

                <hr />
                <h2>Game Questions / Puzzles</h2>

                {form.items.map((item, index) => (
                    <div key={item.id} className="mini-question-card">
                        <h3>Question {index + 1}</h3>

                        {form.game_type === 'weekend_surprise' && (
    <label>
        Puzzle Type
        <select
            value={item.item_type || 'word_shuffle'}
            onChange={e => updateItem(index, 'item_type', e.target.value)}
        >
            <option value="word_shuffle">Word Shuffle</option>
            <option value="logic_detective">Logic Detective</option>
            <option value="pattern_master">Pattern Master</option>
            <option value="visual_detective">Visual Detective</option>
            <option value="number_ninja">Number Ninja</option>
        </select>
    </label>
)}

                        <label>
                            Question / Puzzle
                            <textarea
                                value={item.prompt}
                                onChange={e => updateItem(index, 'prompt', e.target.value)}
                                placeholder="Enter question or puzzle"
                                required
                            />
                        </label>
               {(form.game_type === 'word_shuffle' || (form.game_type === 'weekend_surprise' && item.item_type === 'word_shuffle')) && (
    <label>
        Scrambled Word
        <input
            value={item.scrambled_word || ''}
            onChange={e => updateItem(index, 'scrambled_word', e.target.value)}
            placeholder="Example: ELAP"
        />
    </label>
)}

{(form.game_type === 'logic_detective' || (form.game_type === 'weekend_surprise' && item.item_type === 'logic_detective')) && (
    <label>
        Detective Clues
        <textarea
            value={item.clues || ''}
            onChange={e => updateItem(index, 'clues', e.target.value)}
            placeholder="Enter clues, one by one"
        />
    </label>
)}

{(form.game_type === 'pattern_master' || (form.game_type === 'weekend_surprise' && item.item_type === 'pattern_master')) && (
    <label>
        Pattern / Sequence
        <input
            value={item.sequence || ''}
            onChange={e => updateItem(index, 'sequence', e.target.value)}
            placeholder="Example: 2, 4, 8, 16, ?"
        />
    </label>
)}

{(form.game_type === 'number_ninja' || (form.game_type === 'weekend_surprise' && item.item_type === 'number_ninja')) && (
        <label>
        Math Puzzle
        <textarea
            value={item.math_puzzle || ''}
            onChange={e => updateItem(index, 'math_puzzle', e.target.value)}
            placeholder="Example: (12 × 5) + 10 = ?"
        />
    </label>
)}

{(form.game_type === 'visual_detective' || (form.game_type === 'weekend_surprise' && item.item_type === 'visual_detective')) && (
        <label>
        Image URL
        <input
            type="url"
            value={item.image_url || ''}
            onChange={e => updateItem(index, 'image_url', e.target.value)}
            placeholder="https://example.com/image.jpg"
        />
    </label>
)}
                   <label>
    Accepted Answers (optional, comma separated)
    <input
        value={item.acceptedAnswersText || ''}
        onChange={e => updateItem(index, 'acceptedAnswersText', e.target.value)}
        placeholder="LEAP, PALE, PEAL, PLEA"
    />
</label>
                        <label>
                            Image URL (optional, Visual Detective)
                            <input
                                type="url"
                                value={item.image_url || ''}
                                onChange={e => updateItem(index, 'image_url', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                        </label>

                        <label>
                            Points
                            <input
                                type="number"
                                min="0"
                                value={item.points}
                                onChange={e => updateItem(index, 'points', e.target.value)}
                                required
                            />
                        </label>

                        <label>
                            Explanation (optional)
                            <textarea
                                value={item.explanation || ''}
                                onChange={e => updateItem(index, 'explanation', e.target.value)}
                                placeholder="Explain the correct answer"
                            />
                        </label>

                        {form.items.length > 1 && (
                            <button type="button" onClick={() => removeItem(index)}>
                                Remove Question
                            </button>
                        )}
                    </div>
                ))}

                <button type="button" onClick={addItem}>
                    + Add Another Question
                </button>

                
                    <div className="mini-form-actions">

    <button
        type="button"
        onClick={generateWithAi}
        disabled={saving || !!editingId}
    >
        {saving ? 'Generating...' : '✨ Generate with AI'}
    </button>

                    <button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : editingId ? 'Update Game' : 'Create Game'}
                    </button>

                    {editingId && (
                        <button type="button" onClick={resetForm}>
                            Cancel Edit
                        </button>
                    )}
                </div>
            </form>

            <hr />

            <h2>All Mini Games</h2>
            <button type="button" onClick={loadGames} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
            </button>

            {loading ? (
                <p>Loading games...</p>
            ) : games.length === 0 ? (
                <p>No mini games created yet.</p>
            ) : (
                <div className="mini-games-list">
                    {games.map(game => (
                        <div key={game.id} className="mini-game-card">
                            <h3>{game.title}</h3>
                            <p>{game.game_type} · {game.challenge_date}</p>
                            <p>
                                Status:{' '}
                               <strong className={`mini-status mini-status-${game.status}`}>
                                    {game.status?.replaceAll('_', ' ').toUpperCase()}
                                </strong>
                            </p>
                            <p>{game.difficulty} · {game.total_points} points</p>

                            <div className="mini-game-actions">
                                {['draft', 'rejected'].includes(game.status) && (
                                    <>
                                        <button onClick={() => editGame(game)}>Edit</button>
                                        <button onClick={() => performAction(game.id, 'submit-for-approval')}>
                                            Submit for Approval
                                        </button>
                                        <button onClick={() => deleteGame(game.id)}>Delete</button>
                                    </>
                                )}

                                {game.status === 'pending_approval' && (
                                    <>
                                        <button onClick={() => performAction(game.id, 'approve')}>Approve</button>
                                        <button onClick={() => performAction(game.id, 'reject')}>Reject</button>
                                    </>
                                )}

                                {game.status === 'approved' && (
                                    <button onClick={() => performAction(game.id, 'publish')}>Publish</button>
                                )}

                                {game.status === 'published' && (
                                    <button onClick={() => performAction(game.id, 'unpublish')}>Unpublish</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AdminDailyMiniGames
