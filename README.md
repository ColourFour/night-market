# Strategy Lab — classroom games

Open **https://colourfour.github.io/night-market/**. Students choose their name, then choose **Contribute / Take** or **Economic Zones**. The third option is visibly under construction and disabled. The original Night Market remains at **https://colourfour.github.io/night-market/market.html**, with its own saved class state.

## Economic Zones: launch and teach

1. Open your existing private teacher access file, then choose **Economic Zones** on the game menu. Click **Open Economic Zones**. The existing class roster is reused; if starting from an entirely empty installation, create the roster in Contribute / Take first.
2. Students open the public page, choose their name, then **Economic Zones**. They allocate exactly **100 nonnegative whole-number advertisement units** across the five illustrated zones. The live budget prevents invalid submissions. They can optionally record reasoning and predict class averages before saving, and revise until locked.
3. The teacher sees who saved and the allocation sum, while all individual allocations stay hidden until reveal. Click **Lock submitted entries**, then **Reveal class data**. At least two submissions are required. Absent or unsubmitted students are excluded; everyone participating faces the same submitted field.
4. Click **Run round-robin tournament**. Each unordered pair plays once. Higher ads wins the zone's full value (1, 2, 3, 4 or 5); equal ads split it. Every match distributes 15 points. Thirteen entrants produce 78 matches, 12 per student, and 1,170 total points. Rankings use total points, with shared ranks for ties; average and win/tie/loss records are displayed.
5. Use the allocation bars, leaderboard and **Inspect a strategy** to compare matchups. Click an opponent for zone-by-zone scores. The best-response challenge computes an exact allocation against the other fixed submitted strategies, excluding the selected student's own entry. This hypothetical calculation does not alter official results or prove a dominant strategy.
6. Download CSV for allocations and scores; JSON also includes matches, predictions and written homework. The **holiday homework PDF** is available to teachers and students within the mode. It includes pre-reveal planning, four evidence questions, worked matchups, best response and the limits of individual competition. Students can also save detailed answers to the four post-reveal questions online; these are visible only to themselves and the teacher.
7. **Reopen for revised allocations** preserves current allocations for editing, clears the tournament and homework, and then lets you lock/reveal/run again. Previous revealed choices cannot become unknown. Export before comparing iterations. **Reset Economic Zones only** requires typing RESET, archives the previous experiment and clears this mode's submissions, results and homework. It preserves Contribute / Take and original Night Market records. Paired-game reset signs out shared student seats; students can rejoin the same names to resume Zones.

This version models students competing **individually** against classmates. A later extension may compare outcomes shaped by broader systems, cooperation or group incentives. Discussion should distinguish success against the observed class field from a dominant strategy, and assess overinvestment using both zone values and match evidence.

**Rehearse first:** use the rehearsal link in the private access file. Choose Economic Zones → Open Economic Zones → Play as Student 1. Save an allocation, then Simulate classmates → Teacher view → Lock → Reveal → Run. This is a browser-only synthetic class, separate from live students. Switch modes with **Choose a game**. Sessions and seat recovery work as before.

## Contribute / Take: student flow and a rehearsal

Students open the public page, choose their name, select **Contribute / Take**, and read a short explanation of simultaneous Contribute / Take decisions. They play **one practice round against a random robot**: each robot choice has a 50–50 chance, independent of the student's choice. The result explains both choices and displays **+0 😢**, **+2 ☹️**, **+5 👍**, or **+6 with a larger 👍**. Practice results and the practice leaderboard are separate from class points. Rejoining cannot grant another practice attempt.

To preview, use the rehearsal link in `.private/Teacher access.html`. Restart the rehearsal to try the current flow. Select **Contribute / Take**, then choose **Play as Student 1**, make the robot practice choice, then return to **Teacher view**, **Unlock classmates**, and **Start timed round**. Switch back to Student 1, choose an action and use **Simulate classmates**. The other twelve simulated students finish their practice automatically. After the timer expires, inspect the large round score, explanation, total and class leaderboard. The next round starts after 30 seconds. The rehearsal is separate from the real classroom; when storage is blocked it stays usable in memory until the tab closes.

## Run the paired class

1. Open `.private/Teacher access.html` from the private chat and choose **Open paired teacher dashboard**. Keep that file private. Public pages have no teacher or rehearsal links.
2. Use **Reset game** to start a fresh session. Type the displayed code to confirm. Reset archives the previous game, retains the class roster and settings, clears all points and practice attempts, signs out student devices, frees every name and returns the game to robot practice. Existing games remain intact when software updates are published; reset when ready to use the new flow.
3. Share only **https://colourfour.github.io/night-market/**. Students choose their names, read the introduction, complete one robot practice and wait for you. The dashboard shows practice completion and scores. The saved browser session resumes without losing the practice result or class points. **Choose another name / rejoin** releases the current device's seat so it can be selected again. For a new device, first leave on the original device or ask the teacher to use **Recover seat**; selecting an already-active name alone cannot replace its session. This is a classroom trust workflow: students must select only their own name.
4. Set rounds, seconds and opponent rotation before class play. Defaults are **13 rounds, 30 seconds, rotating opponents**. With thirteen students, thirteen rounds give everyone twelve matches and one sit-out. Sit-outs score zero; longer games repeat the cycle. A shorter game can leave unequal matches played. Fixed pairs are available, with a permanent sit-out for an odd class.
5. Press **Unlock classmates · start totals at 0**. Class points and the leaderboard start at zero; robot points do not carry over. Students who finished practice move into the class lobby. Late arrivals complete their practice before joining class play. Press **Start timed round** when ready. Practice mode cannot start class rounds or accept class decisions before teacher unlock.
6. During a round students see their opponent, timer and total. Choices are locked on submission and hidden until reveal. At zero, missing choices automatically become **Take**, including absent students. **Give another 30 seconds** extends an unrevealed round. Once revealed, a round cannot reopen.
7. Between rounds the student's large score reaction and explanation appear, with an obvious running total and the **Class leaderboard** above their older round history. Results show for **30 seconds**, then the next round starts automatically. Use **Pause next round**, **Resume 30-second countdown**, or **Start next round now** for discussion. The final round finishes automatically.
8. Download CSV or results JSON for records. A **Recovery backup** includes private access, so keep it private. Restoring a timed game pauses it for teacher control. **Student seat recovery** invalidates a device session if needed. Paired resets and restores preserve the original Night Market game.

| Your choice | Opponent contributes | Opponent takes |
| --- | --- | --- |
| Contribute | **5 / 5** | **0 / 6** |
| Take | **6 / 0** | **2 / 2** |

Each cell shows **your points / their points**. Robot practice uses the same matrix. Teacher access is checked on the server; hiding public navigation does not replace authentication.

The Seewoo board can run the teacher dashboard in its browser, or connect a Mac by HDMI. Students can use mobile data without a shared Wi-Fi network. Test on one student's connection before class and use their VPN if needed. Keep the teacher page open during class so timed transitions continue.

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

Paired-game clients poll every two seconds; the teacher also polls in a background tab (subject to browser throttling). Server timestamps control acceptance, reveal and the 30-second results pause. Connected clients trigger each transition, so leave the teacher page open during class. If all clients disconnect, the next request resumes the flow with a full decision window instead of skipping unseen rounds. Recovery files reopen with the timer or results countdown paused for the teacher to resume. Existing paused classes upgrade in place, preserving earlier results. Original Night Market clients poll every three seconds while visible. Conditional responses avoid downloading unchanged game histories repeatedly. All illustration and interface assets are served by the site itself. There are no third-party fonts or analytics.

To maintain the site, update this source and push `main`; GitHub Pages publishes `docs`. Redeploy the Edge Function when server or rules code changes, including its relative dependencies `docs/core.js`, `docs/rules.js` and `docs/pairs-core.js`. To reproduce the setup in a new project, apply the migration, deploy the function with its custom authentication, set the public site URL in `NIGHT_MARKET_SITE_URL` if different, and change `docs/config.js` to the new public endpoint. Never put a teacher key or a service key in the website.

Official references: [GitHub Pages publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [Supabase Edge Function authentication](https://supabase.com/docs/guides/functions/auth), [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Files, preview and verification

One source folder, one README. `docs/` is the public website; `supabase/` holds the migration and server function; `tests/` contains the automated checks. There is no build step or npm dependency to install.

With Node 22+ installed, run `npm run preview` from this folder and open `http://localhost:4173`. Run `npm test` for the exact paired matrix, a full thirteen-round rotation, timer privacy, scores, missing-choice handling, concurrent reveal, recovery and the paired rehearsal with blocked storage, plus the original game’s full/blocked-browser-storage recovery (all six rounds, reset and compact save/reload), the rehearsal interface action flow, the source worked example, 90 independent scoring profiles, mechanism accounting, and thirteen concurrent simulated clients completing all six rounds with privacy, invalid/stale/duplicate actions, revision, exports and recovery checks. The simulated store tests compare-and-swap collisions. The paired hosted acceptance check (`tests/pairs-live-check.js`) completed thirteen clients over two timed rounds with concurrent submissions and reveal polling, CSV, reset and restore. Its synthetic class was archived before preparing the real class. Separately, `tests/live-check.js` was run against the deployed Supabase backend: 223 requests, all six rounds, thirteen concurrent clients, hidden submissions, exports and reset/restore passed. Conditional polling, invalid-token rejection and browser CORS were checked after deployment. The synthetic room was archived, then the real roster was prepared without scores or submissions. Mainland student mobile/VPN connectivity still needs an on-device check. The existing USB edition remains available separately for a usable local network.

## Artwork

The paired join page and waiting lobby use `docs/assets/class-lobby.png`, generated with the built-in image-generation tool. Status, names and arrival counts are real HTML overlays. Final lobby prompt:

"Use case: stylized-concept. Asset type: wide illustrated waiting-lobby background for the classroom game Contribute / Take, a companion to an existing contemporary Chinese night-market illustration. Primary request: an inviting cinematic night market gathering place before a game begins. Scene: a beautiful open garden courtyard with a circular lantern canopy, small paired wooden tables and chairs, lush trees and warm stall lights, a glimpse of modern riverside skyline at blue hour. Tiny anonymous people arriving and gathering at the edges, no prominent portraits. Style: sophisticated painterly editorial game illustration, richly detailed architecture, deep indigo and jade shadows, amber lanterns, subtle violet and cyan highlights, soft paper texture. Composition: wide landscape 3:2; strong central glowing lantern canopy in the upper middle, welcoming pathways leading inward; keep the lower third relatively calm and dark for real HTML lobby status overlay. Mood: anticipation, thoughtful social strategy, welcoming and classroom appropriate. Constraints: no text, no typography, no numbers, no logos, no watermark, no UI, no cards or gambling symbols. Create a finished illustration, not a website mockup."

Created with the built-in imagegen tool. Final asset: `docs/assets/night-market.png`. The website reuses this single asset in the hero, venue cards and reveal. Labels and controls are real HTML, not baked into the illustration. Reduced-motion preferences disable reveal animation.

Final generation prompt:

"Use case: stylized-concept. Asset type: immersive wide hero artwork for THIRTEEN, a classroom strategy game set in a contemporary night market. Create a beautifully art-directed cinematic panoramic illustration, landscape 3:2. An elevated three-quarter view of one coherent magical-but-believable market at blue hour: on the left a lively neon-lit plaza of food stalls with cyan and coral awnings (Neon Square); in the middle an intimate jade-green garden lane with trees and warm hanging lanterns (Garden Lane); on the right a raised rooftop terrace market with violet skyline and amber festoon lights (Rooftop Row). Strong architectural silhouettes, tiny anonymous visitors for scale, luminous lanterns, rich indigo shadows, painterly editorial game illustration with subtle paper grain and sophisticated detail, not childish. Keep lower foreground and upper night sky relatively quiet for HTML overlays. All three districts clearly distinct, glowing and inviting. No text, no labels, no letters, no logos, no numbers, no watermarks, no UI, no borders."
