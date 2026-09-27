# THIRTEEN — The Night Market

Open **https://colourfour.github.io/night-market/**. This is the illustrated online edition of Blake’s 13-founder classroom game.

## Try it before class

1. Choose **Play a rehearsal**. A simulated class of thirteen is ready with practice policies already filed.
2. In **Teacher view**, press **Open round**.
3. Choose **Play as Founder 01**, select a venue and a lantern contribution, then **Lock my decision**.
4. Press **Simulate 12 classmates**. Return to **Teacher view**, **Lock round**, then **Reveal round**.
5. Switch to Founder 01 to inspect your score, all fifteen counterfactuals, regret, history and reflection. Try the mechanism-design sandbox.
6. Advance through three practice rounds. During revision, simulate the other twelve policies, then write Founder 01’s revision yourself. Begin the three scored rounds.

For the source deck’s worked example, choose Neon Square and contribute 2 in the first round. Simulated classmates produce counts 6/4/3 and C=26. Your score is 19.2, your best fixed-opponents score is 20.8, and regret is 1.6.

Rehearsal is labelled throughout. It runs only in your browser and cannot accept real classmates. It uses the same rules and transition engine as the live backend. Rehearsal policies are synthetic examples; automatic classmates follow their filed round-by-round actions. Restart rehearsal clears only its browser record. The live connection is deliberately disabled until Supabase is provisioned and tested.

## Run a real class after the backend is connected

Students and teacher open the same website. Students can use mobile data; sharing a Wi-Fi network is unnecessary. Use a browser on the Seewoo board or the Mac connected by HDMI. PowerPoint can link to the website; the browser runs the game.

1. Open **Teacher access**, enter your private teacher key, and enter the thirteen names, one per line. Names are entered privately into the backend, never embedded in the public site or repository.
2. Create the room. Give each student their founder number and private six-digit seat code. Share the website and short room code. The join selector displays founder numbers, not the full roster.
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

## Connect Supabase (one-time technical setup)

The backend files are prepared; an authorised Supabase project is still required. Do not send private keys in chat or commit them to GitHub.

1. Create/select a Supabase project. Authenticate the official Supabase CLI on your own machine, or connect the Supabase integration so setup can be completed for you.
2. From this folder, link the project and apply `supabase/migrations/202609270001_night_market.sql` with `supabase db push`.
3. Set Edge Function secrets `NIGHT_MARKET_SITE_URL=https://colourfour.github.io/night-market/` and `NIGHT_MARKET_TEACHER_KEY` to a random 48-character lowercase hexadecimal key. Keep this key privately. Use a local ignored `.env` and `supabase secrets set --env-file .env`. Supabase provides its own server URL and service-role key to the function environment.
4. Deploy using `supabase functions deploy night-market --no-verify-jwt`. The function implements its own private teacher/student-token authentication; this flag does not make protected routes public. Room lookup and joining are intentionally available without an account.
5. Set the public `API_BASE` in `docs/config.js` to `https://PROJECT_REF.supabase.co/functions/v1/night-market` (no trailing slash). No secret belongs in that file.
6. Publish the updated `docs` folder to GitHub Pages from `main` / `docs`. Run the live thirteen-client acceptance test before inviting students. Backend deployment, PostgreSQL migration and mainland mobile connectivity have not yet been verified against a real Supabase project.

The database has no anonymous/authenticated table policies. Only the Edge Function service role can read or mutate game state. A versioned compare-and-swap transaction prevents simultaneous submissions from overwriting each other; a conflicting action reloads and retries. Reset/restore archives are in the same transaction. The server validates every action and strips other founders’ unrevealed choices. Teacher credentials stay in Edge Function secrets. Joining is limited to twelve attempts per seat per five minutes; room lookup has a shared limit. This implementation runs one active class room at a time.

Official references: [GitHub Pages publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [Supabase Edge Function authentication](https://supabase.com/docs/guides/functions/auth), [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Files, preview and checks

One source folder, one README. `docs/` is the public website; `supabase/` holds the migration and server function; `tests/` contains the automated checks. There is no build step or npm dependency to install.

With Node 22+ installed, run `npm run preview` from this folder and open `http://localhost:4173`. Run `npm test` for the source worked example, 90 independent scoring profiles, mechanism accounting, and thirteen concurrent simulated clients completing all six rounds with privacy, invalid/stale/duplicate actions, revision, exports and recovery checks. The simulated store tests compare-and-swap collisions; it is not evidence of a deployed PostgreSQL integration test. The existing USB edition remains available separately for a usable local network.

## Artwork

Created with the built-in imagegen tool. Final asset: `docs/assets/night-market.png`. The website reuses this single asset in the hero, venue cards and reveal. Labels and controls are real HTML, not baked into the illustration. Reduced-motion preferences disable reveal animation.

Final generation prompt:

"Use case: stylized-concept. Asset type: immersive wide hero artwork for THIRTEEN, a classroom strategy game set in a contemporary night market. Create a beautifully art-directed cinematic panoramic illustration, landscape 3:2. An elevated three-quarter view of one coherent magical-but-believable market at blue hour: on the left a lively neon-lit plaza of food stalls with cyan and coral awnings (Neon Square); in the middle an intimate jade-green garden lane with trees and warm hanging lanterns (Garden Lane); on the right a raised rooftop terrace market with violet skyline and amber festoon lights (Rooftop Row). Strong architectural silhouettes, tiny anonymous visitors for scale, luminous lanterns, rich indigo shadows, painterly editorial game illustration with subtle paper grain and sophisticated detail, not childish. Keep lower foreground and upper night sky relatively quiet for HTML overlays. All three districts clearly distinct, glowing and inviting. No text, no labels, no letters, no logos, no numbers, no watermarks, no UI, no borders."
