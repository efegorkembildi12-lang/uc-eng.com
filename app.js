/* Unicons Engineering — interactions */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = matchMedia('(pointer: coarse)').matches;

  /* ---------------- mouse reticle ---------------- */
  const reticle = document.getElementById('reticle');
  if (reticle && !isCoarse) {
    let tx = innerWidth / 2, ty = innerHeight / 2;
    let cx = tx, cy = ty;
    let firstMove = false;

    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      if (!firstMove) { cx = tx; cy = ty; firstMove = true; }
    }, { passive: true });

    addEventListener('pointerdown', () => reticle.classList.add('is-press'));
    addEventListener('pointerup',   () => reticle.classList.remove('is-press'));

    const tick = () => {
      // tighter lerp: 0.4 — feels live, still smooth
      cx += (tx - cx) * 0.4;
      cy += (ty - cy) * 0.4;
      reticle.style.transform = `translate(${cx - 14}px, ${cy - 14}px)`;
      requestAnimationFrame(tick);
    };
    tick();

    const hoverables = 'a, button, .svc, .tool, .step, input, select, textarea, .hud, .stat';
    document.addEventListener('pointerover', e => {
      if (e.target.closest(hoverables)) reticle.classList.add('is-hover');
    });
    document.addEventListener('pointerout', e => {
      if (e.target.closest(hoverables)) reticle.classList.remove('is-hover');
    });
  } else if (reticle) {
    reticle.style.display = 'none';
  }

  /* ---------------- particle field ---------------- */
  const pCanvas = document.getElementById('particles');
  if (pCanvas && !reduced) {
    const ctx = pCanvas.getContext('2d');
    let dpr = Math.min(devicePixelRatio || 1, 2);
    let W, H, particles;

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = pCanvas.width  = innerWidth  * dpr;
      H = pCanvas.height = innerHeight * dpr;
      pCanvas.style.width  = innerWidth  + 'px';
      pCanvas.style.height = innerHeight + 'px';
      seed();
    };
    const seed = () => {
      const count = Math.round((innerWidth * innerHeight) / 16000);
      particles = new Array(count).fill(0).map(() => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: (Math.random() * 1.2 + 0.4) * dpr,
        vx: (Math.random() - 0.5) * 0.06 * dpr,
        vy: (Math.random() - 0.5) * 0.06 * dpr,
        red: Math.random() < 0.18,
        a: Math.random() * 0.6 + 0.15,
      }));
    };
    addEventListener('resize', resize);
    resize();

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.fillStyle = p.red
          ? `rgba(207,46,46,${p.a * 0.8})`
          : `rgba(60,50,40,${p.a * 0.55})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------------- hero constellation w/ cursor influence ---------------- */
  const cCanvas = document.getElementById('constellation');
  if (cCanvas && !reduced) {
    const ctx = cCanvas.getContext('2d');
    let W, H, dpr = Math.min(devicePixelRatio || 1, 2), nodes, t = 0;
    let mx = -9999, my = -9999;
    let rotCx = 0, rotCy = 0;          // rotation centre
    const rotSpeed = 0.0015;           // radians per frame ≈ full turn / 70s

    const resizeC = () => {
      const r = cCanvas.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cCanvas.width  = r.width  * dpr;
      H = cCanvas.height = r.height * dpr;
      cCanvas.style.width  = r.width  + 'px';
      cCanvas.style.height = r.height + 'px';
      seedNodes();
    };

    const seedNodes = () => {
      const cx = W * 0.55, cy = H * 0.5;
      rotCx = cx; rotCy = cy;
      const radius = Math.min(W, H) * 0.55;
      nodes = [];
      // outer ring
      const outer = 14;
      for (let i = 0; i < outer; i++) {
        const a = (i / outer) * Math.PI * 2 + Math.random() * 0.25;
        const r = radius * (0.7 + Math.random() * 0.35);
        nodes.push({
          // home position — the anchor itself drifts (see flowOffset in loop)
          hx: cx + Math.cos(a) * r + (Math.random() - 0.5) * 18 * dpr,
          hy: cy + Math.sin(a) * r + (Math.random() - 0.5) * 18 * dpr,
          // current rendered position
          x: 0, y: 0,
          vx: 0, vy: 0,
          phase: Math.random() * Math.PI * 2,
          phase2: Math.random() * Math.PI * 2,
          size: (Math.random() * 2.4 + 1.8) * dpr,
          freq: 0.5 + Math.random() * 0.5,
          highlighted: Math.random() < 0.20,
          // softer spring + slow drift amplitudes
          stiffness: 0.006,
          damping: 0.92,
          mass: 1.3,
          flowAmp: 18 + Math.random() * 12,    // px-scale wave amplitude
          flowSpeed: 0.18 + Math.random() * 0.14,
        });
      }
      // inner cluster
      const inner = 12;
      for (let i = 0; i < inner; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = radius * (0.15 + Math.random() * 0.45);
        nodes.push({
          hx: cx + Math.cos(a) * r,
          hy: cy + Math.sin(a) * r,
          x: 0, y: 0,
          vx: 0, vy: 0,
          phase: Math.random() * Math.PI * 2,
          phase2: Math.random() * Math.PI * 2,
          size: (Math.random() * 1.8 + 1.4) * dpr,
          freq: 0.5 + Math.random() * 0.6,
          highlighted: Math.random() < 0.10,
          stiffness: 0.009,
          damping: 0.91,
          mass: 0.85,
          flowAmp: 26 + Math.random() * 18,    // inner cluster waves more
          flowSpeed: 0.22 + Math.random() * 0.18,
        });
      }
      for (const n of nodes) { n.x = n.hx; n.y = n.hy; }
    };

    addEventListener('resize', resizeC);
    resizeC();

    cCanvas.addEventListener('pointermove', e => {
      const r = cCanvas.getBoundingClientRect();
      mx = (e.clientX - r.left) * dpr;
      my = (e.clientY - r.top)  * dpr;
    });
    cCanvas.addEventListener('pointerleave', () => { mx = -9999; my = -9999; });

    const drawNodeGlow = (n, intensity) => {
      // softer halo so the node reads as a small dot, not a blob
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.size * 6);
      g.addColorStop(0,   `rgba(207,46,46,${0.40 * intensity})`);
      g.addColorStop(0.4, `rgba(207,46,46,${0.10 * intensity})`);
      g.addColorStop(1,   'rgba(207,46,46,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size * 6, 0, Math.PI * 2);
      ctx.fill();

      // crisp core dot
      ctx.fillStyle = `rgba(207,46,46,${0.95 * intensity})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // some nodes get an open ring outline (like a "selected" cell)
      if (n.highlighted) {
        ctx.strokeStyle = `rgba(207,46,46,${0.65 * intensity})`;
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size * 1.6, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawConnections = () => {
      ctx.lineWidth = 0.8 * dpr;
      const max = Math.min(W, H) * 0.45;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d  = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < max) {
            let alpha = (1 - d / max) * 0.55;
            const mxN = (a.x + b.x) / 2, myN = (a.y + b.y) / 2;
            const md = Math.hypot(mxN - mx, myN - my);
            if (md < 90 * dpr) alpha = Math.min(0.95, alpha + (1 - md / (90 * dpr)) * 0.55);
            ctx.strokeStyle = `rgba(207,46,46,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    };

    // line from cursor to the nearest node (when cursor is over the canvas)
    const drawCursorLink = () => {
      if (mx < 0 || my < 0) return;
      let nearest = null, bestD = Infinity;
      for (const n of nodes) {
        const dx = n.x - mx, dy = n.y - my;
        const d = Math.hypot(dx, dy);
        if (d < bestD) { bestD = d; nearest = n; }
      }
      if (!nearest || bestD > 220 * dpr) return;
      ctx.strokeStyle = `rgba(207,46,46,${0.6 * (1 - bestD / (220 * dpr))})`;
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([3 * dpr, 3 * dpr]);
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(nearest.x, nearest.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(207,46,46,0.5)';
      ctx.beginPath();
      ctx.arc(mx, my, 6 * dpr, 0, Math.PI * 2);
      ctx.stroke();
    };

    const loopC = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.013;

      // ----- physics step: drifting + rotating anchor + heavy cursor repulsion -----
      const cursorRadius   = 320 * dpr;
      const cursorStrength = 1.6;
      // global slow rotation around the cluster centre — like a planet turning
      const rotAngle = t * rotSpeed * 60;   // t increments by 0.013/frame, scale up for visible turn
      const rcos = Math.cos(rotAngle);
      const rsin = Math.sin(rotAngle);
      for (const n of nodes) {
        // rotate the home anchor around (rotCx, rotCy)
        const relX = n.hx - rotCx;
        const relY = n.hy - rotCy;
        const rhx = rotCx + relX * rcos - relY * rsin;
        const rhy = rotCy + relX * rsin + relY * rcos;
        // and let it drift in a slow Lissajous wave on top — the "flow"
        const ax = rhx + Math.sin(t * n.flowSpeed + n.phase)         * n.flowAmp * dpr;
        const ay = rhy + Math.cos(t * n.flowSpeed * 0.85 + n.phase2) * n.flowAmp * 0.7 * dpr;

        // weaker spring while cursor is influencing this node — heavier wave
        let stiff = n.stiffness;
        let damp  = n.damping;

        // cursor repulsion: nodes push AWAY like a heavy rubber sheet
        let fx = 0, fy = 0;
        if (mx > 0 && my > 0) {
          const dx = n.x - mx, dy = n.y - my;
          const dist = Math.hypot(dx, dy) || 0.0001;
          if (dist < cursorRadius) {
            const falloff = 1 - dist / cursorRadius;
            // ease-out cubic — strong near cursor, gentle at edge
            const force = cursorStrength * falloff * falloff * falloff;
            fx = (dx / dist) * force * 26 * dpr / n.mass;
            fy = (dy / dist) * force * 26 * dpr / n.mass;
            // soften spring while disturbed → recovery is heavier, slower
            stiff *= 0.35;
            damp  = Math.min(0.97, n.damping + 0.05);
          }
        }

        const sx = (ax - n.x) * stiff;
        const sy = (ay - n.y) * stiff;

        n.vx = (n.vx + sx + fx) * damp;
        n.vy = (n.vy + sy + fy) * damp;
        n.x += n.vx;
        n.y += n.vy;
      }

      drawConnections();
      drawCursorLink();
      for (const n of nodes) {
        const base = 0.5 + 0.5 * Math.sin(t * n.freq + n.phase);
        const dx = n.x - mx, dy = n.y - my;
        const d = Math.hypot(dx, dy);
        const cursorBoost = d < 140 * dpr ? (1 - d / (140 * dpr)) * 0.95 : 0;
        const intensity = Math.min(1.6, base + cursorBoost);
        drawNodeGlow(n, intensity);
      }
      requestAnimationFrame(loopC);
    };
    loopC();
  }

  /* ---------------- live UTC+3 clock ---------------- */
  const clock = document.getElementById('hudClock');
  if (clock) {
    const fmt = n => String(n).padStart(2, '0');
    const tick = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const ist = new Date(utc + 3 * 3600000);
      clock.textContent = `${fmt(ist.getHours())}:${fmt(ist.getMinutes())}:${fmt(ist.getSeconds())} UTC+3`;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- jittering grid frequency w/ flash ---------------- */
  const freq = document.getElementById('freqVal');
  if (freq && !reduced) {
    const valueEl = freq.parentElement;
    setInterval(() => {
      const v = (49.93 + Math.random() * 0.14).toFixed(2);
      freq.textContent = v;
      if (valueEl) {
        valueEl.classList.add('is-flash');
        setTimeout(() => valueEl.classList.remove('is-flash'), 380);
      }
    }, 850);
  }

  /* capacity oscillates around 2.4 GW */
  const capCard = document.querySelector('.hud-cap .hud-value');
  if (capCard && !reduced) {
    let base = 2.4;
    setInterval(() => {
      const v = (base + (Math.random() - 0.5) * 0.12).toFixed(2);
      capCard.textContent = `${v} GW`;
    }, 2200);
  }

  /* ---------------- scroll progress ---------------- */
  const fill = document.getElementById('scrollFill');
  const heroEl = document.querySelector('.hero');
  const coordsEl = document.querySelector('.hud-coords');

  /* construction (build) animation in About section — driven by scroll */
  const buildEl = document.getElementById('buildAnim');
  const buildPctEl = document.getElementById('buildPct');
  const buildPaths = buildEl ? Array.from(buildEl.querySelectorAll('.b-line')) : [];
  const buildLabels = buildEl ? Array.from(buildEl.querySelectorAll('.b-label')) : [];
  let buildSteps = 0;
  if (buildPaths.length) {
    for (const p of buildPaths) {
      try {
        const len = Math.max(1, Math.ceil(p.getTotalLength()));
        p.style.setProperty('--len', len);
        p.style.setProperty('--off', len);
      } catch (_e) {
        p.style.setProperty('--len', 200);
        p.style.setProperty('--off', 200);
      }
    }
    const allSteps = [
      ...buildPaths.map(p => +p.dataset.step || 0),
      ...buildLabels.map(l => +l.dataset.step || 0),
    ];
    buildSteps = 1 + Math.max(...allSteps);
  }

  if (fill || coordsEl || buildEl) {
    const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (fill) {
        const pct = max > 0 ? Math.min(scrollY / max, 1) : 0;
        fill.style.height = (pct * 100) + 'vh';
      }
      if (coordsEl && heroEl) {
        const heroBottom = heroEl.offsetTop + heroEl.offsetHeight - 80;
        coordsEl.classList.toggle('is-hidden', scrollY > heroBottom);
      }

      /* build animation — progress tied to the figure's own viewport position
         so it always completes while the figure is fully visible            */
      if (buildEl && buildPaths.length) {
        const rect = buildEl.getBoundingClientRect();
        const figH = rect.height || 220;
        // 0% when figure's top is at the bottom of the viewport (just entering)
        // 100% when figure's BOTTOM is at 75% of viewport (figure mostly above-the-fold)
        const startTop = innerHeight;                  // entering from below
        const endTop   = innerHeight * 0.75 - figH;    // bottom-of-figure at 75% mark
        const raw      = (startTop - rect.top) / Math.max(1, startTop - endTop);
        const p        = Math.max(0, Math.min(1, raw));

        for (const path of buildPaths) {
          const step = +path.dataset.step || 0;
          const segStart = step / buildSteps;
          const segEnd   = (step + 1) / buildSteps;
          const local    = Math.max(0, Math.min(1, (p - segStart) / (segEnd - segStart)));
          const eased    = easeOutCubic(local);
          const len      = parseFloat(path.style.getPropertyValue('--len')) || 200;
          path.style.setProperty('--off', (1 - eased) * len);
          if (path.classList.contains('b-fill')) {
            path.style.setProperty('--fillop', eased);
          }
        }
        for (const lbl of buildLabels) {
          const step = +lbl.dataset.step || 0;
          const trigger = (step + 0.6) / buildSteps;
          lbl.classList.toggle('is-on', p >= trigger);
        }
        if (buildPctEl) buildPctEl.textContent = Math.round(p * 100) + '%';
      }
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- marquee track ---------------- */
  const track = document.getElementById('marqueeTrack');
  if (track) {
    const items = [
      'PLC / SCADA',
      'Enerji Analizi',
      'GES Tasarımı',
      'AutoCAD Electrical',
      'ETAP Simülasyonu',
      'Endüstriyel Tesisat',
      'KNX / DALI',
      'Topraklama',
      'Trafo Merkezi',
      'EPLAN Pano',
    ];
    const seq = items
      .map((s, i) => `<span class="${i % 2 ? 'alt' : ''}">${s}</span>`)
      .join('');
    track.innerHTML = seq + seq;
  }

  /* ---------------- stats: count-up + bar reveal ---------------- */
  const stats = document.querySelectorAll('.stat');
  if ('IntersectionObserver' in window && stats.length) {
    const animateNumber = (numEl, target, suffix, duration = 1400) => {
      const start = performance.now();
      const easeOut = (x) => 1 - Math.pow(1 - x, 3);
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const v = Math.round(easeOut(t) * target);
        numEl.innerHTML = `${v}<span>${suffix}</span>`;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          const numEl = e.target.querySelector('.stat-num');
          if (numEl && !numEl.dataset.done) {
            numEl.dataset.done = '1';
            const raw = numEl.textContent.trim();
            const m = raw.match(/^(\d+)(.*)$/);
            if (m) {
              const target = parseInt(m[1], 10);
              const suffix = m[2];
              animateNumber(numEl, target, suffix);
            }
          }
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    stats.forEach(el => io.observe(el));
  }

  /* ---------------- generic reveal-on-scroll ---------------- */
  const revealEls = [
    ...document.querySelectorAll('.about, .services-head, .tech-left, .contact-left'),
  ];
  document.querySelectorAll('.about').forEach(el => el.classList.add('reveal'));
  document.querySelectorAll('.services-head').forEach(el => el.classList.add('reveal'));
  document.querySelectorAll('.tech-left').forEach(el => el.classList.add('reveal'));
  document.querySelectorAll('.contact-left').forEach(el => el.classList.add('reveal'));
  document.querySelectorAll('.contact-form').forEach(el => el.classList.add('reveal'));
  document.querySelectorAll('.topology').forEach(el => el.classList.add('reveal'));
  document.querySelectorAll('.tools').forEach(el => el.classList.add('reveal-stagger'));
  document.querySelectorAll('.services-grid').forEach(el => el.classList.add('reveal-stagger'));
  document.querySelectorAll('.values').forEach(el => el.classList.add('reveal-stagger'));

  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io2.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io2.observe(el));
  }

  /* ---------------- steps: activate on hover (no auto-cycle) ---------------- */
  const steps = document.querySelectorAll('.step');
  steps.forEach((step, i) => {
    step.addEventListener('pointerenter', () => {
      steps.forEach(s => s.classList.remove('is-active'));
      step.classList.add('is-active');
    });
  });

  /* ---------------- topology: traveling pulse along paths ---------------- */
  const topoSvg = document.querySelector('.topo-svg');
  if (topoSvg && !reduced) {
    const ns = 'http://www.w3.org/2000/svg';
    const pathDefs = [
      'M250 78 V124', 'M250 160 V200',
      'M250 200 H160 V232', 'M250 200 H340 V232',
      'M160 268 V300 H110', 'M160 268 V300 H210',
      'M340 268 V300 H290', 'M340 268 V300 H390',
    ];

    // first define every path (transparent — only used as motion track)
    pathDefs.forEach((d, i) => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'transparent');
      path.setAttribute('id', `topo-p${i}`);
      topoSvg.appendChild(path);
    });

    // only attach a traveling pulse to a few paths so it stays calm —
    // and stagger their start times so they never crowd a label at once
    const pulsePaths = [0, 2, 5, 7];
    pulsePaths.forEach((idx, k) => {
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('r', '2');
      dot.setAttribute('fill', '#cf2e2e');
      dot.setAttribute('class', 'topo-pulse');
      topoSvg.appendChild(dot);

      const motion = document.createElementNS(ns, 'animateMotion');
      motion.setAttribute('dur', `${3 + (k * 0.3)}s`);
      motion.setAttribute('repeatCount', 'indefinite');
      motion.setAttribute('begin', `${k * 0.7}s`);
      const mp = document.createElementNS(ns, 'mpath');
      mp.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#topo-p${idx}`);
      motion.appendChild(mp);
      dot.appendChild(motion);
    });
  }

  /* ---------------- circuit-board background canvas (full hero width) ---------------- */
  const circuit = document.getElementById('circuit');
  if (circuit && !reduced) {
    const ctx = circuit.getContext('2d');
    let W, H, dpr = Math.min(devicePixelRatio || 1, 2);
    let traces = [];   // each trace: array of {x,y} segments
    let pulses = [];   // each pulse: { trace, t, speed, phase, color }

    const resizeC = () => {
      const r = circuit.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = circuit.width  = r.width  * dpr;
      H = circuit.height = r.height * dpr;
      circuit.style.width  = r.width  + 'px';
      circuit.style.height = r.height + 'px';
      seedTraces();
    };

    // PCB-style routing: grid-aligned, 90° turns only, with vias and pads
    let pads = [];
    let vias = [];
    const seedTraces = () => {
      traces = [];
      pads = [];
      vias = [];
      // grid step in CSS pixels — ~52px feels like a real PCB
      const step = 52 * dpr;
      const cols = Math.floor(W / step);
      const rows = Math.floor(H / step);

      // helper: snap a value to the grid
      const snap = (v) => Math.round(v / step) * step;

      // 1) drop a few "component pads" — small rectangles placed on the grid,
      //    these act like ICs / connectors that traces flow into
      const padCount = Math.max(3, Math.floor((cols * rows) / 28));
      for (let p = 0; p < padCount; p++) {
        const cx = snap((1 + Math.floor(Math.random() * (cols - 2))) * step);
        const cy = snap((1 + Math.floor(Math.random() * (rows - 2))) * step);
        const wPad = (3 + Math.floor(Math.random() * 3)) * step;   // 3-5 grid cells wide
        const hPad = (1 + Math.floor(Math.random() * 2)) * step;   // 1-2 cells tall
        pads.push({ x: cx, y: cy, w: wPad, h: hPad });
        // pin pads — small dots along the long edges
        const pins = Math.floor(wPad / step);
        for (let pi = 0; pi <= pins; pi++) {
          const px = cx + pi * (wPad / pins);
          vias.push({ x: px, y: cy });
          vias.push({ x: px, y: cy + hPad });
        }
      }

      // 2) generate traces — each trace is a sequence of grid points
      //    visiting only horizontal/vertical neighbours
      const traceCount = Math.max(5, Math.min(9, Math.floor(rows * 0.9)));
      for (let t = 0; t < traceCount; t++) {
        let cx = -step;
        let cy = snap((0.5 + Math.floor(Math.random() * (rows - 1))) * step + (Math.random() - 0.5) * 6 * dpr);
        const seg = [{ x: cx, y: cy }];
        // walk right with occasional vertical detours, all snapped to grid
        let safety = 0;
        while (cx < W + step && safety++ < 30) {
          // horizontal segment
          const hLen = (1 + Math.floor(Math.random() * 4)) * step;
          cx += hLen;
          seg.push({ x: cx, y: cy });
          vias.push({ x: cx, y: cy });
          // optional vertical detour
          if (Math.random() < 0.5 && cx < W) {
            const vLen = ((Math.random() < 0.5) ? -1 : 1) * (1 + Math.floor(Math.random() * 2)) * step;
            cy += vLen;
            seg.push({ x: cx, y: cy });
            vias.push({ x: cx, y: cy });
          }
        }
        seg.push({ x: W + step, y: cy });
        traces.push(seg);
      }

      // 3) one slow pulse per trace
      pulses = [];
      traces.forEach((trace, i) => {
        pulses.push({
          traceIdx: i,
          t: Math.random(),
          speed: 0.00006 + Math.random() * 0.00008,
          dir: 1,
        });
      });
    };

    addEventListener('resize', resizeC);
    resizeC();

    // polyline length helpers
    const traceLen = (t) => {
      let L = 0;
      for (let i = 1; i < t.length; i++) {
        L += Math.hypot(t[i].x - t[i - 1].x, t[i].y - t[i - 1].y);
      }
      return L;
    };
    const pointAt = (t, dist) => {
      for (let i = 1; i < t.length; i++) {
        const dx = t[i].x - t[i - 1].x, dy = t[i].y - t[i - 1].y;
        const seg = Math.hypot(dx, dy);
        if (dist <= seg) {
          const f = dist / seg;
          return { x: t[i - 1].x + dx * f, y: t[i - 1].y + dy * f };
        }
        dist -= seg;
      }
      return t[t.length - 1];
    };

    let last = performance.now();
    const loop = (now) => {
      const dt = now - last;
      last = now;
      ctx.clearRect(0, 0, W, H);

      // 1) PCB component pads — outlined rectangles, very faint
      ctx.strokeStyle = 'rgba(40,30,20,0.05)';
      ctx.lineWidth = 1 * dpr;
      for (const p of pads) {
        ctx.strokeRect(p.x, p.y, p.w, p.h);
      }

      // 2) PCB traces — grid-aligned, right-angle only
      ctx.lineWidth = 1 * dpr;
      ctx.strokeStyle = 'rgba(40,30,20,0.05)';
      ctx.lineJoin = 'miter';
      for (const tr of traces) {
        ctx.beginPath();
        ctx.moveTo(tr[0].x, tr[0].y);
        for (let i = 1; i < tr.length; i++) ctx.lineTo(tr[i].x, tr[i].y);
        ctx.stroke();
      }

      // 3) vias — small solid dots, soft ring
      ctx.fillStyle = 'rgba(40,30,20,0.10)';
      for (const v of vias) {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(40,30,20,0.06)';
      ctx.lineWidth = 1 * dpr;
      for (const v of vias) {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 3.6 * dpr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2) traveling pulses — slow, single per trace, gentle glow
      for (const p of pulses) {
        p.t += p.speed * dt * p.dir;
        if (p.t > 1) p.t -= 1;
        if (p.t < 0) p.t += 1;
        const tr = traces[p.traceIdx];
        const L  = traceLen(tr);
        const pt = pointAt(tr, p.t * L);

        // soft halo
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 9 * dpr);
        g.addColorStop(0, 'rgba(207,46,46,0.32)');
        g.addColorStop(1, 'rgba(207,46,46,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 9 * dpr, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = 'rgba(207,46,46,0.85)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------------- sparkline (load distribution over 24h) ---------------- */
  const spark = document.getElementById('sparkline');
  const peakEl = document.getElementById('sparkPeak');
  if (spark && !reduced) {
    const ctx = spark.getContext('2d');
    let dpr = Math.min(devicePixelRatio || 1, 2);
    let W = spark.width = spark.offsetWidth * dpr;
    let H = spark.height = spark.offsetHeight * dpr;
    spark.style.width  = (W / dpr) + 'px';
    spark.style.height = (H / dpr) + 'px';

    // 24 sample points
    const N = 24;
    let series = new Array(N).fill(0).map((_, i) => {
      // synthetic daily curve: low at night, peaks around midday & evening
      const hour = (i / N) * 24;
      const day  = Math.exp(-Math.pow(hour - 13, 2) / 18);
      const eve  = Math.exp(-Math.pow(hour - 19.5, 2) / 8);
      const noise = (Math.random() - 0.5) * 0.05;
      return Math.max(0.15, 0.4 + day * 0.45 + eve * 0.55 + noise);
    });
    const updatePeak = () => {
      const pk = Math.max(...series);
      if (peakEl) peakEl.textContent = (pk * 2).toFixed(2) + ' GW';
    };
    updatePeak();

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const max = Math.max(...series, 1);
      const min = Math.min(...series, 0);
      const stepX = W / (N - 1);
      const yFor = (v) => H - 4 * dpr - ((v - min) / (max - min || 1)) * (H - 10 * dpr);

      // baseline
      ctx.strokeStyle = 'rgba(40,30,20,0.10)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(0, H - 1);
      ctx.lineTo(W, H - 1);
      ctx.stroke();

      // area fill
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let i = 0; i < N; i++) ctx.lineTo(i * stepX, yFor(series[i]));
      ctx.lineTo(W, H);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(207,46,46,0.28)');
      grad.addColorStop(1, 'rgba(207,46,46,0)');
      ctx.fillStyle = grad;
      ctx.fill();

      // line
      ctx.strokeStyle = '#cf2e2e';
      ctx.lineWidth = 1.4 * dpr;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = i * stepX, y = yFor(series[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // peak dot
      let pIdx = 0; for (let i = 1; i < N; i++) if (series[i] > series[pIdx]) pIdx = i;
      ctx.fillStyle = '#cf2e2e';
      ctx.beginPath();
      ctx.arc(pIdx * stepX, yFor(series[pIdx]), 2.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
    };
    draw();

    // shift series every 1.6s — simulates the chart updating in real time
    setInterval(() => {
      series.shift();
      const last = series[series.length - 1];
      const drift = (Math.random() - 0.5) * 0.18;
      series.push(Math.max(0.18, Math.min(0.98, last + drift)));
      updatePeak();
      draw();
    }, 1600);
  }

  /* ---------------- status cells grid (24 indicators) ---------------- */
  const cells = document.getElementById('hudCells');
  const activeCount = document.getElementById('activeCount');
  if (cells) {
    const N = 24;
    for (let i = 0; i < N; i++) {
      const el = document.createElement('span');
      el.classList.add('is-on');
      cells.appendChild(el);
    }
    if (!reduced) {
      const all = cells.querySelectorAll('span');
      setInterval(() => {
        const i = Math.floor(Math.random() * N);
        const el = all[i];
        el.classList.remove('is-on', 'is-warn', 'is-off');
        const r = Math.random();
        const cls = r < 0.86 ? 'is-on' : r < 0.97 ? 'is-warn' : 'is-off';
        el.classList.add(cls);
        if (activeCount) {
          const onCount = cells.querySelectorAll('.is-on').length;
          activeCount.textContent = onCount;
        }
      }, 600);
    }
  }

  /* ---------------- mark hero loaded so CSS can re-trigger if needed ---------------- */
  document.documentElement.classList.add('is-loaded');
})();
