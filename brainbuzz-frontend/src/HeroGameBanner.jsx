import React from 'react'
import { Sparkles, Gamepad2, Zap, Shield, Trophy, ArrowRight, Brain } from 'lucide-react'
import './HeroGameBanner.css'

export default function HeroGameBanner({
    currentLevel = 1,
    onPlay,
    onExploreGames,
    onLeaderboard,
    onViewLevels,
    userName = 'Player',
}) {
    return (
        <section className="hero-section">
            <div className="hero-glow-sphere cyan" />
            <div className="hero-glow-sphere magenta" />

            <div className="hero-content">
                {/* Sleek Frosted Cyber Title Pod */}
                <div className="hero-title-pod">
                    <div className="hero-top-chip">
                        <span className="hero-chip-pulse">⚡</span>
                        <span className="hero-chip-text">CYBER PUZZLE ARCADE</span>
                        <span className="hero-chip-dot" />
                        <span className="hero-chip-season">SEASON 1</span>
                    </div>

                    <h1 className="hero-title">
                        <span className="title-clue">CLUE</span>
                        <span className="title-shift">SHIFT</span>
                    </h1>

                    <div className="hero-title-divider">
                        <span className="divider-line" />
                        <span className="divider-spark">✦</span>
                        <span className="divider-line" />
                    </div>

                    <p className="hero-tagline">
                        <span>CONNECT THE CLUES</span>
                        <i className="tagline-dot">•</i>
                        <span>TEST YOUR IQ</span>
                        <i className="tagline-dot">•</i>
                        <span>LEVEL UP</span>
                    </p>
                </div>

                <div className="hero-actions">
                    <button
                        type="button"
                        onClick={onPlay}
                        className="cyber-button-lg cyber-button-glow hero-play-btn"
                    >
                        <Gamepad2 size={24} />
                        <span>PLAY LEVEL {currentLevel}</span>
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

                    {onViewLevels && (
                        <button
                            type="button"
                            onClick={onViewLevels}
                            className="hero-view-levels-btn"
                        >
                            <span>⚡ Select Campaign Level (1-100)</span>
                            <ArrowRight size={14} />
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
