const progressBar = document.getElementById('progressBar');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Scroll progress line.
function updateScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const value = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, value))}%`;
}

window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress, { passive: true });
window.addEventListener('load', updateScrollProgress);
updateScrollProgress();

// Reveal blocks once they enter the viewport.
const revealItems = document.querySelectorAll('.reveal-up');

if (!('IntersectionObserver' in window) || reduceMotion.matches) {
  revealItems.forEach(item => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealItems.forEach(item => revealObserver.observe(item));
}

// Mobile navigation drawer.
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');

function closeMobileMenu() {
  if (!navToggle || !mobileMenu) return;
  navToggle.setAttribute('aria-expanded', 'false');
  mobileMenu.classList.remove('open');
}

if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', () => {
    const willOpen = navToggle.getAttribute('aria-expanded') !== 'true';
    navToggle.setAttribute('aria-expanded', String(willOpen));
    mobileMenu.classList.toggle('open', willOpen);
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMobileMenu();
  });
}

// Audio toggle. Playback still requires a user gesture.
const audio = document.getElementById('bgMusic');
const soundToggle = document.getElementById('soundToggle');
const MUSIC_START_TIME = 5;
const MUSIC_END_TRIM = 20;
let musicEnabled = false;
let musicEndTime = Infinity;
let musicMonitorFrame = null;

function seekToMusicStart() {
  if (!Number.isFinite(audio.duration) || audio.duration <= MUSIC_START_TIME) return;

  try {
    audio.currentTime = MUSIC_START_TIME;
  } catch {
    // Metadata is not ready yet; the loadedmetadata listener handles it.
  }
}

function updateMusicEndTime() {
  musicEndTime = Number.isFinite(audio.duration) && audio.duration > MUSIC_START_TIME + MUSIC_END_TRIM
    ? audio.duration - MUSIC_END_TRIM
    : Infinity;
}

function stopMusicMonitor() {
  if (musicMonitorFrame) {
    window.cancelAnimationFrame(musicMonitorFrame);
  }
  musicMonitorFrame = null;
}

function monitorMusic() {
  if (audio.paused || !musicEnabled) {
    stopMusicMonitor();
    return;
  }

  if (Number.isFinite(musicEndTime) && audio.currentTime >= musicEndTime) {
    seekToMusicStart();
  }

  musicMonitorFrame = window.requestAnimationFrame(monitorMusic);
}

function startMusicMonitor() {
  if (musicMonitorFrame) return;
  musicMonitorFrame = window.requestAnimationFrame(monitorMusic);
}

soundToggle.addEventListener('click', async () => {
  if (audio.paused) {
    musicEnabled = true;

    if (audio.readyState >= 1) {
      if (audio.currentTime < MUSIC_START_TIME) {
        seekToMusicStart();
      }
    } else {
      audio.addEventListener('loadedmetadata', () => {
        if (audio.currentTime < MUSIC_START_TIME) {
          seekToMusicStart();
        }
      }, { once: true });
    }

    try {
      await audio.play();
      updateMusicEndTime();
      startMusicMonitor();
      soundToggle.innerHTML = '♫ <span>Nhạc: bật</span>';
      soundToggle.setAttribute('aria-pressed', 'true');
    } catch {
      musicEnabled = false;
      stopMusicMonitor();
      soundToggle.innerHTML = '♫ <span>Không phát được</span>';
      soundToggle.setAttribute('aria-pressed', 'false');
    }
  } else {
    musicEnabled = false;
    stopMusicMonitor();
    audio.pause();
    soundToggle.innerHTML = '♫ <span>Nhạc: tắt</span>';
    soundToggle.setAttribute('aria-pressed', 'false');
  }
});

audio.addEventListener('loadedmetadata', updateMusicEndTime);
audio.addEventListener('durationchange', updateMusicEndTime);

audio.addEventListener('play', () => {
  updateMusicEndTime();
  startMusicMonitor();
});

audio.addEventListener('pause', stopMusicMonitor);

audio.addEventListener('timeupdate', () => {
  if (!musicEnabled || audio.paused) return;

  if (Number.isFinite(musicEndTime) && audio.currentTime >= musicEndTime) {
    seekToMusicStart();
  }
});

audio.addEventListener('ended', () => {
  if (!musicEnabled) return;

  const restart = () => {
    seekToMusicStart();
    audio.play().catch(() => {
      musicEnabled = false;
      stopMusicMonitor();
      soundToggle.innerHTML = '♫ <span>Không phát được</span>';
      soundToggle.setAttribute('aria-pressed', 'false');
    });
  };

  if (audio.readyState >= 1) {
    restart();
  } else {
    audio.addEventListener('loadedmetadata', restart, { once: true });
  }
});

// Photo lightbox.
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const closeLightboxButton = document.getElementById('closeLightbox');
const pageRegions = [
  document.querySelector('main'),
  document.querySelector('.nav'),
  document.querySelector('.footer'),
  soundToggle
];
let lastFocusedElement = null;

function setPageInert(isInert) {
  pageRegions.forEach(region => {
    if (!region) return;

    if (isInert) {
      region.setAttribute('inert', '');
    } else {
      region.removeAttribute('inert');
    }
  });
}

function openLightbox(card) {
  const image = card.querySelector('img');
  if (!image) return;

  closeMobileMenu();
  lastFocusedElement = card;
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = card.dataset.caption || '';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
  setPageInert(true);
  closeLightboxButton.focus();
}

function closeLightbox() {
  if (!lightbox.classList.contains('open')) return;

  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');
  setPageInert(false);

  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

document.querySelectorAll('.portfolio-media').forEach(card => {
  card.addEventListener('click', () => openLightbox(card));
});

closeLightboxButton.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', event => {
  if (!lightbox.classList.contains('open')) return;

  if (event.key === 'Escape') {
    closeLightbox();
  }

  if (event.key === 'Tab') {
    event.preventDefault();
    closeLightboxButton.focus();
  }
});

const restartBtn = document.getElementById('restartBtn');
if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    resetEnding();

    const brand = document.querySelector('.nav .brand');
    if (brand) {
      window.setTimeout(() => brand.focus({ preventScroll: true }), 0);
    }

    window.scrollTo({
      top: 0,
      behavior: reduceMotion.matches ? 'auto' : 'smooth'
    });
  });
}

// Cinematic gallery — A Rain of Petals & Wishes.
const cinema = document.getElementById('petalCinema');
const cinemaCanvas = document.getElementById('petalCanvas');
const cinemaCtx = cinemaCanvas ? cinemaCanvas.getContext('2d') : null;
const cinemaRoseStage = document.getElementById('cinemaRoseStage');
const cinemaPhotoLayer = document.getElementById('cinemaPhotoLayer');
const cinemaWishLayer = document.getElementById('cinemaWishLayer');
const cinemaFinal = document.getElementById('cinemaFinal');
const cinemaFinalImage = document.getElementById('cinemaFinalImage');
const cinemaFinalTitle = document.getElementById('cinemaFinalTitle');
const cinemaFinalCopy = document.getElementById('cinemaFinalCopy');
const openCinemaButton = document.getElementById('openCinema');
const closeCinemaButton = document.getElementById('closeCinema');
const replayCinemaButton = document.getElementById('replayCinema');

let cinemaWishTexts = [
  'Chúc cậu ngày 20/10 thật vui vẻ và ngập tràn những điều tốt đẹp.',
  'Mong cậu lúc nào cũng vui vẻ, tươi tắn và luôn giữ nụ cười thật xinh.',
  'Chúc những điều dịu dàng nhất sẽ luôn tìm đến cậu.',
  'Mong mỗi ngày của cậu đều có thật nhiều lý do để mỉm cười.',
  'Chúc cậu luôn tự tin, rạng rỡ và làm được những điều mình yêu thích.',
  'Mong những mệt mỏi sẽ qua nhanh, còn niềm vui thì ở lại thật lâu.',
  'Hy vọng hôm nay cậu nhận được thật nhiều niềm vui và những bất ngờ đáng yêu.',
  'Chúc cậu có một ngày 20/10 thật đặc biệt, theo cách riêng của mình.',
  'Mong cậu luôn được yêu thương, trân trọng và đối xử bằng tất cả sự chân thành.',
  'Hãy luôn là cô gái vui vẻ, tươi tắn và đặc biệt theo cách của riêng cậu nhé.'
];

let cinemaPhotos = [
  { src: 'assets/photos/teacher-flowers.jpg', alt: 'Cô gái áo xanh bên bó hoa trước bảng lớp', caption: 'một ngày 20/10' },
  { src: 'assets/photos/green-dress.jpg', alt: 'Ảnh trong khung hoa xanh', caption: 'một khung hình xanh' },
  { src: 'assets/photos/boat.jpg', alt: 'Ảnh bên hồ với nón lá', caption: 'một chút nắng' },
  { src: 'assets/photos/cat-bouquet.jpg', alt: 'Mèo nhỏ ôm bó hoa', caption: 'một người bạn nhỏ' },
  { src: 'assets/photos/rabbit-feeding.jpg', alt: 'Cô gái cho thỏ ăn trong vườn', caption: 'cùng bạn nhỏ' }
];

const cinemaPetalColors = ['#c72f4d', '#e46b87', '#f2a8bb', '#f7ead6', '#a91f3d', '#e8c79a'];
let cinemaMaxPetals = 90;
const cinemaTimers = new Set();
let cinemaState = 'closed';
let cinemaParticles = [];
let cinemaSparks = [];
let cinemaDust = [];
let cinemaAnimationFrame = null;
let cinemaLastFrame = 0;
let cinemaSpawnCarry = 0;
let cinemaIntensity = 1;
let cinemaCanvasWidth = 0;
let cinemaCanvasHeight = 0;
let cinemaPhotoIndex = 0;
let cinemaWishQueue = [];
let cinemaWishIndex = 0;
let cinemaReduced = reduceMotion.matches;
let cinemaLastFocused = null;
let cinemaPreviousVolume = null;

function cinemaSetTimeout(callback, delay) {
  const id = window.setTimeout(() => {
    cinemaTimers.delete(id);
    callback();
  }, delay);
  cinemaTimers.add(id);
  return id;
}

function clearCinemaTimers() {
  cinemaTimers.forEach(id => window.clearTimeout(id));
  cinemaTimers.clear();
}

function shuffleCinemaWishes() {
  const list = cinemaWishTexts.slice();
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function resizeCinemaCanvas() {
  if (!cinemaCanvas || !cinemaCtx) return;

  cinemaCanvasWidth = window.innerWidth;
  cinemaCanvasHeight = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2);
  cinemaCanvas.width = Math.round(cinemaCanvasWidth * dpr);
  cinemaCanvas.height = Math.round(cinemaCanvasHeight * dpr);
  cinemaCanvas.style.width = `${cinemaCanvasWidth}px`;
  cinemaCanvas.style.height = `${cinemaCanvasHeight}px`;
  cinemaCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cinemaCtx.clearRect(0, 0, cinemaCanvasWidth, cinemaCanvasHeight);
}

function initCinemaDust() {
  if (!cinemaCtx) return;

  const count = cinemaReduced ? 12 : window.innerWidth < 760 ? 15 : 28;
  cinemaDust = Array.from({ length: count }, () => ({
    x: Math.random() * cinemaCanvasWidth,
    y: Math.random() * cinemaCanvasHeight,
    radius: 0.5 + Math.random() * 1.6,
    vx: (Math.random() - 0.5) * 8,
    vy: -3 - Math.random() * 10,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 1.3,
    alpha: 0.18 + Math.random() * 0.5
  }));
}

function createCinemaPetal(options = {}) {
  return {
    x: typeof options.x === 'number' ? options.x : Math.random() * cinemaCanvasWidth,
    y: typeof options.y === 'number' ? options.y : -30,
    vx: typeof options.vx === 'number' ? options.vx : 0,
    vy: typeof options.vy === 'number' ? options.vy : 28 + Math.random() * 54,
    size: typeof options.size === 'number' ? options.size : 5 + Math.random() * 11,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 2.4,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.35 + Math.random() * 1.1,
    swayAmount: 8 + Math.random() * 26,
    depth: 0.55 + Math.random() * 0.65,
    color: cinemaPetalColors[Math.floor(Math.random() * cinemaPetalColors.length)],
    alpha: 0.55 + Math.random() * 0.4,
    burst: Boolean(options.burst),
    burstAge: 0
  };
}

function drawCinemaPetal(petal) {
  if (!cinemaCtx) return;

  const ctx = cinemaCtx;
  const size = petal.size * petal.depth;

  ctx.save();
  ctx.translate(petal.x, petal.y);
  ctx.rotate(petal.rotation);

  ctx.globalAlpha = petal.alpha;
  ctx.fillStyle = petal.color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(size * 0.95, -size * 0.55, size * 0.8, size * 0.65, 0, size);
  ctx.bezierCurveTo(-size * 0.8, size * 0.65, -size * 0.95, -size * 0.55, 0, -size);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = petal.alpha * 0.22;
  ctx.fillStyle = '#fff4e6';
  ctx.beginPath();
  ctx.ellipse(-size * 0.16, -size * 0.18, size * 0.2, size * 0.48, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function spawnCinemaBurst(x, y) {
  const count = window.innerWidth < 760 ? 22 : 36;

  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 260;
    const petal = createCinemaPetal({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 50,
      size: 4 + Math.random() * 11,
      burst: true
    });
    petal.alpha = 0.82 + Math.random() * 0.18;
    cinemaParticles.push(petal);
  }

  if (cinemaParticles.length > cinemaMaxPetals) {
    cinemaParticles.splice(0, cinemaParticles.length - cinemaMaxPetals);
  }
}

function spawnCinemaSparks(x, y) {
  const count = window.innerWidth < 760 ? 18 : 30;

  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 180;
    cinemaSparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      radius: 0.7 + Math.random() * 1.9,
      life: 1,
      decay: 0.45 + Math.random() * 0.7,
      color: Math.random() > 0.45 ? '#f4dfbd' : '#f6a9bb'
    });
  }
}

function updateAndDrawCinemaDust(dt, now) {
  const ctx = cinemaCtx;

  cinemaDust.forEach(dust => {
    dust.x += dust.vx * dt;
    dust.y += dust.vy * dt;

    if (dust.y < -12) {
      dust.y = cinemaCanvasHeight + 12;
      dust.x = Math.random() * cinemaCanvasWidth;
    }
    if (dust.x < -12) dust.x = cinemaCanvasWidth + 12;
    if (dust.x > cinemaCanvasWidth + 12) dust.x = -12;

    const twinkle = 0.35 + 0.65 * Math.max(0, Math.sin((now / 1000) * dust.speed + dust.phase));
    ctx.globalAlpha = dust.alpha * twinkle;
    ctx.fillStyle = '#f4dfbd';
    ctx.beginPath();
    ctx.arc(dust.x, dust.y, dust.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

function updateAndDrawCinemaSparks(dt) {
  const ctx = cinemaCtx;

  for (let i = cinemaSparks.length - 1; i >= 0; i -= 1) {
    const spark = cinemaSparks[i];
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    spark.vy += 55 * dt;
    spark.vx *= 0.97;
    spark.life -= dt * spark.decay;

    if (spark.life <= 0) {
      cinemaSparks.splice(i, 1);
      continue;
    }

    ctx.globalAlpha = spark.life * 0.9;
    ctx.fillStyle = spark.color;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.radius * (0.35 + spark.life * 0.65), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function updateAndDrawCinemaPetals(dt) {
  for (let i = cinemaParticles.length - 1; i >= 0; i -= 1) {
    const petal = cinemaParticles[i];

    if (petal.burst) {
      petal.burstAge += dt;

      if (petal.burstAge < 0.9) {
        petal.x += petal.vx * dt;
        petal.y += petal.vy * dt;
        petal.vy += 150 * dt;
        petal.vx *= 0.985;
        petal.rotation += petal.rotationSpeed * dt * 2.2;
      } else {
        petal.burst = false;
        petal.settling = true;
        petal.settleVy = 28 + Math.random() * 46;
        petal.spinBoost = 1.2;
        petal.sway = Math.random() * Math.PI * 2;
      }
    } else {
      petal.sway += petal.swaySpeed * dt;

      if (petal.settling) {
        const blend = Math.min(1, dt * 2.2);
        petal.vx += (0 - petal.vx) * blend;
        petal.vy += (petal.settleVy - petal.vy) * blend;
        petal.spinBoost = Math.max(0, petal.spinBoost - dt * 1.4);
        petal.rotation += petal.rotationSpeed * (1 + petal.spinBoost) * dt;

        if (Math.abs(petal.vy - petal.settleVy) < 2.5 && Math.abs(petal.vx) < 2.5 && petal.spinBoost === 0) {
          petal.settling = false;
        }
      } else {
        petal.rotation += petal.rotationSpeed * dt;
      }

      petal.x += Math.sin(petal.sway) * petal.swayAmount * dt + petal.vx * dt;
      petal.y += petal.vy * dt;
    }

    if (petal.y > cinemaCanvasHeight + 70 || petal.x < -90 || petal.x > cinemaCanvasWidth + 90) {
      cinemaParticles.splice(i, 1);
      continue;
    }

    drawCinemaPetal(petal);
  }
}

function drawCinemaFrame(now) {
  if (!cinemaCtx) {
    cinemaAnimationFrame = null;
    return;
  }

  const dt = Math.min((now - cinemaLastFrame) / 1000 || 0.016, 0.05);
  cinemaLastFrame = now;

  cinemaCtx.clearRect(0, 0, cinemaCanvasWidth, cinemaCanvasHeight);
  updateAndDrawCinemaDust(dt, now);

  if (cinemaState === 'raining' || cinemaState === 'finale') {
    const baseRate = cinemaState === 'finale' ? 7 : 20;
    cinemaSpawnCarry += baseRate * cinemaIntensity * dt;

    while (cinemaSpawnCarry >= 1) {
      cinemaSpawnCarry -= 1;

      if (cinemaParticles.length < cinemaMaxPetals) {
        cinemaParticles.push(createCinemaPetal());
      }
    }
  }

  updateAndDrawCinemaPetals(dt);
  updateAndDrawCinemaSparks(dt);

  cinemaAnimationFrame = window.requestAnimationFrame(drawCinemaFrame);
}

function startCinemaLoop() {
  if (!cinemaCtx || cinemaReduced || cinemaAnimationFrame) return;
  cinemaLastFrame = performance.now();
  cinemaAnimationFrame = window.requestAnimationFrame(drawCinemaFrame);
}

function stopCinemaLoop() {
  if (cinemaAnimationFrame) {
    window.cancelAnimationFrame(cinemaAnimationFrame);
  }
  cinemaAnimationFrame = null;
}

function drawCinemaStaticScene() {
  if (!cinemaCtx) return;

  cinemaCtx.clearRect(0, 0, cinemaCanvasWidth, cinemaCanvasHeight);

  for (let i = 0; i < 20; i += 1) {
    const petal = createCinemaPetal({
      x: Math.random() * cinemaCanvasWidth,
      y: Math.random() * cinemaCanvasHeight,
      size: 5 + Math.random() * 10
    });
    petal.alpha = 0.45 + Math.random() * 0.35;
    drawCinemaPetal(petal);
  }

  for (let i = 0; i < 16; i += 1) {
    cinemaCtx.globalAlpha = 0.2 + Math.random() * 0.35;
    cinemaCtx.fillStyle = '#f4dfbd';
    cinemaCtx.beginPath();
    cinemaCtx.arc(Math.random() * cinemaCanvasWidth, Math.random() * cinemaCanvasHeight, 0.5 + Math.random() * 1.4, 0, Math.PI * 2);
    cinemaCtx.fill();
  }

  cinemaCtx.globalAlpha = 1;
}

function resetCinemaStage() {
  clearCinemaTimers();
  stopCinemaLoop();

  cinemaState = 'intro';
  cinemaParticles = [];
  cinemaSparks = [];
  cinemaSpawnCarry = 0;
  cinemaIntensity = 1;
  cinemaPhotoIndex = 0;
  cinemaWishQueue = shuffleCinemaWishes();
  cinemaWishIndex = 0;

  cinema.classList.remove('is-blooming', 'is-raining', 'is-finale', 'is-reduced');
  cinemaFinal.classList.remove('is-visible');
  cinemaFinal.setAttribute('aria-hidden', 'true');
  cinemaPhotoLayer.replaceChildren();
  cinemaWishLayer.replaceChildren();

  if (cinemaCtx) {
    cinemaCtx.clearRect(0, 0, cinemaCanvasWidth, cinemaCanvasHeight);
  }
}

function startCinemaSequence() {
  if (!cinema.classList.contains('open') || cinemaState !== 'intro') return;

  cinemaState = 'blooming';
  cinema.classList.add('is-blooming');

  if (!cinemaReduced) {
    const rect = cinemaRoseStage.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height * 0.34;
    spawnCinemaBurst(x, y);
    spawnCinemaSparks(x, y);
  }

  cinemaSetTimeout(beginCinemaRain, cinemaReduced ? 450 : 1050);
}

function spawnCinemaPhoto() {
  const photo = cinemaPhotos[cinemaPhotoIndex % cinemaPhotos.length];
  cinemaPhotoIndex += 1;

  const card = document.createElement('div');
  card.className = 'cinema-photo';

  const estimatedWidth = Math.min(window.innerWidth * 0.42, 210) * 1.2;
  const maxLeft = Math.max(12, window.innerWidth - estimatedWidth - 16);
  card.style.left = `${12 + Math.random() * Math.max(1, maxLeft - 12)}px`;
  card.style.setProperty('--size', (0.78 + Math.random() * 0.32).toFixed(2));
  card.style.setProperty('--rot', `${(-9 + Math.random() * 18).toFixed(1)}deg`);
  card.style.setProperty('--dur', `${(8.5 + Math.random() * 4).toFixed(2)}s`);
  card.style.setProperty('--sway', `${Math.round(-40 + Math.random() * 80)}px`);
  card.style.setProperty('--fade', (0.78 + Math.random() * 0.22).toFixed(2));
  card.innerHTML = `<div class="cinema-photo-frame"><img src="${photo.src}" alt="" loading="lazy"><span>${photo.caption}</span></div>`;

  cinemaPhotoLayer.appendChild(card);

  while (cinemaPhotoLayer.children.length > 4) {
    cinemaPhotoLayer.firstElementChild.remove();
  }

  card.addEventListener('animationend', () => card.remove(), { once: true });
}

function startCinemaPhotoRain() {
  if (cinemaState !== 'raining' || !cinema.classList.contains('open')) return;
  spawnCinemaPhoto();
  cinemaSetTimeout(startCinemaPhotoRain, 1450 + Math.random() * 900);
}

function spawnCinemaWish() {
  if (cinemaWishIndex >= cinemaWishQueue.length) {
    cinemaWishQueue = shuffleCinemaWishes();
    cinemaWishIndex = 0;
  }

  const text = cinemaWishQueue[cinemaWishIndex];
  cinemaWishIndex += 1;

  const wish = document.createElement('p');
  wish.className = 'cinema-wish';
  wish.textContent = text;
  wish.style.top = `${30 + Math.random() * 34}%`;
  wish.style.setProperty('--dur', `${(4.2 + Math.random() * 1.2).toFixed(2)}s`);
  cinemaWishLayer.appendChild(wish);

  while (cinemaWishLayer.children.length > 2) {
    cinemaWishLayer.firstElementChild.remove();
  }

  wish.addEventListener('animationend', () => wish.remove(), { once: true });
}

function startCinemaWishRain() {
  if (cinemaState !== 'raining' || !cinema.classList.contains('open')) return;
  spawnCinemaWish();
  cinemaSetTimeout(startCinemaWishRain, 3600 + Math.random() * 1200);
}

function showReducedCinemaRain() {
  cinema.classList.add('is-reduced');

  const positions = [
    { left: '8%', top: '18%', rot: '-5deg', size: '0.86' },
    { left: '58%', top: '28%', rot: '4deg', size: '0.78' }
  ];

  positions.forEach((position, index) => {
    const photo = cinemaPhotos[index % cinemaPhotos.length];
    const card = document.createElement('div');
    card.className = 'cinema-photo cinema-photo-static';
    card.style.left = position.left;
    card.style.top = position.top;
    card.style.setProperty('--rot', position.rot);
    card.style.setProperty('--size', position.size);
    card.innerHTML = `<div class="cinema-photo-frame"><img src="${photo.src}" alt="" loading="lazy"><span>${photo.caption}</span></div>`;
    cinemaPhotoLayer.appendChild(card);
  });

  cinemaWishQueue.slice(0, 2).forEach((text, index) => {
    const wish = document.createElement('p');
    wish.className = 'cinema-wish cinema-wish-static';
    wish.textContent = text;
    wish.style.top = `${60 + index * 12}%`;
    cinemaWishLayer.appendChild(wish);
  });

  drawCinemaStaticScene();
}

function beginCinemaRain() {
  if (!cinema.classList.contains('open') || cinemaState !== 'blooming') return;

  cinemaState = 'raining';
  cinema.classList.remove('is-blooming');
  cinema.classList.add('is-raining');

  if (cinemaReduced) {
    showReducedCinemaRain();
    cinemaSetTimeout(startCinemaFinale, 6500);
    return;
  }

  startCinemaPhotoRain();
  startCinemaWishRain();
  cinemaSetTimeout(startCinemaFinale, 12000);
}

function startCinemaFinale() {
  if (!cinema.classList.contains('open') || cinemaState === 'closed' || cinemaState === 'finale') return;

  cinemaState = 'finale';
  clearCinemaTimers();

  cinema.classList.add('is-finale');
  cinemaIntensity = 0.35;

  const finalPhoto = cinemaPhotos[0];
  cinemaFinalImage.src = finalPhoto.src;
  cinemaFinalImage.alt = finalPhoto.alt;

  cinemaSetTimeout(() => {
    cinemaPhotoLayer.replaceChildren();
    cinemaWishLayer.replaceChildren();
  }, cinemaReduced ? 0 : 800);

  cinemaFinal.classList.add('is-visible');
  cinemaFinal.setAttribute('aria-hidden', 'false');

  cinemaSetTimeout(() => {
    cinemaFinalTitle.focus({ preventScroll: true });
  }, cinemaReduced ? 0 : 900);
}

function openCinema() {
  if (!cinema || cinema.classList.contains('open')) return;

  closeMobileMenu();
  cinemaLastFocused = openCinemaButton;
  cinemaPreviousVolume = audio.volume;
  cinemaReduced = reduceMotion.matches;
  cinemaMaxPetals = window.innerWidth < 760 ? 55 : 90;

  if (!audio.paused) {
    audio.volume = Math.min(audio.volume, 0.45);
  }

  resetCinemaStage();

  cinema.classList.add('open');
  cinema.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cinema-open');
  setPageInert(true);

  resizeCinemaCanvas();
  initCinemaDust();

  if (cinemaReduced) {
    drawCinemaStaticScene();
  } else {
    startCinemaLoop();
  }

  cinemaSetTimeout(() => closeCinemaButton.focus({ preventScroll: true }), 60);
  cinemaSetTimeout(startCinemaSequence, 220);
}

function closeCinema() {
  if (!cinema.classList.contains('open')) return;

  resetCinemaStage();

  cinema.classList.remove('open');
  cinema.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cinema-open');
  setPageInert(false);

  if (cinemaPreviousVolume !== null) {
    audio.volume = cinemaPreviousVolume;
    cinemaPreviousVolume = null;
  }

  if (cinemaLastFocused) {
    cinemaLastFocused.focus();
    cinemaLastFocused = null;
  }
}

function replayCinema() {
  if (!cinema.classList.contains('open')) return;

  resetCinemaStage();
  cinemaReduced = reduceMotion.matches;
  cinemaMaxPetals = window.innerWidth < 760 ? 55 : 90;
  resizeCinemaCanvas();
  initCinemaDust();

  if (cinemaReduced) {
    drawCinemaStaticScene();
  } else {
    startCinemaLoop();
  }

  closeCinemaButton.focus({ preventScroll: true });
  cinemaSetTimeout(startCinemaSequence, 220);
}

openCinemaButton.addEventListener('click', openCinema);
closeCinemaButton.addEventListener('click', closeCinema);
replayCinemaButton.addEventListener('click', replayCinema);

document.addEventListener('keydown', event => {
  if (!cinema.classList.contains('open')) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeCinema();
    return;
  }

  if (event.key !== 'Tab') return;

  const focusable = [closeCinemaButton];
  if (cinemaFinal.classList.contains('is-visible')) {
    focusable.push(replayCinemaButton);
  }

  const currentIndex = focusable.indexOf(document.activeElement);
  event.preventDefault();

  let nextIndex;
  if (event.shiftKey) {
    nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
  } else {
    nextIndex = currentIndex === -1 || currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
  }

  focusable[nextIndex].focus();
});

document.addEventListener('visibilitychange', () => {
  if (!cinema.classList.contains('open')) return;

  if (document.hidden) {
    stopCinemaLoop();
  } else if (!cinemaReduced && cinemaState !== 'closed') {
    startCinemaLoop();
  }
});

window.addEventListener('resize', () => {
  if (!cinema.classList.contains('open')) return;

  if (window.innerWidth === cinemaCanvasWidth && Math.abs(window.innerHeight - cinemaCanvasHeight) < 140) return;

  resizeCinemaCanvas();
  initCinemaDust();

  if (cinemaReduced) {
    drawCinemaStaticScene();
  }
});

// Unified ending — letter → invitation → photo bouquet.
const endingSection = document.getElementById('thank-you');
const endingStage = document.getElementById('endingStage');
const endingLetter = document.getElementById('endingLetter');
const endingContinue = document.getElementById('endingContinue');
const endingInvitation = document.getElementById('endingInvitation');
const bouquetStart = document.getElementById('bouquetStart');
const endingFlowerScene = document.getElementById('endingFlowerScene');
const endingParticles = document.getElementById('endingParticles');
const endingFinalWish = document.getElementById('endingFinalWish');
const bouquetPetals = document.getElementById('bouquetPetals');
const bouquetWrap = document.getElementById('bouquetWrap');
const endingPetalCanvas = document.getElementById('endingPetalCanvas');
const endingPetalCtx = endingPetalCanvas ? endingPetalCanvas.getContext('2d') : null;

let endingState = 'letter';
const endingTimers = new Set();

let endingRainRunning = false;
let endingRainFrame = null;
let endingRainLastFrame = 0;
let endingRainParticles = [];
let endingRainDust = [];
let endingRainWidth = 0;
let endingRainHeight = 0;
let endingRainIntensity = 0;
let endingRainTargetIntensity = 0;
let endingRainMode = 'idle';
let endingRainCarry = 0;
let endingRainModeStart = 0;

const endingPetalColors = ['#c72f4d', '#e46b87', '#f2a8bb', '#f7ead6', '#a91f3d'];

function endingSetTimeout(callback, delay) {
  const id = window.setTimeout(() => {
    endingTimers.delete(id);
    callback();
  }, delay);
  endingTimers.add(id);
  return id;
}

function clearEndingTimers() {
  endingTimers.forEach(id => window.clearTimeout(id));
  endingTimers.clear();
}

function resetEnding() {
  clearEndingTimers();
  clearEndingRain();

  if (endingParticles) endingParticles.replaceChildren();
  if (bouquetPetals) bouquetPetals.replaceChildren();

  if (endingSection) {
    endingSection.classList.remove(
      'is-letter-visible',
      'is-transitioning',
      'is-invitation',
      'is-flower',
      'is-blooming',
      'is-stemmed',
      'is-complete',
      'is-settled',
      'is-revealed',
      'is-climax',
      'is-reduced'
    );
  }

  if (endingFlowerScene) endingFlowerScene.setAttribute('aria-hidden', 'true');
  if (endingInvitation) endingInvitation.setAttribute('aria-hidden', 'true');
  if (endingLetter) endingLetter.removeAttribute('aria-hidden');
  if (endingContinue) endingContinue.disabled = false;
  if (bouquetStart) bouquetStart.disabled = false;

  endingState = 'letter';
}

function spawnEndingParticles() {
  if (!endingStage || !endingLetter || !endingParticles) return;

  endingParticles.replaceChildren();

  const stageRect = endingStage.getBoundingClientRect();
  const letterRect = endingLetter.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height) return;

  const targetX = stageRect.width / 2;
  const targetY = stageRect.height * 0.36;
  const count = window.innerWidth < 760 ? 24 : 36;

  for (let index = 0; index < count; index += 1) {
    const startX = letterRect.left - stageRect.left + Math.random() * letterRect.width;
    const startY = letterRect.top - stageRect.top + Math.random() * letterRect.height;
    const driftX = targetX - startX + (Math.random() - 0.5) * 70;
    const driftY = targetY - startY + (Math.random() - 0.5) * 70;
    const particle = document.createElement('span');

    particle.className = `ending-particle${Math.random() > 0.72 ? ' is-paper' : ''}`;
    particle.style.setProperty('--sx', `${startX}px`);
    particle.style.setProperty('--sy', `${startY}px`);
    particle.style.setProperty('--dx', `${driftX}px`);
    particle.style.setProperty('--dy', `${driftY}px`);
    particle.style.setProperty('--size', `${2 + Math.random() * 4}px`);
    particle.style.setProperty('--delay', `${Math.random() * 0.24}s`);
    particle.style.setProperty('--dur', `${1.1 + Math.random() * 0.7}s`);

    endingParticles.appendChild(particle);
  }

  endingSetTimeout(() => endingParticles.replaceChildren(), 2400);
}

function resizeEndingRainCanvas() {
  if (!endingPetalCanvas || !endingPetalCtx || !endingSection) return;

  endingRainWidth = endingSection.clientWidth;
  endingRainHeight = endingSection.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2);

  endingPetalCanvas.width = Math.round(endingRainWidth * dpr);
  endingPetalCanvas.height = Math.round(endingRainHeight * dpr);
  endingPetalCanvas.style.width = `${endingRainWidth}px`;
  endingPetalCanvas.style.height = `${endingRainHeight}px`;
  endingPetalCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function initEndingRainDust() {
  if (!endingPetalCtx) return;

  const count = window.innerWidth < 760 ? 10 : 20;
  endingRainDust = Array.from({ length: count }, () => ({
    x: Math.random() * endingRainWidth,
    y: Math.random() * endingRainHeight,
    radius: 0.5 + Math.random() * 1.5,
    vx: (Math.random() - 0.5) * 6,
    vy: -2 - Math.random() * 7,
    phase: Math.random() * Math.PI * 2,
    speed: 0.4 + Math.random() * 1.1,
    alpha: 0.15 + Math.random() * 0.4
  }));
}

function endingRainBouquetCenter() {
  const fallback = { x: endingRainWidth / 2, y: endingRainHeight * 0.32 };
  if (!endingSection) return fallback;

  const head = document.getElementById('bloom');
  if (!head) return fallback;

  const sectionRect = endingSection.getBoundingClientRect();
  const headRect = head.getBoundingClientRect();
  if (!headRect.width || !headRect.height) return fallback;

  return {
    x: headRect.left - sectionRect.left + headRect.width / 2,
    y: headRect.top - sectionRect.top + headRect.height / 2
  };
}

function createEndingRainPetal(options = {}) {
  return {
    x: typeof options.x === 'number' ? options.x : Math.random() * endingRainWidth,
    y: typeof options.y === 'number' ? options.y : -24,
    vx: typeof options.vx === 'number' ? options.vx : 0,
    vy: typeof options.vy === 'number' ? options.vy : 24 + Math.random() * 48,
    size: typeof options.size === 'number' ? options.size : 4 + Math.random() * 10,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 2.2,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.35 + Math.random() * 1.1,
    swayAmount: 8 + Math.random() * 22,
    depth: 0.55 + Math.random() * 0.65,
    color: endingPetalColors[Math.floor(Math.random() * endingPetalColors.length)],
    alpha: 0.55 + Math.random() * 0.4,
    burst: Boolean(options.burst),
    burstAge: 0
  };
}

function spawnEndingRainPetal() {
  const max = window.innerWidth < 760 ? 45 : 100;
  if (endingRainParticles.length >= max) return;

  const roll = Math.random();
  let petal;

  if (roll < 0.14) {
    const fromLeft = Math.random() < 0.5;
    petal = createEndingRainPetal({
      x: fromLeft ? -24 : endingRainWidth + 24,
      y: Math.random() * endingRainHeight * 0.55,
      vx: (fromLeft ? 1 : -1) * (14 + Math.random() * 34),
      vy: 12 + Math.random() * 28
    });
  } else if (roll > 0.86 && endingRainMode !== 'invitation' && endingRainMode !== 'idle') {
    const center = endingRainBouquetCenter();
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 90;
    petal = createEndingRainPetal({
      x: center.x + (Math.random() - 0.5) * 60,
      y: center.y + (Math.random() - 0.5) * 60,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      burst: true
    });
  } else {
    petal = createEndingRainPetal({
      x: Math.random() * endingRainWidth,
      y: -24
    });
  }

  if (Math.random() > 0.9) {
    petal.size = 14 + Math.random() * 5;
    petal.depth = 1.05;
    petal.alpha = 0.7 + Math.random() * 0.25;
  }

  endingRainParticles.push(petal);
}

function drawEndingRainPetal(petal) {
  if (!endingPetalCtx) return;

  const ctx = endingPetalCtx;
  const size = petal.size * petal.depth;

  ctx.save();
  ctx.translate(petal.x, petal.y);
  ctx.rotate(petal.rotation);
  ctx.globalAlpha = petal.alpha;
  ctx.fillStyle = petal.color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(size * 0.95, -size * 0.55, size * 0.8, size * 0.65, 0, size);
  ctx.bezierCurveTo(-size * 0.8, size * 0.65, -size * 0.95, -size * 0.55, 0, -size);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = petal.alpha * 0.2;
  ctx.fillStyle = '#fff4e6';
  ctx.beginPath();
  ctx.ellipse(-size * 0.16, -size * 0.18, size * 0.2, size * 0.48, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function endingRainTick(now) {
  if (!endingRainRunning || !endingPetalCtx) {
    endingRainFrame = null;
    return;
  }

  const dt = Math.min((now - endingRainLastFrame) / 1000 || 0.016, 0.05);
  endingRainLastFrame = now;

  endingRainIntensity += (endingRainTargetIntensity - endingRainIntensity) * Math.min(1, dt * 0.9);

  const ctx = endingPetalCtx;
  ctx.clearRect(0, 0, endingRainWidth, endingRainHeight);

  endingRainDust.forEach(dust => {
    dust.x += dust.vx * dt;
    dust.y += dust.vy * dt;
    if (dust.y < -12) {
      dust.y = endingRainHeight + 12;
      dust.x = Math.random() * endingRainWidth;
    }
    if (dust.x < -12) dust.x = endingRainWidth + 12;
    if (dust.x > endingRainWidth + 12) dust.x = -12;

    const twinkle = 0.35 + 0.65 * Math.max(0, Math.sin((now / 1000) * dust.speed + dust.phase));
    ctx.globalAlpha = dust.alpha * twinkle;
    ctx.fillStyle = '#f4dfbd';
    ctx.beginPath();
    ctx.arc(dust.x, dust.y, dust.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  endingRainCarry += endingRainWaveRate(now) * endingRainIntensity * dt;

  while (endingRainCarry >= 1) {
    endingRainCarry -= 1;
    spawnEndingRainPetal();
  }

  for (let index = endingRainParticles.length - 1; index >= 0; index -= 1) {
    const petal = endingRainParticles[index];

    if (petal.burst) {
      petal.burstAge += dt;
      if (petal.burstAge < 0.8) {
        petal.x += petal.vx * dt;
        petal.y += petal.vy * dt;
        petal.vy += 80 * dt;
        petal.vx *= 0.985;
        petal.rotation += petal.rotationSpeed * dt * 2;
      } else {
        petal.burst = false;
        petal.settling = true;
        petal.settleVy = 24 + Math.random() * 40;
        petal.spinBoost = 1;
        petal.sway = Math.random() * Math.PI * 2;
      }
    } else {
      petal.sway += petal.swaySpeed * dt;

      if (petal.settling) {
        const blend = Math.min(1, dt * 2.2);
        petal.vx += (0 - petal.vx) * blend;
        petal.vy += (petal.settleVy - petal.vy) * blend;
        petal.spinBoost = Math.max(0, petal.spinBoost - dt * 1.4);
        petal.rotation += petal.rotationSpeed * (1 + petal.spinBoost) * dt;

        if (Math.abs(petal.vy - petal.settleVy) < 2.5 && Math.abs(petal.vx) < 2.5 && petal.spinBoost === 0) {
          petal.settling = false;
        }
      } else {
        petal.rotation += petal.rotationSpeed * dt;
      }

      petal.x += Math.sin(petal.sway) * petal.swayAmount * dt + petal.vx * dt;
      petal.y += petal.vy * dt;
    }

    if (petal.y > endingRainHeight - 80) {
      petal.alpha = Math.max(0, petal.alpha - dt * 0.8);
    }

    if (petal.y > endingRainHeight + 40 || petal.x < -80 || petal.x > endingRainWidth + 80 || petal.alpha < 0.04) {
      endingRainParticles.splice(index, 1);
      continue;
    }

    drawEndingRainPetal(petal);
  }

  endingRainFrame = window.requestAnimationFrame(endingRainTick);
}

function startEndingRainLoop() {
  if (!endingPetalCtx || reduceMotion.matches || endingRainRunning) return;

  resizeEndingRainCanvas();
  if (!endingRainDust.length) initEndingRainDust();

  endingRainRunning = true;
  endingRainLastFrame = performance.now();
  endingRainFrame = window.requestAnimationFrame(endingRainTick);
}

function stopEndingRain() {
  endingRainRunning = false;
  if (endingRainFrame) window.cancelAnimationFrame(endingRainFrame);
  endingRainFrame = null;
}

function clearEndingRain() {
  stopEndingRain();
  endingRainParticles = [];
  endingRainDust = [];
  endingRainIntensity = 0;
  endingRainTargetIntensity = 0;
  endingRainMode = 'idle';
  endingRainCarry = 0;

  if (endingPetalCtx) {
    endingPetalCtx.clearRect(0, 0, endingRainWidth, endingRainHeight);
  }
}

function smoothWaveStep(value) {
  const x = Math.min(1, Math.max(0, value));
  return x * x * (3 - 2 * x);
}

function endingRainWaveRate(now) {
  const elapsed = Math.max(0, (now - endingRainModeStart) / 1000);

  if (endingRainMode === 'invitation') return 2.4;
  if (endingRainMode === 'assembly') return 3.5 * smoothWaveStep(elapsed / 2.4);
  if (endingRainMode === 'climax') return 30 * (0.55 + 0.45 * smoothWaveStep(elapsed / 1.4));

  if (endingRainMode === 'finale') {
    return 1.5 + 20.5 * Math.exp(-elapsed * 0.5);
  }

  return 0;
}

function setEndingRainMode(mode) {
  if (reduceMotion.matches) return;

  endingRainMode = mode;
  endingRainModeStart = performance.now();
  const targets = { invitation: 0.4, assembly: 0.45, climax: 1, finale: 0.8 };
  endingRainTargetIntensity = targets[mode] ?? 0;
  startEndingRainLoop();
}

function startEndingRain(mode) {
  if (reduceMotion.matches) return;

  resizeEndingRainCanvas();
  if (!endingRainDust.length) initEndingRainDust();
  setEndingRainMode(mode);
}

let bouquetPhotos = cinemaPhotos.filter(photo => photo.src.indexOf('cat-bouquet') === -1);

function createPetalFlight(finalRot) {
  const roll = Math.random();
  const side = roll < 0.4 ? 'left' : roll < 0.8 ? 'right' : 'top';

  let p0x;
  let p0y;
  if (side === 'left') {
    p0x = -(95 + Math.random() * 45);
    p0y = -18 + Math.random() * 46;
  } else if (side === 'right') {
    p0x = 95 + Math.random() * 45;
    p0y = -18 + Math.random() * 46;
  } else {
    p0x = -24 + Math.random() * 48;
    p0y = -(70 + Math.random() * 36);
  }

  const spin = (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 90);

  return { p0x, p0y, rot0: finalRot + spin };
}

function buildBouquetPetals() {
  if (!bouquetPetals) return;
  bouquetPetals.replaceChildren();

  const imagePositions = {
    'dieu-anh-1.jpg': '50% 35%',
    'dieu-anh-2.jpg': '50% 25%',
    'dieu-anh-3.jpg': '50% 40%',
    'teacher-flowers.jpg': '50% 22%',
    'green-dress.jpg': '50% 27%',
    'boat.jpg': '50% 28%',
    'rabbit-feeding.jpg': '50% 14%'
  };

  function addPetal(image, layout) {
    const petal = document.createElement('div');
    petal.className = 'bouquet-petal';
    petal.style.setProperty('--x', `${layout.x.toFixed(2)}%`);
    petal.style.setProperty('--y', `${layout.y.toFixed(2)}%`);
    petal.style.setProperty('--w', `${layout.w}%`);
    petal.style.setProperty('--h', `${layout.h}%`);
    petal.style.setProperty('--rot', `${layout.rot.toFixed(2)}deg`);
    petal.style.setProperty('--z', String(layout.z));
    petal.style.setProperty('--delay', `${layout.delay.toFixed(2)}s`);
    petal.style.setProperty('--dur', `${layout.dur.toFixed(2)}s`);

    const flight = createPetalFlight(layout.rot);
    petal.style.setProperty('--p0x', `${flight.p0x.toFixed(2)}vw`);
    petal.style.setProperty('--p0y', `${flight.p0y.toFixed(2)}vh`);
    petal.style.setProperty('--rot0', `${flight.rot0.toFixed(2)}deg`);

    const img = document.createElement('img');
    img.src = image.src;
    img.alt = '';
    const fileName = image.src.split('/').pop();
    img.style.objectPosition = imagePositions[fileName] || '50% 30%';

    const fly = document.createElement('div');
    fly.className = 'bouquet-fly';
    fly.appendChild(img);
    petal.appendChild(fly);
    bouquetPetals.appendChild(petal);
  }

  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI * 2 / 6) * index - Math.PI / 2;
    addPetal(bouquetPhotos[index % bouquetPhotos.length], {
      x: 50 + Math.cos(angle) * 38,
      y: 50 + Math.sin(angle) * 31,
      w: 33,
      h: 44,
      rot: Math.sin(angle) * 10 + (Math.random() * 8 - 4),
      z: 1 + (index % 2),
      delay: 0.1 + index * 0.16 + Math.random() * 0.07,
      dur: 2.0 + Math.random() * 0.6
    });
  }

  for (let index = 0; index < 5; index += 1) {
    const angle = (Math.PI * 2 / 5) * index - Math.PI / 2 + Math.PI / 5;
    addPetal(bouquetPhotos[(index + 1) % bouquetPhotos.length], {
      x: 50 + Math.cos(angle) * 21,
      y: 50 + Math.sin(angle) * 17,
      w: 25,
      h: 34,
      rot: Math.sin(angle) * 8 + (Math.random() * 6 - 3),
      z: 3 + (index % 2),
      delay: 1.0 + index * 0.15 + Math.random() * 0.06,
      dur: 2.1 + Math.random() * 0.6
    });
  }

  for (let index = 0; index < 4; index += 1) {
    const angle = (Math.PI * 2 / 4) * index - Math.PI / 2 + Math.PI / 4;
    addPetal(bouquetPhotos[(index + 3) % bouquetPhotos.length], {
      x: 50 + Math.cos(angle) * 11,
      y: 50 + Math.sin(angle) * 10,
      w: 15,
      h: 21,
      rot: Math.sin(angle) * 7 + (Math.random() * 6 - 3),
      z: 6 + (index % 2),
      delay: 1.7 + index * 0.15 + Math.random() * 0.06,
      dur: 2.2 + Math.random() * 0.5
    });
  }
}

function showEndingInvitation() {
  if (endingState !== 'letter') return;

  endingState = 'invitation-transition';
  endingContinue.disabled = true;
  endingSection.classList.add('is-transitioning');

  if (reduceMotion.matches) {
    endingSection.classList.add('is-reduced', 'is-invitation');
    endingInvitation.setAttribute('aria-hidden', 'false');
    endingLetter.setAttribute('aria-hidden', 'true');
    endingState = 'invitation';
    endingSetTimeout(() => bouquetStart.focus({ preventScroll: true }), 0);
    return;
  }

  spawnEndingParticles();

  endingSetTimeout(() => {
    endingSection.classList.add('is-invitation');
    endingInvitation.setAttribute('aria-hidden', 'false');
    endingLetter.setAttribute('aria-hidden', 'true');
    endingState = 'invitation';
    startEndingRain('invitation');
    endingSetTimeout(() => bouquetStart.focus({ preventScroll: true }), 180);
  }, 380);
}

function startBouquetAssembly() {
  if (endingState !== 'invitation') return;

  endingState = 'assembling';
  bouquetStart.disabled = true;
  buildBouquetPetals();
  endingSection.classList.add('is-flower', 'is-blooming');
  endingFlowerScene.setAttribute('aria-hidden', 'false');
  endingInvitation.setAttribute('aria-hidden', 'true');

  if (reduceMotion.matches) {
    endingSection.classList.add('is-reduced', 'is-stemmed', 'is-complete', 'is-settled', 'is-revealed');
    endingState = 'revealed';
    endingSetTimeout(() => endingFinalWish.focus({ preventScroll: true }), 180);
    return;
  }

  setEndingRainMode('assembly');
  endingSetTimeout(() => endingSection.classList.add('is-stemmed'), 4000);
  endingSetTimeout(() => endingSection.classList.add('is-complete'), 5100);
  endingSetTimeout(() => {
    endingSection.classList.add('is-climax');
    setEndingRainMode('climax');
  }, 5400);
  endingSetTimeout(() => endingSection.classList.add('is-settled'), 6900);
  endingSetTimeout(() => {
    endingSection.classList.add('is-revealed');
    endingState = 'revealed';
    setEndingRainMode('finale');
    endingSetTimeout(() => endingFinalWish.focus({ preventScroll: true }), 300);
  }, 8000);
}

if (endingContinue) {
  endingContinue.addEventListener('click', showEndingInvitation);
}

if (bouquetStart) {
  bouquetStart.addEventListener('click', startBouquetAssembly);
}

if (endingSection && 'IntersectionObserver' in window) {
  const endingObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (endingState === 'letter') {
        endingSection.classList.toggle('is-letter-visible', entry.isIntersecting);
      }

      endingSection.classList.toggle('is-offscreen', !entry.isIntersecting);

      if (!entry.isIntersecting) {
        stopEndingRain();
      } else if (endingState !== 'letter' && !reduceMotion.matches) {
        startEndingRainLoop();
      }
    });
  }, { threshold: 0.18 });

  endingObserver.observe(endingSection);
} else if (endingSection) {
  endingSection.classList.add('is-letter-visible');
}

// ==========================================================================
// 4 Friends 20/10 Personalization Engine
// ==========================================================================

const FRIENDS_DATA = {
  'dieu-anh': {
    id: 'dieu-anh',
    name: 'Hồ Thị Diệu Ánh',
    shortName: 'Diệu Ánh',
    icon: '🌸',
    eyebrow: 'A Small Gift · 20.10',
    headline: 'Một món quà nhỏ<br>gửi <em>Diệu Ánh.</em>',
    heroText: 'Nhân ngày 20/10, t chúc Ánh ngày càng xinh đẹp, đẳng cấp, ít stress, siêu giàu. Chúc Ánh luôn vui vẻ, rạng ngời luôn luôn hạnh phúc trong cuộc sống he',
    heroCaption: 'Một chút dịu dàng,<br>gửi riêng Diệu Ánh.',
    heroImage: 'assets/photos/dieu-anh/dieu-anh-1.jpg',
    bloomCenter: 'Diệu Ánh<br><small>20.10</small>',
    letterTitle: 'Gửi Diệu Ánh,<br><em>người bạn tuyệt vời.</em>',
    letterParagraphs: [
      'Cảm ơn Ánh đã luôn là một người bạn tuyệt vời, chu đáo và đem lại cảm giác bình yên cho mọi người xung quanh.',
      'Có những lời chúc không cần quá khoa trương, chỉ mong cậu biết rằng sự hiện diện của cậu luôn rất quý giá nè, nên là đừng có suy nghĩ tiêu cực(nếu có...) he.',
      'Nhân ngày 20/10, chúc Diệu Ánh luôn an yên, mạnh mẽ khi cần và dịu dàng khi muốn. Mong tương lai sẽ dịu dàng nâng niu mọi ước mơ của Ánh.'
    ],
    letterSign: 'gửi riêng cho <span>Diệu Ánh.</span>',
    finalWish: 'Chúc Diệu Ánh một ngày 20/10 thật ấm áp,<br>luôn mỉm cười và hạnh phúc mỗi ngày.',
    signature: '— Gửi tặng người bạn đáng mến Diệu Ánh —',
    cinemaFinalTitle: 'Chúc Diệu Ánh ngày 20/10<br>thật dịu dàng & vui vẻ!',
    cinemaFinalCopy: 'Mong cậu luôn rạng rỡ, bình yên và có thật nhiều điều ngọt ngào chờ đón phía trước.',
    cinemaWishes: [
      'Chúc Diệu Ánh ngày 20/10 thật dịu dàng, bình yên và ngập tràn niềm vui.',
      'Mong Ánh lúc nào cũng giữ được nụ cười trong trẻo và ánh mắt rạng rỡ như thế.',
      'Chúc những điều ngọt ngào và chân thành nhất sẽ luôn tìm đến với Ánh.',
      'Mong mỗi sáng thức dậy cậu đều thấy lòng nhẹ nhõm, mỗi ngày trôi qua đều có điều làm cậu mỉm cười.',
      'Chúc Diệu Ánh ngày càng xinh đẹp, đẳng cấp, ít stress, siêu giàu!',
      'Mong những áp lực, mệt mỏi sẽ qua thật nhanh, chỉ có niềm vui ở lại cùng Ánh.',
      'Cảm ơn Diệu Ánh vì luôn là một người bạn thật chu đáo và ấm áp he.',
      'Chúc Ánh luôn vui vẻ, rạng ngời luôn luôn hạnh phúc trong cuộc sống!'
    ],
    photos: [
      { src: 'assets/photos/dieu-anh/dieu-anh-1.jpg', alt: 'Diệu Ánh che miệng cười', caption: 'Một chút đáng yêu' },
      { src: 'assets/photos/dieu-anh/dieu-anh-2.jpg', alt: 'Diệu Ánh áo xanh', caption: 'Khoảnh khắc rạng ngời' },
      { src: 'assets/photos/dieu-anh/dieu-anh-3.jpg', alt: 'Diệu Ánh selfie', caption: 'Góc cận đáng yêu' },
      { src: 'assets/photos/dieu-anh/dieu-anh-1.jpg', alt: 'Diệu Ánh nụ cười xinh', caption: 'Nụ cười tỏa nắng' },
      { src: 'assets/photos/dieu-anh/dieu-anh-2.jpg', alt: 'Diệu Ánh 20/10', caption: 'Chúc Ánh luôn vui he' }
    ]
  },
  'trang-nhung': {
    id: 'trang-nhung',
    name: 'Nguyễn Trang Nhung',
    shortName: 'Trang Nhung',
    icon: '🎭',
    eyebrow: 'Special Edition · 20.10',
    headline: 'Món quà "bất ổn"<br>gửi <em>Trang Nhung.</em>',
    heroText: '20/10 không chúc sến súa vì sợ nổi da gà. Chúc đồng chí Trang Nhung nhân phẩm vô cực, ví dày cộm và bớt làm khổ bạn bè!',
    heroCaption: 'Bớt báo đời lại,<br>sớm giàu bao tao!',
    heroImage: 'assets/photos/rabbit-feeding.jpg',
    bloomCenter: 'Nhung Báo<br><small>20.10</small>',
    letterTitle: 'Gửi Trang Nhung,<br><em>đồng chí bạn thân "báo thủ".</em>',
    letterParagraphs: [
      'Tao định viết thư cảm động rơi nước mắt nhưng nghĩ lại mặt mày khi đọc chắc cười sặc sụa nên thôi.',
      'Cảm ơn vì đã luôn là cái cây hài chất lượng cao của cả nhóm, người luôn cùng tao bày đủ trò con bò và chịu đựng cái tính ẩm ương của nhau.',
      '20/10 chúc đồng chí Nhung luôn rực rỡ, bớt quạu, thi đâu đậu đó, làm đâu trúng đó và sớm ngày phát tài để dắt tao đi ăn cả thế giới.',
      'Nhớ là dù có chuyện gì thì hội bạn này vẫn luôn ở đây để hóng hớt và cà khịa mày mỗi ngày!'
    ],
    letterSign: 'Một lời chúc lầy lội, <span>gửi đồng chí Nhung.</span>',
    finalWish: 'Chúc Trang Nhung 20/10 cười rớt hàm,<br>ví luôn đầy tiền và bớt báo lại nha!',
    signature: '— Người bạn thân chịu đựng mày suốt năm tháng —',
    cinemaFinalTitle: 'Chúc Trang Nhung 20/10<br>bớt báo & sớm thành phú bà!',
    cinemaFinalCopy: 'Ăn bao nhiêu cũng không béo, thức tới 3h sáng da vẫn căng mọng không một hột mụn!',
    cinemaWishes: [
      'Chúc Nhung ngày 20/10 bớt báo, bớt ngủ nướng và bớt trễ hẹn giùm cái!',
      'Chúc bồ tiền vào như nước sông Đà, tiền ra nhỏ giọt như cà phê phin.',
      'Ăn bao nhiêu cũng không béo, thức đến 3h sáng da dẻ vẫn mịn màng không một hột mụn.',
      'Chúc sớm thành phú bà, trúng số độc đắc rồi nhớ ai là bạn thân nhất mà bao ăn nhé!',
      'Chúc 10 anh theo đuổi, nhưng nhớ chọn anh nào giàu và biết bao cả nhóm bạn thân đi ăn.',
      'Mong deadline tự động biến mất, bài tập tự động xong, chỉ việc ngồi rung đùi đếm tiền.',
      'Tình bạn chúng mình như keo 502, dù mày có khùng cỡ nào thì tao vẫn phải chịu đựng thôi!',
      'Chúc mày luôn giữ được nụ cười vô tri và độ lầy lội đỉnh cao này nhé Trang Nhung!'
    ],
    photos: [
      { src: 'assets/photos/rabbit-feeding.jpg', alt: 'Trang Nhung cho thỏ ăn', caption: 'Khoảnh khắc bớt báo đời' },
      { src: 'assets/photos/cat-bouquet.jpg', alt: 'Mèo và hoa', caption: 'Mèo xinh nhưng không bằng ai đó' },
      { src: 'assets/photos/boat.jpg', alt: 'Bên hồ', caption: 'Lúc chưa quậy phá' },
      { src: 'assets/photos/green-dress.jpg', alt: 'Lên đồ sống ảo', caption: 'Lên đồ chụp ảnh sống ảo' },
      { src: 'assets/photos/teacher-flowers.jpg', alt: 'Hoa 20/10', caption: '20/10 bớt làm khổ bạn bè' }
    ]
  },
  'khanh-ngoc': {
    id: 'khanh-ngoc',
    name: 'Nguyễn Khánh Ngọc',
    shortName: 'Khánh Ngọc',
    icon: '✨',
    eyebrow: 'Happy 20.10',
    headline: 'Một ngày thật tươi<br>gửi <em>Khánh Ngọc.</em>',
    heroText: 'Gửi Khánh Ngọc một chút ngọt ngào nhân ngày 20/10 — chúc cậu luôn xinh đẹp, yêu đời và ngập tràn năng lượng tích cực!',
    heroCaption: 'Luôn vui vẻ rạng rỡ,<br>bạn thân nhé!',
    heroImage: 'assets/photos/green-dress.jpg',
    bloomCenter: 'Khánh Ngọc<br><small>20.10</small>',
    letterTitle: 'Gửi Khánh Ngọc,<br><em>cô bạn thân tuyệt vời.</em>',
    letterParagraphs: [
      'Nhân ngày 20/10, muốn gửi đến Khánh Ngọc một lời chúc thật chân thành và ấm áp nhất.',
      'Cảm ơn cậu vì đã luôn chia sẻ những câu chuyện buồn vui, luôn đồng hành và mang lại nguồn năng lượng rất dễ chịu cho cả nhóm.',
      'Chúc Ngọc luôn giữ được sự lạc quan, nụ cười tươi tắn và niềm đam mê trong mọi việc cậu làm.',
      'Mong mọi điều tốt đẹp nhất sẽ đến với cậu trong chặng đường sắp tới!'
    ],
    letterSign: 'Một lời chúc tươi vui, <span>gửi tặng Khánh Ngọc.</span>',
    finalWish: 'Chúc Khánh Ngọc 20/10 ngập tràn niềm vui,<br>xinh đẹp và hạnh phúc trọn vẹn!',
    signature: '— Một người bạn luôn ủng hộ Khánh Ngọc —',
    cinemaFinalTitle: 'Chúc Khánh Ngọc ngày 20/10<br>thật xinh đẹp & rực rỡ!',
    cinemaFinalCopy: 'Chúc ví tiền luôn căng đét, trà sữa uống không lo tăng cân, deadline nhẹ tênh!',
    cinemaWishes: [
      'Chúc Khánh Ngọc 20/10 luôn tươi tắn, xinh đẹp và rạng rỡ như ánh mặt trời.',
      'Mong mọi điều may mắn và những người tử tế nhất sẽ luôn đồng hành cùng cậu.',
      'Chúc ví tiền luôn căng đét, trà sữa uống không lo tăng cân, deadline nhẹ tênh.',
      'Chúc cậu luôn tự tin làm những điều mình thích và đạt được mọi mục tiêu phía trước.',
      'Mong những ngày tháng tới của Ngọc sẽ đầy ắp tiếng cười và những chuyến đi thú vị.',
      'Cảm ơn Khánh Ngọc vì luôn là một người bạn tuyệt vời và đáng tin cậy.',
      'Chúc cậu hôm nay nhận được thật nhiều hoa, nhiều quà và thật nhiều lời khen xinh đẹp!',
      'Hãy luôn yêu thương bản thân và tỏa sáng theo phong cách của riêng mình nhé!'
    ],
    photos: [
      { src: 'assets/photos/green-dress.jpg', alt: 'Khánh Ngọc rạng ngời', caption: 'Khánh Ngọc rạng ngời' },
      { src: 'assets/photos/boat.jpg', alt: 'Bên hồ', caption: 'Khoảnh khắc bình yên' },
      { src: 'assets/photos/teacher-flowers.jpg', alt: 'Hoa 20/10', caption: 'Hoa xinh gửi tặng Ngọc' },
      { src: 'assets/photos/cat-bouquet.jpg', alt: 'Mèo ôm hoa', caption: 'Một chút ngọt ngào' },
      { src: 'assets/photos/rabbit-feeding.jpg', alt: 'Cùng bạn nhỏ', caption: 'Nụ cười tỏa nắng' }
    ]
  },
  'thai-viet': {
    id: 'thai-viet',
    name: 'Hoàng Thái Việt',
    shortName: 'Thái Việt',
    icon: '🚀',
    eyebrow: 'Friendship · 20.10',
    headline: '20/10 vui tới bến<br>gửi <em>Thái Việt.</em>',
    heroText: 'Dù ngày 20/10 hay bất kỳ ngày nào, chúc Thái Việt luôn vui vẻ, bớt áp lực, phong độ ngời ngời và vạn sự hanh thông!',
    heroCaption: 'Chúc đồng chí Việt<br>ngày nào cũng đỉnh!',
    heroImage: 'assets/photos/boat.jpg',
    bloomCenter: 'Thái Việt<br><small>20.10</small>',
    letterTitle: 'Gửi Thái Việt,<br><em>người bạn chiến hữu của tôi.</em>',
    letterParagraphs: [
      'Nhân dịp 20/10, gửi vài dòng chúc ông bạn thân luôn giữ vững năng lượng tích cực và tinh thần lạc quan.',
      'Rất vui vì trong hành trình này có một người bạn đồng hành vừa vui tính, vừa nhiệt tình và đáng tin như ông.',
      'Chúc Thái Việt luôn có những bước tiến vững vàng, làm gì cũng suôn sẻ và gặt hái nhiều thành công.',
      'Hôm nay hãy cứ thư giãn và tận hưởng một ngày thật vui vẻ nhé!'
    ],
    letterSign: 'Gửi lời chúc chân thành, <span>đến chiến hữu Thái Việt.</span>',
    finalWish: 'Chúc Hoàng Thái Việt luôn phong độ,<br>may mắn và ngập tràn niềm vui!',
    signature: '— Người bạn thân chí cốt của ông —',
    cinemaFinalTitle: 'Chúc Thái Việt ngày 20/10<br>vui vẻ & phong độ ngời ngời!',
    cinemaFinalCopy: 'Ăn ngon ngủ kỹ, không lo deadline hành hạ, chơi game thắng liên tục!',
    cinemaWishes: [
      'Chúc Thái Việt ngày 20/10 vui vẻ, dù là ngày gì thì cũng chúc bạn tôi luôn vui!',
      'Chúc đồng chí sức khỏe dồi dào, ví dày như từ điển, tinh thần lúc nào cũng phơi phới.',
      'Mong công việc và học tập thuận lợi, gánh team xuất sắc và không lo tụt mood.',
      'Chúc Việt luôn giữ vững phong độ, hài hước và nhiệt huyết như mọi ngày.',
      'Ăn ngon ngủ kỹ, không bị deadline hành hạ, chơi game thì thắng liên tục.',
      'Cảm ơn vì đã luôn là người bạn chí cốt cực kỳ đáng tin cậy trong nhóm!',
      'Chúc mọi dự định sắp tới của ông đều thành công rực rỡ và phát tài sớm.',
      'Hôm nay cứ việc chill, nạp năng lượng và tận hưởng ngày thật trọn vẹn nhé!'
    ],
    photos: [
      { src: 'assets/photos/boat.jpg', alt: 'Thái Việt', caption: 'Phong độ ngời ngời' },
      { src: 'assets/photos/teacher-flowers.jpg', alt: 'Khoảnh khắc kỷ niệm', caption: 'Đồng chí chiến hữu' },
      { src: 'assets/photos/green-dress.jpg', alt: 'Bình yên', caption: 'Một ngày thảnh thơi' },
      { src: 'assets/photos/rabbit-feeding.jpg', alt: 'Thư giãn', caption: 'Không vướng bận deadline' },
      { src: 'assets/photos/cat-bouquet.jpg', alt: 'Mèo và hoa', caption: 'Chúc mừng 20/10' }
    ]
  },
  'hoi-ban-than': {
    id: 'hoi-ban-than',
    name: 'Hội Bạn Thân',
    shortName: 'Cả nhóm',
    icon: '💖',
    eyebrow: 'Special Squad · 20.10',
    headline: 'Món quà 20/10<br>cho <em>chúng mình.</em>',
    heroText: 'Dành tặng 4 người bạn thân thiết nhất: Diệu Ánh, Khánh Ngọc, Trang Nhung, Thái Việt. Chúc hội bạn của chúng mình luôn gắn bó, cùng nhau chia ngọt sẻ bùi và mãi keo lì!',
    heroCaption: 'Hội bạn thân 4 người,<br>mãi bên nhau nhé!',
    heroImage: 'assets/photos/cat-bouquet.jpg',
    bloomCenter: 'Hội Bạn<br><small>20.10</small>',
    letterTitle: 'Gửi Hội Bạn Thân,<br><em>những người bạn tuyệt vời nhất.</em>',
    letterParagraphs: [
      'Cảm ơn cuộc đời vì đã cho chúng mình gặp nhau và tạo nên một hội bạn thân đầy ắp tiếng cười (và cũng không thiếu những pha bất ổn).',
      'Dù mỗi người một tính cách — Diệu Ánh dịu dàng, Trang Nhung siêu lầy, Khánh Ngọc tươi tắn, Thái Việt chất chơi — nhưng khi ở cạnh nhau thì luôn là những khoảnh khắc vui vẻ và thoải mái nhất.',
      'Nhân ngày 20/10, chúc tất cả chúng mình ai cũng đạt được ước mơ, luôn mạnh khỏe, hạnh phúc và có thật nhiều tiền để cùng nhau đi du lịch khắp nơi.',
      'Mong tình bạn của chúng mình mãi bền lâu như bây giờ!'
    ],
    letterSign: 'Tình bạn diệu kỳ, <span>mãi mãi bên nhau!</span>',
    finalWish: 'Chúc hội bạn thân 20/10 thật rực rỡ,<br>mãi vui vẻ và gắn kết bên nhau!',
    signature: '— Từ một thành viên yêu quý hội bạn thân —',
    cinemaFinalTitle: 'Chúc hội bạn thân 20/10<br>mãi keo lì & bên nhau dài lâu!',
    cinemaFinalCopy: 'Chúc chúng mình ai cũng giàu sang, bớt áp lực và luôn có nhau trong mọi cuộc vui!',
    cinemaWishes: [
      'Chúc hội bạn thân chúng mình lúc nào cũng đông đủ và tràn ngập tiếng cười.',
      'Chúc Diệu Ánh luôn dịu dàng, Khánh Ngọc luôn xinh xắn, Trang Nhung bớt báo, Thái Việt luôn phong độ!',
      'Mong cả nhóm sớm làm giàu để kéo nhau đi du lịch xuyên Việt và ăn sập thế giới.',
      'Chúc tình bạn của chúng mình mãi keo sơn, bền chặt theo năm tháng.',
      'Cảm ơn vì đã luôn ở bên nhau lúc vui cũng như lúc buồn.',
      'Chúc ngày 20/10 thật ý nghĩa cho tất cả những người bạn thân yêu nhất!'
    ],
    photos: [
      { src: 'assets/photos/cat-bouquet.jpg', alt: 'Hội bạn thân', caption: 'Tình bạn chúng mình' },
      { src: 'assets/photos/teacher-flowers.jpg', alt: 'Khoảnh khắc đẹp', caption: 'Kỷ niệm khó quên' },
      { src: 'assets/photos/green-dress.jpg', alt: 'Bình yên', caption: 'Những ngày thảnh thơi' },
      { src: 'assets/photos/boat.jpg', alt: 'Bên hồ', caption: 'Một chút nắng đẹp' },
      { src: 'assets/photos/rabbit-feeding.jpg', alt: 'Niềm vui', caption: 'Nụ cười của chúng mình' }
    ]
  }
};

let currentActiveFriendKey = 'dieu-anh';

const friendElements = {
  heroEyebrow: document.getElementById('heroEyebrow'),
  heroHeadline: document.getElementById('heroHeadline'),
  heroCopyText: document.getElementById('heroCopyText'),
  heroCaption: document.getElementById('heroCaption'),
  heroImage: document.getElementById('heroImage'),
  letterEyebrow: document.getElementById('letterEyebrow'),
  thankYouTitle: document.getElementById('thankYouTitle'),
  letterBody: document.getElementById('letterBody'),
  letterSign: document.getElementById('letterSign'),
  bloomCenter: document.getElementById('bloomCenter'),
  endingFinalWish: document.getElementById('endingFinalWish'),
  endingSignature: document.getElementById('endingSignature'),
  cinemaFinalTitle: document.getElementById('cinemaFinalTitle'),
  cinemaFinalCopy: document.getElementById('cinemaFinalCopy'),
  shareFriendName: document.getElementById('shareFriendName'),
  shareToast: document.getElementById('shareToast'),
  shareFriendBtn: document.getElementById('shareFriendBtn'),
  portfolioGrid: document.getElementById('portfolioGrid')
};

function selectFriend(friendKey, { updateUrl = true } = {}) {
  const friend = FRIENDS_DATA[friendKey] || FRIENDS_DATA['dieu-anh'];
  currentActiveFriendKey = friend.id;

  // Update tabs active state
  document.querySelectorAll('.friend-tab').forEach(tab => {
    const isActive = tab.dataset.friend === friend.id;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  // Update URL query parameter
  if (updateUrl) {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('to', friend.id);
    window.history.replaceState({ friend: friend.id }, '', currentUrl.toString());
  }

  // Update share button label
  if (friendElements.shareFriendName) {
    friendElements.shareFriendName.textContent = friend.shortName;
  }

  // Update Hero content
  if (friendElements.heroEyebrow) friendElements.heroEyebrow.textContent = friend.eyebrow;
  if (friendElements.heroHeadline) friendElements.heroHeadline.innerHTML = friend.headline;
  if (friendElements.heroCopyText) friendElements.heroCopyText.textContent = friend.heroText;
  if (friendElements.heroCaption) friendElements.heroCaption.innerHTML = friend.heroCaption;
  if (friendElements.heroImage) {
    friendElements.heroImage.src = friend.heroImage;
    friendElements.heroImage.alt = `Ảnh của ${friend.shortName}`;
  }

  // Update Moments Grid
  if (friendElements.portfolioGrid && friend.photos && friend.photos.length) {
    const items = friendElements.portfolioGrid.querySelectorAll('.portfolio-item');
    friend.photos.forEach((photo, idx) => {
      if (items[idx]) {
        const btn = items[idx].querySelector('.portfolio-media');
        const img = items[idx].querySelector('img');
        const title = items[idx].querySelector('.portfolio-title');
        if (btn) btn.dataset.caption = photo.caption;
        if (img) {
          img.src = photo.src;
          img.alt = photo.alt;
        }
        if (title) title.textContent = photo.caption;
      }
    });
  }

  // Update Letter
  if (friendElements.letterEyebrow) friendElements.letterEyebrow.textContent = `A Note For ${friend.shortName}`;
  if (friendElements.thankYouTitle) friendElements.thankYouTitle.innerHTML = friend.letterTitle;
  if (friendElements.letterBody) {
    friendElements.letterBody.replaceChildren();
    friend.letterParagraphs.forEach((para, idx) => {
      const p = document.createElement('p');
      if (idx === friend.letterParagraphs.length - 1) {
        p.className = 'letter-emphasis';
      }
      p.textContent = para;
      friendElements.letterBody.appendChild(p);
    });
  }
  if (friendElements.letterSign) friendElements.letterSign.innerHTML = friend.letterSign;

  // Update Ending Flower and Final Wishes
  if (friendElements.bloomCenter) friendElements.bloomCenter.innerHTML = friend.bloomCenter;
  if (friendElements.endingFinalWish) friendElements.endingFinalWish.innerHTML = friend.finalWish;
  if (friendElements.endingSignature) friendElements.endingSignature.textContent = friend.signature;

  // Update Cinema Overlay Data
  if (friendElements.cinemaFinalTitle) friendElements.cinemaFinalTitle.innerHTML = friend.cinemaFinalTitle;
  if (friendElements.cinemaFinalCopy) friendElements.cinemaFinalCopy.textContent = friend.cinemaFinalCopy;
  if (friend.cinemaWishes && friend.cinemaWishes.length) {
    cinemaWishTexts = friend.cinemaWishes.slice();
  }
  if (friend.photos && friend.photos.length) {
    cinemaPhotos = friend.photos.slice();
    bouquetPhotos = cinemaPhotos.filter(photo => photo.src.indexOf('cat-bouquet') === -1);
  }
}

// Global Image Error Fallback to placeholder.svg
window.addEventListener('error', event => {
  if (event.target && event.target.tagName === 'IMG') {
    if (!event.target.dataset.hasFallback) {
      event.target.dataset.hasFallback = 'true';
      event.target.src = 'assets/photos/placeholder.svg';
    }
  }
}, true);

// Setup Friend Selector Tab Click Events
document.querySelectorAll('.friend-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const targetFriend = tab.dataset.friend;
    if (targetFriend) selectFriend(targetFriend, { updateUrl: true });
  });
});

// Setup Share Button Click
if (friendElements.shareFriendBtn) {
  friendElements.shareFriendBtn.addEventListener('click', async () => {
    const friend = FRIENDS_DATA[currentActiveFriendKey] || FRIENDS_DATA['dieu-anh'];
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('to', friend.id);
    const textToCopy = shareUrl.toString();

    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      const tempInput = document.createElement('input');
      tempInput.value = textToCopy;
      document.body.appendChild(tempInput);
      tempInput.select();
      try {
        document.execCommand('copy');
        copied = true;
      } catch {
        copied = false;
      }
      document.body.removeChild(tempInput);
    }

    if (friendElements.shareToast) {
      friendElements.shareToast.textContent = `✓ Đã sao chép link gửi cho ${friend.shortName}!`;
      friendElements.shareToast.classList.add('show');
      window.setTimeout(() => {
        friendElements.shareToast.classList.remove('show');
      }, 2500);
    }
  });
}

// Check initial URL parameters for ?to=
(function initializeActiveFriend() {
  const params = new URLSearchParams(window.location.search);
  const toParam = params.get('to');
  if (toParam && FRIENDS_DATA[toParam]) {
    selectFriend(toParam, { updateUrl: false });
  } else {
    selectFriend('dieu-anh', { updateUrl: false });
  }
})();

