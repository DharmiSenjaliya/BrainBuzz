import { useState, useEffect, useRef, useCallback } from 'react'
import './DailyRewardModal.css'
import soundService from './services/soundService'

const STREAK_REWARDS = [
    { day: 1, reward: 50, icon: '🪙', label: '50 Coins' },
    { day: 2, reward: 100, icon: '🪙', label: '100 Coins' },
    { day: 3, reward: 150, icon: '⚡', label: '150 Coins + Hint' },
    { day: 4, reward: 200, icon: '🪙', label: '200 Coins' },
    { day: 5, reward: 300, icon: '🎯', label: '300 Coins + Lifeline' },
    { day: 6, reward: 400, icon: '🔥', label: '400 Coins' },
    { day: 7, reward: 1000, icon: '👑', label: '1000 Coins + Pro Badge' },
]

const WHEEL_SLICES = [
    { label: '50 Coins', value: 50, type: 'coins', color: '#6366f1' },
    { label: '100 Coins', value: 100, type: 'coins', color: '#06b6d4' },
    { label: '1 Hint', value: 1, type: 'hint', color: '#10b981' },
    { label: '250 Coins', value: 250, type: 'coins', color: '#f59e0b' },
    { label: '2x XP Boost', value: 2, type: 'xp', color: '#ec4899' },
    { label: '500 Coins', value: 500, type: 'coins', color: '#8b5cf6' },
    { label: '50-50 Lifeline', value: 1, type: 'lifeline', color: '#3b82f6' },
    { label: 'Mystery Chest', value: 1000, type: 'chest', color: '#ef4444' },
]

export default function DailyRewardModal({ isOpen, onClose, onRewardClaimed }) {
    const [activeTab, setActiveTab] = useState('streak') // 'streak' or 'wheel'
    const [streakCount, setStreakCount] = useState(1)
    const [alreadyClaimedToday, setAlreadyClaimedToday] = useState(false)
    const [spinning, setSpinning] = useState(false)
    const [wheelResult, setWheelResult] = useState(null)
    const [spinAlreadyUsed, setSpinAlreadyUsed] = useState(false)
    const [celebrationMsg, setCelebrationMsg] = useState('')

    const canvasRef = useRef(null)
    const currentAngleRef = useRef(0)

    // Draw the 8-slice canvas wheel
    const drawWheel = useCallback((rotationAngle) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const width = canvas.width
        const height = canvas.height
        const centerX = width / 2
        const centerY = height / 2
        const radius = width / 2 - 10

        ctx.clearRect(0, 0, width, height)

        const sliceAngle = (2 * Math.PI) / WHEEL_SLICES.length

        WHEEL_SLICES.forEach((slice, i) => {
            const angle = rotationAngle + i * sliceAngle

            // Slice background
            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle)
            ctx.closePath()
            ctx.fillStyle = slice.color
            ctx.fill()
            ctx.lineWidth = 2
            ctx.strokeStyle = '#ffffff33'
            ctx.stroke()

            // Slice Text
            ctx.save()
            ctx.translate(centerX, centerY)
            ctx.rotate(angle + sliceAngle / 2)
            ctx.textAlign = 'right'
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 13px Inter, sans-serif'
            ctx.shadowColor = 'rgba(0,0,0,0.7)'
            ctx.shadowBlur = 4
            ctx.fillText(slice.label, radius - 20, 5)
            ctx.restore()
        })

        // Center hub
        ctx.beginPath()
        ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI)
        ctx.fillStyle = '#0f172a'
        ctx.fill()
        ctx.lineWidth = 3
        ctx.strokeStyle = '#38bdf8'
        ctx.stroke()

        ctx.fillStyle = '#38bdf8'
        ctx.font = 'bold 14px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('⚡', centerX, centerY)
    }, [])

    useEffect(() => {
        if (!isOpen) return

        // Load streak and claim date
        const savedStreak = parseInt(localStorage.getItem('brainbuzz_login_streak') || '1', 10)
        const lastClaimDate = localStorage.getItem('brainbuzz_last_streak_claim')
        const todayStr = new Date().toISOString().slice(0, 10)

        setStreakCount(savedStreak)
        setAlreadyClaimedToday(lastClaimDate === todayStr)

        // Spin state
        const lastSpinDate = localStorage.getItem('brainbuzz_last_spin_date')
        setSpinAlreadyUsed(lastSpinDate === todayStr)

        drawWheel(0)
    }, [isOpen, drawWheel])

    // Spin wheel action
    const spinWheel = () => {
        if (spinning || spinAlreadyUsed) return

        soundService.playClick()
        setSpinning(true)
        setWheelResult(null)
        setCelebrationMsg('')

        // Determine winning slice (random 0 to 7)
        const winningIndex = Math.floor(Math.random() * WHEEL_SLICES.length)
        const sliceAngle = (2 * Math.PI) / WHEEL_SLICES.length
        const extraRotations = 6 + Math.floor(Math.random() * 3) // 6-8 full loops

        // Top pointer is at -Math.PI / 2 (or 3*Math.PI/2)
        const targetSliceCenter = winningIndex * sliceAngle + sliceAngle / 2
        const finalAngle =
            extraRotations * (2 * Math.PI) +
            (3 * Math.PI) / 2 -
            targetSliceCenter

        const startAngle = currentAngleRef.current % (2 * Math.PI)
        const totalDelta = finalAngle - startAngle
        const duration = 4000 // 4 seconds
        const startTime = performance.now()

        let lastTickAngle = 0

        const animate = (time) => {
            const elapsed = time - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Ease-out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3)
            const currentAngle = startAngle + totalDelta * easeOut

            currentAngleRef.current = currentAngle
            drawWheel(currentAngle)

            // Play tick sound every slice pass
            if (Math.abs(currentAngle - lastTickAngle) > sliceAngle * 0.5) {
                soundService.playWheelSpin()
                lastTickAngle = currentAngle
            }

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                setSpinning(false)
                const won = WHEEL_SLICES[winningIndex]
                setWheelResult(won)
                soundService.playWin()

                const todayStr = new Date().toISOString().slice(0, 10)
                localStorage.setItem('brainbuzz_last_spin_date', todayStr)
                setSpinAlreadyUsed(true)

                if (onRewardClaimed) {
                    onRewardClaimed({
                        type: 'spin',
                        coins: won.type === 'coins' || won.type === 'chest' ? won.value : 50,
                        description: `Lucky Wheel: ${won.label}`,
                    })
                }
            }
        }

        requestAnimationFrame(animate)
    }

    // Claim daily streak
    const claimStreakReward = () => {
        if (alreadyClaimedToday) return

        soundService.playWin()
        const currentReward = STREAK_REWARDS[(streakCount - 1) % 7]
        const todayStr = new Date().toISOString().slice(0, 10)

        const nextStreak = (streakCount % 7) + 1
        localStorage.setItem('brainbuzz_login_streak', String(nextStreak))
        localStorage.setItem('brainbuzz_last_streak_claim', todayStr)

        setAlreadyClaimedToday(true)
        setCelebrationMsg(`🎉 Claimed ${currentReward.label}! Come back tomorrow for Day ${nextStreak}!`)

        if (onRewardClaimed) {
            onRewardClaimed({
                type: 'streak',
                coins: currentReward.reward,
                description: `Daily Streak Day ${streakCount}: ${currentReward.label}`,
            })
        }
    }

    if (!isOpen) return null

    return (
        <div className="daily-reward-overlay" onClick={onClose}>
            <div className="daily-reward-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={() => { soundService.playClick(); onClose() }}>
                    ✕
                </button>

                <div className="daily-reward-header">
                    <h2>Daily Rewards</h2>
                    <p>Claim daily streak coins and spin for prizes.</p>
                </div>

                <div className="reward-tabs">
                    <button
                        className={`reward-tab ${activeTab === 'streak' ? 'active' : ''}`}
                        onClick={() => { soundService.playClick(); setActiveTab('streak') }}
                    >
                        🔥 7-Day Streak
                    </button>
                    <button
                        className={`reward-tab ${activeTab === 'wheel' ? 'active' : ''}`}
                        onClick={() => { soundService.playClick(); setActiveTab('wheel'); setTimeout(() => drawWheel(currentAngleRef.current), 50) }}
                    >
                        🎡 Lucky Wheel
                    </button>
                </div>

                {activeTab === 'streak' && (
                    <div className="streak-content">
                        <div className="streak-grid">
                            {STREAK_REWARDS.map((item) => {
                                const isCurrent = item.day === streakCount
                                const isClaimed = item.day < streakCount || (isCurrent && alreadyClaimedToday)

                                return (
                                    <div
                                        key={item.day}
                                        className={`streak-card ${isCurrent ? 'current-day' : ''} ${isClaimed ? 'claimed' : ''}`}
                                    >
                                        <div className="day-header">Day {item.day}</div>
                                        <div className="day-icon">{item.icon}</div>
                                        <div className="day-reward">{item.label}</div>
                                        <div className="day-status">
                                            {isClaimed ? '✓ Claimed' : isCurrent ? 'Ready!' : 'Locked'}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {celebrationMsg && <div className="celebration-alert">{celebrationMsg}</div>}

                        <button
                            className="claim-action-btn"
                            disabled={alreadyClaimedToday}
                            onClick={claimStreakReward}
                        >
                            {alreadyClaimedToday ? '✓ Already Claimed Today' : `🎁 Claim Day ${streakCount} Reward`}
                        </button>
                    </div>
                )}

                {activeTab === 'wheel' && (
                    <div className="wheel-content">
                        <div className="wheel-canvas-container">
                            <div className="wheel-pointer">▼</div>
                            <canvas
                                ref={canvasRef}
                                width={280}
                                height={280}
                                className="spin-canvas"
                            />
                        </div>

                        {wheelResult && (
                            <div className="wheel-won-card">
                                🎉 You won <strong>{wheelResult.label}</strong>!
                            </div>
                        )}

                        <button
                            className="claim-action-btn spin-btn"
                            disabled={spinning || spinAlreadyUsed}
                            onClick={spinWheel}
                        >
                            {spinning ? 'Spinning...' : spinAlreadyUsed ? '✓ Next Free Spin Tomorrow' : '🎡 SPIN WHEEL FREE'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
