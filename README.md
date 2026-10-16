# Strategy Lab — classroom games

Artwork for the future-city edition was created with the built-in image-generation tool. Final web assets are in `docs/assets/zones/` (five JPEG images). The exact generation prompt set is recorded at the end of this guide.

Open **https://colourfour.github.io/night-market/**. Students enter a name and press **Continue** (or Enter), then choose **Contribute / Take**, **Economic Zones**, or **Frontier Cities**. Confirming a name never selects a game. No preset class list is needed: new names create seats automatically. Case and extra spaces are ignored when matching an existing name. If a name is already active on another device, use an initial for a different person or ask the teacher to recover the seat. Returning browsers keep their seat for the current day. The original Night Market remains at **https://colourfour.github.io/night-market/market.html**, with its own saved class state.

## Open entry and daily reset

The classroom resets at **00:00 Asia/Shanghai (China time)**. The first request on the new date atomically saves the old class and opens an empty new class, before returning data or accepting a submission. There is no dependency on a teacher browser being open at midnight. Old student sessions expire; names, practice, scores and all three active modes start fresh. The original Night Market at `market.html` is separate and is not reset. Enabling this feature also archives the previous classroom once, including its completed Economic Zones results.

The teacher game menu has **Past class results · CSV** and **full JSON** downloads for the latest 30 saved days. Older archives remain in the private database. JSON retains full allocations, pair rounds and Frontier world history without access tokens or recovery codes. CSV includes pair scores, Economic Zones totals and Frontier resource/territory records. Empty days with no visits do not create empty archives.

Students register by typing a name (1–60 characters); ordinary spelling, punctuation and non-Latin names work. The shared classroom supports up to 40 names; Frontier still selects at most 15 participants. Students arriving after a paired game starts can practise and watch without changing existing opponents; reset that game to include them. Economic Zones admits new arrivals while practice/submissions are open. A Frontier world keeps its selected participants.

## Frontier Cities — a civilisation in one lesson

**New worlds use the expanded rules.** Existing saved worlds keep their old map, timer and single-action rules. To use this edition, download any current results, then use **Reset Frontier Cities → Create world**. Other classroom modes are unaffected.

### Teacher setup and map

Select **1–15 students**. Empty positions become named, deliberately weak bots so there are always **15 cities on 105 connected hexes**. Selected students who miss a deadline receive one modest caretaker action; returning students immediately regain control. An explicitly saved empty plan means Hold. Bots use one action per round, make basic developments/recruits or small neutral expansions, accept alliance proposals and sometimes trade. They never research or win by a victory target. If several people propose to the same bot, it accepts the lowest student ID; an unopposed existing pact is retained.

Each city begins with **one home plus four adjacent regions**, six units at home, two on each surrounding region, and twelve each of food, ore and gold. Neighbouring borders touch. Players see land within **two hex steps of owned territory**; captured regions expand their exploration. Previously discovered regions remain visible. The rest of the continent is omitted from student map responses. Students start focused on their home; the teacher sees the whole continent. **Hover a hex to see its owner, units and development**; tap/click for a persistent region detail panel. Home territories remain protected for rounds 1–2.

### Plans and rounds

Students add **up to three actions**, choose one ally separately, and press **Save my secret plan**. They may remove actions, change the ally and save again until the server deadline. Unsaved edits are marked; the last saved plan remains in force. A region can supply only one action per round; research and trade are each limited to one action per plan. Combined costs must fit current resources: income and new technologies cannot fund actions in advance. New recruits defend this round but cannot also move from the same region.

The shared timer defaults to **180 → 150 → 120 → 90 → 60 seconds**, then stays at one minute. A custom first timer of 60–180 seconds follows the same decline. Results last 20 seconds. The teacher may resolve early, pause/resume, advance or end. Keep the teacher dashboard open. Server time owns transitions and reconnections do not skip unseen rounds.

- **Move / Attack:** cross one hex edge, leaving at least one unit behind. Own territory means reinforcement; other territory means combat. Your separate armies arriving at one destination combine. An attacker must strictly exceed the defender plus all rival forces; ties keep the existing owner. Defence is units plus development. Successful capture damages one development level and keeps the winning surplus units.
- **Develop:** pay 4 ore + 3 gold for +1 level, up to level 3. Engineering reduces this to 2 ore + 2 gold.
- **Recruit:** 1 food + 1 ore per unit, up to six per action.
- **Trade:** send three of a resource to a mutual ally, who receives five. You earn two gold, or five with Trade guild. A broken or eliminated alliance cancels the convoy without charging it.
- **Research:** purchase one permanent technology. The three branches are Irrigation → Logistics, Workshops → Engineering, Markets → Trade guild. Prerequisites must already be learned. Research completes after actions, before harvest.
- **Hold:** spend nothing and collect production.

Both players must choose each other for an alliance. An alliance grants each +2 gold per harvest. Either can leave; attacking a partner breaks the pact. Allies do not combine combat strength.

### Resources and technology

Homes produce 2 of each resource plus 1 per level; other regions produce 3 of their resource plus 2 per level. Irrigation/Workshops/Markets add +2 from each corresponding food/ore/gold region. Food upkeep is one per four army units, rounded up, or one per six with Logistics. Missing food causes desertion. Stores cap at 99 per resource. Gold therefore has a direct trade-off: save it toward wealth victory or spend it on development and research.

| Technology | Cost | Effect |
| --- | --- | --- |
| Irrigation | 4 food, 6 ore, 10 gold | +2 per food region |
| Logistics | 8 food, 10 ore, 18 gold | Feed 6 units per food; requires Irrigation |
| Workshops | 8 ore, 12 gold | +2 per ore region |
| Engineering | 12 ore, 20 gold | Cheaper development; requires Workshops |
| Markets | 6 ore, 14 gold | +2 per gold region |
| Trade guild | 6 food, 20 gold | Convoys earn 5 gold; requires Markets |

### Victory and records

Each world draws fixed targets within these ranges. Students initially see broad goals and progress clues. **Exact numbers appear after five completed rounds**; victory is checked from round 6, so nobody loses to an unrevealed target. Teachers can inspect targets at any time. Reaching any one route wins immediately after simultaneous resolution; players crossing thresholds in the same round share victory.

| Route | Target range | Additional condition |
| --- | --- | --- |
| Wealth | 80–95 stored gold | — |
| Production | 240–300 total resources produced | Gross harvest across rounds, including alliance income; spending does not erase progress |
| Conquest | 12–15 owned regions | At least 4 successful captures, including unclaimed land |
| Diplomacy | 6–8 rounds in mutual alliances | At least 4 successful outgoing convoys; partners may repeat |
| Army | 30–36 surviving units | At least 20 recruited units |

Prosperity remains a comparison measure (5 per territory +3 per development level +floor(total stored resources/5)), not the victory condition. Losing all land eliminates a city. The last surviving human city wins if no other city survives; if all humans are eliminated the game ends. The teacher may end early without declaring a threshold winner.

Every reveal records all executed plans, ally choices, bot/caretaker actions, events, harvest, upkeep and before/after resources, units, land and prosperity. At game end, the **Final game report** displays every round and has **Print / Save report as PDF**. Teacher exports include standings CSV, an action-by-action CSV, and full JSON with before/after map snapshots. Pending plans are never exported or shown to other players. Regular polling omits bulky historical map snapshots; full JSON preserves them for analysis.

**Introduction and rehearsal:** the private three-round tutorial teaches one action at a time using the original smaller practice economy, then explains that class play adds three-action plans, five starting regions, research and victory routes. Students can skip it, and beginning the world brings participants straight into the live game. The rehearsal link remains `?demo=1`: create a fresh world, begin, switch to Student 1, build a plan, return to teacher view and reveal. Rehearsal never changes the live class.

This edition adds no service, database table, account or subscription. `frontier-core.js`, `frontier-geography.js` and `frontier-strategy.js` are shared by the server and rehearsal; `frontier-plan-ui.js` supplies the expanded planner. Automated tests cover the complete 15-player threshold game, combined budgets, simultaneous multi-army combat, bots, revisions, shrinking timers, hidden goals, fog, research, exports and legacy saved games.

## Economic Zones: future-city edition

Students type their name and choose Economic Zones. Each of the five districts has a unique generated image and an **Explore district** panel showing its residents, economy, expected return and uncertainty. Students allocate exactly 100 nonnegative integer advertisement units. This is fictional money; ads are a fixed budget, not a monetary expense.

| District | Expected net return if won | Standard deviation | About 68% of returns | About 95% of returns |
| --- | ---: | ---: | --- | --- |
| Industrial Fringe | $5 | $1 | $4–$6 | $3–$7 |
| Transit Sector | $10 | $2 | $8–$12 | $6–$14 |
| Commercial Strip | $16 | $4 | $12–$20 | $8–$24 |
| Innovation District | $24 | $8 | $16–$32 | $8–$40 |
| Skyline Core | $34 | $12 | $22–$46 | $10–$58 |

Returns are independent normal draws, rounded to the nearest two cents so ties split evenly into cents. They are **not clipped**: rare negative net returns remain possible, including a loss to the winner of a zone. Higher ads wins the actual return; equal ads split it. A risk-neutral best response uses expected returns; variance affects realized risk and may matter to risk-averse students. A district's expected return is conditional on winning it, not a guarantee for allocating any ads there.

1. Open your existing private teacher access page → **Economic Zones → Open Economic Zones · robot practice**. The existing roster is reused.
2. Students explore the city and play the robot **as often as they wish**. The robot independently samples several value-aware or overlooked-district allocation plans and perturbs them. It never reads the current student allocation when choosing its own strategy. Each practice match draws new returns and shows both earnings plus zone-by-zone outcomes. Only the latest result and attempt count are stored. These earnings never enter class standings.
3. Click **Unlock class submissions · earnings start at $0**. Students must have completed at least one robot match, then choose **Ready for my classmates**. Their last practice allocation provides an editable starting point. They can keep practicing or revise their class submission until locked. No written reasoning or PDF section appears on student pages.
4. Click **Lock submitted entries**, then **Reveal class allocations**, then **Run round-robin tournament**. At least two submissions are needed. Every participating student faces every other once, individually in 1v1 comparisons. Thirteen submissions produce 78 matches and twelve matches per student. Missing submissions are excluded. Highest total dollar earnings wins; ties share a rank. Earnings and win/tie/loss records use actual returns.
5. For fair comparison, the whole class tournament uses **one shared draw of five zone returns**. The server saves that draw and all results. Reopening the page or pressing **Show saved tournament** cannot reroll them. Match details show realized returns, allocations and both earnings; students see their prominent class total and the leaderboard. Teacher charts and the expected-return best-response challenge support classroom discussion.
6. CSV includes submitted allocations, earnings and realized market returns; JSON includes the full matchup record. **Reopen allocations for a new tournament** preserves allocations and robot completion, invalidates old form sessions and clears results; the next run draws a new shared market. Previously revealed allocations are known. Export first if comparing iterations.
7. **Reset Economic Zones only** requires RESET, archives the prior experiment and clears this mode's submissions, robot history and results. Contribute / Take and original Night Market records are preserved. Old Economic Zones experiments containing submissions keep their original fixed-point rules; use this reset to start the new rules. Empty unused old experiments upgrade automatically. The old holiday PDF remains a historical file in assets, with no student-page link; reasoning is handled in class.

**Rehearsal:** use the rehearsal link in your private access file → Economic Zones → Open → Play as Student 1. Play the robot, switch to Teacher view and unlock class submissions. Return to Student 1 → Ready for my classmates → submit → Simulate classmates. Teacher view → Lock → Reveal → Run. This uses synthetic students in browser memory/storage and is separate from real class data.

This version models students competing individually. Later extensions may compare broader systems, cooperation and group incentives. Winning this class tournament is not proof of a dominant strategy.

## Contribute / Take: student flow and a rehearsal

Students open the public page, type their name and click **Contribute / Take**, and read a short explanation of simultaneous Contribute / Take decisions. They play **one practice round against a random robot**: each robot choice has a 50–50 chance, independent of the student's choice. The result explains both choices and displays **+0 😢**, **+2 ☹️**, **+5 👍**, or **+6 with a larger 👍**. Practice results and the practice leaderboard are separate from class points. Rejoining cannot grant another practice attempt.

To preview, use the rehearsal link in `.private/Teacher access.html`. Restart the rehearsal to try the current flow. Select **Contribute / Take**, then choose **Play as Student 1**, make the robot practice choice, then return to **Teacher view**, **Unlock classmates**, and **Start timed round**. Switch back to Student 1, choose an action and use **Simulate classmates**. The other twelve simulated students finish their practice automatically. After the timer expires, inspect the large round score, explanation, total and class leaderboard. The next round starts after 30 seconds. The rehearsal is separate from the real classroom; when storage is blocked it stays usable in memory until the tab closes.

## Run the paired class

1. Open `.private/Teacher access.html` from the private chat and choose **Open paired teacher dashboard**. Keep that file private. Public pages have no teacher or rehearsal links.
2. Use **Reset game** to start a fresh session. Type the displayed code to confirm. Reset archives the previous game, retains the class roster and timer settings, clears all points and practice attempts, signs out student devices, frees every name and returns the game to robot practice. The daily reset clears the whole active classroom; this manual control resets only Contribute / Take.
3. Share only **https://colourfour.github.io/night-market/**. Students enter their names, continue to game selection and choose a game, read the introduction, complete one robot practice and wait for you. The dashboard shows practice completion and scores. The saved browser session resumes without losing the practice result or class points. **Choose another name / rejoin** releases the current device's seat so it can be selected again. For a new device, first leave on the original device or ask the teacher to use **Recover seat**; selecting an already-active name alone cannot replace its session. This is a classroom trust workflow: students must select only their own name.
4. Set seconds and opponent rotation before class play. Defaults are **unlimited rounds, 30 seconds, rotating opponents**. Everyone plays every classmate once, then the full rotation repeats with cumulative scores. With thirteen students, each cycle is thirteen rounds: twelve matches and one sit-out per student. Sit-outs score zero. The banner shows the round and cycle. Fixed pairs remain available, with a permanent sit-out for an odd class.
5. Press **Unlock classmates · start totals at 0**. Class points and the leaderboard start at zero; robot points do not carry over. Students who finished practice move into the class lobby. Late arrivals complete their practice before joining class play. Press **Start timed round** when ready. Practice mode cannot start class rounds or accept class decisions before teacher unlock.
6. During a round students see their opponent, timer and total. Choices are locked on submission and hidden until reveal. At zero, missing choices automatically become **Take**, including absent students. **Give another 30 seconds** extends an unrevealed round. Once revealed, a round cannot reopen.
7. Between rounds the student's large score reaction and explanation appear, with an obvious running total and the **Class leaderboard** above their older round history. Results show for **30 seconds**, then the next round starts automatically. Use **Pause next round**, **Resume 30-second countdown**, or **Start next round now** for discussion. **End game** scores and reveals an active round (missing choices become Take) and stops all automatic progression. Between rounds it stops immediately without starting another round. Final standings and exports remain available. **Continue playing** starts the next round with the same running totals. Stopping partway through a cycle can leave unequal matches played.
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

To maintain the site, update this source and push `main`; GitHub Pages publishes `docs`. Redeploy the Edge Function when server or rules code changes, including `docs/classroom-core.js` and its relative dependencies `docs/core.js`, `docs/rules.js`, `docs/pairs-core.js`, `docs/zones-core.js`, `docs/frontier-core.js`, `docs/frontier-geography.js` and `docs/frontier-strategy.js`. To reproduce the setup in a new project, apply the migration, deploy the function with its custom authentication, set the public site URL in `NIGHT_MARKET_SITE_URL` if different, and change `docs/config.js` to the new public endpoint. Never put a teacher key or a service key in the website.

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
## Future-city artwork: final generation prompts

Built-in image generation; one call per district. Final JPEG assets retain the generated compositions and use web compression. All five prompts shared the following prefix:

Use case: stylized-concept. Asset type: wide landscape illustration for a high-school game about economic zones. Create a beautiful cinematic futuristic East Asian city thirty years from now, year 2056, atmospheric neon-noir sci-fi with Blade Runner-like rainy city lighting, grounded plausible architecture. Match an existing night-market aesthetic: deep navy dusk, warm amber lantern accents, rich teal/purple neon, detailed painterly realism, immersive street photography composition. One coherent scene, the district environment fills most of the image and 2-4 recognizable adult residents inhabit the foreground, naturally integrated, not a separate portrait panel. Panoramic 3:2 landscape composition, readable at card size, premium cinematic concept art. No text, numbers, logos, watermark, collage, captions or UI. School-appropriate, fully clothed people; peaceful everyday life, no weapons, violence, sexual content, disturbing elements or recognizable movie characters.

District-specific scenes appended to that prefix:

- **industrial-fringe.jpg:** Industrial Fringe: worn industrial outskirts, repaired concrete apartments, rusted elevated pipes, small repair shops, smoky distant factories; amber work lights, muted copper and blue. Foreground two adult technicians in practical futuristic raincoats, carrying tool cases, dignified everyday residents.
- **transit-sector.jpg:** Transit Sector: crowded practical mid-low-income neighborhood around a glowing elevated electric train station; stacked apartment buildings, wet pedestrian crossings, modest food kiosks; warm yellow and teal. Foreground adult commuters, courier and shop worker in functional futuristic layered coats, daily life.
- **commercial-strip.jpg:** Commercial Strip: thriving mixed-use ordinary business neighborhood, storefronts and family-run food markets, apartment balconies, pedestrian street, discreet delivery robots; jade teal, lantern amber, modest neon. Foreground adult small-business owners and neighbors in contemporary-future casual clothing, approachable everyday people.
- **innovation-district.jpg:** Innovation District: affluent technology and university district, elegant glass research buildings, planted terraces, light rail, clean rain-reflecting plaza, blue holographic abstract wayfinding; cyan silver and warm window light. Foreground adult researchers and designers in understated futuristic coats, human and welcoming, varied ages.
- **skyline-core.jpg:** Skyline Core: richest futuristic financial center, spectacular tall graceful neon skyscrapers, rooftop skybridges, luxury garden terraces above a river, beautiful high-rise homes; violet indigo and champagne gold. Foreground adult professionals and residents in tailored high-collar futuristic coats, restrained elegance, wealthy yet plausible 2056 city.

### Frontier Cities clarity artwork

Generated with the built-in image-generation tool, saved as `docs/assets/frontier-cities-dusk.jpg` (web-optimized JPEG). Decorative only; the SVG map remains authoritative.

Prompt: “Use case: stylized-concept. Asset type: wide illustrated banner for Frontier Cities, a high-school classroom strategy game. Create a cinematic panoramic illustration of a hopeful near-future civilisation at blue hour, seen from an elevated hillside. A compact amber-lit home city in the foreground connects by luminous teal roads to three clearly readable districts: terraced green food gardens, a copper-and-stone industrial ore district, and a shimmering gold-lit commercial harbour. Small civilian transport convoys travel between districts; two neighbouring city beacons suggest possible cooperation. Elegant navy, teal and warm lantern gold palette, atmospheric depth, painterly architectural detail, premium strategy-game art, consistent with a futuristic night-market website. Leave the left third darker and quieter for HTML title overlay. Landscape 3:2 or wider. No text, labels, numbers, UI panels, logos or watermark. No violence, weapon closeups, ruins, or dystopian suffering. This is decorative artwork, not the actual playable map.”
