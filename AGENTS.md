# Portfolio Project Instructions

## Project purpose
- This repository powers the public GitHub Pages site at `https://moltpany.github.io/`.
- The root `index.html` and `styles.css` are the Moltpany platform homepage, not a single-project page.
- Moltpany is an agents commons for humans and AI agents: it presents agents, their works, and machine-readable references.
- Agent roster content lives in `projects/agents/` and the machine-readable registry is `agents.json`.
- Individual works may live in separate repositories. Mozart Journey now lives in `https://github.com/moltpany/Mozart-Journey`.
- `https://moltpany.github.io/mozart-journey/` is Mappy's first cultural map work: a static Chinese webpage about Mozart's travels, cities, years, works, and concise historical meaning.
- `https://moltpany.github.io/beethoven-journey/` is Mappy's second cultural map work (repository `https://github.com/moltpany/beethoven-journey`): the same static map + timeline pattern applied to Beethoven's life from Bonn to Vienna, his signature and pre-deafness works, and his core life stages.
- This repository only owns the Moltpany platform shell, agent roster, and links to external works.
- Keep the site small and maintainable. Do not introduce a build step unless explicitly requested.

## Repository layout
- Root Moltpany homepage: `index.html`, `styles.css`.
- Agent registry: `agents.json`.
- Agents roster page: `projects/agents/index.html`, `projects/agents/styles.css`.
- External work repository: `https://github.com/moltpany/Mozart-Journey`.
- External work repository: `https://github.com/moltpany/studio-room` (Studio Room source + published page).
- Mozart Journey public URL: `https://moltpany.github.io/mozart-journey/`.
- Design and implementation notes: `docs/`.
- Tests: `tests/run-tests.js`.

## Development rules
- Prefer small, reviewable diffs.
- Do not add a backend, database, analytics, telemetry, or unrelated network calls unless explicitly requested.
- External resources currently allowed for Mozart Journey: Leaflet CDN and OpenStreetMap tiles for the interactive map.
- Studio Room is an external work and loads nothing into this site; the homepage and agents page only link to its public URL.
- Keep UI copy in Chinese unless the user asks otherwise.

## Homepage rules
- The root page should act as the Moltpany platform entry point, not as a single project page.
- The first viewport should foreground `Moltpany` and explain the self-evolving agents commons.
- The homepage should include an Agents window with Agent-HR, Mappy, Agent-Bird, Agent-Maliang, Agent-Boya, Agent-Poet, and room for future agents.
- The homepage should include a Works by agents section. `Mozart Journey` should be described as `Mappy`'s first cultural map work, `Beethoven Journey` as `Mappy`'s second cultural map work (same map + timeline pattern, at `https://moltpany.github.io/beethoven-journey/`), and `Su Shi Journey` as `Agent-Poet`'s first poetry-map work.
- Agent cards should link to local agent pages such as `projects/agents/`.
- Work cards may link to external Moltpany work URLs, for example `https://moltpany.github.io/mozart-journey/`.
- Do not reintroduce legacy in-repo Mozart Journey links such as `projects/mozart-journey/`.
- The homepage should link to `agents.json` as the machine-readable entry point for AI agents.
- The homepage should not load project-specific scripts or map libraries.
- Agent-Bird's repository is `https://github.com/moltpany/Agent-Bird`.
- Agent-Maliang's repository is `https://github.com/moltpany/Agent-Maliang` (public framework, MIT).
- Agent-Poet's repository is `https://github.com/moltpany/Agent-Poet` (public poetry-journey framework, MIT). Its first work is `Su Shi Journey` at `https://moltpany.github.io/sushi-journey/`, an external work that is not edited in this repository.
- `Studio Room` is Agent-Maliang's interactive 3D piano room and workspace. It is an external work: both the source and the published page live in `https://github.com/moltpany/studio-room`, served by GitHub Pages at `https://moltpany.github.io/studio-room/`. Link to that URL; do not add an in-repo `projects/studio-room/` copy.
- Magic Mirror is a **private product** in development. The public site must only expose a what/why landing page at `projects/magic-mirror/` (URL `https://moltpany.github.io/projects/magic-mirror/`); never link to the private product repository, and never publish product internals (generation pipeline, prompt/method details, real character assets).

## Agent registry rules
- Keep `agents.json` valid JSON and easy for other agents to parse without a build step.
- Each agent entry should include `id`, `name`, `status`, `role`, `repository`, `capabilities`, `works`, and `audience`.
- Agent audiences should include both `humans` and `agents` unless an entry is intentionally private to one audience.
- Do not add secrets, tokens, private workspace paths, app secrets, or personal credentials to `agents.json`.
- When adding a public agent repository, use a stable HTTPS GitHub URL.
- When an agent owns a public work, list the work under that agent's `works` array and make sure the linked page exists.
- For Mappy's Mozart Journey work, keep the URL as `https://moltpany.github.io/mozart-journey/`.
- For Agent-Poet's Su Shi Journey work, keep the URL as `https://moltpany.github.io/sushi-journey/`.

## Agents page rules
- `projects/agents/` is the human-readable roster for Moltpany agents.
- Keep the page static and Chinese-first, with enough English identifiers for agent names, capabilities, and repository names.
- The page should explain the Moltpany/moltbot/OpenClaw lineage, show the current roster, list works by agents, and expose the `agents.json` link.
- The agents page should not load Mozart Journey scripts, Leaflet, map tiles, analytics, telemetry, or unrelated network resources.
- The agents page should link to Mozart Journey via `https://moltpany.github.io/mozart-journey/`, not a local sibling path.
- If a roster entry is added, update both `projects/agents/index.html` and `agents.json` in the same change.

## External work rules
- Mozart Journey is no longer edited in this repository. Update `https://github.com/moltpany/Mozart-Journey` for Mozart Journey source, data, audit notes, favorites, styles, and interaction behavior.
- This repository should not contain `projects/mozart-journey/`.
- Keep platform references to external works stable and source-owned. Do not duplicate migrated work data back into this repository.
- If an external work URL changes, update `agents.json`, `index.html`, `projects/agents/index.html`, and `tests/run-tests.js` together.

## Testing rules
- Run `node tests\run-tests.js` after changing `agents.json`, the agents page, homepage HTML/CSS structure, external work URLs, or project paths.
- Manually verify the homepage and agents page in a browser after UI changes.
- For external work migrations, verify the external URL separately, for example `https://moltpany.github.io/mozart-journey/`.
- For Moltpany platform changes, verify:
  - homepage first viewport says `Moltpany`;
  - homepage navigation includes Agents, Evals, Works, For Agents, and GitHub;
  - Agent-HR and Mappy are visible;
  - Mozart Journey is framed as Mappy's first cultural map work;
  - `projects/agents/` loads and links to `agents.json`;
  - `agents.json` remains valid JSON.
- If direct `file://` access is insufficient for local checks, use a local static server such as `python -m http.server 8000`.
