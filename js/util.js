// Court Kings - shared helpers
window.CK = window.CK || {};
(function (CK) {
  const U = CK.U = {};
  U.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.irand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.pick = a => a[Math.floor(Math.random() * a.length)];
  U.chance = p => Math.random() < p;
  U.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  U.shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  U.gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += Math.random(); return (s - 2) / 0.577; };
  U.uid = (() => { let n = Date.now() % 100000; return () => (++n).toString(36) + Math.floor(Math.random() * 1296).toString(36); })();
  U.money = m => '$' + (Math.round(m * 10) / 10).toFixed(1) + 'M';
  U.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.ord = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
  U.hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  U.shade = (h, f) => { const [r, g, b] = U.hex2rgb(h); const m = x => Math.round(U.clamp(f < 0 ? x * (1 + f) : x + (255 - x) * f, 0, 255)); return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')'; };
  U.lum = h => { const [r, g, b] = U.hex2rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  U.clock = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ':' + (r < 10 ? '0' : '') + r; };

  // 3x5 pixel digits for jersey numbers / tiny canvas text
  const G = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
    '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
    'A': '010101111101101', 'B': '110101110101110', 'C': '011100100100011', 'D': '110101101101110', 'E': '111100110100111',
    'F': '111100110100100', 'G': '011100101101011', 'H': '101101111101101', 'I': '111010010010111', 'J': '001001001101010',
    'K': '101101110101101', 'L': '100100100100111', 'M': '101111111101101', 'N': '110101101101101', 'O': '010101101101010',
    'P': '110101110100100', 'Q': '010101101110011', 'R': '110101110101101', 'S': '011100010001110', 'T': '111010010010010',
    'U': '101101101101111', 'V': '101101101101010', 'W': '101101111111101', 'X': '101101010101101', 'Y': '101101010010010',
    'Z': '111001010100111', ' ': '000000000000000', '-': '000000111000000', '+': '000010111010000', '!': '010010010000010', '.': '000000000000010', ':': '000010000010000'
  };
  U.pixText = (ctx, str, x, y, col, s = 1) => {
    ctx.fillStyle = col; str = String(str).toUpperCase();
    for (let i = 0; i < str.length; i++) {
      const g = G[str[i]] || G[' '];
      for (let k = 0; k < 15; k++) if (g[k] === '1') ctx.fillRect(x + i * 4 * s + (k % 3) * s, y + Math.floor(k / 3) * s, s, s);
    }
  };
  U.pixW = (str, s = 1) => String(str).length * 4 * s - s;

  // storage
  U.save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { console.warn('save failed', e); return false; } };
  U.load = (k, d) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : d; } catch (e) { return d; } };
})(window.CK);
