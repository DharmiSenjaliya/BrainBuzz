import React, { useState, useEffect } from 'react'
import './AdminAnalyticsView.css'
import api from './services/api'

export default function AdminAnalyticsView() {
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('brainbuzz_token')
            const response = await api.get('/admin/analytics', {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.data.success) {
                setAnalytics(response.data)
            }
        } catch (err) {
            console.error('Analytics Fetch Error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnalytics()
    }, [])

    if (loading) {
        return <div className="analytics-loading">Loading analytics & charts...</div>
    }

    if (!analytics) return null

    const { kpi, weekly_activity = [], category_distribution = [], recent_games = [] } = analytics

    // Find max count for SVG bar chart scaling
    const maxDayCount = Math.max(5, ...weekly_activity.map((d) => d.count))

    return (
        <div className="admin-analytics-view">
            {/* Top KPI Metric Cards */}
            <div className="analytics-kpi-grid">
                <div className="kpi-card purple">
                    <span className="kpi-icon">👥</span>
                    <div className="kpi-info">
                        <span className="kpi-label">Active Players</span>
                        <strong className="kpi-value">{kpi.active_players} / {kpi.total_players}</strong>
                    </div>
                </div>

                <div className="kpi-card blue">
                    <span className="kpi-icon">🎮</span>
                    <div className="kpi-info">
                        <span className="kpi-label">Games Played</span>
                        <strong className="kpi-value">{kpi.total_games_played}</strong>
                    </div>
                </div>

                <div className="kpi-card green">
                    <span className="kpi-icon">🎯</span>
                    <div className="kpi-info">
                        <span className="kpi-label">Overall Pass Rate</span>
                        <strong className="kpi-value">{kpi.pass_rate}%</strong>
                    </div>
                </div>

                <div className="kpi-card orange">
                    <span className="kpi-icon">📚</span>
                    <div className="kpi-info">
                        <span className="kpi-label">Questions in DB</span>
                        <strong className="kpi-value">{kpi.total_questions}</strong>
                    </div>
                </div>
            </div>

            {/* Visual Charts Grid */}
            <div className="analytics-charts-grid">
                {/* 7-Day Activity Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>📊 Player Activity</h3>
                        <span className="chart-subtitle">Last 7 days game sessions</span>
                    </div>

                    <div className="svg-chart-container">
                        <svg className="activity-svg" viewBox="0 0 350 160">
                            {/* Grid lines */}
                            <line x1="30" y1="20" x2="330" y2="20" stroke="rgba(255,255,255,0.06)" />
                            <line x1="30" y1="60" x2="330" y2="60" stroke="rgba(255,255,255,0.06)" />
                            <line x1="30" y1="100" x2="330" y2="100" stroke="rgba(255,255,255,0.06)" />
                            <line x1="30" y1="130" x2="330" y2="130" stroke="rgba(255,255,255,0.15)" />

                            {weekly_activity.map((item, idx) => {
                                const barWidth = 26
                                const spacing = 42
                                const x = 45 + idx * spacing
                                const barHeight = Math.max(6, (item.count / maxDayCount) * 100)
                                const y = 130 - barHeight

                                return (
                                    <g key={item.date} className="svg-bar-group">
                                        <rect
                                            x={x}
                                            y={y}
                                            width={barWidth}
                                            height={barHeight}
                                            rx="4"
                                            className="activity-bar"
                                        />
                                        <text
                                            x={x + barWidth / 2}
                                            y={y - 5}
                                            textAnchor="middle"
                                            className="bar-value-text"
                                        >
                                            {item.count}
                                        </text>
                                        <text
                                            x={x + barWidth / 2}
                                            y={148}
                                            textAnchor="middle"
                                            className="bar-label-text"
                                        >
                                            {item.day}
                                        </text>
                                    </g>
                                )
                            })}
                        </svg>
                    </div>
                </div>

                {/* Category Popularity Bar */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>📂 Questions by Category</h3>
                        <span className="chart-subtitle">Category content breakdown</span>
                    </div>

                    <div className="category-bars-list">
                        {category_distribution.length === 0 ? (
                            <p className="empty-chart-note">No categories found.</p>
                        ) : (
                            category_distribution.map((cat, idx) => {
                                const maxCat = Math.max(1, ...category_distribution.map((c) => c.count))
                                const pct = Math.round((cat.count / maxCat) * 100)
                                const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
                                const color = colors[idx % colors.length]

                                return (
                                    <div key={idx} className="cat-bar-item">
                                        <div className="cat-bar-labels">
                                            <span className="cat-name">{cat.name}</span>
                                            <span className="cat-count">{cat.count} Questions</span>
                                        </div>
                                        <div className="cat-progress-track">
                                            <div
                                                className="cat-progress-fill"
                                                style={{ width: `${pct}%`, background: color }}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Match Outcomes */}
            <div className="chart-card recent-games-card">
                <div className="chart-header">
                    <h3>⚡ Live Match Stream</h3>
                    <span className="chart-subtitle">Recently completed games</span>
                </div>

                <div className="recent-table-wrap">
                    <table className="recent-games-table">
                        <thead>
                            <tr>
                                <th>Player</th>
                                <th>Level</th>
                                <th>Score</th>
                                <th>Result</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent_games.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty-chart-note">No matches played yet.</td>
                                </tr>
                            ) : (
                                recent_games.map((g) => (
                                    <tr key={g.id}>
                                        <td>
                                            <strong>{g.user?.name || 'Player'}</strong>
                                            <span className="user-email-sub">{g.user?.email}</span>
                                        </td>
                                        <td><span className="level-badge">Level {g.level}</span></td>
                                        <td><strong>{g.score} pts</strong></td>
                                        <td>
                                            <span className={`result-tag ${g.passed ? 'passed' : 'failed'}`}>
                                                {g.passed ? '✓ PASSED' : '✕ FAILED'}
                                            </span>
                                        </td>
                                        <td className="time-col">{new Date(g.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
