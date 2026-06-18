export class AudioEngine {
    private ctx: AudioContext;
    private masterGain: GainNode;
    private analyser: AnalyserNode;
    private noiseNode: AudioBufferSourceNode | null = null;
    private audioElement: HTMLAudioElement | null = null;
    private isPlaying: boolean = false;

    constructor() {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.analyser = this.ctx.createAnalyser();

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        this.analyser.fftSize = 256;
        this.masterGain.gain.value = 0.5;
    }

    async initialize() {
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    getAnalyser() {
        return this.analyser;
    }

    setMasterVolume(value: number) {
        this.masterGain.gain.value = value;
        if (this.audioElement) {
            this.audioElement.volume = value;
        }
    }

    stopAll() {
        this.isPlaying = false;

        if (this.noiseNode) {
            try {
                this.noiseNode.stop();
                this.noiseNode.disconnect();
            } catch { /* ignore */ }
            this.noiseNode = null;
        }

        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
            this.audioElement = null;
        }
    }

    startStatic() {
        this.stopAll();

        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = buffer;
        this.noiseNode.loop = true;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.value = 0.05;

        this.noiseNode.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        this.noiseNode.start();
    }

    playStream(url: string) {
        this.stopAll();
        this.isPlaying = true;

        // Create audio element with CORS bypass
        this.audioElement = new Audio(url);
        this.audioElement.crossOrigin = "anonymous";
        this.audioElement.volume = 0; // Start at 0 for fade-in

        // Play directly
        this.audioElement.play()
            .then(() => {
                console.log('✅ Playing:', url);
                // Fade in over 1 second
                let volume = 0;
                const fadeInterval = setInterval(() => {
                    if (volume < this.masterGain.gain.value) {
                        volume += 0.05;
                        if (this.audioElement) {
                            this.audioElement.volume = Math.min(volume, this.masterGain.gain.value);
                        }
                    } else {
                        clearInterval(fadeInterval);
                    }
                }, 50);
            })
            .catch(e => {
                console.error('❌ Failed:', e);
                this.isPlaying = false;
            });
    }

    public isPlayingStream(): boolean {
        return this.isPlaying;
    }

    public pause() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.isPlaying = false;
        }
    }

    public resume() {
        if (this.audioElement) {
            this.audioElement.play();
            this.isPlaying = true;
        }
    }

    private noiseNode: AudioBufferSourceNode | null = null;
    private noiseGain: GainNode | null = null;

    public startNoise() {
        if (!this.context) return;
        this.stopNoise();

        const bufferSize = this.context.sampleRate * 2; // 2 seconds buffer
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.noiseNode = this.context.createBufferSource();
        this.noiseNode.buffer = buffer;
        this.noiseNode.loop = true;

        this.noiseGain = this.context.createGain();
        this.noiseGain.gain.value = 0.15; // Lower volume for noise

        this.noiseNode.connect(this.noiseGain);
        this.noiseGain.connect(this.masterGain);
        this.noiseNode.start();
    }

    public stopNoise() {
        if (this.noiseNode) {
            this.noiseNode.stop();
            this.noiseNode.disconnect();
            this.noiseNode = null;
        }
        if (this.noiseGain) {
            this.noiseGain.disconnect();
            this.noiseGain = null;
        }
    }
}
