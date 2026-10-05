/** Curated catalog — no API key needed. Shape matches a future TMDB adapter. */
export const CATALOG = [
  { id: 'parasite', title: 'Parasite', year: 2019, genre: 'Thriller', color: '#5a2a1a', short: 'PAR' },
  { id: 'everything-everywhere', title: 'Everything Everywhere All at Once', year: 2022, genre: 'Sci-Fi', color: '#6a2a5a', short: 'EE' },
  { id: 'past-lives', title: 'Past Lives', year: 2023, genre: 'Drama', color: '#2a3a5a', short: 'PL' },
  { id: 'dune-2', title: 'Dune: Part Two', year: 2024, genre: 'Sci-Fi', color: '#3a2a16', short: 'D2' },
  { id: 'oppenheimer', title: 'Oppenheimer', year: 2023, genre: 'Drama', color: '#2a2a2a', short: 'OPP' },
  { id: 'barbie', title: 'Barbie', year: 2023, genre: 'Comedy', color: '#8a3a6a', short: 'BAR' },
  { id: 'spiderverse', title: 'Spider-Man: Across the Spider-Verse', year: 2023, genre: 'Animation', color: '#1a3a6a', short: 'SV' },
  { id: 'poor-things', title: 'Poor Things', year: 2023, genre: 'Comedy', color: '#4a2a3a', short: 'PT' },
  { id: 'anora', title: 'Anora', year: 2024, genre: 'Comedy', color: '#5a3a2a', short: 'ANO' },
  { id: 'wicked', title: 'Wicked', year: 2024, genre: 'Musical', color: '#2a5a3a', short: 'WCK' },
  { id: 'challengers', title: 'Challengers', year: 2024, genre: 'Drama', color: '#8a4a1a', short: 'CLG' },
  { id: 'conclave', title: 'Conclave', year: 2024, genre: 'Thriller', color: '#2a2a3a', short: 'CON' },
  { id: 'substance', title: 'The Substance', year: 2024, genre: 'Horror', color: '#5a1a3a', short: 'SUB' },
  { id: 'brutalist', title: 'The Brutalist', year: 2024, genre: 'Drama', color: '#3a3a3a', short: 'BRU' },
  { id: 'sing-sing', title: 'Sing Sing', year: 2024, genre: 'Drama', color: '#2a4a3a', short: 'SS' },
  { id: 'la-la-land', title: 'La La Land', year: 2016, genre: 'Musical', color: '#3a4a8a', short: 'LLL' },
  { id: 'portrait', title: 'Portrait of a Lady on Fire', year: 2019, genre: 'Romance', color: '#4a2a1a', short: 'POR' },
  { id: 'get-out', title: 'Get Out', year: 2017, genre: 'Horror', color: '#1a3a2a', short: 'GO' },
  { id: 'moonlight', title: 'Moonlight', year: 2016, genre: 'Drama', color: '#1a2a4a', short: 'ML' },
  { id: 'before-sunrise', title: 'Before Sunrise', year: 1995, genre: 'Romance', color: '#5a4a2a', short: 'BS' },
  { id: 'spirited-away', title: 'Spirited Away', year: 2001, genre: 'Animation', color: '#2a5a6a', short: 'SA' },
  { id: 'inception', title: 'Inception', year: 2010, genre: 'Sci-Fi', color: '#1a2a3a', short: 'INC' },
  { id: 'whiplash', title: 'Whiplash', year: 2014, genre: 'Drama', color: '#4a1a1a', short: 'WHP' },
  { id: 'her', title: 'Her', year: 2013, genre: 'Romance', color: '#8a5a3a', short: 'HER' },
  { id: 'little-women', title: 'Little Women', year: 2019, genre: 'Drama', color: '#6a3a3a', short: 'LW' },
  { id: 'arrival', title: 'Arrival', year: 2016, genre: 'Sci-Fi', color: '#3a4a4a', short: 'ARR' },
  { id: 'knives-out', title: 'Knives Out', year: 2019, genre: 'Mystery', color: '#3a3a5a', short: 'KO' },
  { id: 'grand-budapest', title: 'The Grand Budapest Hotel', year: 2014, genre: 'Comedy', color: '#6a1a2a', short: 'GBH' },
].map((m) => ({ ...m, id: m.id.trim().toLowerCase().replace(/\s+/g, '-') }));

export function searchMovies(q) {
  const s = q.trim().toLowerCase();
  if (!s) return CATALOG.slice(0, 8);
  return CATALOG.filter((m) =>
    m.title.toLowerCase().includes(s) || m.genre.toLowerCase().includes(s) || String(m.year).includes(s)
  ).slice(0, 12);
}

export function findMovie(titleOrId) {
  const s = String(titleOrId).toLowerCase().trim();
  return CATALOG.find((m) => m.id === s || m.title.toLowerCase() === s)
    || CATALOG.find((m) => m.title.toLowerCase().includes(s));
}

export const SAMPLE_MOMENTS = [
  {
    id: 's1',
    movieId: 'past-lives',
    movieTitle: 'Past Lives',
    crew: 'Maya',
    caption: 'cried in the last 10 quietly so she wouldn’t notice',
    vibe: 'theater',
    who: 'Alex',
    when: hoursAgo(5),
    photo: gradientPhoto('#2a3a5a', '#8a6a4a'),
  },
  {
    id: 's2',
    movieId: 'dune-2',
    movieTitle: 'Dune: Part Two',
    crew: 'Jordan + Sam',
    caption: 'IMAX seats were a personality trait today',
    vibe: 'theater',
    who: 'Riley',
    when: hoursAgo(26),
    photo: gradientPhoto('#3a2a16', '#c4a06a'),
  },
  {
    id: 's3',
    movieId: 'challengers',
    movieTitle: 'Challengers',
    crew: 'solo night',
    caption: 'zendaya serving + leftover thai = elite',
    vibe: 'laptop in bed',
    who: 'Casey',
    when: hoursAgo(48),
    photo: gradientPhoto('#8a4a1a', '#2a1a10'),
  },
];

function hoursAgo(h) {
  return Date.now() - h * 3600 * 1000;
}

function gradientPhoto(a, b) {
  // CSS gradient data URL stand-in for sample friend photos
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='520'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop stop-color='${a}'/><stop offset='1' stop-color='${b}'/>
    </linearGradient></defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <circle cx='200' cy='220' r='48' fill='rgba(255,255,255,0.15)'/>
    <rect x='120' y='320' width='160' height='90' rx='12' fill='rgba(0,0,0,0.35)'/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
