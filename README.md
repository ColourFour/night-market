# Contribute / Take — classroom game

Open **https://colourfour.github.io/night-market/**. The main page now runs the two-player game. The original Night Market remains at **https://colourfour.github.io/night-market/market.html**, with its own saved class state.

## Try the paired game

1. Choose **Try a rehearsal**. It uses thirteen simulated students and cannot affect your real class.
2. Press **Start timed round**, then **Play as Student 1**.
3. Choose **Contribute** or **Take**, then **Lock my choice**.
4. Press **Simulate classmates**. Choices stay hidden until the timer ends, then both choices and scores appear. Return to **Teacher view** and press **Next opponents**, then start the next timer.
5. If time runs out before all choices are in, use **Give another 30 seconds** (or your configured duration). Restart rehearsal starts fresh. If browser storage is full, rehearsal continues in memory; keep that tab open.

## Run the paired class

1. Open the local `.private/Teacher access.html` file and choose **Open paired teacher dashboard**. The thirteen-student roster is prepared with no scores or submissions. The private access file is for the teacher only.
2. Before starting, expand **Change rounds or timer**. Choose the number of rounds and seconds per round. The default is **13 rounds, 30 seconds, rotating opponents**. For thirteen students, thirteen rounds give everyone twelve matches and one sit-out. Longer games repeat the cycle. Shorter games can leave unequal matches played; that count appears beside each total. Fixed pairs are also available; an odd class then has the same student sitting out throughout.
3. Give students the public website, the room code and their individual six-digit seat codes from **Private seat codes**. Students select their own name and enter their private code. Mobile data works; a shared Wi-Fi network is unnecessary.
4. Press **Start timed round**. Students see their opponent’s name, their running total, the countdown and two choices. A submitted choice is locked. Neither the opponent nor the teacher sees it before reveal.
5. At zero, completed choices reveal together and totals update. By default, an incomplete round pauses; give extra time to collect missing choices. Before the first round, you can instead choose **Missing choices become Take**. Those choices are marked as timed out. You can end a timer early only when all active students have submitted.
6. Press **Next opponents**, then start the next timer. At the end, press **Finish game**. Students retain their round history and totals.
7. Download CSV or results JSON for records. A **Recovery backup** includes private seat access, so keep it private. Restore and reset archive the preceding state. Recovering a seat changes that student’s code and invalidates the old device session. Paired-game resets and restores preserve the original Night Market game.

| Your choice | Opponent contributes | Opponent takes |
| --- | --- | --- |
| Contribute | **5 / 5** | **0 / 6** |
| Take | **6 / 0** | **2 / 2** |

Each cell shows **your points / their points**. Sit-outs earn zero points. Scores accumulate across all revealed rounds.

The Seewoo board can run the teacher dashboard in its browser, or you can connect a Mac by HDMI. Keep private seat codes collapsed while projecting. Test the site on one student’s mobile connection before class; use their VPN if needed. Rehearsal is local to the browser; real games use the hosted server.

## Original THIRTEEN — The Night Market

Open **https://colourfour.github.io/night-market/market.html** for the original venue-and-lantern game. The following sections document that game for later development.

## Original Night Market rehearsal

1. Choose **Play a rehearsal**. A simulated class of thirteen is ready with practice policies already filed.
2. In **Teacher view**, press **Open round**.
3. Choose **Play as Founder 01**, select a venue and a lantern contribution, then **Lock my decision**.
4. Press **Simulate 12 classmates**. Return to **Teacher view**, **Lock round**, then **Reveal round**.
5. Switch to Founder 01 to inspect your score, all fifteen counterfactuals, regret, history and reflection. Try the mechanism-design sandbox.
6. Advance through three practice rounds. During revision, simulate the other twelve policies, then write Founder 01’s revision yourself. Begin the three scored rounds.

For the source deck’s worked example, choose Neon Square and contribute 2 in the first round. Simulated classmates produce counts 6/4/3 and C=26. Your score is 19.2, your best fixed-opponents score is 20.8, and regret is 1.6.

Rehearsal is labelled throughout. It runs only in your browser and cannot accept real classmates. It uses the same rules and transition engine as the live backend. Rehearsal policies are synthetic examples; automatic classmates follow their filed round-by-round actions. Restart rehearsal clears only its own game record. If browser storage is full or blocked, rehearsal continues in memory with a visible notice: keep the tab open, because reloading loses unsaved progress. Recovery JSON can still be downloaded and restored. Other apps’ saved data is never cleared. Saved rehearsals omit counterfactual tables and recalculate them from the recorded decisions when reopened. The live backend is connected and has passed a complete thirteen-client, six-round acceptance test. Rehearsal remains separate from the real classroom.

## Original Night Market class

Students and teacher open the original Night Market page (`market.html`). Students can use mobile data; sharing a Wi-Fi network is unnecessary. Use a browser on the Seewoo board or the Mac connected by HDMI. PowerPoint can link to the website; the browser runs the game.

1. Open your local `.private/Teacher access.html` file in a browser and choose **Open original Night Market dashboard**. A fresh room has been prepared with the existing thirteen-student roster. After a future reset, enter the thirteen names, one per line. Names are stored privately in the backend, never embedded in the public site or repository.
2. Give each student their founder number and private six-digit seat code. Share the website and short room code. The join selector displays founder numbers, not the full roster.
3. Project **Open projection view**. Keep the teacher dashboard private because it contains seat codes.
4. All thirteen students file a prediction, executable policy and fallback. Then open the round.
5. Students choose one of three venues and contribute 0–4 fresh credits. A submitted decision is locked. Teacher and projection views show submission counts, not hidden choices.
6. Lock and reveal when all thirteen are in. Advance through the practice season; collect revised policies and reasons; begin the scored season.
7. For an absent student, execute their filed policy/fallback through the teacher entry form and document why. Recover a seat to invalidate its old device session. Rejoining rotates that student’s token.
8. Export CSV, evidence JSON and a private recovery JSON. Use **Print class evidence** or each student’s **Print my evidence** for a compact record. Reset and restore archive the previous state in the backend.

Test the final live site on one student’s mainland-China mobile connection before class: load the artwork, join, submit, refresh and reveal. Try their VPN if necessary. A working teacher connection does not verify a student carrier or VPN. No Google fonts, analytics, remote image libraries or other third-party browser assets are required. Initial illustration download is about 2.8 MB and is reused across the page.

## Rules and provenance

Source: the existing `Game_Theory_All_Lessons.pptx`, Night Market slides 163–169, 178/187/192 notes, 196, 202–204 and 210–215. The online edition reuses the delivered local app’s payoff engine and game transitions.

- Venues: Neon Square, Garden Lane, Rooftop Row.
- Each season’s base-attraction calendar: `[18,16,14]`, `[16,18,14]`, `[16,14,18]`.
- Score: `base − number at your venue + (4 − your contribution) + total contributions / 5`.
- Three practice rounds, revision/preregistration, three scored rounds. No credit carryover.
- One documented policy override per founder per season. Preregistered versions are immutable.
- Regret enumerates all fifteen unilateral actions, recounting the destination and lantern fund with the other twelve actions fixed.
- Class total audit: `Σ nᵥ(bᵥ − nᵥ) + 52 + 1.6C`.
- Only scored points determine the champion; exact ties share the title. Academic marks do not depend on rank.
- Sandbox changes one rule: external reward, equally funded reward, congestion tax retained by the organiser, or mechanically enforced minimum contribution. Recorded choices are replayed; the exercise does not predict adaptive behaviour. Funding and net totals are explicit. Official results remain unchanged.

## Hosting and maintenance

The site is deployed on GitHub Pages at `ColourFour/night-market`, from `main` / `docs`. The live backend is the **Night Market** project in **C4 Projects**, Singapore region (`ap-southeast-1`). Supabase quoted $0/month at creation, subject to its free-plan limits. Project reference: `fozygymcsxrqtrudtgjw`.

`docs/config.js` contains only the public function URL. The teacher key is generated in the database and remains in private, service-role-only game state. Your local `.private/Teacher access.html` and `.private/live.env` are ignored by Git and have restricted file permissions. Keep them private; the public repository has neither access credentials nor the class roster. An optional `NIGHT_MARKET_TEACHER_KEY` server secret can override the stored key for deliberate recovery/rotation.

`supabase/migrations/202609270001_night_market.sql` creates the private tables and atomic commit function. The `night-market` Edge Function implements teacher/student token checks itself; Supabase JWT verification is therefore disabled for this endpoint. Protected routes still require the correct teacher or seat token. Room lookup and joining need no account.

All three tables have row-level security enabled and no browser-facing access policies. Only the service role can access them. Supabase’s informational [“RLS Enabled No Policy” notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) is intentional for these server-only tables. A versioned compare-and-swap transaction prevents simultaneous submissions from overwriting each other; a conflict reloads and retries. Reset/restore archives are written in that same transaction. The server validates every action and strips other founders’ unrevealed choices. Joining is limited to twelve attempts per seat per five minutes; room lookup has a shared limit. One paired class and one original Night Market class are supported at a time, with independent scores and student sessions.

Paired-game clients poll every two seconds while visible; the authoritative server deadline controls acceptance and reveal. Original Night Market clients poll every three seconds while visible. Conditional responses avoid downloading unchanged game histories repeatedly. All illustration and interface assets are served by the site itself. There are no third-party fonts or analytics.

To maintain the site, update this source and push `main`; GitHub Pages publishes `docs`. Redeploy the Edge Function when server or rules code changes, including its relative dependencies `docs/core.js`, `docs/rules.js` and `docs/pairs-core.js`. To reproduce the setup in a new project, apply the migration, deploy the function with its custom authentication, set the public site URL in `NIGHT_MARKET_SITE_URL` if different, and change `docs/config.js` to the new public endpoint. Never put a teacher key or a service key in the website.

Official references: [GitHub Pages publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [Supabase Edge Function authentication](https://supabase.com/docs/guides/functions/auth), [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Files, preview and verification

One source folder, one README. `docs/` is the public website; `supabase/` holds the migration and server function; `tests/` contains the automated checks. There is no build step or npm dependency to install.

With Node 22+ installed, run `npm run preview` from this folder and open `http://localhost:4173`. Run `npm test` for the exact paired matrix, a full thirteen-round rotation, timer privacy, scores, missing-choice handling, concurrent reveal, recovery and the paired rehearsal with blocked storage, plus the original game’s full/blocked-browser-storage recovery (all six rounds, reset and compact save/reload), the rehearsal interface action flow, the source worked example, 90 independent scoring profiles, mechanism accounting, and thirteen concurrent simulated clients completing all six rounds with privacy, invalid/stale/duplicate actions, revision, exports and recovery checks. The simulated store tests compare-and-swap collisions. The paired hosted acceptance check (`tests/pairs-live-check.js`) completed thirteen clients over two timed rounds with concurrent submissions and reveal polling, CSV, reset and restore. Its synthetic class was archived before preparing the real class. Separately, `tests/live-check.js` was run against the deployed Supabase backend: 223 requests, all six rounds, thirteen concurrent clients, hidden submissions, exports and reset/restore passed. Conditional polling, invalid-token rejection and browser CORS were checked after deployment. The synthetic room was archived, then the real roster was prepared without scores or submissions. Mainland student mobile/VPN connectivity still needs an on-device check. The existing USB edition remains available separately for a usable local network.

## Artwork

Created with the built-in imagegen tool. Final asset: `docs/assets/night-market.png`. The website reuses this single asset in the hero, venue cards and reveal. Labels and controls are real HTML, not baked into the illustration. Reduced-motion preferences disable reveal animation.

Final generation prompt:

"Use case: stylized-concept. Asset type: immersive wide hero artwork for THIRTEEN, a classroom strategy game set in a contemporary night market. Create a beautifully art-directed cinematic panoramic illustration, landscape 3:2. An elevated three-quarter view of one coherent magical-but-believable market at blue hour: on the left a lively neon-lit plaza of food stalls with cyan and coral awnings (Neon Square); in the middle an intimate jade-green garden lane with trees and warm hanging lanterns (Garden Lane); on the right a raised rooftop terrace market with violet skyline and amber festoon lights (Rooftop Row). Strong architectural silhouettes, tiny anonymous visitors for scale, luminous lanterns, rich indigo shadows, painterly editorial game illustration with subtle paper grain and sophisticated detail, not childish. Keep lower foreground and upper night sky relatively quiet for HTML overlays. All three districts clearly distinct, glowing and inviting. No text, no labels, no letters, no logos, no numbers, no watermarks, no UI, no borders."
