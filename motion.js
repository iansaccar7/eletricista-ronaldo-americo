(() => {
  const root = document.documentElement;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const heading = document.querySelector("h1");
  if (heading) {
    heading.innerHTML = heading.innerHTML
      .split(/<br\s*\/?\s*>/i)
      .map((line) => `<span class="hero-line"><span>${line}</span></span>`)
      .join("");
  }
  const reveal = [
    ...document.querySelectorAll(
      ".section-head, .quotes blockquote, .gallery-grid figure, .step, .faq-list article, .service, .service-featured, .garden-strip .photo, .comparison-cover figure, .studio-photo",
    ),
  ];
  reveal.forEach((el, i) => {
    el.dataset.reveal = el.matches("figure, .photo") ? "image" : "text";
    el.style.setProperty("--reveal-delay", `${el.matches(".step") ? (i % 3) * 90 : 0}ms`);
  });
  let observer;
  const gallery = document.querySelector("body.mge #galeria");
  const track = gallery?.querySelector(".gallery-grid");
  let scheduled = false;
  function updateScroll() {
    scheduled = false;
    if (root.dataset.motion !== "enabled") return;
    if (track) {
      const wide = innerWidth > 760;
      const rect = gallery.getBoundingClientRect();
      const distance = Math.max(1, gallery.offsetHeight - innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      const travel = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
      track.style.transform = wide ? `translate3d(${-progress * travel}px,0,0)` : "";
    }
    document.querySelectorAll(".steps-grid").forEach((grid) => {
      const rect = grid.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (innerHeight * 0.7 - rect.top) / rect.height));
      grid.style.setProperty("--step-progress", progress);
    });
  }
  function requestUpdate() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateScroll);
    }
  }
  function initialize() {
    observer?.disconnect();
    if (preference.matches || !("IntersectionObserver" in window)) {
      root.dataset.motion = "reduced";
      reveal.forEach((el) => el.classList.add("is-visible"));
      if (track) track.style.transform = "";
      return;
    }
    root.dataset.motion = "enabled";
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -35px 0px" },
    );
    reveal.forEach((el) => observer.observe(el));
    updateScroll();
  }
  initialize();
  preference.addEventListener("change", initialize);
  addEventListener("scroll", requestUpdate, { passive: true });
  addEventListener("resize", requestUpdate);
  // Anchor navigation and keyboard focus must never land on hidden content.
  addEventListener("focusin", (event) =>
    event.target.closest("[data-reveal]")?.classList.add("is-visible"),
  );
})();

// Topo: lâmpada com mau contato, fio desencapado em curto e raios.
(() => {
  const hero = document.querySelector(".hero");
  const fx = hero?.querySelector(".hero-fx");
  if (!fx) return;
  const canvas = fx.querySelector(".zap");
  const ctx = canvas.getContext("2d");
  const flash = fx.querySelector(".flash");
  const tip = fx.querySelector(".wire-tip");
  const reduced = () => document.documentElement.dataset.motion !== "enabled";
  let width = 0;
  let height = 0;
  let sparks = [];
  let bolts = [];
  let glows = [];
  let running = false;
  let visible = true;

  function size() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function tipPoint() {
    const a = tip.getBoundingClientRect();
    const b = hero.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top };
  }

  // Lâmpada: sequência irregular de mau contato ao abrir, depois firma.
  function flicker() {
    const pattern = [0.1, 90, 1, 60, 0.05, 140, 0.8, 50, 0.1, 260, 1, 90, 0.3, 70, 1, 380, 0.15, 60, 1];
    let i = 0;
    (function step() {
      if (i >= pattern.length) return fx.style.setProperty("--power", 1);
      fx.style.setProperty("--power", pattern[i]);
      setTimeout(step, pattern[i + 1] ?? 0);
      i += 2;
    })();
  }

  // Faíscas: partículas com gravidade, arrasto e quique no chão do topo.
  function burst(x, y, amount) {
    for (let i = 0; i < amount; i++) {
      const angle = Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const speed = 2 + Math.random() * 6;
      sparks.push({
        x,
        y,
        px: x,
        py: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        life: 1,
        decay: 0.012 + Math.random() * 0.025,
      });
    }
    glows.push({ x, y, life: 1 });
    start();
  }
  function shortCircuit() {
    const p = tipPoint();
    const hits = 1 + ((Math.random() * 3) | 0);
    for (let i = 0; i < hits; i++) {
      setTimeout(() => {
        const q = tipPoint();
        burst(q.x, q.y, 14 + Math.random() * 22);
        bolts.push({ points: jagged(q.x, q.y, q.x + (Math.random() - 0.5) * 30, q.y + 8 + Math.random() * 14, 6), life: 1, arc: true, from: q, to: null });
      }, i * (70 + Math.random() * 120));
    }
    return p;
  }

  // Raio: deslocamento do ponto médio, com galhos e reacendimento.
  function jagged(x1, y1, x2, y2, spread) {
    let points = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    let offset = spread;
    for (let depth = 0; depth < 6; depth++) {
      const next = [points[0]];
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        next.push({ x: (a.x + b.x) / 2 + (Math.random() - 0.5) * offset, y: (a.y + b.y) / 2 + (Math.random() - 0.5) * offset * 0.4 }, b);
      }
      points = next;
      offset /= 1.9;
    }
    return points;
  }
  function lightning(x2, y2) {
    const x1 = Math.random() * width;
    const main = jagged(x1, -10, x2 ?? x1 + (Math.random() - 0.5) * width * 0.5, y2 ?? height * (0.55 + Math.random() * 0.35), width * 0.18);
    const branches = [];
    for (let i = 0; i < 3; i++) {
      const from = main[(main.length * (0.2 + Math.random() * 0.5)) | 0];
      branches.push(jagged(from.x, from.y, from.x + (Math.random() - 0.5) * 220, from.y + 60 + Math.random() * 140, 60));
    }
    bolts.push({ points: main, branches, life: 1, born: performance.now() });
    start();
  }

  function draw(points, widthPx, alpha) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.lineWidth = widthPx;
    ctx.globalAlpha = alpha;
    ctx.stroke();
  }
  function frame(now) {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    let flashLevel = 0;
    bolts = bolts.filter((b) => b.life > 0);
    for (const b of bolts) {
      if (b.arc && b.to) b.points = jagged(b.from.x, b.from.y, b.to.x, b.to.y, Math.hypot(b.to.x - b.from.x, b.to.y - b.from.y) * 0.22);
      const age = b.born ? now - b.born : 0;
      const on = b.born ? age < 70 || (age > 120 && age < 230) || age > 260 : true;
      if (on) {
        ctx.strokeStyle = "#9fb4ff";
        ctx.shadowColor = "#7f9cff";
        ctx.shadowBlur = 22;
        draw(b.points, b.arc ? 3 : 5, 0.55 * b.life);
        b.branches?.forEach((br) => draw(br, 2, 0.35 * b.life));
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffff";
        draw(b.points, b.arc ? 1 : 1.6, b.life);
        b.branches?.forEach((br) => draw(br, 0.8, 0.7 * b.life));
        if (b.born) flashLevel = Math.max(flashLevel, 0.16 * b.life);
      }
      b.life -= b.arc ? 0.08 : age > 260 ? 0.05 : 0;
    }
    glows = glows.filter((g) => (g.life -= 0.06) > 0);
    for (const g of glows) {
      const light = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, 160);
      light.addColorStop(0, `rgba(255,190,90,${0.35 * g.life})`);
      light.addColorStop(1, "rgba(255,190,90,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = light;
      ctx.fillRect(g.x - 160, g.y - 160, 320, 320);
    }
    sparks = sparks.filter((s) => s.life > 0);
    for (const s of sparks) {
      s.px = s.x;
      s.py = s.y;
      s.vx *= 0.985;
      s.vy = s.vy * 0.985 + 0.28;
      s.x += s.vx;
      s.y += s.vy;
      if (s.y > height - 4) {
        s.y = height - 4;
        s.vy *= -0.32;
        s.vx *= 0.6;
      }
      s.life -= s.decay;
      const hue = 20 + s.life * 35;
      ctx.strokeStyle = `hsl(${hue} 100% ${55 + s.life * 40}%)`;
      draw([{ x: s.px - s.vx, y: s.py - s.vy }, { x: s.x, y: s.y }], 1.6, Math.min(1, s.life * 1.4));
    }
    ctx.globalAlpha = 1;
    flash.style.opacity = flashLevel;
    if (sparks.length || bolts.length || glows.length) requestAnimationFrame(frame);
    else running = false;
  }
  function start() {
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }
  function loop(fn, min, max) {
    (function next() {
      setTimeout(() => {
        if (!reduced() && visible && !document.hidden) fn();
        next();
      }, min + Math.random() * (max - min));
    })();
  }

  size();
  addEventListener("resize", size);
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);
  if (!reduced()) flicker();
  loop(shortCircuit, 2600, 5200);
  loop(() => lightning(), 7000, 12000);
  hero.addEventListener("pointerdown", (event) => {
    if (reduced() || event.target.closest("a, button, input, select, label")) return;
    const box = hero.getBoundingClientRect();
    const to = { x: event.clientX - box.left, y: event.clientY - box.top };
    const from = tipPoint();
    const arc = { points: jagged(from.x, from.y, to.x, to.y, Math.hypot(to.x - from.x, to.y - from.y) * 0.22), life: 1, arc: true, from, to };
    bolts.push(arc);
    burst(to.x, to.y, 26);
    start();
  });
})();
