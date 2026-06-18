class AudioManager {
    constructor() {
        this.audio = new Audio();
        this.audio.crossOrigin = "anonymous";
        this.audio.preload = "none";
        this.audio.autoplay = false;
        this.currentFeed = null;
        this.unlocked = false;
        this.listeners = {};
        this.initUserUnlock();

        // Bind audio events
        this.audio.onplay = () => this.emit('play');
        this.audio.onpause = () => this.emit('pause');
        this.audio.onerror = (e) => this.emit('error', e);
        this.audio.onended = () => this.emit('ended');
    }

    initUserUnlock() {
        const unlock = () => {
            try {
                const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
                const g = ctx.createGain();
                g.connect(ctx.destination);
                const o = ctx.createOscillator();
                o.connect(g); o.start(); o.stop(ctx.currentTime + 0.001);
                window.removeEventListener('click', unlock);
                this.unlocked = true;
            } catch { }
        };
        window.addEventListener('click', unlock, { once: true });
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(cb => cb(data));
    }

    validateUrl(url) {
        if (!url) return false;
        const allowedDomains = [
            'localhost',
            'bbcmedia.co.uk',
            'streamguys1.com',
            'mediahubaustralia.com',
            'akamaihd.net',
            'audiostream.io',
            'akamaized.net',
            'getaj.net',
            'france24.com',
            'somafm.com',
            'icecast',
            'shoutcast',
            'archive.org',
            'globaltuners.com'
        ];
        return allowedDomains.some(domain => url.includes(domain));
    }

    async play(feedUrl) {
        if (!feedUrl) return;

        // STRICT VALIDATION
        if (!this.validateUrl(feedUrl)) {
            console.warn('[AUDIO] Blocked unauthorized URL:', feedUrl);
            this.emit('error', new Error('Blocked unauthorized stream source'));
            return;
        }

        this.stop();
        this.audio.src = feedUrl;
        this.audio.load();
        try { await this.audio.play(); this.currentFeed = feedUrl; }
        catch (e) { console.error('audio play failed', e); this.emit('error', e); }
    }

    stop() {
        try {
            this.audio.pause();
            this.audio.removeAttribute('src');
            this.audio.load();
        } catch (e) { }
        this.currentFeed = null;
        this.emit('pause');
    }

    isPlaying() {
        return !this.audio.paused && !this.audio.ended && this.audio.currentTime > 0;
    }
}

export default new AudioManager();
