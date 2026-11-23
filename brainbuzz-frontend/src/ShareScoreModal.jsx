import { useRef, useState } from 'react'
import './ShareScoreModal.css'
import soundService from './services/soundService'

export default function ShareScoreModal({ isOpen, onClose, scoreData, playerName }) {
    const [copied, setCopied] = useState(false)
    const cardRef = useRef(null)

    if (!isOpen || !scoreData) return null

    const {
        level = 1,
        score = 0,
        correctAnswers = 0,
        totalQuestions = 5,
        passed = true,
    } = scoreData

    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    const displayName = playerName || 'Brainiac'
    const shareText = `🧠 I just scored ${score} pts with ${accuracy}% accuracy on Level ${level} in ClueShift! Can you beat my score? Play now: ${window.location.origin}`

    const handleCopy = () => {
        soundService.playClick()
        navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    const shareWhatsApp = () => {
        soundService.playClick()
        const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`
        window.open(url, '_blank')
    }

    const shareTwitter = () => {
        soundService.playClick()
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
        window.open(url, '_blank')
    }

    // Generate downloadable PNG badge from canvas
    const downloadBadgeImage = () => {
        soundService.playClick()
        const canvas = document.createElement('canvas')
        canvas.width = 600
        canvas.height = 360
        const ctx = canvas.getContext('2d')

        // Background Gradient
        const grad = ctx.createLinearGradient(0, 0, 600, 360)
        grad.addColorStop(0, '#0a0f1d')
        grad.addColorStop(0.5, '#1e1b4b')
        grad.addColorStop(1, '#0f172a')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 600, 360)

        // Border Glow
        ctx.strokeStyle = '#6366f1'
        ctx.lineWidth = 4
        ctx.strokeRect(10, 10, 580, 340)

        // Accent Circle
        const circleGrad = ctx.createRadialGradient(500, 80, 10, 500, 80, 180)
        circleGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)')
        circleGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = circleGrad
        ctx.fillRect(0, 0, 600, 360)

        // Title
        ctx.fillStyle = '#38bdf8'
        ctx.font = 'bold 24px Inter, sans-serif'
        ctx.fillText('⚡ CLUESHIFT PUZZLE CHAMPION', 40, 60)

        // Subtitle
        ctx.fillStyle = '#94a3b8'
        ctx.font = '16px Inter, sans-serif'
        ctx.fillText(`Player: ${displayName}`, 40, 100)

        // Big Score
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 54px Inter, sans-serif'
        ctx.fillText(`${score} PTS`, 40, 175)

        // Stats Row
        ctx.fillStyle = '#10b981'
        ctx.font = 'bold 20px Inter, sans-serif'
        ctx.fillText(`Level ${level} ${passed ? '✓ PASSED' : ''}`, 40, 230)

        ctx.fillStyle = '#a5b4fc'
        ctx.font = '18px Inter, sans-serif'
        ctx.fillText(`Accuracy: ${accuracy}% (${correctAnswers}/${totalQuestions} correct)`, 40, 265)

        // Footer
        ctx.fillStyle = '#64748b'
        ctx.font = '14px Inter, sans-serif'
        ctx.fillText('clueshift.game • Dare to challenge my brain!', 40, 320)

        // Trophy Emoji / Icon
        ctx.font = '72px Inter, sans-serif'
        ctx.fillText('🏆', 460, 200)

        // Download
        const link = document.createElement('a')
        link.download = `clueshift-score-level-${level}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
    }

    return (
        <div className="share-score-overlay" onClick={onClose}>
            <div className="share-score-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={() => { soundService.playClick(); onClose() }}>
                    ✕
                </button>

                <div className="share-header">
                    <h2>Share Your Score</h2>
                    <p>Challenge your friends to beat your high score!</p>
                </div>

                {/* Scorecard preview */}
                <div className="scorecard-preview" ref={cardRef}>
                    <div className="card-top">
                        <span className="card-brand">⚡ CLUESHIFT</span>
                        <span className="card-level">Level {level} {passed ? '✓ Cleared' : ''}</span>
                    </div>

                    <div className="card-body">
                        <div className="card-player-row">
                            <span className="card-avatar">⚡</span>
                            <div>
                                <h3 className="card-player-name">{displayName}</h3>
                                <span className="card-badge-pill">Puzzle Master</span>
                            </div>
                        </div>

                        <div className="card-score-big">
                            <span className="score-num">{score}</span>
                            <span className="score-lbl">POINTS</span>
                        </div>

                        <div className="card-stats-grid">
                            <div className="stat-pill">
                                <span className="stat-label">Accuracy</span>
                                <span className="stat-val">{accuracy}%</span>
                            </div>
                            <div className="stat-pill">
                                <span className="stat-label">Correct</span>
                                <span className="stat-val">{correctAnswers} / {totalQuestions}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Share Buttons */}
                <div className="share-buttons-grid">
                    <button className="share-btn whatsapp-btn" onClick={shareWhatsApp}>
                        <span>💬</span> WhatsApp
                    </button>
                    <button className="share-btn twitter-btn" onClick={shareTwitter}>
                        <span>🐦</span> X (Twitter)
                    </button>
                    <button className="share-btn copy-btn" onClick={handleCopy}>
                        <span>📋</span> {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button className="share-btn download-btn" onClick={downloadBadgeImage}>
                        <span>🖼️</span> Download Badge
                    </button>
                </div>
            </div>
        </div>
    )
}
