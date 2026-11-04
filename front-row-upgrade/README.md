# Front Row Ticket Upgrade Challenge

A deterministic queue that picks one fan to receive a front-row upgrade, while stopping one person with multiple accounts from taking more than one chance.

## Run the project

```bash
npm install
npm run dev     # open the URL Vite prints (usually http://localhost:5173)
npm test        # run all Vitest tests
```

## Project structure

| File | Purpose |
| --- | --- |
| `src/logic/types.ts` | Data types |
| `src/logic/eligibility.ts` | Exclusion rules and ticket value parsing |
| `src/logic/unionFind.ts` | Union-find (path compression + union by rank) |
| `src/logic/grouping.ts` | Groups entries that share phone, deviceId, or payment account |
| `src/logic/scoring.ts` | Priority score, mode weights, tie-break comparator |
| `src/logic/buildQueue.ts` | `buildFrontRowUpgradeQueue(entries, now, mode)` |
| `src/logic/__tests__/buildQueue.test.ts` | 11 tests |
| `src/App.tsx` | UI: winner, top 3, groups, excluded, time buttons, loyalty editing, modes |

## Exclusion rules

An entry cannot win if any of these apply. All matching reasons are listed, not only the first one.

- Status is `cancelled`
- Status is `upgraded` (already upgraded)
- Membership is `blocked`
- The concert has already started (`now >= eventStartsAt`) or the start time is invalid
- Ticket value is invalid, zero, or negative. It accepts `number`, numeric `string` (commas allowed), or `null`.

## Tests

The suite has 11 tests:

- the 7 tests required by the spec
- 3 edge cases of my own:
  - empty or null values never link accounts
  - a 50-account group produces only one candidate
  - ties break by `joinedQueueAt`, then `id`
- 1 performance test: 200,000 entries finish in under 5 seconds

## README questions

### 1. How does your priority score work?

```
score = min(waitMinutes, 720) × W
      + loyaltyPoints × 0.1
      + (membership is VIP ? V : 0)
      − upgradesLast30Days × P
```

Default weights are **W = 1, V = 30, P = 60**.

- **Waiting time is the main factor.** `waitMinutes = now − joinedQueueAt`. It is capped at 720 minutes (12 hours), so someone who joined days earlier cannot dominate every other factor.
- **Loyalty** gives a small bonus. 1,000 points equal 100 minutes of waiting.
- **VIP** gives a small bonus, equal to 30 minutes of waiting.
- **Recent upgrades** are a penalty. Each upgrade in the last 30 days costs 60 points, about one hour of waiting, so seats rotate to different fans. Only the last 30 days count, so the penalty does not last forever.
- **Null values count as 0.** A missing membership is treated as regular.
- **Ticket value is used only for eligibility, not for score.** Fans who paid more should not automatically win a free upgrade.
- **Every score comes with reasons**, for example "Waited 180 min: +180", which the UI shows.

### 2. How do you stop one fan group from dominating?

- Entries that share a phone number (digits only), deviceId, or payment account belong to the same fan group. Indirect links count too: if A shares a phone with B, and B shares a device with C, then A, B, and C are one group.
- **Each group sends only one representative:** its highest-scoring eligible entry. The winner is chosen among representatives only, so 50 accounts still get just one chance.
- **Blocked or excluded entries still link their group.** Blocking removes only that entry's chance; it does not split the group. Otherwise a blocked account could become a bridge that gives the linked accounts two chances instead of one.

### 3. How do you break ties?

1. Higher score
2. Earlier `joinedQueueAt` (invalid dates go last)
3. Smaller `id` (string comparison)

The same comparator picks both each group's representative and the overall winner. The function never uses randomness, and `now` is passed in as a parameter, so the same input always gives the same output. The input array is never mutated.

### 4. What is the time complexity of your grouping logic?

**O(n · α(n)), effectively O(n).** Whole pipeline: **O(n log n)**, from the final sort.

- One pass over the entries. For each non-empty key (`phone:0812345678`, `device:...`, `payment:...`), a `Map` stores the first entry index that had it. When a later entry has the same key, the two entries are unioned.
- Union-find uses path compression and union by rank, so each operation is nearly constant (α is the inverse Ackermann function).
- No pairwise comparison (which would be O(n²)). The performance test runs 200,000 entries in under 5 seconds.

### 5. What is one case where your system may still feel unfair?

- **Shared devices.** If fans buy at the same counter kiosk, they share a `deviceId` and get merged into one group even though they are strangers. Only one of them can win.
- **Separate identifiers.** Someone who uses different phones, devices, and payment accounts for each account cannot be detected.
- **Early queue joiners.** Fans who join long before others still get an advantage, up to the 720-minute cap.

### 6. How do Rush Hour, VIP Hour, and Fair Queue Mode work?

Each mode changes one weight in the formula. All weights live in `getWeights(mode)` in `scoring.ts`.

| Mode | Changes | Effect |
| --- | --- | --- |
| Rush Hour | W: 1 → **1.5** | Waiting time matters more |
| VIP Hour | V: 30 → **60** | VIP bonus doubles |
| Fair Queue | P: 60 → **150** | Recent upgrades are penalised harder |

**Modes can be combined.** They touch different weights, so they never conflict. For example, with all three on, a VIP who waited 90 minutes with 900 loyalty and no upgrades scores 90 × 1.5 + 90 + 60 = **285**.

### 7. What would you improve with more time?

- **Kiosk device ignore list:** skip known shared/kiosk `deviceId`s when grouping.
- **Concert history:** e.g. +10 per past concert purchase that did not receive an upgrade.
- **Queue opening time:** with a `queueOpensAt` field, count waiting time from the opening, so fans who joined before it start equal.
- **Configurable weights:** move the weights to an admin config and log every winner with its score breakdown for auditing.
- **Backend:** run the logic on a server with persistent data instead of only in the browser.