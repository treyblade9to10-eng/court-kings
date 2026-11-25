// Court Kings - front office: facilities, coaching staff, coach credit rewards, injury report, owner goal
(function (CK) {
  const U = CK.U, L = CK.L, O = CK.OFF, FO = CK.FO = {};

  // ---------- facilities ----------
  FO.FAC = {
    train: { name: 'TRAINING CENTER', icon: 'dumb', fx: l => 'Players grow more every offseason. Training costs ' + (l >= 3 ? 'less' : 'normal') + '.', next: 'More growth + cheaper training' },
    med: { name: 'MEDICAL CENTER', icon: 'cross', fx: l => 'Injury risk -' + Math.round((l - 1) * 7) + '%. Players heal ' + Math.round((l - 1) * 10) + '% faster.', next: 'Fewer + shorter injuries' },
    arena: { name: 'ARENA', icon: 'arena', fx: l => 'Bigger crowds. +' + ((l - 1) * 0.5) + ' CC every home game.', next: 'More fans, more home CC' },
    film: { name: 'FILM ROOM', icon: 'film', fx: l => 'Green window +' + (l - 1) * 6 + '%.' + (l >= 3 ? ' Draft prospects come scouted.' : ''), next: 'Bigger green on your shot meter' },
    lock: { name: 'LOCKER ROOM', icon: 'lock', fx: l => 'Morale +' + (l - 1) + ' after wins.' + (l >= 3 ? ' Losses do not hurt morale.' : ''), next: 'Happier players, better play' }
  };
  FO.KEYS = Object.keys(FO.FAC);
  FO.cost = k => 6 + 6 * CK.S.fac[k];

  // ---------- staff ----------
  const FN = ['Mike', 'Dee', 'Rick', 'Sam', 'Tony', 'Lou', 'Kenny', 'Gregg', 'Phil', 'Doc', 'Erik', 'Nate', 'Monty', 'Jo', 'Becky', 'Dawn', 'Ty', 'Chris', 'Ime', 'Taylor'];
  const LN = ['Hollins', 'Brown', 'Carter', 'Price', 'Vance', 'Moore', 'Ellis', 'Quinn', 'Bishop', 'Rowe', 'Grant', 'Lyons', 'Hart', 'Webb', 'Shaw', 'Stone', 'Fox', 'Banks', 'Reed', 'Cole'];
  FO.coach = s => ({ n: U.pick(FN) + ' ' + U.pick(LN), s, age: U.irand(34, 66) });
  FO.staffCost = s => [0, 0, 6, 12, 20, 30][s];
  FO.newPool = () => { const S = CK.S; S.pool = { oc: [U.irand(2, 3), U.irand(3, 4), U.irand(4, 5)].map(FO.coach), dc: [U.irand(2, 3), U.irand(3, 4), U.irand(4, 5)].map(FO.coach), season: S.season }; };
  FO.hire = (role, i) => {
    const S = CK.S, c = S.pool[role][i], cost = FO.staffCost(c.s);
    if (S.cc < cost) return 'Need ' + cost + ' CC.';
    S.cc -= cost; S.staff[role] = c; S.pool[role].splice(i, 1);
    L.inbox('New ' + (role === 'oc' ? 'offensive' : 'defensive') + ' coach', c.n + ' (' + c.s + ' stars) joins your staff.');
    return null;
  };
  // small bonuses used by the sim and the live game
  FO.ocB = () => CK.S && CK.S.staff ? CK.S.staff.oc.s - 1 : 0;
  FO.dcB = () => CK.S && CK.S.staff ? CK.S.staff.dc.s - 1 : 0;

  // ---------- save upgrade ----------
  FO.ensure = S => {
    S.fac = Object.assign({ train: 1, med: 1, arena: 1, film: 1, lock: 1 }, S.fac || {});
    if (!S.staff) S.staff = { oc: { n: 'Al Bundy', s: 1, age: 52 }, dc: { n: 'Gus Moss', s: 1, age: 58 } };
    if (!S.pool || S.pool.season !== S.season) { const keep = CK.S; CK.S = S; FO.newPool(); CK.S = keep; }
    if (S.ccLife == null) S.ccLife = S.cc;
    if (!S.show) S.show = [];
  };
  const oldLoad = L.load;
  L.load = () => { const ok = oldLoad(); if (ok) FO.ensure(CK.S); return ok; };
  const oldNew = L.newLeague;
  L.newLeague = o => { const S = oldNew(o); FO.ensure(S); return S; };

  // ---------- coach credits for a game ----------
  // returns { lines: [[label, cc]], total }
  FO.gameCC = (g, res) => {
    const S = CK.S, my = g.meHome ? res.hs : res.as, opp = g.meHome ? res.as : res.hs, lines = [];
    const add = (t, n) => { if (n > 0) lines.push([t, n]); };
    add(res.won ? 'WIN' : 'SHOWED UP', res.won ? 3 : 1);
    if (g.meHome) add('HOME CROWD', Math.floor(S.fans / 40) + Math.floor((S.fac.arena - 1) * 0.5));
    const hlCount = res.hl.filter(h => ['dunk', 'oop', 'splash', 'block', 'ankles'].includes(h)).length;
    add('HIGHLIGHTS', Math.min(3, Math.floor(hlCount / 2)));
    add('PERFECT RELEASES', Math.min(2, Math.floor(res.hl.filter(h => h === 'green').length / 3)));
    if (res.won && my - opp >= 15) add('BLOWOUT', 1);
    if (res.won && my - opp <= 3) add('CLUTCH WIN', 1);
    if (opp <= 95) add('LOCKDOWN D', 1);
    if (L.roster(g.me).some(p => res.box[p.id] && res.box[p.id].pts >= 30)) add('30-POINT NIGHT', 1);
    if (g.po && res.won) add('PLAYOFF WIN', 4);
    const streak = g.me.strk + (res.won ? 1 : 0);
    if (res.won && !g.po && [3, 5, 8, 12].includes(streak)) add(streak + '-GAME WIN STREAK', 2);
    let total = lines.reduce((a, l) => a + l[1], 0);
    if (!res.played) { total = Math.max(1, Math.floor(total * 0.6)); lines.push(['SIMMED (60%)', 0]); }
    const sc = g.po ? 1 : U.clamp(20 / (S.len || 20), 0.25, 1.5);
    const sr = x => { const f = Math.floor(x); return f + (Math.random() < x - f ? 1 : 0); };
    if (sc !== 1) { total = sr(total * sc); lines.push([S.len + '-GAME SEASON PACE', 0]); }
    total = Math.max(res.won ? 1 : 0, total);
    return { lines, total };
  };

  // ---------- injuries ----------
  const INJ = [['Sore ankle', 1, 1, 14], ['Jammed finger', 1, 2, 12], ['Bruised knee', 1, 2, 12], ['Sprained ankle', 2, 5, 14], ['Back spasms', 2, 4, 9], ['Hamstring strain', 3, 6, 10],
    ['Sprained wrist', 2, 5, 8], ['Calf strain', 4, 8, 7], ['Broken finger', 5, 9, 5], ['Torn ligament', 18, 40, 2]];
  FO.injure = (p, t) => {
    const S = CK.S, med = t.id === S.me ? S.fac.med : 2;
    const tot = INJ.reduce((a, i) => a + i[3], 0); let r = Math.random() * tot, k = INJ[0];
    for (const i of INJ) { r -= i[3]; if (r <= 0) { k = i; break; } }
    const scale = U.clamp((S.len || 21) / 21, 0.5, 3);
    p.inj = Math.max(1, Math.round(U.irand(k[1], k[2]) * scale * (1.1 - med * 0.1)));
    p.injName = k[0];
    if (t.id === S.me) {
      const ch = [['Let him heal', { note: 'He rests and comes back healthy.' }]];
      if (p.inj >= 2) ch.unshift(['Extra treatment (3 CC): half the time', { cc: -3, treat: true }]);
      if (p.inj >= 3) ch.push(['Rush him back (risky)', { rush: true }]);
      L.inbox('Injury: ' + L.name(p), L.name(p) + ' has a ' + k[0].toLowerCase() + ' and will miss ' + p.inj + ' game' + (p.inj > 1 ? 's' : '') + '.', ch.map(c => ({ label: c[0], fx: c[1], pid: p.id })), 'inj');
    }
  };
  L.injuries = t => {
    const S = CK.S, med = t.id === S.me ? S.fac.med : 2;
    const chance = 0.011 * U.clamp(Math.sqrt(21 / (S.len || 21)), 0.5, 1.2) * (1.15 - med * 0.07);
    L.roster(t).forEach(p => {
      if (p.inj > 0) { p.inj--; if (!p.inj) p.injName = null; return; }
      if (U.chance(chance)) FO.injure(p, t);
    });
  };

  // ---------- owner goal ----------
  FO.goal = () => { const S = CK.S; return Math.max(1, Math.round(O.expectedWins() * S.len)); };
})(window.CK);
