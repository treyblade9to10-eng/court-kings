// Court Kings - on-court possession engine (half court, 10 players, ball physics, AI)
(function (CK) {
  const U = CK.U, E = CK.CT = {};
  // landscape side view: hoop on the right. court x (sideline to sideline) runs down the screen,
  // court y (baseline -> half court) runs right -> left, z is height.
  const W = 400, H = 225, BX = 372, YM = 128, KY = 7.0, KX = 2.9, SK = 0.55, ZS = 3.0;
  const HX = 0, HY = 5.25, RIM = 10;
  E.W = W; E.H = H;
  // full court: world Y runs 0 (right baseline) .. 94 (left baseline). Each possession works in a local
  // frame where the offense attacks the hoop at y=5.25; st.dir=-1 mirrors it onto the left end.
  // E.cam = camera offset in screen px (set by the renderer).
  E.cam = 0; E.FULL = 94;
  E.K = { BX, YM, KY, KX, SK, ZS };
  const projW = E.projW = (X, Y, z) => [BX - Y * KY + X * SK - E.cam, YM + X * KX - (z || 0) * ZS];
  E.toW = (x, y, d) => d > 0 ? [x, y] : [-x, 94 - y];
  E.toL = (X, Y, d) => d > 0 ? [X, Y] : [-X, 94 - Y];
  const proj = E.proj = (x, y, z) => { const d = E.st && E.st.dir || 1; return d > 0 ? projW(x, y, z) : projW(-x, 94 - y, z); };
  const is3 = E.is3 = (x, y) => y <= 14 ? Math.abs(x) >= 22 : Math.hypot(x - HX, y - HY) >= 23.75;
  const dHoop = e => Math.hypot(e.x - HX, e.y - HY);
  const SPOTS = [[0, 29], [-17, 20], [17, 20], [-21.5, 4], [8, 9], [21.5, 4], [-8, 9], [-11, 16], [11, 16], [0, 22]];
  const HOME = [0, 1, 2, 3, 4]; // slot index -> starting spot

  // ---------- start a possession ----------
  // cfg: { off:{team,players[5],jersey,trim,num}, def:{...}, user:'off'|'def', diff, clock, onEnd, onFx, fire:{pid:true} }
  E.start = cfg => {
    const st = E.st = {
      cfg, t: 0, ents: [], ball: null, sc: 24, phase: 'live', pops: [], parts: [], shake: 0, endT: 0, done: false,
      box: {}, pts: 0, later: [], lastPass: null, user: null, idleT: 0, hl: [], decideT: 0.8, helpT: 0, ftLeft: 0
    };
    st.dir = cfg.dir || 1; st.both = !!cfg.both; st.flow = !!cfg.flow;
    st.gc = cfg.clock == null ? 1e9 : cfg.clock;
    if (st.both) cfg.diff = 2;
    const dm = [0.82, 0.92, 1, 1.07][cfg.diff == null ? 1 : cfg.diff];
    st.aiMul = { off: cfg.user === 'def' && !st.both ? 1 / dm * 1.02 : 1, def: cfg.user === 'off' && !st.both ? dm : 1 };
    const P = cfg.pos;
    const at = (pl, x, y) => P && P[pl.id] ? E.toL(P[pl.id][0], P[pl.id][1], st.dir) : [x, y];
    cfg.off.players.forEach((pl, i) => {
      const sp = SPOTS[HOME[i]];
      const [x, y] = at(pl, i === 0 ? 0 : sp[0], i === 0 ? 33 : sp[1] + 2);
      const e = mkEnt(pl, 0, i, x, y); e.home = HOME[i]; e.spot = HOME[i]; e.cutT = U.rand(1.5, 4);
      st.ents.push(e);
    });
    cfg.def.players.forEach((pl, i) => {
      const m = st.ents[i];
      const [x, y] = at(pl, m.x * 0.85, m.y - 4);
      const e = mkEnt(pl, 1, i, x, y); e.man = m; m.dfn = e; st.ents.push(e);
    });
    let pg = st.ents[0];
    if (cfg.handler) { const h = st.ents.find(e => e.side === 0 && e.id === cfg.handler); if (h) pg = h; }
    else if (cfg.inbound) {
      // inbound: under the far basket after a make, otherwise at the sideline where it died
      if (cfg.inbAt) { const [x, y] = E.toL(cfg.inbAt[0], cfg.inbAt[1], st.dir); pg.x = pg.tx = (x < 0 ? -1 : 1) * 24; pg.y = pg.ty = U.clamp(y, 3, 90); }
      else { pg.x = pg.tx = U.pick([-4, 4]); pg.y = pg.ty = 91.5; }
    }
    st.ball = { s: 'hold', h: pg, x: pg.x, y: pg.y, z: 3, vx: 0, vy: 0, vz: 0, t: 0 };
    pg.ball = true;
    st.uo = cfg.user === 'off' || st.both ? pg : null;
    st.ud = cfg.user === 'def' || st.both ? pg.dfn : null;
    syncUser();
    st.msgT = 0;
    return st;
  };
  function syncUser() { const st = E.st; st.user = st.cfg.user === 'off' ? st.uo : st.cfg.user === 'def' ? st.ud : null; }
  const isHuman = e => e === E.st.uo || e === E.st.ud;
  function mkEnt(pl, side, i, x, y) {
    const r = pl.r;
    return {
      pl, id: pl.id, side, i, x, y, z: 0, vx: 0, vy: 0, vz: 0, tx: x, ty: y, face: 1, run: 0,
      spd: 12.5 + r.ath * 0.55 + (pl.pos === 'PG' ? 0.6 : pl.pos === 'C' ? -0.8 : 0), state: 'run', stT: 0, stun: 0,
      ht: pl.ht, fire: false, cd: 0, jumpT: 0
    };
  }
  const offE = () => E.st.ents.filter(e => e.side === 0);
  const defE = () => E.st.ents.filter(e => e.side === 1);
  const B = (pid) => E.st.box[pid] || (E.st.box[pid] = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, gp: 1 });
  const pop = (text, x, y, col, s, life) => { E.st.pops.push({ text, x, y, col: col || '#fff', s: s || 2, t: 0, life: life || 1.3 }); };
  E.pop = pop;
  const fx = (k, d) => { const f = E.st.cfg.onFx; if (f) f(k, d); };
  const say = t => { const f = E.st.cfg.onSay; if (f) f(t); };
  const NM = e => e.pl.ln.toUpperCase();
  const burst = (x, y, z, n, cols, spd) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = U.rand(2, spd || 14); E.st.parts.push({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: U.rand(4, 18), t: 0, life: U.rand(0.6, 1.4), c: U.pick(cols) }); } };
  const nearestDef = (e, list) => { let best = null, bd = 99; (list || (e.side === 0 ? defE() : offE())).forEach(d => { const dd = Math.hypot(d.x - e.x, d.y - e.y); if (dd < bd) { bd = dd; best = d; } }); return [best, bd]; };
  E.openness = e => nearestDef(e)[1];
  const inFront = (d, e) => { const hx = HX - e.x, hy = HY - e.y, l = Math.hypot(hx, hy) || 1; return ((d.x - e.x) * hx + (d.y - e.y) * hy) / l > -0.5; };

  // contest value of defenders on a shooter (0..1)
  function contest(e) {
    let c = 0;
    defOf(e).forEach(d => {
      if (d.stun > 0) return;
      const dd = Math.hypot(d.x - e.x, d.y - e.y); if (dd > 6.5) return;
      let v = (6.5 - dd) / 6.5 * (inFront(d, e) ? 1 : 0.45) * (0.55 + d.pl.r.def * 0.05) * (1 + (d.ht - e.ht) * 0.015);
      if (d.z > 0.8) v *= 1.3;
      if (d.boost) v *= 1.25;
      if (d.blockT > 0) v *= 1.15;
      if (e.stepT > 0) v *= 0.7;
      c = Math.max(c, v);
    });
    return U.clamp(c, 0, 1);
  }
  const defOf = e => E.st.ents.filter(d => d.side !== e.side);

  // ---------- main update ----------
  E.update = (dt, IN, IN2) => {
    const st = E.st; if (!st) return;
    const cu = st.cfg.user, inOff = cu === 'off' ? IN : st.both ? IN2 : null, inDef = cu === 'def' ? IN : st.both ? IN2 : null;
    st.t += dt; st.shake = Math.max(0, st.shake - dt * 2.5);
    if (st.later.length) { st.later.forEach(l => l.t -= dt); const due = st.later.filter(l => l.t <= 0); st.later = st.later.filter(l => l.t > 0); due.forEach(l => l.fn()); }
    const b = st.ball;
    if (st.phase === 'live') {
      if (b.s === 'hold' || b.s === 'pass') st.sc -= dt;
      st.gc -= dt;
      if (st.gc <= 0 && b.s !== 'shot' && b.s !== 'net') { st.gc = 0; fx('buzzer'); end('clock', 'End of quarter', 0.9); }
      else if (st.sc <= 0 && st.gc > 0.5 && (b.s === 'hold' || b.s === 'pass')) { pop('SHOT CLOCK', 0, 30, '#ff5050', 2); fx('buzzer'); end('tov', 'Shot clock violation'); }
      control(dt, inOff, 'off'); control(dt, inDef, 'def'); syncUser();
      st.ents.forEach(e => ai(e, dt));
    } else if (st.phase === 'ft') ftUpdate(dt, inOff);
    st.ents.forEach(e => physics(e, dt));
    ballUpdate(dt);
    st.parts.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= 30 * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= 0.6; p.vy *= 0.6; } });
    st.parts = st.parts.filter(p => p.t < p.life);
    st.pops.forEach(p => p.t += dt); st.pops = st.pops.filter(p => p.t < p.life);
    if (st.phase === 'end') {
      st.endT -= dt;
      if (st.endT <= 0 && !st.done) {
        st.done = true; const r = st.result;
        // hand the next possession where everyone is standing (full court flow)
        r.pos = {}; st.ents.forEach(e => r.pos[e.id] = E.toW(e.x, e.y, st.dir));
        r.holder = b.s === 'hold' && b.h ? b.h.id : null; r.holderSide = r.holder ? b.h.side : null;
        r.ballW = E.toW(b.x, b.y, st.dir); r.gc = st.gc; r.dead = b.s === 'dead';
        st.cfg.onEnd && st.cfg.onEnd(r);
      }
    }
  };

  function later(fn, t) { E.st.later.push({ fn, t }); }
  function end(tag, text, delay) {
    const st = E.st; if (st.phase === 'end') return;
    st.phase = 'end'; st.endT = delay || 1.4;
    if (st.flow) st.endT = tag === 'make' ? Math.min(st.endT, 1.0) : tag === 'clock' ? 0.9 : Math.min(st.endT, 0.3);
    st.result = { tag, text, pts: st.pts, box: st.box, hl: st.hl, sc: st.sc };
  }

  // ---------- user input ----------
  function control(dt, IN, side) {
    const st = E.st;
    if (!IN) return;
    const mag = Math.hypot(IN.jx, IN.jy);
    if (side === 'off') {
      const h = st.ball.s === 'hold' ? st.ball.h : null;
      if (h && h.side === 0) st.uo = h;
      const e = st.uo; if (!e) return;
      if (mag > 0.15 && e.state === 'run' && e.stun <= 0) { e.tx = e.x + IN.jx / Math.max(1, mag) * 6; e.ty = e.y + IN.jy / Math.max(1, mag) * 6; e.userMove = mag; }
      else { e.userMove = 0; if (h === e && e.state === 'run') { e.tx = e.x; e.ty = e.y; } }
      if (h === e && e.state === 'run') {
        if (IN.tap) { const tm = tapTarget(IN.tap); if (tm && tm !== e) passTo(e, tm); }
        if (IN.pass != null) { const tm = offE()[IN.pass]; if (tm && tm !== e) passTo(e, tm); }
        if (IN.Bp) { const tm = bestPass(e, IN.jx, IN.jy); if (tm) passTo(e, tm); }
        if ((IN.Cp || IN.mv) && e.cd <= 0) dribMove(e, IN.mv || 'cross', IN);
        if (IN.Ap) startShot(e, true);
      }
      if (e.state === 'shoot' && e.userShot && !e.released && (IN.Ar || !IN.A)) release(e);
    } else {
      // defense: the human guards whoever has the ball
      const h = st.ball.s === 'hold' && st.ball.h.side === 0 ? st.ball.h : null;
      if (h && h.dfn && st.ud !== h.dfn && (!st.ud || st.ud.state === 'run')) st.ud = h.dfn;
      const e = st.ud; if (!e) return;
      if (mag > 0.15 && e.stun <= 0 && e.state === 'run') { e.tx = e.x + IN.jx / Math.max(1, mag) * 6; e.ty = e.y + IN.jy / Math.max(1, mag) * 6; e.userMove = mag; }
      else e.userMove = 0;
      if (IN.Ap && e.state === 'run' && e.z <= 0) {
        // jumping while the shot is going up = a BLOCK attempt (a little more reach)
        const b = st.ball, up = (b.s === 'hold' && b.h && b.h.side === 0 && (b.h.state === 'shoot' || b.h.state === 'fin')) || b.s === 'shot';
        e.state = 'jump'; e.vz = 12 + e.pl.r.ath * 0.25 + (up ? 1 : 0); e.stT = 0; e.userJump = true; e.blockT = up ? 0.7 : 0; fx('jump');
      }
      if ((IN.Cp || IN.mv === 'cross') && e.cd <= 0 && e.state === 'run') stealTry(e, true);
    }
  }
  function tapTarget(t) {
    const st = E.st; let best = null, bd = 16;
    st.ents.forEach(e => { if (e.side !== 0) return; const [sx, sy] = proj(e.x, e.y, e.z + 3); const d = Math.hypot(sx - t.x, sy - t.y); if (d < bd) { bd = d; best = e; } });
    return best;
  }
  function bestPass(e, jx, jy) {
    let best = null, bs = -1e9; const m = Math.hypot(jx, jy);
    offE().forEach(t => {
      if (t === e) return;
      let s = E.openness(t) * 2 - Math.hypot(t.x - e.x, t.y - e.y) * 0.15 + (is3(t.x, t.y) ? t.pl.r.sht * 0.3 : (dHoop(t) < 9 ? 4 : 0));
      if (m > 0.3) { const dx = t.x - e.x, dy = t.y - e.y, l = Math.hypot(dx, dy) || 1; s += ((dx * jx + dy * jy) / (l * m)) * 12; }
      if (s > bs) { bs = s; best = t; }
    });
    return best;
  }

  // ---------- moves ----------
  // dribble moves: cross (E), spin (F), hesi (R), step-back (Q), behind the back (C)
  function dribMove(e, kind, IN) {
    if (kind === 'cross') return crossover(e, IN);
    const st = E.st; fx('dribble');
    const [d, dd] = nearestDef(e);
    let hx = HX - e.x, hy = HY - e.y; const hl = Math.hypot(hx, hy) || 1; hx /= hl; hy /= hl;
    const sk = (e.pl.r.pas - (d ? d.pl.r.def : 5)) * 0.03 + (e.pl.r.ath - (d ? d.pl.r.ath : 5)) * 0.015 + (e.fire ? 0.1 : 0);
    const close = d && dd < 4 && d.stun <= 0;
    const ankles = mul => { if (close && Math.random() < U.clamp((0.06 + sk) * mul, 0.03, 0.5) / (e.side === 0 ? st.aiMul.def : 1)) { d.stun = 1.1; d.fell = true; pop('ANKLES!', 0, 34, '#ffd23f', 3); st.shake = 0.5; fx('ankles'); st.hl.push('ankles'); say(NM(e) + ' SENDS ' + NM(d) + ' TO THE FLOOR!'); return true; } return false; };
    if (kind === 'spin') {
      e.cd = 1.5; e.spinT = 0.42;
      let px = d ? -(d.y - e.y) : -hy, py = d ? (d.x - e.x) : hx; const pl = Math.hypot(px, py) || 1; px /= pl; py /= pl;
      if (px * hx + py * hy < 0) { px = -px; py = -py; }
      const vx = hx * 0.6 + px * 0.8, vy = hy * 0.6 + py * 0.8, vl = Math.hypot(vx, vy) || 1;
      e.vx = vx / vl * e.spd * 1.45; e.vy = vy / vl * e.spd * 1.45; e.burst = 0.42;
      if (!ankles(d && inFront(d, e) ? 1.25 : 0.8) && close && Math.random() < 0.07 * (d.pl.r.def / 10)) stealBall(d, e);
    } else if (kind === 'hesi') {
      e.cd = 1.25; e.vx = e.vy = 0; e.burst = 0.26; e.hesiT = 0.26;
      if (close && Math.random() < U.clamp(0.28 + sk, 0.1, 0.6)) { d.stun = Math.max(d.stun, 0.55); pop('HESI!', 0, 30, '#7cd6ff', 2); }
    } else if (kind === 'step') {
      e.cd = 1.4; e.stepT = 0.9;
      let ax = d ? e.x - d.x : -hx, ay = d ? e.y - d.y : -hy; const al = Math.hypot(ax, ay) || 1;
      e.vx = (ax / al * 0.6 - hx * 0.6) * e.spd * 1.3; e.vy = (ay / al * 0.6 - hy * 0.6) * e.spd * 1.3; e.burst = 0.3;
      ankles(0.5);
    } else if (kind === 'btb') {
      e.cd = 1.0;
      let dx = IN ? IN.jx : 0, dy = IN ? IN.jy : 0;
      if (Math.hypot(dx, dy) < 0.3 && d) { dx = -(d.y - e.y); dy = (d.x - e.x); if (Math.random() < 0.5) { dx = -dx; dy = -dy; } }
      const l = Math.hypot(dx, dy) || 1; e.vx = dx / l * e.spd * 1.35; e.vy = dy / l * e.spd * 1.35; e.burst = 0.3;
      ankles(0.7);
    }
  }
  function crossover(e, IN) {
    const st = E.st; e.cd = 1.3; fx('dribble');
    const [d, dd] = nearestDef(e);
    let dx = IN ? IN.jx : 0, dy = IN ? IN.jy : 0;
    if (Math.hypot(dx, dy) < 0.3 && d) { dx = -(d.y - e.y); dy = (d.x - e.x); if (Math.random() < 0.5) { dx = -dx; dy = -dy; } }
    const l = Math.hypot(dx, dy) || 1; e.vx = dx / l * e.spd * 1.55; e.vy = dy / l * e.spd * 1.55; e.burst = 0.35;
    if (d && dd < 3.8 && d.stun <= 0) {
      const p = 0.06 + (e.pl.r.pas - d.pl.r.def) * 0.03 + (e.pl.r.ath - d.pl.r.ath) * 0.015 + (e.fire ? 0.12 : 0) - (inFront(d, e) ? 0 : 0.05);
      if (Math.random() < U.clamp(p, 0.04, 0.5) / (e.side === 0 ? st.aiMul.def : 1)) {
        d.stun = 1.1; d.fell = true; pop('ANKLES!', 0, 34, '#ffd23f', 3); st.shake = 0.5; fx('ankles'); st.hl.push('ankles'); say(NM(e) + ' SENDS ' + NM(d) + ' TO THE FLOOR!');
      } else if (Math.random() < 0.05 * (d.pl.r.def / 10)) {
        // poked loose
        stealBall(d, e); return;
      }
    }
  }
  function stealTry(d, isUser) {
    const st = E.st, b = st.ball; d.cd = isUser ? 0.9 : 1.6; d.state = 'reach'; d.stT = 0;
    if (b.s !== 'hold' || b.h.side === d.side) return;
    const h = b.h, dd = Math.hypot(h.x - d.x, h.y - d.y);
    if (dd > 4) return;
    let p = 0.17 + d.pl.r.def * 0.025 - h.pl.r.pas * 0.018 + (h.state === 'shoot' ? -0.3 : 0);
    if (!isUser) p *= 0.8;
    if (Math.random() < U.clamp(p, 0.03, 0.45)) stealBall(d, h);
    else if (isUser && Math.random() < 0.13) { pop('REACH-IN FOUL', 0, 30, '#ffb347', 2); fx('whistle'); st.sc = Math.max(st.sc, 14); h.vx = h.vy = 0; d.stun = 0.4; }
  }
  function stealBall(d, h) {
    const st = E.st, b = st.ball;
    h.ball = false; b.s = 'loose'; b.missT = null; b.src = 'poke'; b.vx = (d.x - h.x) * 2 + U.rand(-3, 3); b.vy = (d.y - h.y) * 2 + U.rand(-3, 3); b.vz = 6; b.lastTouch = d.side; b.steal = d;
    pop('STOLEN!', 0, 34, d.side === 1 && st.cfg.user === 'def' ? '#7cff6b' : '#ff5050', 3); fx('steal'); st.shake = 0.3; say(NM(d) + ' WITH THE STEAL!');
  }

  // ---------- passing ----------
  function passTo(e, t) {
    const st = E.st, b = st.ball;
    const dist = Math.hypot(t.x - e.x, t.y - e.y);
    const lob = dHoop(t) < 10 && t.pl.r.ath >= 6 && t.cutting && t.y < 14;
    const spd = lob ? 26 : 40 + e.pl.r.pas * 1.2;
    let T = U.clamp(dist / spd, 0.18, 1.0);
    let tx = t.x + t.vx * T * 0.8, ty = t.y + t.vy * T * 0.8;
    if (lob) { tx = HX + (t.x - HX) * 0.25; ty = HY + 1.2; T = U.clamp(Math.hypot(tx - e.x, ty - e.y) / 24, 0.5, 1.1); t.oop = true; t.tx = tx; t.ty = ty; }
    e.ball = false; e.state = 'pass'; e.stT = 0;
    Object.assign(b, { s: 'pass', from: e, to: t, sx: e.x, sy: e.y, sz: 4.5, ex: tx, ey: ty, ez: lob ? 10.5 : 4.5, t: 0, T, lob, chk: new Set() });
    st.lastPass = { from: e, t: st.t };
    fx('pass');
  }

  // ---------- shooting ----------
  function startShot(e, isUser) {
    const st = E.st, d = dHoop(e);
    if (d < 7.5) return startFinish(e);
    e.state = 'shoot'; e.stT = 0; e.userShot = !!isUser; e.released = false; e.vx *= 0.2; e.vy *= 0.2;
    e.aiRel = 0.86 + U.gauss() * (0.16 - e.pl.r.sht * 0.009); // AI release timing
    e.win = 0.035 + e.pl.r.sht * 0.0085 + (e.fire ? 0.05 : 0) - (d > 27 ? 0.02 : 0);
    if (isUser && st.cfg.diff === 0) e.win += 0.03;
    if (isUser && st.cfg.film) e.win *= 1 + st.cfg.film * 0.06;   // Film Room upgrades
    fx('gather');
  }
  E.METER_T = 0.62;
  function release(e) {
    const st = E.st, b = st.ball; if (e.released) return;
    e.released = true;
    const m = e.stT / E.METER_T, diffM = m - 0.86;
    const ad = Math.abs(diffM);
    let q = U.clamp(1 - ad / (e.win * 3.2), 0, 1);
    const green = ad < e.win * 0.42;
    if (green && e.userShot) st.hl.push('green');
    const d = dHoop(e), three = is3(e.x, e.y);
    const c = contest(e);
    let p = d < 10 ? 0.5 : d < 16 ? 0.44 : d < 22.5 ? 0.41 : 0.38;
    if (d > 25.5) p -= (d - 25.5) * 0.035;
    p += (e.pl.r.sht - 5) * 0.035 + (e.fire ? 0.1 : 0);
    p *= 0.4 + 0.6 * q;
    p *= 1 - c * 0.6;
    if (e.side === 0 && st.cfg.user === 'off') p *= [1.12, 1.04, 1, 0.94][st.cfg.diff];
    if (e.side === 0 && st.cfg.user === 'def') p *= st.aiMul.off;
    if (e.side === 0 && st.cfg.user === 'off' && st.cfg.ocB) p *= 1 + st.cfg.ocB * 0.012;   // your coaching staff
    if (e.side === 0 && st.cfg.user === 'def' && st.cfg.dcB) p *= 1 - st.cfg.dcB * 0.012;
    if (green) p = c > 0.75 ? 0.6 : d > 30 ? 0.7 : 0.97;
    const make = Math.random() < U.clamp(p, 0.02, 0.98);
    // block?
    let blk = null;
    defOf(e).forEach(dd => { if (blk || dd.z < 1 || dd.stun > 0) return; const dist = Math.hypot(dd.x - e.x, dd.y - e.y); if (dist < 3.2 && inFront(dd, e) && Math.random() < 0.04 + dd.pl.r.def * 0.016 + (dd.ht - e.ht) * 0.008) blk = dd; });
    const foul = !blk && c > 0.55 && Math.random() < 0.11;
    const label = green ? 'PERFECT' : ad < e.win ? 'GOOD' : diffM < 0 ? 'EARLY' : 'LATE';
    if (e.side === 0 && (e.userShot || st.cfg.user === 'def')) { e.label = label; e.labelT = 0.9; }
    const bx = B(e.id); bx.fga++; if (three) bx.tpa++;
    launch(e, { make: make && !blk, three, green, blk, foul, kind: 'jump' });
  }
  function launch(e, r) {
    const st = E.st, b = st.ball, d = dHoop(e);
    e.ball = false;
    const T = r.kind === 'jump' ? 0.62 + d * 0.019 : 0.35;
    Object.assign(b, { s: 'shot', sx: e.x, sy: e.y, sz: e.z + 7.5, ex: HX, ey: HY + 0.2, ez: RIM + 0.4, t: 0, T, arc: r.kind === 'jump' ? 5 + d * 0.22 : 2, res: r, shooter: e });
    if (r.make) { b.ex += U.rand(-0.1, 0.1); }
    else { b.ex += U.pick([-1, 1]) * U.rand(0.6, 1); b.ey += U.rand(-0.6, 0.7); }
    if (r.blk) { b.T = 0.14; }
    fx('shoot');
  }
  function startFinish(e) {
    const st = E.st, r = e.pl.r;
    const c = contest(e);
    const dunk = (r.ins + r.ath >= 11 && c < 0.55) || (r.ath >= 8 && c < 0.75) || e.oopCatch;
    e.state = 'fin'; e.stT = 0; e.dunk = dunk; e.fx0 = e.x; e.fy0 = e.y;
    e.finC = c; fx('gather');
  }
  function finishRelease(e) {
    const st = E.st, r = e.pl.r, c = Math.max(e.finC, contest(e));
    let p = e.dunk ? 0.92 - c * 0.38 : 0.62 + (r.ins - 5) * 0.045 - c * 0.42;
    if (e.oopCatch) p = 0.8 + (r.ath - 6) * 0.03 - c * 0.3;
    if (e.side === 0 && st.cfg.user === 'off') p *= [1.12, 1.05, 1, 0.95][st.cfg.diff];
    if (e.side === 0 && st.cfg.user === 'def') p *= st.aiMul.off;
    if (e.fire) p += 0.12;
    let blk = null;
    defOf(e).forEach(dd => { if (blk || dd.stun > 0) return; const dist = Math.hypot(dd.x - e.x, dd.y - e.y); const air = dd.z > 1 ? 1 : 0.35; if (dist < 3.5 && Math.random() < (0.03 + dd.pl.r.def * 0.014 + (dd.ht - e.ht) * 0.008) * air * (e.dunk ? 0.6 : 1)) blk = dd; });
    const make = !blk && Math.random() < U.clamp(p, 0.05, 0.97);
    const foul = !blk && c > 0.4 && Math.random() < 0.16;
    const bx = B(e.id); bx.fga++;
    if (e.dunk && make) {
      // hammer it home
      const b = st.ball; e.ball = false; Object.assign(b, { s: 'net', x: HX, y: HY, z: RIM, t: 0, res: { make: true, three: false, foul, kind: 'dunk' }, shooter: e });
      e.hang = 0.45; st.shake = 0.9; fx('dunk'); burst(HX, HY, RIM, 26, ['#fff', '#ffd23f', '#ff8a1f'], 16);
      score(e, b.res); return;
    }
    launch(e, { make, three: false, blk, foul, kind: e.dunk ? 'dunk' : 'lay' });
    if (e.dunk && !make && !blk) { st.ball.T = 0.16; }
  }

  function score(e, r) {
    const st = E.st, pts = r.three ? 3 : 2, bx = B(e.id);
    bx.fgm++; bx.pts += pts; if (r.three) bx.tpm++;
    st.pts += pts;
    const lp = st.lastPass;
    if (lp && lp.from !== e && lp.from.side === e.side && st.t - lp.t < 4.5) B(lp.from.id).ast++;
    const user = st.cfg.user;
    const good = (e.side === 0 && user === 'off');
    let txt = r.kind === 'dunk' ? (e.oopCatch ? 'ALLEY-OOP!' : U.pick(['SLAM!', 'BOOM!', 'POSTER!', 'JAM!'])) : r.three ? (r.green ? 'SPLASH!' : '+3') : '+2';
    if (r.green && !r.three) txt = 'PURE!';
    pop(txt, 0, 26, good ? '#ffd23f' : '#ff7070', txt.length > 3 ? 3 : 3, 1.6);
    if (r.kind === 'dunk') st.hl.push(e.oopCatch ? 'oop' : 'dunk');
    if (r.green && r.three) st.hl.push('splash');
    st.scorer = e;
    say(r.kind === 'dunk' ? (e.oopCatch ? (lp && lp.from !== e ? NM(lp.from) + ' LOBS... ' : '') + NM(e) + ' THROWS IT DOWN!' : NM(e) + U.pick([' WITH THE HAMMER!', ' THROWS IT DOWN!', ' POSTERIZES HIM!'])) : r.three ? NM(e) + (r.green ? ' FROM DOWNTOWN... BANG!' : ' HITS THE THREE!') : NM(e) + U.pick([' SCORES.', ' KNOCKS IT DOWN.', ' GETS IT TO GO.']));
    if (r.foul) { pop('AND ONE', 0, 46, '#7cd6ff', 2, 1.6); fx('whistle'); later(() => { if (st.phase !== 'end') startFT(e, 1); }, 1.3); st.phase = 'wait'; return; }
    fx('cheer');
    end('make', '', 1.6);
  }

  // ---------- free throws ----------
  function startFT(e, n) {
    const st = E.st; st.phase = 'ft'; st.ftLeft = n; st.ftShooter = e; st.ftT = 0; st.ftState = 'set';
    const b = st.ball; b.s = 'hold'; b.h = e; e.ball = true; e.state = 'run'; e.z = 0; e.vz = 0;
    e.x = 0; e.y = 19; e.tx = 0; e.ty = 19;
    const lane = [[-7, 7], [7, 7], [-7, 11], [7, 11], [-7, 14], [7, 14], [-14, 24], [14, 24], [0, 32]];
    let k = 0; st.ents.forEach(o => { if (o === e) return; const s = lane[k++]; o.x = o.tx = s[0]; o.y = o.ty = s[1]; o.vx = o.vy = 0; o.state = 'run'; o.z = 0; });
    pop('FREE THROWS', 0, 30, '#fff', 2, 1.2);
  }
  function ftUpdate(dt, IN) {
    const st = E.st, e = st.ftShooter; st.ftT += dt;
    const userShoots = st.cfg.user === 'off' || st.both;
    if (st.ftState === 'set') {
      if (st.ftT > 0.9) { st.ftState = 'meter'; st.ftT = 0; e.state = 'ftm'; e.stT = 0; }
    } else if (st.ftState === 'meter') {
      e.stT += 0; // meter bounces
      const m = (Math.sin(st.ftT * 3.1 - 1.57) + 1) / 2; st.ftM = m;
      const go = userShoots ? (IN && (IN.Ap || IN.tap)) : st.ftT > 1.1 + Math.random() * 0.1;
      if (go) {
        const q = 1 - Math.abs(m - 0.5) * 2;
        let p = (userShoots ? 0.35 + q * 0.6 : 0.58 + e.pl.r.sht * 0.03) + (e.pl.r.sht - 5) * 0.02;
        const make = Math.random() < U.clamp(p, 0.1, 0.97);
        st.ftLeft--; st.ftState = 'fly'; st.ftT = 0;
        const b = st.ball; e.ball = false;
        Object.assign(b, { s: 'shot', sx: e.x, sy: e.y, sz: 7.5, ex: HX + (make ? 0 : U.pick([-0.9, 0.9])), ey: HY + 0.2, ez: RIM + 0.4, t: 0, T: 0.75, arc: 6, res: { make, ft: true }, shooter: e });
        fx('shoot');
      }
    }
  }
  function ftResolved(make) {
    const st = E.st, e = st.ftShooter;
    if (make) { st.pts++; B(e.id).pts++; fx('swish'); pop('GOOD', 0, 30, '#7cff6b', 2, 0.8); } else { fx('rim'); pop('NO GOOD', 0, 30, '#ff7070', 2, 0.8); }
    if (st.ftLeft > 0) { later(() => { const b = st.ball; b.s = 'hold'; b.h = e; e.ball = true; e.state = 'run'; st.ftState = 'set'; st.ftT = 0.3; }, 0.7); }
    else end(st.pts > 0 ? 'make' : 'miss', '', 1.2);
  }

  // ---------- AI ----------
  function ai(e, dt) {
    const st = E.st, b = st.ball;
    e.cd = Math.max(0, e.cd - dt);
    if (e.stun > 0) { e.stun -= dt; e.tx = e.x; e.ty = e.y; if (e.stun <= 0) e.fell = false; return; }
    if (e.state !== 'run') return;
    const isUser = (e === st.uo && (e.userMove || e.ball)) || (e === st.ud && e.userMove);
    if (b.s === 'loose') { if (!(isHuman(e) && e.userMove)) looseChase(e); return; }
    if (e.side === 0) {
      if (e.ball) { if (!isUser) aiHandler(e, dt); }
      else if (!isUser) offBall(e, dt);
    } else if (!isUser) defend(e, dt);
  }
  function looseChase(e) {
    const st = E.st, b = st.ball;
    const land = { x: b.x + b.vx * 0.4, y: b.y + b.vy * 0.4 };
    const mine = st.ents.filter(o => o.side === e.side).sort((a, c) => Math.hypot(a.x - land.x, a.y - land.y) - Math.hypot(c.x - land.x, c.y - land.y));
    if (mine.indexOf(e) < 3) { e.tx = land.x; e.ty = land.y; }
  }
  function offBall(e, dt) {
    const st = E.st, b = st.ball, h = b.s === 'hold' ? b.h : null;
    if (e.oop) return; // heading to the rim for a lob
    if (b.s === 'pass' && b.to === e) { e.tx = b.ex; e.ty = b.ey; return; } // come get the pass
    e.cutT -= dt;
    // pick and roll: bigs come set a screen on the ball handler's defender, then roll to the rim
    if (e.scr) {
      const hd = h && h.dfn;
      if (!h || !hd || h === e) e.scr = null;
      else {
        e.scr.t -= dt;
        if (!e.scr.set) {
          const tx = hd.x + e.scr.s * 1.8, ty = hd.y + 0.8;
          e.tx = tx; e.ty = ty;
          if (Math.hypot(e.x - tx, e.y - ty) < 1.5) { e.scr.set = true; e.scr.t = 1.1; }
          if (e.scr.t < 0) e.scr = null;
        } else {
          e.tx = e.x; e.ty = e.y;
          if (!e.scr.hit && hd.stun <= 0 && Math.hypot(hd.x - e.x, hd.y - e.y) < 2.1 && Math.hypot(hd.vx, hd.vy) > 1) {
            e.scr.hit = true; hd.stun = 0.6 + e.pl.r.ins * 0.03; say(NM(e) + ' SETS THE PICK'); fx('catch');
          }
          if (e.scr.t <= 0) { e.scr = null; e.cutting = true; e.cutT = 1.8; }
        }
        if (e.scr) return;
      }
    }
    if (e.cutting) {
      e.tx = HX + (e.x < 0 ? -2.5 : 2.5); e.ty = HY + 2.5;
      if (dHoop(e) < 4.5 || e.cutT < 0) { e.cutting = false; e.spot = freeSpot(e, [3, 5, 1, 2]); e.cutT = U.rand(2, 4); }
      return;
    }
    if (e.cutT <= 0) {
      e.cutT = U.rand(2.2, 4.5);
      const r = Math.random();
      if (r < 0.3 && h && h !== e && (e.pl.pos === 'C' || e.pl.pos === 'PF') && dHoop(h) > 15 && !offE().some(o => o.scr)) { e.scr = { t: 2.6, s: h.x > 0 ? -1 : 1 }; return; }
      if (r < 0.32 && h && h !== e) { e.cutting = true; e.cutT = 1.6; return; }
      if (r < 0.6) e.spot = freeSpot(e);
    }
    let [sx, sy] = SPOTS[e.spot];
    // drive and kick: spread to the arc when the handler attacks
    if (h && dHoop(h) < 13 && (e.spot === 4 || e.spot === 6) && e.pl.r.sht >= 5) { sx = e.x < 0 ? -21.5 : 21.5; sy = 4; }
    e.tx = sx + Math.sin(st.t * 0.9 + e.i) * 0.8; e.ty = sy + Math.cos(st.t * 0.7 + e.i) * 0.6;
  }
  function freeSpot(e, pref) {
    const taken = offE().filter(o => o !== e).map(o => o.spot);
    const opts = (pref || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).filter(s => !taken.includes(s) && !(e.pl.r.sht < 4 && [1, 2, 3, 5].includes(s)));
    return opts.length ? U.pick(opts) : e.spot;
  }
  function aiHandler(e, dt) {
    const st = E.st;
    st.decideT -= dt;
    const d = dHoop(e), [nd, ndd] = nearestDef(e);
    // movement: probe toward the rim, sidestep the defender
    let ax = HX - e.x, ay = HY + 3 - e.y; const l = Math.hypot(ax, ay) || 1; ax /= l; ay /= l;
    if (nd && ndd < 4) { const sx = -(nd.y - e.y), sy = (nd.x - e.x), s = (Math.sin(st.t * 1.3 + e.i) > 0 ? 1 : -1); ax += sx / ndd * 0.9 * s; ay += sy / ndd * 0.9 * s; }
    const patience = st.t < 1.6 + (e.i === 0 ? 1 : 0);
    if (patience) { e.tx = e.x + Math.sin(st.t * 2) * 3; e.ty = Math.max(e.y, 26); }
    else { e.tx = e.x + ax * 5; e.ty = e.y + ay * 5; }
    if (st.decideT > 0) return;
    st.decideT = U.rand(0.25, 0.45);
    const r = e.pl.r;
    if (st.sc < 2.5) return startShot(e, false);
    if (d < 7 && !patience) return startShot(e, false);
    if (!patience && ndd > 5 && d < 25.5 && r.sht >= 4 && Math.random() < 0.25 + r.sht * 0.05) return startShot(e, false);
    if (!patience && ndd > 3.5 && d < 17 && r.sht >= 5 && Math.random() < 0.2) return startShot(e, false);
    if (nd && ndd < 3.2 && e.cd <= 0 && Math.random() < 0.05 + r.pas * 0.01) dribMove(e, U.pick(['cross', 'cross', 'spin', 'hesi', 'step', 'btb']), null);
    // pass to an open teammate
    if (Math.random() < 0.38) {
      let best = null, bs = 0;
      offE().forEach(t => { if (t === e) return; const o = E.openness(t); const s = o * (0.5 + (is3(t.x, t.y) ? t.pl.r.sht / 9 : dHoop(t) < 9 ? 1 : t.pl.r.sht / 12)) + (t.cutting && o > 3 ? 4 : 0); if (s > bs) { bs = s; best = t; } });
      const mine = ndd * (0.5 + r.sht / 12);
      if (best && (bs > mine + 1.5 || st.t > 9) && lanesClear(e, best)) passTo(e, best);
    }
  }
  function lanesClear(a, t) {
    return !defE().some(d => { const dx = t.x - a.x, dy = t.y - a.y, l2 = dx * dx + dy * dy || 1; const u = U.clamp(((d.x - a.x) * dx + (d.y - a.y) * dy) / l2, 0, 1); return Math.hypot(a.x + dx * u - d.x, a.y + dy * u - d.y) < 1.6 && u > 0.15 && u < 0.9; });
  }
  function defend(e, dt) {
    const st = E.st, b = st.ball, m = e.man;
    const ballX = b.s === 'hold' ? b.h.x : b.x, ballY = b.s === 'hold' ? b.h.y : b.y;
    const onBall = b.s === 'hold' && b.h === m;
    const hx = HX - m.x, hy = HY - m.y, hl = Math.hypot(hx, hy) || 1;
    let gap = onBall ? 3 + (e.pl.r.def < 5 ? 0.8 : 0) : U.clamp(3 + Math.hypot(m.x - ballX, m.y - ballY) / 4.5, 3, 9);
    if (m.cutting && !onBall) gap = 1.5 + (10 - e.pl.r.def) * 0.25;
    let tx = m.x + hx / hl * Math.min(gap, hl * 0.8), ty = m.y + hy / hl * Math.min(gap, hl * 0.8);
    if (!onBall) { tx = U.lerp(tx, ballX, 0.12); ty = U.lerp(ty, ballY, 0.12); }
    // help: nearest off-ball defender rotates when the ball is deep
    if (b.s === 'hold' && b.h.side === 0 && !onBall && dHoop(b.h) < 11) {
      const helpers = defE().filter(d => d.man !== b.h && d.stun <= 0 && d !== st.ud);
      helpers.sort((a, c) => Math.hypot(a.x - b.h.x, a.y - b.h.y) - Math.hypot(c.x - b.h.x, c.y - b.h.y));
      if (helpers[0] === e) { tx = U.lerp(b.h.x, HX, 0.4); ty = U.lerp(b.h.y, HY, 0.4); }
    }
    // reaction lag based on defense rating
    const mul = st.aiMul.def, k = Math.min(1, dt * (2.2 + e.pl.r.def * 0.45) * mul);
    e.rx = e.rx == null ? tx : U.lerp(e.rx, tx, k); e.ry = e.ry == null ? ty : U.lerp(e.ry, ty, k);
    e.tx = e.rx; e.ty = e.ry;
    // contest shots
    if (b.s === 'hold' && b.h.state === 'shoot' && e.z <= 0 && e.state === 'run') {
      const dd = Math.hypot(b.h.x - e.x, b.h.y - e.y);
      e.tx = b.h.x; e.ty = b.h.y;
      if (dd < 6.5 && b.h.stT > 0.18 + (10 - e.pl.r.def) * 0.022 / mul) { e.state = 'jump'; e.vz = 11 + e.pl.r.ath * 0.3; e.stT = 0; }
    }
    if (b.s === 'hold' && b.h.state === 'fin' && e.z <= 0 && e.state === 'run' && Math.hypot(b.h.x - e.x, b.h.y - e.y) < 5 && Math.random() < 0.5) { e.state = 'jump'; e.vz = 12 + e.pl.r.ath * 0.3; e.stT = 0; }
    // on-ball steal pokes
    if (onBall && e.cd <= 0 && b.h.state === 'run' && Math.hypot(m.x - e.x, m.y - e.y) < 3.4 && Math.random() < dt * (0.08 + e.pl.r.def * 0.02) * mul) stealTry(e, false);
  }

  // ---------- physics ----------
  function physics(e, dt) {
    const st = E.st;
    e.stT += dt;
    if (e.labelT) e.labelT -= dt;
    if (e.state === 'shoot') {
      if (e.stT > 0.12 && e.z <= 0 && e.vz === 0 && !e.jumped) { e.vz = 11 + e.pl.r.ath * 0.2; e.jumped = true; }
      if (!e.userShot && !e.released && e.stT / E.METER_T >= e.aiRel) release(e);
      if (e.userShot && !e.released && e.stT / E.METER_T > 1.3) release(e);
      if (e.released && e.z <= 0 && e.jumped && e.stT > 0.3) { e.state = 'run'; e.jumped = false; e.userShot = false; }
    } else if (e.state === 'fin') {
      const T = 0.42;
      const k = Math.min(1, e.stT / T);
      const gx = HX + (e.fx0 - HX) * 0.18, gy = HY + 1.6;
      e.x = U.lerp(e.fx0, gx, k); e.y = U.lerp(e.fy0, gy, k);
      e.vx = e.vy = 0;
      if (k > 0.35 && !e.jumped) { e.jumped = true; e.vz = e.dunk ? 16 + e.pl.r.ath * 0.25 : 12; }
      if (e.stT >= T && !e.finDone) { e.finDone = true; finishRelease(e); }
      if (e.finDone && e.z <= 0 && e.stT > 0.5) { e.state = 'run'; e.jumped = false; e.finDone = false; e.oopCatch = false; }
    } else if (e.state === 'jump') {
      if (e.z <= 0 && e.stT > 0.2) { e.state = 'run'; e.userJump = false; }
    } else if (e.state === 'pass' || e.state === 'reach') {
      if (e.stT > 0.25) e.state = 'run';
    }
    if (e.hang > 0) { e.hang -= dt; e.z = Math.max(e.z, 3.2); e.vz = 0; if (e.hang <= 0) e.vz = -2; }
    // movement toward target
    let mv = e.state === 'run' && e.stun <= 0 && st.phase !== 'ft';
    if (e.burst > 0) e.burst -= dt;
    if (e.spinT > 0) e.spinT -= dt;
    if (e.stepT > 0) e.stepT -= dt;
    if (e.blockT > 0) e.blockT -= dt;
    if (e.hesiT > 0) { e.hesiT -= dt; if (e.hesiT <= 0 && e.state === 'run') { let hx = HX - e.x, hy = HY - e.y; const hl = Math.hypot(hx, hy) || 1; e.vx = hx / hl * e.spd * 1.6; e.vy = hy / hl * e.spd * 1.6; e.burst = 0.32; } }
    if (mv) {
      const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy);
      let spd = e.spd * (e.ball ? 0.9 : 1) * (e.fire ? 1.06 : 1);
      if (e.side === 1 && e !== st.ud) spd *= st.aiMul.def;
      if (e.side === 0 && e !== st.uo) spd *= Math.min(1.05, st.aiMul.off);
      if (e.userMove) spd *= 0.55 + 0.45 * Math.min(1, e.userMove);
      const want = d < 0.3 ? 0 : Math.min(spd, d * 4);
      const dvx = d ? dx / d * want : 0, dvy = d ? dy / d * want : 0;
      const acc = e.burst > 0 ? 0 : Math.min(1, dt * 9);
      e.vx += (dvx - e.vx) * acc; e.vy += (dvy - e.vy) * acc;
    } else if (e.state !== 'fin') { e.vx *= 0.85; e.vy *= 0.85; }
    if (e.state !== 'fin') { e.x += e.vx * dt; e.y += e.vy * dt; }
    // screen facing: moving toward the hoop (y down) = facing right
    if (Math.abs(e.vy) > 0.8) e.face = e.vy < 0 ? 1 : -1;
    else if (e.state === 'run' && Math.hypot(e.vx, e.vy) < 1.5) e.face = e.side === 0 ? 1 : -1;
    if (e.state === 'shoot' || e.state === 'fin') e.face = 1;
    const sp = Math.hypot(e.vx, e.vy); e.run += sp * dt;
    e.x = U.clamp(e.x, -24.5, 24.5); e.y = U.clamp(e.y, 0.6, 93.4);
    // separation
    st.ents.forEach(o => { if (o === e || o.state === 'fin') return; const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy); if (d < 1.6 && d > 0.01) { const push = (1.6 - d) * 0.5; e.x += dx / d * push; e.y += dy / d * push; } });
    if (e.z > 0 || e.vz) { e.vz -= 32 * dt; e.z += e.vz * dt; if (e.z <= 0) { e.z = 0; e.vz = 0; } }
  }

  // ---------- ball ----------
  function ballUpdate(dt) {
    const st = E.st, b = st.ball;
    if (b.s === 'hold') {
      const h = b.h, side = h.face;
      if (h.state === 'shoot' || h.state === 'fin' || h.state === 'ftm') { b.x = h.x; b.y = h.y - 0.2; b.z = h.z + 7.2; }
      else { b.x = h.x + 0.6; b.y = h.y - side * 0.9; b.z = Math.abs(Math.sin(st.t * 8.5)) * 3; if (b.z < 0.25 && !b.bounced) { b.bounced = true; if (st.phase !== 'end') fx('bounce'); } if (b.z > 1) b.bounced = false; }
    } else if (b.s === 'pass') {
      b.t += dt; const u = Math.min(1, b.t / b.T);
      b.x = U.lerp(b.sx, b.ex, u); b.y = U.lerp(b.sy, b.ey, u); b.z = U.lerp(b.sz, b.ez, u) + (b.lob ? 7 : 1.2) * 4 * u * (1 - u);
      // interceptions
      if (!b.lob && u > 0.12 && u < 0.92) defOf(b.from).forEach(d => {
        if (b.chk.has(d) || d.stun > 0) return;
        const dd = Math.hypot(d.x - b.x, d.y - b.y);
        if (dd < 1.2 + d.pl.r.def * 0.05) {
          b.chk.add(d);
          let p = 0.3 + (d.pl.r.def - b.from.pl.r.pas) * 0.05; if (st.cfg.user === 'off' && d.side === 1) p *= st.aiMul.def;
          if (Math.random() < U.clamp(p, 0.08, 0.85)) {
            b.s = 'hold'; b.h = d; d.ball = true; B(d.id).stl++;
            say(NM(d) + ' JUMPS THE PASSING LANE!');
            pop('PICKED OFF!', 0, 34, st.cfg.user === 'def' ? '#7cff6b' : '#ff5050', 3); fx('steal'); st.shake = 0.3;
            end('tov', 'Pass intercepted', 1.3);
          }
        }
      });
      if (b.s === 'pass' && u >= 1) {
        const t = b.to;
        if (b.lob) {
          if (Math.hypot(t.x - b.ex, t.y - b.ey) < 4 && t.state === 'run') { t.oop = false; t.ball = true; b.s = 'hold'; b.h = t; t.oopCatch = true; startFinish(t); t.dunk = true; t.fx0 = t.x; t.fy0 = t.y; }
          else { t.oop = false; b.src = 'oop'; b.s = 'loose'; b.vx = U.rand(-4, 4); b.vy = 6; b.vz = 2; b.lastTouch = 0; }
        } else if (Math.hypot(t.x - b.x, t.y - b.y) < 5.5) { b.s = 'hold'; b.h = t; t.ball = true; t.cutting = false; fx('catch'); }
        else { b.src = 'catch'; b.s = 'loose'; b.vx = (b.ex - b.sx) / b.T * 0.4; b.vy = (b.ey - b.sy) / b.T * 0.4; b.vz = 0; b.lastTouch = 0; }
      }
    } else if (b.s === 'shot') {
      b.t += dt; const u = Math.min(1, b.t / b.T);
      b.x = U.lerp(b.sx, b.ex, u); b.y = U.lerp(b.sy, b.ey, u); b.z = U.lerp(b.sz, b.ez, u) + b.arc * 4 * u * (1 - u);
      const r = b.res;
      if (r.blk && u >= 1) {
        const d = r.blk; B(d.id).blk++;
        say(NM(d) + ' SAYS NO!');
        pop(U.pick(['REJECTED!', 'GET THAT OUT!', 'DENIED!']), 0, 34, d.side === 1 && st.cfg.user === 'def' ? '#7cff6b' : '#ff7070', 3); fx('block'); st.shake = 0.6;
        st.hl.push(st.cfg.user === 'def' ? 'block' : '');
        Object.assign(b, { s: 'loose', vx: (b.sx - HX) * 0.6 + U.rand(-5, 5), vy: U.rand(6, 14), vz: 4, lastTouch: d.side, missT: 0 });
        burst(b.x, b.y, b.z, 10, ['#fff', '#aaa'], 8);
        return;
      }
      if (u >= 1) {
        if (r.ft) { if (r.make) { b.s = 'net'; b.t = 0; b.x = HX; b.y = HY; b.z = RIM; } else { b.s = 'dead'; } ftResolved(r.make); return; }
        if (r.make) { b.s = 'net'; b.t = 0; b.x = HX; b.y = HY; b.z = RIM; fx(r.green ? 'swish' : 'swish'); score(b.shooter, r); }
        else {
          fx('rim'); st.rimT = 0.3;
          if (r.foul) { pop('FOUL', 0, 40, '#7cd6ff', 2); fx('whistle'); st.phase = 'wait'; const sh = b.shooter, n = r.three ? 3 : 2; b.s = 'dead'; later(() => startFT(sh, n), 0.9); return; }
          const a = Math.atan2(b.y - HY, b.x - HX) + U.rand(-0.9, 0.9);
          Object.assign(b, { s: 'loose', vx: Math.cos(a) * U.rand(3, 8), vy: Math.abs(Math.sin(a)) * U.rand(3, 8) + 1.5, vz: U.rand(5, 9), lastTouch: 0, missT: 0 });
        }
      }
    } else if (b.s === 'net') {
      b.t += dt; b.z = Math.max(0, RIM - b.t * 18); st.netT = 0.4;
      if (b.z <= 0) { b.s = 'dead'; b.vz = 0; }
    } else if (b.s === 'loose') {
      b.x += b.vx * dt; b.y += b.vy * dt; b.vz -= 32 * dt; b.z += b.vz * dt;
      if (b.z < 0) { b.z = 0; b.vz = Math.abs(b.vz) * 0.5; b.vx *= 0.62; b.vy *= 0.62; if (b.vz > 2) fx('bounce'); }
      if (b.x < -25.5 || b.x > 25.5 || b.y < -0.5 || b.y > 94.5) {
        if (b.lastTouch === 1) { pop('OUT OFF DEFENSE', 0, 30, '#fff', 2); resetInbound(); }
        else { pop('OUT OF BOUNDS', 0, 30, '#fff', 2); end(b.missT != null ? 'miss' : 'tov', 'Out of bounds ' + (b.src || ''), 1.1); b.s = 'dead'; }
        return;
      }
      // grab
      const cands = st.ents.filter(e => e.stun <= 0 && e.state !== 'fin' && Math.hypot(e.x - b.x, e.y - b.y) < 2.4 && b.z < 7.5 + (e.ht - 72) / 12 + e.z);
      if (cands.length) {
        const w = cands.map(e => (6 + e.pl.r.ins * 0.5 + (e.ht - 76) * 0.25 + e.pl.r.ath * 0.2) * (e.side === 1 ? 1.35 * (st.cfg.user === 'off' ? st.aiMul.def : 1) : 1));
        let s = w.reduce((a, c) => a + c, 0) * Math.random(), g = cands[0];
        for (let i = 0; i < cands.length; i++) { s -= w[i]; if (s <= 0) { g = cands[i]; break; } }
        if (Math.random() < dt * 18) grab(g);
      }
    }
  }
  function grab(e) {
    const st = E.st, b = st.ball;
    const fromShot = b.missT != null;
    b.s = 'hold'; b.h = e; e.ball = true; b.missT = null;
    if (fromShot) B(e.id).reb++;
    if (b.steal && b.steal.side === e.side) B(b.steal.id).stl++;
    const stealer = b.steal; b.steal = null;
    if (e.side === 1) {
      fx('catch');
      if (fromShot) pop('REBOUND', 0, 34, st.cfg.user === 'def' ? '#7cff6b' : '#ff7070', 2);
      end(fromShot ? 'miss' : 'tov', fromShot ? 'Defensive rebound' : 'Turnover', 1.1);
    } else {
      if (fromShot) { pop('OFF. BOARD', 0, 34, st.cfg.user === 'off' ? '#7cff6b' : '#ff7070', 2); st.sc = Math.max(st.sc, 14); }
      if (st.uo) st.uo = e;
      if (st.ud && e.dfn) st.ud = e.dfn;
      syncUser();
    }
  }
  function resetInbound() {
    const st = E.st, b = st.ball, pg = offE()[0];
    pg.x = pg.tx = 0; pg.y = pg.ty = 30; b.s = 'hold'; b.h = pg; pg.ball = true; st.sc = Math.max(st.sc, 14);
    if (st.uo) st.uo = pg; syncUser();
  }

  // expose for render/tests
  E.isHuman = isHuman;
  E.dHoop = dHoop; E.HOOP = { x: HX, y: HY, z: RIM }; E.contest = contest;
})(window.CK);
