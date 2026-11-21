// Court Kings - menus: title, new career, hub tabs, player cards, trades, offseason
(function (CK) {
  const U = CK.U, L = CK.L, O = CK.OFF, UI = CK.UI = {};
  const $ = s => document.querySelector(s);
  const app = () => $('#app');
  let tab = 'home';

  // ---------- small pieces ----------
  const STAR = '<svg viewBox="0 0 7 7" class="st"><path d="M3 0h1v2h3v1h-1v1h-1v1h1v2h-1v-1h-1v-1h-1v1h-1v1h-1v-2h1v-1h-1v-1h-1v-1h3z" fill="currentColor"/></svg>';
  const HALF = '<svg viewBox="0 0 7 7" class="st"><path d="M3 0h1v2h3v1h-1v1h-1v1h1v2h-1v-1h-1v-1h-1v1h-1v1h-1v-2h1v-1h-1v-1h-1v-1h3z" fill="#39406a"/><path d="M3 0h0.5v5h-0.5v0h-1v1h-1v1h-1v-2h1v-1h-1v-1h-1v-1h3z" fill="currentColor"/></svg>';
  const EMPTY = '<svg viewBox="0 0 7 7" class="st"><path d="M3 0h1v2h3v1h-1v1h-1v1h1v2h-1v-1h-1v-1h-1v1h-1v1h-1v-2h1v-1h-1v-1h-1v-1h3z" fill="#39406a"/></svg>';
  UI.stars = n => { let s = '<span class="stars">'; for (let i = 1; i <= 5; i++) s += n >= i ? STAR : n >= i - 0.5 ? HALF : EMPTY; return s + '</span>'; };
  const pips = (v, col) => { let s = '<span class="pips">'; for (let i = 1; i <= 10; i++) s += '<i class="' + (i <= v ? 'on' : '') + '"' + (i <= v && col ? ' style="background:' + col + '"' : '') + '></i>'; return s + '</span>'; };
  const bar = (v, col) => '<span class="bar"><i style="width:' + v + '%;background:' + col + '"></i></span>';
  UI.logo = (t, cls) => (!t.logo || (CK.S && CK.S.logos === 'retro')) ? '' : '<img class="lg ' + (cls || '') + '" src="' + CK.logoUrl(t.logo) + '" alt="" loading="lazy" onerror="this.remove()">';
  const teamTag = t => '<span class="tt" style="--c:' + t.c1 + ';--c2:' + t.c2 + '">' + UI.logo(t, 'sm') + t.ab + '</span>';
  const bigTeam = t => '<div class="bigt" style="--c:' + t.c1 + ';--c2:' + t.c2 + '">' + (UI.logo(t, 'big') || '<b class="ab">' + t.ab + '</b>') + '<span>' + U.esc(t.city.toUpperCase()) + '</span><b>' + U.esc((t.name || t.ab).toUpperCase()) + '</b></div>';
  const rec = t => t.w + '-' + t.l;
  const pcache = {};
  UI.portrait = (p, t, size) => {
    const key = p.id + p.skin + p.hair + p.hc + p.num + (t ? t.c1 : '');
    if (!pcache[key]) {
      const c = document.createElement('canvas'); c.width = 20; c.height = 20; const g = c.getContext('2d');
      const skin = CK.SKIN[p.skin], hair = CK.HAIR[p.hc], jer = t ? t.c1 : '#555', trim = t ? (U.lum(t.c2) > 0.3 ? t.c2 : '#fff') : '#ccc';
      g.fillStyle = jer; g.fillRect(3, 15, 14, 5); g.fillStyle = trim; g.fillRect(3, 15, 2, 5); g.fillRect(15, 15, 2, 5); g.fillRect(8, 15, 4, 1);
      g.fillStyle = skin; g.fillRect(8, 13, 4, 2); g.fillRect(5, 4, 10, 10);
      g.fillStyle = U.shade(skin, -0.18); g.fillRect(5, 12, 10, 2); g.fillRect(4, 8, 1, 3); g.fillRect(15, 8, 1, 3);
      g.fillStyle = '#1a1010'; g.fillRect(7, 8, 2, 2); g.fillRect(11, 8, 2, 2); g.fillStyle = '#fff'; g.fillRect(7, 8, 1, 1); g.fillRect(11, 8, 1, 1);
      g.fillStyle = U.shade(skin, -0.35); g.fillRect(8, 12, 4, 1);
      g.fillStyle = hair;
      switch (p.hair) { case 0: g.fillRect(5, 3, 10, 2); break; case 1: g.fillRect(3, 0, 14, 6); g.fillRect(3, 6, 2, 4); g.fillRect(15, 6, 2, 4); break; case 2: g.fillRect(5, 0, 10, 5); break; case 3: g.fillRect(5, 2, 10, 3); g.fillRect(5, 5, 2, 3); break; case 4: g.fillRect(5, 2, 10, 3); g.fillStyle = trim; g.fillRect(5, 5, 10, 1); break; }
      U.pixText(g, String(p.num), 10 - Math.ceil(U.pixW(String(p.num)) / 2), 16, trim === '#fff' && U.lum(jer) > 0.7 ? '#333' : trim);
      pcache[key] = c.toDataURL();
    }
    return '<img class="face" src="' + pcache[key] + '" style="width:' + (size || 40) + 'px;height:' + (size || 40) + 'px">';
  };
  UI.toast = (t, bad) => { const el = $('#toast'); el.textContent = t; el.className = 'on' + (bad ? ' bad' : ''); clearTimeout(UI._tt); UI._tt = setTimeout(() => el.className = '', 2200); };
  UI.modal = (html, bind) => { const m = $('#modal'); m.innerHTML = '<div class="card">' + html + '<button class="x" id="mx">CLOSE</button></div>'; m.classList.add('on'); $('#mx').onclick = UI.closeModal; m.onclick = e => { if (e.target === m) UI.closeModal(); }; bind && bind(m); };
  UI.closeModal = () => $('#modal').classList.remove('on');
  const click = (sel, fn) => document.querySelectorAll(sel).forEach(el => el.addEventListener('click', e => { CK.SFX.init(); CK.SFX.play('click'); fn(el, e); }));

  // ---------- title ----------
  UI.title = () => {
    const has = L.load();
    if (has) CK.SFX.on = CK.S.sfx !== false;
    app().innerHTML = '<div class="title"><canvas id="tcv" width="400" height="225"></canvas><div class="tbox"><div class="tleft">' +
      '<h1><span>COURT</span><span>KINGS</span></h1><div class="tag">RETRO HOOPS DYNASTY</div></div><div class="tright">' +
      (has ? '<button class="btn" id="cont">CONTINUE<small>' + U.esc(L.myTeam().city) + ' ' + rec(L.myTeam()) + ' / ' + CK.S.season + '</small></button>' : '') +
      '<button class="btn ' + (has ? 'alt' : '') + '" id="newc">NEW CAREER</button>' +
      '<button class="btn alt" id="how">HOW TO PLAY</button>' +
      '<div class="foot">v' + CK.VER + '</div></div></div></div>';
    titleAnim();
    if (has) click('#cont', () => UI.hub('home'));
    click('#newc', () => { if (has && !confirm('Start over? Your current career will be erased.')) return; UI.newCareer(); });
    click('#how', UI.howTo);
  };
  // attract mode: two real teams play each other behind the title
  function titleAnim() {
    const c = $('#tcv'); if (!c) return; const g = c.getContext('2d');
    const E = CK.CT;
    const team = d => ({ ab: d[0], city: d[1], c1: d[2], c2: d[3], name: d[5], logo: d[6] });
    const five = ab => {
      const ps = CK.REAL.players.filter(a => a[1] === ab).map(a => ({ id: 't' + a[0], fn: '', ln: a[0].split(' ').slice(1).join(' ') || a[0], pos: a[2], ht: a[4], num: a[5], r: { sht: a[6], ins: a[7], pas: a[8], def: a[9], ath: a[10] }, skin: a[14], hair: a[15], hc: a[15] === 5 ? 0 : 0 }));
      ps.sort((x, y) => CK.L.ovr(y) - CK.L.ovr(x));
      const out = []; CK.POS.forEach(pos => { const p = ps.find(x => x.pos === pos && !out.includes(x)); if (p) out.push(p); });
      for (const p of ps) { if (out.length >= 5) break; if (!out.includes(p)) out.push(p); }
      return out.sort((a, b) => CK.POS.indexOf(a.pos) - CK.POS.indexOf(b.pos));
    };
    let home, away;
    const newGame = () => {
      const ts = U.shuffle(CK.TEAMS.slice()); home = team(ts[0]); away = team(ts[1]);
      CK.RD.buildCourt(home, away);
      E.start({ off: Object.assign({ players: five(away.ab) }, CK.M.jersey(away, false)), def: Object.assign({ players: five(home.ab) }, CK.M.jersey(home, true)), user: 'watch', diff: 1, onEnd: () => setTimeout(() => { if (document.body.contains(c)) newGame(); }, 200) });
      E.st.user = null;
    };
    newGame();
    let last = performance.now();
    const tick = now => {
      if (!document.body.contains(c) || CK.inGame) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (E.st && E.st.cfg.user === 'watch') { E.update(dt); CK.RD.draw(g, { hype: 0.3 }); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  UI.howTo = () => UI.modal('<h2>HOW TO PLAY</h2><div class="how">' +
    '<p><b>You are the coach.</b> Pick a team, win games, earn Coach Credits (CC), and build a dynasty.</p>' +
    '<p><b>Games:</b> most of the game is simmed. You play the big possessions on offense AND defense. The last ones in the 4th quarter are CLUTCH TIME.</p>' +
    '<p><b>Offense:</b> drag the left side to move. Hold SHOOT and let go when the meter hits the green. Tap a teammate (or PASS) to pass. Green ring = open, red = covered. MOVE is a crossover that can break ankles. Drive close and press SHOOT to lay it up or dunk. Pass to a cutter near the rim for an alley-oop.</p>' +
    '<p><b>Defense:</b> you guard whoever has the ball. CONTEST jumps at shooters (time it with their shot). STEAL pokes at the ball, but you can foul.</p>' +
    '<p><b>Hit 3 in a row</b> with the same player and he catches fire.</p>' +
    '<p><b>Keyboard (computer):</b> WASD or arrows move, Space shoot/contest, K pass to the open man, 1-5 pass to a teammate, L crossover/steal, P pause.</p><p><b>Bigs set screens</b> on your defender. Use the pick, then hit the big rolling to the rim.</p><p><b>Phone:</b> play it sideways.</p>' +
    '<p><b>Front office:</b> spend CC to train players and upgrade facilities. Keep the fans and the owner happy or you get fired.</p></div>');

  // ---------- new career ----------
  UI.newCareer = () => {
    let pick = null, diff = 1, len = 20, ppq = 3;
    const tmp = { teams: CK.TEAMS };
    // preview league to show strengths
    let real = true, prev, strengths;
    const mk = () => { prev = L.newLeague({ team: 0, real }); strengths = prev.teams.map(t => L.teamStars(t)); };
    mk();
    const draw = () => {
      app().innerHTML = '<div class="page new"><h2>NEW CAREER</h2>' +
        '<label class="fld">COACH NAME<input id="cname" maxlength="16" value="' + U.esc(UI._cn || 'Coach') + '"></label>' +
        '<div class="lbl">PICK YOUR TEAM</div><div class="tgrid">' +
        prev.teams.map((t, i) => '<button class="tpick ' + (pick === i ? 'sel' : '') + '" data-i="' + i + '" style="--c:' + t.c1 + ';--c2:' + t.c2 + '">' + UI.logo(t, 'tlg') + '<b>' + t.ab + '</b><span>' + U.esc(t.name || t.city) + '</span>' + UI.stars(strengths[i]) + '</button>').join('') + '</div>' +
        '<div class="lbl">ROSTERS</div><div class="seg" id="rr"><button data-v="1" class="' + (real ? 'sel' : '') + '">REAL 2026-27 PLAYERS</button><button data-v="0" class="' + (!real ? 'sel' : '') + '">MADE-UP PLAYERS</button></div>' +
        '<div class="lbl">DIFFICULTY</div><div class="seg" id="dif">' + ['ROOKIE', 'PRO', 'ALL-STAR', 'LEGEND'].map((n, i) => '<button data-v="' + i + '" class="' + (diff === i ? 'sel' : '') + '">' + n + '</button>').join('') + '</div>' +
        '<div class="lbl">SEASON LENGTH</div><div class="seg" id="len">' + [12, 20, 30].map(n => '<button data-v="' + n + '" class="' + (len === n ? 'sel' : '') + '">' + n + ' GAMES</button>').join('') + '</div>' +
        '<div class="lbl">POSSESSIONS YOU PLAY PER QUARTER</div><div class="seg" id="ppq">' + [2, 3, 4, 5].map(n => '<button data-v="' + n + '" class="' + (ppq === n ? 'sel' : '') + '">' + n + ' + ' + n + '</button>').join('') + '</div>' +
        '<button class="btn" id="go" ' + (pick == null ? 'disabled' : '') + '>' + (pick == null ? 'PICK A TEAM' : 'COACH ' + prev.teams[pick].city.toUpperCase()) + '</button>' +
        '<button class="btn alt" id="back">BACK</button></div>';
      click('.tpick', el => { UI._cn = $('#cname').value; pick = +el.dataset.i; draw(); });
      click('#rr button', el => { UI._cn = $('#cname').value; real = el.dataset.v === '1'; mk(); draw(); });
      click('#dif button', el => { UI._cn = $('#cname').value; diff = +el.dataset.v; draw(); });
      click('#len button', el => { UI._cn = $('#cname').value; len = +el.dataset.v; draw(); });
      click('#ppq button', el => { UI._cn = $('#cname').value; ppq = +el.dataset.v; draw(); });
      click('#back', () => UI.title());
      click('#go', () => {
        if (pick == null) return;
        const coach = ($('#cname').value || 'Coach').trim().slice(0, 16);
        // keep the previewed league so the strengths shown are the real ones
        const S = CK.S; S.me = pick; S.coach = coach; S.diff = diff; S.len = len; S.ppq = ppq;
        L.makeSchedule(); S.inbox = []; L.inbox(/^coach$/i.test(coach) ? 'Welcome, Coach' : 'Welcome, Coach ' + coach, 'The owner hired you to bring a title to ' + L.myTeam().city + '. Win games to earn Coach Credits, keep the fans happy, and do not let the owner lose faith.');
        L.save(); UI.hub('home');
      });
    };
    draw();
  };

  // ---------- hub ----------
  UI.hub = t => {
    tab = t || tab;
    const S = CK.S, me = L.myTeam();
    if (S.phase === 'review') return UI.review();
    if (S.phase === 'resign') return UI.resign();
    if (S.phase === 'draft') return UI.draft();
    if (S.phase === 'fa') return UI.fa();
    const unread = S.inbox.filter(m => !m.read).length;
    app().innerHTML = '<div class="hub" style="--tc:' + me.c1 + ';--tc2:' + me.c2 + '">' +
      '<header><div class="tn">' + (UI.logo(me, 'hd') || teamTag(me)) + '<div><b>' + U.esc((me.city + ' ' + (me.name || '')).toUpperCase()) + '</b><span>' + rec(me) + ' / ' + U.ord(L.seed(me)) + ' ' + (me.conf === 'E' ? 'EAST' : 'WEST') + ' / ' + S.season + '</span></div></div>' +
      '<div class="cc"><i>CC</i><b>' + S.cc + '</b></div></header>' +
      '<div class="meters"><div>FANS ' + bar(S.fans, '#3dff6a') + '</div><div>OWNER ' + bar(S.owner, S.owner < 25 ? '#ff4d4d' : '#ffd23f') + '</div></div>' +
      '<main id="tab"></main>' +
      '<nav>' + [['home', 'HOME'], ['roster', 'ROSTER'], ['league', 'LEAGUE'], ['trade', 'TRADE'], ['office', 'OFFICE']].map(([k, n]) => '<button data-t="' + k + '" class="' + (tab === k ? 'sel' : '') + '">' + n + (k === 'home' && unread ? '<em>' + unread + '</em>' : '') + '</button>').join('') + '</nav></div>';
    click('nav button', el => UI.hub(el.dataset.t));
    ({ home: tabHome, roster: tabRoster, league: tabLeague, trade: tabTrade, office: tabOffice })[tab]();
  };

  function tabHome() {
    const S = CK.S, me = L.myTeam(), g = L.myGame();
    let h = '';
    if (S.lastRes && S.lastRes.season === S.season) {
      const r = S.lastRes, hT = L.T(r.home), aT = L.T(r.away);
      h += '<div class="last ' + (r.won ? 'w' : 'l') + '">LAST GAME: ' + (r.won ? 'W' : 'L') + ' ' + aT.ab + ' ' + r.as + ' - ' + r.hs + ' ' + hT.ab + ' <span>+' + r.cc + ' CC</span></div>';
    }
    if (g) {
      const opp = L.T(g.home === S.me ? g.away : g.home), isHome = g.home === S.me;
      const label = S.phase === 'playoffs' ? L.ROUND_NAMES[S.playoff.r] : 'GAME ' + (S.round + 1) + ' OF ' + S.len;
      h += '<div class="next"><div class="lbl">' + label + (isHome ? ' / HOME' : ' / AWAY') + '</div>' +
        '<div class="mu"><div class="side">' + bigTeam(me) + '<b>' + rec(me) + '</b>' + UI.stars(L.teamStars(me)) + '</div><i>VS</i><div class="side">' + bigTeam(opp) + '<b>' + rec(opp) + '</b>' + UI.stars(L.teamStars(opp)) + '</div></div>' +
        '<button class="btn big" id="play">PLAY GAME</button><button class="btn alt" id="sim">SIM GAME<small>fewer Coach Credits</small></button></div>';
    } else if (S.phase === 'playoffs') {
      h += '<div class="next"><div class="lbl">PLAYOFFS</div><p>Your season is over. ' + (S.playoff.r < 4 ? 'The bracket keeps going without you.' : '') + '</p><button class="btn big" id="simpo">SIM REST OF PLAYOFFS</button></div>';
    }
    if (S.phase === 'playoffs') h += bracket();
    h = '<div class="cols"><div>' + h + '</div><div>';
    h += '<div class="lbl">INBOX</div><div class="inbox">' + S.inbox.slice(0, 12).map(m => '<div class="msg ' + (m.read ? '' : 'new') + (m.choices ? ' ask' : '') + '" data-id="' + m.id + '"><b>' + U.esc(m.title) + '</b><span>' + U.esc(m.body).slice(0, 70) + (m.body.length > 70 ? '...' : '') + '</span></div>').join('') + '</div></div></div>';
    $('#tab').innerHTML = h;
    if (g) {
      click('#play', () => startGame(g, false));
      click('#sim', () => startGame(g, true));
    }
    click('#simpo', () => { L.simRestOfPlayoffs(); L.save(); UI.hub('home'); });
    click('.msg', el => openMsg(S.inbox.find(m => m.id === el.dataset.id)));
  }
  function openMsg(m) {
    m.read = true; L.save();
    UI.modal('<h2>' + U.esc(m.title) + '</h2><p class="mbody">' + U.esc(m.body) + '</p>' + (m.choices ? m.choices.map((c, i) => '<button class="btn alt" data-c="' + i + '">' + U.esc(c.label) + '</button>').join('') : m.answered ? '<p class="ans">You chose: ' + U.esc(m.answered) + '</p>' : ''), mm => {
      mm.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { CK.EV.choose(m, +b.dataset.c); UI.closeModal(); UI.toast(m.answered); UI.hub(); });
    });
    const em = document.querySelector('nav em'); if (em) { const n = CK.S.inbox.filter(x => !x.read).length; n ? em.textContent = n : em.remove(); }
  }
  function startGame(gm, sim) {
    const S = CK.S;
    const label = S.phase === 'playoffs' ? L.ROUND_NAMES[S.playoff.r] : 'GAME ' + (S.round + 1);
    const done = res => {
      L.finishRound(res); L.save();
      UI.hub('home');
      if (S.phase === 'review') return;
      const unanswered = S.inbox.find(m => m.choices && !m.read);
      if (unanswered) setTimeout(() => openMsg(unanswered), 300);
    };
    const opts = { home: gm.home, away: gm.away, po: !!gm.po, label };
    if (sim) CK.M.simGame(opts, done); else { app().innerHTML = ''; CK.M.start(opts, done); }
  }
  function bracket() {
    const S = CK.S, pl = S.playoff;
    return '<div class="lbl">BRACKET</div><div class="brk">' + pl.rounds.map((r, i) => '<div class="rd"><div class="rn">' + L.ROUND_NAMES[i] + '</div>' + r.map(s => {
      const a = L.T(s.a), b = L.T(s.b);
      const row = (t, sc) => '<div class="' + (s.w === t.id ? 'w' : s.w != null ? 'l' : '') + (t.id === S.me ? ' me' : '') + '">' + teamTag(t) + (sc != null ? '<b>' + sc + '</b>' : '') + '</div>';
      return '<div class="sr">' + row(a, s.hs) + row(b, s.as) + '</div>';
    }).join('') + '</div>').join('') + '</div>';
  }

  // ---------- roster ----------
  function tabRoster() {
    const S = CK.S, me = L.myTeam();
    const ro = L.roster(me).sort((a, b) => (me.start.includes(b.id) - me.start.includes(a.id)) || CK.POS.indexOf(a.pos) - CK.POS.indexOf(b.pos) || L.ovr(b) - L.ovr(a));
    const pay = L.payroll(me);
    $('#tab').innerHTML = '<div class="rhead"><span>' + me.roster.length + '/' + CK.ROSTER_MAX + ' PLAYERS</span><span class="' + (pay > CK.CAP ? 'bad' : '') + '">PAYROLL ' + U.money(pay) + ' / ' + U.money(CK.CAP) + '</span></div>' +
      '<div class="lbl">STARTERS <small>tap a player to train, swap or release</small></div>' +
      '<div class="rgrid">' + ro.slice(0, 5).map(p => prow(p, me)).join('') + '</div><div class="lbl">BENCH</div><div class="rgrid">' + ro.slice(5).map(p => prow(p, me)).join('') + '</div>';
    click('.prow', el => UI.player(L.P(el.dataset.id)));
  }
  function prow(p, t, extra) {
    const st = p.st, gp = Math.max(1, st.gp);
    return '<div class="prow" data-id="' + p.id + '">' + UI.portrait(p, t, 36) + '<div class="pi"><b>' + U.esc(L.name(p)) + (p.inj ? ' <em class="inj">OUT ' + p.inj + '</em>' : '') + '</b><span>' + p.pos + ' / ' + p.age + ' YRS / ' + U.money(p.sal) + ' x' + Math.max(0, p.yrs) + '</span>' +
      (st.gp ? '<span class="ln">' + (st.pts / gp).toFixed(1) + ' PPG ' + (st.reb / gp).toFixed(1) + ' RPG ' + (st.ast / gp).toFixed(1) + ' APG</span>' : '') + '</div>' +
      '<div class="pr">' + UI.stars(L.stars(p)) + (extra || '') + '</div></div>';
  }
  UI.player = (p, opts) => {
    const S = CK.S, me = L.myTeam(), mine = p.tm === S.me, t = p.tm >= 0 ? L.T(p.tm) : null;
    const gp = Math.max(1, p.st.gp);
    const html = '<div class="pcard" style="--c:' + (t ? t.c1 : '#444') + '">' + UI.portrait(p, t, 72) +
      '<div><h2>' + U.esc(L.name(p)) + '</h2><div class="sub">' + p.pos + ' / #' + p.num + ' / ' + Math.floor(p.ht / 12) + "'" + (p.ht % 12) + '" / AGE ' + p.age + (t ? ' / ' + t.ab : ' / FREE AGENT') + '</div>' + UI.stars(L.stars(p)) + '<span class="ovr">OVR ' + L.ovr(p).toFixed(1) + '</span></div></div>' +
      '<div class="rt">' + CK.RKEYS.map(k => '<div class="rr"><span>' + CK.RATING_NAMES[k] + '</span>' + pips(p.r[k]) + '<b>' + p.r[k] + '</b>' + (mine && !opts ? '<button class="tr" data-k="' + k + '" ' + (p.r[k] >= 10 ? 'disabled' : '') + '>+1 <small>' + O.trainCost(p, k) + ' CC</small></button>' : '') + '</div>').join('') + '</div>' +
      (mine && !opts ? '<div class="look">LOOK <button class="btn sm alt" id="lskin">SKIN TONE</button><button class="btn sm alt" id="lhair">HAIR</button><button class="btn sm alt" id="lhc">HAIR COLOR</button></div>' : '') +
      '<div class="mor">MORALE ' + bar(p.morale, p.morale < 40 ? '#ff4d4d' : p.morale < 65 ? '#ffd23f' : '#3dff6a') + '</div>' +
      '<div class="sl">POTENTIAL ' + UI.stars(p.potLo == null || p.scout || mine || p.tm >= 0 ? p.pot : (p.potLo + p.potHi) / 2) + '</div>' +
      '<div class="sl">CONTRACT ' + U.money(p.sal) + ' / ' + Math.max(0, p.yrs) + ' YR' + (p.yrs === 1 ? '' : 'S') + '</div>' +
      '<table class="box"><tr><th></th><th>GP</th><th>PPG</th><th>RPG</th><th>APG</th><th>FG%</th><th>3P%</th></tr>' +
      ['st', 'car'].map(k => { const s = p[k], n = Math.max(1, s.gp); return '<tr><td>' + (k === 'st' ? 'SEASON' : 'CAREER') + '</td><td>' + s.gp + '</td><td>' + (s.pts / n).toFixed(1) + '</td><td>' + (s.reb / n).toFixed(1) + '</td><td>' + (s.ast / n).toFixed(1) + '</td><td>' + (s.fga ? Math.round(s.fgm / s.fga * 100) : 0) + '</td><td>' + (s.tpa ? Math.round(s.tpm / s.tpa * 100) : 0) + '</td></tr>'; }).join('') + '</table>' +
      (mine && !opts ? '<div class="acts">' + (me.start.includes(p.id) ? '<span class="isst">STARTER</span>' : '<button class="btn alt sm" id="mkst">MAKE STARTER</button>') + '<button class="btn alt sm red" id="rel">RELEASE</button></div>' : '');
    UI.modal(html, m => {
      m.querySelectorAll('.tr').forEach(b => b.onclick = () => { const err = O.train(p, b.dataset.k); if (err) return UI.toast(err, true); CK.SFX.play('swish'); L.save(); UI.toast(p.ln + ' ' + CK.RATING_NAMES[b.dataset.k] + ' +1'); UI.player(p); UI.hub(); });
      const mk = m.querySelector('#mkst'); if (mk) mk.onclick = () => chooseSwap(p);
      const cyc = (id, k, n) => { const b = m.querySelector(id); if (b) b.onclick = () => { p[k] = (p[k] + 1) % n; L.save(); UI.player(p); }; };
      cyc('#lskin', 'skin', 6); cyc('#lhair', 'hair', 6); cyc('#lhc', 'hc', 6);
      const rl = m.querySelector('#rel'); if (rl) rl.onclick = () => {
        if (me.roster.length <= CK.ROSTER_MIN) return UI.toast('Need at least ' + CK.ROSTER_MIN + ' players.', true);
        if (!confirm('Release ' + L.name(p) + '? He becomes a free agent.')) return;
        O.release(p); if (me.start.length < 5) L.autoStarters(me); L.save(); UI.closeModal(); UI.hub();
      };
    });
  };
  function chooseSwap(p) {
    const me = L.myTeam();
    UI.modal('<h2>SWAP IN ' + U.esc(p.ln.toUpperCase()) + '</h2><div class="lbl">REPLACE WHICH STARTER?</div>' + me.start.map(L.P).map(s => prow(s, me)).join(''), m => {
      m.querySelectorAll('.prow').forEach(r => r.onclick = () => { const i = me.start.indexOf(r.dataset.id); me.start[i] = p.id; L.save(); UI.closeModal(); UI.hub('roster'); UI.toast(p.ln + ' is starting'); });
    });
  }

  // ---------- league ----------
  let lgView = 'stand';
  function tabLeague() {
    const S = CK.S;
    let h = '<div class="seg" id="lv">' + [['stand', 'STANDINGS'], ['lead', 'LEADERS'], ['hist', 'HISTORY']].map(([k, n]) => '<button data-v="' + k + '" class="' + (lgView === k ? 'sel' : '') + '">' + n + '</button>').join('') + '</div>';
    if (lgView === 'stand') {
      ['E', 'W'].forEach(c => {
        h += '<div class="lbl">' + (c === 'E' ? 'EAST' : 'WEST') + '</div><table class="stand"><tr><th>#</th><th>TEAM</th><th>W-L</th><th>DIFF</th><th>STRK</th></tr>' +
          L.standings(c).map((t, i) => '<tr class="' + (t.id === S.me ? 'me' : '') + (i === 7 ? ' cut' : '') + '" data-t="' + t.id + '"><td>' + (i + 1) + '</td><td>' + teamTag(t) + ' ' + U.esc(t.city) + '</td><td>' + rec(t) + '</td><td>' + (t.pf - t.pa > 0 ? '+' : '') + (t.pf - t.pa) + '</td><td>' + (t.strk > 0 ? 'W' + t.strk : t.strk < 0 ? 'L' + -t.strk : '-') + '</td></tr>').join('') + '</table>';
      });
    } else if (lgView === 'lead') {
      const all = Object.values(S.players).filter(p => p.tm >= 0 && p.st.gp >= 1);
      const cats = [['pts', 'POINTS'], ['reb', 'REBOUNDS'], ['ast', 'ASSISTS'], ['stl', 'STEALS'], ['blk', 'BLOCKS']];
      cats.forEach(([k, n]) => {
        const top = all.slice().sort((a, b) => b.st[k] / b.st.gp - a.st[k] / a.st.gp).slice(0, 5);
        h += '<div class="lbl">' + n + ' PER GAME</div>' + top.map((p, i) => '<div class="lead ' + (p.tm === S.me ? 'me' : '') + '" data-id="' + p.id + '"><i>' + (i + 1) + '</i>' + teamTag(L.T(p.tm)) + '<span>' + U.esc(L.name(p)) + '</span><b>' + (p.st[k] / p.st.gp).toFixed(1) + '</b></div>').join('');
      });
    } else {
      h += '<div class="lbl">YOUR CAREER: ' + S.totW + '-' + S.totL + '</div>';
      h += S.trophies.length ? '<div class="troph">' + S.trophies.map(t => '<div class="tro ' + t.type + '"><b>' + (t.type === 'title' ? 'CHAMPIONS' : t.type) + '</b><span>' + t.season + (t.who ? ' / ' + U.esc(t.who) : ' / ' + t.team) + '</span></div>').join('') + '</div>' : '<p class="dim">No trophies yet. Go get one.</p>';
      h += S.history.length ? '<table class="stand"><tr><th>YEAR</th><th>TEAM</th><th>W-L</th><th>RESULT</th><th>CHAMP</th></tr>' + S.history.map(x => '<tr><td>' + x.season + '</td><td>' + x.team + '</td><td>' + x.w + '-' + x.l + '</td><td>' + x.finish + '</td><td>' + x.champ + '</td></tr>').join('') + '</table>' : '';
    }
    $('#tab').innerHTML = h;
    click('#lv button', el => { lgView = el.dataset.v; tabLeague(); });
    click('.lead', el => UI.player(L.P(el.dataset.id), { view: true }));
    click('.stand tr[data-t]', el => teamView(L.T(+el.dataset.t)));
  }
  function teamView(t) {
    if (t.id === CK.S.me) return UI.hub('roster');
    UI.modal('<h2>' + teamTag(t) + ' ' + U.esc(t.city.toUpperCase()) + '</h2><div class="sub">' + rec(t) + ' / PAYROLL ' + U.money(L.payroll(t)) + '</div>' + L.roster(t).sort((a, b) => L.ovr(b) - L.ovr(a)).map(p => prow(p, t)).join(''), m => {
      m.querySelectorAll('.prow').forEach(r => r.onclick = () => UI.player(L.P(r.dataset.id), { view: true }));
    });
  }

  // ---------- trade ----------
  let tr = { tid: null, give: [], get: [] };
  function tabTrade() {
    const S = CK.S, me = L.myTeam();
    if (S.phase !== 'season' || S.deadline) { $('#tab').innerHTML = '<div class="next"><div class="lbl">TRADES CLOSED</div><p>' + (S.deadline ? 'The trade deadline has passed. Trades open again next season.' : 'No trades during the playoffs.') + '</p></div>'; return; }
    if (tr.tid == null || tr.tid === S.me) tr.tid = (S.me + 1) % 30;
    const them = L.T(tr.tid);
    tr.give = tr.give.filter(id => me.roster.includes(id)); tr.get = tr.get.filter(id => them.roster.includes(id));
    const give = tr.give.map(L.P), get = tr.get.map(L.P);
    const ev = O.evalTrade(give, get, them.id);
    const col = ev.pct >= 100 ? '#3dff6a' : ev.pct >= 70 ? '#ffd23f' : '#ff4d4d';
    $('#tab').innerHTML = '<div class="lbl">TRADE WITH</div><select id="tsel">' + S.teams.filter(t => t.id !== S.me).map(t => '<option value="' + t.id + '" ' + (t.id === them.id ? 'selected' : '') + '>' + t.city + ' (' + rec(t) + ')</option>').join('') + '</select>' +
      '<div class="tmeter"><div>WILL THEY ACCEPT?</div>' + bar(ev.pct, col) + '<b style="color:' + col + '">' + ev.pct + '%</b></div>' +
      (ev.err && (give.length || get.length) ? '<div class="terr">' + ev.err + '</div>' : '') +
      '<button class="btn" id="prop" ' + (ev.ok ? '' : 'disabled') + '>PROPOSE TRADE</button>' +
      '<div class="tcols"><div><div class="lbl">YOU GET</div>' + L.roster(them).sort((a, b) => L.ovr(b) - L.ovr(a)).map(p => tpRow(p, them, tr.get.includes(p.id), 'get')).join('') + '</div>' +
      '<div><div class="lbl">YOU GIVE</div>' + L.roster(me).sort((a, b) => L.ovr(b) - L.ovr(a)).map(p => tpRow(p, me, tr.give.includes(p.id), 'give')).join('') + '</div></div>';
    $('#tsel').onchange = e => { tr = { tid: +e.target.value, give: tr.give, get: [] }; tabTrade(); };
    click('.tp', el => { const arr = tr[el.dataset.s]; const i = arr.indexOf(el.dataset.id); if (i >= 0) arr.splice(i, 1); else if (arr.length < 3) arr.push(el.dataset.id); tabTrade(); });
    click('#prop', () => {
      if (!ev.ok) return;
      O.doTrade(give, get, them.id); tr.give = []; tr.get = []; L.save(); CK.SFX.play('cheer'); UI.toast('Trade done!'); UI.hub('roster');
    });
  }
  const tpRow = (p, t, sel, side) => '<div class="tp ' + (sel ? 'sel' : '') + '" data-id="' + p.id + '" data-s="' + side + '"><span class="pos">' + p.pos + '</span><b>' + U.esc(L.short(p)) + '</b>' + UI.stars(L.stars(p)) + '<small>' + p.age + 'y ' + U.money(p.sal) + '</small></div>';

  // ---------- office ----------
  function tabOffice() {
    const S = CK.S;
    const FAC = { train: ['TRAINING CENTER', 'Players improve more each offseason.'], med: ['MEDICAL', 'Fewer games lost to injuries.'], arena: ['ARENA', 'More fans, more CC from home games.'] };
    $('#tab').innerHTML = '<div class="lbl">FACILITIES</div>' + Object.keys(FAC).map(k => '<div class="fac"><div><b>' + FAC[k][0] + '</b><span>' + FAC[k][1] + '</span><div class="lv">' + [1, 2, 3, 4, 5].map(i => '<i class="' + (i <= S.fac[k] ? 'on' : '') + '"></i>').join('') + '</div></div>' +
      (S.fac[k] >= 5 ? '<span class="max">MAX</span>' : '<button class="btn sm" data-k="' + k + '">UPGRADE<small>' + O.facCost(k) + ' CC</small></button>') + '</div>').join('') +
      '<div class="lbl">SETTINGS</div>' +
      '<div class="setrow">DIFFICULTY<div class="seg" id="sdif">' + ['ROOKIE', 'PRO', 'ALL-STAR', 'LEGEND'].map((n, i) => '<button data-v="' + i + '" class="' + (S.diff === i ? 'sel' : '') + '">' + n + '</button>').join('') + '</div></div>' +
      '<div class="setrow">POSSESSIONS PER QUARTER<div class="seg" id="sppq">' + [2, 3, 4, 5].map(n => '<button data-v="' + n + '" class="' + (S.ppq === n ? 'sel' : '') + '">' + n + '</button>').join('') + '</div></div>' +
      '<div class="setrow">TEAM LOGOS<div class="seg" id="slg"><button data-v="real" class="' + (S.logos !== 'retro' ? 'sel' : '') + '">REAL</button><button data-v="retro" class="' + (S.logos === 'retro' ? 'sel' : '') + '">RETRO LETTERS</button></div></div>' +
      '<div class="setrow">SOUND<div class="seg" id="ssnd"><button data-v="1" class="' + (CK.SFX.on ? 'sel' : '') + '">ON</button><button data-v="0" class="' + (!CK.SFX.on ? 'sel' : '') + '">OFF</button></div></div>' +
      '<button class="btn alt sm" id="howb">HOW TO PLAY</button><button class="btn alt sm" id="quit">TITLE SCREEN</button>' +
      '<p class="dim">Coach ' + U.esc(S.coach) + ' / career ' + S.totW + '-' + S.totL + ' / saves automatically on this device</p>';
    click('.fac .btn', el => { const err = O.upgrade(el.dataset.k); if (err) return UI.toast(err, true); CK.SFX.play('cheer'); L.save(); UI.hub('office'); UI.toast('Upgraded!'); });
    click('#sdif button', el => { S.diff = +el.dataset.v; L.save(); UI.hub('office'); });
    click('#sppq button', el => { S.ppq = +el.dataset.v; L.save(); UI.hub('office'); });
    click('#slg button', el => { S.logos = el.dataset.v; L.save(); UI.hub('office'); });
    click('#ssnd button', el => { CK.SFX.on = el.dataset.v === '1'; S.sfx = CK.SFX.on; L.save(); UI.hub('office'); });
    click('#howb', UI.howTo); click('#quit', UI.title);
  }

  // ---------- offseason ----------
  UI.review = () => {
    UI.closeModal();
    const S = CK.S, r = S.review, champ = L.T(r.champ);
    const aw = (k, n) => { const p = r[k] && L.P(r[k]); return p ? '<div class="aw"><i>' + n + '</i>' + UI.portrait(p, p.tm >= 0 ? L.T(p.tm) : null, 32) + '<b>' + U.esc(L.name(p)) + '</b><span>' + (p.tm >= 0 ? L.T(p.tm).ab : '') + '</span></div>' : ''; };
    app().innerHTML = '<div class="page review">' + (r.won ? '<div class="champ">CHAMPIONS</div><canvas id="conf" width="216" height="60"></canvas>' : '<h2>SEASON ' + r.season + ' REVIEW</h2>') +
      '<div class="rv"><b>' + r.w + '-' + r.l + '</b><span>' + r.finish + '</span></div>' +
      '<div class="lbl">LEAGUE CHAMPION</div><div class="chline">' + teamTag(champ) + ' ' + U.esc(champ.city) + '</div>' +
      '<div class="lbl">AWARDS</div>' + aw('mvp', 'MVP') + aw('dpoy', 'DEFENSIVE POY') + aw('roy', 'ROOKIE OF THE YEAR') +
      '<div class="lbl">OWNER</div><div class="own">' + (r.dOwner >= 0 ? 'The owner is pleased (+' + r.dOwner + ').' : 'The owner is not happy (' + r.dOwner + ').') + ' Trust: ' + S.owner + '</div>' + bar(S.owner, S.owner < 25 ? '#ff4d4d' : '#ffd23f') +
      '<div class="earn">+' + r.ccWin + ' CC SEASON BONUS</div>' +
      (r.fired ? '<div class="fired">YOU HAVE BEEN FIRED</div><p>Three teams want to talk to you.</p>' + O.jobOffers().map(id => '<button class="btn alt job" data-id="' + id + '">' + teamTag(L.T(id)) + ' ' + L.T(id).city + ' (' + rec(L.T(id)) + ')</button>').join('') : '<button class="btn" id="off">START OFFSEASON</button>') + '</div>';
    if (r.won) confetti();
    click('#off', () => { advanceOffseason(); });
    click('.job', el => { O.takeJob(+el.dataset.id); advanceOffseason(); });
  };
  function advanceOffseason() {
    const S = CK.S;
    O.develop(); O.tickContracts();
    S.phase = 'resign'; S.review = null; L.save(); UI.resign();
  }
  function confetti() {
    const c = $('#conf'); if (!c) return; const g = c.getContext('2d'); const ps = Array.from({ length: 80 }, () => ({ x: Math.random() * 216, y: -Math.random() * 60, v: 10 + Math.random() * 30, c: U.pick(['#ffd23f', '#ff8a1f', '#3dff6a', '#7cd6ff', '#fff', L.myTeam().c1]) }));
    const tick = () => { if (!document.body.contains(c)) return; g.clearRect(0, 0, 216, 60); ps.forEach(p => { p.y += p.v / 60; if (p.y > 60) p.y = -2; g.fillStyle = p.c; g.fillRect(p.x | 0, p.y | 0, 2, 2); }); requestAnimationFrame(tick); };
    tick();
  }
  UI.resign = () => {
    const S = CK.S, me = L.myTeam(), ex = O.expiring();
    app().innerHTML = '<div class="page"><h2>RE-SIGN PLAYERS</h2><div class="sub">OFFSEASON ' + S.season + ' / PAYROLL ' + U.money(L.payroll(me) - ex.reduce((a, p) => a + p.sal, 0)) + ' / CAP ' + U.money(CK.CAP) + '</div>' +
      (ex.length ? ex.map(p => '<div class="rs">' + prow(p, me) + '<div class="rsb"><span>ASKS ' + U.money(O.ask(p)) + '/YR</span>' + [1, 2, 3, 4].map(y => '<button class="btn sm" data-id="' + p.id + '" data-y="' + y + '">' + y + 'YR</button>').join('') + '<button class="btn sm alt red" data-id="' + p.id + '" data-y="0">LET GO</button></div></div>').join('') : '<p class="dim">No expiring contracts this year.</p>') +
      '<button class="btn" id="todraft" ' + (ex.length ? 'disabled' : '') + '>' + (ex.length ? 'DECIDE ON EVERY PLAYER' : 'GO TO THE DRAFT') + '</button></div>';
    click('.rsb .btn', el => {
      const p = L.P(el.dataset.id), y = +el.dataset.y;
      if (y) { const after = L.payroll(me) - ex.reduce((a, q) => a + q.sal, 0) + O.ask(p); if (after > CK.APRON) return UI.toast('That would put you over the ' + U.money(CK.APRON) + ' apron.', true); O.resign(p, y); UI.toast(p.ln + ' re-signed'); }
      else { O.release(p); }
      L.save(); UI.resign();
    });
    click('#todraft', () => { O.makeDraft(); S.phase = 'draft'; L.save(); UI.draft(); });
  };
  UI.draft = () => {
    const S = CK.S, d = S.draft, me = L.myTeam();
    const more = O.aiDraftUntilMe();
    if (!more) { O.finishDraft(); S.phase = 'fa'; L.save(); return UI.fa(); }
    const n = d.pick + 1, rnd = n <= 30 ? 1 : 2;
    const pros = d.pros.map(L.P).sort((a, b) => O.prospectValue(b) - O.prospectValue(a));
    const mine = d.picks.filter(x => x.tid === S.me).map(x => L.P(x.pid)).filter(Boolean);
    app().innerHTML = '<div class="page"><h2>DRAFT ' + (S.season + 1) + '</h2><div class="sub">YOU ARE ON THE CLOCK: ROUND ' + rnd + ', PICK ' + n + ' / ' + S.cc + ' CC</div>' +
      (mine.length ? '<div class="lbl">YOUR PICKS</div>' + mine.map(p => '<div class="dp">' + p.pos + ' ' + U.esc(L.name(p)) + '</div>').join('') : '') +
      '<div class="lbl">RECENT PICKS</div><div class="recent">' + d.picks.slice(-4).reverse().map(x => '<span>' + x.n + '. ' + L.T(x.tid).ab + ' ' + U.esc(L.short(L.P(x.pid))) + '</span>').join('') + '</div>' +
      '<div class="lbl">PROSPECTS <small>scouting reveals true potential (1 CC)</small></div>' +
      pros.slice(0, 24).map(p => '<div class="pro"><div class="pi"><b>' + p.pos + ' ' + U.esc(L.name(p)) + '</b><span>AGE ' + p.age + ' / ' + Math.floor(p.ht / 12) + "'" + (p.ht % 12) + '"</span></div>' +
        '<div class="pv"><span>NOW</span>' + UI.stars(L.stars(p)) + '<span>POT</span>' + (p.scout ? UI.stars(p.pot) : '<em>' + p.potLo + '-' + p.potHi + ' STARS</em>') + '</div>' +
        '<div class="pb">' + (p.scout ? '' : '<button class="btn sm alt" data-sc="' + p.id + '">SCOUT</button>') + '<button class="btn sm" data-dr="' + p.id + '">DRAFT</button></div></div>').join('') +
      '<button class="btn alt" id="autod">AUTO-DRAFT FOR ME</button></div>';
    click('[data-sc]', el => { if (S.cc < 1) return UI.toast('Need 1 CC', true); S.cc--; L.P(el.dataset.sc).scout = true; L.save(); UI.draft(); });
    click('[data-dr]', el => { const p = L.P(el.dataset.dr); O.draftPlayer(S.me, p.id); UI.toast('You drafted ' + L.name(p)); CK.SFX.play('cheer'); L.save(); UI.draft(); });
    click('#autod', () => { const p = pros[0]; O.draftPlayer(S.me, p.id); L.save(); UI.draft(); });
  };
  UI.fa = () => {
    const S = CK.S, me = L.myTeam(), fl = O.faList().slice(0, 30);
    const room = CK.CAP - L.payroll(me);
    app().innerHTML = '<div class="page"><h2>FREE AGENCY</h2><div class="sub">ROSTER ' + me.roster.length + '/' + CK.ROSTER_MAX + ' / CAP ROOM ' + U.money(room) + '</div>' +
      (me.roster.length > CK.ROSTER_MAX ? '<div class="terr">Too many players. Release someone from your roster first.</div>' : '') +
      fl.map(p => '<div class="rs">' + prow(p, null) + '<div class="rsb"><span>WANTS ' + U.money(L.salaryFor(p)) + '/YR</span>' + [1, 2, 3].map(y => '<button class="btn sm" data-id="' + p.id + '" data-y="' + y + '">' + y + 'YR</button>').join('') + '</div></div>').join('') +
      '<div class="lbl">YOUR ROSTER</div>' + L.roster(me).sort((a, b) => L.ovr(b) - L.ovr(a)).map(p => '<div class="rs mine">' + prow(p, me) + '<div class="rsb"><button class="btn sm alt red" data-cut="' + p.id + '">RELEASE</button></div></div>').join('') +
      '<button class="btn" id="season" ' + (me.roster.length > CK.ROSTER_MAX ? 'disabled' : '') + '>START SEASON ' + (S.season + 1) + '</button></div>';
    click('.rsb [data-y]', el => { const err = O.sign(L.P(el.dataset.id), +el.dataset.y); if (err) return UI.toast(err, true); CK.SFX.play('cheer'); L.save(); UI.fa(); });
    click('[data-cut]', el => { if (me.roster.length <= CK.ROSTER_MIN) return UI.toast('Need at least ' + CK.ROSTER_MIN + ' players.', true); O.release(L.P(el.dataset.cut)); L.save(); UI.fa(); });
    click('#season', () => { O.aiFreeAgency(); O.startNewSeason(); UI.hub('home'); });
  };
})(window.CK);
