import { useLayoutEffect, useRef } from 'react'
import './HowToPlay.css'
import PlayerBackButton from './PlayerBackButton'

const steps = [
    {
        number: '01',
        icon: '🗺️',
        title: 'Choose your level',
        description: 'Begin at Level 1. Beat a level to unlock the next challenge and keep your streak alive.',
        detail: 'PICK YOUR PATH',
        accent: 'violet',
    },
    {
        number: '02',
        icon: '🔍',
        title: 'Read the clues',
        description: 'Study each clue, connect the hints, and figure out which answer fits the question.',
        detail: 'THINK IT THROUGH',
        accent: 'cyan',
    },
    {
        number: '03',
        icon: '💛',
        title: 'Use your attempts',
        description: 'You get 3 attempts for every question. Make each guess count and learn as you go.',
        detail: '3 TRIES PER QUESTION',
        accent: 'pink',
    },
    {
        number: '04',
        icon: '💡',
        title: 'Call in a hint',
        description: 'You have 3 hints per level. Save one for a tricky question or use it when you need a nudge.',
        detail: '3 HINTS PER LEVEL',
        accent: 'orange',
    },
    {
        number: '05',
        icon: '⭐',
        title: 'Collect your stars',
        description: 'Correct answers earn points and stars. Keep sharpening your score with every question.',
        detail: 'SCORE BIG',
        accent: 'yellow',
    },
    {
        number: '06',
        icon: '🏆',
        title: 'Unlock the next level',
        description: 'Get at least 3 out of 5 questions right to pass and open up your next challenge.',
        detail: '3 OF 5 TO PASS',
        accent: 'green',
    },
]

function HowToPlay({ onBack, onStart }) {
    const pageRef = useRef(null)

    useLayoutEffect(() => {
        if (!pageRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
                            '.how-hero-copy',
                            { autoAlpha: 0, y: 22 },
                            { autoAlpha: 1, y: 0, duration: 0.5 }
                        )
                        .fromTo(
                            '.how-hero-console',
                            { autoAlpha: 0, y: 18, rotationY: -10, scale: 0.94 },
                            {
                                autoAlpha: 1,
                                y: 0,
                                rotationY: 0,
                                scale: 1,
                                duration: 0.6,
                            },
                            '-=0.25'
                        )
                        .fromTo(
                            '.how-card',
                            { autoAlpha: 0, y: 22, rotationX: -5 },
                            {
                                autoAlpha: 1,
                                y: 0,
                                rotationX: 0,
                                stagger: 0.08,
                                duration: 0.45,
                            },
                            '-=0.24'
                        )
                        .fromTo(
                            '.how-start-section',
                            { autoAlpha: 0, y: 18 },
                            { autoAlpha: 1, y: 0, duration: 0.42 },
                            '-=0.16'
                        )

                    gsap.utils.toArray('.how-card').forEach(card => {
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
                console.error('Unable to load How to Play animation:', animationError)
            })

        return () => {
            isActive = false
            tiltCleanups.forEach(cleanup => cleanup())
            animationContext?.revert()
        }
    }, [])

    return (
        <main className="how-to-play-page" ref={pageRef}>
            <header className="how-to-play-header">
                <PlayerBackButton onClick={onBack} />

                <div className="how-hero-copy">
                    <span className="how-eyebrow"><span /> THE PLAYER'S FIELD GUIDE</span>
                    <h1>Play smart. <span>Level up.</span></h1>
                    <p>Six quick moves to turn your next BrainBuzz session into a winning streak.</p>
                </div>

                <div className="how-hero-console" aria-label="Game stats: 3 tries, 3 hints, earn stars">
                    <div className="how-console-glow" />
                    <span className="how-console-kicker">YOUR NEXT RUN</span>
                    <div className="how-console-title">
                        <span className="how-console-icon" aria-hidden="true">🎮</span>
                        <span>READY, PLAYER?</span>
                    </div>
                    <div className="how-console-stats">
                        <div><strong>3</strong><span>TRIES</span></div>
                        <i />
                        <div><strong>3</strong><span>HINTS</span></div>
                        <i />
                        <div><strong>★</strong><span>REWARDS</span></div>
                    </div>
                    <span className="how-console-status"><span /> GAME GUIDE LOADED</span>
                </div>
            </header>

            <section className="how-steps-section" aria-labelledby="how-steps-heading">
                <div className="how-section-heading">
                    <div>
                        <span className="how-section-kicker">THE QUICK START</span>
                        <h2 id="how-steps-heading">Your winning playbook</h2>
                    </div>
                    <span className="how-step-count">06 <i>/</i> STEPS</span>
                </div>

                <div className="how-to-play-content">
                    {steps.map(step => (
                        <article
                            className={`how-card how-card-${step.accent}`}
                            key={step.number}
                        >
                            <div className="how-card-topline">
                                <span className="how-step-number">{step.number}</span>
                                <span className="how-card-icon" aria-hidden="true">{step.icon}</span>
                            </div>
                            <span className="how-card-detail">{step.detail}</span>
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>
                            <span className="how-card-arrow" aria-hidden="true">↗</span>
                        </article>
                    ))}
                </div>
            </section>

            <section className="how-start-section">
                <div className="how-cta-orbit" aria-hidden="true"><span>✦</span></div>
                <div className="how-cta-copy">
                    <span className="how-section-kicker">ALL SYSTEMS GO</span>
                    <h2>Ready to make your first move?</h2>
                    <p>Your next high score is only one game away. Jump in and put the playbook to work.</p>
                </div>
                <button className="how-start-btn" type="button" onClick={onStart}>
                    Start playing <span aria-hidden="true">↗</span>
                </button>
            </section>
        </main>
    )
}

export default HowToPlay
