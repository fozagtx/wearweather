# WearWeather architecture notes

WearWeather is one deployable Next.js App Router project. React Client Components own the interaction state; Route Handlers own private provider calls. There is no second server runtime.

## Request boundary

The browser submits a source `File` and a catalogue `lookId` to `POST /api/vto`. The Route Handler validates content type and size, reads the selected local reference image, performs the provider File API flow, creates `cloth-v4`, and returns an opaque `requestId`. The provider task ID never reaches the browser.

The signed `wearweather_tasks` HttpOnly cookie contains up to three short-lived mappings from opaque request IDs to provider task IDs and catalogue look IDs. `GET /api/vto-status/[requestId]` resolves the mapping server-side and returns only `running`, `success` with a provider result URL, or a mapped safe error code. The browser polls with a 2s / 3s / 5s controlled backoff and stops after 60 seconds.

## Data boundary

Static catalogue JSON is bundled with the application. Browser state holds the day brief, preferences, plans, selected plan, preview object URL, and result URL. No image copy is persisted by WearWeather. YouCam owns its own temporary upload/result lifecycle.

## Failure boundary

Provider failures are logged with a correlation/request identifier and mapped into safe user-facing states: invalid source photo, invalid reference, unavailable service, failed task, or expired session. The API key is read only from `process.env.YOUCAM_API_KEY` in server modules.

## Future-scale reference only

A database, durable storage, background worker, queue, cron, rate-limiter service, authentication, and analytics pipeline are intentionally excluded from the hackathon MVP. They may be added only if the product grows beyond the anonymous one-session flow.
