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
  // rating templates per position: [sht, ins, pas, def, ath]
  CK.POS_TPL = {
    PG: [1, -1, 2, 0, 1], SG: [2, 0, 0, 0, 1], SF: [1, 0, 0, 1, 1], PF: [-1, 2, -1, 1, 0], C: [-2, 3, -1, 2, -1]
  };
  CK.POS_HT = { PG: [72, 77], SG: [75, 79], SF: [77, 81], PF: [79, 83], C: [81, 86] };
  CK.POS_W = { // ovr weights [sht, ins, pas, def, ath]
    PG: [0.32, 0.1, 0.28, 0.12, 0.18], SG: [0.38, 0.14, 0.12, 0.16, 0.2], SF: [0.28, 0.2, 0.1, 0.22, 0.2],
    PF: [0.16, 0.32, 0.08, 0.26, 0.18], C: [0.08, 0.38, 0.08, 0.32, 0.14]
  };
  CK.SKIN = ['#f1c9a5', '#e0ac85', '#c68a5e', '#a5683f', '#7d4a2a', '#5a3420'];
  CK.HAIR = ['#111', '#2b1a10', '#5a3a1a', '#8b5a2b', '#d9b26a', '#b0402a'];
  CK.RATING_NAMES = { sht: 'SHOOTING', ins: 'INSIDE', pas: 'HANDLES', def: 'DEFENSE', ath: 'ATHLETIC' };
  CK.RKEYS = ['sht', 'ins', 'pas', 'def', 'ath'];

  CK.CAP = 165;       // salary cap ($M, real 2026-27)
  CK.APRON = 210;     // hard ceiling for trades / payroll
  CK.ROSTER_MAX = 15;
  CK.ROSTER_MIN = 10;
})(window.CK);
