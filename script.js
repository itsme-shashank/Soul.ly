/* ═══════════════════════════
   SOULLY  |  script.js
═══════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Nav scroll shrink ── */
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  /* ── Language switcher ── */
  const lBtn   = document.getElementById('langBtn');
  const lMenu  = document.getElementById('lMenu');
  const lArrow = document.getElementById('lArrow');
  const lFlag  = document.getElementById('lFlag');
  const lCode  = document.getElementById('lCode');

  lBtn.addEventListener('click', e => {
    e.stopPropagation();
    lMenu.classList.toggle('open');
    lArrow.classList.toggle('open');
  });
  document.addEventListener('click', () => {
    lMenu.classList.remove('open');
    lArrow.classList.remove('open');
  });
  document.querySelectorAll('.lang-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.lang-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      lFlag.textContent = item.dataset.flag;
      lCode.textContent = item.dataset.code;
      lMenu.classList.remove('open');
      lArrow.classList.remove('open');
    });
  });

  /* ── Persona selector ── */
  window.selectPersona = (el, name, role) => {
    document.querySelectorAll('.persona').forEach(p => p.classList.remove('on'));
    el.classList.add('on');
    const pName = document.getElementById('prevName');
    const pRole = document.getElementById('prevRole');
    if (pName) pName.textContent = name;
    if (pRole) pRole.textContent = role;
    spawnParticles(el);
  };

  /* ═══════════════════════════════════════
     PERSONA VOICE PREVIEW AUDIO PLAYER
  ═══════════════════════════════════════ */
  let activeAudio    = null;   // current Audio object
  let activePersonaId = null;  // 'aria' | 'kai' | 'sol'
  let progressTimer  = null;

  /* Format seconds → "m:ss" */
  function fmtTime(secs) {
    if (!isFinite(secs) || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /* Show/update progress bar UI */
  function showProgress(name, icon) {
    const wrap = document.getElementById('audioProgressWrap');
    const nameEl = document.getElementById('audioPlayingName');
    const avaEl  = document.getElementById('audioAvaIcon');
    if (wrap)   wrap.style.display = 'block';
    if (nameEl) nameEl.textContent = `Listening to ${name}…`;
    if (avaEl)  avaEl.textContent  = icon;
  }

  function hideProgress() {
    const wrap = document.getElementById('audioProgressWrap');
    if (wrap) wrap.style.display = 'none';
    const bar = document.getElementById('audioProgressBar');
    if (bar)  bar.style.width = '0%';
    const ct  = document.getElementById('audioCurrentTime');
    if (ct)   ct.textContent = '0:00';
  }

  function updateProgressBar() {
    if (!activeAudio) return;
    const pct = activeAudio.duration
      ? (activeAudio.currentTime / activeAudio.duration) * 100
      : 0;
    const bar = document.getElementById('audioProgressBar');
    const ct  = document.getElementById('audioCurrentTime');
    const dur = document.getElementById('audioDuration');
    if (bar) bar.style.width = pct + '%';
    if (ct)  ct.textContent  = fmtTime(activeAudio.currentTime);
    if (dur) dur.textContent = fmtTime(activeAudio.duration);
  }

  /* Set a play button to "playing" state (animated wave bars) */
  function setPlayingState(id) {
    const btn = document.querySelector(`#vp-icon-${id}`)?.parentElement;
    if (!btn) return;
    btn.classList.add('playing');
    btn.innerHTML = `<div class="vp-waves">
      <div class="vp-wave-bar"></div>
      <div class="vp-wave-bar"></div>
      <div class="vp-wave-bar"></div>
      <div class="vp-wave-bar"></div>
      <div class="vp-wave-bar"></div>
    </div>`;
  }

  /* Reset a play button back to ▶ state */
  function resetPlayBtn(id) {
    const btn = document.getElementById(`vp-icon-${id}`)?.parentElement;
    if (!btn) return;
    btn.classList.remove('playing');
    btn.innerHTML = `<span class="vp-icon" id="vp-icon-${id}">▶</span>`;
  }

  /* Stop whatever is playing */
  window.stopPersonaAudio = function() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
    if (activePersonaId) { resetPlayBtn(activePersonaId); activePersonaId = null; }
    hideProgress();
  };

  /* Main: play/pause a persona voice sample */
  window.playPersonaAudio = function(event, src, id, name, icon) {
    event.stopPropagation(); // don't trigger selectPersona on button click

    // If same persona is playing → stop
    if (activePersonaId === id && activeAudio && !activeAudio.paused) {
      stopPersonaAudio();
      return;
    }

    // Stop any currently playing audio
    stopPersonaAudio();

    // Create new audio
    const audio = new Audio(src);
    activeAudio     = audio;
    activePersonaId = id;

    // Show UI
    setPlayingState(id);
    showProgress(name, icon);

    // Wire up events
    audio.addEventListener('loadedmetadata', () => {
      const dur = document.getElementById('audioDuration');
      if (dur) dur.textContent = fmtTime(audio.duration);
    });

    audio.addEventListener('timeupdate', updateProgressBar);

    audio.addEventListener('ended', () => {
      stopPersonaAudio();
    });

    audio.addEventListener('error', (e) => {
      console.warn('Audio could not load:', src, e);
      stopPersonaAudio();
      // Show friendly message instead of crashing
      const wrap = document.getElementById('audioProgressWrap');
      if (wrap) {
        wrap.style.display = 'block';
        const nameEl = document.getElementById('audioPlayingName');
        if (nameEl) nameEl.textContent = `Place ${name.toLowerCase()}.mp3 in the /audio folder`;
        const bar = document.getElementById('audioProgressBar');
        if (bar) bar.style.width = '0%';
        setTimeout(() => { if (wrap) wrap.style.display = 'none'; }, 3000);
      }
    });

    // Start progress polling as backup
    progressTimer = setInterval(updateProgressBar, 100);

    // Play
    audio.play().catch(err => {
      console.warn('Playback failed:', err);
      stopPersonaAudio();
    });
  };

  /* ── Particle burst on persona select ── */
  function spawnParticles(el) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `
        position:fixed;left:${cx}px;top:${cy}px;
        --dx:${(Math.random() - .5) * 80}px;
        background:${Math.random() > .5 ? '#0fb87e' : '#0a96cc'};
        width:${4 + Math.random() * 6}px;height:${4 + Math.random() * 6}px;
        animation-duration:${.8 + Math.random() * .5}s;
        animation-delay:${Math.random() * .2}s;
        z-index:9999;
      `;
      document.body.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }
  }

  /* ── Waitlist form ── */
  window.joinWaitlist = () => {
    const inp  = document.getElementById('emailIn');
    const note = document.getElementById('wlNote');
    const val  = inp.value.trim();
    if (!val || !val.includes('@')) {
      inp.style.borderColor = '#ff6b6b';
      inp.style.animation = 'shake .3s ease';
      setTimeout(() => { inp.style.borderColor = ''; inp.style.animation = ''; }, 1400);
      return;
    }
    const btn = document.querySelector('.wl-btn');
    btn.textContent = '🎉 You\'re in!';
    btn.style.background = 'linear-gradient(130deg,#0fb87e,#0a96cc)';
    inp.value = '';
    inp.placeholder = 'See you at launch 🌿';
    note.innerHTML = '<span>🎉 Welcome!</span> We\'ll reach out before launch.';
    spawnParticles(btn);
  };

  /* ── Scroll reveal with stagger ── */
  const revealTargets = document.querySelectorAll(
    '.stat-card,.step,.p-row,.feat-cell:not(.feat-moat),.price-card,.lang-card,.persona,.proof-card,.showcase-main,.showcase-sm,.therapist-img-wrap,.usecase-card,.trust-tile'
  );
  revealTargets.forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = `opacity .7s ease ${(i % 6) * .1}s, transform .7s ease ${(i % 6) * .1}s`;
  });
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity   = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  revealTargets.forEach(el => obs.observe(el));

  /* ── Counter animation ── */
  function animateCounter(el, target, suffix = '') {
    const duration = 1800;
    const start = performance.now();
    const isFloat = target % 1 !== 0;
    const step = ts => {
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = isFloat ? (target * ease).toFixed(1) : Math.round(target * ease);
      el.textContent = val + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        animateCounter(el, target, suffix);
        counterObs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.count-up').forEach(el => counterObs.observe(el));

  /* ── Typing animation for chat bubbles ── */
  const chatBubbles = document.querySelectorAll('.bub-aria');
  let bubbleIndex = 0;
  const messages = [
    "Hey, I'm Aria 🌿 How are you feeling right now?",
    "I remember from last week. Let's work through this together.",
    "That's completely valid. Would you like to try a breathing reset? 🫁",
  ];
  setInterval(() => {
    if (chatBubbles.length === 0) return;
    const idx = bubbleIndex % chatBubbles.length;
    chatBubbles[idx].style.opacity = '0';
    setTimeout(() => {
      chatBubbles[idx].textContent = messages[bubbleIndex % messages.length];
      chatBubbles[idx].style.transition = 'opacity .5s';
      chatBubbles[idx].style.opacity = '1';
    }, 500);
    bubbleIndex++;
  }, 4000);

  /* ── Active nav link on scroll ── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    navLinks.forEach(a => {
      a.style.color = a.getAttribute('href') === `#${current}` ? 'var(--m300)' : '';
    });
  });

  /* ── Parallax on hero orbs ── */
  window.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth - .5) * 20;
    const y = (e.clientY / window.innerHeight - .5) * 20;
    const orbA = document.querySelector('.orb-a');
    const orbB = document.querySelector('.orb-b');
    if (orbA) orbA.style.transform = `translate(${x}px,${y}px)`;
    if (orbB) orbB.style.transform = `translate(${-x}px,${-y}px)`;
  });

  /* ── Smooth scroll for all anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  console.log('✦ Soully loaded · Built with 💚');

  /* ══ Aria Demo Modal ══ */
  const demoConversation = [
    {
      opts: ["Really anxious about tomorrow…", "Can't stop overthinking", "Just feeling really low today"],
      respond: {
        "Really anxious about tomorrow…": "I hear you. Anxiety before big moments is so human 💚 Would you like to try a quick breathing exercise, or just talk it through?",
        "Can't stop overthinking": "That exhausting loop your brain gets stuck in — I know it well. Let's slow things down together. What's on your mind the most right now?",
        "Just feeling really low today": "Thank you for telling me that. You don't have to explain why. I'm here. Do you want to talk about what's been heavy, or just sit with it for a moment?"
      }
    },
    {
      opts: ["Let's try the breathing exercise", "I just want to talk", "Tell me it gets better"],
      respond: {
        "Let's try the breathing exercise": "Perfect. Let's do a 4-7-8 breath together 🫁 Breathe in for 4... hold for 7... release for 8. Ready whenever you are.",
        "I just want to talk": "Then I'm all ears 🌿 No advice unless you want it. Just me, listening. What's been going on?",
        "Tell me it gets better": "It does. Not always quickly, and not in a straight line — but it does. And you don't have to figure out the whole path right now. Just this moment. You're doing that 💚"
      }
    }
  ];
  let demoStep = 0;

  window.openAriaDemo = () => {
    demoStep = 0;
    document.getElementById('demoChat').innerHTML = '<div class="demo-bub aria-bub">Hey, I\'m Aria 🌿 How are you feeling right now?</div>';
    renderDemoOptions(demoConversation[0].opts);
    document.getElementById('demoOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeAriaDemo = () => {
    document.getElementById('demoOverlay').classList.remove('open');
    document.body.style.overflow = '';
  };

  window.closeDemoOnBg = (e) => {
    if (e.target === document.getElementById('demoOverlay')) closeAriaDemo();
  };

  function renderDemoOptions(opts) {
    const container = document.getElementById('demoOptions');
    container.innerHTML = '';
    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'demo-opt';
      btn.textContent = opt;
      btn.onclick = () => handleDemoChoice(opt);
      container.appendChild(btn);
    });
  }

  function handleDemoChoice(choice) {
    const chat = document.getElementById('demoChat');
    const step = demoConversation[demoStep];
    const uBub = document.createElement('div');
    uBub.className = 'demo-bub user-bub';
    uBub.textContent = choice;
    chat.appendChild(uBub);
    document.getElementById('demoOptions').innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    chat.scrollTop = chat.scrollHeight;
    setTimeout(() => {
      document.getElementById('demoOptions').innerHTML = '';
      const aReply = step.respond[choice] || "I'm here with you 💚";
      const aBub = document.createElement('div');
      aBub.className = 'demo-bub aria-bub';
      aBub.textContent = aReply;
      chat.appendChild(aBub);
      chat.scrollTop = chat.scrollHeight;
      demoStep++;
      if (demoStep < demoConversation.length) {
        setTimeout(() => renderDemoOptions(demoConversation[demoStep].opts), 400);
      } else {
        setTimeout(() => {
          const fin = document.createElement('div');
          fin.className = 'demo-bub aria-bub';
          fin.textContent = "This is just a glimpse 🌿 The real Aria responds in your voice, in under 1.5 seconds, and remembers everything about you. Join the waitlist to be first.";
          chat.appendChild(fin);
          chat.scrollTop = chat.scrollHeight;
        }, 600);
      }
    }, 1400);
  }
});
