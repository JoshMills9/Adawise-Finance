# Adawise API: Corrections and Missing Endpoints

13 Nov 2026

The Adawise app is now wired to the API. Testing it against `https://adawise-momo-backend.onrender.com/api/v1` found one blocker (CORS), 9 places where the spec and the server disagree, 9 fields the app needs on existing endpoints, and 5 missing endpoints. Each item says what to change.

## At a glance

Start with the high-priority items: they block features the app already has.

| # | Area | Issue | Priority |
| --- | --- | --- | --- |
| B1 | All endpoints | No CORS headers, so browsers can't call the API | High |
| B2 | Payments | MoMo payments take up to ~2 minutes to settle | Medium |
| C1 | Goals | `/goals/facets/` returns counts, not a plan preview | Low |
| C2 | Plans | `/plans/preview/` parameters and response undocumented | Medium |
| C3 | Lists | 6 lists documented as arrays are paginated | Medium |
| C4 | Goals | Wallet contribution returns 201 + body, spec says 200 | Low |
| C5 | Home | `/home/` response undocumented | Medium |
| C6 | Save Me | `/saveme/status/` response undocumented | Low |
| C7 | Partners, Circles | `/partnering/` and `/circles/facets/` responses undocumented | Low |
| C8 | Goals, Circles | `partners`, `members`, `plan` typed as untyped objects | Medium |
| C9 | Errors | Error messages are unhelpful and spec examples are wrong | Low |
| F1 | Partners | No saver/supporter role on invites | High |
| F2 | Partners, Circles | People not on Adawise come back as a phone number | Medium |
| F3 | Partners | Partner invites don't say whose goal it is | High |
| F4 | Goals | Goals have no `end_date` in responses | Medium |
| F5 | Transactions | No auto-save marker or description | Low |
| F6 | Withdrawals | Goal withdrawal records aren't linked | Medium |
| F7 | Badges | No list of goals behind each badge | Low |
| F8 | Circles | No `created_at` on detail; fixed categories | Low |
| F9 | Save Me | Only one partner can be asked at a time | Low |
| M1 | Loans | No loan endpoints at all | High |
| M2 | Circles | No nudge endpoint | Medium |
| M3 | Partners | No cheer endpoint | Medium |
| M4 | Circles | No circle activity feed | Medium |
| M5 | Save Me | No endpoint for a single Save Me request | Low |

## Blockers outside the spec

### B1. Add CORS headers

The server sends no `Access-Control-*` headers, so every browser call from the app is blocked. A preflight `OPTIONS` returns 200 with no CORS headers, and a `GET` with an `Origin` header returns none either. The web app works around this today with a same-origin proxy (Vite in development, a Vercel rewrite in production), but the API should allow the app directly.

Fix (Django): install `django-cors-headers` and set:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",          # web app in development
    "https://<the-vercel-domain>",    # web app in production
]
CORS_ALLOW_HEADERS = [*default_headers, "idempotency-key"]
```

`OPTIONS` preflights must be answered before authentication runs. Today a preflight to an authenticated endpoint can come back 401.

### B2. Payments take up to ~2 minutes to settle

Top-ups, contributions and withdrawals stay `pending` for 11 to 110 seconds before turning `succeeded`. The app polls `GET /payments/{id}/` every 2.5 s and gives up after 4 minutes.

- Is this the sandbox provider, or a background job interval? If it's a job, a shorter interval (or settling on poll) would make the app feel much faster.
- Please confirm how long a `pending` payment can stay pending before it becomes `expired`.

## Spec corrections (server and spec disagree)

For each item, the server's behaviour is what the app now relies on. Update the OpenAPI spec to match it unless the item says otherwise.

### C1. `/goals/facets/` is goal counts, not a plan preview

The spec says it previews a savings plan from `target`, `term_months` and `frequency`. It actually returns goal counts and ignores those parameters:

```json
{"all": 2, "flexible": 1, "goal_locked": 0, "time_locked": 1, "with_partners": 0}
```

Fix: document it as "Goal list facets" (like `/circles/facets/`) and move the plan-preview description to `/plans/preview/`.

### C2. `/plans/preview/` has no documented parameters or response

The spec lists no parameters and "No response body". It actually validates `target`, `term_months` and `frequency`:

```json
{"error": {"code": "invalid", "message": "Validation failed.", "details": {
  "target": "Enter a valid GHS amount, e.g. '900.00'.",
  "term_months": "Must be an integer.",
  "frequency": "Must be daily, weekly, or monthly."}}}
```

Fix: document the query parameters (`target`, `term_months`, `frequency`, optional `start_date`) and the success response (`periods`, `amount_per_period`, `end_date`).

### C3. Six "array" lists are actually paginated

These are documented as plain arrays but return `{count, next, previous, results}`:

- `GET /contributions/next/`
- `GET /partner-invites/`
- `GET /saveme/requests/`
- `GET /saveme/incoming/`
- `GET /circles/`
- `GET /circle-invites/`

Fix: change each response schema to its `Paginated…List` form and add the `page` / `page_size` parameters.

### C4. Paying a goal from the wallet returns 201 with a body

`POST /goals/{id}/contributions/` with `source: "wallet"` is documented as "200, Wallet contribution posted" with no body. It actually returns **201**:

```json
{"goal": { …GoalDetail… }, "transaction": { …TransactionRecord… }}
```

Fix: document the 201 response for `source: wallet` (and keep 201 + `PaymentAttempt` for `source: momo`).

### C5. `/home/` response is undocumented

The spec only says "Home summary." The real response:

```json
{
  "total_savings": "75.00",
  "locked": "0.00",
  "available": "75.00",
  "next_contributions": [{"goal_id": "…", "goal_name": "Test laptop", "amount": "20.00", "due_date": "2026-11-13", "source": "Personal"}],
  "recent_activity": [ …TransactionRecord… ],
  "unread_notifications": 0
}
```

Fix: add a `HomeSummary` schema. `unread_notifications` isn't in the description at all. Also document the possible values of `NextContributionItem.source` ("Personal" is the only one seen).

### C6. `/saveme/status/` response is undocumented

```json
{"pin_set": false, "saveme_used": 0, "saveme_limit": 3, "saveme_remaining": 3}
```

Fix: add a `SaveMeStatusResponse` schema. The field names differ from `ProfileResponse.saveme` (`remaining`, `limit`); pick one naming for both.

### C7. `/partnering/` and `/circles/facets/` responses are undocumented

`GET /partnering/` (paginated):

```json
{"partner_id": "…", "goal_id": "…", "goal_name": "Test laptop", "owner_first_name": "Test",
 "percent_of_target": "6.00", "lock_state_message": "Unlocks 13 May.", "status": "accepted"}
```

`GET /circles/facets/`:

```json
{"all": 0, "daily": 0, "weekly": 0, "monthly": 0}
```

Fix: add both schemas.

### C8. Untyped objects in goals and circles

`GoalRead.partners`, `CircleDetail.members` and `CircleDetail.plan` are `items: {}` / `type: object`. The real shapes:

- `GoalRead.partners[]` = `GoalPartner` (`id`, `first_name`, `initials`, `status`, `relation`)
- `CircleDetail.plan` = `{amount_per_period, frequency, term_months, end_date, target}`
- `CircleDetail.members[]` = `{id, phone, status, first_name, initials, is_me, percent_of_target, balance, target}`. `balance` and `target` are `null` for other members when `show_amounts` is off.
- `CircleList.member_avatars[]` = `{first_name, initials}`

Fix: reference these schemas so generated clients get real types.

### C9. Error details are inconsistent

Every error the server returned used the `{error: {code, message, details}}` envelope. Four things around it need fixing:

- **Spec examples are wrong.** The missing `Idempotency-Key` example shows `{"Idempotency-Key": "…"}`. The server actually sends `{"error": {"code": "invalid", "message": "Validation failed.", "details": {"Idempotency-Key": "…"}}}`. Update the examples.
- **`details` values mix strings and lists.** Some come back as a string (`"target": "Enter a valid GHS amount…"`), others as a list (`"pin": ["Ensure this field has at least 4 characters."]`). Pick one (a string is easiest for the app).
- **`message` is always "Validation failed."** for 400s, so the app can't show anything useful without digging into `details`. Put the first field error in `message` (e.g. "Target must be at least GHS 10.00.").
- **Misleading minimum.** Creating a goal with `target: "1.00"` returns "Ensure this value is greater than 0." The spec says the minimum is GHS 10.00, so the message should say that.

## Fields to add to existing endpoints

The app already has screens for each of these. Without the field it guesses or hides the information.

### F1. Partner role: "save with me" or "cheer me on"

When inviting a partner, the user picks a role: a **saver** saves alongside them in a WiseCircle, and a **supporter** follows their progress and can help through Save Me. The API can't store it: `POST /goals/{goal_pk}/partners/` takes only `phone`. `relation` also stays `"invited"` after the partner accepts.

- Request: `{"phone": "+233244123456", "role": "saver" | "supporter"}`
- `GoalPartner`: add `role`, and make `relation` reflect it (or drop `relation`)
- `/partner-invites/` and `/partnering/`: include `role`, so the partner knows what they agreed to

### F2. Names for people not on Adawise yet

An invited person without an account comes back with their phone as their name: `"first_name": "+233244123456", "initials": "3456"` on goal partners, and `"first_name": "···3456", "initials": "?"` on circle members. The app picks people from the phone's contacts, so it knows their name.

- Accept an optional `name` with each phone: `{"phone": "…", "name": "Kofi Asante"}` on partner invites, and `member_phones` → `members: [{"phone", "name"}]` on circles
- Return that name (and its initials) until the person signs up, then their own name

### F3. Partner invites don't say whose goal it is

`GET /partner-invites/` returns the partner's own name and nothing about the goal:

```json
{"id": "…", "first_name": "Kofi", "initials": "KA", "status": "invited", "relation": "invited"}
```

The invite screen shows who invited you, which goal, its type and progress. Add `goal_id`, `goal_name`, `goal_icon`, `goal_type`, `owner_first_name`, `owner_initials`, `role` (F1), `percent_of_target` and `created_at`. Keep to the privacy rule: no balance or target amounts.

### F4. `end_date` on goals

`end_date` is accepted when creating a time-locked goal, but `GoalRead` and `GoalDetail` don't return it. The app falls back to `lock_state.unlocks_on`, which is `null` once the goal unlocks. Add `end_date` to both.

### F5. Auto-save marker and description on transactions

`TransactionRecord` can't tell an auto-save from a manual deposit, and carries no text. Add:

- `source`: `"manual" | "auto_save" | "scheduled" | "save_me" | "milestone"` (or an `auto_save: true` flag)
- `goal_name` (saves the app a lookup for closed goals)
- `note`: optional free text, e.g. "6-month milestone" or "From Kofi"

### F6. Link the two halves of a goal withdrawal

A goal withdrawal writes a `release` (goal → wallet) and then a `withdrawal` (wallet → MoMo). The `release` has `payment_attempt: null`, and the `withdrawal` and its `PaymentAttempt` have `goal_id: null`. The app pairs them by amount and timestamp, which can misfire.

- Set `payment_attempt` on the `release` record
- Set `goal_id` on the `withdrawal` record and on the `PaymentAttempt`

### F7. Which goals earned each badge

`GET /badges/` says whether a milestone badge is earned, but not which goals got there or the interest each was paid. The badge screen lists them. Add to each badge:

```json
"goals": [{"goal_id": "…", "goal_name": "New laptop", "reached_on": "2026-10-20", "interest": "60.00"}]
```

### F8. Circle details

- `CircleDetail` has no `created_at` (only `CircleList` does). The app shows when the circle started and ends; add it.
- `category` has six fixed values, but users can name a circle anything. Add an `other` category, or a free `icon` field like goals have.
- Each member gets a goal for the circle (`my_goal_id`), and `/home/` totals include it. Document this so the app can explain the totals.

### F9. Save Me to more than one partner

With two partners, the app offers "Both partners: the first to approve helps". The API takes one `partner_id` and allows one open request per saver. Either accept `partner_ids: […]` (first to approve wins, the others expire), or confirm that only one partner can be asked and the app will remove the option.

## Missing endpoints

These are proposed contracts written from what the app's screens need. Names and shapes follow the existing API's conventions (decimal-string money, `Idempotency-Key` on money moves, paginated lists, the error envelope); change them freely, just tell the app side.

### M1. Save Me loans

The app lets a saver borrow against a goal's fixed deposit without breaking the goal. Today this runs on demo data: the loan money never reaches the wallet, and `profile.loan.owed` is always `"0.00"`. The app's demo rules: available once the goal passes its 3-month milestone, up to 80% of the fixed deposit, one active loan per goal, paid into the Adawise wallet, 6% fee, due in 3 months, repaid from MoMo or the wallet in parts.

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/goals/{id}/loan-offer/` | – | `LoanOffer` |
| POST | `/goals/{id}/loans/` | `{"amount": "500.00"}` | 201 `Loan`; wallet gets a `loan_proceeds` record |
| GET | `/loans/` | – | paginated `Loan` list; filter `status` |
| GET | `/loans/{id}/` | – | `Loan` |
| POST | `/loans/{id}/repayments/` | `{"amount": "100.00", "source": "wallet" \| "momo"}` | wallet: 201 `{loan, transaction}`; momo: 201 `PaymentAttempt` (`purpose: loan_repayment`) |

Both POSTs need an `Idempotency-Key`.

```json
// LoanOffer
{"eligible": true, "reason": null, "fixed_deposit": "2000.00", "max_amount": "1600.00",
 "fee_rate": "0.06", "term_months": 3, "active_loan_id": null}

// Loan
{"id": "…", "goal_id": "…", "goal_name": "New laptop", "amount": "500.00", "fee": "30.00",
 "total_owed": "530.00", "repaid": "100.00", "left_to_repay": "430.00",
 "due_date": "2027-02-13", "status": "active" | "repaid" | "overdue", "created_at": "…"}
```

When `eligible` is false, `reason` holds the text the app shows (e.g. "Available once this goal reaches its 3-month milestone."). Also add notification kinds `loan_disbursed`, `loan_repayment_due` and `loan_repaid`, and make `profile.loan.owed` the sum of `left_to_repay`.

### M2. Nudge a circle member

In a circle, members who are behind show a **Nudge** button. Today it only shows a toast.

- `POST /circles/{id}/members/{member_id}/nudge/` → 202 `{"nudged_at": "…"}`
- Sends the member a `circle_nudge` notification ("Ama nudged you to save for Hostel fund")
- At most once per member per day: 429 with `error.code: "nudge_limit"`

### M3. Cheer on a goal you support

Partners see a **Cheer** button on goals they support. Today it only shows a toast.

- `POST /partnering/{partner_id}/cheer/` with optional `{"message": "You've got this!"}` (max 140 characters) → 202
- Sends the saver a `partner_cheer` notification
- Same once-a-day limit as nudges

### M4. Circle activity feed

The circle screen has an Activity list ("Ama saved this week · 82% there", "Yaw joined the circle"). There's no endpoint, so it only shows what you did on your own phone.

`GET /circles/{id}/activity/` (paginated, newest first):

```json
{"id": "…", "kind": "member_joined" | "member_saved" | "member_left" | "milestone" | "nudge",
 "member_first_name": "Ama", "is_me": false,
 "amount": null, "percent_of_target": "82.00", "created_at": "…"}
```

Follow the circle's privacy setting: `amount` is `null` for other members unless `show_amounts` is on.

### M5. Read one Save Me request

After asking a partner for help, the app follows the request until it's approved, declined or expired. With no single-item endpoint it has to page through `GET /saveme/requests/` every few seconds.

- `GET /saveme/requests/{id}/` → `SaveMeRequest`, readable by both the saver and the partner
- Optional: send notifications `saveme_approved`, `saveme_declined` and `saveme_completed` to the saver (some already exist) so the app can stop polling
