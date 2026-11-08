/** Curated catalog with TMDB poster CDN paths (images need no API key). */
const IMG = (path) => `https://image.tmdb.org/t/p/w342${path}`;

export const CATALOG = [
  { id: 'parasite', title: 'Parasite', year: 2019, genre: 'Thriller', color: '#5a2a1a', short: 'PAR', poster: IMG('/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'), popularity: 89.2 },
  { id: 'everything-everywhere', title: 'Everything Everywhere All at Once', year: 2022, genre: 'Sci-Fi', color: '#6a2a5a', short: 'EE', poster: IMG('/u68AjlvlutfEIcpmbYpKcdi09ut.jpg'), popularity: 76.4 },
  { id: 'past-lives', title: 'Past Lives', year: 2023, genre: 'Drama', color: '#2a3a5a', short: 'PL', poster: IMG('/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg'), popularity: 42.1 },
  { id: 'dune-2', title: 'Dune: Part Two', year: 2024, genre: 'Sci-Fi', color: '#3a2a16', short: 'D2', poster: IMG('/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg'), popularity: 95.8 },
  { id: 'oppenheimer', title: 'Oppenheimer', year: 2023, genre: 'Drama', color: '#2a2a2a', short: 'OPP', poster: IMG('/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'), popularity: 88.5 },
  { id: 'barbie', title: 'Barbie', year: 2023, genre: 'Comedy', color: '#8a3a6a', short: 'BAR', poster: IMG('/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg'), popularity: 92.3 },
  { id: 'spiderverse', title: 'Spider-Man: Across the Spider-Verse', year: 2023, genre: 'Animation', color: '#1a3a6a', short: 'SV', poster: IMG('/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg'), popularity: 84.7 },
  { id: 'poor-things', title: 'Poor Things', year: 2023, genre: 'Comedy', color: '#4a2a3a', short: 'PT', poster: IMG('/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg'), popularity: 58.9 },
  { id: 'anora', title: 'Anora', year: 2024, genre: 'Comedy', color: '#5a3a2a', short: 'ANO', poster: IMG('/gBenxR01Uy0Ev9RTIw6dVBPoyQU.jpg'), popularity: 38.2 },
  { id: 'wicked', title: 'Wicked', year: 2024, genre: 'Musical', color: '#2a5a3a', short: 'WCK', poster: IMG('/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg'), popularity: 91.4 },
  { id: 'challengers', title: 'Challengers', year: 2024, genre: 'Drama', color: '#8a4a1a', short: 'CLG', poster: IMG('/H6vke7zGiuLsz4v4RPeReb9rsv.jpg'), popularity: 67.3 },
  { id: 'conclave', title: 'Conclave', year: 2024, genre: 'Thriller', color: '#2a2a3a', short: 'CON', poster: IMG('/q0bCG4NX32iIEsRFZqRtuvzNCyZ.jpg'), popularity: 54.6 },
  { id: 'substance', title: 'The Substance', year: 2024, genre: 'Horror', color: '#5a1a3a', short: 'SUB', poster: IMG('/lqoMzCcZYEFK729d6qzt349fB4o.jpg'), popularity: 71.8 },
  { id: 'brutalist', title: 'The Brutalist', year: 2024, genre: 'Drama', color: '#3a3a3a', short: 'BRU', poster: IMG('/ztwbpR3dyVRF0SPxhzmcQ44XSan.jpg'), popularity: 41.5 },
  { id: 'sing-sing', title: 'Sing Sing', year: 2024, genre: 'Drama', color: '#2a4a3a', short: 'SS', poster: IMG('/k1a23zOe5Ze1lnNz1jvwqN8IYDQ.jpg'), popularity: 28.7 },
  { id: 'la-la-land', title: 'La La Land', year: 2016, genre: 'Musical', color: '#3a4a8a', short: 'LLL', poster: IMG('/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg'), popularity: 79.1 },
  { id: 'portrait', title: 'Portrait of a Lady on Fire', year: 2019, genre: 'Romance', color: '#4a2a1a', short: 'POR', poster: IMG('/2LquGwEhbg3soxSCs9VNyh5VJd9.jpg'), popularity: 33.4 },
  { id: 'get-out', title: 'Get Out', year: 2017, genre: 'Horror', color: '#1a3a2a', short: 'GO', poster: IMG('/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg'), popularity: 82.5 },
  { id: 'moonlight', title: 'Moonlight', year: 2016, genre: 'Drama', color: '#1a2a4a', short: 'ML', poster: IMG('/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg'), popularity: 64.2 },
  { id: 'before-sunrise', title: 'Before Sunrise', year: 1995, genre: 'Romance', color: '#5a4a2a', short: 'BS', poster: IMG('/kf1Jb1c2JAOqjuzA3H4oDM263uB.jpg'), popularity: 45.3 },
  { id: 'spirited-away', title: 'Spirited Away', year: 2001, genre: 'Animation', color: '#2a5a6a', short: 'SA', poster: IMG('/jUo8cNmU400WtZiJss45HNXlQ2e.jpg'), popularity: 87.6 },
  { id: 'inception', title: 'Inception', year: 2010, genre: 'Sci-Fi', color: '#1a2a3a', short: 'INC', poster: IMG('/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg'), popularity: 93.7 },
  { id: 'whiplash', title: 'Whiplash', year: 2014, genre: 'Drama', color: '#4a1a1a', short: 'WHP', poster: IMG('/7fn624j5lj3xTme2SgiLCeuedmO.jpg'), popularity: 69.8 },
  { id: 'her', title: 'Her', year: 2013, genre: 'Romance', color: '#8a5a3a', short: 'HER', poster: IMG('/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg'), popularity: 52.9 },
  { id: 'little-women', title: 'Little Women', year: 2019, genre: 'Drama', color: '#6a3a3a', short: 'LW', poster: IMG('/yn5ihODtZ7ofn8pDYfxCmxh8AXI.jpg'), popularity: 61.4 },
  { id: 'arrival', title: 'Arrival', year: 2016, genre: 'Sci-Fi', color: '#3a4a4a', short: 'ARR', poster: IMG('/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg'), popularity: 74.6 },
  { id: 'knives-out', title: 'Knives Out', year: 2019, genre: 'Mystery', color: '#3a3a5a', short: 'KO', poster: IMG('/pThyQovXQrw2m0s9x82twj48Jq4.jpg'), popularity: 80.2 },
  { id: 'grand-budapest', title: 'The Grand Budapest Hotel', year: 2014, genre: 'Comedy', color: '#6a1a2a', short: 'GBH', poster: IMG('/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg'), popularity: 72.1 },
];

export function searchMovies(q) {
  const s = q.trim().toLowerCase();
  if (!s) return CATALOG.slice(0, 10);
  return CATALOG.filter((m) =>
    m.title.toLowerCase().includes(s) || m.genre.toLowerCase().includes(s) || String(m.year).includes(s)
  ).slice(0, 12);
}

export function findMovie(titleOrId) {
  const s = String(titleOrId).toLowerCase().trim();
  return CATALOG.find((m) => m.id === s || m.title.toLowerCase() === s)
    || CATALOG.find((m) => m.title.toLowerCase().includes(s));
}

export function getMovie(id) {
  return CATALOG.find((m) => m.id === id);
}

