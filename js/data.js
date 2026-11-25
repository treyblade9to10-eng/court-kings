// Court Kings - static data: cities, colors, names
(function (CK) {
  // [abbr, city, primary, secondary, conference]
  // real teams from rosters.js: [abbr, city, primary, secondary, conference, nickname, logo code]
  CK.TEAMS = CK.REAL.teams.map(t => [t[0], t[1], t[3], t[4], t[5], t[2], t[6]]);
  CK.logoUrl = code => 'https://a.espncdn.com/i/teamlogos/nba/500/' + code + '.png';

  CK.FIRST = ['Jalen', 'Marcus', 'Devin', 'Tyrese', 'Caleb', 'Malik', 'Andre', 'Luka', 'Nikola', 'Darius', 'Jaylen', 'Isaiah', 'Trey', 'Miles', 'Cam', 'Zion', 'Ja', 'Keon', 'Bryce', 'Evan',
    'Tobias', 'Omar', 'Kendrick', 'Desmond', 'Kyle', 'Josh', 'Dejon', 'Amir', 'Rui', 'Yuki', 'Mateo', 'Diego', 'Santi', 'Lars', 'Sven', 'Aleks', 'Bogdan', 'Pascal', 'Theo', 'Hugo',
    'Elijah', 'Jordan', 'Brandon', 'Chris', 'Derrick', 'Victor', 'Paolo', 'Franz', 'Cade', 'Jabari', 'Scoot', 'Amen', 'Ausar', 'Kel', 'Dyson', 'Royce', 'Nate', 'Gabe', 'Reggie', 'Tre',
    'Quentin', 'Lonnie', 'Rasheed', 'Dante', 'Xavier', 'Kofi', 'Moussa', 'Ousmane', 'Joel', 'Pat', 'Collin', 'Mikal', 'Donte', 'Jarrett', 'Aaron', 'Ben', 'Kris', 'Wendell', 'Shai', 'Max',
    'Tari', 'Jase', 'Kobe', 'Ronnie', 'Ike', 'Kai', 'Noah', 'Ezra', 'Silas', 'Rowan'];
  CK.LAST = ['Walker', 'Brooks', 'Carter', 'Mitchell', 'Hayes', 'Jenkins', 'Dawson', 'Price', 'Holloway', 'Banks', 'Reed', 'Coleman', 'Fields', 'Grant', 'Pierce', 'Sutton', 'Barnes', 'Lowry', 'Fox', 'Murray',
    'Okafor', 'Diallo', 'Mensah', 'Adeyemi', 'Kovac', 'Petrov', 'Novak', 'Lindqvist', 'Jansen', 'Moreau', 'Garcia', 'Rivera', 'Navarro', 'Torres', 'Silva', 'Costa', 'Tanaka', 'Hachimura', 'Kim', 'Park',
    'Thompson', 'Wallace', 'Hunter', 'Bridges', 'Booker', 'Porter', 'Bishop', 'Black', 'Stone', 'Wolfe', 'Knight', 'Fowler', 'Gray', 'Webb', 'Ellis', 'Payne', 'Shaw', 'Hale', 'Marsh', 'Cross',
    'Battle', 'Strong', 'Love', 'Sharpe', 'Mobley', 'Ball', 'Green', 'White', 'Brown', 'Young', 'King', 'Wright', 'Hill', 'Lee', 'Jackson', 'Harris', 'Robinson', 'Lewis', 'Clark', 'Allen',
    'Okoro', 'Bamba', 'Sarr', 'Traore', 'Camara', 'Doncic', 'Bertans', 'Vucevic', 'Larsen', 'Holm', 'Weston', 'Blake', 'Monroe', 'Harlan', 'Quarles', 'Vance', 'Duke', 'Rhodes', 'Ford', 'Steele',
    'Pritchard', 'McBride', 'Oduya', 'Achebe', 'Nwosu', 'Castillo', 'Ortega', 'Vega', 'Ramos', 'Ibarra'];

  CK.POS = ['PG', 'SG', 'SF', 'PF', 'C'];
  // ratings (1-10): sht = mid-range shooting, thr = 3PT, ins = inside/finishing, drb = dribbling, pas = passing,
  // def = defense, ath = speed + bounce, sta = stamina (how fast they get tired in a full game)
  CK.RKEYS = ['sht', 'thr', 'ins', 'drb', 'pas', 'def', 'ath', 'sta'];
  CK.RATING_NAMES = { sht: 'SHOOTING', thr: '3PT', ins: 'INSIDE', drb: 'DRIBBLING', pas: 'PASSING', def: 'DEFENSE', ath: 'SPEED', sta: 'STAMINA' };
  CK.LVL_KEYS = ['sht', 'thr', 'drb', 'def', 'ath', 'sta'];   // what a level-up can raise
  CK.POS_TPL = { // per position, same order as RKEYS
    PG: [1, 1, -1, 2, 2, 0, 1, 0], SG: [2, 2, 0, 1, 0, 0, 1, 0], SF: [1, 1, 0, 0, 0, 1, 1, 0],
    PF: [-1, -1, 2, -1, -1, 1, 0, 0], C: [-2, -3, 3, -2, -1, 2, -1, 0]
  };
  CK.POS_HT = { PG: [72, 77], SG: [75, 79], SF: [77, 81], PF: [79, 83], C: [81, 86] };
  CK.POS_W = { // overall weights, same order as RKEYS
    PG: [0.14, 0.18, 0.06, 0.2, 0.18, 0.1, 0.1, 0.04], SG: [0.18, 0.22, 0.1, 0.12, 0.08, 0.14, 0.12, 0.04], SF: [0.16, 0.16, 0.14, 0.08, 0.08, 0.2, 0.14, 0.04],
    PF: [0.1, 0.08, 0.3, 0.04, 0.06, 0.26, 0.12, 0.04], C: [0.05, 0.03, 0.36, 0.02, 0.06, 0.32, 0.12, 0.04]
  };
  CK.SKIN = ['#f1c9a5', '#e0ac85', '#c68a5e', '#a5683f', '#7d4a2a', '#5a3420'];
  CK.HAIR = ['#111', '#2b1a10', '#5a3a1a', '#8b5a2b', '#d9b26a', '#b0402a'];
  // older saves / roster data only had 5 ratings: build 3PT, DRIBBLING and STAMINA from what we know
  const hsh = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return ((h >>> 0) % 1000) / 1000; };
  const cl = v => Math.max(1, Math.min(10, Math.round(v)));
  CK.fillRatings = p => {
    const r = p.r, n = hsh((p.fn || '') + (p.ln || '') + p.pos);
    if (r.thr == null) r.thr = cl(r.sht + ({ PG: 0.3, SG: 0.5, SF: 0, PF: -0.9, C: -2.2 }[p.pos] || 0) + (n - 0.5) * 1.6);
    if (r.drb == null) r.drb = cl(r.pas * 0.55 + r.ath * 0.35 + ({ PG: 1.2, SG: 0.7, SF: 0.2, PF: -0.6, C: -1.4 }[p.pos] || 0) + 0.6 + (hsh(p.ln + 'd') - 0.5));
    if (r.sta == null) r.sta = cl(5 + (r.ath - 5) * 0.35 + (p.age <= 24 ? 1 : p.age >= 33 ? -1.5 : p.age >= 30 ? -0.5 : 0.3) + (hsh(p.ln + 's') - 0.5) * 2.2);
    if (p.xp == null) { p.xp = 0; p.lvl = 1; }
    return p;
  };

  CK.CAP = 165;       // salary cap ($M, real 2026-27)
  CK.APRON = 210;     // hard ceiling for trades / payroll
  CK.ROSTER_MAX = 15;
  CK.ROSTER_MIN = 10;
})(window.CK);
