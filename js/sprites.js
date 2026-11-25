// Court Kings - chunky outlined retro player sprites, built once and cached
(function (CK) {
  const U = CK.U, SP = CK.SP = {};
  const SW = 24, SH = 48, FX = 12, FY = 46; // canvas size + foot anchor
  const cache = new Map();
  SP.FX = FX; SP.FY = FY;

  // look: {skin, hair, hc, jersey, trim, shorts, shoe, num, ht}
  // pose: idle | run | drib | shoot | jump | def | reach | dunk | fall | cele ; f = frame 0-3
  SP.get = (look, pose, f, flip) => {
    f = (((f | 0) % 4) + 4) % 4;
    const key = look.key + '|' + pose + '|' + f + '|' + (flip ? 1 : 0);
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
      const o = FY - 38;
      R(3, 33 + o, 9, 5, jer); R(3, 37 + o, 9, 1, jerD); R(12, 33 + o, 7, 4, L.shorts); R(19, 34 + o, 3, 2, skin); R(0, 33 + o, 4, 4, skin); R(0, 32 + o, 4, 2, L.hair);
      R(20, 33 + o, 3, 2, L.shoe);
      return outline(c);
    }
    const leg = U.clamp(8 + Math.round((L.ht - 77) / 3), 6, 11);
    const air = pose === 'jump' || pose === 'shoot' || pose === 'dunk';
    let y = FY; // bottom
    // ----- legs (two legs, front = right side) -----
    const stride = pose === 'run' ? [[-2, 2], [0, 0], [2, -2], [0, 0]][f] : pose === 'drib' ? [[-1, 1], [0, 0], [1, -1], [0, 0]][f] : [0, 0];
    const tuck = air ? 2 : 0;
    const legTop = y - 2 - leg;
    const skL = U.shade(L.skin, 0.12), jerL = U.shade(L.jersey, 0.14), shD = U.shade(L.shorts, -0.28);
    const drawLeg = (x0, off, back) => {
      const lx = x0 + off;
      const col = back ? skD : skin;
      R(lx, legTop + 1, 3, leg - 2 - tuck, col);            // leg
      if (!back) R(lx + 2, legTop + 1, 1, leg - 4 - tuck, skL); // shin light
      R(lx, legTop + Math.floor(leg / 2), 3, 1, back ? U.shade(L.skin, -0.32) : skD); // knee
      R(lx, y - 4 - tuck, 3, 3, '#f4f4f4');                 // sock
      R(lx, y - 4 - tuck, 3, 1, trim);                      // sock stripe
      R(lx - 1, y - 1 - tuck, 5, 2, L.shoe);                // shoe
      R(lx - 1, y - tuck, 5, 1, U.shade(L.shoe, -0.35));    // sole
      R(lx + 1, y - 1 - tuck, 2, 1, U.lum(L.shoe) > 0.6 ? jer : '#f2f2f2'); // swoosh
    };
    drawLeg(8, stride[0], true);
    drawLeg(12, stride[1], false);
    // ----- shorts: long and baggy, side stripe -----
    const sy = legTop - 4;
    R(7, sy, 10, 7, L.shorts); R(6, sy + 2, 1, 5, L.shorts); R(17, sy + 2, 1, 5, L.shorts);
    R(7, sy, 2, 7, shD); R(6, sy + 2, 1, 5, shD);
    R(16, sy + 1, 1, 6, trim); R(17, sy + 2, 1, 5, U.shade(trim, -0.15));
    R(11, sy + 3, 1, 4, shD);                                // leg split
    R(6, sy + 6, 12, 1, shD); R(7, sy, 10, 1, trim);         // hem + waistband
    // ----- torso: shoulders taper to the waist -----
    const ty = sy - 9;
    R(7, ty, 10, 9, jer); R(8, ty + 8, 8, 1, jer);
    R(7, ty, 2, 9, jerD); R(15, ty + 2, 1, 6, jerL);       // shade back / light front
    R(10, ty, 4, 1, skin); R(9, ty, 1, 1, trim); R(14, ty, 1, 1, trim); R(10, ty + 1, 4, 1, trim); // v-neck
    R(16, ty, 1, 5, trim); R(7, ty, 1, 5, trim);            // arm holes
    R(16, ty, 1, 1, skin); R(7, ty, 1, 1, skD);             // shoulder caps
    const ns = String(L.num);
    if (ns.length === 1) CK.U.pixText(g, ns, 11, ty + 3, trim, 1); else { CK.U.pixText(g, ns[0], 9, ty + 3, trim, 1); CK.U.pixText(g, ns[1], 13, ty + 3, trim, 1); }
    // ----- head: rounded, bigger, with brow + nose -----
    const hy = ty - 10;
    R(11, hy + 9, 4, 1, skD);                               // neck
    R(8, hy + 1, 10, 7, skin); R(9, hy, 8, 1, skin); R(9, hy + 8, 8, 1, skin); // round head
    R(9, hy + 7, 8, 2, skD); R(8, hy + 1, 1, 7, skD);       // jaw shade + back of head
    R(16, hy + 1, 1, 3, skL);                               // forehead light
    R(14, hy + 3, 3, 1, U.shade(L.hair, 0.05));             // brow
    R(15, hy + 4, 1, 2, '#1a1010'); R(16, hy + 4, 1, 1, '#fff'); // eye
    R(18, hy + 4, 1, 2, skin); R(18, hy + 6, 1, 1, skD);    // nose
    R(16, hy + 7, 2, 1, U.shade(L.skin, -0.45));            // mouth
    R(10, hy + 4, 2, 2, skD); R(11, hy + 4, 1, 1, U.shade(L.skin, -0.35)); // ear
    if ((L.num * 7 + L.style) % 3 === 0 && L.style !== 5) { R(10, hy + 6, 7, 2, L.hair); R(16, hy + 7, 2, 1, U.shade(L.skin, -0.45)); } // beard
    g.fillStyle = L.hair;
    switch (L.style) {
      case 0: R(9, hy - 1, 8, 2, L.hair); R(8, hy, 3, 3, L.hair); R(17, hy, 1, 1, L.hair); break;               // short
      case 1: R(8, hy - 4, 10, 2, L.hair); R(7, hy - 2, 12, 4, L.hair); R(7, hy + 2, 3, 4, L.hair); break;       // big hair
      case 2: R(9, hy - 4, 8, 5, L.hair); R(8, hy - 3, 1, 4, L.hair); R(9, hy - 4, 8, 1, U.shade(L.hair, 0.25)); break; // flat top
      case 3: R(9, hy - 1, 8, 2, L.hair); R(8, hy, 3, 5, L.hair); R(8, hy + 5, 2, 5, L.hair); R(10, hy + 5, 1, 3, L.hair); break; // locs
      case 4: R(9, hy - 1, 8, 2, L.hair); R(8, hy + 1, 10, 1, trim); R(8, hy + 2, 10, 1, U.shade(trim, -0.2)); R(8, hy, 2, 1, L.hair); break; // headband
      default: R(10, hy, 3, 1, U.shade(L.skin, 0.3)); break;                               // bald shine
    }
    // ----- arms (shaded, darker hands) -----
    const arm = (x, y0, w, h, back, up) => { R(x, y0, w, h, back ? skD : skin); if (!back && h > 3) R(x + w - 1, y0 + (up ? 2 : 0), 1, h - 2, skL); R(x, up ? y0 : y0 + h - 2, w, 2, back ? U.shade(L.skin, -0.3) : skD); };
    switch (pose) {
      case 'shoot': arm(14, hy - 8, 3, 10, false, true); arm(11, hy - 7, 3, 9, true, true); break;
      case 'jump': arm(16, hy - 6, 3, 11, false, true); arm(5, hy - 6, 3, 11, true, true); break;
      case 'dunk': arm(15, hy - 9, 3, 13, false, true); arm(5, ty + 1, 3, 7, true); break;
      case 'cele': arm(16, hy - 7, 3, 11, false, true); arm(5, hy - 7, 3, 11, true, true); break;
      case 'def': arm(17, ty - 1, 3, 3); arm(19, ty - 5, 3, 5, false, true); arm(4, ty - 1, 3, 3, true); arm(2, ty - 5, 3, 5, true, true); break;
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
