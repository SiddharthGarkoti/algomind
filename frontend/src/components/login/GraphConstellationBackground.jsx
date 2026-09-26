import { useEffect, useRef } from 'react';

/**
 * Dual-Theme Atmospheric Background
 * 
 * - DARK MODE: Cosmic Starfield with interactive cursor repulsion (100% UNTOUCHED).
 * - LIGHT MODE: Liquid Aurora / Iridescent Mesh Glow (Stripe / Apple Style) with
 *               fluid morphing color orbs and interactive cursor light flow.
 */
function GraphConstellationBackground({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse tracking
    const mouse = {
      x: -9999,
      y: -9999,
      prevX: -9999,
      prevY: -9999,
      trailX: width * 0.5,
      trailY: height * 0.5,
      radius: 140,
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // =========================================================================
    // 1. DARK MODE: Cosmic Starfield (Exact original code - 100% preserved)
    // =========================================================================
    const STAR_COUNT = width > 1024 ? 75 : 45;
    const stars = [];

    if (isDark) {
      for (let i = 0; i < STAR_COUNT; i++) {
        const isSparkle = i % 8 === 0;
        const x = Math.random() * width;
        const y = Math.random() * height;

        stars.push({
          baseX: x,
          baseY: y,
          x: x,
          y: y,
          vx: 0,
          vy: 0,
          size: isSparkle ? 7 + Math.random() * 5 : 1.2 + Math.random() * 2.0,
          isSparkle,
          twinkleSpeed: 0.02 + Math.random() * 0.03,
          twinklePhase: Math.random() * Math.PI * 2,
          driftSpeedX: (Math.random() - 0.5) * 0.2,
          driftSpeedY: (Math.random() - 0.5) * 0.2,
          colorIdx: Math.floor(Math.random() * 3),
        });
      }
    }

    const drawSparkle = (cx, cy, radius, alpha, color) => {
      ctx.save();
      ctx.beginPath();
      ctx.translate(cx, cy);
      ctx.fillStyle = color;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      const r = radius;
      const inner = radius * 0.22;
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(0, -inner, inner, 0);
      ctx.quadraticCurveTo(0, inner, 0, r);
      ctx.quadraticCurveTo(0, inner, -inner, 0);
      ctx.quadraticCurveTo(0, -inner, 0, -r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // =========================================================================
    // 2. LIGHT MODE: Liquid Aurora / Iridescent Mesh Glow (Stripe / Apple Style)
    // =========================================================================
    const auroraOrbs = [
      {
        baseX: width * 0.25,
        baseY: height * 0.35,
        radius: Math.min(width, height) * 0.45,
        colorStart: 'rgba(99, 102, 241, 0.24)', // Electric Indigo
        colorMid:   'rgba(168, 85, 247, 0.14)',
        speedX: 0.007,
        speedY: 0.009,
        ampX: 90,
        ampY: 70,
        phase: 0,
      },
      {
        baseX: width * 0.75,
        baseY: height * 0.45,
        radius: Math.min(width, height) * 0.48,
        colorStart: 'rgba(168, 85, 247, 0.25)', // Royal Violet
        colorMid:   'rgba(236, 72, 153, 0.12)',
        speedX: -0.008,
        speedY: 0.006,
        ampX: 110,
        ampY: 85,
        phase: Math.PI * 0.4,
      },
      {
        baseX: width * 0.5,
        baseY: height * 0.7,
        radius: Math.min(width, height) * 0.42,
        colorStart: 'rgba(56, 189, 248, 0.22)', // Fresh Cyan
        colorMid:   'rgba(99, 102, 241, 0.10)',
        speedX: 0.006,
        speedY: -0.007,
        ampX: 80,
        ampY: 90,
        phase: Math.PI * 0.8,
      },
      {
        baseX: width * 0.82,
        baseY: height * 0.25,
        radius: Math.min(width, height) * 0.38,
        colorStart: 'rgba(244, 114, 182, 0.20)', // Soft Rose
        colorMid:   'rgba(168, 85, 247, 0.08)',
        speedX: -0.009,
        speedY: -0.008,
        ampX: 70,
        ampY: 75,
        phase: Math.PI * 1.2,
      },
    ];

    let time = 0;

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse spring trail for liquid interaction
      if (mouse.x !== -9999) {
        mouse.trailX += (mouse.x - mouse.trailX) * 0.06;
        mouse.trailY += (mouse.y - mouse.trailY) * 0.06;
      }

      if (isDark) {
        // ── Render Dark Mode Starfield ───────────────────────────────────────
        const colors = ['#FFFFFF', '#C084FC', '#818CF8'];

        stars.forEach(star => {
          star.baseX += star.driftSpeedX;
          star.baseY += star.driftSpeedY;

          if (star.baseX < -20) star.baseX = width + 20;
          if (star.baseX > width + 20) star.baseX = -20;
          if (star.baseY < -20) star.baseY = height + 20;
          if (star.baseY > height + 20) star.baseY = -20;

          const dx = star.x - mouse.x;
          const dy = star.y - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouse.radius && dist > 0) {
            const force = (1 - dist / mouse.radius) * 4.5;
            const angle = Math.atan2(dy, dx);
            star.vx += Math.cos(angle) * force + Math.sin(angle) * (force * 0.4);
            star.vy += Math.sin(angle) * force - Math.cos(angle) * (force * 0.4);
          }

          star.vx *= 0.92;
          star.vy *= 0.92;
          star.x += (star.baseX - star.x) * 0.04 + star.vx;
          star.y += (star.baseY - star.y) * 0.04 + star.vy;

          const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
          const alpha = 0.35 + twinkle * 0.55;
          const color = colors[star.colorIdx];

          if (star.isSparkle) {
            const currentSize = star.size * (0.8 + twinkle * 0.35);
            drawSparkle(star.x, star.y, currentSize, alpha, color);
          } else {
            ctx.save();
            ctx.beginPath();
            const r = Math.max(0.8, star.size * (0.85 + twinkle * 0.25));
            ctx.arc(star.x, star.y, r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = color;
            ctx.globalAlpha = alpha;
            ctx.fill();

            if (r > 1.4) {
              ctx.beginPath();
              ctx.arc(star.x, star.y, r * 0.45, 0, Math.PI * 2);
              ctx.fillStyle = '#FFFFFF';
              ctx.globalAlpha = Math.min(1.0, alpha * 1.2);
              ctx.fill();
            }
            ctx.restore();
          }
        });
      } else {
        // ── Render Light Mode Liquid Aurora / Iridescent Mesh (Stripe / Apple Style) ──
        ctx.save();

        auroraOrbs.forEach(orb => {
          // Liquid harmonic morphing + gentle pull toward cursor
          const currentX =
            orb.baseX +
            Math.sin(time * orb.speedX + orb.phase) * orb.ampX +
            (mouse.trailX - orb.baseX) * 0.08;
          const currentY =
            orb.baseY +
            Math.cos(time * orb.speedY + orb.phase) * orb.ampY +
            (mouse.trailY - orb.baseY) * 0.08;

          const currentRadius =
            orb.radius + Math.sin(time * 0.015 + orb.phase) * (orb.radius * 0.12);

          const grad = ctx.createRadialGradient(
            currentX,
            currentY,
            0,
            currentX,
            currentY,
            currentRadius
          );
          grad.addColorStop(0, orb.colorStart);
          grad.addColorStop(0.5, orb.colorMid);
          grad.addColorStop(1, 'transparent');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(currentX, currentY, currentRadius, 0, Math.PI * 2);
          ctx.fill();
        });

        // Interactive dynamic cursor illumination pool (Apple Keynote glow)
        if (mouse.x !== -9999) {
          const cursorGlowRadius = 260;
          const cursorGrad = ctx.createRadialGradient(
            mouse.trailX,
            mouse.trailY,
            0,
            mouse.trailX,
            mouse.trailY,
            cursorGlowRadius
          );
          cursorGrad.addColorStop(0, 'rgba(168, 85, 247, 0.22)'); // Soft violet
          cursorGrad.addColorStop(0.45, 'rgba(99, 102, 241, 0.12)'); // Electric indigo
          cursorGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = cursorGrad;
          ctx.beginPath();
          ctx.arc(mouse.trailX, mouse.trailY, cursorGlowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDark]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}

export default GraphConstellationBackground;
