// Court Kings - full game flow: quarters, simmed stretches, live possessions, clutch time, box score
(function (CK) {
  const U = CK.U, L = CK.L, E = CK.CT, M = CK.M = {};
  let g = null, raf = 0, last = 0, acc = 0, canvas, ctx, root;
  const POSS_Q = 24, QSEC = 720;

  M.jersey = (t, home) => home
    ? { jersey: '#f4f1ea', trim: t.c1, shorts: '#f4f1ea', shoe: '#ffffff' }
    : { jersey: t.c1, trim: U.lum(t.c1) < 0.18 && U.lum(t.c2) < 0.18 ? '#ffffff' : (U.lum(t.c2) > 0.3 || U.lum(t.c1) < 0.3 ? t.c2 : '#ffffff'), shorts: t.c1, shoe: '#202020' };

  // ---------- start ----------
  M.start = (opts, done) => {
    const S = CK.S, home = L.T(opts.home), away = L.T(opts.away);
    const meHome = home.id === S.me;
    g = {
      home, away, meHome, me: meHome ? home : away, opp: meHome ? away : home,
      hs: 0, as: 0, q: 1, sec: QSEC, steps: [], si: 0, box: {}, hl: [], streak: {}, fire: {}, log: [],
      po: !!opts.po, label: opts.label || '', done, hype: 0, paused: false, mode: 'intro', ot: 0, live: 0, ppq: S.ppq, myPoss: 0, myPts: 0,
      lineH: L.lineup(home), lineA: L.lineup(away), tut: !S.tutDone && !U.load('ck_tut', 0),
      full: opts.full != null ? opts.full : S.mode !== 'highlights', qsec: (opts.qlen || S.qlen || 3) * 60,
      exhib: !!opts.exhib, net: opts.net || null, q1: Math.random() < 0.5 ? 'home' : 'away'
    };
    if (g.net) { g.full = true; g.net.onGone = () => { g.netGone = true; flash('YOUR FRIEND LEFT: CPU TAKES OVER'); }; }
    buildQuarter();
    E.st = null; root = document.getElementById('game'); root.classList.add('on');
    canvas = root.querySelector('canvas'); ctx = canvas.getContext('2d');
    canvas.width = E.W; canvas.height = E.H;
    CK.RD.buildCourt(home, away);
    CK.inGame = true; CK.IN.reset(); CK.SFX.crowd(true);
    fit(); addEventListener('resize', fit);
    hud();
    root.classList.toggle('online', !!g.net);
    intro();
    last = performance.now(); acc = 0;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  };
  // the canvas stays 225 px tall; its width follows the screen shape so wide phones get more court, not black bars
  function fit() {
    const vw = innerWidth, vh = innerHeight;
    const w = U.clamp(Math.round(E.H * vw / vh), 320, 540);
    if (w !== E.W || canvas.width !== w) { E.W = w; canvas.width = w; canvas.height = E.H; CK.RD.setW(w); }
    const s = Math.min(vw / E.W, vh / E.H);
    const st = root.querySelector('#stage');
    st.style.width = Math.ceil(E.W * s) + 'px'; st.style.height = Math.ceil(E.H * s) + 'px';
    root.style.setProperty('--u', s + 'px');
    root.classList.toggle('portrait', vh > vw && M.touch);
  }
  M.touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  function buildQuarter() {
    if (g.full) {
      g.sec = g.ot ? Math.max(60, Math.round(g.qsec / 2)) : g.qsec;
      g.lastRes = null;
      g.poss = g.q % 2 ? g.q1 : (g.q1 === 'home' ? 'away' : 'home');
      return;
    }
    const n = g.ot ? 2 : g.ppq, fill = (g.ot ? 10 : POSS_Q) - n;
    const steps = [];
    const per = fill / (n * 2);
    let carry = 0;
    const offFirst = Math.random() < 0.5;
    for (let i = 0; i < n; i++) {
      for (const k of offFirst ? ['off', 'def'] : ['def', 'off']) {
        carry += per; const s = Math.floor(carry); carry -= s;
        if (s > 0) steps.push({ k: 'sim', n: s });
        steps.push({ k });
      }
    }
    if (carry > 0.5) steps.push({ k: 'sim', n: 1 });
    // clutch: Q4 final live possessions
    if (g.q >= 4) steps.forEach((s, i) => { if (s.k !== 'sim' && i >= steps.length - 3) s.clutch = true; });
    g.steps = steps; g.si = 0; g.sec = g.ot ? 300 : QSEC;
    g.secPer = g.sec / (steps.reduce((a, s) => a + (s.k === 'sim' ? s.n * 2 : 1), 0));
  }

  // ---------- flow ----------
  function intro() {
    g.mode = 'intro';
    const S = CK.S;
    const card = t => '<span class="vt" style="--c:' + t.c1 + ';--c2:' + t.c2 + '">' + logoImg(t) + '<b>' + t.ab + '</b><small>' + U.esc((t.name || t.city).toUpperCase()) + '</small><em>' + t.w + '-' + t.l + '</em></span>';
    banner('<div class="vs">' + card(g.away) + '<i>AT</i>' + card(g.home) + '</div><div class="sub">' + (g.label || 'GAME ' + (S.round + 1)) + '</div>', 2200, () => g.net ? next() : tipoff(), true);
  }
  // ---------- opening tip: the two bigs jump at center court, tap SHOOT / SPACE when the ball peaks ----------
  // clutch: last minute of the 4th (or OT) in a 6-point game, or the clutch possessions in highlights mode
  const isClutch = () => !!g && (g.full ? (g.q >= 4 && Math.abs(g.hs - g.as) <= 6 && (E.st ? Math.min(E.st.gc, g.sec) : g.sec) <= 60) : !!g.clutch);
  function tipoff() {
    const big = l => l.st.slice().sort((a, b) => (b.ht + b.r.ath * 0.8) - (a.ht + a.r.ath * 0.8))[0];
    const H = big(g.lineH), A = big(g.lineA);
    const mineH = g.meHome;
    g.tip = { t: 0, H, A, lH: CK.SP.lookOf(H, M.jersey(g.home, true)), lA: CK.SP.lookOf(A, M.jersey(g.away, false)), hit: null, win: null, done: false };
    g.mode = 'tip'; CK.IN.reset();
    flash(M.touch ? 'TAP SHOOT WHEN THE BALL PEAKS' : 'PRESS SPACE WHEN THE BALL PEAKS');
    CK.SFX.play('whistle');
  }
  function tipFrame(dt) {
    const T = g.tip, E2 = E; T.t += dt;
    if (T.hit == null && (CK.IN.Ap || CK.IN.tap) && T.t > 0.4) T.hit = T.t;
    CK.IN.consume();
    const PEAK = 1.25;
    if (T.win == null && T.t >= PEAK + 0.12) {
      // timing: inside 0.12s of the peak is a near lock, a bad press still has a chance
      const myMan = g.meHome ? T.H : T.A, them = g.meHome ? T.A : T.H;
      let p = 0.5 + ((myMan.ht + myMan.r.ath) - (them.ht + them.r.ath)) * 0.03;
      if (T.hit != null) p += U.clamp(0.35 - Math.abs(T.hit - PEAK) * 1.6, -0.25, 0.35); else p -= 0.15;
      const iWin = Math.random() < U.clamp(p, 0.1, 0.92);
      T.win = iWin === g.meHome ? 'home' : 'away';
      CK.SFX.play('catch');
      flash((T.win === 'home' ? g.home : g.away).ab + ' WINS THE TIP');
    }
    // draw: court centered on half court
    const W = E2.W, cx0 = E2.projW(0, 47, 0)[0] + E2.cam; E2.cam = cx0 - W / 2;
    CK.RD.drawIdle(ctx);
    const P = (x, y, z) => { const v = E2.projW(x, y, z); return [Math.round(v[0]), Math.round(v[1])]; };
    const jz = t => { const k = (t - 0.95) / 0.6; return k > 0 && k < 1 ? Math.sin(k * Math.PI) * 4.2 : 0; };
    const drawP = (look, x, y, z, flip) => { const [sx, sy] = P(x, y, z); const pose = z > 0.3 ? 'jump' : 'idle'; ctx.drawImage(CK.SP.get(look, pose, 0, flip), sx - CK.SP.FX, sy - CK.SP.FY); };
    const zH = jz(T.t), zA = jz(T.t);
    // home attacks right in the first half -> stands on the left of center
    ctx.fillStyle = 'rgba(0,0,0,.35)'; [[0, 49.6], [0, 44.4]].forEach(([x, y]) => { const [sx, sy] = P(x, y, 0); ctx.fillRect(sx - 6, sy - 1, 12, 3); });
    drawP(T.lH, 0, 49.6, zH, false); drawP(T.lA, 0, 44.4, zA, true);
    // ball
    let bx = 0, by = 47, bz;
    if (T.win == null) bz = 4 + Math.sin(Math.min(1, T.t / PEAK) * Math.PI / 2) * 12;
    else { const k = Math.min(1, (T.t - PEAK - 0.12) / 0.6); bz = 16 - k * 13; by = 47 + (T.win === 'home' ? -1 : 1) * k * 10; }
    const [bsx, bsy] = P(bx, by, bz);
    ctx.fillStyle = '#140a03'; ctx.fillRect(bsx - 3, bsy - 2, 6, 4); ctx.fillRect(bsx - 2, bsy - 3, 4, 6); ctx.fillStyle = '#ef7d2a'; ctx.fillRect(bsx - 2, bsy - 2, 4, 4);
    if (T.win != null && T.t > PEAK + 1.0 && !T.done) {
      T.done = true; g.q1 = T.win; g.poss = T.win; g.mode = 'between';
      setTimeout(next, 150);
    }
  }
  function next() {
    if (!g) return;
    if (g.full) { if (g.sec <= 0.05) return endQuarter(); return liveFull(); }
    if (g.si >= g.steps.length) return endQuarter();
    const s = g.steps[g.si++];
    if (s.k === 'sim') return simStretch(s.n);
    live(s);
  }
  function endQuarter() {
    CK.SFX.play('buzzer');
    g.sec = 0; hud();
    if (g.q >= 4 && g.hs !== g.as) return final();
    if (g.q === 2) return halftime();
    if (g.en) for (const id in g.en) g.en[id] = Math.min(1, g.en[id] + (g.q === 2 ? 0.45 : 0.22));   // breaks between quarters
    if (g.full) { g.q++; if (g.q > 4) g.ot++; buildQuarter(); hud(); return banner('<div class="big">' + qName() + '</div>' + (g.ot ? '<div class="sub">OVERTIME</div>' : ''), 1300, next); }
    g.q++; if (g.q > 4) g.ot++;
    buildQuarter();
    banner('<div class="big">' + qName() + '</div>' + (g.ot ? '<div class="sub">OVERTIME</div>' : ''), 1300, next);
  }
  const qName = () => g.q <= 4 ? 'Q' + g.q : 'OT' + (g.ot > 1 ? g.ot : '');

  // ---------- simmed stretch ----------
  function simStretch(n) {
    g.mode = 'sim';
    const lines = [];
    let mh = 0, ma = 0;
    const order = Math.random() < 0.5 ? [0, 1] : [1, 0];
    for (let i = 0; i < n; i++) for (const k of order) {
      const offT = k ? g.away : g.home, defT = k ? g.home : g.away;
      const r = simPoss(offT, defT);
      if (k) { g.as += r.pts; ma += r.pts; } else { g.hs += r.pts; mh += r.pts; }
      if (r.txt && (r.pts >= 3 || r.big)) lines.push('<b style="color:' + (offT === g.me ? '#ffd23f' : '#ff8f8f') + '">' + offT.ab + '</b> ' + r.txt);
      g.sec = Math.max(0, g.sec - g.secPer);
    }
    hud();
    const a = g.meHome ? mh : ma, b = g.meHome ? ma : mh;
    const tone = a > b ? 'good' : a < b ? 'bad' : '';
    const head = '<div class="run ' + tone + '">' + g.me.ab + ' ' + a + ' &ndash; ' + b + ' ' + g.opp.ab + '</div>';
    banner('<div class="sub">SIMMED STRETCH</div>' + head + '<div class="lines">' + lines.slice(-3).join('<br>') + '</div>', 1500 + Math.min(3, lines.length) * 250, next, true);
  }
  // one simmed possession with real stats
  function simPoss(off, def) {
    const B = id => g.box[id] || (g.box[id] = L.blankStats());
    const lo = (off === g.home ? g.lineH : g.lineA), ld = (def === g.home ? g.lineH : g.lineA);
    const ppl = lo.st.concat(lo.bench.slice(0, 3)), dpl = ld.st.concat(ld.bench.slice(0, 3));
    const wPick = (arr, f) => { const w = arr.map(f); let s = w.reduce((a, b) => a + b, 0) * Math.random(); for (let i = 0; i < arr.length; i++) { s -= w[i]; if (s <= 0) return arr[i]; } return arr[0]; };
    const mins = (p, i) => i < 5 ? 1 : 0.38;
    const od = L.offRating(off) - L.defRating(def);
    const diffAdj = off === g.me ? 0 : [-0.03, -0.01, 0, 0.02][CK.S.diff];
    let pts = 0, txt = '', big = false;
    for (let tries = 0; tries < 3; tries++) {
      if (Math.random() < 0.13 - od * 0.004) { if (Math.random() < 0.5) { const st = wPick(dpl, (p, i) => mins(p, i) * (p.r.def + p.r.ath)); B(st.id).stl++; } return { pts, txt: txt || 'turnover', big: false }; }
      const sh = wPick(ppl, (p, i) => mins(p, i) * Math.pow(p.r.sht * 0.3 + p.r.thr * 0.3 + p.r.ins * 0.5 + p.r.ath * 0.2 + 1, 1.7));
      const b = B(sh.id);
      if (Math.random() < 0.09) { const m = (Math.random() < 0.6 + sh.r.sht * 0.03 ? 1 : 0) + (Math.random() < 0.6 + sh.r.sht * 0.03 ? 1 : 0); b.pts += m; pts += m; return { pts, txt: L.short(sh) + ' ' + m + '/2 at the line' }; }
      const three = Math.random() < 0.1 + sh.r.thr * 0.04;
      const pm = three ? 0.25 + sh.r.thr * 0.017 + od * 0.006 + diffAdj : 0.41 + sh.r.ins * 0.018 + od * 0.008 + diffAdj;
      b.fga++; if (three) b.tpa++;
      if (Math.random() < pm) {
        b.fgm++; if (three) b.tpm++; const v = three ? 3 : 2; b.pts += v; pts += v;
        if (Math.random() < 0.6) { const as = wPick(ppl.filter(p => p !== sh), (p) => Math.pow(p.r.pas, 1.8)); B(as.id).ast++; }
        const dunk = !three && sh.r.ath + sh.r.ins >= 13 && Math.random() < 0.35;
        txt = L.short(sh) + (three ? ' drains a three' : dunk ? ' throws it down' : U.pick([' scores inside', ' hits a jumper', ' finishes at the rim']));
        big = three || dunk;
        return { pts, txt, big };
      }
      // miss + rebound
      if (Math.random() < 0.24) { const r = wPick(ppl, (p, i) => mins(p, i) * (p.r.ins + (p.ht - 74) * 0.4)); B(r.id).reb++; continue; }
      const r = wPick(dpl, (p, i) => mins(p, i) * (p.r.ins + p.r.def * 0.5 + (p.ht - 74) * 0.4)); B(r.id).reb++;
      if (Math.random() < 0.06) { const bl = wPick(dpl, (p, i) => mins(p, i) * Math.max(1, p.r.def + (p.ht - 78))); B(bl.id).blk++; }
      return { pts, txt: '' };
    }
    return { pts, txt };
  }

  // ---------- live possession ----------
  function live(step) {
    g.mode = 'pre';
    const user = step.k;
    const offT = user === 'off' ? g.me : g.opp, defT = user === 'off' ? g.opp : g.me;
    const lo = offT === g.home ? g.lineH : g.lineA, ld = defT === g.home ? g.lineH : g.lineA;
    g.posT = offT === g.home ? 'home' : 'away'; hudPos();
    const tips = !M.touch ? (user === 'off' ? 'WASD to move. Hold SPACE and let go at the top of the meter (green = perfect). K passes to the open man, 1-5 picks a teammate. Moves: E cross, F spin, R hesi, Q step-back, C behind the back. Drive in and shoot to dunk.' : 'You guard the ball. SPACE to contest (it says BLOCK once the shot goes up), L or E to go for the steal. Stay between your man and the rim.')
      : user === 'off' ? 'Move with the stick. Hold SHOOT, let go at the top of the meter. Tap a teammate or PASS. CROSS, SPIN, HESI and STEP BACK break ankles. Green ring = open.' : 'You guard the ball. CONTEST jumps at shooters, it turns into BLOCK when the shot goes up. STEAL pokes the ball. Stay between your man and the rim.';
    const clutch = step.clutch && Math.abs(g.hs - g.as) <= 8;
    let html = '<div class="big">' + (user === 'off' ? 'YOUR BALL' : 'DEFENSE') + '</div>';
    if (clutch) html = '<div class="clutch">CLUTCH TIME</div>' + html;
    html += '<div class="sub">' + qName() + ' ' + U.clock(g.sec) + '</div>';
    if (g.tut && g.live < 2) html += '<div class="tip">' + tips + '</div>';
    setButtons(user);
    banner(html, g.tut && g.live < 2 ? 3200 : clutch ? 1500 : 1000, () => {
      g.mode = 'live'; g.live++;
      if (g.live >= 2 && g.tut) { g.tut = false; CK.S.tutDone = true; }
      startPoss(offT, defT, user, step, {});
      g.clutch = clutch;
    });
  }
  // which way a team attacks: home goes right in the first half, left after the break
  const dirFor = t => ((t === g.home) === (g.q <= 2)) ? 1 : -1;
  function startPoss(offT, defT, user, step, extra) {
    const lo = offT === g.home ? g.lineH : g.lineA, ld = defT === g.home ? g.lineH : g.lineA;
    g.posT = offT === g.home ? 'home' : 'away'; hudPos();
    const st = E.start(Object.assign({
      off: Object.assign({ players: lo.st.slice(0, 5), home: offT === g.home }, M.jersey(offT, offT === g.home)),
      def: Object.assign({ players: ld.st.slice(0, 5), home: defT === g.home }, M.jersey(defT, defT === g.home)),
      user, diff: CK.S.diff, dir: dirFor(offT), both: !!(g.net && !g.netGone), film: g.exhib || g.net ? 0 : (CK.S.fac.film || 1) - 1, ocB: g.exhib || g.net ? 0 : CK.FO.ocB(), dcB: g.exhib || g.net ? 0 : CK.FO.dcB(),
      energy: g.en || (g.en = {}), onEnd: r => liveEnd(r, step, offT), onFx: onFx, onSay: say
    }, extra));
    st.ents.forEach(e => { if (g.fire[e.id]) e.fire = true; });
    if (g.net) netEv({ k: 'poss' });
    return st;
  }
  // full game: every possession is played, the ball goes straight back the other way
  function liveFull() {
    const offT = g.poss === 'home' ? g.home : g.away, defT = offT === g.home ? g.away : g.home;
    const user = offT === g.me ? 'off' : 'def';
    const r = g.lastRes, step = { k: user };
    const extra = { flow: true, clock: g.sec };
    if (r) {
      extra.pos = r.pos;
      if (r.holder && r.holderSide === 1) extra.handler = r.holder;
      else { extra.inbound = true; if (r.tag !== 'make' && r.ballW && !r.ft) extra.inbAt = r.ballW; }
    }
    setButtons(user);
    const go = () => { g.mode = 'live'; g.live++; startPoss(offT, defT, user, step, extra); };
    if (!r) {
      let html = '<div class="big">' + qName() + '</div><div class="sub">' + (user === 'off' ? 'YOUR BALL' : 'THEIR BALL') + '</div>';
      if (g.tut && g.q === 1) html += '<div class="tip">' + tipText('off') + '<br><br>' + tipText('def') + '</div>';
      g.mode = 'pre';
      return banner(html, g.tut && g.q === 1 ? 5200 : 1300, () => { if (g.tut) { g.tut = false; CK.S.tutDone = true; U.save('ck_tut', 1); } go(); }, true);
    }
    go();
  }
  const tipText = user => !M.touch ? (user === 'off' ? 'OFFENSE: WASD to move. Hold SPACE, let go at the top of the meter. K passes, 1-5 picks a teammate. E cross, F spin, R hesi, Q step-back.' : 'DEFENSE: you guard the ball. SPACE to contest / block, L or E to steal.')
    : user === 'off' ? 'OFFENSE: move with the stick. Hold SHOOT, let go at the top of the meter. Tap a teammate or PASS. CROSS / SPIN / HESI / STEP BACK break ankles.' : 'DEFENSE: you guard the ball. CONTEST jumps at shooters (BLOCK once the shot is up), STEAL pokes at the ball.';
  function say(t) { if (g && g.net) netEv({ k: 'say', t }); const el = root.querySelector('#ticker'); el.textContent = t; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
  function onFx(k) {
    CK.SFX.play(k); if (g && g.net && NET_FX.has(k)) netEv({ k: 'fx', f: k });
    if (k === 'dunk' || k === 'block' || k === 'ankles') g.hype = 1;
    if (k === 'cheer') g.hype = Math.max(g.hype, 0.7);
  }
  function liveEnd(r, step, offT) {
    // stamina: everyone who played that trip gets a little more tired (STAMINA rating = slower drain)
    g.en = g.en || {};
    [g.lineH, g.lineA].forEach(l => l.st.slice(0, 5).forEach(p => { const v = g.en[p.id] == null ? 1 : g.en[p.id]; g.en[p.id] = Math.max(0.35, v - (g.full ? 0.016 : 0.035) * (1.45 - p.r.sta * 0.09)); }));
    // merge box
    for (const id in r.box) { const b = g.box[id] || (g.box[id] = L.blankStats()); for (const k in r.box[id]) if (k !== 'gp') b[k] += r.box[id][k]; }
    if (offT === g.home) g.hs += r.pts; else g.as += r.pts;
    if (step.k === 'off') { g.myPoss++; g.myPts += r.pts; }
    r.hl.filter(Boolean).forEach(h => g.hl.push(h));
    // on fire tracking for my team
    if (step.k === 'off') {
      const sc = E.st.scorer, shooter = E.st.ball.shooter;
      if (r.tag === 'make' && sc) {
        g.streak[sc.id] = (g.streak[sc.id] || 0) + 1;
        if (g.streak[sc.id] >= 3 && !g.fire[sc.id]) { g.fire[sc.id] = true; flash(sc.pl.ln.toUpperCase() + ' IS ON FIRE'); }
      } else if (shooter && r.tag !== 'make') { g.streak[shooter.id] = 0; if (g.fire[shooter.id]) { delete g.fire[shooter.id]; } }
    }
    if (g.full) {
      g.sec = Math.max(0, r.gc); r.ft = E.st && E.st.ftShooter ? true : false;
      g.lastRes = r; g.poss = g.poss === 'home' ? 'away' : 'home';
      if (g.q >= 4 && g.sec < 40 && Math.abs(g.hs - g.as) <= 6 && !g.clutchShown) { g.clutchShown = true; flash('CLUTCH TIME'); }
      hud();
      if (g.sec <= 0.05) { g.mode = 'between'; setTimeout(next, 600); } else next();
      return;
    }
    const used = Math.max(5, 24 - (r.sc || 0));
    g.sec = Math.max(step.clutch ? 2 : 6, g.sec - Math.min(used, g.secPer * 1.6));
    hud();
    E.st = null; g.mode = 'between';
    setTimeout(next, 250);
  }

  // ---------- halftime / final ----------
  function halftime() {
    g.mode = 'half';
    const rows = topPerformers(g.me, 3);
    if (g.net) { banner('<div class="big">HALFTIME</div><div class="sub">' + g.away.ab + ' ' + g.as + ' - ' + g.hs + ' ' + g.home.ab + '</div>', 4000, () => { g.q = 3; buildQuarter(); hud(); next(); }); return; }
    overlay('<h2>HALFTIME</h2>' + scoreLine() + '<div class="perf">' + rows + '</div><button class="btn" id="hgo">START Q3</button>', () => {
      root.querySelector('#hgo').onclick = () => { closeOverlay(); g.q = 3; buildQuarter(); banner('<div class="big">Q3</div>', 1000, next); };
    });
  }
  function topPerformers(t, n) {
    return L.roster(t).map(p => ({ p, b: g.box[p.id] })).filter(x => x.b).sort((a, b) => (b.b.pts + b.b.reb + b.b.ast) - (a.b.pts + a.b.reb + a.b.ast)).slice(0, n)
      .map(x => '<div class="pr"><span>' + U.esc(L.short(x.p)) + '</span><b>' + x.b.pts + ' PTS</b> ' + x.b.reb + ' REB ' + x.b.ast + ' AST</div>').join('');
  }
  const scoreLine = () => '<div class="fs"><span style="--c:' + g.away.c1 + '">' + logoImg(g.away) + g.away.ab + ' ' + g.as + '</span><span style="--c:' + g.home.c1 + '">' + logoImg(g.home) + g.home.ab + ' ' + g.hs + '</span></div>';
  function final() {
    g.mode = 'final'; CK.SFX.crowd(false); E.st = null; CK.RD.drawIdle(ctx);
    const S = CK.S, won = (g.meHome ? g.hs > g.as : g.as > g.hs);
    // credit games played
    [g.lineH, g.lineA].forEach(l => l.st.concat(l.bench.slice(0, 3)).forEach(p => { const b = g.box[p.id] || (g.box[p.id] = L.blankStats()); b.gp = 1; }));
    const res = { hs: g.hs, as: g.as, box: g.box, won, hl: g.hl.slice(), played: true };
    finish(res);
  }
  function finish(res) {
    const S = CK.S;
    if (g.exhib) return finishExhib(res);
    L.recordBox(res.box);
    // rewards (see front.js for every way to earn Coach Credits)
    const hlCount = res.hl.filter(h => ['dunk', 'oop', 'splash', 'block', 'ankles'].includes(h)).length;
    const earn = CK.FO.gameCC(g, res), cc = earn.total;
    const sc = g.po ? 1 : U.clamp(20 / (S.len || 20), 0.25, 1.5);
    const sr = x => { const f = Math.floor(x); return f + (Math.random() < x - f ? 1 : 0); };
    S.cc += cc; S.ccLife = (S.ccLife || 0) + cc;
    S.fans = Math.round(U.clamp(S.fans + sr(((res.won ? 2 : -2) + Math.min(2, hlCount * 0.5)) * sc) + (g.po && res.won ? 3 : 0), 0, 100));
    if (res.won) S.totW++; else S.totL++;
    CK.FO.afterGame(g, res);
    S.lastRes = { home: g.home.id, away: g.away.id, hs: res.hs, as: res.as, won: res.won, cc, po: g.po, label: g.label, season: S.season };
    // stats table
    const mine = L.roster(g.me).map(p => ({ p, b: res.box[p.id] })).filter(x => x.b && x.b.gp).sort((a, b) => b.b.pts - a.b.pts);
    const best = mine[0];
    const tbl = '<table class="box"><tr><th></th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>FG</th><th>3P</th></tr>' +
      mine.map(x => '<tr><td>' + U.esc(L.short(x.p)) + '</td><td>' + x.b.pts + '</td><td>' + x.b.reb + '</td><td>' + x.b.ast + '</td><td>' + x.b.stl + '</td><td>' + x.b.blk + '</td><td>' + x.b.fgm + '-' + x.b.fga + '</td><td>' + x.b.tpm + '-' + x.b.tpa + '</td></tr>').join('') + '</table>';
    const hlNames = { dunk: 'DUNK', oop: 'ALLEY-OOP', splash: 'SPLASH 3', block: 'BLOCK', ankles: 'ANKLE BREAKER' };
    const hlTxt = res.hl.filter(h => hlNames[h]).map(h => hlNames[h]);
    const hlSum = Object.entries(hlTxt.reduce((a, h) => (a[h] = (a[h] || 0) + 1, a), {})).map(([k, v]) => v + 'x ' + k).join(' / ');
    overlay('<h2 class="' + (res.won ? 'win' : 'loss') + '">' + (res.won ? 'WIN' : 'LOSS') + '</h2>' + scoreLine() +
      (best ? '<div class="pog">PLAYER OF THE GAME<b>' + U.esc(L.name(best.p)) + '</b>' + best.b.pts + ' PTS / ' + best.b.reb + ' REB / ' + best.b.ast + ' AST</div>' : '') +
      tbl + (hlSum ? '<div class="hls">' + hlSum + '</div>' : '') +
      '<div class="earnb">' + earn.lines.map(l => '<div><span>' + l[0] + '</span><b>' + (l[1] ? '+' + l[1] : '') + '</b></div>').join('') + '<div class="tot"><span>COACH CREDITS</span><b>+' + cc + '</b></div></div><button class="btn" id="fgo">CONTINUE</button>', () => {
        root.querySelector('#fgo').onclick = () => { closeOverlay(); M.exit(); g.done && g.done(res); };
      });
    CK.SFX.play(res.won ? 'cheer' : 'buzzer');
  }
  function finishExhib(res) {
    const both = [g.away, g.home].map(t => { const ps = L.roster(t).map(p => ({ p, b: res.box[p.id] })).filter(x => x.b && x.b.gp && (x.b.pts || x.b.reb || x.b.ast)).sort((a, b) => b.b.pts - a.b.pts).slice(0, 5); return '<div class="lbl">' + t.ab + '</div>' + ps.map(x => '<div class="pr"><span>' + U.esc(L.short(x.p)) + '</span><b>' + x.b.pts + ' PTS</b> ' + x.b.reb + ' REB ' + x.b.ast + ' AST</div>').join(''); }).join('');
    const html = '<h2 class="' + (res.won ? 'win' : 'loss') + '">' + (res.won ? 'YOU WIN' : 'YOU LOSE') + '</h2>' + scoreLine() + '<div class="perf">' + both + '</div>';
    if (g.net) { netEv({ k: 'final', html: '<h2 class="' + (!res.won ? 'win' : 'loss') + '">' + (!res.won ? 'YOU WIN' : 'YOU LOSE') + '</h2>' + scoreLine() + '<div class="perf">' + both + '</div>' }); }
    overlay(html + (g.net ? '' : '<button class="btn" id="fagain">PLAY AGAIN</button>') + '<button class="btn alt" id="fgo">MENU</button>', () => {
      const ag = root.querySelector('#fagain'); if (ag) ag.onclick = () => { closeOverlay(); M.exit(); g.done && g.done(res, 'again'); };
      root.querySelector('#fgo').onclick = () => { closeOverlay(); M.exit(); g.done && g.done(res); };
    });
    CK.SFX.play(res.won ? 'cheer' : 'buzzer');
  }
  // sim an entire game without playing
  M.simGame = (opts, done) => {
    const S = CK.S, home = L.T(opts.home), away = L.T(opts.away);
    const meHome = home.id === S.me;
    g = { home, away, meHome, me: meHome ? home : away, opp: meHome ? away : home, hs: 0, as: 0, box: {}, hl: [], po: !!opts.po, label: opts.label, lineH: L.lineup(home), lineA: L.lineup(away) };
    for (let q = 0; q < 4; q++) for (let i = 0; i < POSS_Q; i++) { g.hs += simPoss(home, away).pts; g.as += simPoss(away, home).pts; }
    while (g.hs === g.as) for (let i = 0; i < 10; i++) { g.hs += simPoss(home, away).pts; g.as += simPoss(away, home).pts; }
    [g.lineH, g.lineA].forEach(l => l.st.concat(l.bench.slice(0, 3)).forEach(p => { const b = g.box[p.id] || (g.box[p.id] = L.blankStats()); b.gp = 1; }));
    const res = { hs: g.hs, as: g.as, box: g.box, won: meHome ? g.hs > g.as : g.as > g.hs, hl: [], played: false };
    root = document.getElementById('game'); root.classList.add('on', 'simonly');
    finish(res);
    root.querySelector('#fgo').onclick = () => { closeOverlay(); root.classList.remove('on', 'simonly'); g.done = null; done(res); };
  };

  // ---------- loop ----------
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (!g) return;
    let dt = Math.max(0, Math.min(0.1, (ts - last) / 1000)); last = ts;
    g.hype = Math.max(0, g.hype - dt * 0.5);
    if (g.guest) return guestFrame(dt);
    if (g.paused) return;
    if (g.mode === 'tip' && g.tip) return tipFrame(dt);
    if (E.st && g.mode === 'live') {
      acc += dt;
      while (acc >= 1 / 60) {
        // screen stick -> court directions for whichever way this possession attacks
        const d = E.st.dir || 1, tr = I => ({ jx: d * I.jy, jy: -d * I.jx, A: I.A, Ap: I.Ap, Ar: I.Ar, Bp: I.Bp, Cp: I.Cp, mv: I.mv, tap: I.tap, pass: I.pass });
        const I2 = g.net && !g.netGone ? tr(g.net.input()) : null;
        E.update(1 / 60, tr(CK.IN), I2); CK.IN.consume(); acc -= 1 / 60; blockLabel();
        if (!E.st || !g) break;
      }
      if (E.st) {
        const sc = root.querySelector('#sc'); sc.textContent = Math.max(0, Math.ceil(Math.min(E.st.sc, E.st.gc))); sc.classList.toggle('low', E.st.sc < 5);
        if (g.full) { const c = root.querySelector('#gclk'); if (c) c.textContent = qName() + ' ' + clk(E.st.gc); }
      }
    }
    if (g.net && E.st) g.net.snap(snapshot());
    if (E.st) CK.RD.draw(ctx, { hype: g.hype, keepCam: !!(g.full && g.lastRes), clutch: isClutch() });
    else if (g.mode !== 'final') { CK.RD.drawIdle && CK.RD.drawIdle(ctx); }
  }

  // ---------- HUD / overlays ----------
  const logoImg = t => (CK.S && CK.S.logos === 'retro') || !t.logo ? '' : CK.UI.logoTag(CK.logoUrl(t.logo), 'mlg', 32);
  const clk = s => s >= 60 ? U.clock(s) : (Math.max(0, s)).toFixed(1);
  // TV-style score bug: [AWAY logo | AB | score] [HOME logo | AB | score] [quarter + clock] [shot clock]
  let lastSc = null;
  function hud() {
    const h = root.querySelector('#hud');
    const tm = (t, sc, k) => '<div class="sbt ' + k + (g.posT === k ? ' pos' : '') + (lastSc && lastSc[k] !== sc ? ' pop' : '') + '" style="--c:' + t.c1 + ';--c2:' + t.c2 + '"><span class="sbl">' + (logoImg(t) || '<u>' + t.ab[0] + '</u>') + '</span><i>' + t.ab + '</i><b>' + sc + '</b></div>';
    h.innerHTML = '<div class="sb">' + tm(g.away, g.as, 'away') + tm(g.home, g.hs, 'home') +
      '<div class="sbc"><span id="gclk">' + qName() + ' ' + clk(g.sec) + '</span></div><div class="sbs"><small>SHOT</small><span id="sc">24</span></div></div>';
    lastSc = { away: g.as, home: g.hs };
  }
  function hudPos() { const h = root.querySelector('#hud'); if (!h) return; h.querySelectorAll('.sbt').forEach(el => el.classList.toggle('pos', el.classList.contains(g.posT))); }
  function setButtons(user) {
    const a = root.querySelector('#btnA'), b = root.querySelector('#btnB'), c = root.querySelector('#btnC');
    a.textContent = user === 'off' ? 'SHOOT' : 'CONTEST'; a.classList.remove('blk');
    b.textContent = 'PASS'; b.style.visibility = user === 'off' ? 'visible' : 'hidden';
    c.textContent = 'STEAL'; c.style.visibility = user === 'off' ? 'hidden' : 'visible';
    root.querySelectorAll('.gb.mv').forEach(el => el.style.visibility = user === 'off' ? 'visible' : 'hidden');
    root.classList.toggle('udef', user !== 'off');
  }
  // on defense the CONTEST button turns into BLOCK while a shot is going up
  function blockLabel() {
    const st = E.st; if (!st || st.cfg.user !== 'def' || st.cfg.both) return;
    const b = st.ball, up = (b.s === 'hold' && b.h && b.h.side === 0 && (b.h.state === 'shoot' || b.h.state === 'fin')) || b.s === 'shot';
    const a = root.querySelector('#btnA');
    if (up !== a.classList.contains('blk')) { a.classList.toggle('blk', up); a.textContent = up ? 'BLOCK' : 'CONTEST'; }
  }
  let bTimer = 0;
  function banner(html, ms, then, skippable) {
    if (g && g.net) netEv({ k: 'ban', html, ms });
    const el = root.querySelector('#banner'); el.innerHTML = html; el.classList.add('on');
    clearTimeout(bTimer);
    const go = () => { clearTimeout(bTimer); el.classList.remove('on'); el.onclick = null; then && then(); then = null; };
    bTimer = setTimeout(go, ms);
    el.onclick = () => { if (skippable || ms > 1400) go(); };
  }
  function flash(t) { if (g && g.net) netEv({ k: 'flash', t }); flashLocal(t); }
  function flashLocal(t) { const el = root.querySelector('#flash'); el.textContent = t; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
  function overlay(html, bind) { const el = root.querySelector('#ov'); el.innerHTML = '<div class="card">' + html + '</div>'; el.classList.add('on'); bind && bind(); }
  function closeOverlay() { root.querySelector('#ov').classList.remove('on'); }
  M.pause = () => {
    if (!g || g.mode === 'final' || g.mode === 'half') return;
    if (g.net || g.guest) {
      overlay('<h2>LEAVE GAME?</h2><p>The game keeps going while this is open.</p><button class="btn" id="pr">KEEP PLAYING</button><button class="btn alt red" id="pq">LEAVE</button>', () => {
        root.querySelector('#pr').onclick = closeOverlay;
        root.querySelector('#pq').onclick = () => { closeOverlay(); const n = g.net || g.gnet; n && n.close(); const d = g.done; M.exit(); d && d(null, 'left'); };
      });
      return;
    }
    g.paused = true;
    overlay('<h2>PAUSED</h2>' + scoreLine() + '<button class="btn" id="pr">RESUME</button><button class="btn alt" id="ps">SIM TO END</button><label class="tg"><input type="checkbox" id="psnd" ' + (CK.SFX.on ? 'checked' : '') + '> SOUND</label>', () => {
      root.querySelector('#pr').onclick = () => { closeOverlay(); g.paused = false; last = performance.now(); };
      root.querySelector('#psnd').onchange = e => { CK.SFX.on = e.target.checked; CK.S.sfx = CK.SFX.on; if (!CK.SFX.on) CK.SFX.crowd(false); };
      root.querySelector('#ps').onclick = () => {
        closeOverlay(); g.paused = false; E.st = null; clearTimeout(bTimer); root.querySelector('#banner').classList.remove('on');
        // sim what is left of this quarter and the rest
        const left = g.full ? Math.round(g.sec / g.qsec * POSS_Q) : g.steps.slice(g.si).reduce((a, s) => a + (s.k === 'sim' ? s.n : 0.5), 0);
        for (let i = 0; i < left + (4 - Math.min(4, g.q)) * POSS_Q; i++) { g.hs += simPoss(g.home, g.away).pts; g.as += simPoss(g.away, g.home).pts; }
        while (g.hs === g.as) { g.hs += simPoss(g.home, g.away).pts; g.as += simPoss(g.away, g.home).pts; }
        g.q = Math.max(4, g.q); g.sec = 0; hud(); final();
      };
    });
  };
  M.exit = () => { cancelAnimationFrame(raf); CK.inGame = false; CK.SFX.crowd(false); removeEventListener('resize', fit); root.classList.remove('on', 'online'); E.st = null; if (g && g.net) g.net.close(); if (g && g.gnet) g.gnet.close(); };

  // ---------- online: host side ----------
  const NET_FX = new Set(['swish', 'rim', 'dunk', 'block', 'steal', 'ankles', 'whistle', 'buzzer', 'cheer']);
  function netEv(ev) { if (g && g.net && !g.netGone) g.net.event(ev); }
  const SC = ['run', 'shoot', 'fin', 'jump', 'pass', 'reach', 'ftm'];
  const r2 = v => Math.round(v * 100) / 100;
  function snapshot() {
    const st = E.st, b = st.ball;
    return {
      t: r2(st.t), d: st.dir, ph: st.phase, oh: st.cfg.off.home ? 1 : 0, hs: g.hs, as: g.as, q: g.q, ot: g.ot, gc: r2(Math.min(st.gc, g.sec + 1)), sc: Math.ceil(st.sc),
      e: st.ents.map(e => [e.id, r2(e.x), r2(e.y), r2(e.z), r2(e.vx), r2(e.vy), e.face, SC.indexOf(e.state), (e.fell ? 1 : 0) | (e.hang > 0 ? 2 : 0) | (e.dunk ? 4 : 0) | (e.fire ? 8 : 0) | (e.released ? 16 : 0) | (e.userShot ? 32 : 0), r2(e.run), r2(e.stT), r2(e.win || 0), e.labelT > 0 ? e.label : 0]),
      b: [b.s, b.s === 'hold' && b.h ? st.ents.indexOf(b.h) : -1, r2(b.x), r2(b.y), r2(b.z)],
      uo: st.ents.indexOf(st.uo), ud: st.ents.indexOf(st.ud),
      pops: st.pops.map(p => [p.text, p.y, p.col, p.s, r2(p.t), p.life]), sh: r2(st.shake), rim: st.rimT > 0 ? 1 : 0, net: st.netT > 0 ? 1 : 0,
      ft: st.phase === 'ft' ? [st.ftState, r2(st.ftM || 0)] : 0, res: st.result ? st.result.tag : 0
    };
  }
  M.startData = (home, away) => {
    const pl = p => ({ id: p.id, fn: p.fn, ln: p.ln, pos: p.pos, ht: p.ht, num: p.num, skin: p.skin, hair: p.hair, hc: p.hc });
    const tm = t => ({ ab: t.ab, city: t.city, c1: t.c1, c2: t.c2, name: t.name, logo: t.logo, w: 0, l: 0 });
    return { home: tm(home), away: tm(away), hp: L.lineup(home).st.slice(0, 5).map(pl), ap: L.lineup(away).st.slice(0, 5).map(pl) };
  };

  // ---------- online: guest side (draws the host's game, sends controls) ----------
  M.watch = (G, data, guestIsHome, done) => {
    const home = data.home, away = data.away;
    const players = {}; data.hp.concat(data.ap).forEach(p => players[p.id] = Object.assign({ r: { sht: 5, ins: 5, pas: 5, def: 5, ath: 5 } }, p));
    const homeIds = new Set(data.hp.map(p => p.id));
    g = { guest: true, gnet: G, home, away, me: guestIsHome ? home : away, opp: guestIsHome ? away : home, meHome: guestIsHome, hs: 0, as: 0, q: 1, ot: 0, sec: 0, hype: 0, mode: 'live', done, ents: {}, players, homeIds, view: null };
    E.st = null; root = document.getElementById('game'); root.classList.add('on', 'online');
    canvas = root.querySelector('canvas'); ctx = canvas.getContext('2d'); canvas.width = E.W; canvas.height = E.H;
    CK.RD.buildCourt(home, away);
    CK.inGame = true; CK.IN.reset(); CK.SFX.crowd(true);
    fit(); addEventListener('resize', fit); hud();
    G.onEvent = ev => {
      if (!g || !g.guest) return;
      if (ev.k === 'ban') bannerLocal(ev.html, ev.ms);
      else if (ev.k === 'say') sayLocal(ev.t);
      else if (ev.k === 'fx') { CK.SFX.play(ev.f); if (ev.f === 'dunk' || ev.f === 'block' || ev.f === 'ankles') g.hype = 1; }
      else if (ev.k === 'flash') flashLocal(ev.t);
      else if (ev.k === 'final') { g.mode = 'final'; overlay(ev.html + '<button class="btn alt" id="fgo">MENU</button>', () => { root.querySelector('#fgo').onclick = () => { closeOverlay(); M.exit(); done && done(); }; }); }
    };
    G.onGone = () => { if (g && g.guest && g.mode !== 'final') overlay('<h2>GAME OVER</h2><p>Your friend left the game.</p><button class="btn alt" id="fgo">MENU</button>', () => { root.querySelector('#fgo').onclick = () => { closeOverlay(); M.exit(); done && done(); }; }); };
    last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  };
  function guestFrame(dt) {
    const G = g.gnet, s = G.snap;
    g.hype = Math.max(0, g.hype - dt * 0.5);
    G.send(CK.IN); CK.IN.consume();
    if (!s) { CK.RD.drawIdle(ctx); return; }
    // build / update a stand-in engine state the renderer can draw
    const offHome = !!s.oh, mySide = (offHome === g.meHome) ? 'off' : 'def';
    let st = g.view;
    if (!st || st.dir !== s.d || st.offHome !== offHome || st.poss !== s.e[0][0] + s.e[5][0]) {
      const ents = s.e.map((a, i) => {
        const side = i < 5 ? 0 : 1, pl = g.players[a[0]] || { id: a[0], ln: '?', ht: 78, num: 0, skin: 2, hair: 0, hc: 0, r: {} };
        return { id: a[0], pl, side, i: i % 5, ht: pl.ht, x: a[1], y: a[2], z: a[3], vx: 0, vy: 0, face: 1, run: 0, state: 'run', stT: 0 };
      });
      st = g.view = { cfg: { off: M.jersey(offHome ? g.home : g.away, offHome), def: M.jersey(offHome ? g.away : g.home, !offHome), user: mySide }, dir: s.d, offHome, poss: s.e[0][0] + s.e[5][0], ents, ball: { s: 'hold', x: 0, y: 0, z: 0 }, pops: [], parts: [], t: 0, shake: 0, camInit: false };
      setButtons(mySide);
    }
    st.t = s.t; st.phase = s.ph; st.shake = s.sh; st.rimT = s.rim ? 0.2 : 0; st.netT = s.net ? 0.3 : 0;
    st.result = s.res ? { tag: s.res } : null;
    const k = Math.min(1, dt * 14);
    s.e.forEach((a, i) => {
      const e = st.ents[i];
      e.x += (a[1] - e.x) * k; e.y += (a[2] - e.y) * k; e.z = a[3]; e.vx = a[4]; e.vy = a[5]; e.face = a[6]; e.state = SC[a[7]] || 'run';
      e.fell = !!(a[8] & 1); e.hang = a[8] & 2 ? 0.1 : 0; e.dunk = !!(a[8] & 4); e.fire = !!(a[8] & 8); e.released = !!(a[8] & 16);
      e.run = a[9]; e.stT = a[10]; e.win = a[11]; e.label = a[12] || null; e.labelT = a[12] ? 0.5 : 0; e.ball = false;
    });
    const mine = mySide === 'off' ? s.uo : s.ud;
    st.user = mine >= 0 ? st.ents[mine] : null;
    st.ents.forEach(e => e.userShot = false);
    if (st.user && (s.e[mine][8] & 32)) st.user.userShot = true;
    const b = st.ball; b.s = s.b[0]; b.h = s.b[1] >= 0 ? st.ents[s.b[1]] : null; if (b.h) b.h.ball = true;
    b.x += (s.b[2] - b.x) * (b.s === 'shot' ? 1 : k); b.y += (s.b[3] - b.y) * (b.s === 'shot' ? 1 : k); b.z = s.b[4];
    st.pops = s.pops.map(p => ({ text: p[0], y: p[1], col: p[2], s: p[3], t: p[4], life: p[5] }));
    if (s.ft) { st.ftState = s.ft[0]; st.ftM = s.ft[1]; } else st.ftState = null;
    st.ftMine = mySide === 'off';
    if (g.hs !== s.hs || g.as !== s.as || g.q !== s.q) { g.hs = s.hs; g.as = s.as; g.q = s.q; g.ot = s.ot; g.sec = s.gc; hud(); }
    const c = root.querySelector('#gclk'); if (c) c.textContent = qName() + ' ' + clk(s.gc);
    const sc = root.querySelector('#sc'); if (sc) sc.textContent = Math.max(0, Math.min(s.sc, Math.ceil(s.gc)));
    E.st = st; CK.RD.draw(ctx, { hype: g.hype });
    if (performance.now() - G.snapT > 8000 && g.mode !== 'final' && !g.lostShown) { g.lostShown = true; flashLocal('WAITING FOR CONNECTION...'); }
  }
  function bannerLocal(html, ms) { const el = root.querySelector('#banner'); el.innerHTML = html; el.classList.add('on'); clearTimeout(bTimer); bTimer = setTimeout(() => el.classList.remove('on'), ms); }
  function sayLocal(t) { const el = root.querySelector('#ticker'); el.textContent = t; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
  M.g = () => g;
})(window.CK);
