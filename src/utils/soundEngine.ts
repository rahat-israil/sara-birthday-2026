/**
 * Romantic Web Audio Synthesizer Engine
 * Safe against missing AudioContext, autoplay restrictions, and mute states.
 */

interface MelodyStep {
  freq: number;
  durMs: number;
  bassFreq?: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private musicPlaying = false;
  private musicTimer: number | null = null;
  private birthdayPlaying = false;
  private birthdayTimer: number | null = null;
  private noteIndex = 0;
  private birthdayIndex = 0;

  // Gentle romantic F-major / D-minor music-box waltz arpeggio (Hz)
  private readonly melodyNotes = [
    349.23, 440.0, 523.25, 659.25, 523.25, 440.0, // Fmaj7
    293.66, 349.23, 440.0, 587.33, 440.0, 349.23, // Dm7
    233.08, 293.66, 349.23, 440.0, 349.23, 293.66, // Bbmaj7
    261.63, 329.63, 392.0, 523.25, 392.0, 329.63, // C6
  ];

  // Classic "Happy Birthday to You" in F Major (warm music-box / harp register)
  private readonly happyBirthdaySteps: MelodyStep[] = [
    // "Hap-py birth-day to you"
    { freq: 261.63, durMs: 360 },
    { freq: 261.63, durMs: 220 },
    { freq: 293.66, durMs: 560, bassFreq: 174.61 },
    { freq: 261.63, durMs: 560 },
    { freq: 349.23, durMs: 560 },
    { freq: 329.63, durMs: 1080, bassFreq: 130.81 },

    // "Hap-py birth-day to you"
    { freq: 261.63, durMs: 360 },
    { freq: 261.63, durMs: 220 },
    { freq: 293.66, durMs: 560, bassFreq: 130.81 },
    { freq: 261.63, durMs: 560 },
    { freq: 392.0, durMs: 560 },
    { freq: 349.23, durMs: 1080, bassFreq: 174.61 },

    // "Hap-py birth-day dear love"
    { freq: 261.63, durMs: 360 },
    { freq: 261.63, durMs: 220 },
    { freq: 523.25, durMs: 560, bassFreq: 174.61 },
    { freq: 440.0, durMs: 560 },
    { freq: 349.23, durMs: 560, bassFreq: 116.54 },
    { freq: 329.63, durMs: 560 },
    { freq: 293.66, durMs: 1020 },

    // "Hap-py birth-day to you"
    { freq: 466.16, durMs: 360 },
    { freq: 466.16, durMs: 220 },
    { freq: 440.0, durMs: 560, bassFreq: 174.61 },
    { freq: 349.23, durMs: 560 },
    { freq: 392.0, durMs: 560, bassFreq: 130.81 },
    { freq: 349.23, durMs: 1450, bassFreq: 174.61 },
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 0.85;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.24;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.72;
        this.sfxGain.connect(this.masterGain);
      }

      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public unlockAndStartMusic(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.birthdayPlaying && !this.musicPlaying && !this.muted) {
      this.startMusicLoop();
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.08);
    }
    if (!muted) {
      const ctx = this.ensureContext();
      if (ctx && !this.musicPlaying && !this.birthdayPlaying) {
        this.startMusicLoop();
      }
    }
  }

  public getMuted(): boolean {
    return this.muted;
  }

  private startMusicLoop(): void {
    if (this.musicPlaying || this.birthdayPlaying) return;
    this.musicPlaying = true;
    const stepMs = 460;

    const tick = () => {
      if (!this.musicPlaying || this.birthdayPlaying) return;
      if (!this.muted && this.ctx && this.musicGain && this.ctx.state === 'running') {
        const freq = this.melodyNotes[this.noteIndex % this.melodyNotes.length];
        this.playMusicBoxNote(freq, this.ctx.currentTime, 1.4, 0.14);
        if (this.noteIndex % 6 === 0) {
          this.playMusicBoxNote(freq * 0.5, this.ctx.currentTime, 2.4, 0.11);
        }
        this.noteIndex += 1;
      }
      this.musicTimer = window.setTimeout(tick, stepMs);
    };

    tick();
  }

  public stopMusicLoop(): void {
    this.musicPlaying = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    this.stopHappyBirthdaySong();
  }

  public playHappyBirthdaySong(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Pause background waltz so Happy Birthday plays cleanly without clashing
    this.musicPlaying = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }

    this.stopHappyBirthdaySong();
    this.birthdayPlaying = true;
    this.birthdayIndex = 0;

    const stepNext = () => {
      if (!this.birthdayPlaying) return;
      const step = this.happyBirthdaySteps[this.birthdayIndex % this.happyBirthdaySteps.length];
      if (!this.muted && this.ctx && this.musicGain && this.ctx.state === 'running') {
        const now = this.ctx.currentTime;
        const durSec = Math.max(0.55, step.durMs / 1000 + 0.35);
        this.playMusicBoxNote(step.freq, now, durSec, 0.24);
        // Gentle octave shimmer for celebratory sparkle
        this.playMusicBoxNote(step.freq * 2, now, durSec * 0.75, 0.07);
        if (step.bassFreq) {
          this.playMusicBoxNote(step.bassFreq, now, 1.6, 0.15);
        }
      }
      this.birthdayIndex += 1;
      this.birthdayTimer = window.setTimeout(stepNext, step.durMs);
    };

    stepNext();
  }

  public stopHappyBirthdaySong(): void {
    this.birthdayPlaying = false;
    if (this.birthdayTimer !== null) {
      clearTimeout(this.birthdayTimer);
      this.birthdayTimer = null;
    }
  }

  private playMusicBoxNote(freq: number, startTime: number, duration: number, volume: number): void {
    if (!this.ctx || !this.musicGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const overtone = this.ctx.createOscillator();
      const env = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2, startTime);

      const overtoneGain = this.ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.18, startTime);

      env.gain.setValueAtTime(0.0001, startTime);
      env.gain.linearRampToValueAtTime(volume, startTime + 0.035);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(env);
      overtone.connect(overtoneGain);
      overtoneGain.connect(env);
      env.connect(this.musicGain);

      osc.start(startTime);
      overtone.start(startTime);
      osc.stop(startTime + duration + 0.05);
      overtone.stop(startTime + duration + 0.05);
    } catch {
      // Ignore audio scheduling errors
    }
  }

  public playArrowRelease(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    try {
      const twang = ctx.createOscillator();
      const twangGain = ctx.createGain();
      twang.type = 'triangle';
      twang.frequency.setValueAtTime(210, now);
      twang.frequency.exponentialRampToValueAtTime(92, now + 0.19);
      twangGain.gain.setValueAtTime(0.24, now);
      twangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      twang.connect(twangGain);
      twangGain.connect(this.sfxGain);
      twang.start(now);
      twang.stop(now + 0.24);

      const bufSize = Math.floor(ctx.sampleRate * 0.22);
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.16);
      filter.Q.value = 1.6;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(now);
    } catch {
      // Ignore
    }
  }

  public playTargetMiss(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(58, now + 0.14);
      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Ignore
    }
  }

  public playBullseyeHit(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      try {
        const osc = this.createChimeOsc(ctx, freq, now + idx * 0.065, 1.15, 0.2);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 1.2);
      } catch {
        // Ignore
      }
    });
  }

  private createChimeOsc(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    dur: number,
    vol: number
  ): OscillatorNode {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0005, startTime + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    return osc;
  }

  public playCandleIgnite(index: number): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = scale[index % scale.length];

    try {
      const osc = this.createChimeOsc(ctx, freq, now, 0.75, 0.16);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch {
      // Ignore
    }
  }

  public playCelebrationFanfare(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const chord = [349.23, 440.0, 523.25, 659.25, 783.99, 1046.5, 1318.51];
    chord.forEach((freq, idx) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.075;
        osc.type = idx < 3 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.14, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0005, t + 1.8);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 1.85);
      } catch {
        // Ignore
      }
    });
  }
  public playFireworkLaunch(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    try {
      // Light airy ascending rocket whistle
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520 + Math.random() * 140, now);
      osc.frequency.exponentialRampToValueAtTime(1450 + Math.random() * 300, now + 0.38);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.032, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.42);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.44);
    } catch {
      // Ignore
    }
  }

  public playFireworkBurst(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    try {
      // Light distant low-end potaka thump
      const pop = ctx.createOscillator();
      const popGain = ctx.createGain();
      pop.type = 'sine';
      pop.frequency.setValueAtTime(135 + Math.random() * 35, now);
      pop.frequency.exponentialRampToValueAtTime(38, now + 0.22);
      popGain.gain.setValueAtTime(0.11, now);
      popGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.24);
      pop.connect(popGain);
      popGain.connect(this.sfxGain);
      pop.start(now);
      pop.stop(now + 0.25);

      // Soft airy Diwali crackle shimmer (3 tiny staggered crackle bursts)
      for (let c = 0; c < 3; c++) {
        const delay = c * 0.075;
        const bufSize = Math.floor(ctx.sampleRate * 0.22);
        const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          const env = Math.pow(1 - i / bufSize, 2.0);
          data[i] = (Math.random() * 2 - 1) * env * (Math.random() < 0.35 ? 1 : 0.35);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1700 + c * 650 + Math.random() * 450, now + delay);
        filter.Q.value = 1.3;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.065 - c * 0.012, now + delay);
        noiseGain.gain.exponentialRampToValueAtTime(0.0005, now + delay + 0.22);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(now + delay);
      }
    } catch {
      // Ignore
    }
  }
}

export const soundEngine = new SoundEngine();
