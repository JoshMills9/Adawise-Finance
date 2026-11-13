# Adawise — MoMo-style PWA demo

Prototype for the MoMo Fintech Lab hackathon. Sign-in is simulated: no real SMS is sent and any 4-digit OTP is accepted.

## Run

```bash
npm install
npm run dev        # prints a Network URL — open it on your phone (same Wi-Fi)
npm run build && npm run preview   # production build, needed to test "Add to Home screen"
```

Open with `?reset` (e.g. `http://localhost:5173/?reset`) to replay onboarding.

## Images

Drop files in `public/` with these exact names. Grey placeholders show until they exist.

| File | Used on |
|---|---|
| `public/brand/momo-icon.png` ✅ | Splash + Welcome (round icon; "MoMo from MTN" is rendered as text) |
| `public/illustrations/topup.jpg` ✅ | Onboarding 1 |
| `public/illustrations/bills.jpg` ✅ | Onboarding 2 |
| `public/illustrations/scan.jpg` ✅ | Onboarding 3 |
| `public/illustrations/send.jpg` ✅ | Onboarding 4 |
| `public/icons/icon.svg` ✅ | App icon (MoMo icon embedded, round) |

Illustrations are square, `.jpg` or `.png`. Resize to ~900px to keep the app light:
`sips -Z 900 -s format jpeg -s formatOptions 85 in.png --out public/illustrations/name.jpg`

## Flow

`/` splash → `/onboarding` → `/welcome` (number) → `/verify` (auto-verify) → `/otp` → `/home` (MoMo home) → `/save` → `/adawise/welcome` → `/adawise/terms` → `/adawise/login` → `/adawise`

The MoMo part is simulated. Adawise signs in against the backend (`POST /auth/session`) and uses the real API from then on; `/api` is proxied to the backend by Vite (`vite.config.ts`) and Vercel (`vercel.json`). See the root README for the API setup.

Colours and the font live in `src/index.css` (`@theme`). Shared pieces (buttons, top bar, placeholders) are in `src/components/ui.tsx`.
