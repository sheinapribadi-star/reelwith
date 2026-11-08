# ReelWith

Pocket cinema diary: dual-camera movie-night snaps, soft vibes (Liked / Mid / Dislike), then head-to-head placement on your ranked ladder. Picks follow whatever sits high on that list.

**Live:** https://sheinapribadi-star.github.io/reelwith/

## Flow
1. Pick a film (TMDB posters)
2. Dual snap — room + you (or skip)
3. Liked / Mid / Dislike
4. Head-to-head to place it on your ladder
5. Rank list + genre picks

## Design
Phone-width shell, Syne + IBM Plex Mono, ticket-stub chrome, hard shadows. No brand-name copy in the UI.

## Develop
```bash
npm install && npm run dev
npm run build
```

## Recommendation approach

Picks use a blended ranking inspired by Netflix's personalization engineering (Xavier Amatriain and Justin Basilico, 2012). The key insight from their work:

- **Popularity alone** is a strong baseline but gives everyone the same order (no personalization)
- **Predicted preference alone** can surface titles that are too niche or unfamiliar
- **A blend of both** beats pure popularity and balances familiar hits with personal taste

ReelWith's tiny version combines two signals:
1. **Personal preference** (60% weight): inferred from your ranked titles, genres you placed highly, and what you liked
2. **Popularity** (40% weight): normalized TMDB popularity scores

Each pick shows a short explanation (for example, "You liked Past Lives" or "Fits your drama taste") so you can see why it appeared. This is deliberately simple and inspectable: no fake deep learning, just transparent scoring a student can explain.

**Sources:**
- [Netflix Recommendations: Beyond the 5 stars (Part 1)](https://netflixtechblog.com/netflix-recommendations-beyond-the-5-stars-part-1-55838468f429)
- [Netflix Recommendations: Beyond the 5 stars (Part 2)](https://netflixtechblog.com/netflix-recommendations-beyond-the-5-stars-part-2-d9b96aa399f5)

By Xavier Amatriain and Justin Basilico, Personalization Science and Engineering, Netflix.

## Author
Sheina Pribadi · UC Berkeley

## License
MIT
