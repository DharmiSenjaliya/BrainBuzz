
import './HowToPlay.css'

function HowToPlay({ onBack, onStart }) {
    return (
        <div className="how-to-play-page">
            <div className="how-to-play-header">
                <button className="how-back-btn" onClick={onBack}>
                    ← Back
                </button>

                <h1>🎮 How to Play BrainBuzz</h1>
                <p>Learn the rules and become a BrainBuzz champion!</p>
            </div>

            <div className="how-to-play-content">
                <div className="how-card">
                    <span className="how-icon">🧠</span>
                    <h3>1. Choose a Level</h3>
                    <p>
                        Start from Level 1. Complete levels to unlock
                        the next challenges.
                    </p>
                </div>

                <div className="how-card">
                    <span className="how-icon">🔍</span>
                    <h3>2. Read the Clues</h3>
                    <p>
                        Each question gives you clues. Read them carefully
                        and guess the correct answer.
                    </p>
                </div>

                <div className="how-card">
                    <span className="how-icon">❤️</span>
                    <h3>3. Use Your Attempts</h3>
                    <p>
                        You get 3 attempts for every question. Try to
                        find the correct answer.
                    </p>
                </div>

                <div className="how-card">
                    <span className="how-icon">💡</span>
                    <h3>4. Use Hints</h3>
                    <p>
                        You get 3 hints per level. Use them wisely
                        whenever you need help.
                    </p>
                </div>

                <div className="how-card">
                    <span className="how-icon">⭐</span>
                    <h3>5. Earn Stars</h3>
                    <p>
                        Answer questions correctly to earn points
                        and stars.
                    </p>
                </div>

                <div className="how-card">
                    <span className="how-icon">🏆</span>
                    <h3>6. Unlock New Levels</h3>
                    <p>
                        Answer at least 3 out of 5 questions correctly
                        to pass a level and unlock the next one.
                    </p>
                </div>
            </div>

            <div className="how-start-section">
                <h2>Ready to Challenge Your Brain?</h2>
                <p>Let's start your BrainBuzz journey!</p>

                <button className="how-start-btn" onClick={onStart}>
                    Start Playing 🚀
                </button>
            </div>
        </div>
    )
}

export default HowToPlay
