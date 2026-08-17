# WearWeather

<img src="public/ww-logo.png" alt="WearWeather" width="32" height="32">

**See the look. Plan the wear.**

WearWeather helps you pick an outfit for the day you actually have (heat, commute, a meeting), then see that look on your photo before you buy. Optional: a makeup finish matched to the same day.

The picture is a rehearsal, not a promise. It does not guarantee fit, fabric feel, or sizing.

## What it does

1. You describe the day: what you’re dressing for, how it feels outside, how long you’ll be outdoors, and how polished you need to look. You can type that to the stylist instead of filling the brief by hand.
2. You pick up to three priorities in your own words: I run warm, I need easy movement, I prefer coverage.
3. You get three Wear Plans, plus stylist cards when you ask. Accept a card to try that look on.
4. You try one look on a photo (an example, or your own).
5. If you opt in, you get a makeup recommendation for that same day, and you can try it on the outfit rehearsal.

WearWeather does not guess your gender from the photo. Makeup is opt-in. It does not score your body, health, or worth.

## How it works

```text
                    labeled catalogue
                            |
                            v
  day brief  ------->  rank 3 Wear Plans  ------->  pick one look
      |                                                  |
      |                                                  v
      |                                         clothes try-on
      |                                                  |
      |                                                  v
      +---- if makeup is on ---->  makeup rec  -->  try finish on the look
                                                         |
                                                         v
                                                   compare on photo
```

| Step | What you do | What you get |
| --- | --- | --- |
| Brief | Dressing for, weather, time outdoors, polish, optional makeup | A day the planner can score |
| Priorities | Up to three chips in your words | The shortlist moves around those |
| Plans | Pick one of three | Title, reasons, check-before-buying |
| Clothes | Try this look on me | Outfit rehearsal on your photo |
| Makeup | Try this makeup on me | Same photo, day-matched finish |

| Piece | Role |
| --- | --- |
| Catalogue | Labeled looks. Unknown facts never become a plus. |
| Ranking | Runs in the browser against the brief. |
| Stylist | AIMLAPI, DeepSeek V4 Flash. It ranks the same catalogue and drops Accept cards. |
| Clothes try-on | YouCam puts the chosen look on the photo. |
| Makeup | YouCam Look templates first, custom makeup if that fails. |
| Photo | Stays in the browser until you start try-on. No account. |

## Try it

Live: [https://trywearweather.vercel.app](https://trywearweather.vercel.app)

Or run it locally:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Ranking works immediately. Putting the look on a photo needs `YOUCAM_API_KEY`. The stylist needs `AIMLAPI_KEY` (AIMLAPI, model `deepseek/deepseek-v4-flash`). Optional: `AIMLAPI_MODEL=deepseek/deepseek-v4-flash` or `deepseek/deepseek-v4-pro`.

**Try the example brief** uses a seeded client-meeting day (hot and humid, long commute, business polished). **Use my photo** keeps the file in the browser until you choose to try a look on.

## What you should know

- One person, facing forward, whole face and shoulders visible. JPG or PNG, under 10 MB.
- No account. Reset deletes the session.
- Your photo is used only to create that rehearsal. The app does not keep a photo library.
- Catalogue looks are labeled editorial references. Check the item and the seller before you buy.

## License

Private hackathon project.
