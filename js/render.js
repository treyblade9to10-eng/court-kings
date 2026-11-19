// Court Kings - pixel renderer for the half court
(function (CK) {
  const U = CK.U, E = CK.CT, R = CK.RD = {};
  const W = E.W, H = E.H, proj = E.proj;
  let bg = null, crowd = [];

  // ---------- static court ----------
  R.buildCourt = (home, away) => {
    bg = document.createElement('canvas'); bg.width = W; bg.height = H;
    const g = bg.getContext('2d');
    // arena dark
    g.fillStyle = '#0b0d1a'; g.fillRect(0, 0, W, H);
    // floor polygon from y=-2 to y=70
    for (let sy = 0; sy < H; sy++) {
      const [, y] = E.unproj(W / 2, sy);
      if (y < -1.5 || y > 66) continue;
      const [lx] = proj(-27, y), [rx] = proj(27, y);
      // wood planks run toward the hoop
      for (let sx = Math.floor(lx); sx < rx; sx++) {
        const [x] = E.unproj(sx, sy);
        const plank = Math.floor((x + 30) / 1.2), seam = Math.floor((y + plank * 7.3) / 9);
        const base = (plank * 37 + seam * 13) % 7;
        const shade = 0.9 + base * 0.018 + (Math.abs(x) > 25 || y < 0 ? -0.18 : 0);
        const r = 205 * shade, gg = 146 * shade, b = 86 * shade;
        g.fillStyle = 'rgb(' + (r | 0) + ',' + (gg | 0) + ',' + (b | 0) + ')';
        g.fillRect(sx, sy, 1, 1);
      }
    }
    // paint
    const paint = home.c1;
    polyFill(g, [[-8, 0], [8, 0], [8, 19], [-8, 19]], paint, 0.82);
    // apron outside the lines in team color
    // lines
    const line = (pts, col) => { g.fillStyle = col || '#f4efe6'; for (let i = 0; i < pts.length - 1; i++) seg(g, pts[i], pts[i + 1]); };
    line([[-25, 0], [25, 0]]); line([[-25, 0], [-25, 47]]); line([[25, 0], [25, 47]]); line([[-25, 47], [25, 47]]);
    line([[-8, 0], [-8, 19], [8, 19], [8, 0]]);
    // FT circle
    arc(g, 0, 19, 6, 0, Math.PI, '#f4efe6');
    arc(g, 0, 19, 6, Math.PI, Math.PI * 2, 'rgba(244,239,230,0.45)', 2);
    // three point line
    line([[-22, 0], [-22, 14]]); line([[22, 0], [22, 14]]);
    const a0 = Math.atan2(14 - 5.25, -22), a1 = Math.atan2(14 - 5.25, 22);
    arc(g, 0, 5.25, 23.75, a1, a0, '#f4efe6');
    // restricted arc
    arc(g, 0, 5.25, 4, 0, Math.PI, 'rgba(244,239,230,0.7)');
    // center circle + logo
    arc(g, 0, 47, 6, Math.PI, Math.PI * 2, '#f4efe6');
    arc(g, 0, 47, 2, Math.PI, Math.PI * 2, '#f4efe6');
    { const [cx, cy] = proj(0, 49); g.fillStyle = home.c1; ellipse(g, cx, cy, 30, 9); g.fill(); U.pixText(g, home.ab, Math.round(cx - U.pixW(home.ab, 2) / 2), Math.round(cy - 5), home.c2 === '#111111' ? '#fff' : home.c2, 2); }
    // baseline text
    { const [cx, cy] = proj(0, -0.9); }
    // back wall + crowd area above baseline
    const [, wallY] = proj(0, -1.6);
    g.fillStyle = '#141a33'; g.fillRect(0, 0, W, wallY);
    for (let y = 0; y < wallY - 10; y += 6) { g.fillStyle = y % 12 ? '#1a1f3d' : '#161b36'; g.fillRect(0, y, W, Math.min(6, wallY - 10 - y)); }
    g.fillStyle = home.c1; g.fillRect(0, wallY - 9, W, 7);
    U.pixText(g, home.city.toUpperCase(), 6, wallY - 8, '#fff', 1);
    U.pixText(g, 'COURT KINGS', W - U.pixW('COURT KINGS') - 6, wallY - 8, '#ffd23f', 1);
    g.fillStyle = '#000'; g.fillRect(0, wallY - 2, W, 2);
    // stand stripes
    // bottom courtside
    const [, bot] = proj(0, 64);
    g.fillStyle = '#141a33'; g.fillRect(0, bot, W, H - bot);
    g.fillStyle = home.c1; g.fillRect(0, bot, W, 3);
    // build crowd sprites
    crowd = [];
    const cols = [home.c1, home.c2, '#fff', '#e8e8e8', away.c1, '#333', '#ffd23f', home.c1];
    for (let row = 0; row < Math.floor((wallY - 16) / 6); row++) for (let x = 2 + (row % 2) * 3; x < W - 2; x += 6) if (Math.random() < 0.88) crowd.push({ x, y: row * 6 + 3, c: U.pick(cols), s: CK.SKIN[U.irand(0, 5)], ph: Math.random() * 6, top: true });
    for (let row = 0; row < Math.floor((H - bot - 6) / 7); row++) for (let x = 2 + (row % 2) * 3; x < W - 2; x += 6) if (Math.random() < 0.9) crowd.push({ x, y: bot + 6 + row * 7, c: U.pick(cols), s: CK.SKIN[U.irand(0, 5)], ph: Math.random() * 6 });
  };
  function seg(g, a, b) {
    const n = Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) * 3);
    for (let i = 0; i <= n; i++) { const t = i / n; const [x, y] = proj(U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t)); g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  }
  function arc(g, cx, cy, r, a0, a1, col, dash) {
    g.fillStyle = col; const n = Math.ceil(r * Math.abs(a1 - a0) * 3);
    for (let i = 0; i <= n; i++) { if (dash && (i >> 2) % 2) continue; const a = U.lerp(a0, a1, i / n); const [x, y] = proj(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  }
  function polyFill(g, pts, col, alpha) {
    g.save(); g.globalAlpha = alpha; g.fillStyle = col; g.beginPath();
    pts.forEach((p, i) => { const [x, y] = proj(p[0], p[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.closePath(); g.fill(); g.restore();
  }
  function ellipse(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }

  R.drawIdle = ctx => { if (bg) { ctx.imageSmoothingEnabled = false; ctx.drawImage(bg, 0, 0); } };

  // ---------- frame ----------
  R.draw = (ctx, info) => {
    const st = E.st; if (!st || !bg) return;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (st.shake > 0) ctx.translate(Math.round(U.rand(-1, 1) * st.shake * 3), Math.round(U.rand(-1, 1) * st.shake * 3));
    ctx.drawImage(bg, 0, 0);
    // crowd
    const hype = info && info.hype || 0;
    crowd.forEach(c => {
      const bob = Math.max(0, Math.sin(st.t * (3 + hype * 6) + c.ph)) * (0.6 + hype * 2.2);
      const y = Math.round(c.y - bob);
      ctx.fillStyle = c.c; ctx.fillRect(c.x - 2, y + 2, 5, 3);
      ctx.fillStyle = c.s; ctx.fillRect(c.x - 1, y - 1, 3, 3);
      if (hype > 0.5 && (c.ph * 10 | 0) % 3 === 0) { ctx.fillStyle = c.s; ctx.fillRect(c.x - 3, y - 3 - (bob | 0), 1, 3); ctx.fillRect(c.x + 3, y - 3 - (bob | 0), 1, 3); }
    });
    drawHoopBack(ctx, st);
    // depth sort players + ball
    const list = st.ents.map(e => ({ y: e.y, e }));
    const b = st.ball;
    const ballVisible = b.s !== 'hold' || !b.h;
    if (ballVisible) list.push({ y: b.s === 'shot' || b.s === 'net' ? Math.min(b.y, 5.3) : b.y + 0.05, ball: true });
    list.sort((a, c) => a.y - c.y);
    // shadows first
    st.ents.forEach(e => shadow(ctx, e.x, e.y, 5, e.z));
    if (b.s !== 'hold') shadow(ctx, b.x, b.y, 2, b.z);
    // indicators under feet
    indicators(ctx, st);
    list.forEach(o => o.ball ? drawBall(ctx, b.x, b.y, b.z) : drawPlayer(ctx, o.e, st));
    drawHoopFront(ctx, st);
    st.parts.forEach(p => { const [x, y] = proj(p.x, p.y, p.z); ctx.fillStyle = p.c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); });
    // shot meter
    const sh = st.ents.find(e => e.state === 'shoot' && e.userShot && !e.released);
    if (sh) meter(ctx, sh);
    if (st.phase === 'ft' && st.ftState === 'meter' && st.cfg.user === 'off') ftMeter(ctx, st);
    // labels
    st.ents.forEach(e => { if (e.labelT > 0 && e.label) { const [x, y] = proj(e.x, e.y, e.z + 9); const col = e.label === 'PERFECT' ? '#7cff6b' : e.label === 'GOOD' ? '#ffd23f' : '#ff7070'; U.pixText(ctx, e.label, Math.round(x - U.pixW(e.label) / 2), Math.round(y - 8), '#000'); U.pixText(ctx, e.label, Math.round(x - U.pixW(e.label) / 2), Math.round(y - 9), col); } });
    ctx.restore();
    // pops (screen space, not shaken)
    st.pops.forEach((p, i) => {
      const k = p.t / p.life, s = p.s, w = U.pixW(p.text, s);
      let y = 140 + p.y - Math.min(1, p.t * 6) * 10 - k * 6;
      const x = Math.round(W / 2 - w / 2);
      if (k > 0.8 && ((p.t * 20) | 0) % 2) return;
      U.pixText(ctx, p.text, x + 1, Math.round(y) + 1, '#000', s);
      U.pixText(ctx, p.text, x, Math.round(y), p.col, s);
    });
  };

  function shadow(ctx, x, y, r, z) {
    const [sx, sy] = proj(x, y, 0); const k = Math.max(0.4, 1 - z / 14);
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(Math.round(sx - r * k), Math.round(sy), Math.round(r * 2 * k), 2);
    ctx.fillRect(Math.round(sx - r * k + 1), Math.round(sy - 1), Math.round(r * 2 * k - 2), 1);
  }
  function indicators(ctx, st) {
    const u = st.user;
    if (u) { const [x, y] = proj(u.x, u.y, 0); ctx.fillStyle = '#ffd23f'; ring(ctx, x, y, 6); }
    if (st.cfg.user === 'off' && st.ball.s === 'hold' && st.ball.h.side === 0 && st.phase === 'live') {
      st.ents.forEach(e => {
        if (e.side !== 0 || e.ball) return;
        const o = E.openness(e); const [x, y] = proj(e.x, e.y, 0);
        ctx.fillStyle = o > 5.5 ? '#3dff6a' : o > 3.2 ? '#ffd23f' : '#ff4d4d';
        ring(ctx, x, y, 4);
      });
    }
  }
  function ring(ctx, x, y, r) { x = Math.round(x); y = Math.round(y); ctx.fillRect(x - r, y, 2, 1); ctx.fillRect(x + r - 1, y, 2, 1); ctx.fillRect(x - r + 2, y - 1, r * 2 - 3, 1); ctx.fillRect(x - r + 2, y + 1, r * 2 - 3, 1); }

  function drawBall(ctx, x, y, z) {
    const [sx, sy] = proj(x, y, z); const X = Math.round(sx) - 1, Y = Math.round(sy) - 2;
    ctx.fillStyle = '#1b0f05'; ctx.fillRect(X - 1, Y, 5, 3); ctx.fillRect(X, Y - 1, 3, 5);
    ctx.fillStyle = '#ef7d2a'; ctx.fillRect(X, Y, 3, 3);
    ctx.fillStyle = '#ffb067'; ctx.fillRect(X, Y, 1, 1);
    const st = E.st;
    if (st.ball.fire || (st.ball.s === 'shot' && st.ball.shooter && st.ball.shooter.fire)) { ctx.fillStyle = U.pick(['#ffd23f', '#ff5a1f', '#ff2a00']); ctx.fillRect(X + U.irand(-2, 3), Y + U.irand(1, 4), 1, 1); }
  }

  function drawHoopBack(ctx, st) {
    // stanchion + backboard
    const [bx, by] = proj(0, 4, 0);
    const [, topY] = proj(0, 4, 13.5), [, botY] = proj(0, 4, 9.6);
    const [l] = proj(-3, 4, 0), [r] = proj(3, 4, 0);
    ctx.fillStyle = '#2a2f45'; ctx.fillRect(Math.round(bx) - 1, Math.round(botY), 3, Math.round(by - botY));
    ctx.fillStyle = 'rgba(220,240,255,0.55)'; ctx.fillRect(Math.round(l), Math.round(topY), Math.round(r - l), Math.round(botY - topY));
    ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(l), Math.round(topY), Math.round(r - l), 1); ctx.fillRect(Math.round(l), Math.round(botY), Math.round(r - l), 1);
    ctx.fillRect(Math.round(l), Math.round(topY), 1, Math.round(botY - topY)); ctx.fillRect(Math.round(r) - 1, Math.round(topY), 1, Math.round(botY - topY));
    const [, sqT] = proj(0, 4, 11.5);
    ctx.strokeStyle = '#fff'; ctx.fillRect(Math.round(bx) - 3, Math.round(sqT), 7, 1); ctx.fillRect(Math.round(bx) - 3, Math.round(sqT), 1, 4); ctx.fillRect(Math.round(bx) + 3, Math.round(sqT), 1, 4);
    // back of rim
    const [rx, ry] = proj(0, 5.25, 10);
    ctx.fillStyle = '#b8401a'; ctx.fillRect(Math.round(rx) - 4, Math.round(ry) - 1, 9, 1);
  }
  function drawHoopFront(ctx, st) {
    const [rx, ry] = proj(0, 5.25, 10), X = Math.round(rx), Y = Math.round(ry);
    const shake = st.rimT > 0 ? ((st.t * 40) | 0) % 2 : 0; if (st.rimT > 0) st.rimT -= 1 / 60;
    // net
    const sw = st.netT > 0 ? Math.sin(st.t * 30) : 0; if (st.netT > 0) st.netT -= 1 / 60;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 6; i++) { const yy = Y + 1 + i; const w = 9 - Math.floor(i * 0.7); for (let x = 0; x < w; x += 2) ctx.fillRect(X - Math.floor(w / 2) + x + (i % 2) + Math.round(sw * (i / 6)), yy, 1, 1); }
    ctx.fillStyle = '#ef4a1a'; ctx.fillRect(X - 5, Y + shake, 11, 2);
    ctx.fillStyle = '#ff7a3a'; ctx.fillRect(X - 5, Y + shake, 11, 1);
  }

  // ---------- players ----------
  function drawPlayer(ctx, e, st) {
    const p = e.pl, jer = e.side === 0 ? st.cfg.off : st.cfg.def;
    const [sx, sy] = proj(e.x, e.y, e.z);
    const X = Math.round(sx), Y = Math.round(sy);
    const skin = CK.SKIN[p.skin], hair = CK.HAIR[p.hc];
    const legH = 6 + Math.round((p.ht - 76) / 4);
    const moving = Math.hypot(e.vx, e.vy) > 2 && e.z <= 0;
    const step = moving ? (Math.floor(e.run * 1.6) % 2 ? 1 : -1) : 0;
    if (e.fell) { // on the floor
      ctx.fillStyle = jer.jersey; ctx.fillRect(X - 6, Y - 4, 8, 4); ctx.fillStyle = skin; ctx.fillRect(X + 2, Y - 4, 4, 3); ctx.fillRect(X - 9, Y - 2, 3, 2);
      ctx.fillStyle = jer.trim; ctx.fillRect(X - 6, Y - 1, 8, 1); return;
    }
    const air = e.z > 0.3;
    // legs
    ctx.fillStyle = skin;
    if (air) { ctx.fillRect(X - 3, Y - legH, 2, legH - 1); ctx.fillRect(X + 1, Y - legH, 2, legH - 2); }
    else { ctx.fillRect(X - 3 + (step > 0 ? -1 : 0), Y - legH, 2, legH); ctx.fillRect(X + 1 + (step < 0 ? 1 : 0), Y - legH, 2, legH); }
    // shoes
    ctx.fillStyle = jer.shoe || '#f2f2f2';
    ctx.fillRect(X - 4 + (step > 0 ? -1 : 0), Y - 1 - (air ? 1 : 0), 3, 1); ctx.fillRect(X + 1 + (step < 0 ? 1 : 0), Y - 1 - (air ? 2 : 0), 3, 1);
    // shorts
    const sh = Y - legH - 3;
    ctx.fillStyle = jer.shorts || jer.jersey; ctx.fillRect(X - 4, sh, 8, 4);
    ctx.fillStyle = jer.trim; ctx.fillRect(X - 4, sh + 3, 1, 1); ctx.fillRect(X + 3, sh + 3, 1, 1);
    // torso
    const ty = sh - 7;
    ctx.fillStyle = jer.jersey; ctx.fillRect(X - 4, ty, 8, 8);
    ctx.fillStyle = jer.trim; ctx.fillRect(X - 4, ty, 1, 8); ctx.fillRect(X + 3, ty, 1, 8); ctx.fillRect(X - 2, ty, 4, 1);
    // number
    const num = String(p.num); const nw = U.pixW(num);
    if (nw <= 7) U.pixText(ctx, num, X - Math.ceil(nw / 2), ty + 2, jer.trim, 1);
    // arms
    ctx.fillStyle = skin;
    const up = e.state === 'shoot' || e.state === 'jump' || (e.state === 'fin' && e.z > 1) || e.hang > 0 || e.state === 'ftm';
    if (up) { ctx.fillRect(X - 5, ty - 6, 2, 7); ctx.fillRect(X + 3, ty - 6, 2, 7); }
    else if (e.state === 'reach') { ctx.fillRect(X - 6 + (e.face > 0 ? 8 : 0), ty + 2, 5, 2); ctx.fillRect(X + (e.face > 0 ? -6 : 4), ty + 1, 2, 5); }
    else if (e.side === 1 && st.phase === 'live') { ctx.fillRect(X - 6, ty + 1, 2, 2); ctx.fillRect(X - 7, ty - 2, 2, 4); ctx.fillRect(X + 4, ty + 1, 2, 2); ctx.fillRect(X + 5, ty - 2, 2, 4); }
    else { const sw = moving ? step : 0; ctx.fillRect(X - 6, ty + 1 + sw, 2, 6); ctx.fillRect(X + 4, ty + 1 - sw, 2, 6); }
    // head
    const hy = ty - 6;
    ctx.fillStyle = skin; ctx.fillRect(X - 3, hy, 6, 6);
    ctx.fillStyle = hair;
    switch (p.hair) {
      case 0: ctx.fillRect(X - 3, hy, 6, 1); break; // buzz
      case 1: ctx.fillRect(X - 4, hy - 2, 8, 3); ctx.fillRect(X - 4, hy, 1, 3); ctx.fillRect(X + 3, hy, 1, 3); break; // afro
      case 2: ctx.fillRect(X - 3, hy - 2, 6, 3); break; // flat top
      case 3: ctx.fillRect(X - 3, hy - 1, 6, 2); ctx.fillRect(X - 3, hy + 1, 1, 2); break; // side part
      case 4: ctx.fillRect(X - 3, hy - 1, 6, 2); ctx.fillStyle = jer.trim; ctx.fillRect(X - 3, hy + 1, 6, 1); break; // headband
      default: break; // bald
    }
    if (!e.back) { ctx.fillStyle = '#1a1010'; ctx.fillRect(X - 1 + (e.face > 0 ? 1 : 0), hy + 3, 1, 1); ctx.fillRect(X + 1 + (e.face > 0 ? 1 : 0), hy + 3, 1, 1); }
    // ball in hands
    const b = st.ball;
    if (b.s === 'hold' && b.h === e) {
      if (up || e.state === 'fin') drawBall(ctx, e.x, e.y - 0.1, e.z + (up ? 9.2 : 6));
      else drawBall(ctx, b.x, b.y, b.z);
    }
    // on fire
    if (e.fire) { for (let i = 0; i < 3; i++) { ctx.fillStyle = U.pick(['#ffd23f', '#ff7a1a', '#ff3a1a']); ctx.fillRect(X - 3 + U.irand(0, 6), hy - 3 - U.irand(0, 4), 1, 2); } }
    // user marker
    if (e === st.user) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(X - 2, hy - 7, 5, 1); ctx.fillRect(X - 1, hy - 6, 3, 1); ctx.fillRect(X, hy - 5, 1, 1); }
  }

  function meter(ctx, e) {
    const [sx, sy] = proj(e.x, e.y, e.z);
    const X = Math.round(sx) + 9, Y = Math.round(sy) - 30, Hh = 26;
    const m = U.clamp(e.stT / E.METER_T, 0, 1.3) / 1.3;
    ctx.fillStyle = '#000'; ctx.fillRect(X - 1, Y - 1, 5, Hh + 2);
    ctx.fillStyle = '#333'; ctx.fillRect(X, Y, 3, Hh);
    // sweet window
    const c = 0.86 / 1.3, w = e.win / 1.3;
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(X, Math.round(Y + Hh - (c + w) * Hh), 3, Math.max(1, Math.round(w * 2 * Hh)));
    ctx.fillStyle = '#3dff6a'; ctx.fillRect(X, Math.round(Y + Hh - (c + w * 0.42) * Hh), 3, Math.max(1, Math.round(w * 0.84 * Hh)));
    ctx.fillStyle = '#fff'; ctx.fillRect(X - 1, Math.round(Y + Hh - m * Hh), 5, 1);
  }
  function ftMeter(ctx, st) {
    const m = st.ftM || 0, X = 68, Y = 300, Wd = 80;
    ctx.fillStyle = '#000'; ctx.fillRect(X - 1, Y - 1, Wd + 2, 7);
    ctx.fillStyle = '#333'; ctx.fillRect(X, Y, Wd, 5);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(X + Wd * 0.35, Y, Wd * 0.3, 5);
    ctx.fillStyle = '#3dff6a'; ctx.fillRect(X + Wd * 0.45, Y, Wd * 0.1, 5);
    ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(X + m * Wd), Y - 2, 1, 9);
    U.pixText(ctx, 'TAP TO SHOOT', X + 16, Y + 9, '#fff');
  }
})(window.CK);
