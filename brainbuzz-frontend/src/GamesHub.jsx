import './GamesHub.css'
import PlayerBackButton from './PlayerBackButton'

function GamesHub({ onBack, onSelectMode }) {
    const gameModes = [
        {
            id: 'iq',
            icon: '🧩',
            title: 'ClueShift IQ Challenge',
            description:
                'Test your logical thinking, pattern recognition, number series and problem-solving skills.',
            skills: ['Logic', 'Patterns', 'Reasoning'],
            difficulty: 'Adaptive Difficulty',
            color: 'iq',
        },
        {
            id: 'training',
            icon: '🧠',
            title: 'ClueShift Brain Training',
            description:
                'Improve memory, focus, reaction speed and spatial thinking through interactive exercises.',
            skills: ['Memory', 'Focus', 'Reaction'],
            difficulty: 'Skill Based Training',
            color: 'training',
        },
        {
            id: 'knowledge',
            icon: '🌍',
            title: 'ClueShift Knowledge Challenge',
            description:
                'Explore science, technology, history, geography, sports and general knowledge.',
            skills: ['Science', 'History', 'Technology'],
            difficulty: 'Multiple Categories',
            color: 'knowledge',
        },
        {
            id: 'duel',
            icon: '⚡',
            title: 'ClueShift 1v1 Duel',
            description:
                'Invite a rival, race through the same five questions and see who earns the most points.',
            skills: ['Head-to-head', 'Strategy', 'Speed'],
            difficulty: 'Invite-code Match',
            color: 'duel',
        },
    ]

    return (
        <main className="games-hub-container">
            <PlayerBackButton onClick={onBack} className="games-hub-back" />

            <section className="games-hub-heading">
                <span className="games-hub-eyebrow">
                    EXPLORE YOUR MIND
                </span>

                <h1>Welcome to ClueShift Games</h1>

                <p>
                    Challenge your thinking, train your brain and expand
                    your knowledge with interactive games.
                </p>
            </section>

            <section className="games-hub-grid">
                {gameModes.map((mode) => (
                    <article
                        className={`games-hub-card ${mode.color}`}
                        key={mode.id}
                    >
                        <div className="games-hub-icon">
                            {mode.icon}
                        </div>

                        <span className="games-hub-label">
                            CLUESHIFT GAME MODE
                        </span>

                        <h2>{mode.title}</h2>

                        <p className="games-hub-description">
                            {mode.description}
                        </p>

                        <div className="games-hub-skills">
                            {mode.skills.map((skill) => (
                                <span key={skill}>{skill}</span>
                            ))}
                        </div>

                        <div className="games-hub-card-footer">
                            <span>{mode.difficulty}</span>

                            <button
                                onClick={() => {
                                    onSelectMode(mode.id)
                                }}
                            >
                                Explore Game <span>→</span>
                            </button>
                        </div>
                    </article>
                ))}
            </section>
        </main>
    )
}

export default GamesHub
