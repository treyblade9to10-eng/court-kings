// Court Kings - random locker-room / front-office messages with choices
(function (CK) {
  const U = CK.U, L = CK.L, EV = CK.EV = {};
  const T = [
    { need: p => p.morale < 55 && L.ovr(p) >= 6, title: p => L.name(p) + ' wants the ball more',
      body: p => L.name(p) + ' feels left out of the offense and asked to talk.',
      ch: [['Promise more shots', { morale: 15, fans: 0, owner: 0 }], ['Team comes first', { morale: -10, owner: 3 }]] },
    { title: () => 'Local TV wants an interview', body: () => 'A sports show wants you on air this week.',
      ch: [['Talk up the team', { fans: 6, cc: 0 }], ['Stay focused, decline', { cc: 2 }]] },
    { title: () => 'Youth camp invite', body: () => 'A kids basketball camp asks if your players can run a clinic.',
      ch: [['Send the whole team', { fans: 8, teamMorale: 3 }], ['Send two rookies', { fans: 3, cc: 1 }]] },
    { need: p => p.age >= 30, title: p => L.name(p) + ' wants rest days',
      body: p => 'The veteran says his legs are tired and wants lighter practices.',
      ch: [['Give him rest', { morale: 10, cc: -1 }], ['Practice is practice', { morale: -8, ratingUp: 'def' }]] },
    { need: p => p.age <= 24, title: p => L.name(p) + ' asks for extra film work',
      body: p => 'The young ' + p.pos + ' wants to stay late and study film with you.',
      ch: [['Stay late with him (2 CC)', { cc: -2, ratingUp: 'pas', morale: 6 }], ['Not this week', { morale: -4 }]] },
    { title: () => 'Owner check-in', body: () => 'The owner asks how the season is going.',
      ch: [['We are building something', { owner: 3 }], ['Promise a playoff run', { owner: 7, promise: true }]] },
    { title: () => 'Sneaker company deal', body: () => 'A shoe brand wants to sponsor the team practice gear.',
      ch: [['Sign it (+4 CC)', { cc: 4, fans: -2 }], ['Keep the classic look', { fans: 3 }]] },
    { need: p => L.ovr(p) >= 7, title: p => 'Rival trash talk about ' + p.ln,
      body: p => 'A rival player said ' + L.name(p) + ' is overrated. Reporters want a response.',
      ch: [['Let his game talk', { morale: 4, owner: 1 }], ['Fire back', { fans: 6, morale: 8, owner: -3 }]] },
    { title: () => 'Shootaround idea', body: () => 'Your assistant wants a team shooting contest at practice.',
      ch: [['Run it', { teamMorale: 5 }], ['Skip, scrimmage instead', { cc: 1 }]] }
  ];
  EV.maybe = () => {
    const S = CK.S; if (!U.chance(0.32)) return;
    const ro = L.roster(L.myTeam());
    for (let tries = 0; tries < 6; tries++) {
      const e = U.pick(T); let p = null;
      if (e.need) { const c = ro.filter(e.need); if (!c.length) continue; p = U.pick(c); }
      L.inbox(e.title(p), e.body(p), e.ch.map(c => ({ label: c[0], fx: c[1], pid: p && p.id })));
      return;
    }
  };
  EV.choose = (msg, i) => {
    const S = CK.S, c = msg.choices[i], fx = c.fx, p = c.pid ? L.P(c.pid) : null, out = [];
    if (fx.cc) { S.cc = Math.max(0, S.cc + fx.cc); out.push((fx.cc > 0 ? '+' : '') + fx.cc + ' CC'); }
    if (fx.fans) { S.fans = U.clamp(S.fans + fx.fans, 0, 100); out.push('Fans ' + (fx.fans > 0 ? '+' : '') + fx.fans); }
    if (fx.owner) { S.owner = U.clamp(S.owner + fx.owner, 0, 100); out.push('Owner ' + (fx.owner > 0 ? '+' : '') + fx.owner); }
    if (fx.morale && p) { p.morale = U.clamp(p.morale + fx.morale, 0, 100); out.push(p.ln + ' morale ' + (fx.morale > 0 ? '+' : '') + fx.morale); }
    if (fx.teamMorale) { L.roster(L.myTeam()).forEach(q => q.morale = U.clamp(q.morale + fx.teamMorale, 0, 100)); out.push('Team morale +' + fx.teamMorale); }
    if (fx.ratingUp && p && p.r[fx.ratingUp] < 10) { p.r[fx.ratingUp]++; out.push(p.ln + ' ' + CK.RATING_NAMES[fx.ratingUp] + ' +1'); }
    if (fx.promise) S.promise = S.season;
    msg.choices = null; msg.answered = c.label + (out.length ? ' (' + out.join(', ') + ')' : '');
    L.save();
  };
})(window.CK);
