// Court Kings - boot
(function (CK) {
  CK.VER = '2.5.0';
  addEventListener('DOMContentLoaded', () => {
    const game = document.getElementById('game');
    if (CK.M.touch) game.classList.add('touch');
    CK.IN.bind(game, game.querySelector('canvas'));
    document.getElementById('pauseBtn').addEventListener('click', () => CK.M.pause());
    // stop iOS double-tap zoom and rubber-banding in game
    document.addEventListener('dblclick', e => e.preventDefault());
    game.addEventListener('touchmove', e => { if (e.target.closest('#ov')) return; e.preventDefault(); }, { passive: false });
    document.addEventListener('visibilitychange', () => { if (document.hidden && CK.inGame && CK.M.g() && CK.M.g().mode === 'live') CK.M.pause(); });
    CK.UI.title();
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => { CK.swReg = r; }).catch(() => { });
    // auto update: Home Screen apps stay open in the background for days, so check for a new version
    // every time the app comes back and every 5 minutes; reload as soon as you are not in a game
    let pending = false;
    const check = () => {
      if (location.protocol !== 'https:') return;
      if (CK.swReg) CK.swReg.update().catch(() => { });
      fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).then(j => { if (j.v && j.v !== CK.VER) { pending = true; tryReload(); } }).catch(() => { });
    };
    const tryReload = () => { if (!pending) return; if (CK.inGame) return setTimeout(tryReload, 3000); CK.UI.toast('Updating Court Kings...'); setTimeout(() => location.reload(), 700); };
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    addEventListener('pageshow', e => { if (e.persisted) check(); });
    setInterval(check, 5 * 60 * 1000); setTimeout(check, 4000);
  });
})(window.CK);
