// Court Kings - boot
(function (CK) {
  CK.VER = '2.3.0';
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
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
  });
})(window.CK);
