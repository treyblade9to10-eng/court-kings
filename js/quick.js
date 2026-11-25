// Court Kings - Play Now (quick game) and Play Now Online
(function (CK) {
  const U = CK.U, L = CK.L, UI = CK.UI;
  const $ = s => document.querySelector(s);
  const app = () => $('#app');
  const click = (sel, fn) => document.querySelectorAll(sel).forEach(el => el.addEventListener('click', e => { CK.SFX.init(); CK.SFX.play('click'); fn(el, e); }));
  // team info for the matchup cards (stars, offense/defense, two best players), built once from a throwaway league
  let info = null;
  const getInfo = () => {
    if (info) return info;
    const r = UI.tempLeague(0), S = CK.S;
    const raw = S.teams.map(t => ({ stars: L.teamStars(t), off: L.offRating(t), def: L.defRating(t), top: L.roster(t).sort((a, b) => L.ovr(b) - L.ovr(a)).slice(0, 2).map(p => ({ n: L.short(p).toUpperCase(), pos: p.pos, st: L.stars(p) })) }));
    const rng = k => { const v = raw.map(x => x[k]); return [Math.min(...v), Math.max(...v)]; };
    const [o0, o1] = rng('off'), [d0, d1] = rng('def');
    raw.forEach(x => { x.offN = Math.round(62 + (x.off - o0) / (o1 - o0 || 1) * 35); x.defN = Math.round(62 + (x.def - d0) / (d1 - d0 || 1) * 35); });
    r(); info = raw; return info;
  };
  const T = i => { const d = CK.TEAMS[i]; return { id: i, ab: d[0], city: d[1], c1: d[2], c2: d[3], conf: d[4], name: d[5], logo: d[6] }; };

  // ---------- matchup card (like Bobble Bowl): arrows flip teams, tap = every team, swipe works too ----------
  const muCard = (i, side, tag, keyUp, keyDn) => {
    const t = T(i), f = getInfo()[i];
    const bar = (k, v) => '<div class="pnb"><span>' + k + '</span><i><u style="width:' + Math.round((v - 55) / 44 * 100) + '%"></u></i><b>' + v + '</b></div>';
    return '<div class="pnc" data-side="' + side + '" style="--c:' + t.c1 + ';--c2:' + t.c2 + '">' +
      '<div class="pntag ' + (tag === 'YOU' ? 'you' : '') + '">' + tag + '</div>' +
      '<button class="pnar up" data-side="' + side + '" data-d="-1">' + (keyUp ? '<em>' + keyUp + '</em>' : '') + '&#9650;</button><button class="pnar dn" data-side="' + side + '" data-d="1">&#9660;' + (keyDn ? '<em>' + keyDn + '</em>' : '') + '</button>' +
      '<div class="pnbody" data-side="' + side + '"><div class="pnlogo">' + (UI.logo(t, 'pnl') || '<b class="ab">' + t.ab + '</b>') + '</div>' +
      '<div class="pncity">' + U.esc(t.city.toUpperCase()) + '</div><div class="pnname">' + U.esc(t.name.toUpperCase()) + '</div>' + UI.stars(f.stars) +
      '<div class="pnbars">' + bar('OFF', f.offN) + bar('DEF', f.defN) + '</div>' +
      '<div class="pnpl">' + f.top.map(p => '<div><span class="pp">' + p.pos + '</span><span class="pn2">' + U.esc(p.n) + '</span>' + UI.stars(p.st) + '</div>').join('') + '</div></div>' +
      '<div class="pnfoot"><button class="pnall" data-side="' + side + '">ALL TEAMS</button><span>' + (i + 1) + ' / 30</span></div></div>';
  };
  // every team at once, East | West
  const teamGrid = (cur, other, title, pick) => {
    const ov = document.createElement('div'); ov.className = 'pngrid';
    const tile = i => { const t = T(i); return '<button class="pgt' + (i === cur ? ' cur' : '') + (i === other ? ' opp' : '') + '" data-i="' + i + '" style="--c:' + t.c1 + ';--c2:' + t.c2 + '">' + (UI.logo(t, 'tlg') || '<b class="ab">' + t.ab + '</b>') + '<b>' + t.ab + '</b>' + UI.stars(getInfo()[i].stars) + (i === other ? '<em>OPPONENT</em>' : '') + '</button>'; };
    const conf = c => CK.TEAMS.map((d, i) => i).filter(i => CK.TEAMS[i][4] === c);
    ov.innerHTML = '<div class="pgh"><b>' + title + '</b><button class="btn alt sm" id="pgx">CLOSE</button></div><div class="pgc"><div><div class="lbl">EAST</div><div class="pgg">' + conf('E').map(tile).join('') + '</div></div><div><div class="lbl">WEST</div><div class="pgg">' + conf('W').map(tile).join('') + '</div></div></div>';
    document.body.appendChild(ov);
    ov.querySelector('#pgx').onclick = () => { CK.SFX.play('click'); ov.remove(); };
    ov.querySelectorAll('.pgt').forEach(b => b.onclick = () => { CK.SFX.play('click'); ov.remove(); pick(+b.dataset.i); });
  };
  const bindCards = (o, sides, redraw) => {
    const flip = (side, d) => { const other = sides.find(k => k !== side); let i = o[side]; do { i = (i + d + 30) % 30; } while (other && i === o[other]); o[side] = i; CK.SFX.play('click'); redraw(side); };
    document.querySelectorAll('.pnar').forEach(b => b.onclick = e => { e.stopPropagation(); flip(b.dataset.side, +b.dataset.d); });
    const openGrid = side => { const other = sides.find(k => k !== side); teamGrid(o[side], other ? o[other] : -1, side === 'me' ? 'PICK YOUR TEAM' : 'PICK THE CPU TEAM', i => { if (other && i === o[other]) o[other] = o[side]; o[side] = i; redraw(side); }); };
    document.querySelectorAll('.pnall').forEach(b => b.onclick = e => { e.stopPropagation(); CK.SFX.play('click'); openGrid(b.dataset.side); });
    document.querySelectorAll('.pnbody').forEach(el => {
      const side = el.dataset.side; let x0 = null, y0 = 0, sw = false;
      el.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; sw = false; });
      el.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { sw = true; flip(side, dx < 0 ? 1 : -1); } });
      el.addEventListener('click', () => { if (sw) { sw = false; return; } CK.SFX.play('click'); openGrid(side); });
      el.addEventListener('wheel', e => { e.preventDefault(); flip(side, e.deltaY > 0 ? 1 : -1); }, { passive: false });
    });
    return flip;
  };

  // ---------- play now ----------
  const pn = Object.assign({ mode: 'full', qlen: 3, ppq: 3, diff: 1, me: 16, opp: 13 }, U.load('ck_pn', {}));
  const DIFF = ['ROOKIE', 'PRO', 'ALL-STAR', 'LEGEND'];
  let pnKey = null;
  UI.playNow = () => {
    const o = pn;
    const draw = bump => {
      U.save('ck_pn', { mode: o.mode, qlen: o.qlen, ppq: o.ppq, diff: o.diff, me: o.me, opp: o.opp });
      const sum = (o.mode === 'highlights' ? 'HIGHLIGHTS / ' + o.ppq + '+' + o.ppq + ' POSS' : 'FULL GAME / ' + o.qlen + ' MIN QTRS') + ' / ' + DIFF[o.diff];
      app().innerHTML = '<div class="pn"><div class="pnh"><button class="btn alt sm" id="back">BACK</button><h2>PLAY NOW</h2><span>REAL 2026-27 ROSTERS</span></div>' +
        '<div class="pnm">' + muCard(o.me, 'me', 'YOU', M_TOUCH ? '' : 'W', M_TOUCH ? '' : 'S') +
        '<div class="pnmid"><i>VS</i><button class="btn alt sm" id="swap">SWAP</button><button class="btn alt sm" id="rnd">RANDOM</button></div>' +
        muCard(o.opp, 'opp', 'CPU', M_TOUCH ? '' : '↑', M_TOUCH ? '' : '↓') + '</div>' +
        '<div class="pnf"><button class="pnset" id="sets">' + UI.icon('gear') + '<span><small>SETTINGS</small>' + sum + '</span></button><button class="btn big" id="go">TIP OFF' + (M_TOUCH ? '' : '<small>ENTER</small>') + '</button></div></div>';
      if (bump) { const c = document.querySelector('.pnc[data-side="' + bump + '"]'); if (c) c.classList.add('bump'); }
      const flip = bindCards(o, ['me', 'opp'], draw);
      click('#swap', () => { [o.me, o.opp] = [o.opp, o.me]; draw(); });
      click('#rnd', () => { const a = U.shuffle(CK.TEAMS.map((_, i) => i)); o.me = a[0]; o.opp = a[1]; draw(); });
      click('#back', () => { removeEventListener('keydown', pnKey); UI.title(); });
      click('#go', () => play());
      click('#sets', () => settings());
      removeEventListener('keydown', pnKey);
      pnKey = e => {
        if (!document.querySelector('.pn') || document.querySelector('.pngrid') || document.querySelector('#modal.on')) return;
        if (e.code === 'KeyW') flip('me', -1); if (e.code === 'KeyS') flip('me', 1);
        if (e.code === 'ArrowUp') { e.preventDefault(); flip('opp', -1); } if (e.code === 'ArrowDown') { e.preventDefault(); flip('opp', 1); }
        if (e.code === 'Enter') play();
      };
      addEventListener('keydown', pnKey);
    };
    const settings = () => {
      const S = CK.S;
      const body = () => '<div class="pnsets"><h2>GAME SETTINGS</h2>' + UI.gameOpts(o) +
        '<div class="lbl">TEAM LOGOS</div><div class="seg" id="plg"><button data-v="real" class="' + (!S || S.logos !== 'retro' ? 'sel' : '') + '">REAL</button><button data-v="retro" class="' + (S && S.logos === 'retro' ? 'sel' : '') + '">RETRO LETTERS</button></div>' +
        '<div class="lbl">SOUND</div><div class="seg" id="psd"><button data-v="1" class="' + (CK.SFX.on ? 'sel' : '') + '">ON</button><button data-v="0" class="' + (!CK.SFX.on ? 'sel' : '') + '">OFF</button></div>' +
        '<button class="btn" id="sdone">DONE</button></div>';
      const open = () => UI.modal(body(), m => {
        UI.bindOpts(o, open);
        m.querySelectorAll('#plg button').forEach(b => b.onclick = () => { if (CK.S) { CK.S.logos = b.dataset.v; L.save(); } open(); });
        m.querySelectorAll('#psd button').forEach(b => b.onclick = () => { CK.SFX.on = b.dataset.v === '1'; if (CK.S) { CK.S.sfx = CK.SFX.on; L.save(); } open(); });
        m.querySelector('#sdone').onclick = () => { UI.closeModal(); draw(); };
      });
      open();
    };
    const play = () => {
      if (o.me == null || o.opp == null || o.me === o.opp) return;
      removeEventListener('keydown', pnKey);
      const restore = UI.tempLeague(o.me);
      const S = CK.S; S.diff = o.diff; S.mode = o.mode; S.qlen = o.qlen; S.ppq = o.ppq;
      app().innerHTML = '';
      CK.M.start({ home: o.me, away: o.opp, exhib: true, label: 'PLAY NOW', full: o.mode !== 'highlights', qlen: o.qlen }, (res, act) => {
        restore();
        if (act === 'again') play(); else UI.playNow();
      });
    };
    draw();
  };
  const M_TOUCH = matchMedia('(pointer: coarse)').matches;

  // ---------- online ----------
  const on = { qlen: 3, me: 16, code: '' };
  UI.online = () => {
    app().innerHTML = '<div class="page online"><h2>PLAY NOW ONLINE</h2><div class="sub">You vs a friend, real rosters, full game. One of you hosts and gets a 4-letter code, the other types it in.</div>' +
      '<button class="btn big" id="host">HOST A GAME</button><button class="btn" id="join">JOIN A GAME</button><button class="btn alt" id="back">BACK</button>' +
      '<p class="dim">Only share your code with friends you know. Just team picks and the game go over the internet: no names, no chat.</p></div>';
    click('#host', hostScreen); click('#join', joinScreen); click('#back', () => UI.title());
  };
  function hostScreen() {
    const draw = () => {
      app().innerHTML = '<div class="page"><h2>HOST A GAME</h2>' +
        '<div class="pnone">' + muCard(on.me, 'me', 'YOU') + '<div>' +
        '<div class="lbl">QUARTER LENGTH</div><div class="seg" id="oqlen">' + [2, 3, 5, 8].map(n => '<button data-v="' + n + '" class="' + (on.qlen === n ? 'sel' : '') + '">' + n + ' MIN</button>').join('') + '</div>' +
        '<button class="btn big" id="go">GET A CODE</button><button class="btn alt" id="back">BACK</button></div></div></div>';
      bindCards(on, ['me'], draw);
      click('#oqlen button', el => { on.qlen = +el.dataset.v; draw(); });
      click('#back', UI.online);
      click('#go', async () => {
        if (on.me == null) return;
        $('#go').disabled = true; $('#go').textContent = 'CONNECTING...';
        let H;
        try { H = await CK.NET.host({ team: T(on.me).ab, qlen: on.qlen }, gv => startHost(H, gv)); }
        catch (e) { UI.toast('Could not go online: ' + (e.message || e), true); draw(); return; }
        app().innerHTML = '<div class="page center"><h2>YOUR CODE</h2><div class="code">' + H.code + '</div><p>Tell your friend to tap <b>PLAY NOW ONLINE</b>, then <b>JOIN A GAME</b>, and type this code.</p><div class="wait">WAITING FOR YOUR FRIEND<span>...</span></div><button class="btn alt" id="cancel">CANCEL</button></div>';
        click('#cancel', () => { H.close(); UI.online(); });
      });
    };
    draw();
  }
  function startHost(H, gv) {
    const gi = CK.TEAMS.findIndex(d => d[0] === gv.team);
    if (gi < 0 || gi === on.me) return;
    const restore = UI.tempLeague(on.me);
    const S = CK.S; S.mode = 'full'; S.qlen = on.qlen;
    const data = CK.M.startData(L.T(on.me), L.T(gi)); data.qlen = on.qlen;
    H.start(data);
    app().innerHTML = '';
    CK.M.start({ home: on.me, away: gi, exhib: true, net: H, full: true, qlen: on.qlen, label: 'ONLINE' }, () => { restore(); H.close(); UI.title(); });
  }
  function joinScreen() {
    const draw = () => {
      app().innerHTML = '<div class="page"><h2>JOIN A GAME</h2>' +
        '<label class="fld">GAME CODE<input id="code" maxlength="4" autocapitalize="characters" autocomplete="off" value="' + U.esc(on.code) + '" placeholder="ABCD"></label>' +
        '<div class="pnone">' + muCard(on.me, 'me', 'YOU') + '<div><button class="btn big" id="go">JOIN</button><button class="btn alt" id="back">BACK</button></div></div></div>';
      $('#code').oninput = e => { on.code = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); e.target.value = on.code; };
      bindCards(on, ['me'], () => { on.code = $('#code').value; draw(); });
      click('#back', UI.online);
      click('#go', async () => {
        on.code = $('#code').value.toUpperCase();
        if (on.code.length !== 4) return UI.toast('Type the 4-letter code.', true);
        $('#go').disabled = true; $('#go').textContent = 'JOINING...';
        let G;
        try { G = await CK.NET.join(on.code, T(on.me).ab); }
        catch (e) { UI.toast(e.message || String(e), true); draw(); return; }
        app().innerHTML = '<div class="page center"><h2>YOU\'RE IN</h2><div class="code">' + G.code + '</div><div class="wait">STARTING THE GAME<span>...</span></div><button class="btn alt" id="cancel">LEAVE</button></div>';
        click('#cancel', () => { G.close(); UI.online(); });
        let started = false;
        G.onStart = data => {
          if (started) return; started = true;
          app().innerHTML = '';
          CK.M.watch(G, data, false, () => { G.close(); UI.title(); });
        };
        G.onGone = () => { if (!started) { UI.toast('The host left.', true); UI.online(); } };
        if (G.startData) G.onStart(G.startData);
      });
    };
    draw();
  }
})(window.CK);
