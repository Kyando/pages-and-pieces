/** Tiny synthesized sound effects — no audio files needed while prototyping. */
export class Sfx {
  enabled: boolean;
  private ctx: AudioContext | null = null;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  /** A word found: a paper rustle, then one soft rising note per letter as its tiles turn. */
  piece(length: number, stagger: number): void {
    this.rustle();
    const scale = [659, 740, 831, 988, 1109, 1319, 1480, 1661, 1976, 2217, 2637];
    for (let i = 0; i < length; i++) this.tone(scale[Math.min(i, scale.length - 1)], 0.16, 'sine', 0.045, 0.05 + (i * stagger) / 1000);
  }

  /** A sheet of paper sliding over the desk. */
  paper(): void {
    this.rustle(0.4, 1500, 0.09);
  }

  /** The seal pressed into wax: a soft, low thump. */
  seal(): void {
    this.tone(150, 0.18, 'sine', 0.16, 0, 70);
    this.rustle(0.08, 900, 0.06);
  }

  /** Paper: a short burst of filtered noise. */
  private rustle(dur = 0.22, freq = 2600, gain = 0.12): void {
    if (!this.enabled) return;
    try {
      this.ctx ??= new AudioContext();
      const ctx = this.ctx;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = freq;
      band.Q.value = 0.7;
      const amp = ctx.createGain();
      amp.gain.value = gain;
      src.connect(band).connect(amp).connect(ctx.destination);
      src.start();
    } catch {
      // Audio unavailable; stay silent.
    }
  }

  pick(): void {
    this.tone(620, 0.07, 'triangle', 0.07, 0, 760);
  }

  /** One more letter in the trace: climbs a pentatonic scale. */
  tick(length: number): void {
    const scale = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];
    this.tone(scale[Math.min(length - 1, scale.length - 1)], 0.06, 'triangle', 0.06);
  }

  found(): void {
    this.tone(659, 0.12, 'triangle', 0.08);
    this.tone(988, 0.16, 'triangle', 0.07, 0.07);
  }


  nope(): void {
    this.tone(210, 0.16, 'square', 0.035, 0, 150);
  }

  win(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.08, i * 0.085));
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, slideTo?: number): void {
    if (!this.enabled) return;
    try {
      this.ctx ??= new AudioContext();
      const ctx = this.ctx;
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(gain, t + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(amp).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      // Audio unavailable; stay silent.
    }
  }
}
