// Web Audio API Synthesizer - 100% Standalone, Zero 404s, Zero External Dependencies

class SoundService {
    constructor() {
        this.ctx = null
        this.muted = (localStorage.getItem('clueshift_sfx_muted') ?? localStorage.getItem('brainbuzz_sfx_muted')) === 'true'
        this.bgmMuted = (localStorage.getItem('clueshift_bgm_muted') ?? localStorage.getItem('brainbuzz_bgm_muted')) !== 'false' // BGM off by default
        this.bgmOsc1 = null
        this.bgmOsc2 = null
        this.bgmGain = null
        this.bgmInterval = null
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext
            if (AudioContext) {
                this.ctx = new AudioContext()
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume()
        }
    }

    isMuted() {
        return this.muted
    }

    toggleSound() {
        this.muted = !this.muted
        localStorage.setItem('clueshift_sfx_muted', String(this.muted))
        if (!this.muted) {
            this.playClick()
        }
        return !this.muted
    }

    isBgmMuted() {
        return this.bgmMuted
    }

    // Modern Button Pop / Click
    playClick() {
        if (this.muted) return
        try {
            this.init()
            if (!this.ctx) return

            const osc = this.ctx.createOscillator()
            const gain = this.ctx.createGain()

            osc.type = 'sine'
            osc.frequency.setValueAtTime(600, this.ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04)

            gain.gain.setValueAtTime(0.15, this.ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04)

            osc.connect(gain)
            gain.connect(this.ctx.destination)

            osc.start()
            osc.stop(this.ctx.currentTime + 0.05)
        } catch {
            // Audio context safely ignored if blocked
        }
    }

    // Success / Correct Answer (Rising Chime)
    playCorrect() {
        if (this.muted) return
        try {
            this.init()
            if (!this.ctx) return

            const now = this.ctx.currentTime
            const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6

            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator()
                const gain = this.ctx.createGain()

                osc.type = 'triangle'
                osc.frequency.setValueAtTime(freq, now + idx * 0.08)

                gain.gain.setValueAtTime(0.18, now + idx * 0.08)
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3)

                osc.connect(gain)
                gain.connect(this.ctx.destination)

                osc.start(now + idx * 0.08)
                osc.stop(now + idx * 0.08 + 0.35)
            })
        } catch {
            // Ignore safely
        }
    }

    // Wrong Answer (Soft Buzzer)
    playWrong() {
        if (this.muted) return
        try {
            this.init()
            if (!this.ctx) return

            const now = this.ctx.currentTime
            const osc = this.ctx.createOscillator()
            const gain = this.ctx.createGain()

            osc.type = 'sawtooth'
            osc.frequency.setValueAtTime(180, now)
            osc.frequency.linearRampToValueAtTime(110, now + 0.28)

            gain.gain.setValueAtTime(0.14, now)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

            osc.connect(gain)
            gain.connect(this.ctx.destination)

            osc.start(now)
            osc.stop(now + 0.32)
        } catch {
            // Ignore safely
        }
    }

    // Victory Fanfare (Level Completed)
    playWin() {
        if (this.muted) return
        try {
            this.init()
            if (!this.ctx) return

            const now = this.ctx.currentTime
            const chord = [
                { f: 523.25, t: 0 },
                { f: 659.25, t: 0.1 },
                { f: 783.99, t: 0.2 },
                { f: 1046.5, t: 0.35 },
                { f: 1318.5, t: 0.55 },
            ]

            chord.forEach(({ f, t }) => {
                const osc = this.ctx.createOscillator()
                const gain = this.ctx.createGain()

                osc.type = 'sine'
                osc.frequency.setValueAtTime(f, now + t)

                gain.gain.setValueAtTime(0.2, now + t)
                gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.45)

                osc.connect(gain)
                gain.connect(this.ctx.destination)

                osc.start(now + t)
                osc.stop(now + t + 0.5)
            })
        } catch {
            // Ignore safely
        }
    }

    // Power-Up / Lifeline Used
    playPowerup() {
        if (this.muted) return
        try {
            this.init()
            if (!this.ctx) return

            const now = this.ctx.currentTime
            const osc = this.ctx.createOscillator()
            const gain = this.ctx.createGain()

            osc.type = 'sine'
            osc.frequency.setValueAtTime(300, now)
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25)

            gain.gain.setValueAtTime(0.18, now)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

            osc.connect(gain)
            gain.connect(this.ctx.destination)

            osc.start(now)
            osc.stop(now + 0.3)
        } catch {
            // Ignore safely
        }
    }

    // Wheel Spin Click
    playWheelSpin() {
        if (this.muted) return
        try {
            this.init()
            if (!this.ctx) return

            const osc = this.ctx.createOscillator()
            const gain = this.ctx.createGain()

            osc.type = 'triangle'
            osc.frequency.setValueAtTime(800, this.ctx.currentTime)

            gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02)

            osc.connect(gain)
            gain.connect(this.ctx.destination)

            osc.start()
            osc.stop(this.ctx.currentTime + 0.025)
        } catch {
            // Ignore safely
        }
    }

    // Countdown Urgency Tick
    playTick() {
        if (this.muted) return
        try {
            this.init()
            if (!this.ctx) return

            const osc = this.ctx.createOscillator()
            const gain = this.ctx.createGain()

            osc.type = 'sine'
            osc.frequency.setValueAtTime(900, this.ctx.currentTime)

            gain.gain.setValueAtTime(0.06, this.ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03)

            osc.connect(gain)
            gain.connect(this.ctx.destination)

            osc.start()
            osc.stop(this.ctx.currentTime + 0.035)
        } catch {
            // Ignore safely
        }
    }

    // Ambient Cyber Lo-Fi BGM Toggle
    toggleBgm() {
        this.bgmMuted = !this.bgmMuted
        localStorage.setItem('clueshift_bgm_muted', String(this.bgmMuted))

        if (this.bgmMuted) {
            this.stopBgm()
        } else {
            this.startBgm()
        }
        return !this.bgmMuted
    }

    startBgm() {
        if (this.bgmMuted) return
        try {
            this.init()
            if (!this.ctx) return

            if (this.bgmGain) return // already running

            this.bgmGain = this.ctx.createGain()
            this.bgmGain.gain.setValueAtTime(0.025, this.ctx.currentTime)
            this.bgmGain.connect(this.ctx.destination)

            const scale = [261.63, 293.66, 329.63, 392.00, 440.00] // C, D, E, G, A
            let noteIdx = 0

            this.bgmInterval = setInterval(() => {
                if (this.bgmMuted || !this.ctx) return
                const osc = this.ctx.createOscillator()
                const noteGain = this.ctx.createGain()

                osc.type = 'sine'
                const freq = scale[noteIdx % scale.length]
                noteIdx++

                osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
                noteGain.gain.setValueAtTime(0.03, this.ctx.currentTime)
                noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2)

                osc.connect(noteGain)
                noteGain.connect(this.bgmGain)

                osc.start()
                osc.stop(this.ctx.currentTime + 1.25)
            }, 800)
        } catch {
            // Ignore safely
        }
    }

    stopBgm() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval)
            this.bgmInterval = null
        }
        if (this.bgmGain) {
            try {
                this.bgmGain.disconnect()
            } catch {
                // Ignore
            }
            this.bgmGain = null
        }
    }
}

const soundService = new SoundService()
export default soundService
