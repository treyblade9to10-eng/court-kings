// Court Kings - landscape pixel renderer (side view half court, hoop on the right)
(function (CK) {
  const U = CK.U, E = CK.CT, R = CK.RD = {};
  const H = E.H, proj = E.proj;
  let W = E.W;   // screen width in canvas px changes with the phone/computer shape (see match.js fit)
  let bg = null, crowd = [], teams = null;

  // ---------- logos ----------
  const imgs = {};
  R.logo = (t, cb) => {
    if (!t || !t.logo || (CK.S && CK.S.logos === 'retro')) return null;
    const url = CK.logoUrl(t.logo);
    let im = imgs[url];
    if (!im) { im = imgs[url] = new Image(); im.onload = () => { im.ok = true; im.cbs.forEach(f => f()); im.cbs = []; }; im.onerror = () => { im.bad = true; }; im.cbs = []; im.crossOrigin = 'anonymous'; im.src = url; }
    if (im.ok) return im;
    if (cb && !im.bad) im.cbs.push(cb);
    return null;
  };

  // ---------- static arena + full court (built once into a wide canvas) ----------
  const K = E.K, OX = 352, BGW = 790;   // bg pixel = world screen x + OX
  const pB = (X, Y, z) => [K.BX - Y * K.KY + X * K.SK + OX, K.YM + X * K.KX - (z || 0) * K.ZS];
  const unB = (px, sy) => { const X = (sy - K.YM) / K.KX; return [X, (K.BX + X * K.SK + OX - px) / K.KY]; };
  const CAM_MIN = -OX + 2; let CAM_MAX = BGW - OX - W - 2;
  R.setW = w => { W = w; CAM_MAX = Math.max(CAM_MIN, BGW - OX - W - 2); };
  R.buildCourt = (home, away) => {
    teams = { home, away };
    bg = document.createElement('canvas'); bg.width = BGW; bg.height = H;
    const g = bg.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#0b0d1a'; g.fillRect(0, 0, BGW, H);
    const [, farY] = pB(-25, 47); const [, nearY] = pB(25, 47);
    g.fillStyle = '#121633'; g.fillRect(0, 0, BGW, farY - 6);
    for (let y = 0; y < farY - 14; y += 5) { g.fillStyle = (y / 5) % 2 ? '#171c3e' : '#141936'; g.fillRect(0, y, BGW, 5); }
    // floor: wood inside, team-color apron outside
    const apron = U.shade(home.c1, -0.15);
    const img = g.getImageData(0, 0, BGW, H), D = img.data, [ar, ag, ab] = (() => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = apron; c.fillRect(0, 0, 1, 1); return c.getImageData(0, 0, 1, 1).data; })();
    for (let sy = Math.floor(farY - 12); sy < H; sy++) for (let px = 0; px < BGW; px++) {
      const [x, y] = unB(px, sy);
      if (x < -28 || x > 30) continue;
      const i = (sy * BGW + px) * 4;
      const out = Math.abs(x) > 25 || y < 0 || y > 94;
      if (out && (Math.abs(x) > 26.5 || y < -3 || y > 97)) { D[i] = ar; D[i + 1] = ag; D[i + 2] = ab; D[i + 3] = 255; continue; }
      const plank = Math.floor((x + 40) / 0.9), seam = Math.floor((y + plank * 5.7) / 8);
      const v = ((plank * 37 + seam * 13) % 7) * 0.018 + ((px + sy * 3) % 11 === 0 ? -0.04 : 0);
      const k = 0.9 + v - (out ? 0.1 : 0);
      D[i] = 214 * k; D[i + 1] = 152 * k; D[i + 2] = 92 * k; D[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // both ends: paint, lines, arcs (end 0 = right hoop at Y 5.25, end 1 = left hoop at Y 88.75)
    const M = (X, Y, e) => e ? [-X, 94 - Y] : [X, Y];
    const LC = '#f6f1e7';
    for (const e of [0, 1]) {
      polyFill(g, [[-8, 0], [8, 0], [8, 19], [-8, 19]].map(p => M(p[0], p[1], e)), home.c1, 0.85);
      polyFill(g, [[-25, 0], [25, 0], [25, -3], [-25, -3]].map(p => M(p[0], p[1], e)), home.c1, 0.5);
      g.fillStyle = LC;
      const Ls = (a, b) => seg(g, M(a[0], a[1], e), M(b[0], b[1], e));
      Ls([-8, 0], [-8, 19]); Ls([8, 0], [8, 19]); Ls([-8, 19], [8, 19]); Ls([-6, 0], [-6, 19]); Ls([6, 0], [6, 19]);
      Ls([-22, 0], [-22, 14]); Ls([22, 0], [22, 14]);
      const A = (cx, cy, r, a0, a1, col, dash) => { g.fillStyle = col; const n = Math.ceil(r * Math.abs(a1 - a0) * 8); for (let i = 0; i <= n; i++) { if (dash && (i >> 3) % 2) continue; const a = U.lerp(a0, a1, i / n); const [X, Y] = M(cx + Math.cos(a) * r, cy + Math.sin(a) * r, e); const [px, py] = pB(X, Y); g.fillRect(Math.round(px), Math.round(py), 1, 1); } };
      A(0, 19, 6, 0, Math.PI, LC); A(0, 19, 6, Math.PI, Math.PI * 2, 'rgba(246,241,231,0.5)', true);
      A(0, 5.25, 23.75, Math.atan2(8.75, 22), Math.atan2(8.75, -22), LC);
      A(0, 5.25, 4, 0, Math.PI, 'rgba(246,241,231,0.8)');
    }
    g.fillStyle = LC;
    seg(g, [-25, 0], [25, 0]); seg(g, [-25, 94], [25, 94]); seg(g, [-25, 0], [-25, 94]); seg(g, [25, 0], [25, 94]); seg(g, [-25, 47], [25, 47]);
    arc(g, 0, 47, 6, 0, Math.PI * 2, LC); arc(g, 0, 47, 2, 0, Math.PI * 2, LC);
    // center logo
    const lg = R.logo(home, () => { if (teams && teams.home === home) R.buildCourt(home, away); });
    const [cx, cy] = pB(0, 47);
    const pxl = (w, h) => { const k = w + 'x' + h; lg.px = lg.px || {}; return lg.px[k] || (lg.px[k] = U.pixLogo(lg, w, h)); };
    if (lg) { const P = pxl(62, 40); g.drawImage(P, Math.round(cx - P.width / 2), Math.round(cy - P.height / 2)); }
    else { g.fillStyle = home.c1; g.beginPath(); g.ellipse(cx, cy, 18, 9, 0, 0, 7); g.fill(); U.pixText(g, home.ab, Math.round(cx - U.pixW(home.ab, 2) / 2), Math.round(cy - 5), '#fff', 2); }
    // scorer's table along the near sideline
    const tY = Math.round(nearY + 7);
    g.fillStyle = '#05060c'; g.fillRect(0, tY, BGW, H - tY);
    g.fillStyle = home.c1; g.fillRect(0, tY, BGW, 2);
    const tx0 = Math.round(cx - 110);
    g.fillStyle = '#0f1430'; g.fillRect(tx0, tY + 3, 220, H - tY - 3);
    g.fillStyle = home.c2; g.fillRect(tx0, tY + 3, 220, 1);
    const nm = (home.city + ' ' + (home.name || '')).toUpperCase();
    U.pixText(g, nm, Math.round(cx - U.pixW(nm) / 2), tY + 4, '#fff');
    if (lg) { const P = pxl(11, 11); g.drawImage(P, tx0 + 4, tY + 2); g.drawImage(P, tx0 + 203, tY + 2); }
    // LED board above the far sideline
    const bY = Math.round(farY - 13);
    g.fillStyle = '#000'; g.fillRect(0, bY, BGW, 7);
    for (let x = 0; x < BGW; x += 80) { const t = x % 160 ? away : home; g.fillStyle = t.c1; g.fillRect(x, bY + 1, 78, 5); U.pixText(g, ((t.name || t.city) + '').toUpperCase().slice(0, 18), x + 4, bY + 1, '#fff'); }
    // crowd sprites (bg pixel coords)
    crowd = [];
    const cols = [home.c1, home.c2, '#fff', '#e8e8e8', home.c1, '#333', '#ffd23f', away.c1];
    for (let row = 0; row * 5 + 4 < bY - 2; row++) for (let x = 2 + (row % 2) * 3; x < BGW - 2; x += 6) if (Math.random() < 0.9) crowd.push({ x, y: row * 5 + 3, c: U.pick(cols), s: CK.SKIN[U.irand(0, 5)], ph: Math.random() * 6 });
    for (let x = 3; x < BGW - 2; x += 6) if (x < tx0 - 4 || x > tx0 + 224) crowd.push({ x, y: tY + 9 + (x % 12 ? 0 : 2), c: U.pick(cols), s: CK.SKIN[U.irand(0, 5)], ph: Math.random() * 6, front: true });
  };
  function seg(g, a, b) {
    const n = Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) * 8);
    for (let i = 0; i <= n; i++) { const t = i / n; const [x, y] = pB(U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t)); g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  }
  function arc(g, cx, cy, r, a0, a1, col, dash) {
    g.fillStyle = col; const n = Math.ceil(r * Math.abs(a1 - a0) * 8);
    for (let i = 0; i <= n; i++) { if (dash && (i >> 3) % 2) continue; const a = U.lerp(a0, a1, i / n); const [x, y] = pB(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  }
  function polyFill(g, pts, col, alpha) {
    g.save(); g.globalAlpha = alpha; g.fillStyle = col; g.beginPath();
    pts.forEach((p, i) => { const [x, y] = pB(p[0], p[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.closePath(); g.fill(); g.restore();
  }
  function drawCrowd(ctx, t, hype) {
    const ox = -OX - Math.round(E.cam);
    crowd.forEach(c => {
      const x = c.x + ox; if (x < -4 || x > W + 4) return;
      const bob = Math.max(0, Math.sin(t * (3 + hype * 6) + c.ph)) * (0.5 + hype * 2);
      const y = Math.round(c.y - bob);
      ctx.fillStyle = c.c; ctx.fillRect(x - 2, y + 2, 5, 3);
      ctx.fillStyle = c.s; ctx.fillRect(x - 1, y - 1, 3, 3);
      if (hype > 0.5 && (c.ph * 10 | 0) % 3 === 0) { ctx.fillRect(x - 3, y - 3, 1, 3); ctx.fillRect(x + 3, y - 3, 1, 3); }
    });
  }
  // camera follows the ball, leaning toward the basket being attacked
  R.camTo = (st, snap) => {
    const b = st.ball, d = st.dir || 1;
    const [bx] = E.proj(b.x, b.y, 0);
    const target = U.clamp(bx + E.cam - W / 2 + 60 * d, CAM_MIN, CAM_MAX);
    E.cam = snap ? target : E.cam + (target - E.cam) * 0.08;
  };
  R.drawIdle = ctx => {
    if (!bg) return; ctx.imageSmoothingEnabled = false; ctx.drawImage(bg, -OX - Math.round(E.cam), 0);
    drawCrowd(ctx, performance.now() / 1000, 0);
  };

  // ---------- frame ----------
  R.draw = (ctx, info) => {
    const st = E.st; if (!st || !bg) return;
    if (!st.camInit) { st.camInit = true; R.camTo(st, !(info && info.keepCam)); } else R.camTo(st);
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (st.shake > 0) ctx.translate(Math.round(U.rand(-1, 1) * st.shake * 3), Math.round(U.rand(-1, 1) * st.shake * 2));
    ctx.drawImage(bg, -OX - Math.round(E.cam), 0);
    const hype = info && info.hype || 0;
    drawCrowd(ctx, st.t, hype);
    const act = (st.dir || 1) > 0 ? 0 : 1;   // which end the offense attacks
    hoopBack(ctx, st, 0, act === 0); hoopBack(ctx, st, 1, act === 1);
    st.ents.forEach(e => shadow(ctx, e.x, e.y, e.z, 6));
    const b = st.ball;
    if (!(b.s === 'hold' && b.h)) shadow(ctx, b.x, b.y, b.z, 2);
    rings(ctx, st);
    // depth sort by screen depth (world X)
    const d = st.dir || 1;
    const list = st.ents.map(e => ({ k: e.x * d, e }));
    const ballFree = !(b.s === 'hold' && b.h);
    if (ballFree) list.push({ k: ((b.s === 'shot' || b.s === 'net') && b.z > 6 ? Math.max(b.x, 0.3) : b.x + 0.05) * d, ball: true });
    list.sort((a, c) => a.k - c.k);
    if (b.s === 'shot') { st.trail = st.trail || []; st.trail.push([b.x, b.y, b.z]); if (st.trail.length > 7) st.trail.shift(); } else st.trail = [];
    (st.trail || []).forEach((p, i) => { const [x, y] = proj(p[0], p[1], p[2]); ctx.fillStyle = 'rgba(255,190,90,' + (i / 14) + ')'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); });
    list.forEach(o => o.ball ? ball(ctx, b.x, b.y, b.z) : player(ctx, o.e, st));
    hoopFront(ctx, st, 0, act === 0); hoopFront(ctx, st, 1, act === 1);
    if (st.rimT > 0) st.rimT -= 1 / 60; if (st.netT > 0) st.netT -= 1 / 60;
    st.parts.forEach(p => { const [x, y] = proj(p.x, p.y, p.z); ctx.fillStyle = p.c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); });
    const sh = st.ents.find(e => e.state === 'shoot' && e.userShot && !e.released && (!st.both || e === st.user));
    if (sh) meter(ctx, sh);
    if (st.phase === 'ft' && st.ftState === 'meter' && (st.cfg.user === 'off' || st.ftMine)) ftMeter(ctx, st);
    st.ents.forEach(e => { if (e.labelT > 0 && e.label) { const [x, y] = proj(e.x, e.y, e.z); const col = e.label === 'PERFECT' ? '#3dff6a' : e.label === 'GOOD' ? '#ffd23f' : '#ff7070'; const w = U.pixW(e.label); U.pixText(ctx, e.label, Math.round(x - w / 2) + 1, Math.round(y - 44) + 1, '#000'); U.pixText(ctx, e.label, Math.round(x - w / 2), Math.round(y - 44), col); } });
    ctx.restore();
    // off-screen arrow for the player you control
    const u = st.user;
    if (u) { const [ux, uy] = proj(u.x, u.y, 0); if (ux < 4 || ux > W - 4) { const ax = ux < 4 ? 4 : W - 8; ctx.fillStyle = '#ffd23f'; for (let i = 0; i < 4; i++) ctx.fillRect(ax + (ux < 4 ? i : 3 - i), Math.round(uy) - 12 - i, 1, i * 2 + 1); } }
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
      st.ents.forEach(e => {
        if (e.side !== 0 || e.ball) return;
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

  // hoops in world coords. end 0 = right basket, end 1 = left basket (mirrored)
  const HW = (end, X, Y, z) => { const p = end ? E.projW(-X, 94 - Y, z) : E.projW(X, Y, z); return [Math.round(p[0]), Math.round(p[1])]; };
  function hoopBack(ctx, st, end, active) {
    const P = (x, y, z) => HW(end, x, y, z);
    const [px, py] = P(0, -4, 0), [ax, ay] = P(0, -4, 12.5), [bx, by] = P(0, 3.6, 12.2);
    if (px < -40 || px > W + 40) return;
    ctx.fillStyle = '#0b0b12'; ctx.fillRect(px - 3, ay - 1, 7, py - ay + 3);
    ctx.fillStyle = '#3a4060'; ctx.fillRect(px - 2, ay, 5, py - ay);
    ctx.fillStyle = '#566087'; ctx.fillRect(px - 2, ay, 1, py - ay);
    ctx.fillStyle = '#1c2135'; ctx.fillRect(px - 7, py - 3, 15, 5);
    ctx.fillStyle = teams.home.c1; ctx.fillRect(px - 6, py - 2, 13, 3);
    ctx.fillStyle = '#3a4060'; ctx.fillRect(Math.min(ax, bx), by, Math.abs(ax - bx), 2);
    const c = [P(-3, 4, 13.5), P(3, 4, 13.5), P(3, 4, 9.5), P(-3, 4, 9.5)];
    ctx.fillStyle = 'rgba(210,235,255,0.55)'; ctx.beginPath(); c.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); c.forEach((p, i) => i ? ctx.lineTo(p[0] + 0.5, p[1] + 0.5) : ctx.moveTo(p[0] + 0.5, p[1] + 0.5)); ctx.closePath(); ctx.stroke();
    const s = [P(-1, 4, 11.5), P(1, 4, 11.5), P(1, 4, 10), P(-1, 4, 10)];
    ctx.beginPath(); s.forEach((p, i) => i ? ctx.lineTo(p[0] + 0.5, p[1] + 0.5) : ctx.moveTo(p[0] + 0.5, p[1] + 0.5)); ctx.stroke();
    rim(ctx, st, end, active, true);
  }
  function rim(ctx, st, end, active, back) {
    const [X, Y] = HW(end, 0, 5.25, 10);
    const sh = active && st.rimT > 0 ? ((st.t * 40) | 0) % 2 : 0;
    ctx.fillStyle = back ? '#a8380f' : '#ff5a1f';
    for (let a = 0; a < 64; a++) {
      const t = a / 64 * Math.PI * 2, s = Math.sin(t);
      if (back ? s > 0 : s < 0) continue;
      ctx.fillRect(Math.round(X + Math.cos(t) * 5.5), Math.round(Y + s * 2.2) + sh, 1, 1);
    }
  }
  function hoopFront(ctx, st, end, active) {
    const [X, Y] = HW(end, 0, 5.25, 10);
    if (X < -20 || X > W + 20) return;
    const sw = active && st.netT > 0 ? Math.sin(st.t * 30) * 1.2 : 0;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (let i = 0; i < 8; i++) {
      const w = 5.5 - i * 0.35, yy = Y + 2 + i;
      for (let k = -1; k <= 1; k += 2) ctx.fillRect(Math.round(X + k * w + sw * i / 8), yy, 1, 1);
      if (i % 2) for (let x = -w + 1; x < w; x += 2) ctx.fillRect(Math.round(X + x + sw * i / 8), yy, 1, 1);
    }
    rim(ctx, st, end, active, false);
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
    const fl = e.face * (st.dir || 1) < 0;
    const img = CK.SP.get(e.look, pose, f, fl);
    const X = Math.round(sx) - CK.SP.FX, Y = Math.round(sy) - CK.SP.FY;
    ctx.drawImage(img, X, Y);
    // ball in hands
    if (hasBall) {
      if (pose === 'shoot' || pose === 'dunk') { const hx = Math.round(sx) + (fl ? -3 : 3); ballAt(ctx, hx, Math.round(sy) - 36); }
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

  // shot meter: tall bar next to the shooter, fill rises while you hold; let go inside the green
  function meter(ctx, e) {
    const [sx, sy] = proj(e.x, e.y, e.z);
    const Wd = 9, Hh = 48;
    const X = U.clamp(Math.round(sx) + 11, 3, W - Wd - 4), Y = U.clamp(Math.round(sy) - 54, 3, H - Hh - 4);
    const m = U.clamp(e.stT / E.METER_T, 0, 1.3) / 1.3;
    const c = 0.86 / 1.3, w = e.win / 1.3;
    const yAt = v => Math.round(Y + Hh - v * Hh);
    const gT = yAt(c + w), gB = yAt(c - w), pT = yAt(c + w * 0.42), pB = yAt(c - w * 0.42);
    const inP = m >= c - w * 0.42 && m <= c + w * 0.42, inG = m >= c - w && m <= c + w, late = m > c + w;
    // frame
    ctx.fillStyle = '#000'; ctx.fillRect(X - 2, Y - 2, Wd + 4, Hh + 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(X - 1, Y - 1, Wd + 2, Hh + 2);
    ctx.fillStyle = '#15182b'; ctx.fillRect(X, Y, Wd, Hh);
    // zones (dim until you reach them)
    ctx.fillStyle = '#8a6d16'; ctx.fillRect(X, gT, Wd, gB - gT);
    ctx.fillStyle = '#1fa043'; ctx.fillRect(X, pT, Wd, Math.max(2, pB - pT));
    // fill
    const fy = yAt(m), col = inP ? '#3dff6a' : inG ? '#ffd23f' : late ? '#ff4d4d' : '#ef7d2a';
    ctx.fillStyle = col; ctx.fillRect(X + 1, fy, Wd - 2, Y + Hh - fy);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(X + 1, fy, 2, Y + Hh - fy);
    // green window brackets that flash when you are in it
    const flash = inP && ((performance.now() / 70) | 0) % 2;
    ctx.fillStyle = flash ? '#fff' : '#3dff6a';
    ctx.fillRect(X - 4, pT - 1, 3, 1); ctx.fillRect(X - 4, pB, 3, 1); ctx.fillRect(X - 4, pT - 1, 1, pB - pT + 2);
    ctx.fillRect(X + Wd + 1, pT - 1, 3, 1); ctx.fillRect(X + Wd + 1, pB, 3, 1); ctx.fillRect(X + Wd + 3, pT - 1, 1, pB - pT + 2);
    // level marker
    ctx.fillStyle = '#000'; ctx.fillRect(X - 1, fy - 1, Wd + 2, 3);
    ctx.fillStyle = '#fff'; ctx.fillRect(X - 1, fy, Wd + 2, 1);
    if (inP) { ctx.fillStyle = 'rgba(61,255,106,0.25)'; ctx.fillRect(X - 3, Y - 3, Wd + 6, Hh + 6); }
  }
  function ftMeter(ctx, st) {
    const m = st.ftM || 0, Wd = 140, X = Math.round(W / 2 - Wd / 2), Y = 182, Hh = 9;
    const inP = m >= 0.45 && m <= 0.55, inG = m >= 0.35 && m <= 0.65;
    ctx.fillStyle = '#000'; ctx.fillRect(X - 2, Y - 2, Wd + 4, Hh + 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(X - 1, Y - 1, Wd + 2, Hh + 2);
    ctx.fillStyle = '#15182b'; ctx.fillRect(X, Y, Wd, Hh);
    ctx.fillStyle = inG ? '#ffd23f' : '#5a4a12'; ctx.fillRect(Math.round(X + Wd * 0.35), Y, Math.round(Wd * 0.3), Hh);
    ctx.fillStyle = inP ? (((performance.now() / 70) | 0) % 2 ? '#fff' : '#3dff6a') : '#1f8a3a'; ctx.fillRect(Math.round(X + Wd * 0.45), Y, Math.round(Wd * 0.1), Hh);
    const mx = Math.round(X + m * Wd);
    ctx.fillStyle = '#000'; ctx.fillRect(mx - 2, Y - 5, 5, Hh + 10);
    ctx.fillStyle = '#fff'; ctx.fillRect(mx - 1, Y - 4, 3, Hh + 8);
    const t = 'TAP OR SPACE TO SHOOT'; U.pixText(ctx, t, Math.round(W / 2 - U.pixW(t) / 2) + 1, Y + 14, '#000'); U.pixText(ctx, t, Math.round(W / 2 - U.pixW(t) / 2), Y + 13, '#fff');
  }
})(window.CK);
