import React, { useState, useEffect, useRef } from 'react'
import './RewardedAdPlayer.css'
import soundService from './services/soundService'

// Catalog of Popular Google Play Store Games
const PLAYSTORE_GAMES = [
    {
        id: 'candy_crush',
        name: 'Candy Crush Saga',
        tagline: 'Match-3 Sweet Puzzle Adventure',
        developer: 'King • Top Developer',
        category: 'Casual • Puzzle',
        icon: '🍬',
        rating: '4.6★',
        reviews: '36M reviews',
        downloads: '1B+ Downloads',
        accentColor: '#ec4899',
        themeGrad: 'linear-gradient(135deg, #ec4899, #f43f5e)',
        interactiveCta: '🍭 TAP TO CRUSH CANDIES!',
        playstoreUrl: 'https://play.google.com/store/apps/details?id=com.king.candycrushsaga',
        burstText: ['SWEET!', 'TASTY!', 'SUGAR CRUSH!', 'DIVINE!'],
    },
    {
        id: 'subway_surfers',
        name: 'Subway Surfers',
        tagline: 'World Tour Endless Runner',
        developer: 'SYBO Games',
        category: 'Action • Endless Runner',
        icon: '🛹',
        rating: '4.6★',
        reviews: '41M reviews',
        downloads: '1B+ Downloads',
        accentColor: '#38bdf8',
        themeGrad: 'linear-gradient(135deg, #38bdf8, #f59e0b)',
        interactiveCta: '⚡ TAP TO HOVERBOARD JUMP!',
        playstoreUrl: 'https://play.google.com/store/apps/details?id=com.kiloo.subwaysurf',
        burstText: ['SUPER JUMP!', 'COIN MAGNET!', '2X MULTIPLIER!', 'HOVERBOARD!'],
    },
    {
        id: 'royal_match',
        name: 'Royal Match',
        tagline: 'Save King Robert & Build Castle',
        developer: 'Dream Games, Ltd.',
        category: 'Puzzle • Match 3',
        icon: '👑',
        rating: '4.7★',
        reviews: '8.5M reviews',
        downloads: '100M+ Downloads',
        accentColor: '#f59e0b',
        themeGrad: 'linear-gradient(135deg, #f59e0b, #8b5cf6)',
        interactiveCta: '🛡️ TAP TO SAVE THE KING!',
        playstoreUrl: 'https://play.google.com/store/apps/details?id=com.dreamgames.royalmatch',
        burstText: ['KING SAVED!', 'ROYAL CHEST!', 'SUPER COMBO!', 'CASTLE BUILT!'],
    },
    {
        id: 'asphalt_9',
        name: 'Asphalt 9: Legends',
        tagline: 'Nitro Hypercar Street Racing',
        developer: 'Gameloft SE',
        category: 'Racing • Hypercar',
        icon: '🏎️',
        rating: '4.5★',
        reviews: '3.2M reviews',
        downloads: '100M+ Downloads',
        accentColor: '#ef4444',
        themeGrad: 'linear-gradient(135deg, #ef4444, #f59e0b)',
        interactiveCta: '🔥 TAP FOR NITRO SHOCKWAVE!',
        playstoreUrl: 'https://play.google.com/store/apps/details?id=com.gameloft.android.ANMP.GloftA9HM',
        burstText: ['NITRO BOOST!', '360° SPIN!', 'SHOCKWAVE!', 'HYPER SPEED!'],
    },
    {
        id: 'neonvolt',
        name: 'NeonVolt Run 3D',
        tagline: '3D Cyber Matrix Runner',
        developer: 'ClueShift Studios',
        category: 'Action • Sci-Fi Runner',
        icon: '⚡',
        rating: '4.9★',
        reviews: '1.2M reviews',
        downloads: '50M+ Downloads',
        accentColor: '#06b6d4',
        themeGrad: 'linear-gradient(135deg, #06b6d4, #ec4899)',
        interactiveCta: '🚀 TAP FOR MATRIX SPEED!',
        playstoreUrl: 'https://play.google.com',
        burstText: ['HYPER BOOST!', 'MATRIX SHIELD!', 'ULTRA SPEED!', 'MAX OVERDRIVE!'],
    },
]

export default function RewardedAdPlayer({ isOpen, onClose, onRewardEarned }) {
    const [gameIndex, setGameIndex] = useState(0)
    const [timeLeft, setTimeLeft] = useState(5)
    const [progress, setProgress] = useState(0)
    const [adFinished, setAdFinished] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [scoreCount, setScoreCount] = useState(100)
    const [burstLabel, setBurstLabel] = useState('')
    const [tapEffect, setTapEffect] = useState(false)

    const canvasRef = useRef(null)
    const animFrameRef = useRef(null)

    // Pick a new random Play Store game each time the ad opens
    useEffect(() => {
        if (isOpen) {
            setGameIndex((prev) => {
                let next = Math.floor(Math.random() * PLAYSTORE_GAMES.length)
                if (next === prev) {
                    next = (prev + 1) % PLAYSTORE_GAMES.length
                }
                return next
            })
            setTimeLeft(5)
            setProgress(0)
            setAdFinished(false)
            setScoreCount(150)
            setBurstLabel('')
        }
    }, [isOpen])

    const activeGame = PLAYSTORE_GAMES[gameIndex] || PLAYSTORE_GAMES[0]

    // 5-Second Countdown Timer
    useEffect(() => {
        if (!isOpen) {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
            return
        }

        const totalDuration = 5000 // 5 seconds
        const stepInterval = 100
        let elapsed = 0

        const timer = setInterval(() => {
            elapsed += stepInterval
            const currentPct = Math.min(Math.round((elapsed / totalDuration) * 100), 100)
            const remaining = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000))

            setProgress(currentPct)
            setTimeLeft(remaining)

            if (!isMuted && elapsed % 1000 === 0 && remaining > 0) {
                soundService.playTick()
            }

            if (elapsed >= totalDuration) {
                clearInterval(timer)
                setAdFinished(true)
                setProgress(100)
                setTimeLeft(0)
                soundService.playWin()
            }
        }, stepInterval)

        return () => {
            clearInterval(timer)
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        }
    }, [isOpen, isMuted, gameIndex])

    // Dynamic Multi-Game Canvas Animation
    useEffect(() => {
        if (!isOpen) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let width = (canvas.width = canvas.offsetWidth)
        let height = (canvas.height = canvas.offsetHeight)

        let offset = 0
        let speed = 4
        let playerX = width * 0.5
        let playerY = height * 0.72
        let particles = []
        let items = [
            { z: 150, lane: -1 },
            { z: 350, lane: 0 },
            { z: 550, lane: 1 },
        ]

        const render = () => {
            width = canvas.width = canvas.offsetWidth
            height = canvas.height = canvas.offsetHeight

            // Background based on game
            const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
            if (activeGame.id === 'candy_crush') {
                bgGrad.addColorStop(0, '#3b0764')
                bgGrad.addColorStop(0.5, '#701a75')
                bgGrad.addColorStop(1, '#1e1b4b')
            } else if (activeGame.id === 'asphalt_9') {
                bgGrad.addColorStop(0, '#1c1917')
                bgGrad.addColorStop(0.5, '#450a0a')
                bgGrad.addColorStop(1, '#0c0a09')
            } else if (activeGame.id === 'royal_match') {
                bgGrad.addColorStop(0, '#1e1b4b')
                bgGrad.addColorStop(0.5, '#312e81')
                bgGrad.addColorStop(1, '#0f172a')
            } else if (activeGame.id === 'subway_surfers') {
                bgGrad.addColorStop(0, '#0284c7')
                bgGrad.addColorStop(0.5, '#0369a1')
                bgGrad.addColorStop(1, '#0f172a')
            } else {
                bgGrad.addColorStop(0, '#060919')
                bgGrad.addColorStop(0.5, '#0f172a')
                bgGrad.addColorStop(1, '#020617')
            }
            ctx.fillStyle = bgGrad
            ctx.fillRect(0, 0, width, height)

            const horizonY = height * 0.38
            offset = (offset + speed) % 40

            // 1) CANDY CRUSH: Floating colorful candies & sweet cascades
            if (activeGame.id === 'candy_crush') {
                const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#38bdf8', '#fbbf24', '#10b981']
                for (let i = 0; i < 18; i++) {
                    const cx = (i * 45 + offset * 2) % width
                    const cy = (Math.sin(offset * 0.05 + i) * 60) + height * 0.45 + (i % 3) * 50
                    ctx.save()
                    ctx.beginPath()
                    ctx.arc(cx, cy, 14, 0, Math.PI * 2)
                    ctx.fillStyle = colors[i % colors.length]
                    ctx.shadowColor = colors[i % colors.length]
                    ctx.shadowBlur = 12
                    ctx.fill()
                    // Candy wrapper swirl
                    ctx.beginPath()
                    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
                    ctx.fill()
                    ctx.restore()
                }

                // Giant Center Color Bomb
                ctx.save()
                ctx.beginPath()
                ctx.arc(width / 2, height * 0.42, 34, 0, Math.PI * 2)
                ctx.fillStyle = '#4c1d95'
                ctx.shadowColor = '#ec4899'
                ctx.shadowBlur = 24
                ctx.fill()
                ctx.strokeStyle = '#f472b6'
                ctx.lineWidth = 3
                ctx.stroke()
                // Colorful sprinkles
                for (let s = 0; s < 8; s++) {
                    const a = s * (Math.PI / 4) + offset * 0.02
                    const sx = width / 2 + Math.cos(a) * 18
                    const sy = height * 0.42 + Math.sin(a) * 18
                    ctx.fillStyle = colors[s % colors.length]
                    ctx.fillRect(sx - 3, sy - 3, 6, 6)
                }
                ctx.restore()
            }
            // 2) SUBWAY SURFERS / ASPHALT / NEONVOLT: 3D perspective track with runner / car
            else {
                ctx.strokeStyle = activeGame.accentColor
                ctx.lineWidth = 1.5

                // Perspective longitudinal lines
                const numLanes = 6
                for (let i = -numLanes; i <= numLanes; i++) {
                    const spread = (i / numLanes) * (width * 0.75)
                    ctx.beginPath()
                    ctx.moveTo(width / 2, horizonY)
                    ctx.lineTo(width / 2 + spread, height)
                    ctx.stroke()
                }

                // Perspective transverse lines
                for (let y = 0; y < 12; y++) {
                    const p = (y * 40 + offset) / 480
                    const curY = horizonY + Math.pow(p, 2.2) * (height - horizonY)
                    ctx.beginPath()
                    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(p * 0.7, 0.6)})`
                    ctx.moveTo(0, curY)
                    ctx.lineTo(width, curY)
                    ctx.stroke()
                }

                // Floating track items (Gold coins / gems)
                items.forEach((item) => {
                    item.z -= speed * 1.3
                    if (item.z <= 10) {
                        item.z = 550 + Math.random() * 200
                        item.lane = Math.floor(Math.random() * 3) - 1
                    }

                    const scale = (550 - item.z) / 550
                    if (scale > 0) {
                        const itemY = horizonY + Math.pow(scale, 1.8) * (height - horizonY) * 0.85
                        const laneW = width * 0.16 * scale
                        const itemX = width / 2 + item.lane * laneW

                        ctx.save()
                        ctx.beginPath()
                        ctx.arc(itemX, itemY, Math.max(7 * scale, 3), 0, Math.PI * 2)
                        ctx.fillStyle = activeGame.id === 'royal_match' ? '#a855f7' : '#fbbf24'
                        ctx.shadowColor = ctx.fillStyle
                        ctx.shadowBlur = 15 * scale
                        ctx.fill()
                        ctx.restore()
                    }
                })

                // Player character: Car for Asphalt, Hovercraft for NeonVolt, Skater for Subway
                ctx.save()
                ctx.translate(playerX, playerY)

                if (activeGame.id === 'asphalt_9') {
                    // Sports car chassis
                    ctx.fillStyle = '#dc2626'
                    ctx.shadowColor = '#ef4444'
                    ctx.shadowBlur = 20
                    ctx.beginPath()
                    ctx.roundRect(-22, -18, 44, 34, 6)
                    ctx.fill()
                    // Windshield
                    ctx.fillStyle = '#1e293b'
                    ctx.fillRect(-16, -10, 32, 12)
                    // Twin nitro flames
                    ctx.fillStyle = '#38bdf8'
                    ctx.shadowColor = '#38bdf8'
                    ctx.shadowBlur = 20
                    ctx.beginPath()
                    ctx.moveTo(-14, 16)
                    ctx.lineTo(-8, 32 + Math.random() * 10)
                    ctx.lineTo(-2, 16)
                    ctx.fill()
                    ctx.beginPath()
                    ctx.moveTo(2, 16)
                    ctx.lineTo(8, 32 + Math.random() * 10)
                    ctx.lineTo(14, 16)
                    ctx.fill()
                } else if (activeGame.id === 'royal_match') {
                    // Royal crown emblem
                    ctx.font = '40px sans-serif'
                    ctx.textAlign = 'center'
                    ctx.fillText('👑', 0, 0)
                } else {
                    // Hovercraft / Skater
                    ctx.beginPath()
                    ctx.moveTo(0, -20)
                    ctx.lineTo(18, 10)
                    ctx.lineTo(12, 14)
                    ctx.lineTo(0, 8)
                    ctx.lineTo(-12, 14)
                    ctx.lineTo(-18, 10)
                    ctx.closePath()
                    ctx.fillStyle = activeGame.accentColor
                    ctx.shadowColor = activeGame.accentColor
                    ctx.shadowBlur = 18
                    ctx.fill()
                    ctx.strokeStyle = '#ffffff'
                    ctx.stroke()
                }

                ctx.restore()
            }

            // Interactive Thruster Particles
            if (Math.random() > 0.3) {
                particles.push({
                    x: playerX + (Math.random() - 0.5) * 14,
                    y: playerY + 16,
                    vx: (Math.random() - 0.5) * 2,
                    vy: 3 + Math.random() * 4,
                    life: 1,
                    color: activeGame.accentColor,
                })
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i]
                p.x += p.vx
                p.y += p.vy
                p.life -= 0.05
                if (p.life <= 0) {
                    particles.splice(i, 1)
                } else {
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, p.life * 4, 0, Math.PI * 2)
                    ctx.fillStyle = p.color
                    ctx.globalAlpha = p.life
                    ctx.fill()
                    ctx.globalAlpha = 1
                }
            }

            animFrameRef.current = requestAnimationFrame(render)
        }

        animFrameRef.current = requestAnimationFrame(render)

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        }
    }, [isOpen, activeGame])

    if (!isOpen) return null

    // Interactive screen click: directly redirects player to that game's official Play Store page
    const handleAdScreenClick = () => {
        soundService.playClick()
        window.open(activeGame.playstoreUrl, '_blank')
    }

    // Interactive Boost button on ad
    const handleBoost = (e) => {
        e.stopPropagation()
        soundService.playPowerup()
        setScoreCount((prev) => prev + 50)
        setTapEffect(true)

        // Show random burst excitement phrase
        const phrases = activeGame.burstText
        const phrase = phrases[Math.floor(Math.random() * phrases.length)]
        setBurstLabel(phrase)

        setTimeout(() => setTapEffect(false), 300)
        setTimeout(() => setBurstLabel(''), 900)
    }

    // Claim reward & close
    const handleClaimReward = () => {
        soundService.playClick()
        if (onRewardEarned) {
            onRewardEarned({
                coins: 100,
                type: 'ad_reward',
                description: `Watched 5s Rewarded Ad for ${activeGame.name} (+100 Coins)`,
            })
        }
        onClose()
    }

    return (
        <div className="ad-player-overlay">
            <div className="ad-player-modal">
                {/* Ad Top Header Bar */}
                <div className="ad-top-bar">
                    <div className="ad-sponsor-info">
                        <span className="ad-playstore-pill">▶ Google Play</span>
                        <span className="sponsor-text">Sponsored by {activeGame.name}</span>
                    </div>

                    <div className="ad-header-right">
                        {/* Audio Mute / Unmute Button */}
                        <button
                            type="button"
                            className="ad-mute-btn"
                            onClick={() => setIsMuted(!isMuted)}
                            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                        >
                            {isMuted ? '🔇' : '🔊'}
                        </button>

                        {/* Countdown Badge / Close Button */}
                        {timeLeft > 0 ? (
                            <div className="ad-timer-pill" title="Watch full 5 seconds to earn your reward">
                                <span>⏳ Reward in {timeLeft}s</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="ad-close-ready-btn"
                                onClick={handleClaimReward}
                                title="Claim +100 Coins & Close"
                            >
                                ✓ Reward Ready [✕]
                            </button>
                        )}
                    </div>
                </div>

                {/* Ad Video / Playable Game Stage - Clicking Screen directly redirects to Play Store */}
                <div
                    className="ad-stage-wrap"
                    onClick={handleAdScreenClick}
                    title={`Click to open ${activeGame.name} on Google Play Store`}
                >
                    <canvas ref={canvasRef} className="ad-canvas"></canvas>

                    {/* Overlay Game Graphics */}
                    <div className="ad-hud-overlay">
                        <div className="hud-title-wrap">
                            <span className="game-hud-icon">{activeGame.icon}</span>
                            <div>
                                <span className="game-hud-brand">{activeGame.name.toUpperCase()}</span>
                                <span className="game-hud-sub">{activeGame.category}</span>
                            </div>
                        </div>

                        <div className="hud-score-pill">
                            <span>Score:</span>
                            <strong>{scoreCount.toLocaleString()}</strong>
                        </div>
                    </div>

                    {/* Floating Burst Combo Text */}
                    {burstLabel && (
                        <div className="floating-combo-banner">
                            {burstLabel}
                        </div>
                    )}

                    {/* Tap screen redirect hint */}
                    <div className="ad-screen-click-hint">
                        <span>▶ Tap screen to open on Google Play ↗</span>
                    </div>

                    {/* Interactive Playable Hint */}
                    <div className="ad-interactive-hint">
                        <button
                            type="button"
                            className={`boost-cta-btn ${tapEffect ? 'boost-pulse' : ''}`}
                            style={{ background: activeGame.themeGrad }}
                            onClick={handleBoost}
                        >
                            {activeGame.interactiveCta}
                        </button>
                    </div>

                    {/* 5-Second Progress Bar at Bottom of Video */}
                    <div className="ad-bottom-progress">
                        <div
                            className="ad-fill-track"
                            style={{
                                width: `${progress}%`,
                                background: activeGame.themeGrad,
                            }}
                        ></div>
                    </div>
                </div>

                {/* Bottom Sponsor Ticker - Click to open Play Store */}
                <div
                    className="ad-sponsor-ticker"
                    onClick={handleAdScreenClick}
                    title={`Click to open ${activeGame.name} on Google Play Store`}
                >
                    <div className="ticker-left">
                        <span className="ticker-icon">{activeGame.icon}</span>
                        <div>
                            <strong className="ticker-game-name">{activeGame.name}</strong>
                            <span className="ticker-dev">{activeGame.developer}</span>
                        </div>
                    </div>
                    <div className="ticker-right">
                        <span className="ticker-stars">★ {activeGame.rating}</span>
                        <span className="ticker-downloads">{activeGame.downloads}</span>
                    </div>
                </div>

                {/* ================= REWARD END-CARD OVERLAY (AFTER 5s) ================= */}
                {adFinished && (
                    <div className="ad-endcard-overlay">
                        <div className="endcard-card">
                            <div className="endcard-trophy-ring">
                                <span className="trophy-emoji">🏆</span>
                            </div>

                            <h2>Ad Watched Successfully!</h2>
                            <p className="endcard-sub">
                                You supported ClueShift and unlocked your reward.
                            </p>

                            {/* Promoted Play Store App Card - Clickable */}
                            <div
                                className="endcard-app-banner clickable"
                                onClick={handleAdScreenClick}
                                title={`Click to view ${activeGame.name} on Play Store`}
                            >
                                <span className="app-banner-icon">{activeGame.icon}</span>
                                <div className="app-banner-info">
                                    <h4>{activeGame.name}</h4>
                                    <p>{activeGame.tagline}</p>
                                    <div className="app-banner-meta">
                                        <span className="meta-badge">★ {activeGame.rating}</span>
                                        <span className="meta-badge">{activeGame.downloads}</span>
                                        <span className="meta-badge-free">FREE ON PLAY STORE ↗</span>
                                    </div>
                                </div>
                            </div>

                            <div className="endcard-reward-box">
                                <span className="reward-label">REWARD UNLOCKED</span>
                                <div className="reward-amount">🪙 +100 Free Coins</div>
                                <span className="reward-credit-note">Credited to your player balance</span>
                            </div>

                            <div className="endcard-actions">
                                <button
                                    type="button"
                                    className="claim-reward-cta"
                                    onClick={handleClaimReward}
                                >
                                    🎁 Claim +100 Coins
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
