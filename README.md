# Adawise Finance

**Build better financial habits.** Adawise is a savings mini-app designed to live inside the MTN MoMo app, built for the **MoMo Fintech Lab hackathon**.

This repo contains a web app (PWA): a MoMo-style shell (sign-in, home, Save) that leads into the Adawise section. The Adawise section runs on the [Adawise backend](https://adawise-momo-backend.onrender.com/api/v1/).

> ⚠️ **Sandbox only.** The MoMo screens (sign-in, OTP, MoMo home) are simulated. Adawise uses the real backend, whose MoMo payments go through a sandbox provider, so no real money moves.

## What Adawise does

| Feature | Summary |
|---|---|
| **WiseGoals** | Personal savings goals: **Flexible** (withdraw any time), **Goal-locked** (locked until the target is reached) or **Time-locked** (locked until a date). |
| **Accountability partners** | Invite someone to a goal. If they **also save**, it becomes a **WiseCircle**; if they only **support**, they get reminders and progress updates and can encourage you. |
| **WiseCircles** | Save together towards individual goals. Each person owns their own savings. |
| **Savings milestones** | At 3 · 6 · 9 · 12 months, qualifying savings move into fixed deposits with interest paid upfront. |
| **Save Me** | When something unexpected happens: ask your partner for help (up to 3 successful rescues a year, approved with a Save Me PIN), or take **credit** against an eligible fixed deposit. |

## Demo flow

```
Splash → Onboarding → Number entry → Identity check → OTP → MoMo home          (simulated)
                                                         └─ Save → Adawise
                                                              Welcome → Terms → Sign in → Adawise home   (real API)
```

**Signing in to Adawise.** After the Adawise terms, a sign-in screen asks for the MoMo number (prefilled from the MoMo sign-in) and a name, and calls `POST /auth/session`. The token is kept on the device, and every Adawise screen needs it; if it expires, the app returns to this screen. Logging out of MoMo also signs out of Adawise.

On the MoMo home, only **Save** is active; other buttons show "Not available in this demo". Tap the profile icon to log out.

### Inside Adawise

| Screen | What you can do |
|---|---|
| **Home** | Wallet (total / locked / available), Create goal & Create circle, Save Me left, next contributions, goals, circles, goals you support |
| **Create goal** | Name & target → Flexible / Goal-locked / Time-locked → saving plan → up to **2 accountability partners** (save with me / cheer me on) → review & first deposit |
| **Goal details** | Add money, withdraw (or see why it's locked), **Save Me** (ask a partner or get credit against the fixed deposit), plan, 3/6/9/12-month milestones, partners, activity |
| **Create circle / Circle details** | Target per member, plan, invite members, privacy (amounts or % only); ranked members, nudges, add money |
| **Requests for you** | Accept a partner invite (create a **Save Me PIN**, accept the terms) and approve a Save Me request with your PIN |
| **Notifications** | Live unread badge; tap to jump to the goal, circle or request |

Partners and circle members are real people with their own accounts: they accept invites and approve Save Me requests in their own Adawise app. To demo it, sign in as the saver on one phone and as the partner on another (or a private window). Open the app with `?reset` to start fresh.

**Still on demo data:** Save Me loans (no loan API yet), and the partner side ("Requests for you", "Goals you support"), which is hidden (`SHOW_PARTNER_SIDE` in `web/src/lib/demoData.ts`). See [`web/API_FEEDBACK.md`](web/API_FEEDBACK.md) for what the backend still needs.

## Run it

Requires Node.js 20+.

```bash
cd web
npm install
npm run dev        # open the "Network" URL on your phone (same Wi-Fi)
```

- Any 4-digit OTP works; tap the fake SMS banner to fill it in.
- The Adawise sign-in accepts any phone number and name on the current (debug) backend.
- Open with `?reset` (e.g. `http://localhost:5173/?reset`) to replay onboarding.
- Production build: `npm run build && npm run preview` (needed to test "Add to Home screen").

### API setup

The app calls the API on its own address (`/api/v1/…`), and that path is forwarded to the backend. No `.env` is needed.

| Where | What forwards `/api` | Configured in |
|---|---|---|
| `npm run dev` / `npm run preview` | Vite proxy | `web/vite.config.ts` (`API_TARGET`) |
| Vercel | Rewrite | `web/vercel.json` |

This is because the backend doesn't send CORS headers yet, so a browser can't call it directly. Once it does, set `VITE_API_URL` (e.g. `https://adawise-momo-backend.onrender.com/api/v1/`) to call it directly. To use another backend, change the URL in both files.

Good to know:
- MoMo sandbox payments take from a few seconds to about 2 minutes to confirm; the app waits up to 4 minutes.
- The backend is on Render's free tier, so the first request after a quiet spell can take 30–60 seconds.
- Money-moving requests send an `Idempotency-Key`; amounts go to the API as decimal strings (`"50.00"`).

## Tech stack

- **React 19 + TypeScript + Vite**: fast single-page app suited to a mobile webview
- **Tailwind CSS 4**: design tokens for the MoMo and Adawise palettes (`web/src/index.css`)
- **vite-plugin-pwa**: installable, offline-capable
- **React Router**, **Motion** (transitions), **Embla Carousel** (onboarding)
- **Adawise REST API**: token auth, MoMo payments polled until they settle

## Project structure

```
web/
├── public/              # logo, app icon, onboarding illustrations
└── src/
    ├── screens/         # one file per screen (Splash, Onboarding, Welcome, Otp, Home, Save, Adawise…)
    ├── components/      # shared UI (buttons, top bar, toast) and line icons
    └── lib/
        ├── api.ts       # HTTP client: token, error envelope, Idempotency-Key, payment polling
        ├── adawise.ts   # API calls + mapping API responses into the app's types
        ├── goalStore.ts # cached stores the screens read (filled from the API)
        ├── demoData.ts  # app types and rules; partner-side demo data
        └── session.ts   # simulated MoMo sign-in
```

## Design notes

- The MoMo screens copy MoMo's look (navy and yellow, the **Quicksand** font standing in for MTN Brighter Sans).
- The Adawise section uses **Adawise colours** (teal `#14B39F`, navy headers) and the **MTN Brighter Sans** font.
- Screens read the stores in `web/src/lib/goalStore.ts`; `web/src/lib/adawise.ts` fills them from the API, so screens don't depend on the API's shapes.
