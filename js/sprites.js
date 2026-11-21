// Court Kings - chunky outlined retro player sprites, built once and cached
(function (CK) {
  const U = CK.U, SP = CK.SP = {};
  const SW = 24, SH = 40, FX = 12, FY = 38; // canvas size + foot anchor
  const cache = new Map();
  SP.FX = FX; SP.FY = FY;

  // look: {skin, hair, hc, jersey, trim, shorts, shoe, num, ht}
  // pose: idle | run | drib | shoot | jump | def | reach | dunk | fall | cele ; f = frame 0-3
  SP.get = (look, pose, f, flip) => {
    const key = look.key + '|' + pose + '|' + (f | 0) + '|' + (flip ? 1 : 0);
    let c = cache.get(key);
    if (!c) { c = build(look, pose, f | 0, flip); cache.set(key, c); if (cache.size > 3000) cache.clear(); }
    return c;
  };
  SP.lookOf = (p, jer) => ({
    key: p.id + jer.jersey + jer.trim + p.skin + p.hair + p.hc + p.num,
    skin: CK.SKIN[p.skin], hair: CK.HAIR[p.hc], style: p.hair, jersey: jer.jersey, trim: jer.trim, shorts: jer.shorts || jer.jersey, shoe: jer.shoe || '#f2f2f2', num: p.num, ht: p.ht
  });

  function build(L, pose, f, flip) {
    const c = document.createElement('canvas'); c.width = SW; c.height = SH;
    const g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const skin = L.skin, skD = U.shade(L.skin, -0.22), jer = L.jersey, jerD = U.shade(L.jersey, -0.25), trim = L.trim;
    if (pose === 'fall') {
      // flat on the floor
      R(3, 33, 9, 5, jer); R(3, 37, 9, 1, jerD); R(12, 33, 7, 4, L.shorts); R(19, 34, 3, 2, skin); R(-0 + 0, 33, 4, 4, skin); R(0, 32, 4, 2, L.hair);
      R(20, 33, 2, 2, L.shoe);
      return outline(c);
    }
    const leg = U.clamp(8 + Math.round((L.ht - 77) / 3), 6, 11);
    const air = pose === 'jump' || pose === 'shoot' || pose === 'dunk';
    let y = FY; // bottom
    // ----- legs (two legs, front = right side) -----
    const stride = pose === 'run' ? [[-2, 2], [0, 0], [2, -2], [0, 0]][f] : pose === 'drib' ? [[-1, 1], [0, 0], [1, -1], [0, 0]][f] : [0, 0];
    const tuck = air ? 2 : 0;
    const legTop = y - 2 - leg;
    const drawLeg = (x0, off, back) => {
      const lx = x0 + off;
      const col = back ? skD : skin;
      R(lx, legTop + 1, 3, leg - 2 - tuck, col);            // leg
      R(lx, y - 3 - tuck, 3, 2, '#f4f4f4');                 // sock
      R(lx - (back ? 0 : 0), y - 1 - tuck, 4, 2, L.shoe);   // shoe
      R(lx + 3, y - 1 - tuck, 1, 1, U.shade(L.shoe, -0.4));
    };
    drawLeg(8, stride[0], true);
    drawLeg(12, stride[1], false);
    // ----- shorts -----
    const sy = legTop - 3;
    R(7, sy, 10, 6, L.shorts); R(7, sy, 2, 6, U.shade(L.shorts, -0.25)); R(16, sy + 1, 1, 5, trim); R(7, sy + 5, 10, 1, U.shade(L.shorts, -0.3));
    // ----- torso -----
    const ty = sy - 9;
    R(7, ty, 10, 10, jer); R(7, ty, 2, 10, jerD);
    R(9, ty, 6, 1, trim); R(11, ty + 1, 2, 1, trim);       // collar
    R(16, ty + 1, 1, 4, trim); R(7, ty + 1, 1, 4, trim);    // arm holes
    const ns = String(L.num);
    if (ns.length === 1) CK.U.pixText(g, ns, 11, ty + 3, trim, 1); else { CK.U.pixText(g, ns[0], 9, ty + 3, trim, 1); CK.U.pixText(g, ns[1], 13, ty + 3, trim, 1); }
    // ----- head -----
    const hy = ty - 9;
    R(11, hy + 8, 3, 1, skD);                               // neck
    R(8, hy, 9, 8, skin); R(8, hy + 6, 9, 2, skD); R(8, hy, 1, 8, skD);
    R(15, hy + 3, 1, 2, '#1a1010'); R(16, hy + 3, 1, 1, '#fff'); // eye toward facing side
    R(16, hy + 6, 1, 1, U.shade(L.skin, -0.4));             // mouth
    R(10, hy + 3, 2, 2, skD);                               // ear
    g.fillStyle = L.hair;
    switch (L.style) {
      case 0: R(8, hy - 1, 9, 2, L.hair); R(8, hy, 2, 3, L.hair); break;                 // short
      case 1: R(7, hy - 3, 11, 5, L.hair); R(7, hy + 1, 3, 4, L.hair); break;            // big hair
      case 2: R(8, hy - 3, 9, 4, L.hair); break;                                          // flat top
      case 3: R(8, hy - 1, 9, 2, L.hair); R(8, hy, 3, 5, L.hair); R(9, hy + 5, 2, 4, L.hair); break; // locs
      case 4: R(8, hy - 1, 9, 2, L.hair); R(8, hy + 1, 9, 1, trim); R(8, hy + 2, 2, 1, trim); break; // headband
      default: R(9, hy, 3, 1, U.shade(L.skin, 0.2)); break;                               // bald shine
    }
    // ----- arms -----
    const arm = (x, y0, w, h, back) => R(x, y0, w, h, back ? skD : skin);
    switch (pose) {
      case 'shoot': arm(14, hy - 7, 3, 9); arm(11, hy - 6, 3, 8, true); R(14, hy - 8, 3, 2, skin); break;
      case 'jump': arm(16, hy - 6, 3, 10); arm(5, hy - 6, 3, 10, true); break;
      case 'dunk': arm(15, hy - 9, 3, 12); arm(5, ty + 1, 3, 7, true); break;
      case 'cele': arm(16, hy - 7, 3, 10); arm(5, hy - 7, 3, 10, true); break;
      case 'def': arm(17, ty - 2, 3, 3); arm(19, ty - 5, 3, 5); arm(4, ty - 2, 3, 3, true); arm(2, ty - 5, 3, 5, true); break;
      case 'reach': arm(17, ty + 3, 6, 3); arm(5, ty + 1, 3, 7, true); break;
      case 'drib': arm(16, ty + 1, 3, 5); arm(18, ty + 5, 3, 4); arm(5, ty + 1, 3, 7, true); break;
      case 'run': { const s = [2, 0, -2, 0][f]; arm(16, ty + 1 + Math.max(0, -s), 3, 7); arm(5, ty + 1 + Math.max(0, s), 3, 7, true); break; }
      default: arm(16, ty + 1, 3, 8); arm(5, ty + 1, 3, 8, true);
    }
    const o = outline(c);
    if (!flip) return o;
    const fc = document.createElement('canvas'); fc.width = SW; fc.height = SH; const fg = fc.getContext('2d');
    fg.translate(SW, 0); fg.scale(-1, 1); fg.drawImage(o, 0, 0); return fc;
  }
  function outline(src) {
    const s = document.createElement('canvas'); s.width = SW; s.height = SH; const sg = s.getContext('2d');
    sg.drawImage(src, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#0b0b12'; sg.fillRect(0, 0, SW, SH);
    const o = document.createElement('canvas'); o.width = SW; o.height = SH; const og = o.getContext('2d');
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => og.drawImage(s, dx, dy));
    og.drawImage(src, 0, 0);
    return o;
  }
})(window.CK);
