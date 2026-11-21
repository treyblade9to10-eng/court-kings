// Court Kings - online play over a small Firebase relay room (bobble/ck/CODE).
// Host runs the real game and streams snapshots; guest sends its controls. Only team picks and
// game data go through the room: no names, no chat.
(function (CK) {
  const U = CK.U, NET = CK.NET = {};
  const CFG = { apiKey: 'AIzaSyDkw-xjR0eAkCPR3BRQyKk0Rnusu3pbEmw', authDomain: 'cardio-game-3713.firebaseapp.com', databaseURL: 'https://cardio-game-3713-default-rtdb.firebaseio.com', projectId: 'cardio-game-3713' };
  const ROOT = 'bobble/ck/';
  NET.VER = 1;
  let dbp = null;
  NET.db = () => {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const add = (src, cb) => { const sc = document.createElement('script'); sc.src = src; sc.onload = cb; sc.onerror = () => rej(new Error('Could not load the online module')); document.head.appendChild(sc); };
      const init = () => { try { const app = firebase.apps.find(a => a.name === 'ck') || firebase.initializeApp(CFG, 'ck'); res(app.database()); } catch (e) { rej(e); } };
      if (window.firebase && firebase.database) init(); else add('js/lib/firebase-app-compat.js', () => add('js/lib/firebase-database-compat.js', init));
    });
    dbp.catch(() => { dbp = null; });
    return dbp;
  };
  const code4 = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[U.irand(0, 23)]).join('');

  // ---------- host ----------
  // info: {team, qlen}. Calls onGuest(guestInfo) when someone joins.
  NET.host = async (info, onGuest) => {
    const db = await NET.db();
    let code, room;
    for (let i = 0; i < 8; i++) { code = code4(); room = db.ref(ROOT + code); const sn = await room.child('host').once('value'); if (!sn.val() || Date.now() - (sn.val().t || 0) > 3 * 3600e3) break; }
    await room.remove();
    room.onDisconnect().remove();
    await room.child('host').set({ t: Date.now(), v: NET.VER, team: info.team, qlen: info.qlen });
    const H = { code, room, role: 'host', remote: { jx: 0, jy: 0, A: 0 }, last: {}, gone: false, lastIn: 0 };
    room.child('guest').on('value', sn => {
      const v = sn.val();
      if (v && !H.guest) { H.guest = v; onGuest && onGuest(v); }
      else if (!v && H.guest) { H.gone = true; H.onGone && H.onGone(); }
    });
    room.child('in').on('value', sn => { const v = sn.val(); if (v) { H.remote = v; H.lastIn = performance.now(); } });
    let lastSnap = 0;
    H.start = data => room.child('start').set(JSON.stringify(data));
    H.snap = s => { const now = performance.now(); if (now - lastSnap < 66) return; lastSnap = now; room.child('s').set(JSON.stringify(s)); };
    H.event = ev => room.child('ev').push(JSON.stringify(ev));
    // turn the guest's counters into one-frame presses
    H.input = () => {
      const r = H.remote || {}, l = H.last, o = { jx: r.jx || 0, jy: r.jy || 0, A: !!r.A, Ap: false, Ar: false, Bp: false, Cp: false, pass: null, tap: null };
      if ((r.a || 0) > (l.a || 0)) o.Ap = true; if ((r.ar || 0) > (l.ar || 0)) o.Ar = true;
      if ((r.b || 0) > (l.b || 0)) o.Bp = true; if ((r.c || 0) > (l.c || 0)) o.Cp = true;
      if ((r.pn || 0) > (l.pn || 0)) o.pass = r.p; if ((r.tn || 0) > (l.tn || 0)) o.tap = { x: r.tx, y: r.ty };
      if (performance.now() - H.lastIn > 1500) { o.jx = o.jy = 0; o.A = false; }
      H.last = { a: r.a, ar: r.ar, b: r.b, c: r.c, pn: r.pn, tn: r.tn };
      return o;
    };
    H.close = () => { try { room.child('guest').off(); room.child('in').off(); room.remove(); room.onDisconnect().cancel(); } catch (e) { } };
    return H;
  };

  // ---------- guest ----------
  NET.join = async (code, team) => {
    const db = await NET.db();
    code = String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    const room = db.ref(ROOT + code);
    const h = (await room.child('host').once('value')).val();
    if (!h) throw new Error('No game with code ' + code + '. Check the code and try again.');
    if (h.v !== NET.VER) throw new Error('Your friend has a different version. Both of you refresh the page.');
    const g = (await room.child('guest').once('value')).val();
    if (g) throw new Error('That game is already full.');
    if (h.team === team) throw new Error('Your friend already picked that team. Pick a different one.');
    room.child('guest').onDisconnect().remove();
    await room.child('guest').set({ t: Date.now(), team });
    const G = { code, room, role: 'guest', host: h, cnt: { a: 0, ar: 0, b: 0, c: 0, pn: 0, tn: 0 }, snap: null, snapT: 0 };
    room.child('s').on('value', sn => { const v = sn.val(); if (v) { try { G.snap = JSON.parse(v); G.snapT = performance.now(); G.onSnap && G.onSnap(G.snap); } catch (e) { console.error(e); } } });
    room.child('ev').on('child_added', sn => { try { G.onEvent && G.onEvent(JSON.parse(sn.val())); } catch (e) { console.error(e); } });
    room.child('start').on('value', sn => { const v = sn.val(); if (v) { try { G.startData = JSON.parse(v); G.onStart && G.onStart(G.startData); } catch (e) { console.error(e); } } });
    room.child('host').on('value', sn => { if (!sn.val()) { G.gone = true; G.onGone && G.onGone(); } });
    let lastSend = 0, lastStr = '';
    // called every frame with the local input (screen directions); sends only when something changed (or 4x a second)
    G.send = IN => {
      const c = G.cnt;
      if (IN.Ap) c.a++; if (IN.Ar) c.ar++; if (IN.Bp) c.b++; if (IN.Cp) c.c++;
      if (IN.pass != null) { c.pn++; c.p = IN.pass; } if (IN.tap) { c.tn++; c.tx = Math.round(IN.tap.x); c.ty = Math.round(IN.tap.y); }
      const o = Object.assign({ jx: Math.round(IN.jx * 100) / 100, jy: Math.round(IN.jy * 100) / 100, A: IN.A ? 1 : 0 }, c);
      const str = JSON.stringify(o), now = performance.now();
      if (str !== lastStr || now - lastSend > 250) { lastStr = str; lastSend = now; room.child('in').set(o); }
    };
    G.close = () => { try { room.child('s').off(); room.child('ev').off(); room.child('start').off(); room.child('host').off(); room.child('guest').remove(); } catch (e) { } };
    return G;
  };
})(window.CK);
