// Court Kings - synthesized sound (no files): ball, rim, net, crowd, whistle, horn
(function (CK) {
  const A = CK.SFX = {}; let ac = null, master = null, crowdG = null, noiseBuf = null;
  A.on = true;
  A.init = () => {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.04 * w) / 1.04; d[i] = w * 0.5 + last * 3; }
  };
  const now = () => ac.currentTime;
  function noise(dur, type, freq, q, vol, attack, when) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    const g = ac.createGain(); const t = (when || now());
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    return f;
  }
  function tone(freq, dur, type, vol, slide, when) {
    const o = ac.createOscillator(), g = ac.createGain(), t = when || now();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  const P = {
    bounce: () => { tone(120, 0.09, 'sine', 0.35, 55); noise(0.05, 'lowpass', 500, 1, 0.12); },
    pass: () => noise(0.12, 'bandpass', 900, 0.8, 0.12, 0.03),
    catch: () => { tone(160, 0.06, 'sine', 0.25, 80); noise(0.04, 'lowpass', 800, 1, 0.12); },
    dribble: () => { noise(0.14, 'bandpass', 2400, 2, 0.08, 0.02); tone(260, 0.05, 'triangle', 0.08, 120); },
    gather: () => noise(0.08, 'highpass', 3000, 1, 0.05),
    shoot: () => noise(0.18, 'bandpass', 1200, 1, 0.08, 0.04),
    swish: () => { noise(0.35, 'highpass', 4200, 0.7, 0.22, 0.02); noise(0.25, 'bandpass', 2000, 2, 0.08, 0.05); },
    rim: () => { tone(420, 0.25, 'triangle', 0.18, 380); tone(1130, 0.18, 'square', 0.04, 1000); noise(0.06, 'bandpass', 3000, 3, 0.15); },
    dunk: () => { tone(90, 0.3, 'sine', 0.6, 40); tone(420, 0.35, 'triangle', 0.18, 300); noise(0.3, 'lowpass', 1500, 1, 0.3); A.cheer(1.4); },
    block: () => { tone(150, 0.12, 'sine', 0.5, 60); noise(0.2, 'lowpass', 900, 1, 0.3); A.cheer(0.9); },
    steal: () => { noise(0.2, 'bandpass', 1500, 1.5, 0.15, 0.05); A.cheer(0.6); },
    ankles: () => { tone(200, 0.15, 'sine', 0.3, 70); A.cheer(1.2); },
    jump: () => noise(0.07, 'highpass', 2500, 1, 0.04),
    whistle: () => { const t = now(); [2850, 3020].forEach(f => { const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(); o.frequency.value = f; lfo.frequency.value = 28; lg.gain.value = 60; lfo.connect(lg); lg.connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.02); g.gain.setValueAtTime(0.06, t + 0.32); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(g); g.connect(master); o.start(t); lfo.start(t); o.stop(t + 0.45); lfo.stop(t + 0.45); }); },
    buzzer: () => { tone(185, 0.9, 'sawtooth', 0.09); tone(188, 0.9, 'square', 0.05); },
    cheer: () => A.cheer(1),
    click: () => tone(700, 0.04, 'square', 0.04, 500)
  };
  A.cheer = (amt) => { if (!ac || !A.on) return; const f = noise(1.2 + amt, 'bandpass', 1100, 0.6, 0.12 * amt, 0.25); };
  A.play = k => { if (!A.on || !ac || !P[k]) return; try { P[k](); } catch (e) { } };
  // low arena murmur while a game is on
  A.crowd = on => {
    if (!ac) return;
    if (on && !crowdG && A.on) { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.4; crowdG = ac.createGain(); crowdG.gain.value = 0.035; s.connect(f); f.connect(crowdG); crowdG.connect(master); s.start(); crowdG.src = s; }
    if (!on && crowdG) { try { crowdG.src.stop(); } catch (e) { } crowdG.disconnect(); crowdG = null; }
  };
})(window.CK);
