import React, { useState, useEffect } from 'react'
import './AdminSettingsTab.css'
import api from './services/api'

export default function AdminSettingsTab() {
    const [settings, setSettings] = useState({
        app_name: 'ClueShift Cyber Puzzle',
        currency_name: 'Coins',
        default_timer_seconds: 30,
        points_per_correct: 10,
        hints_per_game: 3,
        welcome_bonus_coins: 100,
        maintenance_mode: false,
        ads_enabled: true,
        adsense_publisher_id: 'ca-pub-0000000000000000',
        contact_email: 'support@clueshift.game',
    })

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('brainbuzz_token')
            const response = await api.get('/admin/settings', {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.data.success && response.data.settings) {
                setSettings(response.data.settings)
            }
        } catch (err) {
            console.error('Fetch Settings Error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const handleChange = (field, value) => {
        setSettings((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMessage('')
        setError('')

        try {
            setSaving(true)
            const token = localStorage.getItem('brainbuzz_token')
            const response = await api.post('/admin/settings', settings, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.data.success) {
                setMessage('✅ Platform settings saved successfully!')
                setTimeout(() => setMessage(''), 3000)
            }
        } catch (err) {
            console.error('Save Settings Error:', err)
            setError(err.response?.data?.message || 'Failed to update settings.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="settings-loading">Loading system configuration...</div>
    }

    return (
        <div className="admin-settings-tab">
            <div className="admin-page-heading">
                <div>
                    <span className="admin-eyebrow">SYSTEM CONFIGURATION</span>
                    <h1>Platform Settings</h1>
                    <p>Configure app branding, gameplay timers, and ads.</p>
                </div>
            </div>

            {message && <div className="admin-success-box">{message}</div>}
            {error && <div className="admin-error-box">{error}</div>}

            <form onSubmit={handleSubmit} className="settings-form">
                {/* Branding & App Info */}
                <div className="settings-section-card">
                    <h3>🏷️ Brand & Identity</h3>
                    <div className="settings-grid">
                        <div className="form-group">
                            <label>Application Name</label>
                            <input
                                type="text"
                                value={settings.app_name}
                                onChange={(e) => handleChange('app_name', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>In-Game Currency Name</label>
                            <input
                                type="text"
                                value={settings.currency_name}
                                onChange={(e) => handleChange('currency_name', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Support Email</label>
                            <input
                                type="email"
                                value={settings.contact_email}
                                onChange={(e) => handleChange('contact_email', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Gameplay Rules */}
                <div className="settings-section-card">
                    <h3>🎮 Gameplay & Rewards</h3>
                    <div className="settings-grid">
                        <div className="form-group">
                            <label>Default Timer (Seconds per Question)</label>
                            <input
                                type="number"
                                min={10}
                                max={120}
                                value={settings.default_timer_seconds}
                                onChange={(e) => handleChange('default_timer_seconds', Number(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Points Per Correct Answer</label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={settings.points_per_correct}
                                onChange={(e) => handleChange('points_per_correct', Number(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Free Hints Per Game Session</label>
                            <input
                                type="number"
                                min={0}
                                max={10}
                                value={settings.hints_per_game}
                                onChange={(e) => handleChange('hints_per_game', Number(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label>New Player Welcome Bonus Coins</label>
                            <input
                                type="number"
                                min={0}
                                max={5000}
                                value={settings.welcome_bonus_coins}
                                onChange={(e) => handleChange('welcome_bonus_coins', Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Ads Configuration */}
                <div className="settings-section-card">
                    <h3>💰 Ads Configuration</h3>
                    <div className="settings-grid">
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.ads_enabled}
                                    onChange={(e) => handleChange('ads_enabled', e.target.checked)}
                                />
                                Enable Banner & Rewarded Video Ads
                            </label>
                        </div>
                        <div className="form-group">
                            <label>AdSense Publisher ID</label>
                            <input
                                type="text"
                                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                                value={settings.adsense_publisher_id}
                                onChange={(e) => handleChange('adsense_publisher_id', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Maintenance Mode */}
                <div className="settings-section-card">
                    <h3>🛡️ Maintenance Mode</h3>
                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.maintenance_mode}
                                onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                            />
                            <strong>Enable Maintenance Mode</strong> (Restricts non-admin access while updating content)
                        </label>
                    </div>
                </div>

                <div className="settings-actions">
                    <button type="submit" className="admin-confirm-btn" disabled={saving}>
                        {saving ? 'Saving Settings...' : '💾 Save All Settings'}
                    </button>
                </div>
            </form>
        </div>
    )
}
