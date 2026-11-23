function PlayerBackButton({ onClick, disabled = false, className = '' }) {
    return (
        <button
            className={`player-back-button ${className}`.trim()}
            type="button"
            onClick={onClick}
            disabled={disabled}
        >
            <span aria-hidden="true">←</span> Back
        </button>
    )
}

export default PlayerBackButton
