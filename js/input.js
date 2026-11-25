// Court Kings - touch joystick, buttons, keyboard, tap-to-pass
(function (CK) {
  const IN = CK.IN = { jx: 0, jy: 0, A: false, Ap: false, Ar: false, Bp: false, Cp: false, mv: null, tap: null };
  const MOVES = { KeyE: 'cross', KeyF: 'spin', KeyR: 'hesi', KeyQ: 'step', KeyC: 'btb' };
  const keys = new Set();
  let joy = { id: null, ox: 0, oy: 0 };
  IN.consume = () => { IN.Ap = IN.Ar = IN.Bp = IN.Cp = false; IN.mv = null; IN.tap = null; IN.pass = null; };
  IN.reset = () => { IN.jx = IN.jy = 0; IN.A = false; IN.consume(); keys.clear(); joy.id = null; const k = document.getElementById('joyKnob'); if (k) k.style.transform = ''; };

  function keyVec() {
    let x = 0, y = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1; if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) y -= 1; if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1;
    const l = Math.hypot(x, y); if (l) { IN.jx = x / l; IN.jy = y / l; } else if (joy.id == null) { IN.jx = 0; IN.jy = 0; }
  }
  const pressA = () => { if (!IN.A) { IN.A = true; IN.Ap = true; } };
  const relA = () => { if (IN.A) { IN.A = false; IN.Ar = true; } };
  addEventListener('keydown', e => {
    if (!CK.inGame || e.target.tagName === 'INPUT') return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code); keyVec();
    if (e.code === 'Space' || e.code === 'KeyJ') pressA();
    if (e.code === 'KeyK' || e.code === 'KeyX') IN.Bp = true;
    if (/^Digit[1-5]$/.test(e.code)) IN.pass = +e.code.slice(5) - 1;
    if (e.code === 'KeyZ') pressA();
    if (e.code === 'KeyL' || e.code === 'ShiftLeft') IN.Cp = true;
    if (MOVES[e.code]) IN.mv = MOVES[e.code];
    if (e.code === 'Escape' || e.code === 'KeyP') CK.M && CK.M.pause();
  });
  addEventListener('keyup', e => { keys.delete(e.code); keyVec(); if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyZ') relA(); });

  IN.bind = (root, canvas) => {
    const zone = root.querySelector('#joyZone'), base = root.querySelector('#joyBase'), knob = root.querySelector('#joyKnob');
    const R = 46;
    const move = (t) => {
      let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy; const l = Math.hypot(dx, dy);
      if (l > R) { dx = dx / l * R; dy = dy / l * R; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      if (l < 6) { IN.jx = IN.jy = 0; return; }
      // full speed from ~60% of the ring out so short thumbs still sprint
      const k = Math.min(1, Math.min(l, R) / (R * 0.6)) / Math.min(l, R);
      IN.jx = dx * k; IN.jy = dy * k;
    };
    zone.addEventListener('touchstart', e => {
      e.preventDefault(); CK.SFX.init();
      const t = e.changedTouches[0]; joy.id = t.identifier;
      const zr = zone.getBoundingClientRect();
      joy.ox = t.clientX; joy.oy = t.clientY;
      base.style.left = (t.clientX - zr.left) + 'px'; base.style.top = (t.clientY - zr.top) + 'px'; base.classList.add('on');
    }, { passive: false });
    zone.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === joy.id) move(t); }, { passive: false });
    const endT = e => { for (const t of e.changedTouches) if (t.identifier === joy.id) { joy.id = null; IN.jx = IN.jy = 0; knob.style.transform = ''; base.classList.remove('on'); } };
    zone.addEventListener('touchend', endT); zone.addEventListener('touchcancel', endT);
    // mouse fallback for the joystick
    let md = false;
    zone.addEventListener('mousedown', e => { md = true; joy.id = 'm'; joy.ox = e.clientX; joy.oy = e.clientY; const zr = zone.getBoundingClientRect(); base.style.left = (e.clientX - zr.left) + 'px'; base.style.top = (e.clientY - zr.top) + 'px'; base.classList.add('on'); });
    addEventListener('mousemove', e => { if (md) move(e); });
    addEventListener('mouseup', () => { if (md) { md = false; joy.id = null; IN.jx = IN.jy = 0; knob.style.transform = ''; base.classList.remove('on'); } });
    const btn = (id, down, up) => {
      const el = root.querySelector(id);
      el.addEventListener('touchstart', e => { e.preventDefault(); CK.SFX.init(); el.classList.add('dn'); down(); }, { passive: false });
      el.addEventListener('touchend', e => { e.preventDefault(); el.classList.remove('dn'); up && up(); }, { passive: false });
      el.addEventListener('touchcancel', e => { el.classList.remove('dn'); up && up(); });
      el.addEventListener('mousedown', e => { CK.SFX.init(); el.classList.add('dn'); down(); });
      el.addEventListener('mouseup', e => { el.classList.remove('dn'); up && up(); });
      el.addEventListener('mouseleave', e => { if (el.classList.contains('dn')) { el.classList.remove('dn'); up && up(); } });
    };
    btn('#btnA', pressA, relA);
    btn('#btnB', () => IN.Bp = true);
    btn('#btnC', () => IN.Cp = true);
    root.querySelectorAll('[data-mv]').forEach(el => btn('#' + el.id, () => IN.mv = el.dataset.mv));
    const tapAt = (cx, cy) => { const r = canvas.getBoundingClientRect(); IN.tap = { x: (cx - r.left) / r.width * CK.CT.W, y: (cy - r.top) / r.height * CK.CT.H }; };
    canvas.addEventListener('touchstart', e => { CK.SFX.init(); const t = e.changedTouches[0]; tapAt(t.clientX, t.clientY); }, { passive: true });
    canvas.addEventListener('mousedown', e => { CK.SFX.init(); tapAt(e.clientX, e.clientY); });
  };
})(window.CK);
