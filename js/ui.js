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
  // logos are shrunk to a few pixels and blown back up, so they look like retro sprites
  const LGPX = { tlg: 34, big: 40, hd: 40, sm: 18, rdl: 30, pnl: 56 };
  UI.logoTag = (url, cls, n) => '<canvas class="lg pxl ' + (cls || '') + '" width="' + n + '" height="' + n + '" data-lg="' + url + '"></canvas>';
  UI.logo = (t, cls) => (!t.logo || (CK.S && CK.S.logos === 'retro')) ? '' : UI.logoTag(CK.logoUrl(t.logo), cls, LGPX[cls] || 24);
  const lgImgs = {};
  const paintLogo = c => {
    const url = c.dataset.lg; c.removeAttribute('data-lg');
    let im = lgImgs[url];
    if (!im) { im = lgImgs[url] = new Image(); im.cbs = []; im.crossOrigin = 'anonymous'; im.onload = () => { im.ok = true; im.cbs.forEach(f => f()); im.cbs = []; }; im.onerror = () => { im.bad = true; im.cbs.forEach(f => f()); im.cbs = []; }; im.src = url; }
    const go = () => {
      if (im.bad) return c.remove();
      const g = c.getContext('2d'), n = c.width;
      g.imageSmoothingEnabled = false;
      im.px = im.px || {};
      const P = im.px[n] || (im.px[n] = U.pixLogo(im, n - 2, n - 2));
      g.clearRect(0, 0, n, n); g.drawImage(P, 0, 0);
    };
    im.ok || im.bad ? go() : im.cbs.push(go);
  };
  const scanLogos = root => (root.querySelectorAll ? root.querySelectorAll('canvas[data-lg]') : []).forEach(paintLogo);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType !== 1) return; if (n.matches && n.matches('canvas[data-lg]')) paintLogo(n); else scanLogos(n); }))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => scanLogos(document));
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
      const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
      const skD = U.shade(skin, -0.18), skL = U.shade(skin, 0.12);
      R(8, 13, 4, 2, skD);
      R(5, 5, 10, 8, skin); R(6, 4, 8, 1, skin); R(6, 13, 8, 1, skin);            // rounded head
      R(6, 12, 8, 2, skD); R(4, 8, 1, 3, skD); R(15, 8, 1, 3, skD); R(12, 5, 2, 2, skL); // jaw, ears, light
      R(6, 7, 3, 1, U.shade(hair, 0.05)); R(11, 7, 3, 1, U.shade(hair, 0.05));    // brows
      R(7, 8, 2, 2, '#1a1010'); R(11, 8, 2, 2, '#1a1010'); R(7, 8, 1, 1, '#fff'); R(11, 8, 1, 1, '#fff');
      R(9, 10, 2, 1, U.shade(skin, -0.25));                                       // nose
      if ((p.num * 7 + p.hair) % 3 === 0 && p.hair !== 5) { R(6, 11, 8, 3, hair); R(5, 10, 1, 2, hair); R(14, 10, 1, 2, hair); }
      R(8, 12, 4, 1, U.shade(skin, -0.4));                                        // mouth
      switch (p.hair) {
        case 0: R(6, 3, 8, 2, hair); R(5, 4, 1, 3, hair); R(14, 4, 1, 3, hair); break;
        case 1: R(4, 0, 12, 2, hair); R(3, 2, 14, 4, hair); R(3, 6, 2, 4, hair); R(15, 6, 2, 4, hair); break;
        case 2: R(5, 0, 10, 5, hair); R(5, 0, 10, 1, U.shade(hair, 0.25)); break;
        case 3: R(5, 2, 10, 3, hair); R(4, 4, 2, 8, hair); R(14, 4, 2, 8, hair); break;
        case 4: R(6, 2, 8, 2, hair); R(5, 4, 10, 2, trim); break;
        default: R(7, 5, 2, 1, U.shade(skin, 0.3));
      }
      U.pixText(g, String(p.num), 10 - Math.ceil(U.pixW(String(p.num)) / 2), 16, trim === '#fff' && U.lum(jer) > 0.7 ? '#333' : trim);
      pcache[key] = c.toDataURL();
    }
    return '<img class="face" src="' + pcache[key] + '" style="width:' + (size || 40) + 'px;height:' + (size || 40) + 'px">';
  };
  UI.toast = (t, bad) => { const el = $('#toast'); el.textContent = t; el.className = 'on' + (bad ? ' bad' : ''); clearTimeout(UI._tt); UI._tt = setTimeout(() => el.className = '', 2200); };
  UI.modal = (html, bind) => { const m = $('#modal'); m.innerHTML = '<div class="card">' + html + '<button class="x" id="mx">CLOSE</button></div>'; m.classList.add('on'); $('#mx').onclick = UI.closeModal; m.onclick = e => { if (e.target === m) UI.closeModal(); }; bind && bind(m); };
  UI.closeModal = () => $('#modal').classList.remove('on');
  const click = (sel, fn) => document.querySelectorAll(sel).forEach(el => el.addEventListener('click', e => { CK.SFX.init(); CK.SFX.play('click'); fn(el, e); }));

  // ---------- shared game options (mode, quarter length, possessions, difficulty) ----------
  const QLENS = [2, 3, 5, 8];
  UI.gameOpts = o => '<div class="lbl">GAME MODE</div><div class="seg" id="omode"><button data-v="full" class="' + (o.mode !== 'highlights' ? 'sel' : '') + '">FULL GAME</button><button data-v="highlights" class="' + (o.mode === 'highlights' ? 'sel' : '') + '">HIGHLIGHTS</button></div>' +
    (o.mode !== 'highlights'
      ? '<div class="lbl">QUARTER LENGTH <small>game clock, you play every possession</small></div><div class="seg" id="oqlen">' + QLENS.map(n => '<button data-v="' + n + '" class="' + ((o.qlen || 3) === n ? 'sel' : '') + '">' + n + ' MIN</button>').join('') + '</div>'
      : '<div class="lbl">POSSESSIONS YOU PLAY PER QUARTER <small>the rest gets simmed</small></div><div class="seg" id="oppq">' + [2, 3, 4, 5].map(n => '<button data-v="' + n + '" class="' + ((o.ppq || 3) === n ? 'sel' : '') + '">' + n + ' + ' + n + '</button>').join('') + '</div>') +
    (o.noDiff ? '' : '<div class="lbl">DIFFICULTY</div><div class="seg" id="odif">' + ['ROOKIE', 'PRO', 'ALL-STAR', 'LEGEND'].map((n, i) => '<button data-v="' + i + '" class="' + ((o.diff == null ? 1 : o.diff) === i ? 'sel' : '') + '">' + n + '</button>').join('') + '</div>');
  UI.bindOpts = (o, redraw) => {
    click('#omode button', el => { o.mode = el.dataset.v; redraw(); });
    click('#oqlen button', el => { o.qlen = +el.dataset.v; redraw(); });
    click('#oppq button', el => { o.ppq = +el.dataset.v; redraw(); });
    click('#odif button', el => { o.diff = +el.dataset.v; redraw(); });
  };
  // a throwaway league with today's real rosters (Play Now / online), the career save is untouched
  UI.tempLeague = me => { const keep = CK.S; const t = L.newLeague({ team: me }); t.logos = keep && keep.logos; t.tutDone = true; t.temp = true; return () => { CK.S = keep; }; };

  // ---------- title ----------
  UI.title = () => {
    const has = L.load();
    if (has) CK.SFX.on = CK.S.sfx !== false;
    app().innerHTML = '<div class="title"><canvas id="tcv" width="400" height="225"></canvas><div class="tbox"><div class="tleft">' +
      '<h1><span>COURT</span><span>KINGS</span></h1><div class="tag">RETRO HOOPS DYNASTY</div></div><div class="tright">' +
      (has ? '<button class="btn" id="cont">CONTINUE CAREER<small>' + U.esc(L.myTeam().city) + ' ' + rec(L.myTeam()) + ' / ' + CK.S.season + (CK.S.real ? '' : ' / old made-up players: start a new career for real rosters') + '</small></button>' : '') +
      '<button class="btn ' + (has ? 'alt' : '') + '" id="pnow">PLAY NOW<small>quick game, any two teams</small></button>' +
      '<button class="btn alt" id="ponl">PLAY NOW ONLINE<small>you vs a friend</small></button>' +
      '<button class="btn alt" id="newc">' + (has ? 'NEW CAREER' : 'CAREER MODE<small>coach a team for seasons</small>') + '</button>' +
      '<button class="btn alt" id="how">HOW TO PLAY</button>' +
      '<div class="foot">v' + CK.VER + '</div></div></div></div>';
    titleAnim();
    if (has) click('#cont', () => UI.hub('home'));
    click('#newc', () => { if (has && !confirm('Start over? Your current career will be erased.')) return; UI.newCareer(); });
    click('#how', UI.howTo);
    click('#pnow', () => UI.playNow());
    click('#ponl', () => UI.online());
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
    let home, away, hp, ap, n = 0;
    const poss = (offHome, r) => {
      const o = offHome ? home : away, d = offHome ? away : home;
      const cfg = { off: Object.assign({ players: offHome ? hp : ap }, CK.M.jersey(o, offHome)), def: Object.assign({ players: offHome ? ap : hp }, CK.M.jersey(d, !offHome)), user: 'watch', diff: 1, dir: offHome ? 1 : -1, flow: true,
        onEnd: res => { if (!document.body.contains(c)) return; if (++n > 24) return newGame(); poss(!offHome, res); } };
      if (r) { cfg.pos = r.pos; if (r.holder && r.holderSide === 1) cfg.handler = r.holder; else { cfg.inbound = true; if (r.tag !== 'make' && r.ballW) cfg.inbAt = r.ballW; } }
      E.start(cfg); E.st.user = null;
    };
    const newGame = () => {
      const ts = U.shuffle(CK.TEAMS.slice()); home = team(ts[0]); away = team(ts[1]); hp = five(home.ab); ap = five(away.ab); n = 0;
      CK.RD.buildCourt(home, away);
      poss(Math.random() < 0.5, null);
    };
    newGame();
    let last = performance.now();
    const tick = now => {
      if (!document.body.contains(c) || CK.inGame) return;
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (E.st && E.st.cfg.user === 'watch') { E.update(dt); if (E.st) CK.RD.draw(g, { hype: 0.3, keepCam: n > 0 }); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  UI.howTo = () => UI.modal('<h2>HOW TO PLAY</h2><div class="how">' +
    '<p><b>You are the coach.</b> Pick a team, win games, earn Coach Credits (CC), and build a dynasty.</p>' +
    '<p><b>Games:</b> FULL GAME mode is full court with a running clock: you play every possession, offense and defense, and the ball goes right back the other way. Pick 2, 3, 5 or 8 minute quarters, and a 10, 15, 21, 40 or 82 game season. HIGHLIGHTS mode sims most of the game and you only play the big possessions.</p>' +
    '<p><b>Play Now</b> is a quick game with any two real teams. <b>Play Now Online</b> lets you play a friend: one hosts and gets a code, the other joins with it.</p>' +
    '<p><b>Offense:</b> drag the left side to move. Hold SHOOT and let go when the meter hits the green. Tap a teammate (or PASS) to pass. Green ring = open, red = covered. CROSS, SPIN, HESI and STEP BACK are dribble moves that can break ankles (step-back makes space for a jumper). Drive close and press SHOOT to lay it up or dunk. Pass to a cutter near the rim for an alley-oop.</p>' +
    '<p><b>Defense:</b> you guard whoever has the ball. CONTEST jumps at shooters. Once the shot goes up the button says BLOCK: hit it then for extra reach. STEAL pokes at the ball, but you can foul.</p>' +
    '<p><b>Hit 3 in a row</b> with the same player and he catches fire.</p>' +
    '<p><b>Keyboard (computer):</b> WASD or arrows move, Space shoot / contest / block, K pass to the open man, 1-5 pass to a teammate, E cross, F spin, R hesi, Q step-back, C behind the back, L or E steal on defense, P pause.</p><p><b>Bigs set screens</b> on your defender. Use the pick, then hit the big rolling to the rim.</p><p><b>Phone:</b> play it sideways.</p>' +
    '<p><b>Front office:</b> spend CC to train players and upgrade facilities. Keep the fans and the owner happy or you get fired.</p></div>');

  // ---------- new career ----------
  UI.newCareer = () => {
    let pick = null, len = 21;
    const o = { mode: 'full', qlen: 3, ppq: 3, diff: 1 };
    const tmp = { teams: CK.TEAMS };
    // preview league to show strengths
    let prev, strengths;
    const mk = () => { prev = L.newLeague({ team: 0 }); strengths = prev.teams.map(t => L.teamStars(t)); };
    mk();
    const draw = () => {
      const sel = pick != null ? prev.teams[pick] : null;
      app().innerHTML = '<div class="newc"><div class="ncl"><div class="nch2"><button class="btn alt sm" id="back">BACK</button><h2>PICK YOUR TEAM</h2></div><div class="tgrid">' +
        prev.teams.map((t, i) => '<button class="tpick ' + (pick === i ? 'sel' : '') + '" data-i="' + i + '" style="--c:' + t.c1 + ';--c2:' + t.c2 + '">' + (UI.logo(t, 'tlg') || '<b class="ab">' + t.ab + '</b>') + '<b>' + t.ab + '</b>' + UI.stars(strengths[i]) + '</button>').join('') + '</div></div>' +
        '<div class="ncr">' + (sel ? '<div class="selt" style="--c:' + sel.c1 + ';--c2:' + sel.c2 + '">' + (UI.logo(sel, 'big') || '') + '<div><small>' + U.esc(sel.city.toUpperCase()) + '</small><b>' + U.esc((sel.name || '').toUpperCase()) + '</b>' + UI.stars(strengths[pick]) + '</div></div>' : '<div class="selt none">TAP A TEAM</div>') +
        '<label class="fld">COACH NAME<input id="cname" maxlength="16" value="' + U.esc(UI._cn || 'Coach') + '"></label>' +
        UI.gameOpts(o) +
        '<div class="lbl">SEASON LENGTH</div><div class="seg" id="len">' + [10, 15, 21, 40, 82].map(n => '<button data-v="' + n + '" class="' + (len === n ? 'sel' : '') + '">' + n + '</button>').join('') + '</div>' +
        '<button class="btn big" id="go" ' + (pick == null ? 'disabled' : '') + '>' + (pick == null ? 'PICK A TEAM' : 'COACH ' + U.esc(prev.teams[pick].ab)) + '</button></div></div>';
      click('.tpick', el => { UI._cn = $('#cname').value; pick = +el.dataset.i; draw(); });
      UI.bindOpts(o, () => { UI._cn = $('#cname').value; draw(); });
      click('#len button', el => { UI._cn = $('#cname').value; len = +el.dataset.v; draw(); });
      click('#back', () => UI.title());
      click('#go', () => {
        if (pick == null) return;
        const coach = ($('#cname').value || 'Coach').trim().slice(0, 16);
        // keep the previewed league so the strengths shown are the real ones
        const S = CK.S; S.me = pick; S.coach = coach; S.diff = o.diff; S.len = len; S.ppq = o.ppq; S.mode = o.mode; S.qlen = o.qlen;
        L.makeSchedule(); S.inbox = []; L.inbox(/^coach$/i.test(coach) ? 'Welcome, Coach' : 'Welcome, Coach ' + coach, 'The owner hired you to bring a title to ' + L.myTeam().city + '. Win games to earn Coach Credits, keep the fans happy, and do not let the owner lose faith.');
        L.save(); UI.hub('home');
      });
    };
    draw();
  };

  // ---------- pixel icons (rows of '#' drawn as crisp squares) ----------
  const ICONS = {
    home: ['....##....', '...####...', '..######..', '.########.', '##########', '.##....##.', '.##.##.##.', '.##.##.##.', '.##.##.##.', '.########.'],
    roster: ['..##..##..', '.########.', '##########', '##.####.##', '...####...', '...#..#...', '...####...', '...####...', '...####...', '...####...'],
    league: ['##########', '##########', '.########.', '.########.', '..######..', '...####...', '....##....', '....##....', '..######..', '.########.'],
    trade: ['......#...', '......##..', '##########', '......##..', '......#...', '...#......', '..##......', '##########', '..##......', '...#......'],
    office: ['..######..', '..#.##.#..', '..######..', '..#.##.#..', '..######..', '..#.##.#..', '##########', '#.##..##.#', '#.##..##.#', '##########'],
    dumb: ['..........', '##......##', '##......##', '##########', '##########', '##......##', '##......##', '..........', '..........', '..........'],
    cross: ['...####...', '...####...', '...####...', '##########', '##########', '##########', '...####...', '...####...', '...####...', '..........'],
    arena: ['....##....', '..######..', '.########.', '##.#..#.##', '##########', '#.#.##.#.#', '##########', '##......##', '##......##', '##########'],
    film: ['##########', '#.#.##.#.#', '##########', '##......##', '##......##', '##......##', '##########', '#.#.##.#.#', '##########', '..........'],
    lock: ['##########', '#.##.##.##', '#.##.##.##', '##########', '##########', '#.##.##.##', '#.##.##.##', '#.##.##.##', '##########', '##########'],
    whistle: ['..........', '.######...', '########..', '#####..###', '#####..###', '########..', '.######...', '..........', '..........', '..........'],
    trophy: ['##########', '##########', '#.######.#', '#.######.#', '..######..', '...####...', '....##....', '....##....', '..######..', '.########.'],
    gear: ['...#..#...', '.########.', '.###..###.', '###....###', '.##....##.', '.##....##.', '###....###', '.###..###.', '.########.', '...#..#...']
  };
  const icon = (k, col) => { const r = ICONS[k] || []; let d = ''; r.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') d += 'M' + x + ' ' + y + 'h1v1h-1z'; }); return '<svg class="ico" viewBox="0 0 10 10" shape-rendering="crispEdges"><path d="' + d + '" fill="' + (col || 'currentColor') + '"/></svg>'; };
  UI.icon = icon;

  // ---------- hub: side rail + top bar, sized to one landscape screen ----------
  const TABS = [['home', 'HOME'], ['roster', 'ROSTER'], ['league', 'LEAGUE'], ['trade', 'TRADE'], ['office', 'OFFICE']];
  UI.hub = t => {
    tab = t || tab;
    const S = CK.S, me = L.myTeam();
    if (S.phase === 'review') return UI.review();
    if (S.phase === 'resign') return UI.resign();
    if (S.phase === 'draft') return UI.draft();
    if (S.phase === 'fa') return UI.fa();
    const unread = S.inbox.filter(m => !m.read).length;
    const chip = (n, v, col) => '<div class="chip"><span>' + n + '</span><div class="cbar"><i style="width:' + v + '%;background:' + col + '"></i></div><b>' + v + '</b></div>';
    app().innerHTML = '<div class="hub" style="--tc:' + me.c1 + ';--tc2:' + me.c2 + '">' +
      '<nav><div class="rlogo">' + (UI.logo(me, 'big') || '<b>' + me.ab + '</b>') + '</div>' +
      TABS.map(([k, n]) => '<button data-t="' + k + '" class="' + (tab === k ? 'sel' : '') + '">' + icon(k) + '<span>' + n + '</span>' + (k === 'home' && unread ? '<em>' + unread + '</em>' : '') + '</button>').join('') + '</nav>' +
      '<header><div class="tn"><b>' + U.esc((me.city + ' ' + (me.name || '')).toUpperCase()) + '</b><span>' + rec(me) + ' / ' + U.ord(L.seed(me)) + ' IN THE ' + (me.conf === 'E' ? 'EAST' : 'WEST') + ' / ' + S.season + '-' + String(S.season + 1).slice(2) + '</span></div>' +
      chip('FANS', S.fans, '#3dff6a') + chip('OWNER', S.owner, S.owner < 25 ? '#ff4d4d' : '#ffd23f') +
      '<div class="cc" title="Coach Credits"><i>CC</i><b>' + S.cc + '</b></div></header>' +
      '<main id="tab" class="t-' + tab + '"></main></div>';
    click('nav button', el => UI.hub(el.dataset.t));
    ({ home: tabHome, roster: tabRoster, league: tabLeague, trade: tabTrade, office: tabOffice })[tab]();
  };

  // schedule road: every game is a stop with the opponent's logo, like a road trip map
  function road() {
    const S = CK.S, me = L.myTeam(), stops = [];
    S.schedule.forEach((rd, i) => {
      const m = rd.find(x => x[0] === S.me || x[1] === S.me); if (!m) return;
      const home = m[0] === S.me, opp = L.T(home ? m[1] : m[0]), r = (S.results || {})[i];
      stops.push({ opp, home, r, i, cur: S.phase === 'season' && i === S.round, past: S.phase !== 'season' || i < S.round, lbl: 'G' + (i + 1) });
    });
    if (S.phase === 'playoffs') S.playoff.rounds.forEach((rd, i) => {
      const s = rd.find(x => x.a === S.me || x.b === S.me); if (!s) return;
      const home = s.a === S.me, opp = L.T(home ? s.b : s.a);
      stops.push({ opp, home, po: true, r: s.w != null ? { w: s.w === S.me, my: home ? s.hs : s.as, op: home ? s.as : s.hs } : null, cur: s.w == null, past: s.w != null, lbl: ['R1', 'SEMIS', 'CONF F', 'FINALS'][i] });
    });
    const goalN = stops.length;
    return '<div class="road"><div class="rtrack" id="rtrack"><div class="asph"></div>' + stops.map(st => {
      const res = st.r ? '<i class="' + (st.r.w ? 'w' : 'l') + '">' + (st.r.w ? 'W ' : 'L ') + st.r.my + '-' + st.r.op + '</i>' : st.cur ? '<i class="nx">NEXT</i>' : '<i class="g">' + st.lbl + '</i>';
      return '<div class="stop' + (st.cur ? ' cur' : '') + (st.past ? ' past' : '') + (st.po ? ' po' : '') + '" style="--c:' + st.opp.c1 + ';--c2:' + st.opp.c2 + '">' + res +
        '<div class="disc">' + (UI.logo(st.opp, 'rdl') || '<b>' + st.opp.ab + '</b>') + '</div><span>' + (st.home ? 'VS ' : '@ ') + st.opp.ab + '</span></div>';
    }).join('') + '<div class="stop end"><i class="g">' + (S.phase === 'playoffs' ? 'TITLE' : 'PLAYOFFS') + '</i><div class="disc tro">' + icon('trophy', '#ffd23f') + '</div><span>' + (goalN ? '' : '') + '</span></div></div></div>';
  }
  function tabHome() {
    const S = CK.S, me = L.myTeam(), g = L.myGame();
    let card = '';
    if (g) {
      const opp = L.T(g.home === S.me ? g.away : g.home), isHome = g.home === S.me;
      const label = S.phase === 'playoffs' ? L.ROUND_NAMES[S.playoff.r] : 'GAME ' + (S.round + 1) + ' OF ' + S.len;
      const side = (t, tag) => '<div class="side" style="--c:' + t.c1 + ';--c2:' + t.c2 + '">' + (UI.logo(t, 'big') || '<b class="ab">' + t.ab + '</b>') + '<div><small>' + tag + '</small><b>' + U.esc((t.name || t.city).toUpperCase()) + '</b><span>' + rec(t) + '</span>' + UI.stars(L.teamStars(t)) + '</div></div>';
      card = '<div class="mcard"><div class="mlbl">' + label + '<span>' + (isHome ? 'HOME' : 'AWAY') + '</span></div><div class="mu2">' + side(me, 'YOU') + '<i>VS</i>' + side(opp, isHome ? 'VISITORS' : 'HOME') + '</div>' +
        '<div class="mbtns"><button class="btn big" id="play">PLAY GAME</button><button class="btn alt" id="sim">SIM<small>fewer CC</small></button>' + (S.phase === 'playoffs' ? '<button class="btn alt" id="brk">' + icon('league') + '</button>' : '') + '</div></div>';
    } else if (S.phase === 'playoffs') {
      card = '<div class="mcard"><div class="mlbl">PLAYOFFS<span>' + (L.myTeam() && S.playoff.champ == null ? 'OUT' : '') + '</span></div><p class="dim">Your season is over. The bracket keeps going without you.</p><div class="mbtns"><button class="btn big" id="simpo">SIM REST OF PLAYOFFS</button><button class="btn alt" id="brk">BRACKET</button></div></div>';
    }
    const goal = CK.FO.goal(), gp = Math.min(100, Math.round(me.w / goal * 100));
    let side = '<div class="goal"><span>OWNER GOAL</span><b>' + goal + '+ WINS</b><div class="cbar"><i style="width:' + gp + '%;background:' + (me.w >= goal ? '#3dff6a' : '#ffd23f') + '"></i></div><small>' + me.w + ' / ' + goal + (S.promise === S.season ? ' / YOU PROMISED THE PLAYOFFS' : '') + '</small></div>';
    if (S.lastRes && S.lastRes.season === S.season) {
      const r = S.lastRes, hT = L.T(r.home), aT = L.T(r.away);
      side += '<div class="last ' + (r.won ? 'w' : 'l') + '"><b>' + (r.won ? 'W' : 'L') + '</b> ' + aT.ab + ' ' + r.as + ' - ' + r.hs + ' ' + hT.ab + ' <span>+' + r.cc + ' CC</span></div>';
    }
    side += '<div class="lbl">NEWS</div><div class="inbox">' + (S.inbox.length ? S.inbox.slice(0, 12).map(m => '<div class="msg ' + (m.read ? '' : 'new') + (m.choices ? ' ask' : '') + '" data-id="' + m.id + '"><b>' + U.esc(m.title) + '</b></div>').join('') : '<p class="dim">Nothing yet.</p>') + '</div>';
    $('#tab').innerHTML = road() + '<div class="hrow">' + card + '<div class="hside">' + side + '</div></div>';
    const tr = $('#rtrack'), cur = tr && tr.querySelector('.stop.cur') || (tr && tr.querySelector('.stop.end'));
    if (cur) tr.scrollLeft = cur.offsetLeft - tr.clientWidth / 2 + cur.offsetWidth / 2;
    if (g) { click('#play', () => startGame(g, false)); click('#sim', () => startGame(g, true)); }
    click('#simpo', () => { L.simRestOfPlayoffs(); L.save(); UI.hub('home'); });
    click('#brk', () => UI.bracket());
    click('.msg', el => openMsg(S.inbox.find(m => m.id === el.dataset.id)));
    if (S.inbox.some(m => m.fresh)) setTimeout(UI.news, 250);
  }

  // ---------- news cards: after-game dilemmas, good/bad news, injuries, trade offers ----------
  const KIND = { locker: ['LOCKER ROOM', '#3d8bff'], media: ['MEDIA', '#b06bff'], office: ['FRONT OFFICE', '#ffd23f'], inj: ['INJURY REPORT', '#ff4d4d'], trade: ['TRADE OFFER', '#22c3c3'], good: ['GOOD NEWS', '#3dff6a'], bad: ['BAD NEWS', '#ff7a4d'] };
  function cardHtml(m) {
    const S = CK.S, k = KIND[m.kind] || ['NEWS', '#8a90b8'], me = L.myTeam();
    const pid = m.choices && m.choices[0] && m.choices[0].pid;
    const p = pid ? L.P(pid) : null;
    let art = '';
    if (m.kind === 'trade' && m.x) {
      const give = L.P(m.x.give), get = L.P(m.x.get), t = L.T(m.x.tid);
      const pc = (q, tm, tag) => q ? '<div class="tpc"><small>' + tag + '</small>' + UI.portrait(q, tm, 56) + '<b>' + U.esc(L.short(q).toUpperCase()) + '</b>' + UI.posBadge(q.pos) + UI.stars(L.stars(q)) + '<span>' + q.age + ' YRS / ' + U.money(q.sal) + '</span></div>' : '';
      art = '<div class="tart">' + pc(give, me, 'YOU GIVE') + '<i>' + icon('trade') + '</i>' + pc(get, t, 'YOU GET') + '</div>';
    } else if (p) art = '<div class="nart">' + UI.portrait(p, p.tm >= 0 ? L.T(p.tm) : null, 64) + '<div><b>' + U.esc(L.name(p).toUpperCase()) + '</b>' + UI.posBadge(p.pos) + UI.stars(L.stars(p)) + (p.inj ? '<em class="inj">OUT ' + p.inj + '</em>' : '') + '</div></div>';
    return '<div class="ncard" style="--k:' + k[1] + '"><div class="nk">' + k[0] + '</div><h3>' + U.esc(m.title.toUpperCase()) + '</h3>' + art + '<p>' + U.esc(m.body) + '</p>' +
      (m.choices ? '<div class="nch">' + m.choices.map((c, i) => '<button class="btn ' + (i ? 'alt' : '') + '" data-c="' + i + '">' + U.esc(c.label) + '</button>').join('') + '</div>' : '<div class="nres">' + U.esc(m.answered || '') + '</div><button class="btn" data-ok="1">OK</button>') + '</div>';
  }
  UI.news = () => {
    const S = CK.S, list = S.inbox.filter(m => m.fresh).reverse();
    const m = list[0]; if (!m) return;
    m.fresh = false; m.read = !m.choices ? true : m.read; L.save();
    UI.modal(cardHtml(m), mm => {
      mm.querySelector('.card').classList.add('nc');
      const nx = () => { UI.closeModal(); UI.hub(); };
      mm.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { m.read = true; CK.EV.choose(m, +b.dataset.c); CK.SFX.play('click'); UI.toast(m.answered); nx(); });
      const ok = mm.querySelector('[data-ok]'); if (ok) ok.onclick = nx;
    });
  };
  function openMsg(m) {
    m.read = true; m.fresh = false; L.save();
    if (m.kind) {
      UI.modal(cardHtml(m), mm => {
        mm.querySelector('.card').classList.add('nc');
        mm.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { CK.EV.choose(m, +b.dataset.c); UI.closeModal(); UI.toast(m.answered); UI.hub(); });
        const ok = mm.querySelector('[data-ok]'); if (ok) ok.onclick = () => { UI.closeModal(); UI.hub(); };
      });
    } else UI.modal('<h2>' + U.esc(m.title) + '</h2><p class="mbody">' + U.esc(m.body) + '</p>' + (m.choices ? m.choices.map((c, i) => '<button class="btn alt" data-c="' + i + '">' + U.esc(c.label) + '</button>').join('') : m.answered ? '<p class="ans">You chose: ' + U.esc(m.answered) + '</p>' : ''), mm => {
      mm.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { CK.EV.choose(m, +b.dataset.c); UI.closeModal(); UI.toast(m.answered); UI.hub(); });
    });
    const em = document.querySelector('nav em'); if (em) { const n = CK.S.inbox.filter(x => !x.read).length; n ? em.textContent = n : em.remove(); }
  }
  function startGame(gm, sim) {
    const S = CK.S;
    const label = S.phase === 'playoffs' ? L.ROUND_NAMES[S.playoff.r] : 'GAME ' + (S.round + 1);
    const rnd = S.round, inSeason = S.phase === 'season';
    const done = res => {
      if (inSeason) { S.results = S.results || {}; S.results[rnd] = { w: res.won, my: gm.home === S.me ? res.hs : res.as, op: gm.home === S.me ? res.as : res.hs }; }
      L.finishRound(res); L.save();
      UI.hub('home');
    };
    const opts = { home: gm.home, away: gm.away, po: !!gm.po, label };
    if (sim) CK.M.simGame(opts, done); else { app().innerHTML = ''; CK.M.start(opts, done); }
  }

  // ---------- playoff bracket: East on the left, West on the right, Finals in the middle ----------
  UI.bracket = () => {
    const S = CK.S, pl = S.playoff; if (!pl) return;
    const R = pl.rounds, at = (r, i) => (R[r] || [])[i];
    const seedOf = id => { const t = L.T(id); return L.standings(t.conf).indexOf(t) + 1; };
    const box = s => {
      if (!s) return '<div class="bx tbd"><div><span>TBD</span></div><div><span>TBD</span></div></div>';
      const row = (id, sc) => { const t = L.T(id); return '<div class="' + (s.w === id ? 'w' : s.w != null ? 'l' : '') + (id === S.me ? ' me' : '') + '" style="--c:' + t.c1 + '"><i>' + seedOf(id) + '</i>' + (UI.logo(t, 'sm') || '') + '<span>' + t.ab + '</span>' + (sc != null ? '<b>' + sc + '</b>' : '') + '</div>'; };
      return '<div class="bx">' + row(s.a, s.hs) + row(s.b, s.as) + '</div>';
    };
    const pair = (x, y, side) => '<div class="pair ' + side + '">' + box(x) + box(y) + '</div>';
    const col = (cls, inner, name) => '<div class="bc ' + cls + '"><div class="bn">' + name + '</div><div class="bcin">' + inner + '</div></div>';
    const champ = pl.champ != null ? L.T(pl.champ) : null;
    app().innerHTML = '<div class="bpage"><div class="bhead"><button class="btn alt sm" id="bback">BACK</button><h2>' + S.season + ' PLAYOFFS</h2><span>EVERY ROUND IS ONE GAME</span></div><div class="brk2">' +
      col('e', pair(at(0, 0), at(0, 1), 'l') + pair(at(0, 2), at(0, 3), 'l'), 'FIRST ROUND') +
      col('e', pair(at(1, 0), at(1, 1), 'l'), 'SEMIS') +
      col('e', '<div class="one l">' + box(at(2, 0)) + '</div>', 'EAST FINAL') +
      '<div class="bc fin"><div class="bn">THE FINALS</div><div class="bcin"><div class="trophy">' + icon('trophy', '#ffd23f') + '</div><div class="one">' + box(at(3, 0)) + '</div>' +
      (champ ? '<div class="chmp" style="--c:' + champ.c1 + '">' + (UI.logo(champ, 'big') || '') + '<b>' + champ.ab + '</b><span>CHAMPIONS</span></div>' : '') + '</div></div>' +
      col('w', '<div class="one r">' + box(at(2, 1)) + '</div>', 'WEST FINAL') +
      col('w', pair(at(1, 2), at(1, 3), 'r'), 'SEMIS') +
      col('w', pair(at(0, 4), at(0, 5), 'r') + pair(at(0, 6), at(0, 7), 'r'), 'FIRST ROUND') +
      '</div><div class="blab"><span>EAST</span><span>WEST</span></div></div>';
    click('#bback', () => UI.hub('home'));
  };

  // ---------- roster ----------
  // Retro Bowl style roster: one clean table, position badge, face, name, stars, age, contract
  const POSC = { PG: '#3d8bff', SG: '#22c3c3', SF: '#3dc45a', PF: '#f0a020', C: '#e5484d' };
  UI.posBadge = (pos, big) => '<span class="posb' + (big ? ' big' : '') + '" style="--pc:' + (POSC[pos] || '#888') + '">' + pos + '</span>';
  let rsort = 'depth';
  function tabRoster() {
    const S = CK.S, me = L.myTeam();
    const by = { depth: (a, b) => (me.start.includes(b.id) - me.start.includes(a.id)) || CK.POS.indexOf(a.pos) - CK.POS.indexOf(b.pos) || L.ovr(b) - L.ovr(a),
      ovr: (a, b) => L.ovr(b) - L.ovr(a), age: (a, b) => a.age - b.age, sal: (a, b) => b.sal - a.sal };
    const ro = L.roster(me).sort(by[rsort]);
    const pay = L.payroll(me);
    const row = p => { const st = me.start.includes(p.id), gp = Math.max(1, p.st.gp);
      return '<div class="rbr' + (st ? ' on5' : '') + '" data-id="' + p.id + '">' + UI.posBadge(p.pos) + UI.portrait(p, me, 34) +
        '<div class="rbn"><b>' + U.esc(L.short(p).toUpperCase()) + (p.inj ? ' <em class="inj">OUT ' + p.inj + '</em>' : '') + '</b><span>#' + p.num + (p.st.gp ? ' / ' + (p.st.pts / gp).toFixed(1) + ' PPG' : '') + (st ? ' / STARTER' : '') + '</span></div>' +
        '<div class="rbs">' + UI.stars(L.stars(p)) + '</div><div class="rba">' + p.age + '</div><div class="rbc">' + U.money(p.sal) + '<small>' + Math.max(0, p.yrs) + ' YR</small></div></div>'; };
    $('#tab').innerHTML = '<div class="rhead"><span>' + me.roster.length + '/' + CK.ROSTER_MAX + ' PLAYERS</span><span class="' + (pay > CK.CAP ? 'bad' : '') + '">PAYROLL ' + U.money(pay) + ' / ' + U.money(CK.CAP) + '</span></div>' +
      '<div class="seg rsort">' + [['depth', 'LINEUP'], ['ovr', 'RATING'], ['age', 'AGE'], ['sal', 'SALARY']].map(([k, n]) => '<button data-v="' + k + '" class="' + (rsort === k ? 'sel' : '') + '">' + n + '</button>').join('') + '</div>' +
      '<div class="rbt" style="--tc:' + me.c1 + '"><div class="rbh"><span>POS</span><span></span><span>PLAYER</span><span>RATING</span><span class="rba">AGE</span><span class="rbc">CONTRACT</span></div>' +
      (rsort === 'depth' ? '<div class="rbg">STARTING FIVE</div>' + ro.slice(0, 5).map(row).join('') + '<div class="rbg">BENCH</div>' + ro.slice(5).map(row).join('') : ro.map(row).join('')) +
      '</div><div class="hint">Tap a player to see his card, train him, start him or release him.</div>';
    click('.rsort button', el => { rsort = el.dataset.v; tabRoster(); });
    click('.rbr', el => UI.player(L.P(el.dataset.id)));
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
    const html = '<div class="pcard2" style="--c:' + (t ? t.c1 : '#444') + ';--c2:' + (t ? t.c2 : '#888') + '">' +
      '<div class="pcf"><div class="pct">' + UI.posBadge(p.pos, true) + '<span class="pcn">#' + p.num + '</span>' + (t ? UI.logo(t, 'sm') : '') + '</div>' +
      '<div class="pcp">' + UI.portrait(p, t, 96) + '</div>' +
      '<div class="pcname"><small>' + U.esc((p.fn || '').toUpperCase()) + '</small><b>' + U.esc(p.ln.toUpperCase()) + '</b></div>' +
      '<div class="pcs">' + UI.stars(L.stars(p)) + '</div></div>' +
      '<div class="pci"><div class="pcrow"><span>TEAM</span><b>' + (t ? U.esc(t.city.toUpperCase()) : 'FREE AGENT') + '</b></div>' +
      '<div class="pcrow"><span>POSITION</span><b>' + ({ PG: 'POINT GUARD', SG: 'SHOOTING GUARD', SF: 'SMALL FORWARD', PF: 'POWER FORWARD', C: 'CENTER' }[p.pos] || p.pos) + '</b></div>' +
      '<div class="pcrow"><span>HEIGHT</span><b>' + Math.floor(p.ht / 12) + "'" + (p.ht % 12) + '"</b></div>' +
      '<div class="pcrow"><span>AGE</span><b>' + p.age + '</b></div>' +
      '<div class="pcrow"><span>OVERALL</span><b class="ovr">' + L.ovr(p).toFixed(1) + '</b></div>' +
      '<div class="pcrow"><span>SEASON</span><b>' + (p.st.gp ? (p.st.pts / gp).toFixed(1) + ' PTS ' + (p.st.reb / gp).toFixed(1) + ' REB ' + (p.st.ast / gp).toFixed(1) + ' AST' : 'NO GAMES YET') + '</b></div></div></div>' +
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
    let h = '<div class="seg" id="lv">' + [['stand', 'STANDINGS'], ['lead', 'LEADERS'], ['hist', 'HISTORY']].concat(S.playoff ? [['brk', 'BRACKET']] : []).map(([k, n]) => '<button data-v="' + k + '" class="' + (lgView === k ? 'sel' : '') + '">' + n + '</button>').join('') + '</div>';
    if (lgView === 'brk') { lgView = 'stand'; return UI.bracket(); }
    if (lgView === 'stand') {
      h += '<div class="lcols">';
      ['E', 'W'].forEach(c => {
        h += '<div class="lbl">' + (c === 'E' ? 'EAST' : 'WEST') + '</div><table class="stand"><tr><th>#</th><th>TEAM</th><th>W-L</th><th>DIFF</th><th>STRK</th></tr>' +
          L.standings(c).map((t, i) => '<tr class="' + (t.id === S.me ? 'me' : '') + (i === 7 ? ' cut' : '') + '" data-t="' + t.id + '"><td>' + (i + 1) + '</td><td>' + teamTag(t) + ' ' + U.esc(t.city) + '</td><td>' + rec(t) + '</td><td>' + (t.pf - t.pa > 0 ? '+' : '') + (t.pf - t.pa) + '</td><td>' + (t.strk > 0 ? 'W' + t.strk : t.strk < 0 ? 'L' + -t.strk : '-') + '</td></tr>').join('') + '</table>';
      });
      h = h.replace(/<div class="lbl">(EAST|WEST)<\/div>/g, '<div class="lc"><div class="lbl">$1</div>').replace(/<\/table>/g, '</table></div>') + '</div>';
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

  // ---------- trade: pick a team on the left, tap players to swap, meter shows if they say yes ----------
  let tr = { tid: null, give: [], get: [] };
  function tabTrade() {
    const S = CK.S, me = L.myTeam();
    if (S.phase !== 'season' || S.deadline) { $('#tab').innerHTML = '<div class="closed">' + icon('trade') + '<b>TRADES CLOSED</b><p>' + (S.deadline ? 'The trade deadline has passed. Trades open again next season.' : 'No trades during the playoffs.') + '</p></div>'; return; }
    if (tr.tid == null || tr.tid === S.me) tr.tid = (S.me + 1) % 30;
    const them = L.T(tr.tid);
    tr.give = tr.give.filter(id => me.roster.includes(id)); tr.get = tr.get.filter(id => them.roster.includes(id));
    const give = tr.give.map(L.P), get = tr.get.map(L.P);
    const ev = O.evalTrade(give, get, them.id);
    const col = ev.pct >= 100 ? '#3dff6a' : ev.pct >= 70 ? '#ffd23f' : '#ff4d4d';
    const dl = Math.max(0, Math.floor(S.len * 0.6) - S.round);
    const row = (p, t, sel, side) => '<div class="tp2 ' + (sel ? 'sel' : '') + (p.inj ? ' hurt' : '') + '" data-id="' + p.id + '" data-s="' + side + '">' + UI.posBadge(p.pos) + UI.portrait(p, t, 26) + '<div class="tpn"><b>' + U.esc(L.short(p).toUpperCase()) + '</b><span>' + p.age + ' YRS / ' + U.money(p.sal) + ' x' + Math.max(0, p.yrs) + (p.inj ? ' / OUT ' + p.inj : '') + '</span></div>' + UI.stars(L.stars(p)) + '</div>';
    $('#tab').innerHTML = '<div class="trade2">' +
      '<div class="tteams">' + S.teams.filter(t => t.id !== S.me).map(t => '<button class="tt2 ' + (t.id === them.id ? 'sel' : '') + '" data-t="' + t.id + '" style="--c:' + t.c1 + '">' + (UI.logo(t, 'sm') || '') + '<b>' + t.ab + '</b><small>' + rec(t) + '</small></button>').join('') + '</div>' +
      '<div class="tcol"><div class="th" style="--c:' + them.c1 + '">' + (UI.logo(them, 'sm') || '') + 'YOU GET <small>' + U.esc((them.name || them.city).toUpperCase()) + '</small></div><div class="tl">' + L.roster(them).sort((a, b) => L.ovr(b) - L.ovr(a)).map(p => row(p, them, tr.get.includes(p.id), 'get')).join('') + '</div></div>' +
      '<div class="tcol"><div class="th" style="--c:' + me.c1 + '">' + (UI.logo(me, 'sm') || '') + 'YOU GIVE <small>' + U.esc((me.name || me.city).toUpperCase()) + '</small></div><div class="tl">' + L.roster(me).sort((a, b) => L.ovr(b) - L.ovr(a)).map(p => row(p, me, tr.give.includes(p.id), 'give')).join('') + '</div></div>' +
      '<div class="tdeal"><div class="tm2"><span>WILL THEY ACCEPT?</span><div class="cbar big"><i style="width:' + ev.pct + '%;background:' + col + '"></i></div><b style="color:' + col + '">' + ev.pct + '%</b></div>' +
      '<div class="terr">' + (ev.err && (give.length || get.length) ? ev.err : give.length || get.length ? (ev.ok ? 'They like it.' : 'Add more value or take less.') : 'Tap players on both sides. Up to 3 each.') + '</div>' +
      '<button class="btn" id="prop" ' + (ev.ok ? '' : 'disabled') + '>PROPOSE</button><small class="dl">' + (dl ? 'DEADLINE IN ' + dl + ' GAME' + (dl > 1 ? 'S' : '') : 'LAST GAME BEFORE THE DEADLINE') + '</small></div></div>';
    const sel = $('.tt2.sel'); if (sel) sel.scrollIntoView({ block: 'nearest' });
    click('.tt2', el => { tr = { tid: +el.dataset.t, give: tr.give, get: [] }; tabTrade(); });
    click('.tp2', el => { const arr = tr[el.dataset.s]; const i = arr.indexOf(el.dataset.id); if (i >= 0) arr.splice(i, 1); else if (arr.length < 3) arr.push(el.dataset.id); tabTrade(); });
    click('#prop', () => {
      if (!ev.ok) return;
      O.doTrade(give, get, them.id); tr.give = []; tr.get = []; L.save(); CK.SFX.play('cheer'); UI.toast('Trade done!'); UI.hub('roster');
    });
  }

  // ---------- front office: facilities, staff, how to earn CC, settings ----------
  let foView = 'fac';
  function tabOffice() {
    const S = CK.S, FO = CK.FO;
    let h = '<div class="seg fov">' + [['fac', 'FACILITIES'], ['staff', 'COACHING STAFF'], ['earn', 'EARN CC'], ['set', 'SETTINGS']].map(([k, n]) => '<button data-v="' + k + '" class="' + (foView === k ? 'sel' : '') + '">' + n + '</button>').join('') + '</div>';
    if (foView === 'fac') {
      h += '<div class="facs">' + FO.KEYS.map(k => {
        const f = FO.FAC[k], lv = S.fac[k], c = FO.cost(k);
        return '<div class="fac2' + (lv >= 5 ? ' max' : '') + '">' + '<div class="fi">' + icon(f.icon, lv >= 5 ? '#ffd23f' : '#e9ecff') + '</div><b>' + f.name + '</b><div class="lv">' + [1, 2, 3, 4, 5].map(i => '<i class="' + (i <= lv ? 'on' : '') + '"></i>').join('') + '</div>' +
          '<p>' + (lv >= 5 ? f.fx(lv) : '<em class="nxl">NEXT LEVEL</em>' + f.fx(lv + 1)) + '</p>' + (lv >= 5 ? '<span class="mx">MAXED</span>' : '<button class="btn sm ' + (S.cc < c ? 'no' : '') + '" data-k="' + k + '">UPGRADE<small>' + c + ' CC</small></button>') + '</div>';
      }).join('') + '</div>';
    } else if (foView === 'staff') {
      const role = (r, name, what) => {
        const cur = S.staff[r];
        return '<div class="staff"><div class="scur">' + icon('whistle', '#ffd23f') + '<div><small>' + name + '</small><b>' + U.esc(cur.n.toUpperCase()) + '</b>' + UI.stars(cur.s) + '<span>' + what + '</span></div></div>' +
          '<div class="spool">' + S.pool[r].map((c, i) => '<div class="cand"><b>' + U.esc(c.n) + '</b>' + UI.stars(c.s) + '<button class="btn sm ' + (c.s <= cur.s ? 'alt' : '') + '" data-r="' + r + '" data-i="' + i + '">HIRE<small>' + FO.staffCost(c.s) + ' CC</small></button></div>').join('') + (S.pool[r].length ? '' : '<p class="dim">New coaches show up next season.</p>') + '</div></div>';
      };
      h += '<div class="staffs">' + role('oc', 'OFFENSIVE COACH', 'Your team shoots better and scores more in sims.') + role('dc', 'DEFENSIVE COACH', 'The other team shoots worse against you.') + '</div>';
    } else if (foView === 'earn') {
      const rows = [['WIN A GAME', '+3'], ['LOSE A GAME', '+1'], ['HOME CROWD', 'FANS + ARENA'], ['HIGHLIGHTS (DUNKS, SPLASH 3S, BLOCKS)', 'UP TO +3'], ['PERFECT RELEASES (GREEN)', 'UP TO +2'], ['BLOWOUT WIN (15+)', '+1'], ['CLUTCH WIN (3 OR LESS)', '+1'], ['HOLD THEM UNDER 96', '+1'], ['30-POINT NIGHT', '+1'], ['WIN STREAK 3 / 5 / 8 / 12', '+2'], ['PLAYOFF WIN', '+4'], ['MAKE THE PLAYOFFS / WIN THE TITLE', '+6 / +20'], ['SOME DILEMMAS + SPONSORS', 'VARIES']];
      h += '<div class="earn2"><div class="eh"><b>' + S.cc + '</b><span>COACH CREDITS TO SPEND</span><small>' + (S.ccLife || 0) + ' EARNED IN YOUR CAREER</small></div><div class="el">' + rows.map(r => '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join('') + '</div><p class="dim">Simmed games pay 60%. Long seasons pay less per game so it evens out. Spend CC on facilities, coaches, and training players (tap a player on your roster).</p></div>';
    } else {
      h += '<div class="sets">' +
        '<div class="setrow">DIFFICULTY<div class="seg" id="sdif">' + ['ROOKIE', 'PRO', 'ALL-STAR', 'LEGEND'].map((n, i) => '<button data-v="' + i + '" class="' + (S.diff === i ? 'sel' : '') + '">' + n + '</button>').join('') + '</div></div>' +
        '<div class="setrow">GAME MODE<div class="seg" id="smode"><button data-v="full" class="' + (S.mode !== 'highlights' ? 'sel' : '') + '">FULL GAME</button><button data-v="highlights" class="' + (S.mode === 'highlights' ? 'sel' : '') + '">HIGHLIGHTS + SIMS</button></div></div>' +
        (S.mode !== 'highlights' ? '<div class="setrow">QUARTER LENGTH<div class="seg" id="sqlen">' + QLENS.map(n => '<button data-v="' + n + '" class="' + ((S.qlen || 3) === n ? 'sel' : '') + '">' + n + ' MIN</button>').join('') + '</div></div>'
          : '<div class="setrow">POSSESSIONS PER QUARTER<div class="seg" id="sppq">' + [2, 3, 4, 5].map(n => '<button data-v="' + n + '" class="' + (S.ppq === n ? 'sel' : '') + '">' + n + '</button>').join('') + '</div></div>') +
        '<div class="setrow">TEAM LOGOS<div class="seg" id="slg"><button data-v="real" class="' + (S.logos !== 'retro' ? 'sel' : '') + '">REAL</button><button data-v="retro" class="' + (S.logos === 'retro' ? 'sel' : '') + '">RETRO LETTERS</button></div></div>' +
        '<div class="setrow">SOUND<div class="seg" id="ssnd"><button data-v="1" class="' + (CK.SFX.on ? 'sel' : '') + '">ON</button><button data-v="0" class="' + (!CK.SFX.on ? 'sel' : '') + '">OFF</button></div></div>' +
        '<div class="setbtns"><button class="btn alt sm" id="howb">HOW TO PLAY</button><button class="btn alt sm" id="quit">TITLE SCREEN</button></div>' +
        '<p class="dim">Coach ' + U.esc(S.coach) + ' / career ' + S.totW + '-' + S.totL + ' / v' + CK.VER + ' / saves on this device</p></div>';
    }
    $('#tab').innerHTML = h;
    click('.fov button', el => { foView = el.dataset.v; tabOffice(); });
    click('.fac2 .btn', el => { const err = O.upgrade(el.dataset.k); if (err) return UI.toast(err, true); CK.SFX.play('cheer'); L.save(); UI.hub('office'); UI.toast(FO.FAC[el.dataset.k].name + ' LEVEL ' + S.fac[el.dataset.k]); });
    click('.cand .btn', el => { const err = FO.hire(el.dataset.r, +el.dataset.i); if (err) return UI.toast(err, true); CK.SFX.play('cheer'); L.save(); UI.hub('office'); UI.toast('Coach hired!'); });
    click('#sdif button', el => { S.diff = +el.dataset.v; L.save(); UI.hub('office'); });
    click('#sppq button', el => { S.ppq = +el.dataset.v; L.save(); UI.hub('office'); });
    click('#smode button', el => { S.mode = el.dataset.v; L.save(); UI.hub('office'); });
    click('#sqlen button', el => { S.qlen = +el.dataset.v; L.save(); UI.hub('office'); });
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
