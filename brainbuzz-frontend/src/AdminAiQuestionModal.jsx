import React, { useState } from 'react'
import './AdminAiQuestionModal.css'
import api from './services/api'

export default function AdminAiQuestionModal({ isOpen, onClose, categories = [], onGenerateSuccess }) {
    const [topic, setTopic] = useState('Space Exploration')
    const [level, setLevel] = useState(1)
    const [count, setCount] = useState(1) // Default to 1
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([])
    const [generating, setGenerating] = useState(false)
    const [hasGenerated, setHasGenerated] = useState(false)
    const [generatedQuestions, setGeneratedQuestions] = useState([])
    const [errorMsg, setErrorMsg] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [categoryWarning, setCategoryWarning] = useState('')

    if (!isOpen) return null

    // Handle Count change and enforce rule: categories count cannot exceed questions count
    const handleCountChange = (e) => {
        const val = parseInt(e.target.value, 10)
        const nextCount = isNaN(val) ? 1 : Math.max(1, Math.min(10, val))
        setCount(nextCount)
        setCategoryWarning('')
        setHasGenerated(false)
        setSuccessMsg('')

        // If currently selected categories exceed the new count, trim them
        if (selectedCategoryIds.length > nextCount) {
            setSelectedCategoryIds(selectedCategoryIds.slice(0, nextCount))
            setCategoryWarning(`Adjusted to ${nextCount} selected categor${nextCount === 1 ? 'y' : 'ies'} to match Question Count.`)
        }
    }

    // Toggle category selection
    const handleToggleCategory = (catId) => {
        setCategoryWarning('')
        setErrorMsg('')
        setHasGenerated(false)
        setSuccessMsg('')

        const isSelected = selectedCategoryIds.includes(catId)

        if (isSelected) {
            // Deselect
            setSelectedCategoryIds((prev) => prev.filter((id) => id !== catId))
        } else {
            // Select new category
            if (count === 1) {
                // If Count is 1, only 1 category allowed: directly switch selection
                setSelectedCategoryIds([catId])
            } else if (selectedCategoryIds.length < count) {
                // Under max limit: allow adding
                setSelectedCategoryIds((prev) => [...prev, catId])
            } else {
                // Reached max limit: block and guide the user
                setCategoryWarning(
                    `⚠️ You can select at most ${count} categories for ${count} questions. Increase "Count" to select more categories!`
                )
            }
        }
    }

    // Clear all categories (Auto / General)
    const handleClearCategories = () => {
        setSelectedCategoryIds([])
        setCategoryWarning('')
        setHasGenerated(false)
        setSuccessMsg('')
    }

    const handleGenerate = async (e) => {
        e.preventDefault()
        if (!topic.trim()) {
            setErrorMsg('Please specify a topic for the AI to generate questions.')
            return
        }

        setErrorMsg('')
        setSuccessMsg('')
        setCategoryWarning('')
        setGeneratedQuestions([])

        try {
            setGenerating(true)
            const token = localStorage.getItem('brainbuzz_token')

            const response = await api.post(
                '/admin/questions/generate-ai',
                {
                    topic: topic.trim(),
                    level: Number(level),
                    count: Number(count),
                    category_ids: selectedCategoryIds,
                    category_id: selectedCategoryIds[0] || null,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )

            if (response.data.success) {
                const qList = response.data.questions || []
                setGeneratedQuestions(qList)
                setHasGenerated(true)
                const catCount = selectedCategoryIds.length
                setSuccessMsg(
                    catCount > 1
                        ? `⚡ Successfully generated and saved all ${qList.length} questions distributed across ${catCount} categories!`
                        : `⚡ Successfully generated and saved all ${qList.length} questions!`
                )
                if (onGenerateSuccess) onGenerateSuccess()
            }
        } catch (err) {
            console.error('AI Generation Error:', err)
            setErrorMsg(err.response?.data?.message || 'Failed to generate questions. Please try again.')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal-card ai-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <div>
                        <h2>AI Question Generator</h2>
                        <p>Generate 5-clue ClueShift questions automatically.</p>
                    </div>
                    <button className="admin-modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleGenerate} className="ai-form">
                    <div className="ai-input-group">
                        <label>ClueShift Topic / Theme:</label>
                        <input
                            type="text"
                            placeholder="e.g. Space, World History, Cyber Security, Marvel..."
                            value={topic}
                            onChange={(e) => {
                                setTopic(e.target.value)
                                setHasGenerated(false)
                                setSuccessMsg('')
                            }}
                            required
                        />
                    </div>

                    <div className="ai-grid-row-two">
                        <div className="ai-input-group">
                            <label>Difficulty Level (1-50):</label>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={level}
                                onChange={(e) => {
                                    setLevel(e.target.value)
                                    setHasGenerated(false)
                                    setSuccessMsg('')
                                }}
                            />
                        </div>

                        <div className="ai-input-group">
                            <label>Question Count (1-10):</label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={count}
                                onChange={handleCountChange}
                            />
                        </div>
                    </div>

                    {/* DYNAMIC CATEGORY MULTI-SELECTION SECTION */}
                    <div className="ai-categories-section">
                        <div className="categories-header-row">
                            <label className="section-label">
                                Categories Selection:
                            </label>
                            <span className={`category-count-badge ${selectedCategoryIds.length === count ? 'maxed' : ''}`}>
                                Selected: <strong>{selectedCategoryIds.length}</strong> / {count} max
                            </span>
                        </div>

                        <p className="category-mode-hint">
                            {selectedCategoryIds.length === 0
                                ? `Select up to ${count} categories (or leave Auto for General Knowledge):`
                                : `All ${count} questions will be generated & distributed across the ${selectedCategoryIds.length} selected categor${selectedCategoryIds.length === 1 ? 'y' : 'ies'}:`}
                        </p>

                        <div className="category-chips-grid">
                            <button
                                type="button"
                                className={`cat-chip-btn ${selectedCategoryIds.length === 0 ? 'selected auto-chip' : ''}`}
                                onClick={handleClearCategories}
                            >
                                🌐 Auto / General
                            </button>

                            {categories.map((cat) => {
                                const isSelected = selectedCategoryIds.includes(cat.id)
                                const isMaxReached = selectedCategoryIds.length >= count && !isSelected

                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`cat-chip-btn ${isSelected ? 'selected' : ''} ${isMaxReached && count > 1 ? 'disabled-chip' : ''}`}
                                        onClick={() => handleToggleCategory(cat.id)}
                                        title={
                                            isSelected
                                                ? 'Click to remove category'
                                                : isMaxReached && count > 1
                                                    ? `Maximum ${count} categories selected. Increase Question Count to pick more.`
                                                    : 'Click to select category'
                                        }
                                    >
                                        <span className="cat-chip-icon">{cat.icon || '📂'}</span>
                                        <span className="cat-chip-name">{cat.name}</span>
                                        {isSelected && <span className="cat-chip-check">✓</span>}
                                    </button>
                                )
                            })}
                        </div>

                        {categoryWarning && (
                            <div className="category-warning-banner">
                                {categoryWarning}
                            </div>
                        )}
                    </div>

                    {errorMsg && <div className="admin-error-box">❌ {errorMsg}</div>}
                    {successMsg && <div className="admin-success-box">{successMsg}</div>}

                    {generatedQuestions.length > 0 && (
                        <div className="ai-preview-list">
                            <h4>Generated Questions Preview ({generatedQuestions.length} Questions):</h4>
                            {generatedQuestions.map((q, idx) => (
                                <div key={idx} className="ai-preview-item">
                                    <div className="ai-preview-top">
                                        <strong>#{idx + 1}. {q.title}</strong>
                                        {q.category && (
                                            <span className="ai-cat-pill">
                                                {q.category.icon ? `${q.category.icon} ` : ''}{q.category.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="ai-preview-clues">
                                        {(Array.isArray(q.clues) ? q.clues : []).map((c, i) => (
                                            <span key={i} className="clue-tag">{c}</span>
                                        ))}
                                    </div>
                                    <span className="ai-preview-ans">Answer: <strong>{q.answer}</strong></span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="admin-modal-actions">
                        {hasGenerated && (
                            <button
                                type="button"
                                className="admin-secondary-btn new-topic-btn"
                                onClick={() => {
                                    setTopic('')
                                    setGeneratedQuestions([])
                                    setHasGenerated(false)
                                    setSuccessMsg('')
                                    setCategoryWarning('')
                                }}
                            >
                                ✨ Generate Another Topic
                            </button>
                        )}

                        <button
                            type="button"
                            className="admin-cancel-btn"
                            onClick={onClose}
                            disabled={generating}
                        >
                            {hasGenerated ? 'Done & Close' : 'Close'}
                        </button>

                        <button
                            type="submit"
                            className={`admin-confirm-btn ai-btn ${hasGenerated ? 'completed-btn' : ''}`}
                            disabled={generating || hasGenerated}
                            title={hasGenerated ? 'Questions already generated and saved. Change topic or click Generate Another Topic.' : ''}
                        >
                            {generating
                                ? '⚡ AI Generating...'
                                : hasGenerated
                                    ? '✓ Questions Generated & Saved'
                                    : `⚡ Generate ${count} Question${count > 1 ? 's' : ''}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
