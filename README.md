# Adawise Finance

**Build better financial habits.** Adawise is a savings mini-app designed to live inside the MTN MoMo app, built for the **MoMo Fintech Lab hackathon**.

This repo contains a clickable web demo (PWA): a MoMo-style shell (sign-in, home, Save) that leads into the Adawise section.

> ⚠️ **Demo only.** All sign-in, balances, goals and people are dummy data. No MoMo APIs are called and no real money moves.

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
Splash → Onboarding → Number entry → Identity check → OTP → MoMo home
                                                         └─ Save → Adawise
```

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

Buttons marked **Simulate…** stand in for the other person (e.g. a partner accepting or approving) so the whole story can be shown from one phone. Open the app with `?reset` to start the demo fresh.

## Run it

Requires Node.js 20+.

```bash
cd web
npm install
npm run dev        # open the "Network" URL on your phone (same Wi-Fi)
```

- Any 4-digit OTP works; tap the fake SMS banner to fill it in.
- Open with `?reset` (e.g. `http://localhost:5173/?reset`) to replay onboarding.
- Production build: `npm run build && npm run preview` (needed to test "Add to Home screen").

## Tech stack

- **React 19 + TypeScript + Vite**: fast single-page app suited to a mobile webview
- **Tailwind CSS 4**: design tokens for the MoMo and Adawise palettes (`web/src/index.css`)
- **vite-plugin-pwa**: installable, offline-capable
- **React Router**, **Motion** (transitions), **Embla Carousel** (onboarding)

## Project structure

```
web/
├── public/              # logo, app icon, onboarding illustrations
└── src/
    ├── screens/         # one file per screen (Splash, Onboarding, Welcome, Otp, Home, Save, Adawise…)
    ├── components/      # shared UI (buttons, top bar, toast) and line icons
    └── lib/             # demo session, dummy data, status-bar colour
```

## Design notes

- The MoMo screens copy MoMo's look (navy and yellow, the **Quicksand** font standing in for MTN Brighter Sans).
- The Adawise section uses **Adawise colours only** (teal `#14B39F`, dark teal `#0B2F31`) and the **Inter** font.
- Dummy data lives in `web/src/lib/demoData.ts`; swap it for calls to the Adawise backend.
