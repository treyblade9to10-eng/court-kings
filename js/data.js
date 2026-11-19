// Court Kings - static data: cities, colors, names
(function (CK) {
  // [abbr, city, primary, secondary, conference]
  CK.TEAMS = [
    ['ATL', 'Atlanta', '#e03a3e', '#c1d32f', 'E'], ['BOS', 'Boston', '#007a33', '#ba9653', 'E'],
    ['BKN', 'Brooklyn', '#1a1a1a', '#bbbbbb', 'E'], ['CHA', 'Charlotte', '#00788c', '#1d1160', 'E'],
    ['CHI', 'Chicago', '#ce1141', '#111111', 'E'], ['CLE', 'Cleveland', '#860038', '#fdbb30', 'E'],
    ['DET', 'Detroit', '#c8102e', '#1d42ba', 'E'], ['IND', 'Indiana', '#002d62', '#fdbb30', 'E'],
    ['MIA', 'Miami', '#98002e', '#f9a01b', 'E'], ['MIL', 'Milwaukee', '#00471b', '#eee1c6', 'E'],
    ['NYK', 'New York', '#006bb6', '#f58426', 'E'], ['ORL', 'Orlando', '#0077c0', '#c4ced4', 'E'],
    ['PHI', 'Philadelphia', '#006bb6', '#ed174c', 'E'], ['TOR', 'Toronto', '#ce1141', '#111111', 'E'],
    ['WAS', 'Washington', '#002b5c', '#e31837', 'E'],
    ['DAL', 'Dallas', '#00538c', '#b8c4ca', 'W'], ['DEN', 'Denver', '#0e2240', '#fec524', 'W'],
    ['GSW', 'Golden State', '#1d428a', '#ffc72c', 'W'], ['HOU', 'Houston', '#ce1141', '#c4ced4', 'W'],
    ['ING', 'Inglewood', '#1d428a', '#c8102e', 'W'], ['LAL', 'Los Angeles', '#552583', '#fdb927', 'W'],
    ['MEM', 'Memphis', '#5d76a9', '#12173f', 'W'], ['MIN', 'Minnesota', '#0c2340', '#78be20', 'W'],
    ['NOP', 'New Orleans', '#0c2340', '#c8102e', 'W'], ['OKC', 'Oklahoma City', '#007ac1', '#ef3b24', 'W'],
    ['PHX', 'Phoenix', '#1d1160', '#e56020', 'W'], ['POR', 'Portland', '#e03a3e', '#111111', 'W'],
    ['SAC', 'Sacramento', '#5a2d81', '#8a959e', 'W'], ['SAS', 'San Antonio', '#8a959e', '#111111', 'W'],
    ['UTA', 'Utah', '#4b2a8a', '#111111', 'W']
  ];

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

  CK.CAP = 115;       // salary cap ($M)
  CK.ROSTER_MAX = 12;
  CK.ROSTER_MIN = 9;
})(window.CK);
