// Court Kings - after-game dilemmas (you choose), scenarios (good/bad news that just happens), CPU trade offers
(function (CK) {
  const U = CK.U, L = CK.L, EV = CK.EV = {};
  const star = p => L.ovr(p) >= 6.5, young = p => p.age <= 24, vet = p => p.age >= 30, low = p => p.morale < 55;

  // ---------- dilemmas: kind, need(player), title, body, choices [label, fx] ----------
  const D = [
    { k: 'locker', need: p => low(p) && L.ovr(p) >= 6, t: p => L.short(p) + ' wants the ball more', b: p => L.name(p) + ' feels left out of the offense and wants to talk.',
      ch: [['Promise more shots', { morale: 15 }], ['Team comes first', { morale: -10, owner: 3 }]] },
    { k: 'media', t: () => 'Local TV wants an interview', b: () => 'A sports show wants you on air this week.',
      ch: [['Talk up the team', { fans: 6 }], ['Stay focused, decline', { cc: 2 }]] },
    { k: 'office', t: () => 'Youth camp invite', b: () => 'A kids basketball camp asks if your players can run a clinic.',
      ch: [['Send the whole team', { fans: 8, teamMorale: 3 }], ['Send two rookies', { fans: 3, cc: 1 }]] },
    { k: 'locker', need: vet, t: p => L.short(p) + ' wants rest days', b: p => 'The veteran says his legs are tired and wants lighter practices.',
      ch: [['Give him rest', { morale: 10, cc: -1 }], ['Practice is practice', { morale: -8, ratingUp: 'def' }]] },
    { k: 'locker', need: young, t: p => L.short(p) + ' asks for extra film work', b: p => 'The young ' + p.pos + ' wants to stay late and study film with you.',
      ch: [['Stay late with him (2 CC)', { cc: -2, ratingUp: 'pas', morale: 6 }], ['Not this week', { morale: -4 }]] },
    { k: 'office', t: () => 'Owner check-in', b: () => 'The owner asks how the season is going.',
      ch: [['We are building something', { owner: 3 }], ['Promise a playoff run', { owner: 7, promise: true }]] },
    { k: 'office', t: () => 'Sneaker company deal', b: () => 'A shoe brand wants to sponsor the team practice gear.',
      ch: [['Sign it (+4 CC)', { cc: 4, fans: -2 }], ['Keep the classic look', { fans: 3 }]] },
    { k: 'media', need: p => L.ovr(p) >= 7, t: p => 'Trash talk about ' + p.ln, b: p => 'A rival player said ' + L.name(p) + ' is overrated. Reporters want a response.',
      ch: [['Let his game talk', { morale: 4, owner: 1 }], ['Fire back', { fans: 6, morale: 8, owner: -3 }]] },
    { k: 'locker', t: () => 'Shootaround idea', b: () => 'Your assistant wants a team shooting contest at practice.',
      ch: [['Run it', { teamMorale: 5 }], ['Skip, scrimmage instead', { cc: 1 }]] },
    { k: 'media', t: () => 'Postgame press conference', b: () => 'A reporter asks if the team is good enough to win it all.',
      ch: [['"We are the best team in the league"', { fans: 7, owner: -2, teamMorale: 3 }], ['"One game at a time"', { owner: 3 }], ['"Ask me in April"', { fans: -2, cc: 1 }]] },
    { k: 'locker', need: p => star(p) && young(p), t: p => L.short(p) + ' wants a bigger role', b: p => L.name(p) + ' thinks he is ready to be the first option.',
      ch: [['Hand him the keys', { morale: 12, teamMorale: -3 }], ['Earn it in practice', { morale: -6, ratingUp: 'sht' }]] },
    { k: 'office', t: () => 'Charity game', b: () => 'The city wants your team to play in a charity game on an off day.',
      ch: [['Play the starters', { fans: 10, injRisk: 0.25 }], ['Send the bench', { fans: 4 }], ['Pass on it', { owner: -2, cc: 1 }]] },
    { k: 'locker', need: p => !p.inj && p.morale >= 60, t: p => L.short(p) + ' wants to try a new move', b: p => L.name(p) + ' has been working on a step-back jumper and wants to use it in games.',
      ch: [['Green light', { ratingUp: 'sht', morale: 5 }], ['Stick to what works', { morale: -3, owner: 1 }]] },
    { k: 'office', t: () => 'Ticket prices', b: () => 'The owner wants to raise ticket prices for the rest of the season.',
      ch: [['Raise them (+5 CC)', { cc: 5, fans: -8 }], ['Keep them low', { fans: 4, owner: -4 }]] },
    { k: 'media', t: () => 'Podcast invite', b: () => 'A big basketball podcast wants your star on the show.',
      ch: [['Let him go', { fans: 5, teamMorale: -1 }], ['No distractions', { teamMorale: 2 }]] },
    { k: 'locker', t: () => 'Team bonding trip', b: () => 'Players want to go bowling together on the off day.',
      ch: [['Book it (2 CC)', { cc: -2, teamMorale: 7 }], ['Rest day instead', { teamMorale: -2, healAll: true }]] },
    { k: 'office', t: () => 'Practice facility tour', b: () => 'A free agent agent wants to tour your practice gym with clients.',
      ch: [['Show them around', { fans: 2, owner: 2 }], ['Closed practice', { teamMorale: 2 }]] },
    { k: 'locker', need: p => p.age <= 22, t: p => L.short(p) + ' missed curfew', b: p => 'The rookie showed up late to the team walkthrough.',
      ch: [['Bench him a quarter', { morale: -8, teamMorale: 3, owner: 2 }], ['Talk it out', { morale: 4, owner: -2 }]] }
  ];

  // ---------- scenarios: just happen, good or bad ----------
  const SC = [
    { good: true, t: () => 'Viral highlight', b: () => 'A clip from the last game has millions of views. The city is buzzing.', fx: { fans: 6 } },
    { good: true, need: young, t: p => L.short(p) + ' breaks out in practice', b: p => L.name(p) + ' has been on fire in practice. The coaches say he leveled up.', fx: { ratingUp: 'rnd', morale: 5 } },
    { good: true, t: () => 'Sponsor bonus', b: () => 'A local pizza place pays the team for a commercial.', fx: { cc: 3 } },
    { good: true, t: () => 'Sellout crowd', b: () => 'Every seat is sold for the next home stand.', fx: { fans: 4, cc: 2 } },
    { good: true, t: () => 'Owner is impressed', b: () => 'The owner loved what he saw from the suite.', fx: { owner: 5 } },
    { good: true, need: vet, t: p => L.short(p) + ' mentors the young guys', b: p => 'The veteran has been running extra drills with the rookies.', fx: { teamMorale: 4 } },
    { good: false, t: () => 'Team bus broke down', b: () => 'The bus died on the highway. Everybody got to the arena tired and cranky.', fx: { teamMorale: -3 } },
    { good: false, t: () => 'Arena roof leak', b: () => 'Rain got in over the court. Repairs cost money.', fx: { cc: -2 } },
    { good: false, need: p => !star(p), t: p => L.short(p) + ' unhappy with minutes', b: p => L.name(p) + ' told reporters he deserves more playing time.', fx: { morale: -10 } },
    { good: false, t: () => 'Bad press', b: () => 'A columnist wrote that the team has no identity.', fx: { fans: -4 } },
    { good: false, need: p => !p.inj, t: p => L.short(p) + ' tweaked his ankle in practice', b: p => L.name(p) + ' rolled his ankle in a drill and misses the next game.', fx: { injure: 1 } },
    { good: false, t: () => 'Owner wants results', b: () => 'The owner says he expects more from this team.', fx: { owner: -4 } }
  ];

  // after each of your games: injuries are made in L.injuries, then maybe one dilemma / scenario / trade offer
  EV.maybe = () => {
    const S = CK.S; if (!U.chance(0.5 * U.clamp(20 / (S.len || 20), 0.3, 1.2))) return;
    const r = Math.random();
    if (r < 0.15 && S.phase === 'season' && !S.deadline && EV.tradeOffer()) return;
    const ro = L.roster(L.myTeam());
    const list = r < 0.55 ? D : SC;
    for (let tries = 0; tries < 8; tries++) {
      const e = U.pick(list); let p = null;
      if (e.need) { const c = ro.filter(e.need); if (!c.length) continue; p = U.pick(c); }
      if (list === D) L.inbox(e.t(p), e.b(p), e.ch.map(c => ({ label: c[0], fx: c[1], pid: p && p.id })), e.k);
      else { const m = L.inbox(e.t(p), e.b(p), null, e.good ? 'good' : 'bad'); m.answered = EV.apply(e.fx, p).join(', '); }
      return;
    }
  };

  // a CPU team offers a player for one of yours
  EV.tradeOffer = () => {
    const S = CK.S, O = CK.OFF, me = L.myTeam();
    const mine = L.roster(me).filter(p => !p.inj && L.ovr(p) >= 4.5);
    for (let tries = 0; tries < 12; tries++) {
      const t = U.pick(S.teams.filter(x => x.id !== S.me)), give = U.pick(mine); if (!give) return false;
      const vg = O.tradeValue(give);
      const c = L.roster(t).filter(p => !p.inj).map(p => ({ p, v: O.tradeValue(p) })).filter(x => x.v > vg * 0.7 && x.v < vg * 1.02);
      if (!c.length) continue;
      const get = U.pick(c).p;
      if (O.evalTrade([give], [get], t.id).err) continue;
      L.inbox(t.city + ' trade offer', 'The ' + (t.name || t.city) + ' offer ' + L.name(get) + ' (' + get.pos + ', ' + get.age + ' yrs, ' + U.money(get.sal) + ') for ' + L.name(give) + ' (' + give.pos + ').',
        [{ label: 'Accept the trade', fx: { trade: { tid: t.id, give: give.id, get: get.id } } }, { label: 'No thanks', fx: {} }], 'trade', { tid: t.id, give: give.id, get: get.id });
      return true;
    }
    return false;
  };

  // apply effects, return a list of readable results
  EV.apply = (fx, p) => {
    const S = CK.S, out = [], me = L.myTeam();
    const sg = n => (n > 0 ? '+' : '') + n;
    if (fx.cc) { S.cc = Math.max(0, S.cc + fx.cc); if (fx.cc > 0) S.ccLife = (S.ccLife || 0) + fx.cc; out.push(sg(fx.cc) + ' CC'); }
    if (fx.fans) { S.fans = U.clamp(S.fans + fx.fans, 0, 100); out.push('Fans ' + sg(fx.fans)); }
    if (fx.owner) { S.owner = U.clamp(S.owner + fx.owner, 0, 100); out.push('Owner ' + sg(fx.owner)); }
    if (fx.morale && p) { p.morale = U.clamp(p.morale + fx.morale, 0, 100); out.push(p.ln + ' morale ' + sg(fx.morale)); }
    if (fx.teamMorale) { L.roster(me).forEach(q => q.morale = U.clamp(q.morale + fx.teamMorale, 0, 100)); out.push('Team morale ' + sg(fx.teamMorale)); }
    if (fx.ratingUp && p) { const k = fx.ratingUp === 'rnd' ? U.pick(CK.RKEYS.filter(k => p.r[k] < 10)) : fx.ratingUp; if (k && p.r[k] < 10) { p.r[k]++; out.push(p.ln + ' ' + CK.RATING_NAMES[k] + ' +1'); } }
    if (fx.promise) S.promise = S.season;
    if (fx.healAll) { L.roster(me).forEach(q => { if (q.inj > 0) q.inj = Math.max(0, q.inj - 1); }); out.push('Injured players heal faster'); }
    if (fx.injRisk && U.chance(fx.injRisk)) { const q = U.pick(L.roster(me).filter(x => !x.inj)); if (q) { q.inj = 1; q.injName = 'Sore ankle'; out.push(q.ln + ' got hurt (out 1)'); } }
    if (fx.injure && p) { p.inj = Math.max(p.inj, fx.injure); p.injName = 'Sprained ankle'; out.push(p.ln + ' out ' + fx.injure); }
    if (fx.treat && p && p.inj) { p.inj = Math.max(1, Math.ceil(p.inj / 2)); out.push(p.ln + ' now out ' + p.inj); }
    if (fx.rush && p && p.inj) { if (U.chance(0.35)) { p.inj = Math.round(p.inj * 1.5) + 1; out.push('Setback! ' + p.ln + ' out ' + p.inj); } else { p.inj = 1; out.push(p.ln + ' back after 1 game'); } }
    if (fx.trade) {
      const O = CK.OFF, give = L.P(fx.trade.give), get = L.P(fx.trade.get);
      const ok = give && get && give.tm === S.me && get.tm === fx.trade.tid && !S.deadline && S.phase === 'season' && !O.evalTrade([give], [get], fx.trade.tid).err;
      if (ok) { O.doTrade([give], [get], fx.trade.tid); out.push('Trade done: ' + get.ln + ' joins'); } else out.push('The deal fell through');
    }
    if (fx.note) out.push(fx.note);
    return out;
  };
  EV.choose = (msg, i) => {
    const c = msg.choices[i], p = c.pid ? L.P(c.pid) : null;
    const out = EV.apply(c.fx, p);
    msg.choices = null; msg.answered = c.label + (out.length ? ' (' + out.join(', ') + ')' : '');
    L.save();
  };
})(window.CK);
