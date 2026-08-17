# WearWeather

**See the look. Plan the wear.**

WearWeather is a single Next.js App Router application that helps a shopper rehearse an outfit for a real day. The MVP turns a live YouCam AI Clothes virtual try-on into one step in a transparent decision workflow: define the day, choose practical priorities, compare three explainable Wear Plans, and visualise one look on yourself.

> Virtual rendering helps you visualise a look. It does not guarantee physical fit, fabric feel, breathability, or retailer sizing.

## What is included

The application includes example mode and private photo upload mode, consent and client-side JPG/PNG validation, four controlled day-context inputs, five first-person preference chips, deterministic three-plan ranking, plan details and product handoff, a live YouCam `cloth-v4` Route Handler integration, controlled browser polling, signed HttpOnly request/task cookies, an accessible before/after comparison slider, refinement actions, anonymous session reset, and mapped error states.

The application is deliberately one Next.js project. There is no Express/Nest/Fastify server, separate backend repository, database, object store, worker, queue, authentication service, or second deployment.

## Prerequisites

Use Node.js 20 or newer and pnpm. A current Chrome, Edge, Firefox, or Safari browser is recommended for the local demo.

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The recommendation flow works without a YouCam key; the live VTO action returns a clear service-unavailable state until a valid key is configured.

## Environment variables

| Variable | Required for | Description |
| --- | --- | --- |
| `YOUCAM_API_KEY` | Live VTO | Server-only YouCam bearer credential. Never expose it to client code. |
| `YOUCAM_API_BASE_URL` | Optional | Defaults to `https://yce-api-01.makeupar.com`. |
| `SESSION_COOKIE_SECRET` | Recommended | Secret used to sign the short-lived HttpOnly task-mapping cookie. |

Set `YOUCAM_API_KEY` only in `.env.local` or the deployment provider's server environment. Never commit `.env.local`.

## Demo flow

Choose **Try the example**, keep the seeded client-meeting / hot-and-humid / extended-commute brief, select one to three preferences, and open the three Wear Plans. The first plan opens into a detail view with reasons tied to selected preferences and catalogue metadata. **Try this look on me** begins the live asynchronous YouCam flow. After success, use the comparison slider to inspect the original and virtual rendering, review the limitation statement, save the plan, open the product handoff, or refine with **Make it cooler** or **Add more coverage**.

For a private photo, choose **Use my photo**. The app displays consent and photo guidance before the file picker, validates type and 10 MB size locally, and keeps the preview in a browser object URL. The source bytes are only submitted to the internal Next.js Route Handler when the user explicitly starts VTO.

## YouCam integration

The implementation follows the official AI Clothes flow: request File API metadata at `/s2s/v2.0/file`, upload source and reference bytes to the returned temporary PUT URLs, create `/s2s/v2.0/task/cloth-v4` with `src_file_id`, `ref_file_id`, and the selected `garment_category`, then poll `/s2s/v2.0/task/cloth-v4/:task_id` until success or error.

The browser calls only these internal application routes:

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/vto` | `POST` | Validate the source file, stream source and catalogue reference bytes to YouCam, create a task, and return an opaque request ID. |
| `/api/vto-status/[requestId]` | `GET` | Verify request ownership through the signed HttpOnly cookie and return a safe status/result response. |
| `/api/session` | `DELETE` | Clear the task-mapping cookie during reset. |

Before a final competition demo, validate the selected account's live `cloth-v4` payload, category enum, and all chosen reference assets in the [YouCam API Playground](https://yce.makeupar.com/api-console/en/api-playground/ai-clothes/). The provider documentation states that the target image should be a single-person, forward-facing image with the shoulders visible and that a reference may be a product image or full-body outfit image. The local seed images are public editorial references copied into `public/catalog/`; confirm usage rights and provider compatibility before public release.

## Verification commands

```bash
pnpm lint
pnpm build
node scripts/validate-catalogue.mjs
```

`pnpm lint` reports only the standard Next.js advisory about raw `<img>` elements used for local preview and comparison behavior; it reports no errors. `pnpm build` must complete successfully and list the three Route Handlers.

## Privacy and limitations

No account is required. The app does not store a source image, generated result, or plan in a database or object store. Browser preview data exists only as a revocable object URL. The server stores only up to three opaque request IDs mapped to provider task IDs in a signed, HttpOnly, SameSite cookie that expires after 24 hours. Reset clears the cookie and browser state.

WearWeather does not assess body, health, attractiveness, confidence, or worth. It does not predict fit, diagnose a condition, or claim that a garment is physically comfortable. Unknown catalogue values never become positive reasons.

## Repository structure

```text
app/
  page.tsx
  api/vto/route.ts
  api/vto-status/[requestId]/route.ts
  api/session/route.ts
components/        # Reserved for future extraction of client subcomponents
lib/
  catalogue.ts
  recommendation-engine.ts
  task-cookie.ts
  types.ts
  validation.ts
  youcam.ts
data/catalogue.json
public/catalog/
docs/
scripts/
```

## References

[1]: https://docs.perfectcorp.com/reference/ai_clothes "YouCam AI Clothes Virtual Try-On documentation"
[2]: https://docs.perfectcorp.com/develop/api_playground "YouCam API Playground documentation"
