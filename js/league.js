// Court Kings - league model: players, teams, schedule, sim, standings, playoffs
(function (CK) {
  const U = CK.U, L = CK.L = {};
  CK.S = null; // live save state

  // ---------- players ----------
  L.ovr = p => { const w = CK.POS_W[p.pos]; return CK.RKEYS.reduce((s, k, i) => s + p.r[k] * w[i], 0); };
  L.stars = p => U.clamp(Math.round(L.ovr(p)) / 2, 0.5, 5);
  L.salaryFor = p => { const o = L.ovr(p); let s = Math.max(1.2, 0.95 * Math.pow(Math.max(0, o - 3.4), 2) + 1); if (p.age >= 32) s *= 0.8; if (p.age <= 22) s *= 0.85; return Math.round(s * 14.5) / 10; };
  L.name = p => p.fn + ' ' + p.ln;
  L.short = p => (p.fn ? p.fn[0] + '. ' : '') + p.ln;

  L.newPlayer = (pos, level, age) => {
    const tpl = CK.POS_TPL[pos], r = {};
    CK.RKEYS.forEach((k, i) => { r[k] = U.clamp(Math.round(level + tpl[i] * 0.8 + U.gauss() * 1.1), 1, 10); });
    const ht = CK.POS_HT[pos];
    const p = {
      id: U.uid(), fn: U.pick(CK.FIRST), ln: U.pick(CK.LAST), pos, age: age || U.irand(21, 33),
      ht: U.irand(ht[0], ht[1]), num: U.irand(0, 45), skin: U.irand(0, 5), hair: U.irand(0, 5), hc: U.irand(0, 5),
      r, pot: U.clamp(Math.round(U.rand(1, 5.4)), 1, 5), sal: 1, yrs: U.irand(1, 4), morale: U.irand(55, 85), inj: 0,
      st: L.blankStats(), car: L.blankStats(), seasons: 0, tm: -1
    };
    if (p.hair === 5 && p.skin >= 3) p.hc = 0;
    p.sal = L.salaryFor(p);
    return p;
  };
  L.blankStats = () => ({ gp: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0 });

  // ---------- teams ----------
  L.P = id => CK.S.players[id];
  L.roster = t => t.roster.map(L.P).filter(Boolean);
  L.payroll = t => L.roster(t).reduce((s, p) => s + p.sal, 0);
  L.autoStarters = t => {
    const avail = L.roster(t).filter(p => !p.inj).sort((a, b) => L.ovr(b) - L.ovr(a));
    const st = [];
    CK.POS.forEach(pos => { const p = avail.find(x => x.pos === pos && !st.includes(x)); if (p) st.push(p); });
    for (const p of avail) { if (st.length >= 5) break; if (!st.includes(p)) st.push(p); }
    t.start = st.slice(0, 5).map(p => p.id);
  };
  // lineup used for a game: starters with injured swapped out
  L.lineup = t => {
    const ro = L.roster(t), healthy = ro.filter(p => !p.inj);
    let st = t.start.map(L.P).filter(p => p && !p.inj && t.roster.includes(p.id));
    const bench = healthy.filter(p => !st.includes(p)).sort((a, b) => L.ovr(b) - L.ovr(a));
    while (st.length < 5 && bench.length) st.push(bench.shift());
    // order by position for court spots
    st.sort((a, b) => CK.POS.indexOf(a.pos) - CK.POS.indexOf(b.pos));
    return { st, bench };
  };
  L.teamOvr = t => {
    const { st, bench } = L.lineup(t);
    const s = st.reduce((a, p) => a + L.ovr(p) * (0.85 + p.morale / 700), 0) / Math.max(1, st.length);
    const b = bench.slice(0, 3).reduce((a, p) => a + L.ovr(p), 0) / Math.max(1, Math.min(3, bench.length));
    return s * 0.78 + (b || s - 2) * 0.22;
  };
  L.teamStars = t => U.clamp(Math.round((1.5 + (L.teamOvr(t) - 5.3) * 2.7) * 2) / 2, 0.5, 5);
  L.offRating = t => { const { st } = L.lineup(t); return st.reduce((a, p) => a + p.r.sht * 0.45 + p.r.ins * 0.3 + p.r.pas * 0.15 + p.r.ath * 0.1, 0) / 5; };
  L.defRating = t => { const { st } = L.lineup(t); return st.reduce((a, p) => a + p.r.def * 0.65 + p.r.ath * 0.25 + (p.ht - 78) * 0.08, 0) / 5; };

  // ---------- new league ----------
  L.newLeague = opts => {
    const S = CK.S = {
      v: 1, season: 2027, coach: opts.coach || 'Coach', diff: opts.diff || 1, len: opts.len || 20, ppq: opts.ppq || 3,
      me: opts.team, teams: [], players: {}, schedule: [], round: 0, phase: 'season', playoff: null,
      cc: 12, fans: 50, owner: 60, fac: { train: 1, med: 1, arena: 1 }, inbox: [], news: [], history: [], trophies: [],
      draft: null, fa: [], log: [], deadline: false, totW: 0, totL: 0, picks: {}, sfx: true, lastRes: null
    };
    const levels = U.shuffle(Array.from({ length: 30 }, (_, i) => 4.6 + i * 0.075));
    const real = opts.real !== false;
    const byTeam = {};
    if (real) CK.REAL.players.forEach(a => {
      const [n, tm, pos, age, ht, num, sht, ins, pas, def, ath, pot, sal, yrs, skin, hair, out] = a;
      const sp = n.indexOf(' ');
      const p = { id: U.uid(), fn: sp > 0 ? n.slice(0, sp) : '', ln: sp > 0 ? n.slice(sp + 1) : n, pos, age, ht, num, skin, hair, hc: hair === 5 ? 0 : (skin >= 3 ? 0 : U.irand(0, 3)),
        r: { sht, ins, pas, def, ath }, pot, sal, yrs, morale: U.irand(60, 85), inj: out ? U.irand(2, 8) : 0, st: L.blankStats(), car: L.blankStats(), seasons: 1, tm: -1, real: true };
      (byTeam[tm] = byTeam[tm] || []).push(p);
    });
    S.real = real;
    CK.TEAMS.forEach((d, i) => {
      const t = { id: i, ab: d[0], city: d[1], c1: d[2], c2: d[3], conf: d[4], name: d[5], logo: d[6], roster: [], start: [], w: 0, l: 0, pf: 0, pa: 0, strk: 0 };
      const lv = levels[i];
      if (real) {
        const ps = (byTeam[t.ab] || []).sort((a, b) => L.ovr(b) - L.ovr(a));
        ps.forEach((p, k) => { S.players[p.id] = p; if (k < 14) { p.tm = i; t.roster.push(p.id); } else { p.tm = -2; S.fa.push(p.id); } });
        while (t.roster.length < 12) { const p = L.newPlayer(U.pick(CK.POS), U.rand(2.5, 4)); p.tm = i; S.players[p.id] = p; t.roster.push(p.id); }
        L.uniqueNums(t); L.autoStarters(t); S.teams.push(t); return;
      }
      const plan = ['PG', 'SG', 'SF', 'PF', 'C', 'PG', 'SG', 'SF', 'PF', 'C', U.pick(CK.POS)];
      plan.forEach((pos, k) => {
        const level = k < 5 ? lv + U.rand(-0.6, 0.9) + (k === 0 || k === 2 ? 0.4 : 0) : lv - U.rand(1.2, 2.4);
        const p = L.newPlayer(pos, level); p.tm = i; S.players[p.id] = p; t.roster.push(p.id);
      });
      // one star on most teams
      if (Math.random() < 0.7) { const star = S.players[t.roster[U.irand(0, 4)]]; CK.RKEYS.forEach(k => { star.r[k] = Math.min(10, star.r[k] + (U.chance(0.6) ? 1 : 0)); }); star.sal = L.salaryFor(star); }
      L.uniqueNums(t);
      L.autoStarters(t);
      S.teams.push(t);
    });
    L.fitCaps();
    L.makeSchedule();
    L.inbox('Welcome to ' + L.myTeam().city, 'The owner hired you to bring a title to ' + L.myTeam().city + '. Win games to earn Coach Credits, keep the fans happy, and do not let the owner lose faith.');
    return S;
  };
  L.uniqueNums = t => { const used = new Set(); L.roster(t).sort((a, b) => (b.real ? 1 : 0) - (a.real ? 1 : 0)).forEach(p => { while (used.has(p.num)) p.num = U.irand(0, 45); used.add(p.num); }); };
  L.fitCaps = () => { CK.S.teams.forEach(t => { let pay = L.payroll(t); if (pay > CK.APRON) { const f = CK.APRON * 0.97 / pay; L.roster(t).forEach(p => p.sal = Math.max(1, Math.round(p.sal * f * 10) / 10)); } }); };
  L.myTeam = () => CK.S.teams[CK.S.me];
  L.T = id => CK.S.teams[id];

  // ---------- schedule ----------
  L.makeSchedule = () => {
    const S = CK.S, n = 30, sch = [];
    const ids = Array.from({ length: n }, (_, i) => i);
    for (let r = 0; r < S.len; r++) {
      // circle method rotation for variety
      const arr = [ids[0], ...ids.slice(1).map((_, k) => ids[1 + ((k + r) % (n - 1))])];
      const games = [];
      for (let k = 0; k < n / 2; k++) { const a = arr[k], b = arr[n - 1 - k]; games.push((r + k) % 2 ? [a, b] : [b, a]); }
      sch.push(games);
    }
    S.schedule = sch; S.round = 0;
    S.teams.forEach(t => { t.w = t.l = t.pf = t.pa = t.strk = 0; });
  };
  L.myGame = () => {
    const S = CK.S;
    if (S.phase === 'season') { const g = S.schedule[S.round]; if (!g) return null; const m = g.find(x => x[0] === S.me || x[1] === S.me); return m ? { home: m[0], away: m[1] } : null; }
    if (S.phase === 'playoffs') { const pl = S.playoff, s = pl.rounds[pl.r].find(x => x.a === S.me || x.b === S.me); return s && s.w == null ? { home: s.a, away: s.b, po: true } : null; }
    return null;
  };

  // ---------- simulation ----------
  L.simScore = (h, a) => {
    const S = CK.S;
    const rh = L.teamOvr(h) + 0.25, ra = L.teamOvr(a);
    const oh = L.offRating(h) - L.defRating(a), oa = L.offRating(a) - L.defRating(h);
    let hs = Math.round(110 + (rh - ra) * 9 + oh * 1.4 + U.gauss() * 10);
    let as = Math.round(110 + (ra - rh) * 9 + oa * 1.4 + U.gauss() * 10);
    while (hs === as) { hs += U.irand(0, 10); as += U.irand(0, 10); }
    return [U.clamp(hs, 72, 155), U.clamp(as, 72, 155)];
  };
  // distribute a team total across players; returns box {id:{...}}
  L.distribute = (t, pts, box) => {
    const { st, bench } = L.lineup(t);
    const ppl = st.concat(bench.slice(0, 5));
    const mins = ppl.map((p, i) => i < 5 ? U.irand(28, 37) : i < 8 ? U.irand(12, 22) : U.irand(0, 8));
    const uw = ppl.map((p, i) => mins[i] * Math.pow(p.r.sht * 0.55 + p.r.ins * 0.5 + p.r.ath * 0.25 + 1, 1.6) * U.rand(0.65, 1.35));
    const split = (tot, w) => { const s = w.reduce((a, b) => a + b, 0) || 1; let out = w.map(x => Math.floor(tot * x / s)); let left = tot - out.reduce((a, b) => a + b, 0); while (left-- > 0) out[U.irand(0, out.length - 1)]++; return out; };
    const P = split(pts, uw);
    const R = split(U.irand(38, 50), ppl.map((p, i) => mins[i] * (p.r.ins + p.r.def * 0.5 + (p.ht - 70) * 0.4)));
    const A = split(U.irand(20, 30), ppl.map((p, i) => mins[i] * Math.pow(p.r.pas, 1.7)));
    const ST = split(U.irand(4, 10), ppl.map((p, i) => mins[i] * (p.r.def + p.r.ath)));
    const B = split(U.irand(2, 8), ppl.map((p, i) => mins[i] * Math.pow(Math.max(1, p.r.def + (p.ht - 76) * 0.6), 1.5)));
    ppl.forEach((p, i) => {
      const b = box[p.id] || (box[p.id] = L.blankStats());
      if (mins[i] > 0) b.gp = 1;
      const tp = Math.round(P[i] * U.clamp(p.r.sht / 22, 0.05, 0.42) / 3);
      b.pts += P[i]; b.reb += R[i]; b.ast += A[i]; b.stl += ST[i]; b.blk += B[i];
      b.tpm += tp; b.tpa += Math.round(tp / U.rand(0.3, 0.42)) + (p.r.sht > 5 ? U.irand(0, 2) : 0);
      const twos = Math.max(0, Math.round((P[i] - tp * 3) * 0.82 / 2));
      b.fgm += twos + tp; b.fga += Math.round(twos / U.rand(0.45, 0.58)) + Math.round(tp / U.rand(0.3, 0.42));
    });
    return box;
  };
  L.recordBox = box => { Object.keys(box).forEach(id => { const p = L.P(id), b = box[id]; if (!p || !b.gp) return; for (const k in b) { p.st[k] += b[k]; p.car[k] += b[k]; } }); };
  L.applyResult = (h, a, hs, as) => {
    h.pf += hs; h.pa += as; a.pf += as; a.pa += hs;
    const hw = hs > as;
    if (hw) { h.w++; a.l++; h.strk = Math.max(1, h.strk + 1); a.strk = Math.min(-1, a.strk - 1); }
    else { a.w++; h.l++; a.strk = Math.max(1, a.strk + 1); h.strk = Math.min(-1, h.strk - 1); }
  };
  L.simGame = (hid, aid, record) => {
    const h = L.T(hid), a = L.T(aid);
    const [hs, as] = L.simScore(h, a);
    const box = {}; L.distribute(h, hs, box); L.distribute(a, as, box);
    if (record !== false) L.recordBox(box);
    return { hs, as, box };
  };
  L.injuries = t => {
    const med = t.id === CK.S.me ? CK.S.fac.med : 2;
    L.roster(t).forEach(p => {
      if (p.inj > 0) { p.inj--; return; }
      if (U.chance(0.011)) { p.inj = Math.max(1, Math.round(U.irand(1, 7) * (1.25 - med * 0.12))); if (t.id === CK.S.me) L.inbox('Injury: ' + L.name(p), L.name(p) + ' is out ' + p.inj + ' game' + (p.inj > 1 ? 's' : '') + '. Better medical facilities speed up recovery.'); }
    });
  };

  // ---------- standings ----------
  L.pct = t => t.w + t.l ? t.w / (t.w + t.l) : 0;
  L.standings = conf => CK.S.teams.filter(t => !conf || t.conf === conf).sort((a, b) => L.pct(b) - L.pct(a) || (b.pf - b.pa) - (a.pf - a.pa));
  L.seed = t => L.standings(t.conf).indexOf(t) + 1;

  // ---------- advance ----------
  // called after the user's game in this round is decided
  L.finishRound = myRes => {
    const S = CK.S;
    if (S.phase === 'season') {
      S.schedule[S.round].forEach(([h, a]) => {
        if (h === S.me || a === S.me) { L.applyResult(L.T(h), L.T(a), myRes.hs, myRes.as); return; }
        const r = L.simGame(h, a); L.applyResult(L.T(h), L.T(a), r.hs, r.as);
      });
      S.teams.forEach(L.injuries);
      S.teams.forEach(t => { if (t.id !== S.me) L.autoStarters(t); });
      S.round++;
      if (!S.deadline && S.round >= Math.floor(S.len * 0.6)) { S.deadline = true; L.inbox('Trade deadline passed', 'Trades are closed until the offseason.'); }
      if (S.round >= S.len) L.startPlayoffs();
      else CK.EV && CK.EV.maybe();
    } else if (S.phase === 'playoffs') {
      L.playoffRound(myRes);
    }
  };

  // ---------- playoffs ----------
  L.startPlayoffs = () => {
    const S = CK.S; S.phase = 'playoffs';
    const mk = conf => { const s = L.standings(conf).slice(0, 8).map(t => t.id); return [[s[0], s[7]], [s[3], s[4]], [s[1], s[6]], [s[2], s[5]]]; };
    const r1 = mk('E').concat(mk('W')).map(([a, b]) => ({ a, b, w: null }));
    S.playoff = { r: 0, rounds: [r1], champ: null };
    const me = L.myTeam(), sd = L.seed(me);
    if (sd <= 8) L.inbox('Playoffs!', 'You clinched the ' + U.ord(sd) + ' seed. Every round is one game. Win or go home.');
    else L.inbox('Season over', 'You finished ' + U.ord(sd) + ' in the conference and missed the playoffs. The rest of the bracket will be simmed.');
  };
  L.ROUND_NAMES = ['FIRST ROUND', 'CONF SEMIS', 'CONF FINALS', 'THE FINALS'];
  L.playoffRound = myRes => {
    const S = CK.S, pl = S.playoff, cur = pl.rounds[pl.r];
    cur.forEach(s => {
      if (s.w != null) return;
      let hs, as;
      if ((s.a === S.me || s.b === S.me) && myRes) { hs = myRes.hs; as = myRes.as; }
      else { const r = L.simGame(s.a, s.b); hs = r.hs; as = r.as; }
      s.hs = hs; s.as = as; s.w = hs > as ? s.a : s.b;
    });
    if (pl.r === 3) { pl.champ = cur[0].w; L.endSeason(); return; }
    const nx = [];
    for (let i = 0; i < cur.length; i += 2) {
      let a = cur[i].w, b = cur[i + 1].w;
      if (L.pct(L.T(b)) > L.pct(L.T(a))) [a, b] = [b, a];
      nx.push({ a, b, w: null });
    }
    pl.rounds.push(nx); pl.r++;
  };
  L.inPlayoffs = () => { const S = CK.S; if (S.phase !== 'playoffs') return false; const cur = S.playoff.rounds[S.playoff.r]; return cur.some(s => (s.a === S.me || s.b === S.me) && s.w == null); };
  L.simRestOfPlayoffs = () => { const S = CK.S; let guard = 0; while (S.phase === 'playoffs' && guard++ < 6) L.playoffRound(null); };

  L.endSeason = () => { const S = CK.S; S.phase = 'awards'; CK.OFF && CK.OFF.seasonReview(); };

  // ---------- inbox / news ----------
  L.inbox = (title, body, choices) => { CK.S.inbox.unshift({ id: U.uid(), title, body, choices: choices || null, read: false, season: CK.S.season, rnd: CK.S.round }); CK.S.inbox = CK.S.inbox.slice(0, 40); };
  L.save = () => U.save('ck_save_v1', CK.S);
  L.load = () => { const s = U.load('ck_save_v1', null); if (s && s.v === 1) { CK.S = s; L.migrate(s); return true; } return false; };
  // v1 saves had made-up team names: attach real names/logos and scale salaries to the new cap
  L.migrate = s => {
    if (s.mig2) return;
    const map = { GSW: 'GS', NOP: 'NO', NYK: 'NY', SAS: 'SA', UTA: 'UTAH', WAS: 'WSH', ING: 'LAC' };
    s.teams.forEach(t => { const ab = map[t.ab] || t.ab, d = CK.TEAMS.find(x => x[0] === ab); if (d) { t.ab = d[0]; t.city = d[1]; t.c1 = d[2]; t.c2 = d[3]; t.name = d[5]; t.logo = d[6]; } });
    Object.values(s.players).forEach(p => { p.sal = Math.round(p.sal * 14.5) / 10; });
    s.mig2 = true;
  };
})(window.CK);
