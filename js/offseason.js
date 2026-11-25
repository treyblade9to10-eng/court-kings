// Court Kings - awards, owner review, aging, re-sign, draft, free agency, trades, random events
(function (CK) {
  const U = CK.U, L = CK.L, O = CK.OFF = {};

  // ---------- season review ----------
  O.seasonReview = () => {
    const S = CK.S, me = L.myTeam(), pl = S.playoff;
    // awards
    const all = Object.values(S.players).filter(p => p.tm >= 0 && p.st.gp >= Math.max(3, S.len * 0.4));
    const per = p => (p.st.pts + p.st.reb * 1.1 + p.st.ast * 1.4 + p.st.stl * 2 + p.st.blk * 2) / Math.max(1, p.st.gp) * (0.75 + L.pct(L.T(p.tm)) * 0.5);
    const mvp = all.slice().sort((a, b) => per(b) - per(a))[0];
    const dpoy = all.slice().sort((a, b) => (b.st.stl + b.st.blk) / b.st.gp + b.r.def * 0.3 - (a.st.stl + a.st.blk) / a.st.gp - a.r.def * 0.3)[0];
    const roy = all.filter(p => p.seasons === 0 && p.age <= 23).sort((a, b) => per(b) - per(a))[0];
    const champ = L.T(pl.champ);
    let finish = 'Missed playoffs';
    const rounds = pl.rounds;
    for (let r = rounds.length - 1; r >= 0; r--) { const s = rounds[r].find(x => x.a === S.me || x.b === S.me); if (s) { finish = s.w === S.me ? (r === 3 ? 'CHAMPIONS' : 'Won ' + L.ROUND_NAMES[r]) : 'Lost in ' + L.ROUND_NAMES[r]; break; } }
    const won = pl.champ === S.me;
    // owner + fans
    const exp = O.expectedWins(), pct = L.pct(me);
    let dOwner = Math.round((pct - exp) * 70);
    if (finish !== 'Missed playoffs') dOwner += 8;
    if (won) dOwner += 30;
    if (L.payroll(me) > CK.APRON) dOwner -= 6;
    S.owner = U.clamp(S.owner + dOwner, 0, 100);
    const ccWin = won ? 20 : finish !== 'Missed playoffs' ? 6 : 2;
    S.cc += ccWin;
    S.history.unshift({ season: S.season, team: me.ab, w: me.w, l: me.l, finish, champ: champ.ab, mvp: mvp ? L.name(mvp) + ' (' + L.T(mvp.tm).ab + ')' : '-' });
    if (won) S.trophies.push({ type: 'title', season: S.season, team: me.ab });
    [mvp, dpoy, roy].forEach((p, i) => { if (p && p.tm === S.me) S.trophies.push({ type: ['MVP', 'DPOY', 'ROY'][i], season: S.season, who: L.name(p) }); });
    S.review = {
      season: S.season, champ: champ.id, finish, won, dOwner, ccWin, w: me.w, l: me.l,
      mvp: mvp && mvp.id, dpoy: dpoy && dpoy.id, roy: roy && roy.id, fired: S.owner <= 0
    };
    S.phase = 'review';
    L.save();
  };
  O.expectedWins = () => { const S = CK.S, me = L.myTeam(); const rank = S.teams.slice().sort((a, b) => L.teamOvr(b) - L.teamOvr(a)).indexOf(me); return U.clamp(0.75 - rank * 0.017, 0.25, 0.75); };

  // job offers after being fired: 3 of the bottom teams
  O.jobOffers = () => CK.S.teams.filter(t => t.id !== CK.S.me).sort((a, b) => L.pct(a) - L.pct(b)).slice(0, 3).map(t => t.id);
  O.takeJob = id => { const S = CK.S; S.me = id; S.owner = 55; S.fans = 45; S.fac = { train: 1, med: 1, arena: 1, film: 1, lock: 1 }; S.cc = Math.max(S.cc, 8); L.inbox('New job', 'You take over ' + L.T(id).city + '. Fresh start, same goal.'); };

  // ---------- aging, progression, retirement ----------
  O.develop = () => {
    const S = CK.S, retired = [];
    Object.values(S.players).forEach(p => {
      if (p.tm < 0 && p.tm !== -2) return; // only league + FA players age
      p.age++; p.seasons++;
      const mine = p.tm === S.me;
      let g = p.age <= 22 ? 1.4 : p.age <= 25 ? 0.9 : p.age <= 28 ? 0.25 : p.age <= 30 ? -0.2 : p.age <= 32 ? -0.7 : -1.2;
      g += (p.pot - 3) * 0.35 + (mine ? (S.fac.train - 1) * 0.18 : 0.15);
      CK.RKEYS.forEach(k => { const d = g + U.gauss() * 0.7; const step = d > 0.6 ? Math.round(d) : d < -0.6 ? Math.round(d) : 0; p.r[k] = U.clamp(p.r[k] + U.clamp(step, -2, 2), 1, 10); });
      if (k_ath_drop(p)) p.r.ath = Math.max(1, p.r.ath - 1);
      p.st = L.blankStats(); p.inj = 0; p.morale = U.clamp(p.morale + U.irand(-5, 8), 20, 95);
      if (p.age >= 37 || (p.age >= 33 && (L.ovr(p) < 5 || U.chance((p.age - 32) * 0.18))) || (p.age >= 30 && L.ovr(p) < 3.2)) retired.push(p);
    });
    retired.forEach(p => {
      if (p.tm === S.me) L.inbox(L.name(p) + ' retires', 'After ' + p.seasons + ' seasons, ' + L.name(p) + ' hangs it up. Career: ' + p.car.pts + ' points.');
      const t = p.tm >= 0 ? L.T(p.tm) : null; if (t) t.roster = t.roster.filter(x => x !== p.id);
      delete S.players[p.id];
    });
    S.fa = S.fa.filter(id => S.players[id]);
    return retired.length;
  };
  function k_ath_drop(p) { return p.age >= 31 && U.chance(0.4); }

  // ---------- contracts ----------
  O.ask = p => { let a = L.salaryFor(p); const S = CK.S; if (p.tm === S.me) a *= U.clamp(1.25 - p.morale / 200 - S.fans / 600, 0.8, 1.15); return Math.round(a * 10) / 10; };
  O.expiring = () => L.roster(L.myTeam()).filter(p => p.yrs <= 0);
  O.resign = (p, yrs) => { p.sal = O.ask(p); p.yrs = yrs; p.morale = Math.min(100, p.morale + 5); };
  O.release = p => { const t = L.T(p.tm); t.roster = t.roster.filter(x => x !== p.id); t.start = t.start.filter(x => x !== p.id); p.tm = -2; CK.S.fa.push(p.id); p.sal = L.salaryFor(p); };
  // contracts tick down at end of season; AI teams handle their own
  O.tickContracts = () => {
    const S = CK.S;
    Object.values(S.players).forEach(p => { if (p.tm >= 0) p.yrs--; });
    S.teams.forEach(t => {
      if (t.id === S.me) return;
      L.roster(t).forEach(p => { if (p.yrs <= 0) { if (L.ovr(p) >= 5.5 && p.age < 33 && U.chance(0.65)) { p.yrs = U.irand(1, 4); p.sal = L.salaryFor(p); } else O.release(p); } });
    });
  };

  // ---------- draft ----------
  O.makeDraft = () => {
    const S = CK.S, pros = [];
    for (let i = 0; i < 64; i++) {
      const pos = U.pick(CK.POS), lvl = U.rand(2.6, 6.2) + (i < 6 ? 0.7 : 0);
      const p = L.newPlayer(pos, lvl, U.irand(19, 22)); p.tm = -3; p.pot = U.clamp(Math.round(U.rand(1, 5.5) + (lvl - 4) * 0.4), 1, 5);
      p.scout = (S.fac.film || 1) >= 3; p.yrs = 0; p.seasons = 0; p.sal = 1;
      p.potLo = U.clamp(p.pot - U.irand(0, 2), 1, 5); p.potHi = U.clamp(p.pot + U.irand(0, 1), p.potLo, 5);
      S.players[p.id] = p; pros.push(p.id);
    }
    const order = S.teams.slice().sort((a, b) => L.pct(a) - L.pct(b) || (a.pf - a.pa) - (b.pf - b.pa)).map(t => t.id);
    // champion picks last
    const ch = S.playoff && S.playoff.champ; if (ch != null) { order.splice(order.indexOf(ch), 1); order.push(ch); }
    S.draft = { pros, order: order.concat(order), pick: 0, picks: [] };
  };
  O.prospectValue = p => L.ovr(p) + (p.scout ? p.pot : (p.potLo + p.potHi) / 2) * 0.7 - (p.age - 19) * 0.2;
  O.draftPlayer = (tid, pid) => {
    const S = CK.S, d = S.draft, p = L.P(pid), t = L.T(tid);
    d.pros = d.pros.filter(x => x !== pid);
    const n = d.pick + 1;
    p.tm = tid; p.yrs = n <= 30 ? 3 : 2; p.sal = n <= 30 ? Math.round((5.5 - n * 0.14) * 10) / 10 : 1; p.scout = true;
    t.roster.push(pid); L.uniqueNums(t);
    d.picks.push({ n, tid, pid }); d.pick++;
    if (t.id !== S.me && t.roster.length > CK.ROSTER_MAX) { const worst = L.roster(t).filter(x => x.id !== pid).sort((a, b) => L.ovr(a) - L.ovr(b))[0]; O.release(worst); }
  };
  O.aiDraftUntilMe = () => {
    const S = CK.S, d = S.draft;
    while (d.pick < d.order.length && d.order[d.pick] !== S.me) {
      const best = d.pros.map(L.P).sort((a, b) => O.prospectValue(b) + U.rand(-0.6, 0.6) - O.prospectValue(a))[0];
      O.draftPlayer(d.order[d.pick], best.id);
    }
    return d.pick < d.order.length;
  };
  O.finishDraft = () => {
    const S = CK.S, d = S.draft;
    d.pros.forEach(id => { const p = L.P(id); p.tm = -2; p.sal = 1; S.fa.push(id); });
    d.pros = [];
  };

  // ---------- free agency ----------
  O.faList = () => CK.S.fa.map(L.P).filter(Boolean).sort((a, b) => L.ovr(b) - L.ovr(a));
  O.sign = (p, yrs) => {
    const S = CK.S, me = L.myTeam(), ask = L.salaryFor(p);
    if (me.roster.length >= CK.ROSTER_MAX) return 'Roster is full (' + CK.ROSTER_MAX + ').';
    if (L.payroll(me) + ask > CK.CAP && ask > 2.5) return 'Over the cap: you can only sign minimum deals ($2.5M or less).';
    S.fa = S.fa.filter(x => x !== p.id); p.tm = S.me; p.sal = ask; p.yrs = yrs; p.morale = 70;
    me.roster.push(p.id); L.uniqueNums(me);
    return null;
  };
  O.aiFreeAgency = () => {
    const S = CK.S;
    S.teams.forEach(t => {
      if (t.id === S.me) return;
      let guard = 0;
      while (t.roster.length < 13 && guard++ < 20) {
        const room = CK.CAP - L.payroll(t);
        const c = O.faList().find(p => L.salaryFor(p) <= Math.max(2.5, room)); if (!c) break;
        S.fa = S.fa.filter(x => x !== c.id); c.tm = t.id; c.sal = L.salaryFor(c); c.yrs = U.irand(1, 3); t.roster.push(c.id);
      }
      while (t.roster.length > CK.ROSTER_MAX) O.release(L.roster(t).sort((a, b) => L.ovr(a) - L.ovr(b))[0]);
      L.uniqueNums(t); L.autoStarters(t);
    });
    // fill free agent pool with fresh low-level guys so it never runs dry
    while (S.fa.length < 25) { const p = L.newPlayer(U.pick(CK.POS), U.rand(2.5, 4.5)); p.tm = -2; S.players[p.id] = p; S.fa.push(p.id); }
    // drop leftovers beyond 60 weakest to keep save small
    const fl = O.faList(); fl.slice(60).forEach(p => { delete S.players[p.id]; }); S.fa = fl.slice(0, 60).map(p => p.id);
  };

  // ---------- new season ----------
  O.startNewSeason = () => {
    const S = CK.S;
    S.season++; CK.FO.ensure(S); S.phase = 'season'; S.playoff = null; S.deadline = false; S.draft = null; S.review = null;
    const me = L.myTeam();
    while (me.roster.length < CK.ROSTER_MIN) { const c = O.faList()[0]; O.sign(c, 1); }
    me.start = me.start.filter(id => me.roster.includes(id)); if (me.start.length < 5) L.autoStarters(me);
    L.makeSchedule();
    L.inbox('Season ' + S.season + ' tips off', 'Owner trust ' + S.owner + '. Fans ' + S.fans + '. Expectation: about ' + Math.round(O.expectedWins() * S.len) + ' wins.');
    L.save();
  };

  // ---------- training + facilities ----------
  O.trainCost = (p, k) => Math.max(1, 2 + Math.floor(p.r[k] / 2) + (p.age >= 30 ? 2 : 0) - (CK.S.fac.train >= 3 ? 1 : 0) - (CK.S.fac.train >= 5 ? 1 : 0));
  O.train = (p, k) => { const S = CK.S, c = O.trainCost(p, k); if (p.r[k] >= 10) return 'Already maxed.'; if (S.cc < c) return 'Need ' + c + ' Coach Credits.'; S.cc -= c; p.r[k]++; p.morale = Math.min(100, p.morale + 2); return null; };
  O.facCost = k => CK.FO.cost(k);
  O.upgrade = k => { const S = CK.S, c = O.facCost(k); if (S.fac[k] >= 5) return 'Already max level.'; if (S.cc < c) return 'Need ' + c + ' Coach Credits.'; S.cc -= c; S.fac[k]++; if (k === 'arena') S.fans = Math.min(100, S.fans + 6); return null; };

  // ---------- trades ----------
  O.tradeValue = p => { const o = L.ovr(p); let v = Math.pow(Math.max(0.5, o - 2), 2.2); v *= p.age <= 23 ? 1.25 : p.age <= 27 ? 1.1 : p.age <= 30 ? 1 : p.age <= 32 ? 0.8 : 0.55; v *= 0.85 + p.pot * 0.05; return v - p.sal * 0.25; };
  O.evalTrade = (give, get, tid) => {
    const t = L.T(tid), me = L.myTeam();
    const vg = give.reduce((s, p) => s + O.tradeValue(p), 0), vr = get.reduce((s, p) => s + O.tradeValue(p), 0);
    const pct = vr <= 0 ? 100 : U.clamp(Math.round(vg / (vr * 1.08) * 100), 0, 100);
    const myPay = L.payroll(me) - give.reduce((s, p) => s + p.sal, 0) + get.reduce((s, p) => s + p.sal, 0);
    const thPay = L.payroll(t) + give.reduce((s, p) => s + p.sal, 0) - get.reduce((s, p) => s + p.sal, 0);
    let err = null;
    if (!give.length || !get.length) err = 'Pick players on both sides.';
    else if (myPay > CK.APRON) err = 'You would be over the ' + U.money(CK.APRON) + ' apron.';
    else if (thPay > CK.APRON) err = 'They would be over the apron.';
    else if (me.roster.length - give.length + get.length > CK.ROSTER_MAX) err = 'Your roster would be too big.';
    else if (me.roster.length - give.length + get.length < CK.ROSTER_MIN) err = 'Your roster would be too small.';
    else if (t.roster.length + give.length - get.length > CK.ROSTER_MAX + 1) err = 'Their roster would be too big.';
    return { pct, err, ok: !err && pct >= 100 };
  };
  O.doTrade = (give, get, tid) => {
    const t = L.T(tid), me = L.myTeam();
    give.forEach(p => { me.roster = me.roster.filter(x => x !== p.id); me.start = me.start.filter(x => x !== p.id); t.roster.push(p.id); p.tm = tid; p.morale = 60; });
    get.forEach(p => { t.roster = t.roster.filter(x => x !== p.id); me.roster.push(p.id); p.tm = me.id; p.morale = 72; });
    L.uniqueNums(me); L.uniqueNums(t); L.autoStarters(t);
    if (me.start.length < 5) L.autoStarters(me);
    L.inbox('Trade with ' + t.city, 'You sent ' + give.map(L.name).join(', ') + ' and got ' + get.map(L.name).join(', ') + '.');
  };
})(window.CK);
