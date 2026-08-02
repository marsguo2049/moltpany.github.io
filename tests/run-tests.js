const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const portfolioIndexPath = path.join(root, "index.html");
const portfolioStylesPath = path.join(root, "styles.css");
const classicIndexPath = path.join(root, "classic", "index.html");
const agentsRegistryPath = path.join(root, "agents.json");
const agentsPageRoot = path.join(root, "projects", "agents");
const agentsPageIndexPath = path.join(agentsPageRoot, "index.html");
const agentsPageStylesPath = path.join(agentsPageRoot, "styles.css");

const MOZART_JOURNEY_URL = "https://moltpany.github.io/mozart-journey/";
const AGENT_MAPPY_REPOSITORY = "https://github.com/moltpany/Agent-Mappy";
const AGENT_MALIANG_REPOSITORY = "https://github.com/moltpany/Agent-Maliang";
const MAGIC_MIRROR_URL = "https://moltpany.github.io/projects/magic-mirror/";
const STUDIO_ROOM_URL = "https://moltpany.github.io/studio-room/";
const STUDIO_ROOM_REPOSITORY = "https://github.com/moltpany/studio-room";
const VISUAL_AGENT_SERIAL_PATTERN = /\b(?:mp|ob)-\d{3}\b/i;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function testPortfolioHome() {
  const html = fs.readFileSync(portfolioIndexPath, "utf8");
  assert(html.includes("MOLTPANY"), "home should foreground the Moltpany platform");
  assert(html.includes('id="agentsView"'), "home should offer the Agents roster view");
  assert(html.includes('id="worksView"'), "home should offer the independent Works archive");
  assert(html.includes('href="/classic/"'), "home should link to the preserved classic homepage");
  assert(html.includes("Agent-HR"), "home should feature Agent-HR");
  assert(html.includes("Agent-Mappy"), "home should feature Agent-Mappy");
  assert(html.includes("Agent-Bird"), "home should feature Agent-Bird");
  assert(html.includes("Agent-Maliang"), "home should feature Agent-Maliang");
  assert(html.includes("Agent-Boya"), "home should feature Agent-Boya");
  assert(html.includes("Agent-Poet"), "home should feature Agent-Poet");
  assert(html.includes("Agent-Game"), "home should feature Agent-Game");
  assert(html.includes("Magic Mirror"), "home should feature Magic Mirror");
  assert(html.includes("Studio Room"), "home should feature Studio Room");
  assert(html.includes(STUDIO_ROOM_URL), "home should link to the external Studio Room demo");
  assert(!html.includes("projects/studio-room/"), "home should not link to an in-repo Studio Room copy");
  assert(html.includes(MAGIC_MIRROR_URL), "home should link to the Magic Mirror work repository");
  assert(html.includes("agents.json"), "home should link to the machine-readable registry");
  assert(html.includes("Mozart Journey"), "home should feature Mozart Journey");
  assert(html.includes(MOZART_JOURNEY_URL), "home should link to the migrated Mozart Journey subproject");
  assert(!html.includes("projects/mozart-journey/"), "home should not link to the legacy in-repo Mozart Journey path");
  assert(!VISUAL_AGENT_SERIAL_PATTERN.test(html), "home should not show visual agent serial numbers like mp-001 or ob-001");
  assert(!html.includes("leaflet.js"), "portfolio home should not load the Mozart map application");
}

function testClassicHome() {
  assert(fs.existsSync(classicIndexPath), "classic homepage should be preserved at /classic/");
  const html = fs.readFileSync(classicIndexPath, "utf8");
  const styles = fs.readFileSync(portfolioStylesPath, "utf8");
  assert(html.includes("self-evolving agents"), "classic home should preserve the agent commons introduction");
  assert(html.includes('href="/projects/agents/"'), "classic home should use a root-safe agents page link");
  assert(html.includes(AGENT_MAPPY_REPOSITORY), "classic home should retain agent repository links");
  assert(styles.includes(".agent-card"), "shared styles should retain classic agent cards");
  assert(styles.includes(".registry-section"), "shared styles should retain the classic registry section");
}

function testAgentsRegistry() {
  const registry = readJson(agentsRegistryPath);
  assert(registry.site === "https://moltpany.github.io/", "agents registry should identify the public site");
  assert(registry.name === "Moltpany", "agents registry should identify Moltpany");
  assert(Array.isArray(registry.agents), "agents registry should include an agents array");
  assert(registry.agents.length >= 2, "agents registry should include the first public/planned agents");

  const ids = new Set();
  for (const agent of registry.agents) {
    assert(agent.id && !ids.has(agent.id), `agent id should be present and unique: ${agent.id}`);
    ids.add(agent.id);
    assert(agent.name && agent.role && agent.status, `${agent.id} should include name, role, and status`);
    assert(Array.isArray(agent.capabilities), `${agent.id} should include capabilities`);
    assert(Array.isArray(agent.works), `${agent.id} should include works`);
    assert(Array.isArray(agent.audience), `${agent.id} should include audience`);
    assert(agent.audience.includes("humans") && agent.audience.includes("agents"), `${agent.id} should address humans and agents`);
  }

  const hr = registry.agents.find((agent) => agent.id === "agent-hr");
  assert(hr, "registry should include Agent-HR");
  assert(hr.repository === "https://github.com/moltpany/Agent-HR", "Agent-HR should link to its public repository");
  assert(hr.capabilities.includes("agent-onboarding"), "Agent-HR should expose onboarding capability");

  const mappy = registry.agents.find((agent) => agent.id === "mappy");
  assert(mappy, "registry should include Agent-Mappy under stable mappy id");
  assert(mappy.name === "Agent-Mappy", "Mappy registry entry should use Agent-Mappy as the display name");
  assert(mappy.repository === AGENT_MAPPY_REPOSITORY, "Agent-Mappy should link to its public repository");
  const mozartJourney = mappy.works.find((work) => work.id === "mozart-journey");
  assert(mozartJourney, "Agent-Mappy should own Mozart Journey");
  assert(mozartJourney.url === MOZART_JOURNEY_URL, "Mozart Journey work URL should point at the migrated standalone site");

  const maliang = registry.agents.find((agent) => agent.id === "maliang");
  assert(maliang, "registry should include Agent-Maliang");
  assert(maliang.name === "Agent-Maliang", "Maliang registry entry should use Agent-Maliang as the display name");
  assert(maliang.repository === AGENT_MALIANG_REPOSITORY, "Agent-Maliang should link to its public repository");
  const magicMirror = maliang.works.find((work) => work.id === "magic-mirror");
  assert(magicMirror, "Agent-Maliang should own Magic Mirror");
  assert(magicMirror.url === MAGIC_MIRROR_URL, "Magic Mirror work URL should point at its source repository");
  const studioRoom = maliang.works.find((work) => work.id === "studio-room");
  assert(studioRoom, "Agent-Maliang should own Studio Room");
  assert(studioRoom.url === STUDIO_ROOM_URL, "Studio Room work URL should point at the public demo");
  assert(studioRoom.repository === STUDIO_ROOM_REPOSITORY, "Studio Room should link to its source repository");
}

function testAgentsPage() {
  const html = fs.readFileSync(agentsPageIndexPath, "utf8");
  const styles = fs.readFileSync(agentsPageStylesPath, "utf8");
  assert(html.includes("Moltpany agents"), "agents page should introduce the roster");
  assert(html.includes("Agent-HR"), "agents page should include Agent-HR");
  assert(html.includes("Agent-Mappy"), "agents page should include Agent-Mappy");
  assert(html.includes("Agent-Maliang"), "agents page should include Agent-Maliang");
  assert(html.includes(AGENT_MALIANG_REPOSITORY), "agents page should link to Agent-Maliang on GitHub");
  assert(html.includes("Magic Mirror"), "agents page should link Agent-Maliang to Magic Mirror");
  assert(html.includes(MAGIC_MIRROR_URL), "agents page should link to the Magic Mirror public landing page");
  assert(html.includes("Studio Room"), "agents page should link Agent-Maliang to Studio Room");
  assert(html.includes(STUDIO_ROOM_URL), "agents page should link to the Studio Room demo");
  assert(html.includes("Mozart Journey"), "agents page should link Agent-Mappy to Mozart Journey");
  assert(html.includes("../../agents.json"), "agents page should link to the machine-readable registry");
  assert(html.includes("https://github.com/moltpany/Agent-HR"), "agents page should link to Agent-HR on GitHub");
  assert(html.includes(AGENT_MAPPY_REPOSITORY), "agents page should link to Agent-Mappy on GitHub");
  assert(html.includes(MOZART_JOURNEY_URL), "agents page should link to the migrated Mozart Journey site");
  assert(!html.includes("../mozart-journey/"), "agents page should not link to the legacy sibling Mozart Journey path");
  assert(!VISUAL_AGENT_SERIAL_PATTERN.test(html), "agents page should not show visual agent serial numbers like mp-001 or ob-001");
  assert(!html.includes("leaflet.js"), "agents page should not load the Mozart map application");
  assert(styles.includes(".agent-card"), "agents page should style agent cards");
  assert(styles.includes(".registry-panel"), "agents page should style the registry panel");
}

const PRIVATE_MAGIC_MIRROR_REPO = "github.com/moltpany/magic-mirror";
const magicMirrorLandingPath = path.join(root, "projects", "magic-mirror", "index.html");

function testMagicMirrorLanding() {
  // The product repo is private; the public site must only expose a what/why landing page,
  // never link to the private source repository.
  assert(fs.existsSync(magicMirrorLandingPath), "Magic Mirror public landing page should exist");
  const landing = fs.readFileSync(magicMirrorLandingPath, "utf8");
  assert(landing.includes("Magic Mirror"), "landing page should introduce Magic Mirror");
  assert(landing.includes("private beta"), "landing page should mark Magic Mirror as private beta");
  assert(!landing.includes(PRIVATE_MAGIC_MIRROR_REPO), "landing page should not expose the private product repository");

  const home = fs.readFileSync(portfolioIndexPath, "utf8");
  const agentsPage = fs.readFileSync(agentsPageIndexPath, "utf8");
  const registryRaw = fs.readFileSync(agentsRegistryPath, "utf8");
  assert(!home.includes(PRIVATE_MAGIC_MIRROR_REPO), "home should not link to the private Magic Mirror repository");
  assert(!agentsPage.includes(PRIVATE_MAGIC_MIRROR_REPO), "agents page should not link to the private Magic Mirror repository");
  assert(!registryRaw.includes(PRIVATE_MAGIC_MIRROR_REPO), "agents.json should not expose the private Magic Mirror repository");
}

function testStudioRoomIsExternal() {
  // Studio Room ships from its own repository and is served by GitHub Pages there.
  // This site only links to it; it must not carry a local copy of the demo.
  assert(
    !fs.existsSync(path.join(root, "projects", "studio-room")),
    "Studio Room should not be vendored into the site repository",
  );

  const home = fs.readFileSync(portfolioIndexPath, "utf8");
  const agentsPage = fs.readFileSync(agentsPageIndexPath, "utf8");
  const registry = readJson(agentsRegistryPath);

  assert(home.includes("Studio Room"), "home should feature Studio Room");
  assert(home.includes(STUDIO_ROOM_URL), "home should link to the Studio Room public URL");
  assert(agentsPage.includes(STUDIO_ROOM_URL), "agents page should link to the Studio Room public URL");

  const maliang = registry.agents.find((agent) => agent.id === "maliang");
  const studioRoom = maliang.works.find((work) => work.id === "studio-room");
  assert(studioRoom.url === STUDIO_ROOM_URL, "Studio Room work URL should point at its own Pages site");
  assert(studioRoom.repository === STUDIO_ROOM_REPOSITORY, "Studio Room should link to its source repository");
}

const tests = [testPortfolioHome, testClassicHome, testAgentsRegistry, testAgentsPage, testMagicMirrorLanding, testStudioRoomIsExternal];

(async () => {
  for (const test of tests) {
    await test();
    console.log(`PASS ${test.name}`);
  }
})();
