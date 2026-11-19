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
      lineH: L.lineup(home), lineA: L.lineup(away), tut: !S.tutDone
    };
    buildQuarter();
    root = document.getElementById('game'); root.classList.add('on');
    canvas = root.querySelector('canvas'); ctx = canvas.getContext('2d');
    canvas.width = E.W; canvas.height = E.H;
    CK.RD.buildCourt(home, away);
    CK.inGame = true; CK.IN.reset(); CK.SFX.crowd(true);
    fit(); addEventListener('resize', fit);
    hud();
    intro();
    last = performance.now(); acc = 0;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  };
  function fit() {
    const vw = innerWidth, vh = innerHeight;
    const s = Math.min(vw / E.W, vh / E.H);
    canvas.style.width = Math.floor(E.W * s) + 'px'; canvas.style.height = Math.floor(E.H * s) + 'px';
    root.style.setProperty('--cw', Math.floor(E.W * s) + 'px');
  }
  function buildQuarter() {
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
    banner('<div class="vs"><span style="--c:' + g.away.c1 + '">' + g.away.ab + '</span><i>AT</i><span style="--c:' + g.home.c1 + '">' + g.home.ab + '</span></div><div class="sub">' + (g.label || 'WEEK ' + (S.round + 1)) + '</div>', 1800, () => next());
  }
  function next() {
    if (!g) return;
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
      const sh = wPick(ppl, (p, i) => mins(p, i) * Math.pow(p.r.sht * 0.6 + p.r.ins * 0.5 + p.r.ath * 0.2 + 1, 1.7));
      const b = B(sh.id);
      if (Math.random() < 0.09) { const m = (Math.random() < 0.6 + sh.r.sht * 0.03 ? 1 : 0) + (Math.random() < 0.6 + sh.r.sht * 0.03 ? 1 : 0); b.pts += m; pts += m; return { pts, txt: L.short(sh) + ' ' + m + '/2 at the line' }; }
      const three = Math.random() < 0.18 + sh.r.sht * 0.035;
      const pm = three ? 0.25 + sh.r.sht * 0.017 + od * 0.006 + diffAdj : 0.41 + sh.r.ins * 0.018 + od * 0.008 + diffAdj;
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
    const tips = user === 'off' ? 'Move with the stick. Hold SHOOT, let go at the top of the meter. Tap a teammate or PASS. MOVE breaks ankles. Green ring = open.' : 'You guard the ball. CONTEST to jump at shooters, STEAL to poke it. Stay between your man and the rim.';
    const clutch = step.clutch && Math.abs(g.hs - g.as) <= 8;
    let html = '<div class="big">' + (user === 'off' ? 'YOUR BALL' : 'DEFENSE') + '</div>';
    if (clutch) html = '<div class="clutch">CLUTCH TIME</div>' + html;
    html += '<div class="sub">' + qName() + ' ' + U.clock(g.sec) + '</div>';
    if (g.tut && g.live < 2) html += '<div class="tip">' + tips + '</div>';
    setButtons(user);
    banner(html, g.tut && g.live < 2 ? 3200 : clutch ? 1500 : 1000, () => {
      g.mode = 'live'; g.live++;
      if (g.live >= 2 && g.tut) { g.tut = false; CK.S.tutDone = true; }
      const st = E.start({
        off: Object.assign({ players: lo.st.slice(0, 5) }, M.jersey(offT, offT === g.home)),
        def: Object.assign({ players: ld.st.slice(0, 5) }, M.jersey(defT, defT === g.home)),
        user, diff: CK.S.diff, onEnd: r => liveEnd(r, step, offT), onFx: onFx
      });
      st.ents.forEach(e => { if (g.fire[e.id]) e.fire = true; });
      g.clutch = clutch;
    });
  }
  function onFx(k) {
    CK.SFX.play(k);
    if (k === 'dunk' || k === 'block' || k === 'ankles') g.hype = 1;
    if (k === 'cheer') g.hype = Math.max(g.hype, 0.7);
  }
  function liveEnd(r, step, offT) {
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
    overlay('<h2>HALFTIME</h2>' + scoreLine() + '<div class="perf">' + rows + '</div><button class="btn" id="hgo">START Q3</button>', () => {
      root.querySelector('#hgo').onclick = () => { closeOverlay(); g.q = 3; buildQuarter(); banner('<div class="big">Q3</div>', 1000, next); };
    });
  }
  function topPerformers(t, n) {
    return L.roster(t).map(p => ({ p, b: g.box[p.id] })).filter(x => x.b).sort((a, b) => (b.b.pts + b.b.reb + b.b.ast) - (a.b.pts + a.b.reb + a.b.ast)).slice(0, n)
      .map(x => '<div class="pr"><span>' + U.esc(L.short(x.p)) + '</span><b>' + x.b.pts + ' PTS</b> ' + x.b.reb + ' REB ' + x.b.ast + ' AST</div>').join('');
  }
  const scoreLine = () => '<div class="fs"><span style="--c:' + g.away.c1 + '">' + g.away.ab + ' ' + g.as + '</span><span style="--c:' + g.home.c1 + '">' + g.home.ab + ' ' + g.hs + '</span></div>';
  function final() {
    g.mode = 'final'; CK.SFX.crowd(false);
    const S = CK.S, won = (g.meHome ? g.hs > g.as : g.as > g.hs);
    // credit games played
    [g.lineH, g.lineA].forEach(l => l.st.concat(l.bench.slice(0, 3)).forEach(p => { const b = g.box[p.id] || (g.box[p.id] = L.blankStats()); b.gp = 1; }));
    const res = { hs: g.hs, as: g.as, box: g.box, won, hl: g.hl.slice(), played: true };
    finish(res);
  }
  function finish(res) {
    const S = CK.S;
    L.recordBox(res.box);
    // rewards
    const hlCount = res.hl.filter(h => ['dunk', 'oop', 'splash', 'block', 'ankles'].includes(h)).length;
    let cc = (res.won ? 3 : 1) + Math.min(3, Math.floor(hlCount / 2)) + (g.meHome ? Math.floor(S.fans / 40) + (S.fac.arena - 1) * 0.5 : 0);
    if (g.po && res.won) cc += 4;
    if (!res.played) cc = Math.max(1, Math.floor(cc * 0.6));
    cc = Math.round(cc);
    S.cc += cc;
    S.fans = U.clamp(S.fans + (res.won ? 2 : -2) + Math.min(2, hlCount * 0.5) + (g.po && res.won ? 3 : 0), 0, 100);
    S.fans = Math.round(S.fans);
    if (res.won) S.totW++; else S.totL++;
    L.roster(g.me).forEach(p => p.morale = U.clamp(p.morale + (res.won ? 1 : -1) + ((res.box[p.id] && res.box[p.id].pts >= 20) ? 2 : 0), 0, 100));
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
      '<div class="earn">+' + cc + ' COACH CREDITS</div><button class="btn" id="fgo">CONTINUE</button>', () => {
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
    let dt = Math.min(0.1, (ts - last) / 1000); last = ts;
    g.hype = Math.max(0, g.hype - dt * 0.5);
    if (g.paused) return;
    if (E.st && g.mode === 'live') {
      acc += dt;
      while (acc >= 1 / 60) { E.update(1 / 60, CK.IN); CK.IN.consume(); acc -= 1 / 60; }
      if (E.st) { root.querySelector('#sc').textContent = Math.max(0, Math.ceil(E.st.sc)); root.querySelector('#sc').classList.toggle('low', E.st.sc < 5); }
    }
    if (E.st) CK.RD.draw(ctx, { hype: g.hype });
    else if (g.mode !== 'final') { CK.RD.drawIdle && CK.RD.drawIdle(ctx); }
  }

  // ---------- HUD / overlays ----------
  function hud() {
    const h = root.querySelector('#hud');
    h.innerHTML = '<div class="tm" style="--c:' + g.away.c1 + '"><i>' + g.away.ab + '</i><b>' + g.as + '</b></div>' +
      '<div class="mid"><div>' + qName() + ' ' + U.clock(g.sec) + '</div><div class="scw">SHOT <span id="sc">24</span></div></div>' +
      '<div class="tm r" style="--c:' + g.home.c1 + '"><b>' + g.hs + '</b><i>' + g.home.ab + '</i></div>';
  }
  function setButtons(user) {
    const a = root.querySelector('#btnA'), b = root.querySelector('#btnB'), c = root.querySelector('#btnC');
    a.textContent = user === 'off' ? 'SHOOT' : 'CONTEST';
    b.textContent = 'PASS'; b.style.visibility = user === 'off' ? 'visible' : 'hidden';
    c.textContent = user === 'off' ? 'MOVE' : 'STEAL';
  }
  let bTimer = 0;
  function banner(html, ms, then, skippable) {
    const el = root.querySelector('#banner'); el.innerHTML = html; el.classList.add('on');
    clearTimeout(bTimer);
    const go = () => { clearTimeout(bTimer); el.classList.remove('on'); el.onclick = null; then && then(); then = null; };
    bTimer = setTimeout(go, ms);
    el.onclick = () => { if (skippable || ms > 1400) go(); };
  }
  function flash(t) { const el = root.querySelector('#flash'); el.textContent = t; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
  function overlay(html, bind) { const el = root.querySelector('#ov'); el.innerHTML = '<div class="card">' + html + '</div>'; el.classList.add('on'); bind && bind(); }
  function closeOverlay() { root.querySelector('#ov').classList.remove('on'); }
  M.pause = () => {
    if (!g || g.mode === 'final' || g.mode === 'half') return;
    g.paused = true;
    overlay('<h2>PAUSED</h2>' + scoreLine() + '<button class="btn" id="pr">RESUME</button><button class="btn alt" id="ps">SIM TO END</button><label class="tg"><input type="checkbox" id="psnd" ' + (CK.SFX.on ? 'checked' : '') + '> SOUND</label>', () => {
      root.querySelector('#pr').onclick = () => { closeOverlay(); g.paused = false; last = performance.now(); };
      root.querySelector('#psnd').onchange = e => { CK.SFX.on = e.target.checked; CK.S.sfx = CK.SFX.on; if (!CK.SFX.on) CK.SFX.crowd(false); };
      root.querySelector('#ps').onclick = () => {
        closeOverlay(); g.paused = false; E.st = null; clearTimeout(bTimer); root.querySelector('#banner').classList.remove('on');
        // sim what is left of this quarter and the rest
        const left = g.steps.slice(g.si).reduce((a, s) => a + (s.k === 'sim' ? s.n : 0.5), 0);
        for (let i = 0; i < left + (4 - Math.min(4, g.q)) * POSS_Q; i++) { g.hs += simPoss(g.home, g.away).pts; g.as += simPoss(g.away, g.home).pts; }
        while (g.hs === g.as) { g.hs += simPoss(g.home, g.away).pts; g.as += simPoss(g.away, g.home).pts; }
        g.q = Math.max(4, g.q); g.sec = 0; hud(); final();
      };
    });
  };
  M.exit = () => { cancelAnimationFrame(raf); CK.inGame = false; CK.SFX.crowd(false); removeEventListener('resize', fit); root.classList.remove('on'); E.st = null; };
  M.g = () => g;
})(window.CK);
