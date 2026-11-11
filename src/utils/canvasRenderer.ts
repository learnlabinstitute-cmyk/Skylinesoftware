import { BabyProfile, VideoConfig } from '../types';
import { ASSET_IMAGES, DEFAULT_SCENES } from '../data/samplePresets';

// Cached Image elements
const imageCache: Record<string, HTMLImageElement> = {};

export function preloadAllImages(): Promise<void> {
  const urls = Object.values(ASSET_IMAGES);
  const promises = urls.map((url) => {
    if (imageCache[url]) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache[url] = img;
        resolve();
      };
      img.onerror = () => {
        resolve();
      };
      img.src = url;
    });
  });
  return Promise.all(promises).then(() => {});
}

// Sparkle particles state
interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speedY: number;
  speedX: number;
  color: string;
}

const particles: Particle[] = Array.from({ length: 45 }, () => ({
  x: Math.random(),
  y: Math.random(),
  size: 2 + Math.random() * 4,
  alpha: 0.3 + Math.random() * 0.7,
  speedY: -0.001 - Math.random() * 0.002,
  speedX: (Math.random() - 0.5) * 0.001,
  color: ['#FFD700', '#FFB6C1', '#FFFFFF', '#E6E6FA'][Math.floor(Math.random() * 4)],
}));

// Steam puff particles for locomotive
interface SteamParticle {
  x: number;
  y: number;
  scale: number;
  alpha: number;
  age: number;
}
const steamPuffs: SteamParticle[] = [
  { x: 0.5, y: 0.18, scale: 0.8, alpha: 0.4, age: 0 },
  { x: 0.52, y: 0.14, scale: 1.2, alpha: 0.3, age: 1 },
  { x: 0.49, y: 0.10, scale: 1.6, alpha: 0.15, age: 2 },
];

export function renderSceneToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  profile: BabyProfile,
  config: VideoConfig,
  customUploadedImage: HTMLImageElement | null = null,
  videoElement: HTMLVideoElement | null = null
) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Delegate to Jungle Safari renderer if theme is jungle_safari or videoSource is present
  if (profile.themeId === 'jungle_safari' || profile.videoSource) {
    renderJungleSceneToCanvas(
      ctx,
      width,
      height,
      currentTime,
      profile,
      config,
      customUploadedImage,
      videoElement
    );
    return;
  }

  // Find active scene
  let currentScene = DEFAULT_SCENES[0];
  for (const scene of DEFAULT_SCENES) {
    if (currentTime >= scene.startTime && currentTime < scene.startTime + scene.duration) {
      currentScene = scene;
      break;
    }
  }
  if (currentTime >= DEFAULT_SCENES[DEFAULT_SCENES.length - 1].startTime + DEFAULT_SCENES[DEFAULT_SCENES.length - 1].duration) {
    currentScene = DEFAULT_SCENES[DEFAULT_SCENES.length - 1];
  }

  const sceneProgress = Math.max(0, Math.min(1, (currentTime - currentScene.startTime) / currentScene.duration));

  // Determine background image based on theme, scene, and baby gender
  let bgImgUrl = ASSET_IMAGES.locomotiveFront;
  if (profile.themeId === 'cosmic_space') {
    bgImgUrl = ASSET_IMAGES.spaceGalaxy;
  } else if (profile.themeId === 'under_sea') {
    bgImgUrl = ASSET_IMAGES.oceanReef;
  } else if (profile.themeId === 'teddy_clouds') {
    bgImgUrl = ASSET_IMAGES.teddyClouds;
  } else if (profile.themeId === 'unicorn_rainbow') {
    bgImgUrl = ASSET_IMAGES.unicornRainbow;
  } else if (profile.themeId === 'racing_champion') {
    bgImgUrl = ASSET_IMAGES.racingChampion;
  } else if (profile.themeId === 'mint_safari') {
    bgImgUrl = currentScene.type === 'blessing_card' ? ASSET_IMAGES.royalFrame : ASSET_IMAGES.babyGarden;
  } else if (profile.themeId === 'royal_blue') {
    if (currentScene.type === 'baby_spotlight') {
      bgImgUrl = ASSET_IMAGES.babyBoy;
    } else if (currentScene.type === 'blessing_card') {
      bgImgUrl = ASSET_IMAGES.royalFrame;
    } else if (currentScene.type === 'baby_boarding') {
      bgImgUrl = ASSET_IMAGES.babySteps;
    } else {
      bgImgUrl = currentScene.type === 'intro_locomotive' ? ASSET_IMAGES.locomotiveFront : ASSET_IMAGES.trainCarriage;
    }
  } else {
    // fairytale_pink / default
    if (currentScene.type === 'baby_spotlight') {
      bgImgUrl = profile.gender === 'boy' ? ASSET_IMAGES.babyBoy : ASSET_IMAGES.babyGarden;
    } else if (currentScene.type === 'date_time_carriage' || currentScene.type === 'celebrate_carriage' || currentScene.type === 'venue_carriage') {
      bgImgUrl = ASSET_IMAGES.trainCarriage;
    } else if (currentScene.type === 'baby_boarding') {
      bgImgUrl = ASSET_IMAGES.babySteps;
    } else if (currentScene.type === 'blessing_card') {
      bgImgUrl = ASSET_IMAGES.royalFrame;
    }
  }

  const bgImg = imageCache[bgImgUrl];

  // 3D Parallax camera motion
  ctx.save();

  // Subtle breathing/floating camera zoom and pan
  const zoomFactor = 1.0 + Math.sin(currentTime * 0.8) * 0.02 + sceneProgress * 0.03;
  const panX = Math.sin(currentTime * 0.5) * (width * 0.015);
  const panY = Math.cos(currentTime * 0.4) * (height * 0.008);

  ctx.translate(width / 2 + panX, height / 2 + panY);
  ctx.scale(zoomFactor, zoomFactor);
  ctx.translate(-width / 2, -height / 2);

  // Draw background image
  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    // Cover scale
    const hRatio = width / bgImg.naturalWidth;
    const vRatio = height / bgImg.naturalHeight;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (width - bgImg.naturalWidth * ratio) / 2;
    const centerShiftY = (height - bgImg.naturalHeight * ratio) / 2;
    ctx.drawImage(
      bgImg,
      0,
      0,
      bgImg.naturalWidth,
      bgImg.naturalHeight,
      centerShiftX,
      centerShiftY,
      bgImg.naturalWidth * ratio,
      bgImg.naturalHeight * ratio
    );
  } else {
    // Elegant fallback gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#fbcfe8');
    grad.addColorStop(0.5, '#f472b6');
    grad.addColorStop(1, '#db2777');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw Scene Specific Overlays & Typography
  switch (currentScene.type) {
    case 'intro_locomotive':
      renderScene1Intro(ctx, width, height, sceneProgress, profile, currentTime);
      break;
    case 'baby_spotlight':
      renderScene2BabySpotlight(ctx, width, height, sceneProgress, profile, currentTime, customUploadedImage);
      break;
    case 'date_time_carriage':
      renderScene3DateTime(ctx, width, height, sceneProgress, profile, currentTime);
      break;
    case 'celebrate_carriage':
      renderScene4Celebrate(ctx, width, height, sceneProgress, profile, currentTime);
      break;
    case 'baby_boarding':
      renderScene5BabyBoarding(ctx, width, height, sceneProgress, profile, currentTime);
      break;
    case 'venue_carriage':
      renderScene6Venue(ctx, width, height, sceneProgress, profile, currentTime);
      break;
    case 'blessing_card':
      renderScene7Blessing(ctx, width, height, sceneProgress, profile, currentTime);
      break;
  }

  ctx.restore();


  // Draw floating particles & sparkles overlay
  renderSparkles(ctx, width, height, currentTime, config.sparkleIntensity);

  // Subtle vignette edge for cinematic look
  renderVignette(ctx, width, height);
}



// Scene 1: Locomotive Front with "Kiara is turning ONE!" round medallion
function renderScene1Intro(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number
) {
  // Medallion position: center-middle of boiler
  const centerX = width * 0.5;
  const centerY = height * 0.44;
  const radius = width * 0.31;

  // Gentle medallion wobble/wreath pulse
  const pulse = 1 + Math.sin(currentTime * 3) * 0.015;
  const entryAlpha = Math.min(1, progress * 3);

  ctx.save();
  ctx.globalAlpha = entryAlpha;
  ctx.translate(centerX, centerY);
  ctx.scale(pulse, pulse);

  // Soft luminous backing behind medallion
  const glow = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 1.3);
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  glow.addColorStop(0.7, 'rgba(255, 240, 245, 0.88)');
  glow.addColorStop(1, 'rgba(255, 215, 0, 0.4)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Ornate Gold Double Ring Border
  ctx.lineWidth = width * 0.015;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  ctx.lineWidth = width * 0.006;
  ctx.strokeStyle = '#FFF8DC';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.94, 0, Math.PI * 2);
  ctx.stroke();

  // Soft Inner shadow / floral rim feel
  ctx.lineWidth = width * 0.012;
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.89, 0, Math.PI * 2);
  ctx.stroke();

  // --- TEXT IN MEDALLION ---
  const isBoy = profile.gender === 'boy';
  const theme = profile.themeId;

  // Name in elegant script (e.g. Kiara, Noah, Marina, Leo...)
  const fontSizeName = Math.round(width * 0.13);
  ctx.font = `italic 700 ${fontSizeName}px "Great Vibes", "Playfair Display", cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const nameGrad = ctx.createLinearGradient(0, -radius * 0.45, 0, -radius * 0.05);
  let turningColor = '#831843';
  let emblemSymbol = '🌸 ♥ 🌸';

  if (theme === 'cosmic_space') {
    nameGrad.addColorStop(0, isBoy ? '#38bdf8' : '#e879f9');
    nameGrad.addColorStop(1, isBoy ? '#6366f1' : '#c084fc');
    turningColor = '#1e3a8a';
    emblemSymbol = '★ 🚀 ★';
  } else if (theme === 'under_sea') {
    nameGrad.addColorStop(0, '#06b6d4');
    nameGrad.addColorStop(1, isBoy ? '#0284c7' : '#0d9488');
    turningColor = '#0f766e';
    emblemSymbol = '★ 🐬 ★';
  } else if (theme === 'racing_champion') {
    nameGrad.addColorStop(0, '#ef4444');
    nameGrad.addColorStop(1, '#b91c1c');
    turningColor = '#7f1d1d';
    emblemSymbol = '🏁 🏆 🏁';
  } else if (theme === 'teddy_clouds') {
    if (isBoy) {
      nameGrad.addColorStop(0, '#0284c7');
      nameGrad.addColorStop(1, '#0369a1');
      turningColor = '#075985';
    } else {
      nameGrad.addColorStop(0, '#f43f5e');
      nameGrad.addColorStop(1, '#be185d');
      turningColor = '#9f1239';
    }
    emblemSymbol = '☁️ 🧸 ☁️';
  } else if (theme === 'unicorn_rainbow') {
    nameGrad.addColorStop(0, '#d946ef');
    nameGrad.addColorStop(1, '#9333ea');
    turningColor = '#701a75';
    emblemSymbol = '✨ 🦄 ✨';
  } else if (theme === 'royal_blue') {
    nameGrad.addColorStop(0, '#1d4ed8');
    nameGrad.addColorStop(1, '#1e3a8a');
    turningColor = '#172554';
    emblemSymbol = '👑 ⭐ 👑';
  } else if (theme === 'mint_safari') {
    nameGrad.addColorStop(0, '#0d9488');
    nameGrad.addColorStop(1, '#047857');
    turningColor = '#065f46';
    emblemSymbol = '🍃 🌼 🍃';
  } else {
    // fairytale_pink
    nameGrad.addColorStop(0, '#E11D48');
    nameGrad.addColorStop(1, '#BE185D');
    turningColor = '#831843';
    emblemSymbol = '🌸 ♥ 🌸';
  }

  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = nameGrad;
  ctx.fillText(profile.name || 'Our Little Star', 0, -radius * 0.22);

  // "is turning"
  ctx.shadowBlur = 0;
  const fontSizeTurning = Math.round(width * 0.05);
  ctx.font = `600 ${fontSizeTurning}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = turningColor;
  ctx.letterSpacing = '1px';
  ctx.fillText('is turning', 0, radius * 0.08);

  // "ONE!" in bold festive display
  const fontSizeOne = Math.round(width * 0.16);
  ctx.font = `800 ${fontSizeOne}px "Playfair Display", Georgia, serif`;
  const oneGrad = ctx.createLinearGradient(0, radius * 0.2, 0, radius * 0.65);
  if (isBoy || theme === 'royal_blue' || theme === 'racing_champion' || theme === 'cosmic_space') {
    oneGrad.addColorStop(0, '#f59e0b');
    oneGrad.addColorStop(0.5, '#d97706');
    oneGrad.addColorStop(1, '#b45309');
  } else {
    oneGrad.addColorStop(0, '#D946EF');
    oneGrad.addColorStop(0.5, '#EC4899');
    oneGrad.addColorStop(1, '#BE185D');
  }
  ctx.fillStyle = oneGrad;
  ctx.shadowColor = 'rgba(217, 70, 239, 0.3)';
  ctx.shadowBlur = 10;
  ctx.fillText('ONE!', 0, radius * 0.42);

  // Emblem icon below ONE!
  ctx.shadowBlur = 4;
  ctx.fillStyle = '#F59E0B';
  ctx.font = `${Math.round(width * 0.045)}px sans-serif`;
  ctx.fillText(emblemSymbol, 0, radius * 0.72);

  ctx.restore();

  // Steam puffs from chimney
  renderSteamPuffs(ctx, width, height, currentTime);
}

// Scene 2: Baby Spotlight in Garden (Supports uploaded baby photo in 3D floral cameo frame)
function renderScene2BabySpotlight(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number,
  customUploadedImage: HTMLImageElement | null
) {
  // If user uploaded a custom photo, render in a 3D animated floral cameo frame
  if (customUploadedImage && customUploadedImage.complete && customUploadedImage.naturalWidth > 0) {
    const frameX = width * 0.5;
    const frameY = height * 0.42;
    const frameR = width * 0.32;
    const floatOffset = Math.sin(currentTime * 2) * 8;

    ctx.save();
    ctx.translate(frameX, frameY + floatOffset);

    // Glowing halo
    const glow = ctx.createRadialGradient(0, 0, frameR * 0.8, 0, 0, frameR * 1.3);
    glow.addColorStop(0, 'rgba(255, 235, 205, 0.8)');
    glow.addColorStop(1, 'rgba(255, 182, 193, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, frameR * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // Clip circular photo
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, frameR, 0, Math.PI * 2);
    ctx.clip();

    // Draw user photo with center-crop
    const imgRatio = Math.max((frameR * 2) / customUploadedImage.naturalWidth, (frameR * 2) / customUploadedImage.naturalHeight);
    const drawW = customUploadedImage.naturalWidth * imgRatio;
    const drawH = customUploadedImage.naturalHeight * imgRatio;
    ctx.drawImage(customUploadedImage, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Ornate gold floral frame border
    ctx.lineWidth = width * 0.02;
    ctx.strokeStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(0, 0, frameR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = width * 0.008;
    ctx.strokeStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(0, 0, frameR - width * 0.015, 0, Math.PI * 2);
    ctx.stroke();

    // Cute crown / party hat on top of frame
    ctx.font = `${Math.round(width * 0.12)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('👑', 0, -frameR * 0.95);

    ctx.restore();
  }

  // Floating lower badge ribbon: "Meet Our Birthday Star"
  const bannerY = height * 0.78;
  const slideIn = Math.min(1, progress * 2.5);

  ctx.save();
  ctx.globalAlpha = slideIn;
  ctx.translate(width * 0.5, bannerY);

  // Soft frosted ribbon
  const bannerW = width * 0.85;
  const bannerH = height * 0.085;
  const rad = 20;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, -bannerW / 2, -bannerH / 2, bannerW, bannerH, rad);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#FBCFE8';
  ctx.stroke();

  // Banner text
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9D174D';
  ctx.font = `italic 700 ${Math.round(width * 0.075)}px "Great Vibes", cursive`;
  const bannerTitle = profile.gender === 'boy' ? 'Our Little Prince' : 'Our Little Princess';
  ctx.fillText(profile.name || bannerTitle, 0, -bannerH * 0.12);

  ctx.fillStyle = '#4B5563';
  ctx.font = `600 ${Math.round(width * 0.038)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText('1st Birthday Celebration', 0, bannerH * 0.28);

  ctx.restore();
}

// Scene 3: Date & Time carriage panel
function renderScene3DateTime(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number
) {
  renderCarriagePanel(ctx, width, height, progress, () => {
    // Title: Date & Time in calligraphy
    ctx.textAlign = 'center';
    ctx.font = `italic 700 ${Math.round(width * 0.11)}px "Great Vibes", cursive`;
    ctx.fillStyle = '#9D174D';
    ctx.shadowColor = 'rgba(244, 114, 182, 0.5)';
    ctx.shadowBlur = 8;
    ctx.fillText('Date & Time', 0, -height * 0.06);

    // Decorative separator line with diamond
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-width * 0.25, -height * 0.02);
    ctx.lineTo(width * 0.25, -height * 0.02);
    ctx.stroke();

    ctx.fillStyle = '#D4AF37';
    ctx.fillText('✦', 0, -height * 0.012);

    // Date
    ctx.font = `700 ${Math.round(width * 0.075)}px "Playfair Display", serif`;
    ctx.fillStyle = '#831843';
    ctx.fillText(profile.date || '15 June 2026', 0, height * 0.035);

    // Time (clean, without redundant "Time:" prefix)
    ctx.font = `600 ${Math.round(width * 0.046)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.fillText(profile.time || '6:00 PM onwards', 0, height * 0.08);
  });
}


// Scene 4: "Join us to celebrate the 1st birthday of Kiara"
function renderScene4Celebrate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number
) {
  renderCarriagePanel(ctx, width, height, progress, () => {
    ctx.textAlign = 'center';

    ctx.font = `600 ${Math.round(width * 0.052)}px "Playfair Display", serif`;
    ctx.fillStyle = '#64748B';
    ctx.fillText('Join us to celebrate', 0, -height * 0.07);

    ctx.font = `600 ${Math.round(width * 0.046)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#9D174D';
    ctx.fillText(`the ${profile.age || 1}${getOrdinal(profile.age || 1)} birthday of`, 0, -height * 0.025);

    // Huge glowing child's name
    ctx.font = `italic 700 ${Math.round(width * 0.16)}px "Great Vibes", cursive`;
    const nameGrad = ctx.createLinearGradient(0, height * 0.01, 0, height * 0.09);
    nameGrad.addColorStop(0, '#E11D48');
    nameGrad.addColorStop(1, '#BE185D');
    ctx.fillStyle = nameGrad;
    ctx.shadowColor = 'rgba(244, 114, 182, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText(profile.name || 'Our Princess', 0, height * 0.055);
  });
}

// Scene 5: Baby boarding train steps
function renderScene5BabyBoarding(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number
) {
  // Floating top badge
  const topY = height * 0.12;
  const alpha = Math.min(1, progress * 3);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(width * 0.5, topY);

  const badgeW = width * 0.78;
  const badgeH = height * 0.075;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 12;
  roundRect(ctx, -badgeW / 2, -badgeH / 2, badgeW, badgeH, 18);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#F472B6';
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';
  ctx.font = `italic 700 ${Math.round(width * 0.07)}px "Great Vibes", cursive`;
  ctx.fillStyle = '#BE185D';
  ctx.fillText('All Aboard!', 0, -badgeH * 0.1);

  ctx.font = `600 ${Math.round(width * 0.035)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#4B5563';
  ctx.fillText(`${profile.name || 'Baby'}'s Birthday Train`, 0, badgeH * 0.28);

  ctx.restore();
}

// Scene 6: Venue Carriage
function renderScene6Venue(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number
) {
  renderCarriagePanel(ctx, width, height, progress, () => {
    ctx.textAlign = 'center';

    // "Venue" title
    ctx.font = `italic 700 ${Math.round(width * 0.12)}px "Great Vibes", cursive`;
    ctx.fillStyle = '#9D174D';
    ctx.shadowColor = 'rgba(244, 114, 182, 0.5)';
    ctx.shadowBlur = 8;
    ctx.fillText('Venue', 0, -height * 0.06);

    ctx.shadowBlur = 0;
    // Gold separator
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-width * 0.25, -height * 0.02);
    ctx.lineTo(width * 0.25, -height * 0.02);
    ctx.stroke();

    // Venue Name
    ctx.font = `700 ${Math.round(width * 0.065)}px "Playfair Display", serif`;
    ctx.fillStyle = '#1E293B';
    ctx.fillText(profile.venueName || 'Little Stars Party Hall', 0, height * 0.035);

    // Venue Address
    ctx.font = `500 ${Math.round(width * 0.042)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#64748B';
    ctx.fillText(profile.venueAddress || 'Satellite Road, Ahmedabad', 0, height * 0.075);
  });
}

// Scene 7: Grand Invitation & Blessing Rococo Card
function renderScene7Blessing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number
) {
  const panelX = width * 0.5;
  const panelY = height * 0.48;
  const panelW = width * 0.82;
  const panelH = height * 0.48;
  const alpha = Math.min(1, progress * 2.5);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(panelX, panelY);

  // Frosted parchment card backing
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 24;
  roundRect(ctx, -panelW / 2, -panelH / 2, panelW, panelH, 24);
  ctx.fill();

  // Double gold & blush border
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#FBCFE8';
  roundRect(ctx, -panelW / 2 + 8, -panelH / 2 + 8, panelW - 16, panelH - 16, 20);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';

  // Opening note
  ctx.font = `italic 500 ${Math.round(width * 0.046)}px "Playfair Display", Georgia, serif`;
  ctx.fillStyle = '#831843';
  ctx.fillText('With love,', 0, -panelH * 0.36);

  ctx.font = `400 ${Math.round(width * 0.038)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#475569';
  const line1 = 'we invite you to celebrate our';
  const line2 = profile.gender === 'boy' ? "little prince's special day" : "little princess's special day";
  ctx.fillText(line1, 0, -panelH * 0.24);
  ctx.fillText(line2, 0, -panelH * 0.16);


  // Parents' Names in ornate cursive
  ctx.font = `italic 700 ${Math.round(width * 0.075)}px "Great Vibes", cursive`;
  ctx.fillStyle = '#BE185D';
  ctx.shadowColor = 'rgba(244, 114, 182, 0.4)';
  ctx.shadowBlur = 6;

  // Split parents names if '&' present
  const parents = profile.parentsNames || 'Mr. Rohan Patel & Mrs. Priya Patel';
  if (parents.includes('&')) {
    const parts = parents.split('&');
    ctx.fillText(parts[0].trim(), 0, -panelH * 0.02);
    ctx.font = `600 ${Math.round(width * 0.045)}px "Playfair Display", serif`;
    ctx.fillStyle = '#D4AF37';
    ctx.fillText('&', 0, panelH * 0.08);
    ctx.font = `italic 700 ${Math.round(width * 0.075)}px "Great Vibes", cursive`;
    ctx.fillStyle = '#BE185D';
    ctx.fillText(parts[1].trim(), 0, panelH * 0.19);
  } else {
    ctx.fillText(parents, 0, panelH * 0.06);
  }

  // Small floral flourish / RSVP
  ctx.shadowBlur = 0;
  ctx.font = `600 ${Math.round(width * 0.034)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('♥ Your Presence is Our Greatest Gift ♥', 0, panelH * 0.38);

  ctx.restore();
}

// Reusable Carriage Panel frame (matching the train coach side billboard)
function renderCarriagePanel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  contentCallback: () => void
) {
  const panelX = width * 0.5;
  const panelY = height * 0.38; // matches the carriage side billboard center
  const panelW = width * 0.78;
  const panelH = height * 0.26;

  const alpha = Math.min(1, progress * 3);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(panelX, panelY);

  // Frosted pearl plaque inside the train carriage floral frame
  const bgGrad = ctx.createLinearGradient(0, -panelH / 2, 0, panelH / 2);
  bgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  bgGrad.addColorStop(1, 'rgba(254, 242, 242, 0.92)');
  ctx.fillStyle = bgGrad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, -panelW / 2, -panelH / 2, panelW, panelH, 20);
  ctx.fill();

  // Plaque inner border
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#F9A8D4';
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#D4AF37';
  roundRect(ctx, -panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, panelH - 12, 16);
  ctx.stroke();

  // Run inner text
  contentCallback();

  ctx.restore();
}

// Steam puffs animation
function renderSteamPuffs(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const chimneyX = width * 0.5;
  const chimneyY = height * 0.08;

  ctx.save();
  for (let i = 0; i < steamPuffs.length; i++) {
    const puff = steamPuffs[i];
    const cycle = (time * 1.5 + puff.age) % 3;
    const norm = cycle / 3;
    const curY = chimneyY - norm * (height * 0.07);
    const curX = chimneyX + Math.sin(time * 2 + i) * 12;
    const curScale = (puff.scale + norm * 0.8) * (width * 0.07);
    const curAlpha = Math.max(0, (1 - norm) * puff.alpha);

    const grad = ctx.createRadialGradient(curX, curY, curScale * 0.2, curX, curY, curScale);
    grad.addColorStop(0, `rgba(255, 255, 255, ${curAlpha})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(curX, curY, curScale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Sparkle & floating fairy dust particles
function renderSparkles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  intensity: number
) {
  if (intensity <= 0) return;
  const count = Math.round((particles.length * intensity) / 100);

  ctx.save();
  for (let i = 0; i < count; i++) {
    const p = particles[i];
    // Update particle position
    p.y += p.speedY;
    p.x += p.speedX;
    if (p.y < 0) p.y = 1;
    if (p.x < 0) p.x = 1;
    if (p.x > 1) p.x = 0;

    const px = p.x * width;
    const py = p.y * height;
    const twinkle = 0.5 + Math.sin(currentTime * 5 + i * 2) * 0.5;

    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha * twinkle;

    // Draw four-point star sparkle
    drawSparkleStar(ctx, px, py, p.size * (0.8 + twinkle * 0.4));
  }
  ctx.restore();
}

function drawSparkleStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

// Cinematic soft vignette
function renderVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const radius = Math.max(width, height) * 0.75;
  const grad = ctx.createRadialGradient(width / 2, height / 2, radius * 0.55, width / 2, height / 2, radius);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.28)');

  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ==========================================
// JUNGLE SAFARI VIDEO THEME CANVAS RENDERER
// ==========================================
export function renderJungleSceneToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  profile: BabyProfile,
  config: VideoConfig,
  customUploadedImage: HTMLImageElement | null = null,
  videoElement: HTMLVideoElement | null = null
) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Compute cover-scale dimensions for the video frame (source is 720x1280)
  const vW = videoElement?.videoWidth || 720;
  const vH = videoElement?.videoHeight || 1280;
  const hRatio = width / vW;
  const vRatio = height / vH;
  const ratio = Math.max(hRatio, vRatio);
  const drawW = vW * ratio;
  const drawH = vH * ratio;
  const shiftX = (width - drawW) / 2;
  const shiftY = (height - drawH) / 2;

  // Draw the current video frame onto the canvas
  if (videoElement && videoElement.readyState >= 2) {
    ctx.drawImage(videoElement, shiftX, shiftY, drawW, drawH);
  } else {
    // Elegant Jungle fallback backdrop if video is still buffering
    const jungleGrad = ctx.createLinearGradient(0, 0, 0, height);
    jungleGrad.addColorStop(0, '#1c3d18');
    jungleGrad.addColorStop(0.5, '#2d5a27');
    jungleGrad.addColorStop(1, '#132810');
    ctx.fillStyle = jungleGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#fef08a';
    ctx.font = `italic 700 ${Math.round(width * 0.08)}px "Playfair Display", serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🦁 Jungle Safari Adventure 🌴', width / 2, height / 2 - 20);
    ctx.font = `600 ${Math.round(width * 0.04)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText('Loading 3D Safari Scene...', width / 2, height / 2 + 25);
  }

  // -------------------------------------------------------------
  // DYNAMIC OVERLAYS BY VIDEO TIME (0s to 37.14s)
  // -------------------------------------------------------------

  // --- SCENE 1: Jeep Safari Ride (0.0s to 10.0s) ---
  if (currentTime >= 0 && currentTime < 10) {
    renderJungleScene1JeepOverlays(
      ctx,
      shiftX,
      shiftY,
      drawW,
      drawH,
      currentTime,
      profile,
      customUploadedImage
    );
  }

  // --- SCENE 2: Wooden Carved Invitation Board (10.0s to 18.0s) ---
  else if (currentTime >= 10 && currentTime < 18) {
    renderJungleScene2InvitationOverlays(
      ctx,
      shiftX,
      shiftY,
      drawW,
      drawH,
      currentTime - 10,
      profile,
      customUploadedImage
    );
  }

  // --- SCENE 3: Party Venue & Cute Animals (18.0s to 29.0s) ---
  else if (currentTime >= 18 && currentTime < 29) {
    renderJungleScene3VenueOverlays(
      ctx,
      shiftX,
      shiftY,
      drawW,
      drawH,
      currentTime - 18,
      profile
    );
  }

  // --- SCENE 4: Overjoyed Parents & Blessed Grandparents (29.0s to 37.14s) ---
  else if (currentTime >= 29) {
    renderJungleScene4FamilyOverlays(
      ctx,
      shiftX,
      shiftY,
      drawW,
      drawH,
      currentTime - 29,
      profile
    );
  }

  // Ambient Jungle Fireflies & Golden Sparkles
  renderSparkles(ctx, width, height, currentTime, config.sparkleIntensity);

  // Subtle cinematic edge vignette
  renderVignette(ctx, width, height);
}

// ---------------------------------------------------------------------
// SCENE 1 OVERLAYS: Jeep Safari, Hanging Wooden Sign & License Plate
// ---------------------------------------------------------------------
function renderJungleScene1JeepOverlays(
  ctx: CanvasRenderingContext2D,
  shiftX: number,
  shiftY: number,
  drawW: number,
  drawH: number,
  time: number,
  profile: BabyProfile,
  customUploadedImage: HTMLImageElement | null
) {
  const isBoy = profile.gender === 'boy';
  const customName = profile.name || (isBoy ? 'Leo' : 'Aneira');

  // 1. Hanging Wooden Sign Overlay
  // In the original video: between 0s and 3.5s lion cub sits on top of the sign,
  // at ~3.5s lion jumps down to jeep. The wooden sign text is at Y: ~0.205
  // For Baby Boy, or when a custom name is used, render a realistic rustic wood plank:
  if (isBoy || profile.name !== 'Aneira') {
    // Only overlay when lion isn't covering (or with gentle blend)
    const signW = drawW * 0.72;
    const signH = drawH * 0.082;
    const signX = shiftX + drawW * 0.5 - signW / 2;
    const signY = shiftY + drawH * 0.203 - signH / 2;

    ctx.save();

    // Wood Plank Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Wood Plank Gradient
    const woodGrad = ctx.createLinearGradient(signX, signY, signX, signY + signH);
    woodGrad.addColorStop(0, '#7c4a21');
    woodGrad.addColorStop(0.3, '#945827');
    woodGrad.addColorStop(0.7, '#6b3c16');
    woodGrad.addColorStop(1, '#4e280c');
    ctx.fillStyle = woodGrad;
    roundRect(ctx, signX, signY, signW, signH, 10);
    ctx.fill();

    // Wood Carved Inner Border
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(2, drawW * 0.005);
    ctx.strokeStyle = '#381c06';
    ctx.stroke();

    // Golden / Brass Studs at four corners
    const studR = Math.max(3, drawW * 0.009);
    const studOffsets = [
      { x: signX + 16, y: signY + 12 },
      { x: signX + signW - 16, y: signY + 12 },
      { x: signX + 16, y: signY + signH - 12 },
      { x: signX + signW - 16, y: signY + signH - 12 },
    ];
    for (const stud of studOffsets) {
      const studGrad = ctx.createRadialGradient(stud.x - 1, stud.y - 1, 1, stud.x, stud.y, studR);
      studGrad.addColorStop(0, '#fef08a');
      studGrad.addColorStop(0.6, '#ca8a04');
      studGrad.addColorStop(1, '#713f12');
      ctx.fillStyle = studGrad;
      ctx.beginPath();
      ctx.arc(stud.x, stud.y, studR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Carved Wood Lettering
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const mainTitle = isBoy
      ? (customName && customName !== 'Leo' ? `${customName} is Turning One` : `Our Little Boy is Turning One`)
      : (customName && customName !== 'Aneira' ? `${customName} is Turning One` : `Our Little Girl is Turning One`);

    // Deep wood drop shadow for carved feel
    ctx.font = `800 ${Math.round(drawW * 0.052)}px "Playfair Display", Georgia, serif`;
    ctx.fillStyle = '#220f04';
    ctx.fillText(mainTitle, signX + signW / 2 + 1, signY + signH / 2 + 2);

    // Warm golden carved fill
    const textGrad = ctx.createLinearGradient(0, signY, 0, signY + signH);
    textGrad.addColorStop(0, '#fef3c7');
    textGrad.addColorStop(0.5, '#fde68a');
    textGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = textGrad;
    ctx.fillText(mainTitle, signX + signW / 2, signY + signH / 2);

    ctx.restore();
  }

  // 2. Luxury Safari Explorer Bumper Plaque
  // Completely and seamlessly eclipses the promotional "E-INVITE WITH REAL BABY FACE / BEST PRICE" text
  const badgeW = drawW * 0.58;
  const badgeH = drawH * 0.155;
  const badgeX = shiftX + drawW * 0.5 - badgeW / 2;
  const badgeY = shiftY + drawH * 0.725 - badgeH / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;

  // Outer Plaque Body - Forest Safari Olive & Gold
  const plaqueGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH);
  if (!isBoy) {
    // Elegant Safari Girl palette: rich rainforest olive-emerald with warm rosewood & champagne gold
    plaqueGrad.addColorStop(0, '#1c3d18');
    plaqueGrad.addColorStop(0.3, '#2a4d22');
    plaqueGrad.addColorStop(0.7, '#1f3d1b');
    plaqueGrad.addColorStop(1, '#11240f');
  } else {
    // Safari Boy palette: deep hunter green & dark mahogany
    plaqueGrad.addColorStop(0, '#152e14');
    plaqueGrad.addColorStop(0.3, '#234420');
    plaqueGrad.addColorStop(0.7, '#183416');
    plaqueGrad.addColorStop(1, '#0e1f0d');
  }

  ctx.fillStyle = plaqueGrad;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
  ctx.fill();

  // Polished Metallic Gold Outer Border
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = Math.max(3, drawW * 0.007);
  const goldBorderGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
  goldBorderGrad.addColorStop(0, '#fef08a');
  goldBorderGrad.addColorStop(0.3, '#eab308');
  goldBorderGrad.addColorStop(0.7, '#ca8a04');
  goldBorderGrad.addColorStop(1, '#854d0e');
  ctx.strokeStyle = goldBorderGrad;
  ctx.stroke();

  // Delicate Inner Gold Inset Line
  ctx.lineWidth = Math.max(1, drawW * 0.0025);
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
  roundRect(ctx, badgeX + 5, badgeY + 5, badgeW - 10, badgeH - 10, 8);
  ctx.stroke();

  // Corner Brass Rivets/Studs
  const studR = Math.max(2.5, drawW * 0.007);
  const boltPositions = [
    { x: badgeX + 10, y: badgeY + 10 },
    { x: badgeX + badgeW - 10, y: badgeY + 10 },
    { x: badgeX + 10, y: badgeY + badgeH - 10 },
    { x: badgeX + badgeW - 10, y: badgeY + badgeH - 10 },
  ];
  for (const b of boltPositions) {
    const bGrad = ctx.createRadialGradient(b.x - 1, b.y - 1, 0.5, b.x, b.y, studR);
    bGrad.addColorStop(0, '#fffbeb');
    bGrad.addColorStop(0.5, '#f59e0b');
    bGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, studR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top Small Header Line on Plaque
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(drawW * 0.026)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  const sublineText = !isBoy
    ? '🌸 WILD SAFARI EXPEDITION 🌿'
    : '🦁 JUNGLE SAFARI EXPEDITION 🌿';
  ctx.fillText(sublineText, badgeX + badgeW / 2, badgeY + badgeH * 0.32);

  // Main Prominent Baby Explorer Name Line
  ctx.font = `900 ${Math.round(drawW * 0.038)}px "Playfair Display", "Plus Jakarta Sans", sans-serif`;
  const mainNameGrad = ctx.createLinearGradient(0, badgeY + badgeH * 0.45, 0, badgeY + badgeH * 0.85);
  mainNameGrad.addColorStop(0, '#ffffff');
  mainNameGrad.addColorStop(0.4, '#fef08a');
  mainNameGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = mainNameGrad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  const plaqueMainTitle = profile.jungleBadgeText || `${customName.toUpperCase()} • TURNING ONE`;
  ctx.fillText(plaqueMainTitle, badgeX + badgeW / 2, badgeY + badgeH * 0.68);

  ctx.restore();

  // 3. Custom Uploaded Baby Photo in Safari Cameo Frame (if provided)
  if (customUploadedImage && customUploadedImage.complete && customUploadedImage.naturalWidth > 0) {
    renderSafariExplorerCameo(
      ctx,
      shiftX + drawW * 0.84,
      shiftY + drawH * 0.14,
      drawW * 0.12,
      customUploadedImage,
      customName,
      time
    );
  }
}

// ---------------------------------------------------------------------
// SCENE 2 OVERLAYS: Wooden Carved Invitation Board (10s to 18s)
// ---------------------------------------------------------------------
function renderJungleScene2InvitationOverlays(
  ctx: CanvasRenderingContext2D,
  shiftX: number,
  shiftY: number,
  drawW: number,
  drawH: number,
  sceneTime: number,
  profile: BabyProfile,
  customUploadedImage: HTMLImageElement | null
) {
  // If user changed the name from 'Aneira' or provided custom date/time:
  // Render seamless carved parchment/wood section
  const customName = profile.name || 'Aneira';
  const customDate = profile.date || 'Thursday | 20th August 2026';
  const customTime = profile.time || 'At 07:00 pm onwards';

  const boardW = drawW * 0.58;
  const boardH = drawH * 0.36;
  const boardX = shiftX + drawW * 0.5 - boardW / 2;
  const boardY = shiftY + drawH * 0.44 - boardH / 2;

  ctx.save();

  // Only overlay backing if name/date is customized
  if (customName !== 'Aneira' || !customDate.includes('20th August')) {
    // Soft wood texture patch matching the wooden board grain
    const boardGrad = ctx.createRadialGradient(
      boardX + boardW / 2,
      boardY + boardH / 2,
      boardW * 0.1,
      boardX + boardW / 2,
      boardY + boardH / 2,
      boardW * 0.6
    );
    boardGrad.addColorStop(0, 'rgba(217, 169, 120, 0.96)');
    boardGrad.addColorStop(0.7, 'rgba(196, 142, 94, 0.94)');
    boardGrad.addColorStop(1, 'rgba(164, 111, 65, 0.92)');

    ctx.fillStyle = boardGrad;
    ctx.shadowColor = 'rgba(67, 39, 17, 0.35)';
    ctx.shadowBlur = 12;
    roundRect(ctx, boardX, boardY, boardW, boardH, 16);
    ctx.fill();

    // Subtle inner carved border
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(107, 60, 22, 0.5)';
    ctx.stroke();

    // Text Lines
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Line 1: We cordially invite you all to the
    ctx.font = `600 ${Math.round(drawW * 0.034)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#2f4b1e';
    ctx.fillText('We cordially invite you all to the', boardX + boardW / 2, boardY + boardH * 0.15);

    // Line 2: 1ST BIRTHDAY Party of our
    ctx.font = `800 ${Math.round(drawW * 0.044)}px "Playfair Display", Georgia, serif`;
    ctx.fillStyle = '#1c3411';
    ctx.fillText('1ST BIRTHDAY Party of our', boardX + boardW / 2, boardY + boardH * 0.3);

    // Line 3: Child Name (Big & Elegant)
    const nameSize = Math.round(drawW * 0.082);
    ctx.font = `italic 700 ${nameSize}px "Cinzel", "Playfair Display", serif`;
    const nameGrad = ctx.createLinearGradient(0, boardY + boardH * 0.44, 0, boardY + boardH * 0.58);
    nameGrad.addColorStop(0, '#1a3310');
    nameGrad.addColorStop(1, '#0e1f08');
    ctx.fillStyle = nameGrad;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 4;
    ctx.fillText(customName, boardX + boardW / 2, boardY + boardH * 0.5);

    // Line 4: On Date
    ctx.shadowColor = 'transparent';
    ctx.font = `700 ${Math.round(drawW * 0.038)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#2b1b0b';
    ctx.fillText(customDate.startsWith('On ') ? customDate : `On ${customDate}`, boardX + boardW / 2, boardY + boardH * 0.68);

    // Line 5: At Time
    ctx.font = `600 ${Math.round(drawW * 0.036)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#38230e';
    ctx.fillText(customTime.startsWith('At ') ? customTime : `At ${customTime}`, boardX + boardW / 2, boardY + boardH * 0.82);
  }

  // Cameo badge if custom baby photo attached
  if (customUploadedImage && customUploadedImage.complete && customUploadedImage.naturalWidth > 0) {
    renderSafariExplorerCameo(
      ctx,
      shiftX + drawW * 0.5,
      boardY - drawH * 0.06,
      drawW * 0.13,
      customUploadedImage,
      customName,
      sceneTime
    );
  }

  ctx.restore();
}

// ---------------------------------------------------------------------
// SCENE 3 OVERLAYS: Party Venue & Animals (18s to 29s)
// ---------------------------------------------------------------------
function renderJungleScene3VenueOverlays(
  ctx: CanvasRenderingContext2D,
  shiftX: number,
  shiftY: number,
  drawW: number,
  drawH: number,
  sceneTime: number,
  profile: BabyProfile
) {
  const venueName = profile.venueName || 'VTP Purvanchal, Club house';
  const venueAddress = profile.venueAddress || 'Kesnand Road, wagholi, pune - 412207';

  // Check if venue has changed from default
  if (!venueName.includes('VTP Purvanchal') || !venueAddress.includes('Kesnand')) {
    const cardW = drawW * 0.56;
    const cardH = drawH * 0.34;
    const cardX = shiftX + drawW * 0.5 - cardW / 2;
    const cardY = shiftY + drawH * 0.44 - cardH / 2;

    ctx.save();

    // White parchment backdrop
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, cardX, cardY, cardW, cardH, 14);
    ctx.fill();

    // Green inner border
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#2d5a27';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // "Venue" title
    ctx.font = `800 ${Math.round(drawW * 0.058)}px "Playfair Display", Georgia, serif`;
    ctx.fillStyle = '#1c3d18';
    ctx.fillText('Venue', cardX + cardW / 2, cardY + cardH * 0.2);

    // Decorative leafy line
    ctx.font = `${Math.round(drawW * 0.032)}px sans-serif`;
    ctx.fillStyle = '#16a34a';
    ctx.fillText('🌿 ────── ❖ ────── 🌿', cardX + cardW / 2, cardY + cardH * 0.35);

    // Venue Name
    ctx.font = `700 ${Math.round(drawW * 0.044)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(venueName, cardX + cardW / 2, cardY + cardH * 0.52);

    // Venue Address (Wrapped)
    ctx.font = `500 ${Math.round(drawW * 0.034)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#334155';
    wrapText(ctx, venueAddress, cardX + cardW / 2, cardY + cardH * 0.72, cardW * 0.88, drawW * 0.042);

    ctx.restore();
  }
}

// ---------------------------------------------------------------------
// SCENE 4 OVERLAYS: Overjoyed Parents & Grandparents (29s to 37.14s)
// ---------------------------------------------------------------------
function renderJungleScene4FamilyOverlays(
  ctx: CanvasRenderingContext2D,
  shiftX: number,
  shiftY: number,
  drawW: number,
  drawH: number,
  sceneTime: number,
  profile: BabyProfile
) {
  const parents = profile.parentsNames || 'Prabhashankar & Prity';
  const grandparents = profile.grandparentsNames || 'Akhileshwar & Rita';

  if (!parents.includes('Prabhashankar') || !grandparents.includes('Akhileshwar')) {
    const cardW = drawW * 0.58;
    const cardH = drawH * 0.36;
    const cardX = shiftX + drawW * 0.5 - cardW / 2;
    const cardY = shiftY + drawH * 0.46 - cardH / 2;

    ctx.save();

    // White parchment backdrop
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, cardX, cardY, cardW, cardH, 14);
    ctx.fill();

    // Green inner border
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#2d5a27';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Overjoyed Parents Title
    ctx.font = `800 ${Math.round(drawW * 0.048)}px "Playfair Display", Georgia, serif`;
    ctx.fillStyle = '#1c3d18';
    ctx.fillText('Overjoyed Parents', cardX + cardW / 2, cardY + cardH * 0.2);

    // Parents Names
    ctx.font = `700 ${Math.round(drawW * 0.042)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(parents, cardX + cardW / 2, cardY + cardH * 0.36);

    // Blessed Grandparents Title
    ctx.font = `800 ${Math.round(drawW * 0.048)}px "Playfair Display", Georgia, serif`;
    ctx.fillStyle = '#1c3d18';
    ctx.fillText('Blessed Grandparents', cardX + cardW / 2, cardY + cardH * 0.6);

    // Grandparents Names
    ctx.font = `700 ${Math.round(drawW * 0.042)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(grandparents, cardX + cardW / 2, cardY + cardH * 0.76);

    ctx.restore();
  }
}

// ---------------------------------------------------------------------
// Safari Explorer Cameo Badge for Uploaded Baby Photo
// ---------------------------------------------------------------------
function renderSafariExplorerCameo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  img: HTMLImageElement,
  name: string,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Soft floating wobble
  const floatOffset = Math.sin(time * 2.5) * 4;
  ctx.translate(0, floatOffset);

  // Halo Glow
  const glow = ctx.createRadialGradient(0, 0, radius * 0.7, 0, 0, radius * 1.3);
  glow.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
  glow.addColorStop(1, 'rgba(34, 197, 94, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Circular Clip for Baby Photo
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.clip();

  const imgRatio = Math.max((radius * 2) / img.naturalWidth, (radius * 2) / img.naturalHeight);
  const drawW = img.naturalWidth * imgRatio;
  const drawH = img.naturalHeight * imgRatio;
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // Brass & Leaf Border
  ctx.lineWidth = Math.max(3, radius * 0.12);
  ctx.strokeStyle = '#eab308';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = Math.max(1.5, radius * 0.04);
  ctx.strokeStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(0, 0, radius - radius * 0.08, 0, Math.PI * 2);
  ctx.stroke();

  // Explorer Hat on top of cameo
  ctx.font = `${Math.round(radius * 0.7)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('🤠', 0, -radius * 0.88);

  ctx.restore();
}

// Simple Canvas Text Wrap Helper
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i].trim(), x, startY + i * lineHeight);
  }
}


