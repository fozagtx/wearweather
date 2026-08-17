## Inspiration

Getting dressed is not a feed problem. It is a day problem. Heat, a commute, a client meeting, how you actually move. People already have clothes and Pinterest. They do not have a way to rehearse the look for the day they are walking into. PerfectCorp’s YouCam APIs can put clothes and makeup on a photo. WearWeather is the brief around that: see the look, plan the wear.

## What it does

You tell WearWeather the day you have: what you are dressing for, how it feels outside, how long you will be outdoors, how polished you need to look, and whether you want a makeup finish. You pick a few priorities in your own words. You get three Wear Plans with reasons tied to that brief. You try one look on a photo, an example or yours. If you opted in, you get a makeup recommendation for the same day and can try it on the outfit rehearsal. The picture is a rehearsal, not a guarantee of fit. WearWeather does not guess gender from the photo.

## How we built it

A single site. A labeled catalogue ranked against the day. YouCam clothes try-on to put the look on you. YouCam Look try-on, with Makeup try-on as backup, for the finish. The first screen is the product: copy on the left, the live ranking card on the right, looks auto-sliding. White by default. Test it in the header. No fake quotes, no fake stats, no fake app store.

## Challenges we ran into

Not lying. No invented testimonials or numbers. Makeup had to be a day-matched finish people opt into, not “we detected you are female.” The YouCam surface is huge: hair, nails, jewelry, skin analysis. Most of that would have fought the product. First impression was a dark stack with a GitHub clone command under the headline. We pulled the ranking into the hero, made the card whole, slid the images, switched to white, and put Test it where GitHub was.

## Accomplishments that we're proud of

Clothes and makeup on the same rehearsal, scored against the same brief. Three plans with reasons you can read. Honest limits on the result. Anyone can ask for makeup; nobody is labeled from a picture.

## What we learned

The API is only useful if the day is the input. First impression is the look, not the repo. Do not infer who someone is from a photo. If a feature does not help you walk out the door, leave it out.

## What's next for WearWeather

Keep the day brief in charge. Only add another YouCam piece if it still answers the same question: will this work for the day I actually have.
