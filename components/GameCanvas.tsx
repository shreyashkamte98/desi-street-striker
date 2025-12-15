import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BallEntity, Goal, Obstacle, Particle, Vector, BallType, GameStats } from '../types';
import { GRAVITY, AIR_RESISTANCE, GROUND_FRICTION, BOUNCE_DAMPING, TAP_FORCE_Y, COLORS, MAX_POWER, SWIPE_THRESHOLD } from '../constants';

interface GameCanvasProps {
  isPlaying: boolean;
  onGameOver: (stats: GameStats) => void;
  onScoreUpdate: (score: number, combo: number, style: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ isPlaying, onGameOver, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mutable Game State (Refs for performance in loop)
  const ballRef = useRef<BallEntity>({
    x: 100, y: 300, vx: 0, vy: 0, radius: 15, rotation: 0, type: BallType.PLASTIC, isAirborne: true
  });
  const goalRef = useRef<Goal>({ x: 0, y: 0, width: 20, height: 120, moving: false, speedY: 2 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const statsRef = useRef<GameStats>({ score: 0, highScore: 0, combo: 0, stylePoints: 0 });
  const frameIdRef = useRef<number>(0);
  const isGameOverTriggered = useRef<boolean>(false);
  
  // Input State
  const inputRef = useRef({
    isTouching: false,
    startTime: 0,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0,
    power: 0
  });

  // Init logic
  const initLevel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset Game Over Flag
    isGameOverTriggered.current = false;

    // Reset Ball
    ballRef.current = {
      x: canvas.width * 0.2,
      y: canvas.height * 0.5,
      vx: 0,
      vy: 0,
      radius: canvas.width * 0.04,
      rotation: 0,
      type: BallType.PLASTIC,
      isAirborne: true
    };

    // Reset Goal (Positioned on the right side)
    goalRef.current = {
      x: canvas.width * 0.85,
      y: canvas.height * 0.4,
      width: 15,
      height: canvas.height * 0.2,
      moving: statsRef.current.score > 5, // Move after 5 goals
      speedY: 2 + (statsRef.current.score * 0.1)
    };

    obstaclesRef.current = [];
    // Add obstacles based on score level
    if (statsRef.current.score > 2) {
       // Simple pole
       obstaclesRef.current.push({
         id: 'pole1',
         x: canvas.width * 0.5,
         y: canvas.height - 100,
         width: 10,
         height: 100,
         type: 'POLE',
         speedX: 0,
         active: true
       });
    }
  }, []);

  // Physics Engine
  const updatePhysics = (dt: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ball = ballRef.current;
    const goal = goalRef.current;

    // 1. Gravity & Drag
    ball.vy += GRAVITY;
    ball.vx *= AIR_RESISTANCE;
    ball.vy *= AIR_RESISTANCE;

    // 2. Movement
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.rotation += ball.vx * 0.1;

    // 3. Goal Movement (Level difficulty)
    if (goal.moving) {
      goal.y += goal.speedY;
      if (goal.y < 50 || goal.y + goal.height > canvas.height - 50) {
        goal.speedY *= -1;
      }
    }

    // 4. Floor/Ceiling Collision
    if (ball.y + ball.radius > canvas.height - 20) { // Ground
        ball.y = canvas.height - 20 - ball.radius;
        ball.vy *= -BOUNCE_DAMPING;
        ball.vx *= GROUND_FRICTION;
        ball.isAirborne = false;
        
        // Dust particles
        if (Math.abs(ball.vy) > 2) createParticles(ball.x, ball.y + ball.radius, 5, COLORS.ground);
    } else if (ball.y - ball.radius < 0) { // Ceiling
        ball.y = ball.radius;
        ball.vy *= -BOUNCE_DAMPING;
    } else {
        ball.isAirborne = true;
    }

    // 5. Wall Collision
    if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx *= -BOUNCE_DAMPING;
    }

    // 6. Game Over Condition (Ball goes off screen right or stops moving too long)
    if (ball.x - ball.radius > canvas.width) {
        // Missed goal
        handleGameOver();
    }

    // 7. Goal Scoring Logic
    // Check if ball is within goal X range and Y range
    if (
        ball.x > goal.x && 
        ball.x < goal.x + goal.width &&
        ball.y > goal.y && 
        ball.y < goal.y + goal.height
    ) {
        handleGoal();
    }
    
    // 8. Obstacle Collision
    obstaclesRef.current.forEach(obs => {
        if (
            ball.x + ball.radius > obs.x &&
            ball.x - ball.radius < obs.x + obs.width &&
            ball.y + ball.radius > obs.y &&
            ball.y - ball.radius < obs.y + obs.height
        ) {
            // Simple elastic collision response
            ball.vx *= -1.2; // Bouncier off obstacles
            createParticles(ball.x, ball.y, 3, '#FFFFFF');
            statsRef.current.combo = 0; // Reset combo
            onScoreUpdate(statsRef.current.score, statsRef.current.combo, statsRef.current.stylePoints);
        }
    });

    // 9. Particle System
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        if (p.life <= 0) particlesRef.current.splice(i, 1);
    }
  };

  const createParticles = (x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
        particlesRef.current.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1.0,
            color,
            size: Math.random() * 3 + 1
        });
    }
  };

  const handleGoal = () => {
    if (isGameOverTriggered.current) return;

    // Detect "Perfect" goal (center of net)
    const goalCenter = goalRef.current.y + (goalRef.current.height / 2);
    const distFromCenter = Math.abs(ballRef.current.y - goalCenter);
    const isPerfect = distFromCenter < 15;

    let points = 1;
    if (isPerfect) {
        points = 3;
        statsRef.current.stylePoints += 10;
        createParticles(ballRef.current.x, ballRef.current.y, 20, COLORS.neon);
    }

    statsRef.current.score += points;
    statsRef.current.combo += 1;
    onScoreUpdate(statsRef.current.score, statsRef.current.combo, statsRef.current.stylePoints);

    // Reset ball for next shot but keep flow
    initLevel();
  };

  const handleGameOver = () => {
    if (isGameOverTriggered.current) return;
    isGameOverTriggered.current = true;

    onGameOver(statsRef.current);
    statsRef.current = { score: 0, highScore: 0, combo: 0, stylePoints: 0 };
    // initLevel will be called when playing starts again
  };

  // Rendering
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background (Sky)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, COLORS.skyStart);
    grad.addColorStop(1, COLORS.skyEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background Details (Posters/Walls)
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(50, canvas.height - 150, 100, 150); // Building silhouette
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, canvas.height - 100, canvas.width, 80); // Back wall

    // Goal
    const goal = goalRef.current;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(goal.x, goal.y);
    ctx.lineTo(goal.x, goal.y + goal.height);
    ctx.stroke();
    // Net pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<goal.height; i+=10) {
        ctx.moveTo(goal.x, goal.y + i);
        ctx.lineTo(goal.x + 20, goal.y + i + 5);
    }
    ctx.stroke();

    // Obstacles
    obstaclesRef.current.forEach(obs => {
        ctx.fillStyle = '#444';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // Ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // Ball
    const ball = ballRef.current;
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);
    
    // Draw Ball Body
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ball.base;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw Patches (Football look)
    ctx.beginPath();
    ctx.moveTo(0, -ball.radius);
    ctx.lineTo(0, ball.radius);
    ctx.moveTo(-ball.radius, 0);
    ctx.lineTo(ball.radius, 0);
    ctx.strokeStyle = COLORS.ball.patch;
    ctx.stroke();
    
    ctx.restore();

    // Particles
    particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // Power Meter (if charging)
    if (inputRef.current.isTouching) {
        const powerPercent = Math.min(inputRef.current.power / MAX_POWER, 1);
        ctx.fillStyle = `rgb(${255 * powerPercent}, ${255 * (1 - powerPercent)}, 0)`;
        ctx.fillRect(ball.x - 20, ball.y - ball.radius - 15, 40 * powerPercent, 5);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(ball.x - 20, ball.y - ball.radius - 15, 40, 5);
    }
  };

  const gameLoop = useCallback(() => {
    if (!isPlaying) return;
    
    // Update Input Power
    if (inputRef.current.isTouching) {
        inputRef.current.power += 0.5;
    }

    updatePhysics(1);
    draw();
    frameIdRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
        initLevel();
        frameIdRef.current = requestAnimationFrame(gameLoop);
    } else {
        cancelAnimationFrame(frameIdRef.current);
    }
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [isPlaying, gameLoop, initLevel]);


  // Input Handlers
  const handleStart = (clientX: number, clientY: number) => {
    if (!isPlaying) return;
    inputRef.current.isTouching = true;
    inputRef.current.startTime = Date.now();
    inputRef.current.startX = clientX;
    inputRef.current.startY = clientY;
    inputRef.current.currX = clientX;
    inputRef.current.currY = clientY;
    inputRef.current.power = 0;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isPlaying || !inputRef.current.isTouching) return;
    inputRef.current.currX = clientX;
    inputRef.current.currY = clientY;
  };

  const handleEnd = () => {
    if (!isPlaying || !inputRef.current.isTouching) return;
    inputRef.current.isTouching = false;
    
    const duration = Date.now() - inputRef.current.startTime;
    const dx = inputRef.current.currX - inputRef.current.startX;
    const dy = inputRef.current.currY - inputRef.current.startY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    const ball = ballRef.current;

    // 1. SWIPE (Curve/Dip)
    if (dist > SWIPE_THRESHOLD) {
        // Horizontal swipe = Curve
        if (Math.abs(dx) > Math.abs(dy)) {
             ball.vx += dx * 0.15; // Curve logic
             statsRef.current.stylePoints += 5;
        } 
        // Downward swipe = Dip / Knuckleball
        else if (dy > 0) {
            ball.vy += 10;
        }
    } 
    // 2. TAP (Quick Lift)
    else if (duration < 200) {
        ball.vy = TAP_FORCE_Y;
        createParticles(ball.x, ball.y + ball.radius, 5, '#fff');
    }
    // 3. HOLD (Power Shot)
    else {
        const power = Math.min(inputRef.current.power, MAX_POWER);
        ball.vx = power * 0.8; 
        ball.vy = -power * 0.8; // 45 degree launch approx
        createParticles(ball.x, ball.y, 15, 'orange');
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full touch-none"
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
    />
  );
};

export default GameCanvas;
