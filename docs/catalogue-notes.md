# Catalogue notes

The MVP catalogue contains 12 complete-look records, satisfying the PRD target range of 12–18 records. Each record includes a stable ID, title, local source image, product handoff URL, licence record URL, garment category, formality mapping, silhouette, layer weight, removable-layer flag, lining state, movement tags, coverage tags, care level, composition summary, verified facts, and a pre-buy check.

The local images were selected from public Unsplash image results for the hackathon prototype and copied into `public/catalog/`. The app links to the Unsplash license page as a provisional licence record. Before any public or commercial release, replace these with assets whose exact photographer attribution, usage permission, and complete-look/provider compatibility have been verified.

The recommendation engine treats `unknown` values conservatively: they may trigger a pre-buy check or a lower score, but they are not presented as positive evidence. Product URLs are handoff destinations, not claims that the pictured garment is the exact retail item.
