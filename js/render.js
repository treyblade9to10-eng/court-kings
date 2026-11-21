// Court Kings - landscape pixel renderer (side view half court, hoop on the right)
(function (CK) {
  const U = CK.U, E = CK.CT, R = CK.RD = {};
  const W = E.W, H = E.H, proj = E.proj;
  let bg = null, crowd = [], teams = null;

  // ---------- logos ----------
  const imgs = {};
  R.logo = (t, cb) => {
    if (!t || !t.logo || (CK.S && CK.S.logos === 'retro')) return null;
    const url = CK.logoUrl(t.logo);
    let im = imgs[url];
    if (!im) { im = imgs[url] = new Image(); im.onload = () => { im.ok = true; im.cbs.forEach(f => f()); im.cbs = []; }; im.onerror = () => { im.bad = true; }; im.cbs = []; im.src = url; }
    if (im.ok) return im;
    if (cb && !im.bad) im.cbs.push(cb);
    return null;
  };

  // ---------- static arena + court ----------
  R.buildCourt = (home, away) => {
    teams = { home, away };
    bg = document.createElement('canvas'); bg.width = W; bg.height = H;
    const g = bg.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#0b0d1a'; g.fillRect(0, 0, W, H);
    // stands back wall
    const [, farY] = proj(-25, 20); const [, nearY] = proj(25, 20);
    g.fillStyle = '#121633'; g.fillRect(0, 0, W, farY - 6);
    for (let y = 0; y < farY - 14; y += 5) { g.fillStyle = (y / 5) % 2 ? '#171c3e' : '#141936'; g.fillRect(0, y, W, 5); }
    // floor (wood + colored apron)
    const apron = U.shade(home.c1, -0.15);
    for (let sy = Math.floor(farY - 12); sy < H; sy++) for (let sx = 0; sx < W; sx++) {
      const [x, y] = E.unproj(sx, sy);
      if (x < -28 || x > 30) continue;
      const out = Math.abs(x) > 25 || y < 0 || y > 47;
      if (out && (Math.abs(x) > 26.5 || y < -3)) { g.fillStyle = apron; g.fillRect(sx, sy, 1, 1); continue; }
      const plank = Math.floor((x + 40) / 0.9), seam = Math.floor((y + plank * 5.7) / 8);
      const v = ((plank * 37 + seam * 13) % 7) * 0.018 + ((sx + sy * 3) % 11 === 0 ? -0.04 : 0);
      const k = 0.9 + v - (out ? 0.1 : 0);
      g.fillStyle = 'rgb(' + (214 * k | 0) + ',' + (152 * k | 0) + ',' + (92 * k | 0) + ')'; g.fillRect(sx, sy, 1, 1);
    }
    // paint
    polyFill(g, [[-8, 0], [8, 0], [8, 19], [-8, 19]], home.c1, 0.88);
    polyFill(g, [[-25, 0], [25, 0], [25, -3], [-25, -3]], home.c1, 0.5);
    // lines
    g.fillStyle = '#f6f1e7';
    const L = (a, b) => seg(g, a, b);
    L([-25, 0], [25, 0]); L([-25, 0], [-25, 47]); L([25, 0], [25, 47]); L([-25, 47], [25, 47]);
    L([-8, 0], [-8, 19]); L([8, 0], [8, 19]); L([-8, 19], [8, 19]);
    L([-6, 0], [-6, 19]); L([6, 0], [6, 19]);
    arc(g, 0, 19, 6, 0, Math.PI, '#f6f1e7');
    arc(g, 0, 19, 6, Math.PI, Math.PI * 2, 'rgba(246,241,231,0.5)', true);
    g.fillStyle = '#f6f1e7'; L([-22, 0], [-22, 14]); L([22, 0], [22, 14]);
    arc(g, 0, 5.25, 23.75, Math.atan2(8.75, 22), Math.atan2(8.75, -22), '#f6f1e7');
    arc(g, 0, 5.25, 4, 0, Math.PI, 'rgba(246,241,231,0.8)');
    arc(g, 0, 47, 6, Math.PI, Math.PI * 2, '#f6f1e7'); arc(g, 0, 47, 6, 0, Math.PI, '#f6f1e7');
    // half court logo (or team letters)
    const lg = R.logo(home, () => { if (teams && teams.home === home) R.buildCourt(home, away); });
    const [cx, cy] = proj(0, 47);
    if (lg) { g.globalAlpha = 0.9; g.drawImage(lg, Math.round(cx - 22), Math.round(cy - 14), 44, 28); g.globalAlpha = 1; }
    else { g.fillStyle = home.c1; g.beginPath(); g.ellipse(cx, cy, 18, 9, 0, 0, 7); g.fill(); U.pixText(g, home.ab, Math.round(cx - U.pixW(home.ab, 2) / 2), Math.round(cy - 5), '#fff', 2); }
    // baseline name painted in the apron behind the hoop (vertical strip on the right)
    // scorer's table along the near sideline
    const tY = Math.round(nearY + 7);
    g.fillStyle = '#05060c'; g.fillRect(0, tY, W, H - tY);
    g.fillStyle = home.c1; g.fillRect(0, tY, W, 2);
    g.fillStyle = '#0f1430'; g.fillRect(90, tY + 3, 220, H - tY - 3);
    g.fillStyle = home.c2; g.fillRect(90, tY + 3, 220, 1);
    const nm = (home.city + ' ' + (home.name || '')).toUpperCase();
    U.pixText(g, nm, Math.round(200 - U.pixW(nm) / 2), tY + 4, '#fff');
    if (lg) { g.drawImage(lg, 96, tY + 3, 11, 11); g.drawImage(lg, 293, tY + 3, 11, 11); }
    // LED board above far sideline
    const bY = Math.round(farY - 13);
    g.fillStyle = '#000'; g.fillRect(0, bY, W, 7);
    for (let x = 0; x < W; x += 80) { g.fillStyle = home.c1; g.fillRect(x, bY + 1, 78, 5); U.pixText(g, ((home.name || home.city) + '').toUpperCase().slice(0, 18), x + 4, bY + 1, '#fff'); }
    // crowd sprites
    crowd = [];
    const cols = [home.c1, home.c2, '#fff', '#e8e8e8', home.c1, '#333', '#ffd23f', away.c1];
    for (let row = 0; row * 5 + 4 < bY - 2; row++) for (let x = 2 + (row % 2) * 3; x < W - 2; x += 6) if (Math.random() < 0.9) crowd.push({ x, y: row * 5 + 3, c: U.pick(cols), s: CK.SKIN[U.irand(0, 5)], ph: Math.random() * 6 });
    for (let x = 3; x < 88; x += 6) crowd.push({ x, y: tY + 9 + (x % 12 ? 0 : 2), c: U.pick(cols), s: CK.SKIN[U.irand(0, 5)], ph: Math.random() * 6, front: true });
    for (let x = 316; x < W - 2; x += 6) crowd.push({ x, y: tY + 9 + (x % 12 ? 0 : 2), c: U.pick(cols), s: CK.SKIN[U.irand(0, 5)], ph: Math.random() * 6, front: true });
  };
  function seg(g, a, b) {
    const n = Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) * 8);
    for (let i = 0; i <= n; i++) { const t = i / n; const [x, y] = proj(U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t)); g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  }
  function arc(g, cx, cy, r, a0, a1, col, dash) {
    g.fillStyle = col; const n = Math.ceil(r * Math.abs(a1 - a0) * 8);
    for (let i = 0; i <= n; i++) { if (dash && (i >> 3) % 2) continue; const a = U.lerp(a0, a1, i / n); const [x, y] = proj(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  }
  function polyFill(g, pts, col, alpha) {
    g.save(); g.globalAlpha = alpha; g.fillStyle = col; g.beginPath();
    pts.forEach((p, i) => { const [x, y] = proj(p[0], p[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.closePath(); g.fill(); g.restore();
  }
  R.drawIdle = ctx => {
    if (!bg) return; ctx.imageSmoothingEnabled = false; ctx.drawImage(bg, 0, 0);
    const t = performance.now() / 1000;
    crowd.forEach(c => { const y = Math.round(c.y - Math.max(0, Math.sin(t * 3 + c.ph)) * 0.5); ctx.fillStyle = c.c; ctx.fillRect(c.x - 2, y + 2, 5, 3); ctx.fillStyle = c.s; ctx.fillRect(c.x - 1, y - 1, 3, 3); });
  };

  // ---------- frame ----------
  R.draw = (ctx, info) => {
    const st = E.st; if (!st || !bg) return;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (st.shake > 0) ctx.translate(Math.round(U.rand(-1, 1) * st.shake * 3), Math.round(U.rand(-1, 1) * st.shake * 2));
    ctx.drawImage(bg, 0, 0);
    const hype = info && info.hype || 0;
    crowd.forEach(c => {
      const bob = Math.max(0, Math.sin(st.t * (3 + hype * 6) + c.ph)) * (0.5 + hype * 2);
      const y = Math.round(c.y - bob);
      ctx.fillStyle = c.c; ctx.fillRect(c.x - 2, y + 2, 5, 3);
      ctx.fillStyle = c.s; ctx.fillRect(c.x - 1, y - 1, 3, 3);
      if (hype > 0.5 && (c.ph * 10 | 0) % 3 === 0) { ctx.fillRect(c.x - 3, y - 3, 1, 3); ctx.fillRect(c.x + 3, y - 3, 1, 3); }
    });
    hoopBack(ctx, st);
    st.ents.forEach(e => shadow(ctx, e.x, e.y, e.z, 6));
    const b = st.ball;
    if (!(b.s === 'hold' && b.h)) shadow(ctx, b.x, b.y, b.z, 2);
    rings(ctx, st);
    // depth sort by court x (screen depth)
    const list = st.ents.map(e => ({ k: e.x, e }));
    const ballFree = !(b.s === 'hold' && b.h);
    if (ballFree) list.push({ k: (b.s === 'shot' || b.s === 'net') && b.z > 6 ? Math.max(b.x, 0.3) : b.x + 0.05, ball: true });
    list.sort((a, c) => a.k - c.k);
    // ball trail on shots
    if (b.s === 'shot') { st.trail = st.trail || []; st.trail.push([b.x, b.y, b.z]); if (st.trail.length > 7) st.trail.shift(); } else st.trail = [];
    (st.trail || []).forEach((p, i) => { const [x, y] = proj(p[0], p[1], p[2]); ctx.fillStyle = 'rgba(255,190,90,' + (i / 14) + ')'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); });
    list.forEach(o => o.ball ? ball(ctx, b.x, b.y, b.z) : player(ctx, o.e, st));
    hoopFront(ctx, st);
    st.parts.forEach(p => { const [x, y] = proj(p.x, p.y, p.z); ctx.fillStyle = p.c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); });
    const sh = st.ents.find(e => e.state === 'shoot' && e.userShot && !e.released);
    if (sh) meter(ctx, sh);
    if (st.phase === 'ft' && st.ftState === 'meter' && st.cfg.user === 'off') ftMeter(ctx, st);
    st.ents.forEach(e => { if (e.labelT > 0 && e.label) { const [x, y] = proj(e.x, e.y, e.z); const col = e.label === 'PERFECT' ? '#3dff6a' : e.label === 'GOOD' ? '#ffd23f' : '#ff7070'; const w = U.pixW(e.label); U.pixText(ctx, e.label, Math.round(x - w / 2) + 1, Math.round(y - 44) + 1, '#000'); U.pixText(ctx, e.label, Math.round(x - w / 2), Math.round(y - 44), col); } });
    ctx.restore();
    st.pops.forEach(p => {
      const k = p.t / p.life, s = p.s + 1, w = U.pixW(p.text, s);
      const y = 78 + p.y * 0.5 - Math.min(1, p.t * 6) * 8 - k * 5;
      if (k > 0.8 && ((p.t * 20) | 0) % 2) return;
      const x = Math.round(W / 2 - w / 2);
      U.pixText(ctx, p.text, x + s, Math.round(y) + s, '#000', s);
      U.pixText(ctx, p.text, x, Math.round(y), p.col, s);
    });
  };

  function shadow(ctx, x, y, z, r) {
    const [sx, sy] = proj(x, y, 0); const k = Math.max(0.45, 1 - z / 14);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(Math.round(sx - r * k), Math.round(sy) - 1, Math.round(r * 2 * k), 3);
    ctx.fillRect(Math.round(sx - r * k) - 1, Math.round(sy), Math.round(r * 2 * k) + 2, 1);
  }
  function rings(ctx, st) {
    const u = st.user;
    if (u) { const [x, y] = proj(u.x, u.y, 0); ring(ctx, x, y, 8, '#ffd23f'); }
    if (st.cfg.user === 'off' && st.ball.s === 'hold' && st.ball.h.side === 0 && st.phase === 'live') {
      let n = 1;
      st.ents.forEach(e => {
        if (e.side !== 0) return;
        if (e.ball) return;
        const o = E.openness(e); const [x, y] = proj(e.x, e.y, 0);
        ring(ctx, x, y, 6, o > 5.5 ? '#3dff6a' : o > 3.2 ? '#ffd23f' : '#ff4d4d');
      });
    }
  }
  function ring(ctx, x, y, r, col) {
    x = Math.round(x); y = Math.round(y); ctx.fillStyle = col;
    ctx.fillRect(x - r + 2, y - 2, r * 2 - 4, 1); ctx.fillRect(x - r + 2, y + 2, r * 2 - 4, 1);
    ctx.fillRect(x - r, y - 1, 2, 1); ctx.fillRect(x + r - 2, y - 1, 2, 1); ctx.fillRect(x - r, y + 1, 2, 1); ctx.fillRect(x + r - 2, y + 1, 2, 1);
    ctx.fillRect(x - r - 1, y, 1, 1); ctx.fillRect(x + r, y, 1, 1);
  }
  function ball(ctx, x, y, z) {
    const [sx, sy] = proj(x, y, z); const X = Math.round(sx) - 2, Y = Math.round(sy) - 4;
    ctx.fillStyle = '#140a03'; ctx.fillRect(X - 1, Y, 6, 4); ctx.fillRect(X, Y - 1, 4, 6);
    ctx.fillStyle = '#ef7d2a'; ctx.fillRect(X, Y, 4, 4);
    ctx.fillStyle = '#8a3a10'; ctx.fillRect(X + 2, Y, 1, 4); ctx.fillRect(X, Y + 2, 4, 1);
    ctx.fillStyle = '#ffb067'; ctx.fillRect(X, Y, 1, 1);
  }

  // hoop pieces: stanchion + backboard + back rim, then front rim + net over players
  function hoopBack(ctx, st) {
    const P = (x, y, z) => proj(x, y, z).map(Math.round);
    const [px, py] = P(0, -4, 0), [ax, ay] = P(0, -4, 12.5), [bx, by] = P(0, 3.6, 12.2);
    ctx.fillStyle = '#0b0b12'; ctx.fillRect(px - 3, ay - 1, 7, py - ay + 3);
    ctx.fillStyle = '#3a4060'; ctx.fillRect(px - 2, ay, 5, py - ay);
    ctx.fillStyle = '#566087'; ctx.fillRect(px - 2, ay, 1, py - ay);
    ctx.fillStyle = '#1c2135'; ctx.fillRect(px - 7, py - 3, 15, 5); // base pad
    ctx.fillStyle = teams.home.c1; ctx.fillRect(px - 6, py - 2, 13, 3);
    ctx.fillStyle = '#3a4060'; ctx.fillRect(bx, by, ax - bx, 2);  // arm
    // backboard: plane at y=4 spanning x -3..3, z 9.5..13.5
    const c = [P(-3, 4, 13.5), P(3, 4, 13.5), P(3, 4, 9.5), P(-3, 4, 9.5)];
    ctx.fillStyle = 'rgba(210,235,255,0.55)'; ctx.beginPath(); c.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); c.forEach((p, i) => i ? ctx.lineTo(p[0] + 0.5, p[1] + 0.5) : ctx.moveTo(p[0] + 0.5, p[1] + 0.5)); ctx.closePath(); ctx.stroke();
    const s = [P(-1, 4, 11.5), P(1, 4, 11.5), P(1, 4, 10), P(-1, 4, 10)];
    ctx.beginPath(); s.forEach((p, i) => i ? ctx.lineTo(p[0] + 0.5, p[1] + 0.5) : ctx.moveTo(p[0] + 0.5, p[1] + 0.5)); ctx.stroke();
    // back half of rim
    rim(ctx, st, true);
  }
  function rim(ctx, st, back) {
    const [rx, ry] = proj(0, 5.25, 10); const X = Math.round(rx), Y = Math.round(ry);
    const sh = st.rimT > 0 ? ((st.t * 40) | 0) % 2 : 0;
    ctx.fillStyle = back ? '#a8380f' : '#ff5a1f';
    for (let a = 0; a < 64; a++) {
      const t = a / 64 * Math.PI * 2, s = Math.sin(t);
      if (back ? s > 0 : s < 0) continue;
      ctx.fillRect(Math.round(X + Math.cos(t) * 5.5), Math.round(Y + s * 2.2) + sh, 1, 1);
    }
  }
  function hoopFront(ctx, st) {
    if (st.rimT > 0) st.rimT -= 1 / 60;
    const [rx, ry] = proj(0, 5.25, 10); const X = Math.round(rx), Y = Math.round(ry);
    const sw = st.netT > 0 ? Math.sin(st.t * 30) * 1.2 : 0; if (st.netT > 0) st.netT -= 1 / 60;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (let i = 0; i < 8; i++) {
      const w = 5.5 - i * 0.35, yy = Y + 2 + i;
      for (let k = -1; k <= 1; k += 2) ctx.fillRect(Math.round(X + k * w + sw * i / 8), yy, 1, 1);
      if (i % 2) for (let x = -w + 1; x < w; x += 2) ctx.fillRect(Math.round(X + x + sw * i / 8), yy, 1, 1);
    }
    rim(ctx, st, false);
    ctx.fillStyle = '#ff8a4a'; ctx.fillRect(X - 5, Y + 2, 11, 1);
  }

  // ---------- players ----------
  function player(ctx, e, st) {
    const p = e.pl, jer = e.side === 0 ? st.cfg.off : st.cfg.def;
    if (!e.look) e.look = CK.SP.lookOf(p, jer);
    const [sx, sy] = proj(e.x, e.y, e.z);
    const b = st.ball, hasBall = b.s === 'hold' && b.h === e;
    const sp = Math.hypot(e.vx, e.vy);
    let pose = 'idle', f = 0;
    if (e.fell) pose = 'fall';
    else if (e.hang > 0 || (e.state === 'fin' && e.dunk && e.z > 2)) pose = 'dunk';
    else if (e.state === 'shoot' || e.state === 'ftm' || (e.state === 'fin' && e.z > 0.5)) pose = 'shoot';
    else if (e.state === 'jump' || e.z > 1) pose = 'jump';
    else if (e.state === 'reach') pose = 'reach';
    else if (st.phase === 'end' && st.result && st.result.tag === 'make' && e.side === 0 && st.cfg.user === 'off') pose = ((st.t * 4) | 0) % 2 ? 'cele' : 'idle';
    else if (sp > 2) { pose = hasBall ? 'drib' : 'run'; f = Math.floor(e.run * 0.55) % 4; if (hasBall) pose = 'run'; }
    else if (hasBall) { pose = 'drib'; f = 1; }
    else if (e.side === 1 && st.phase === 'live') pose = 'def';
    const img = CK.SP.get(e.look, pose, f, e.face < 0);
    const X = Math.round(sx) - CK.SP.FX, Y = Math.round(sy) - CK.SP.FY;
    ctx.drawImage(img, X, Y);
    // ball in hands
    if (hasBall) {
      if (pose === 'shoot' || pose === 'dunk') { const hx = Math.round(sx) + (e.face < 0 ? -3 : 3); ballAt(ctx, hx, Math.round(sy) - 36); }
      else ball(ctx, b.x, b.y, b.z);
    }
    if (e.fire) for (let i = 0; i < 4; i++) { ctx.fillStyle = U.pick(['#ffd23f', '#ff7a1a', '#ff3a1a']); ctx.fillRect(Math.round(sx) - 4 + U.irand(0, 8), Math.round(sy) - 34 - U.irand(0, 5), 1, 2); }
    if (e === st.user) {
      const ax = Math.round(sx), ay = Math.round(sy) - 42 - (e.pl.ht > 80 ? 3 : 0);
      ctx.fillStyle = '#000'; ctx.fillRect(ax - 3, ay - 1, 7, 4);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(ax - 2, ay, 5, 1); ctx.fillRect(ax - 1, ay + 1, 3, 1); ctx.fillRect(ax, ay + 2, 1, 1);
    }
  }
  function ballAt(ctx, X, Y) {
    ctx.fillStyle = '#140a03'; ctx.fillRect(X - 3, Y - 2, 6, 4); ctx.fillRect(X - 2, Y - 3, 4, 6);
    ctx.fillStyle = '#ef7d2a'; ctx.fillRect(X - 2, Y - 2, 4, 4); ctx.fillStyle = '#ffb067'; ctx.fillRect(X - 2, Y - 2, 1, 1);
  }

  function meter(ctx, e) {
    const [sx, sy] = proj(e.x, e.y, e.z);
    const X = Math.round(sx) + 12, Y = Math.round(sy) - 40, Hh = 32;
    const m = U.clamp(e.stT / E.METER_T, 0, 1.3) / 1.3;
    ctx.fillStyle = '#000'; ctx.fillRect(X - 1, Y - 1, 7, Hh + 2);
    ctx.fillStyle = '#2b2f4a'; ctx.fillRect(X, Y, 5, Hh);
    const c = 0.86 / 1.3, w = e.win / 1.3;
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(X, Math.round(Y + Hh - (c + w) * Hh), 5, Math.max(1, Math.round(w * 2 * Hh)));
    ctx.fillStyle = '#3dff6a'; ctx.fillRect(X, Math.round(Y + Hh - (c + w * 0.42) * Hh), 5, Math.max(2, Math.round(w * 0.84 * Hh)));
    ctx.fillStyle = '#fff'; ctx.fillRect(X - 2, Math.round(Y + Hh - m * Hh), 9, 2);
  }
  function ftMeter(ctx, st) {
    const m = st.ftM || 0, X = 150, Y = 186, Wd = 100;
    ctx.fillStyle = '#000'; ctx.fillRect(X - 2, Y - 2, Wd + 4, 10);
    ctx.fillStyle = '#2b2f4a'; ctx.fillRect(X, Y, Wd, 6);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(X + Wd * 0.35, Y, Wd * 0.3, 6);
    ctx.fillStyle = '#3dff6a'; ctx.fillRect(X + Wd * 0.45, Y, Wd * 0.1, 6);
    ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(X + m * Wd), Y - 3, 2, 12);
    const t = 'TAP OR SPACE TO SHOOT'; U.pixText(ctx, t, Math.round(200 - U.pixW(t) / 2), Y + 10, '#fff');
  }
})(window.CK);
