// Court Kings - Play Now (quick game) and Play Now Online
(function (CK) {
  const U = CK.U, L = CK.L, UI = CK.UI;
  const $ = s => document.querySelector(s);
  const app = () => $('#app');
  const click = (sel, fn) => document.querySelectorAll(sel).forEach(el => el.addEventListener('click', e => { CK.SFX.init(); CK.SFX.play('click'); fn(el, e); }));
  let strengths = null;
  const getStrengths = () => { if (!strengths) { const r = UI.tempLeague(0); strengths = CK.S.teams.map(L.teamStars); r(); } return strengths; };
  const T = i => { const d = CK.TEAMS[i]; return { id: i, ab: d[0], city: d[1], c1: d[2], c2: d[3], name: d[5], logo: d[6] }; };
  const grid = (sel, dis) => '<div class="tgrid">' + CK.TEAMS.map((d, i) => { const t = T(i); return '<button class="tpick ' + (sel.includes(i) ? 'sel' : '') + (dis === i ? ' dis' : '') + '" data-i="' + i + '" style="--c:' + t.c1 + ';--c2:' + t.c2 + '">' + UI.logo(t, 'tlg') + '<b>' + t.ab + '</b><span>' + U.esc(t.name) + '</span>' + UI.stars(getStrengths()[i]) + '</button>'; }).join('') + '</div>';
  const slot = (t, label, on) => '<div class="slot ' + (on ? 'on' : '') + '" data-s="' + label + '" style="--c:' + (t ? t.c1 : '#1d2448') + '">' + (t ? UI.logo(t, 'big') + '<b>' + t.ab + '</b><span>' + U.esc(t.name.toUpperCase()) + '</span>' : '<b>?</b><span>TAP A TEAM</span>') + '<i>' + label + '</i></div>';

  // ---------- play now ----------
  const pn = { mode: 'full', qlen: 3, ppq: 3, diff: 1, me: null, opp: null, side: 'me' };
  UI.playNow = () => {
    const o = pn;
    const draw = () => {
      app().innerHTML = '<div class="page"><h2>PLAY NOW</h2><div class="sub">Real 2026-27 rosters. Nothing here touches your career.</div>' +
        '<div class="slots">' + slot(o.me != null ? T(o.me) : null, 'YOU', o.side === 'me') + '<em>VS</em>' + slot(o.opp != null ? T(o.opp) : null, 'CPU', o.side === 'opp') + '</div>' +
        '<div class="lbl">' + (o.side === 'me' ? 'PICK YOUR TEAM' : 'PICK THE OPPONENT') + '</div>' + grid([o.me, o.opp].filter(x => x != null)) +
        UI.gameOpts(o) +
        '<button class="btn big" id="go" ' + (o.me == null || o.opp == null ? 'disabled' : '') + '>' + (o.me == null ? 'PICK YOUR TEAM' : o.opp == null ? 'PICK AN OPPONENT' : 'TIP OFF') + '</button>' +
        '<button class="btn alt" id="rnd">RANDOM MATCHUP</button><button class="btn alt" id="back">BACK</button></div>';
      click('.slot', el => { o.side = el.dataset.s === 'YOU' ? 'me' : 'opp'; draw(); });
      click('.tpick', el => {
        const i = +el.dataset.i;
        if (o.side === 'me') { o.me = i; if (o.opp === i) o.opp = null; o.side = o.opp == null ? 'opp' : 'me'; }
        else { o.opp = i; if (o.me === i) o.me = null; if (o.me == null) o.side = 'me'; }
        draw();
      });
      UI.bindOpts(o, draw);
      click('#rnd', () => { const a = U.shuffle(CK.TEAMS.map((_, i) => i)); o.me = a[0]; o.opp = a[1]; draw(); });
      click('#back', () => UI.title());
      click('#go', () => play());
    };
    const play = () => {
      if (o.me == null || o.opp == null) return;
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

  // ---------- online ----------
  const on = { qlen: 3, me: null, code: '' };
  UI.online = () => {
    app().innerHTML = '<div class="page online"><h2>PLAY NOW ONLINE</h2><div class="sub">You vs a friend, real rosters, full game. One of you hosts and gets a 4-letter code, the other types it in.</div>' +
      '<button class="btn big" id="host">HOST A GAME</button><button class="btn" id="join">JOIN A GAME</button><button class="btn alt" id="back">BACK</button>' +
      '<p class="dim">Only share your code with friends you know. Just team picks and the game go over the internet: no names, no chat.</p></div>';
    click('#host', hostScreen); click('#join', joinScreen); click('#back', () => UI.title());
  };
  function hostScreen() {
    const draw = () => {
      app().innerHTML = '<div class="page"><h2>HOST A GAME</h2>' +
        '<div class="slots">' + slot(on.me != null ? T(on.me) : null, 'YOU', true) + '</div>' +
        '<div class="lbl">PICK YOUR TEAM</div>' + grid(on.me != null ? [on.me] : []) +
        '<div class="lbl">QUARTER LENGTH</div><div class="seg" id="oqlen">' + [2, 3, 5, 8].map(n => '<button data-v="' + n + '" class="' + (on.qlen === n ? 'sel' : '') + '">' + n + ' MIN</button>').join('') + '</div>' +
        '<button class="btn big" id="go" ' + (on.me == null ? 'disabled' : '') + '>' + (on.me == null ? 'PICK YOUR TEAM' : 'GET A CODE') + '</button><button class="btn alt" id="back">BACK</button></div>';
      click('.tpick', el => { on.me = +el.dataset.i; draw(); });
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
        '<div class="slots">' + slot(on.me != null ? T(on.me) : null, 'YOU', true) + '</div>' +
        '<div class="lbl">PICK YOUR TEAM</div>' + grid(on.me != null ? [on.me] : []) +
        '<button class="btn big" id="go" ' + (on.me == null ? 'disabled' : '') + '>' + (on.me == null ? 'PICK YOUR TEAM' : 'JOIN') + '</button><button class="btn alt" id="back">BACK</button></div>';
      $('#code').oninput = e => { on.code = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); e.target.value = on.code; };
      click('.tpick', el => { on.code = $('#code').value; on.me = +el.dataset.i; draw(); });
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
