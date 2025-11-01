'use client';

import { useEffect, useRef } from 'react';

interface Shape {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  color: string;
  opacity: number;
  baseOpacity: number;
  pulseOffset: number;
  rotationSpeed: number;
  rotation: number;
  type: 'circle' | 'blob' | 'triangle';
  // Movement parameters for organic motion
  xFrequency: number;
  yFrequency: number;
  xAmplitude: number;
  yAmplitude: number;
  xPhase: number;
  yPhase: number;
  driftSpeed: number;
  speed: number; // Overall speed multiplier
  // Lifetime system
  lifetime: number;
  maxLifetime: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  age: number;
}

const THEME_COLORS = [
  'rgba(59, 130, 246, 0.08)',   // blue
  'rgba(147, 51, 234, 0.08)',   // purple
  'rgba(6, 182, 212, 0.08)',    // cyan
  'rgba(168, 85, 247, 0.06)',   // violet
  'rgba(99, 102, 241, 0.06)',   // indigo
  'rgba(14, 165, 233, 0.06)',   // sky
];

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapesRef = useRef<Shape[]>([]);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Helper function to create a new shape
    const createShape = (id: number): Shape => {
      const type = ['circle', 'blob', 'triangle'][Math.floor(Math.random() * 3)] as Shape['type'];
      const baseX = Math.random() * (canvas.width + 400) - 200;
      const baseY = Math.random() * (canvas.height + 400) - 200;
      const baseOpacity = 0.25 + Math.random() * 0.35;
      const speed = 0.5 + Math.random() * 1.5; // 0.5x to 2x speed
      const maxLifetime = 15000 + Math.random() * 25000; // 15-40 seconds
      
      return {
        id,
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        size: 150 + Math.random() * 300, // More size variation
        color: THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)],
        opacity: 0,
        baseOpacity,
        pulseOffset: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.0008 * speed,
        rotation: 0,
        type,
        // Movement parameters - scaled by speed
        xFrequency: (0.0001 + Math.random() * 0.00015) * speed,
        yFrequency: (0.0001 + Math.random() * 0.00015) * speed,
        xAmplitude: canvas.width * 0.6 + Math.random() * canvas.width * 0.4,
        yAmplitude: canvas.height * 0.6 + Math.random() * canvas.height * 0.4,
        xPhase: Math.random() * Math.PI * 2,
        yPhase: Math.random() * Math.PI * 2,
        driftSpeed: (0.00003 + Math.random() * 0.00003) * speed,
        speed,
        // Lifetime
        lifetime: 0,
        maxLifetime,
        fadeInDuration: 2000 + Math.random() * 2000, // 2-4 seconds
        fadeOutDuration: 2000 + Math.random() * 2000, // 2-4 seconds
        age: 0,
      };
    };

    // Initialize shapes with random properties
    const initShapes = () => {
      const shapes: Shape[] = [];
      const shapeCount = 3 + Math.floor(Math.random() * 3); // 3-5 shapes
      
      for (let i = 0; i < shapeCount; i++) {
        const shape = createShape(i);
        // Start with random ages so they don't all die at once
        shape.age = Math.random() * shape.maxLifetime * 0.5;
        shapes.push(shape);
      }
      shapesRef.current = shapes;
    };
    initShapes();

    // Animation loop
    const animate = () => {
      const deltaTime = 16.67; // Assume ~60fps
      timeRef.current += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw each shape
      shapesRef.current.forEach((shape, index) => {
        // Update age and lifetime
        shape.age += deltaTime;
        
        // Calculate fade multiplier based on lifetime
        let lifetimeFade = 1;
        if (shape.age < shape.fadeInDuration) {
          // Fading in
          lifetimeFade = shape.age / shape.fadeInDuration;
        } else if (shape.age > shape.maxLifetime - shape.fadeOutDuration) {
          // Fading out
          const timeUntilDeath = shape.maxLifetime - shape.age;
          lifetimeFade = timeUntilDeath / shape.fadeOutDuration;
        }
        
        // Check if shape has died
        if (shape.age >= shape.maxLifetime) {
          // Replace with new shape
          shapesRef.current[index] = createShape(shape.id);
          return; // Skip rendering this frame
        }
        
        // Update opacity with lifetime fade
        shape.opacity = shape.baseOpacity * lifetimeFade;
        
        // Slow drift of base position over time
        shape.baseX += Math.sin(timeRef.current * shape.driftSpeed) * 0.05 * shape.speed;
        shape.baseY += Math.cos(timeRef.current * shape.driftSpeed * 1.3) * 0.05 * shape.speed;
        
        // Calculate position using layered sine waves for organic, sweeping motion
        const xOffset1 = Math.sin(timeRef.current * shape.xFrequency + shape.xPhase) * shape.xAmplitude;
        const xOffset2 = Math.sin(timeRef.current * shape.xFrequency * 0.5 + shape.xPhase + 1) * (shape.xAmplitude * 0.3);
        const yOffset1 = Math.sin(timeRef.current * shape.yFrequency + shape.yPhase) * shape.yAmplitude;
        const yOffset2 = Math.cos(timeRef.current * shape.yFrequency * 0.7 + shape.yPhase + 2) * (shape.yAmplitude * 0.4);
        
        // Combine base position with oscillations for smooth, sweeping patterns
        shape.x = shape.baseX + xOffset1 + xOffset2;
        shape.y = shape.baseY + yOffset1 + yOffset2;
        
        // Wrap base position around edges to prevent drift off-screen
        if (shape.baseX < -200) shape.baseX = canvas.width + 200;
        if (shape.baseX > canvas.width + 200) shape.baseX = -200;
        if (shape.baseY < -200) shape.baseY = canvas.height + 200;
        if (shape.baseY > canvas.height + 200) shape.baseY = -200;

        // Update rotation for additional organic feel
        shape.rotation += shape.rotationSpeed;

        // Pulsing glow effect
        const pulse = Math.sin(timeRef.current * 0.5 * shape.speed + shape.pulseOffset) * 0.15 + 0.85;
        const currentSize = shape.size * pulse;
        const currentOpacity = shape.opacity * pulse;

        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);

        // Create gradient for each shape
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentSize);
        const baseColor = shape.color.replace(/[\d.]+\)$/, `${currentOpacity})`);
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(0.5, baseColor.replace(/[\d.]+\)$/, `${currentOpacity * 0.5})`));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;

        // Draw shape based on type
        switch (shape.type) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'blob':
            // Organic blob shape
            ctx.beginPath();
            const points = 8;
            for (let i = 0; i < points; i++) {
              const angle = (i / points) * Math.PI * 2;
              const radiusVariation = 0.7 + Math.sin(timeRef.current * 0.3 + i) * 0.3;
              const radius = currentSize * radiusVariation;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                const prevAngle = ((i - 1) / points) * Math.PI * 2;
                const prevRadiusVariation = 0.7 + Math.sin(timeRef.current * 0.3 + (i - 1)) * 0.3;
                const prevRadius = currentSize * prevRadiusVariation;
                const cpx1 = Math.cos(prevAngle + 0.3) * prevRadius;
                const cpy1 = Math.sin(prevAngle + 0.3) * prevRadius;
                const cpx2 = Math.cos(angle - 0.3) * radius;
                const cpy2 = Math.sin(angle - 0.3) * radius;
                ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y);
              }
            }
            ctx.closePath();
            ctx.fill();
            break;

          case 'triangle':
            // Soft triangle
            ctx.beginPath();
            ctx.moveTo(0, -currentSize);
            ctx.lineTo(currentSize * 0.866, currentSize * 0.5);
            ctx.lineTo(-currentSize * 0.866, currentSize * 0.5);
            ctx.closePath();
            ctx.fill();
            break;
        }

        // Additional ambient glow layer
        if (Math.random() > 0.7) { // Only on some shapes for subtlety
          ctx.globalCompositeOperation = 'screen';
          const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentSize * 1.5);
          const glowColor = shape.color.replace(/[\d.]+\)$/, `${currentOpacity * 0.2})`);
          glowGradient.addColorStop(0, glowColor);
          glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(0, 0, currentSize * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        }

        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden pointer-events-none -z-10">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 blur-3xl"
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      />
    </div>
  );
}
