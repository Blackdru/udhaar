export function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const notes = [
      { t: 0.00, dur: 0.18, freq: 587.33, gain: 0.35 }, // D5
      { t: 0.12, dur: 0.20, freq: 739.99, gain: 0.40 }, // F#5
      { t: 0.24, dur: 0.22, freq: 880.00, gain: 0.45 }, // A5
      { t: 0.36, dur: 0.95, freq: 1174.66, gain: 0.55 }, // D6 resolving bell chime
    ];

    const now = ctx.currentTime;
    notes.forEach(({ t, dur, freq, gain }) => {
      // Fundamental oscillator
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + t);

      // Bell envelope: fast attack, exponential decay
      gainNode.gain.setValueAtTime(0.0001, now + t);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + t + 0.006);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + t + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + dur);

      // Add harmonic sparkle for bell richness
      const harmonicOsc = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.setValueAtTime(freq * 2, now + t);

      harmonicGain.gain.setValueAtTime(0.0001, now + t);
      harmonicGain.gain.exponentialRampToValueAtTime(gain * 0.25, now + t + 0.006);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + t + (dur * 0.6));

      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(ctx.destination);

      harmonicOsc.start(now + t);
      harmonicOsc.stop(now + t + (dur * 0.6));
    });
  } catch (e) {
    console.error('Audio play error:', e);
  }
}
