import { useState, useEffect } from 'react'
import './GameSplashScreen.css'

const TIPS = [
    'Find the single word that connects all five clues.',
    'Use the 50:50 lifeline when you are down to two choices.',
    'Claim your free daily spin rewards in the store.',
    'Challenge opponents in 1v1 PvP Brain Duels to climb ranks.',
    'Speed Training sharpens your memory, math and logic.',
    'Keep your daily streak alive for legendary bonuses!',
]

export default function GameSplashScreen({
    onFinish,
    loadingText = 'Loading ClueShift...',
    minDuration = 1800,
    isReady = true,
}) {
    const [progress, setProgress] = useState(12)
    const [tipIndex, setTipIndex] = useState(0)
    const [isFadingOut, setIsFadingOut] = useState(false)

    // Tips carousel
    useEffect(() => {
        const tipInterval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % TIPS.length)
        }, 2500)
        return () => clearInterval(tipInterval)
    }, [])

    // Smooth simulated progress to 100%
    useEffect(() => {
        const startTime = Date.now()
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime
            const pct = Math.floor((elapsed / minDuration) * 100)

            // If not ready yet (e.g. auth or network in progress), smoothly hold at 92%
            const targetCap = isReady ? 100 : 92

            setProgress((prev) => {
                const nextVal = Math.min(targetCap, Math.max(prev, pct))
                return nextVal
            })

            if (elapsed >= minDuration && isReady) {
                clearInterval(interval)
                setProgress(100)
                setIsFadingOut(true)
                setTimeout(() => {
                    if (onFinish) onFinish()
                }, 380)
            }
        }, 35)

        return () => clearInterval(interval)
    }, [minDuration, onFinish, isReady])

    return (
        <div className={`clueshift-splash-screen ${isFadingOut ? 'fade-out' : ''}`}>
            {/* Background Ambience */}
            <div className="splash-ambient cyan" />
            <div className="splash-ambient magenta" />
            <div className="splash-grid-overlay" />

            <div className="splash-container">
                {/* Top / Center Branding Pod */}
                <div className="splash-brand">
                    <div className="splash-logo-pod">
                        <div className="splash-logo-glow" />
                        <img
                            src="/clueshift-logo.png"
                            alt="ClueShift Logo"
                            className="splash-logo-img"
                        />
                    </div>

                    <div className="splash-chip">
                        <span className="splash-chip-spark">⚡</span>
                        <span>CYBER PUZZLE ARCADE</span>
                        <span className="splash-chip-dot">•</span>
                        <span className="splash-chip-season">SEASON 1</span>
                    </div>

                    <h1 className="splash-title">
                        <span className="title-clue">CLUE</span>
                        <span className="title-shift">SHIFT</span>
                    </h1>

                    <p className="splash-tagline">
                        CONNECT THE CLUES • TEST YOUR IQ • LEVEL UP
                    </p>
                </div>

                {/* Bottom Game Loading Bar Pod (Candy Crush Style) */}
                <div className="splash-loading-pod">
                    <div className="splash-status-row">
                        <span className="splash-status-text">
                            {progress < 100 ? loadingText : 'Ready to Play!'}
                        </span>
                        <span className="splash-percentage">{progress}%</span>
                    </div>

                    {/* High-Tech Glowing Progress Bar */}
                    <div className="splash-progress-track">
                        <div
                            className="splash-progress-fill"
                            style={{ width: `${progress}%` }}
                        >
                            <span className="splash-progress-sparkle" />
                        </div>
                    </div>

                    {/* Rotating Gameplay Tips */}
                    <p className="splash-tip" key={tipIndex}>
                        <span className="tip-badge">💡 TIP:</span> {TIPS[tipIndex]}
                    </p>

                    <div className="splash-footer">
                        <span>CLUESHIFT ENGINE • v2.4.0</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
