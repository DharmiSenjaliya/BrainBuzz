import React from 'react'
import { Sparkles, Gamepad2, Zap, Shield, Trophy, ArrowRight, Brain } from 'lucide-react'
import './HeroGameBanner.css'

export default function HeroGameBanner({
    currentLevel = 1,
    onPlay,
    onExploreGames,
    onLeaderboard,
    userName = 'Player',
}) {
    return (
        <section className="hero-section">
            <div className="hero-glow-sphere cyan" />
            <div className="hero-glow-sphere magenta" />

            <div className="hero-content">
                <div className="hero-logo-emblem">
                    <span className="hero-brand-icon">
                        <Gamepad2 size={38} color="#ffffff" />
                    </span>
                </div>

                <div className="hero-badge">
                    <Sparkles size={14} className="text-cyan" />
                    <span>3D CYBER MIND &amp; IQ ARENA</span>
                </div>

                <h1 className="hero-title">
                    BRAINBUZZ <span className="neon-gradient">RUN</span>
                </h1>

                <p className="hero-tagline">
                    Train Your Mind • Connect The Clues • Level Up!
                </p>

                <div className="hero-actions">
                    <button
                        type="button"
                        onClick={onPlay}
                        className="cyber-button-lg cyber-button-glow hero-play-btn"
                    >
                        <Gamepad2 size={24} />
                        <span>PLAY NOW (LEVEL {currentLevel})</span>
                    </button>

                    {onExploreGames && (
                        <button
                            type="button"
                            onClick={onExploreGames}
                            className="cyber-button-secondary"
                        >
                            <span>Explore Games</span>
                            <ArrowRight size={18} />
                        </button>
                    )}

                    {onLeaderboard && (
                        <button
                            type="button"
                            onClick={onLeaderboard}
                            className="cyber-button-secondary"
                        >
                            <span>Ranks</span>
                            <Trophy size={18} />
                        </button>
                    )}
                </div>

                {/* Quick Highlights Bar */}
                <div className="hero-stats-bar">
                    <div className="hero-stat-item">
                        <Zap size={22} className="text-cyan" />
                        <div>
                            <div className="stat-label">5 Clues Puzzle</div>
                            <div className="stat-sub">Connect The Words</div>
                        </div>
                    </div>
                    <div className="hero-stat-item">
                        <Brain size={22} className="text-magenta" />
                        <div>
                            <div className="stat-label">Adaptive IQ</div>
                            <div className="stat-sub">Endless Levels</div>
                        </div>
                    </div>
                    <div className="hero-stat-item">
                        <Shield size={22} className="text-green" />
                        <div>
                            <div className="stat-label">Power-Ups</div>
                            <div className="stat-sub">3 Hints &amp; Tries</div>
                        </div>
                    </div>
                    <div className="hero-stat-item">
                        <Trophy size={22} className="text-gold" />
                        <div>
                            <div className="stat-label">Global Ranks</div>
                            <div className="stat-sub">Compete Live</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
