(() => {
  const scenes = [
    {
      id: "intro", tone: "blue",
      badge: { zh: "MOLT + COMPANY · 一群共同蜕变的智能体", en: "MOLT + COMPANY · AGENTS THAT EVOLVE TOGETHER" },
      eyebrow: { zh: "// 01 · 从生活出发的智能体世界", en: "// 01 · AN AGENT WORLD BORN FROM LIFE" },
      title: { zh: "让生活中的奇思妙想<br><em>长成有作品的 Agent</em>", en: "Let everyday ideas grow<br><em>into agents with a body of work</em>" },
      copy: { zh: "这是一个由生活灵感、真实作品与智能体共同组成的创作社区。作者把日常遇到的问题、兴趣和奇思妙想做成项目，再把其中形成的能力沉淀为 Skill，交给拥有自己专长和作品的 Agent。", en: "This is a creative community built from everyday ideas, real works and evolving agents. The author's questions, interests and wild ideas become projects; what each project teaches becomes a reusable Skill carried by a distinct Agent." },
      action: { zh: "认识这些 Agent", en: "Meet the agents" }, href: "#agents"
    },
    {
      id: "agents", tone: "violet",
      badge: { zh: "07 位持续成长的生活智能体", en: "07 EVOLVING LIFE AGENTS" },
      eyebrow: { zh: "// 02 · 智能体英雄阵容", en: "// 02 · THE AGENT ROSTER" },
      title: { zh: "不只在后台工作<br><em>也拥有自己的英雄形象</em>", en: "More than minds backstage<br><em>each one becomes a hero</em>" },
      copy: { zh: "每位 Agent 代表一种持续成长的能力：有自己的角色、专长、技能和代表作品。选择一位英雄，进入它的个人档案。", en: "Every Agent embodies a growing field of capability, with a character, specialty, Skills and signature works. Choose a hero and enter their archive." },
      action: { zh: "进入英雄阵容", en: "Enter the roster" }, href: "agents/"
    },
    {
      id: "works", tone: "gold",
      badge: { zh: "09 个公开项目 · 仍在持续增加", en: "09 PUBLIC WORKS · AND GROWING" },
      eyebrow: { zh: "// 03 · 全部项目与作品", en: "// 03 · THE PROJECT ARCHIVE" },
      title: { zh: "每一件作品<br><em>都是一次真实探索</em>", en: "Every work begins<br><em>as a real exploration</em>" },
      copy: { zh: "从文化旅程、观鸟档案到三维空间与可玩实验，作品独立于角色汇总展示；Agent 作为创作者、协作者和能力线索出现。", en: "From cultural journeys and bird archives to 3D spaces and playable experiments, every project stands on its own. Agents appear as its makers, collaborators and capability trails." },
      action: { zh: "浏览全部作品", en: "Browse all works" }, href: "works/"
    }
  ];

  const portal = document.querySelector(".portal");
  const sceneEls = [...document.querySelectorAll(".scene")];
  const tabs = [...document.querySelectorAll("[data-scene]")];
  const badge = document.querySelector("#badge");
  const eyebrow = document.querySelector("#eyebrow");
  const title = document.querySelector("#heroTitle");
  const copy = document.querySelector("#heroCopy");
  const origin = document.querySelector("#nameOrigin");
  const action = document.querySelector("#primaryAction");
  const languageButton = document.querySelector("#languageToggle");
  let active = 0;
  let locked = false;
  let language = localStorage.getItem("moltpany-language") === "en" ? "en" : "zh";
  let touchStart = null;

  function translateStatic() {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-zh][data-en]").forEach(el => { el.textContent = el.dataset[language]; });
    languageButton.children[0].classList.toggle("active", language === "zh");
    languageButton.children[2].classList.toggle("active", language === "en");
    languageButton.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换到中文");
    portal.classList.toggle("lang-zh", language === "zh");
    portal.classList.toggle("lang-en", language === "en");
  }

  function render() {
    const scene = scenes[active];
    portal.classList.remove("tone-blue", "tone-violet", "tone-gold");
    portal.classList.add(`tone-${scene.tone}`);
    sceneEls.forEach((el, index) => el.classList.toggle("is-active", index === active));
    tabs.forEach((tab, index) => {
      tab.classList.toggle("active", index === active);
      tab.setAttribute("aria-selected", String(index === active));
    });
    badge.textContent = scene.badge[language];
    eyebrow.textContent = scene.eyebrow[language];
    title.innerHTML = scene.title[language];
    copy.textContent = scene.copy[language];
    origin.hidden = active !== 0;
    action.firstChild.textContent = `${scene.action[language]} `;
    action.lastElementChild.textContent = active === 0 ? "→" : "↗";
    action.href = scene.href;
    translateStatic();
  }

  function selectScene(index) {
    if (locked || index === active) return;
    locked = true; active = (index + scenes.length) % scenes.length; render();
    window.setTimeout(() => { locked = false; }, 900);
  }

  tabs.forEach(tab => tab.addEventListener("click", () => selectScene(Number(tab.dataset.scene))));
  languageButton.addEventListener("click", () => {
    language = language === "zh" ? "en" : "zh";
    localStorage.setItem("moltpany-language", language);
    render();
  });
  action.addEventListener("click", event => {
    if (active === 0) { event.preventDefault(); selectScene(1); }
  });
  window.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") selectScene(active + 1);
    if (event.key === "ArrowLeft") selectScene(active - 1);
  });
  portal.addEventListener("touchstart", event => { touchStart = event.touches[0]?.clientX ?? null; }, { passive: true });
  portal.addEventListener("touchend", event => {
    if (touchStart === null) return;
    const distance = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
    if (Math.abs(distance) > 55) selectScene(active + (distance < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });

  render();
})();
