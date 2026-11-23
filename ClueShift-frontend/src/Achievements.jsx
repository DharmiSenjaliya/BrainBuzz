import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import api from './services/api'
import PlayerBackButton from './PlayerBackButton'
import './Achievements.css'

function Achievements({ onBack }) {
    const [achievements, setAchievements] = useState([])
    const [earnedCount, setEarnedCount] = useState(0)
    const [totalAchievements, setTotalAchievements] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const pageRef = useRef(null)

    useEffect(() => {
        fetchAchievements()
    }, [])

    useLayoutEffect(() => {
        if (loading || error || !pageRef.current) return undefined
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return undefined
        }

        let isActive = true
        let animationContext
        const tiltCleanups = []

        import('gsap')
            .then(({ gsap }) => {
                if (!isActive || !pageRef.current) return

                animationContext = gsap.context(() => {
                    gsap.timeline({ defaults: { ease: 'power3.out' } })
                        .fromTo(
                            '.achievements-hero-copy',
                            { autoAlpha: 0, y: 20 },
                            { autoAlpha: 1, y: 0, duration: 0.48 }
                        )
                        .fromTo(
                            '.achievements-hero-art',
                            { autoAlpha: 0, y: 20, rotationY: -10, scale: 0.93 },
                            {
                                autoAlpha: 1,
                                y: 0,
                                rotationY: 0,
                                scale: 1,
                                duration: 0.54,
                            },
                            '-=0.25'
                        )
                        .fromTo(
                            '.achievements-summary',
                            { autoAlpha: 0, y: 18 },
                            { autoAlpha: 1, y: 0, duration: 0.43 },
                            '-=0.2'
                        )
                        .fromTo(
                            '.achievement-card',
                            { autoAlpha: 0, y: 22, rotationX: -5, scale: 0.97 },
                            {
                                autoAlpha: 1,
                                y: 0,
                                rotationX: 0,
                                scale: 1,
                                stagger: 0.07,
                                duration: 0.43,
                            },
                            '-=0.18'
                        )

                    gsap.utils.toArray('.achievement-card.earned').forEach(card => {
                        const tilt = event => {
                            if (event.pointerType === 'touch') return

                            const bounds = card.getBoundingClientRect()
                            if (!bounds.width || !bounds.height) return

                            gsap.to(card, {
                                rotationY: ((event.clientX - bounds.left) / bounds.width - 0.5) * 5,
                                rotationX: ((event.clientY - bounds.top) / bounds.height - 0.5) * -5,
                                transformPerspective: 1000,
                                duration: 0.3,
                                ease: 'power2.out',
                                overwrite: 'auto',
                            })
                        }
                        const reset = () => gsap.to(card, {
                            rotationX: 0,
                            rotationY: 0,
                            duration: 0.35,
                            ease: 'power2.out',
                            overwrite: 'auto',
                        })

                        card.addEventListener('pointermove', tilt)
                        card.addEventListener('pointerleave', reset)
                        tiltCleanups.push(() => {
                            card.removeEventListener('pointermove', tilt)
                            card.removeEventListener('pointerleave', reset)
                        })
                    })
                }, pageRef)
            })
            .catch(animationError => {
                console.error('Unable to load achievements animation:', animationError)
            })

        return () => {
            isActive = false
            tiltCleanups.forEach(cleanup => cleanup())
            animationContext?.revert()
        }
    }, [loading, error, achievements.length])

    async function fetchAchievements() {
        try {
            setLoading(true)
            setError('')

            const token = localStorage.getItem('brainbuzz_token')
            const response = await api.get('/achievements', {
                headers: { Authorization: `Bearer ${token}` },
            })

            const data = response.data
            const achievementList = Array.isArray(data)
                ? data
                : data.achievements || data.data || []

            setAchievements(achievementList)
            setEarnedCount(
                data.earned_count ??
                achievementList.filter(item => item.earned).length
            )
            setTotalAchievements(
                data.total_achievements ?? achievementList.length
            )
        } catch (requestError) {
            console.error('Achievements error:', requestError)
            setError(
                requestError.response?.data?.message ||
                'Unable to load achievements. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }

    const completion = totalAchievements > 0
        ? Math.min((earnedCount / totalAchievements) * 100, 100)
        : 0
    const lockedCount = Math.max(totalAchievements - earnedCount, 0)

    return (
        <main className="achievements-page" ref={pageRef}>
            <header className="achievements-header">
                <PlayerBackButton onClick={onBack} />

                <div className="achievements-hero-copy">
                    <span className="achievements-eyebrow">
                        <span className="achievements-live-dot" />
                        YOUR CLUESHIFT TROPHY ROOM
                    </span>
                    <h1>Proof you <span>played to win.</span></h1>
                    <p>
                        Every badge marks a moment you got smarter, faster, or
                        better. Keep collecting.
                    </p>
                </div>

                <div className="achievements-hero-art" aria-hidden="true">
                    <div className="achievement-orbit achievement-orbit-one" />
                    <div className="achievement-orbit achievement-orbit-two" />
                    <div className="achievements-hero-trophy">🏆</div>
                    <span className="achievement-spark achievement-spark-one">✦</span>
                    <span className="achievement-spark achievement-spark-two">✧</span>
                    <span className="achievement-spark achievement-spark-three">✦</span>
                </div>
            </header>

            {loading ? (
                <div className="achievements-message achievements-loading" role="status">
                    <span className="achievements-message-icon" aria-hidden="true">🏆</span>
                    <h2>Opening your trophy room</h2>
                    <p>Getting your milestones ready...</p>
                    <span className="achievements-spinner" aria-hidden="true" />
                </div>
            ) : error ? (
                <div className="achievements-message achievements-error" role="alert">
                    <span className="achievements-message-icon" aria-hidden="true">⚠️</span>
                    <h2>Couldn’t load your achievements</h2>
                    <p>{error}</p>
                    <button type="button" onClick={fetchAchievements}>
                        Try again <span aria-hidden="true">↻</span>
                    </button>
                </div>
            ) : (
                <>
                    <section className="achievements-summary" aria-label="Achievement progress">
                        <div className="achievements-summary-main">
                            <div>
                                <span className="summary-label">COLLECTION PROGRESS</span>
                                <div className="summary-count">
                                    <strong>{earnedCount}</strong>
                                    <span>/ {totalAchievements} badges</span>
                                </div>
                            </div>
                            <div className="summary-percent">
                                <strong>{Math.round(completion)}%</strong>
                                <span>COMPLETE</span>
                            </div>
                        </div>
                        <div
                            className="summary-progress-track"
                            role="progressbar"
                            aria-label="Achievement collection progress"
                            aria-valuenow={Math.round(completion)}
                            aria-valuemin="0"
                            aria-valuemax="100"
                        >
                            <div
                                className="summary-progress-fill"
                                style={{ width: `${completion}%` }}
                            />
                        </div>
                        <div className="achievements-summary-footer">
                            <span><i className="summary-earned-dot" /> {earnedCount} earned</span>
                            <span><i className="summary-locked-dot" /> {lockedCount} still to unlock</span>
                        </div>
                    </section>

                    {achievements.length === 0 ? (
                        <div className="achievements-message achievements-empty">
                            <span className="achievements-message-icon" aria-hidden="true">🎮</span>
                            <span className="achievements-eyebrow">A FRESH START</span>
                            <h2>Your trophy room is waiting</h2>
                            <p>Play your first game and start earning badges for your best moments.</p>
                            <PlayerBackButton onClick={onBack} />
                        </div>
                    ) : (
                        <section className="achievements-collection" aria-labelledby="achievement-collection-heading">
                            <div className="achievements-section-heading">
                                <div>
                                    <span className="achievements-section-kicker">THE COLLECTION</span>
                                    <h2 id="achievement-collection-heading">Badges & milestones</h2>
                                </div>
                                <span className="achievements-total-chip">
                                    {totalAchievements} TOTAL BADGES
                                </span>
                            </div>

                            <div className="achievements-grid">
                                {achievements.map((item, index) => {
                                    const earned =
                                        item.earned ??
                                        item.is_earned ??
                                        item.unlocked ??
                                        false

                                    const target = Math.max(Number(item.target || 1), 1)
                                    const progress = Math.min(
                                        Math.max(Number(item.progress || 0), 0),
                                        target
                                    )
                                    const percentage = Math.min((progress / target) * 100, 100)

                                    return (
                                        <article
                                            className={`achievement-card ${earned ? 'earned' : 'locked'}`}
                                            key={item.id || index}
                                        >
                                            <div className="achievement-card-topline">
                                                <span className="achievement-rarity">
                                                    {earned ? 'UNLOCKED' : 'IN PROGRESS'}
                                                </span>
                                                <span className="achievement-status">
                                                    {earned ? '✓ Earned' : '🔒 Locked'}
                                                </span>
                                            </div>

                                            <div className="achievement-icon">
                                                {item.icon || item.emoji || '🏆'}
                                            </div>

                                            <h3>{item.name || item.title || 'Achievement'}</h3>
                                            <p>
                                                {item.description ||
                                                    'Keep playing to achieve this milestone.'}
                                            </p>

                                            <div className="achievement-progress-info">
                                                <span>{earned ? 'Milestone reached' : 'Progress'}</span>
                                                <strong>{progress}<i> / {target}</i></strong>
                                            </div>
                                            <div
                                                className="achievement-progress-track"
                                                role="progressbar"
                                                aria-label={`${item.name || item.title || 'Achievement'} progress`}
                                                aria-valuenow={Math.round(percentage)}
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            >
                                                <div
                                                    className="achievement-progress-fill"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="achievement-card-glow" aria-hidden="true" />
                                        </article>
                                    )
                                })}
                            </div>
                        </section>
                    )}
                </>
            )}
        </main>
    )
}

export default Achievements
