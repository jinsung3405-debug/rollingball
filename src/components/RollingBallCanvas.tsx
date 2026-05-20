/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Sliders, 
  Maximize2, 
  Dribbble, 
  Cpu, 
  Compass, 
  Anchor,
  HelpCircle
} from 'lucide-react';
import { RailElement, Ball, SimulationConfig, RailType } from '../types';
import { SIMULATION_PRESETS } from '../presets';

interface RollingBallCanvasProps {
  presets: typeof SIMULATION_PRESETS;
  activePresetId: string;
  onPresetChange: (id: string) => void;
  elements: RailElement[];
  setElements: React.Dispatch<React.SetStateAction<RailElement[]>>;
  config: SimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
}

interface Segment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  onCollide?: (ball: Ball, normal: { x: number, y: number }) => void;
}

export default function RollingBallCanvas({
  presets,
  activePresetId,
  onPresetChange,
  elements,
  setElements,
  config,
  setConfig
}: RollingBallCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Simulation Running State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  
  // Balls Pool
  const [balls, setBalls] = useState<Ball[]>([]);
  
  // Active selected element inside Editor
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Dragging states
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [rotationalStartAngle, setRotationalStartAngle] = useState<number>(0);
  const [elementStartAngle, setElementStartAngle] = useState<number>(0);

  // Ball Dragging states
  const [draggedBallId, setDraggedBallId] = useState<string | null>(null);
  const [draggedBallOffset, setDraggedBallOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMousePosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  // Stats
  const [fps, setFps] = useState<number>(60);
  const [totalSimulatedCount, setTotalSimulatedCount] = useState<number>(0);
  const [recycleEnabled, setRecycleEnabled] = useState<boolean>(true);

  // Keep references of configurations to prevent loop closures
  const configRef = useRef<SimulationConfig>(config);
  const isRunningRef = useRef<boolean>(isRunning);
  const elementsRef = useRef<RailElement[]>(elements);
  const ballsRef = useRef<Ball[]>([]);
  const recycleRef = useRef<boolean>(recycleEnabled);
  const draggedBallIdRef = useRef<string | null>(null);

  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { elementsRef.current = elements; }, [elements]);
  useEffect(() => { ballsRef.current = balls; }, [balls]);
  useEffect(() => { recycleRef.current = recycleEnabled; }, [recycleEnabled]);
  useEffect(() => { draggedBallIdRef.current = draggedBallId; }, [draggedBallId]);

  // Keyboard controls for precise movement and rotation nudges
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      const nudgeAmount = e.shiftKey ? 10 : 2;
      const angleNudge = e.shiftKey ? 15 : 5;
      let keyHandled = false;
      
      setElements(prev => prev.map(el => {
        if (el.id === selectedId) {
          keyHandled = true;
          
          let nextX = el.x;
          let nextY = el.y;
          let nextAngle = el.angle;
          let nextWidth = el.width;
          
          if (e.key === 'ArrowLeft') {
            nextX = Math.max(25, el.x - nudgeAmount);
          } else if (e.key === 'ArrowRight') {
            nextX = Math.min(775, el.x + nudgeAmount);
          } else if (e.key === 'ArrowUp') {
            nextY = Math.max(30, el.y - nudgeAmount);
          } else if (e.key === 'ArrowDown') {
            nextY = Math.min(570, el.y + nudgeAmount);
          } else if (e.key === '[' || e.key === 'r' || e.key === 'R') {
            nextAngle = (el.angle - angleNudge) % 360;
          } else if (e.key === ']' || e.key === 'e' || e.key === 'E') {
            nextAngle = (el.angle + angleNudge) % 360;
          } else if (e.key === '-' || e.key === '_') {
            nextWidth = Math.max(50, el.width - nudgeAmount * 2);
          } else if (e.key === '=' || e.key === '+') {
            nextWidth = Math.min(400, el.width + nudgeAmount * 2);
          } else {
            keyHandled = false;
            return el;
          }
          
          const offsets: Partial<RailElement> = {};
          if (el.type === 'lever_vertical') {
            offsets.pivotX = nextX - 20;
            offsets.pivotY = nextY + 30;
          }
          if (el.type === 'lever_horizontal') {
            offsets.pivotX = nextX;
            offsets.pivotY = nextY;
          }
          
          return {
            ...el,
            x: nextX,
            y: nextY,
            angle: nextAngle,
            currentAngle: nextAngle,
            width: nextWidth,
            ...offsets
          };
        }
        return el;
      }));
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
        e.preventDefault();
      }
      
      if (keyHandled) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId]);

  // Handle preset loading
  const handleLoadPreset = (presetId: string) => {
    const p = presets.find(pr => pr.id === presetId);
    if (p) {
      // Create deep copy of preset elements so state modifications are encapsulated
      const copiedElements = JSON.parse(JSON.stringify(p.elements));
      setElements(copiedElements);
      setBalls([]);
      // Highlight new setup
      setSelectedId(null);
      // Spawn initial 3 balls for excellent demo
      setTimeout(() => {
        spawnBallSeries(3);
      }, 150);
    }
    onPresetChange(presetId);
  };

  // On mount, load initial preset
  useEffect(() => {
    handleLoadPreset(activePresetId);
  }, []);

  // Spawn balls
  const spawnBall = (customMass?: number, customColor?: string, customX?: number, customY?: number) => {
    // Find a spawner to drop the ball from, otherwise spawn at top center
    const spawner = elementsRef.current.find(e => e.type === 'spawner');
    const startX = customX !== undefined ? customX : (spawner ? spawner.x : 150);
    const startY = customY !== undefined ? customY : (spawner ? spawner.y + 10 : 60);

    const mass = customMass || configRef.current.selectedBallMass;
    const color = customColor || configRef.current.selectedBallColor;
    
    // Slight jitter to prevent exact stacking merges
    const jitterX = (Math.random() - 0.5) * 8;
    const radius = 9 + Math.log2(mass) * 1.5; // Visual scale of radius for mass

    const newBall: Ball = {
      id: 'ball_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
      x: startX + jitterX,
      y: startY,
      vx: (Math.random() - 0.5) * 1.2,
      vy: 0.2, // Initial downward drift
      radius,
      mass,
      color,
      trail: [],
      isCaptured: false,
      capturedBy: null
    };

    setBalls(prev => [...prev.slice(-24), newBall]); // Cap at 25 balls max for performance safety
    setTotalSimulatedCount(c => c + 1);
  };

  const spawnBallSeries = (count: number) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        spawnBall();
      }, i * 450);
    }
  };

  const clearBalls = () => {
    setBalls([]);
  };

  // Helper point rotators
  const rotatePoint = (px: number, py: number, cx: number, cy: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = px - cx;
    const dy = py - cy;
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos
    };
  };

  // Collision segment extraction (Translates structural models to segments)
  const getSegmentsForElement = (el: RailElement): Segment[] => {
    const segments: Segment[] = [];
    
    if (el.type === 'rail_straight') {
      const rad = (el.angle * Math.PI) / 180;
      const dx = Math.cos(rad) * (el.width / 2);
      const dy = Math.sin(rad) * (el.width / 2);
      // Top Surface Segment
      segments.push({
        ax: el.x - dx,
        ay: el.y - dy,
        bx: el.x + dx,
        by: el.y + dy
      });
    } 
    else if (el.type === 'rail_curve') {
      // Curved rail bowl. Let's model it as a parabolic dip, made of 10 segments
      const segmentCount = 10;
      const radiusX = el.width / 2;
      const radiusY = el.height;
      
      const points: {x: number, y: number}[] = [];
      for (let i = 0; i <= segmentCount; i++) {
        const ratio = i / segmentCount; // 0 to 1
        const localAngle = Math.PI + ratio * Math.PI; // Semi-circle sweep downwards: 180 to 360 deg
        const lx = el.x + radiusX * Math.cos(localAngle);
        // scaled parabola
        const ly = el.y + radiusY * Math.sin(localAngle) * -1; // Curving downwards
        
        // Rotate the curved segment around the component center
        const rotated = rotatePoint(lx, ly, el.x, el.y, el.angle);
        points.push(rotated);
      }

      // Chain points to segments
      for (let i = 0; i < points.length - 1; i++) {
        segments.push({
          ax: points[i].x,
          ay: points[i].y,
          bx: points[i+1].x,
          by: points[i+1].y
        });
      }
    } 
    else if (el.type === 'lever_horizontal') {
      // Pivoting see-saw
      const curAngle = el.currentAngle !== undefined ? el.currentAngle : el.angle;
      const rad = (curAngle * Math.PI) / 180;
      const dx = Math.cos(rad) * (el.width / 2);
      const dy = Math.sin(rad) * (el.width / 2);
      
      segments.push({
        ax: el.x - dx,
        ay: el.y - dy,
        bx: el.x + dx,
        by: el.y + dy,
        // Custom torque applicator on collision
        onCollide: (ball, normal) => {
          // Calculate distance along the lever from pivot center
          const ballProjX = ball.x - el.x;
          const ballProjY = ball.y - el.y;
          // Distance dot product along the lever direction vector
          const lvX = Math.cos(rad);
          const lvY = Math.sin(rad);
          const distAlong = ballProjX * lvX + ballProjY * lvY; // -width/2 to +width/2
          
          // Apply torque proportional to the distance from pivot and ball mass
          const torqueFactor = 0.0006 * configRef.current.gravity;
          const leverDirectionForce = distAlong * ball.mass * torqueFactor;
          
          // Slowly accelerate the lever rotation velocity
          el.wheelSpeed = (el.wheelSpeed || 0) + leverDirectionForce;
        }
      });
    }
    else if (el.type === 'collector') {
      // Fences around the basket: Left, Right and Bottom floor
      const w = el.width;
      const h = el.height;
      
      // Let's create segment boundaries
      const leftWall = { ax: el.x - w/2, ay: el.y - h, bx: el.x - w/2, by: el.y };
      const rightWall = { ax: el.x + w/2, ay: el.y - h, bx: el.x + w/2, by: el.y };
      const floor = { ax: el.x - w/2, ay: el.y, bx: el.x + w/2, by: el.y };
      
      segments.push(leftWall, rightWall, floor);
    }
    else if (el.type === 'spawner') {
      // Small funnels on the sides to catch balls and route them inside
      const w = el.width;
      const h = el.height;
      const funnelLeft = { ax: el.x - w/2, ay: el.y - h, bx: el.x - w/4, by: el.y };
      const funnelRight = { ax: el.x + w/2, ay: el.y - h, bx: el.x + w/4, by: el.y };
      const nozzle = { ax: el.x - w/4, ay: el.y, bx: el.x + w/4, by: el.y };
      
      segments.push(funnelLeft, funnelRight, nozzle);
    }

    return segments;
  };

  // Main Logic Physics Simulation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsInterval = setInterval(() => {
      setFps(frameCount);
      frameCount = 0;
    }, 1000);

    const runPhysicsLoop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 16.666, 2.5); // Cap dt lag spikes
      lastTime = now;
      
      frameCount++;

      const isRunningNow = isRunningRef.current;
      const currentElements = [...elementsRef.current];
      const activeBalls = [...ballsRef.current];
      const cfg = configRef.current;

      if (isRunningNow) {
        // --- 1. Dynamic Triggers Rotation Updates ---
        currentElements.forEach(el => {
          // Horizontal See-saw
          if (el.type === 'lever_horizontal') {
            const defaultAngle = el.angle;
            const current = el.currentAngle ?? defaultAngle;
            
            // Apply return spring force (tends to level it)
            const springRatio = 1.05;
            const springTorque = -0.015 * (current - defaultAngle) * springRatio;
            
            // Friction damping
            let speed = (el.wheelSpeed || 0) + springTorque * dt;
            speed *= Math.pow(0.92, dt); // viscous damping
            
            let nextAngle = current + speed * dt * cfg.speedFactor;
            
            // Limit limits of tilting: e.g. defaultAngle +/- 22 degrees
            const maxDeviation = 22;
            if (nextAngle > defaultAngle + maxDeviation) {
              nextAngle = defaultAngle + maxDeviation;
              speed = -speed * 0.15; // Bounce off limits slightly
            } else if (nextAngle < defaultAngle - maxDeviation) {
              nextAngle = defaultAngle - maxDeviation;
              speed = -speed * 0.15;
            }
            
            el.currentAngle = nextAngle;
            el.wheelSpeed = speed;
          }

          // Vertical Tipping Bucket Lever
          if (el.type === 'lever_vertical') {
            const hasBall = activeBalls.some(b => b.isCaptured && b.capturedBy === el.id);
            const targetAngle = hasBall ? 72 : 0; // Tip down 72 deg when full, return back when empty
            
            let cur = el.currentAngle ?? 0;
            const rotationSpeed = hasBall ? 3.5 : 2.5; // speeds of swinging
            
            if (cur < targetAngle) {
              cur = Math.min(targetAngle, cur + rotationSpeed * dt * cfg.speedFactor);
            } else if (cur > targetAngle) {
              cur = Math.max(targetAngle, cur - rotationSpeed * dt * cfg.speedFactor);
            }
            el.currentAngle = cur;
          }

          // Waterwheel Speed Rotation
          if (el.type === 'waterwheel') {
            let speed = el.wheelSpeed || 0;
            const R = el.width / 2;
            
            // Sum gravitational balance torque of all captured balls on wheel
            let totalTorque = 0;
            activeBalls.forEach(b => {
              if (b.isCaptured && b.capturedBy === el.id && b.captureRelativeAngle !== undefined) {
                const currentRelAngle = (el.angle * Math.PI / 180) + b.captureRelativeAngle;
                // Torque depends on horizontal projection coordinate displacement: cos(angle)
                // Down is positive y, clockwise rotation means gravity pulls right side downwards
                totalTorque += b.mass * cfg.gravity * Math.cos(currentRelAngle) * 0.003;
              }
            });

            // Return slightly back angular return frictional friction coefficient
            speed += totalTorque * dt;
            speed *= Math.pow(0.98, dt); // low friction damping
            
            el.wheelSpeed = speed;
            el.angle = (el.angle + speed * dt * 5) % 360;
          }
        });

        // --- 2. Balls Navigation and Kinematics Physics Update ---
        const updatedBalls = activeBalls.map(ball => {
          // If the ball is dragged by the user, skip standard gravity and collisions
          if (ball.id === draggedBallIdRef.current) {
            ball.trail.push({ x: ball.x, y: ball.y });
            if (ball.trail.length > 12) ball.trail.shift();
            return ball;
          }

          // If captured by Waterwheel
          if (ball.isCaptured && ball.capturedBy) {
            const parent = currentElements.find(e => e.id === ball.capturedBy);
            if (parent && parent.type === 'waterwheel') {
              const R = parent.width / 2;
              const angleRad = (parent.angle * Math.PI / 180) + (ball.captureRelativeAngle || 0);
              
              ball.x = parent.x + R * Math.cos(angleRad) * 0.9; // nest inside bucket slightly
              ball.y = parent.y + R * Math.sin(angleRad) * 0.9;
              ball.vx = 0;
              ball.vy = 0;
              
              // RELEASE condition: When rotating to the bottom discharge region (approx 45 to 135 degrees)
              const deg = (angleRad * 180 / Math.PI) % 360;
              const normalizedDeg = deg < 0 ? deg + 360 : deg;
              
              // Bottom release gate (approx 55 - 125 degrees)
              if (normalizedDeg > 60 && normalizedDeg < 120 && parent.wheelSpeed > 0.05) {
                ball.isCaptured = false;
                ball.capturedBy = null;
                // Transfer tangential momentum to ball upon release
                const tangentSpeed = parent.wheelSpeed * R * 0.8;
                ball.vx = -tangentSpeed * Math.sin(angleRad);
                ball.vy = tangentSpeed * Math.cos(angleRad) + 1.2; // slight drop force
              }
            }
            else if (parent && parent.type === 'lever_vertical') {
              const R = 45; // support length
              const baseRad = Math.atan2(0, -R); // origin offset
              const angleRad = baseRad + (parent.currentAngle || 0) * Math.PI / 180;
              
              ball.x = parent.x + R * Math.cos(angleRad);
              ball.y = parent.y + R * Math.sin(angleRad) - 10;
              ball.vx = 0;
              ball.vy = 0;

              // Release when tipping angles are high
              if ((parent.currentAngle || 0) >= 65) {
                ball.isCaptured = false;
                ball.capturedBy = null;
                ball.vx = 3.2; // Slide forward and drop
                ball.vy = 0.5;
              }
            }
            return ball;
          }

          // Apply Normal Gravity Vector
          ball.vy += cfg.gravity * 0.15 * dt * cfg.speedFactor;
          
          // Apply Air drag friction
          ball.vx *= Math.pow(1 - (cfg.friction * 0.04), dt);
          ball.vy *= Math.pow(1 - (cfg.friction * 0.04), dt);
          
          // Translate positions
          ball.x += ball.vx * dt * cfg.speedFactor;
          ball.y += ball.vy * dt * cfg.speedFactor;

          // Record trail points
          ball.trail.push({ x: ball.x, y: ball.y });
          if (ball.trail.length > 12) ball.trail.shift();

          // A: Boundary Check (Canvas box limits)
          const bounce = -cfg.elasticity;
          if (ball.y > 600 - ball.radius) {
            ball.y = 600 - ball.radius;
            ball.vy *= bounce;
            ball.vx *= 0.85; // land-ground friction
          }
          if (ball.x < ball.radius) {
            ball.x = ball.radius;
            ball.vx *= bounce;
          }
          if (ball.x > 800 - ball.radius) {
            ball.x = 800 - ball.radius;
            ball.vx *= bounce;
          }

          // B: Vertical Lever Capturing Check
          currentElements.forEach(el => {
            if (el.type === 'lever_vertical' && !ball.isCaptured) {
              const dx = ball.x - el.x;
              const dy = ball.y - el.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 26 && ball.vy > 0 && (el.currentAngle || 0) < 10) {
                ball.isCaptured = true;
                ball.capturedBy = el.id;
              }
            }

            // Waterwheel Capturing Check (Top catchment zone)
            if (el.type === 'waterwheel' && !ball.isCaptured) {
              const dx = ball.x - el.x;
              const dy = ball.y - el.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const wheelRadius = el.width / 2;
              
              // Ensure inside capture rim and falling
              if (dist < wheelRadius + 5 && dist > wheelRadius - 28 && ball.y < el.y - 10) {
                ball.isCaptured = true;
                ball.capturedBy = el.id;
                // Calculate angular offset position relative to current wheel angle
                const currentAngleRad = parentAngleRad(el);
                const ballAngleRad = Math.atan2(dy, dx);
                ball.captureRelativeAngle = ballAngleRad - currentAngleRad;
              }
            }

            // Collector trigger counting check
            if (el.type === 'collector') {
              if (ball.x > el.x - el.width/2 && ball.x < el.x + el.width/2) {
                // If fell into collector basket floor
                if (ball.y > el.y - 18 && ball.y < el.y + 10) {
                  el.ballCount = (el.ballCount || 0) + 1;
                  
                  if (recycleRef.current) {
                    // Recycle Ball: reposition in the Spawner Funnel
                    const spawn = currentElements.find(s => s.type === 'spawner');
                    ball.x = spawn ? spawn.x + (Math.random() - 0.5) * 6 : 150;
                    ball.y = spawn ? spawn.y + 8 : 70;
                    ball.vx = (Math.random() - 0.5) * 1.0;
                    ball.vy = 0.5;
                  } else {
                    // Stay parked in collector
                    ball.y = el.y - 10;
                    ball.vy = 0;
                    ball.vx = (Math.random() - 0.5) * 0.3;
                  }
                }
              }
            }
          });

          // C: All Segment Collisions resolver
          currentElements.forEach(el => {
            const segs = getSegmentsForElement(el);
            segs.forEach(seg => {
              // Line Segment segment calculations
              const sax = seg.ax, say = seg.ay;
              const sbx = seg.bx, sby = seg.by;
              
              const dx = sbx - sax;
              const dy = sby - say;
              const len2 = dx * dx + dy * dy;
              
              if (len2 === 0) return;
              
              // Project ball point onto segment
              let t = ((ball.x - sax) * dx + (ball.y - say) * dy) / len2;
              t = Math.max(0, Math.min(1, t)); // constrain along index line
              
              const cx = sax + t * dx;
              const cy = say + t * dy;
              
              const distVecX = ball.x - cx;
              const distVecY = ball.y - cy;
              const dist = Math.sqrt(distVecX * distVecX + distVecY * distVecY);
              
              if (dist < ball.radius) {
                // Determine Normal direction vector
                const nx = distVecX / (dist || 1);
                const ny = distVecY / (dist || 1);
                
                // Rel velocity dot project normal
                const relVelNorm = ball.vx * nx + ball.vy * ny;
                
                // Ensure heading towards normal wall
                if (relVelNorm < 0.05) {
                  // Sit ball exact tangent surface boundary
                  ball.x = cx + nx * ball.radius;
                  ball.y = cy + ny * ball.radius;
                  
                  // Impulse bounce reaction
                  const eFactor = cfg.elasticity;
                  const vn = -relVelNorm * eFactor;
                  
                  // Tangential velocity sliding friction
                  const tx = -ny;
                  const ty = nx;
                  let vt = ball.vx * tx + ball.vy * ty;
                  vt *= 0.95; // slide rolling friction resistance
                  
                  // Convert coordinates back to standard world space velocities x,y
                  ball.vx = nx * vn + tx * vt;
                  ball.vy = ny * vn + ty * vt;
                  
                  // Trigger custom element interactive feedback callbacks
                  if (seg.onCollide) {
                    seg.onCollide(ball, { x: nx, y: ny });
                  }
                }
              }
            });
          });

          return ball;
        });

        // Filter out glitchy balls that went far below coordinates
        const cleanBalls = updatedBalls.filter(b => b.y < 700 && b.x > -50 && b.x < 850);
        
        // Update state hooks and state references
        ballsRef.current = cleanBalls;
        setBalls(cleanBalls);
        
        // Update element stats/counters back
        setElements(currentElements);
      }

      animationFrameId = requestAnimationFrame(runPhysicsLoop);
    };

    animationFrameId = requestAnimationFrame(runPhysicsLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(fpsInterval);
    };
  }, [setElements]);

  const parentAngleRad = (el: RailElement) => {
    return (el.angle || 0) * Math.PI / 180;
  };

  // Canvas drawing effect triggered on state positions changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear render canvas screen with nice retro blackboard or engineering paper style grid
    ctx.fillStyle = '#1e293b'; // Slate background
    ctx.fillRect(0, 0, 800, 600);

    // Grid lines for science feeling
    ctx.strokeStyle = '#334155/30';
    ctx.lineWidth = 1;
    for (let x = 40; x < 800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.strokeStyle = '#334155';
      ctx.stroke();
    }
    for (let y = 40; y < 600; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.strokeStyle = '#334155';
      ctx.stroke();
    }

    // --- Draw Elements ---
    elements.forEach(el => {
      const isSelected = el.id === selectedId;

      ctx.save();

      if (el.type === 'rail_straight') {
        const rad = (el.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * (el.width / 2);
        const dy = Math.sin(rad) * (el.width / 2);

        // Highlight selected
        if (isSelected) {
          ctx.strokeStyle = '#10b981/40';
          ctx.lineWidth = 15;
          ctx.beginPath();
          ctx.moveTo(el.x - dx, el.y - dy);
          ctx.lineTo(el.x + dx, el.y + dy);
          ctx.stroke();
        }

        // Main line
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(el.x - dx, el.y - dy);
        ctx.lineTo(el.x + dx, el.y + dy);
        ctx.stroke();

        // Inner core
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Support pillars (stands to ground)
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x, el.y + 45);
        ctx.stroke();
      } 
      else if (el.type === 'rail_curve') {
        const radiusX = el.width / 2;
        const radiusY = el.height;
        const segmentCount = 12;
        
        ctx.beginPath();
        for (let i = 0; i <= segmentCount; i++) {
          const ratio = i / segmentCount;
          const localAngle = Math.PI + ratio * Math.PI;
          const lx = el.x + radiusX * Math.cos(localAngle);
          const ly = el.y + radiusY * Math.sin(localAngle) * -1;
          const rotated = rotatePoint(lx, ly, el.x, el.y, el.angle);
          
          if (i === 0) ctx.moveTo(rotated.x, rotated.y);
          else ctx.lineTo(rotated.x, rotated.y);
        }

        if (isSelected) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.lineWidth = 14;
          ctx.stroke();
        }

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Inner trace
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();
      } 
      else if (el.type === 'lever_horizontal') {
        const curAngle = el.currentAngle !== undefined ? el.currentAngle : el.angle;
        const rad = (curAngle * Math.PI) / 180;
        const dx = Math.cos(rad) * (el.width / 2);
        const dy = Math.sin(rad) * (el.width / 2);

        // Stand / Pivot point
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x - 12, el.y + 24);
        ctx.lineTo(el.x + 12, el.y + 24);
        ctx.closePath();
        ctx.fill();

        // See-saw Board
        if (isSelected) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.lineWidth = 16;
          ctx.beginPath();
          ctx.moveTo(el.x - dx, el.y - dy);
          ctx.lineTo(el.x + dx, el.y + dy);
          ctx.stroke();
        }

        ctx.strokeStyle = '#fbbf24'; // Golden lever
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(el.x - dx, el.y - dy);
        ctx.lineTo(el.x + dx, el.y + dy);
        ctx.stroke();

        // Board accent boundary
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center pivot screw pin
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(el.x, el.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // L/R Labels for torque
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText("가로지레", el.x - 24, el.y - 14);
      } 
      else if (el.type === 'lever_vertical') {
        const angleValue = el.currentAngle ?? 0;
        const pivotX = el.pivotX ?? el.x - 20;
        const pivotY = el.pivotY ?? el.y + 30;

        // Draw Support Pole for vertical scale
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(pivotX, pivotY + 40);
        ctx.stroke();

        // Draw the rotating basket arm around rotating pivots
        ctx.translate(pivotX, pivotY);
        ctx.rotate(angleValue * Math.PI / 180);

        // Relative coordinates (pivot is 0,0)
        const relX = el.x - pivotX;
        const relY = el.y - pivotY;

        // Support Arm
        ctx.strokeStyle = '#60a5fa'; // Bright structural blue
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(relX, relY);
        ctx.stroke();

        // Catchment Bucket Cup
        ctx.fillStyle = 'rgba(96, 165, 250, 0.2)';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Cup shape pointing upwards (semi-circle)
        ctx.arc(relX, relY - 4, 18, 0, Math.PI, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Counter-balance weight at opposite end of lever pivot for physics return!
        ctx.fillStyle = '#ef4444'; // Red weight
        ctx.beginPath();
        ctx.arc(-20, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px sans-serif';
        ctx.fillText("추", -24, 3);

        ctx.restore();
        ctx.save();

        if (isSelected) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(pivotX, pivotY, 20, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw Pivot head
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Tooltip label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText("세로지레(버킷)", el.x - 30, el.y - 30);
      } 
      else if (el.type === 'waterwheel') {
        const wheelAngle = el.angle || 0;
        const R = el.width / 2;

        ctx.translate(el.x, el.y);
        ctx.rotate(wheelAngle * Math.PI / 180);

        // Highlight seleced halo
        if (isSelected) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.arc(0, 0, R, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Outer wheel rim circle
        ctx.strokeStyle = '#818cf8'; // Premium indigo
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.stroke();

        // Inner web hub structure
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();

        // Buckets/Spokes (e.g. 8 blades)
        const blades = el.bucketCount || 8;
        for (let i = 0; i < blades; i++) {
          const spokeAngle = (i / blades) * Math.PI * 2;
          const sx = Math.cos(spokeAngle) * R;
          const sy = Math.sin(spokeAngle) * R;
          
          // Draw spoke leg line
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(sx, sy);
          ctx.stroke();

          // Draw the bucket cup curve at the tip which carries the ball
          ctx.fillStyle = '#4f46e5';
          ctx.beginPath();
          ctx.arc(sx, sy, 11, spokeAngle + 0.3, spokeAngle + Math.PI - 0.3, false);
          ctx.closePath();
          ctx.fill();
        }

        // Center axial pin
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.save();

        // Wheel center standing mount
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x, el.y + R + 15);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText("물레방아", el.x - 22, el.y - R - 12);
      } 
      else if (el.type === 'collector') {
        const w = el.width;
        const h = el.height;

        // Draw Glass Basket body
        ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
        ctx.fillRect(el.x - w/2, el.y - h, w, h);

        if (isSelected) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
          ctx.lineWidth = 4;
          ctx.strokeRect(el.x - w/2 - 2, el.y - h - 2, w + 4, h + 4);
        }

        // Frame bars
        ctx.strokeStyle = '#10b981'; // Green container
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(el.x - w/2, el.y - h);
        ctx.lineTo(el.x - w/2, el.y);
        ctx.lineTo(el.x + w/2, el.y);
        ctx.lineTo(el.x + w/2, el.y - h);
        ctx.stroke();

        // Decorative grid mesh pattern on basket
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.lineWidth = 1;
        for (let ix = el.x - w/2 + 10; ix < el.x + w/2; ix += 15) {
          ctx.beginPath();
          ctx.moveTo(ix, el.y - h);
          ctx.lineTo(ix, el.y);
          ctx.stroke();
        }

        // LED digital screen counting arriving balls
        ctx.fillStyle = '#022c22';
        ctx.fillRect(el.x - 30, el.y - h/2 - 12, 60, 24);
        
        ctx.fillStyle = '#34d399'; // Glowing green leds
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${el.ballCount || 0} EA`, el.x, el.y - h/2 + 5);

        ctx.fillStyle = '#10b981';
        ctx.font = '10px sans-serif';
        ctx.fillText("공이 모이는 곳", el.x, el.y + 16);
      } 
      else if (el.type === 'spawner') {
        const w = el.width;
        const h = el.height;

        // Draw glowing neon orange drop funnel shape
        ctx.fillStyle = 'rgba(249, 115, 22, 0.1)';
        ctx.beginPath();
        ctx.moveTo(el.x - w/2, el.y - h);
        ctx.lineTo(el.x - w/4, el.y);
        ctx.lineTo(el.x + w/4, el.y);
        ctx.lineTo(el.x + w/2, el.y - h);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#f97316'; // Orange
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(el.x - w/2, el.y - h);
        ctx.lineTo(el.x - w/4, el.y);
        ctx.lineTo(el.x - w/4, el.y + 5);
        ctx.moveTo(el.x + w/2, el.y - h);
        ctx.lineTo(el.x + w/4, el.y);
        ctx.lineTo(el.x + w/4, el.y + 5);
        ctx.stroke();

        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("START", el.x, el.y - h + 15);
      }

      ctx.restore();
    });

    // --- Draw Selection Guides Overlay ---
    if (selectedId) {
      const activeEl = elements.find(el => el.id === selectedId);
      if (activeEl) {
        ctx.save();
        
        const rad = (activeEl.angle * Math.PI) / 180;
        
        // Perpendicular handle coordinates at 55px offset from center (Y = -55 in local system)
        const handleLocalY = -55;
        const handleX = activeEl.x - handleLocalY * Math.sin(rad);
        const handleY = activeEl.y + handleLocalY * Math.cos(rad);
        
        // 1. Draw connecting stem to handle
        ctx.strokeStyle = '#10b981'; // Lucid Emerald
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(activeEl.x, activeEl.y);
        ctx.lineTo(handleX, handleY);
        ctx.stroke();
        
        // 2. Draw rotating handle circle
        ctx.setLineDash([]); // Reset dashed lines
        ctx.fillStyle = '#10b981';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
        ctx.beginPath();
        ctx.arc(handleX, handleY, 11, 0, Math.PI * 2);
        ctx.fill();
        
        // 3. Draw rotate arrow icon character inside handle circle
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↻', handleX, handleY);
        
        // 4. Draw oriented bounding selector box
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        ctx.translate(activeEl.x, activeEl.y);
        ctx.rotate(rad);
        
        let w = activeEl.width;
        let h = activeEl.height || 20;
        if (activeEl.type === 'rail_straight' || activeEl.type === 'lever_horizontal') {
          h = 24;
        } else if (activeEl.type === 'rail_curve') {
          h = 50;
        } else if (activeEl.type === 'lever_vertical') {
          w = 60;
          h = activeEl.height || 90;
        } else if (activeEl.type === 'waterwheel') {
          w = activeEl.width;
          h = activeEl.height || activeEl.width;
        } else if (activeEl.type === 'collector') {
          h = activeEl.height || 60;
        } else if (activeEl.type === 'spawner') {
          w = 60;
          h = 40;
        }
        
        ctx.strokeRect(-w/2 - 6, -h/2 - 6, w + 12, h + 12);
        
        ctx.restore();
      }
    }

    // --- Draw Balls ---
    balls.forEach(ball => {
      // 1. Sleek neon trail path
      if (ball.trail && ball.trail.length > 1) {
        ctx.save();
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let i = 0; i < ball.trail.length - 1; i++) {
          const ratio = i / ball.trail.length;
          // Slowly blend opacity to transparent
          ctx.strokeStyle = ball.color + Math.floor(ratio * 255).toString(16).padStart(2, '0');
          ctx.beginPath();
          ctx.moveTo(ball.trail[i].x, ball.trail[i].y);
          ctx.lineTo(ball.trail[i+1].x, ball.trail[i+1].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Ball sphere body
      ctx.save();
      
      // Outer subtle shadow/glow
      ctx.shadowBlur = 6;
      ctx.shadowColor = ball.color;

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();

      // Shiny highlight reflection inside ball
      ctx.shadowBlur = 0; // Disable shadow for inner shine
      ctx.beginPath();
      ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fill();

      // Black mass unit label indicator
      if (ball.radius > 11) {
        ctx.fillStyle = '#000000/60';
        ctx.font = '6px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${ball.mass}kg`, ball.x, ball.y + 2);
      }

      ctx.restore();

      // 3. Draw dashed pointer indicator or physics grab target ring
      if (ball.id === draggedBallId) {
        ctx.save();
        ctx.strokeStyle = '#10b981'; // Vivid green emerald
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fill();
        ctx.restore();
      }
    });

  }, [elements, balls, selectedId]);

  // Handle Dragging / Selecting in Editor Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Scale local click event coords to 800x600 coordinate framework
    const clickX = ((e.clientX - rect.left) / rect.width) * 800;
    const clickY = ((e.clientY - rect.top) / rect.height) * 600;

    // A: Look for select/rotation anchor click (check of active selection)
    if (selectedId) {
      const activeEl = elements.find(el => el.id === selectedId);
      if (activeEl) {
        // Rotation Handle sits 55px perpendicular above the center of element
        const rad = (activeEl.angle * Math.PI) / 180;
        const handleLocalY = -55;
        const handleX = activeEl.x - handleLocalY * Math.sin(rad);
        const handleY = activeEl.y + handleLocalY * Math.cos(rad);
        const distToHandle = Math.sqrt((clickX - handleX) ** 2 + (clickY - handleY) ** 2);

        if (distToHandle < 18) {
          setIsRotating(true);
          setRotationalStartAngle(Math.atan2(clickY - activeEl.y, clickX - activeEl.x));
          setElementStartAngle(activeEl.angle);
          return;
        }
      }
    }

    // B: Check Click Selection for balls (Prioritize ball grab!)
    let clickedBall: Ball | null = null;
    let minBallDist = 9999;
    balls.forEach(b => {
      const dist = Math.sqrt((clickX - b.x) ** 2 + (clickY - b.y) ** 2);
      if (dist < b.radius + 15 && dist < minBallDist) {
        clickedBall = b;
        minBallDist = dist;
      }
    });

    if (clickedBall) {
      setDraggedBallId(clickedBall.id);
      setDraggedBallOffset({
        x: clickX - clickedBall.x,
        y: clickY - clickedBall.y
      });
      setBalls(prev => prev.map(b => {
        if (b.id === clickedBall!.id) {
          return { ...b, isCaptured: false, capturedBy: null, vx: 0, vy: 0 };
        }
        return b;
      }));
      lastMousePosRef.current = { x: clickX, y: clickY, time: performance.now() };
      return;
    }

    // C: Check Click Selection for elements (OBB selection check!)
    let foundId: string | null = null;
    let closestDist = 9999;

    elements.forEach(el => {
      // Rotate click coordinates back to unrotated element space
      const rad = (el.angle * Math.PI) / 180;
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);
      
      const dx = clickX - el.x;
      const dy = clickY - el.y;
      
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      
      let hW = el.width / 2;
      let hH = (el.height || 20) / 2;
      
      // Pad sizes for easy cursor-pointing hit tests
      if (el.type === 'rail_straight' || el.type === 'lever_horizontal') {
        hH = 15;
      } else if (el.type === 'rail_curve') {
        hH = 25;
      } else if (el.type === 'lever_vertical') {
        hW = 30;
        hH = 45;
      } else if (el.type === 'waterwheel') {
        hW = el.width / 2;
        hH = el.width / 2;
      } else if (el.type === 'collector') {
        hH = 30;
      } else if (el.type === 'spawner') {
        hW = 30;
        hH = 20;
      }
      
      const margin = 12; // Hit-test margin cushion
      const isInside = Math.abs(rx) <= (hW + margin) && Math.abs(ry) <= (hH + margin);
      
      if (isInside) {
        const centerDist = Math.sqrt(dx * dx + dy * dy);
        if (centerDist < closestDist) {
          foundId = el.id;
          closestDist = centerDist;
        }
      }
    });

    if (foundId) {
      setSelectedId(foundId);
      setDraggedElementId(foundId);
      const clickedEl = elements.find(el => el.id === foundId)!;
      setDragOffset({
        x: clickX - clickedEl.x,
        y: clickY - clickedEl.y
      });
    } else {
      setSelectedId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currX = ((e.clientX - rect.left) / rect.width) * 800;
    const currY = ((e.clientY - rect.top) / rect.height) * 600;

    // A: BALL DRAGGING UPDATE
    if (draggedBallId) {
      const now = performance.now();
      const dt = Math.max(1, now - lastMousePosRef.current.time);
      
      setBalls(prev => prev.map(ball => {
        if (ball.id === draggedBallId) {
          const targetX = Math.max(ball.radius, Math.min(800 - ball.radius, currX - draggedBallOffset.x));
          const targetY = Math.max(ball.radius, Math.min(600 - ball.radius, currY - draggedBallOffset.y));
          
          // Speed physical momentum throw calculations (scaled dynamically)
          const calculatedVx = (targetX - ball.x) / (dt / 16.666);
          const calculatedVy = (targetY - ball.y) / (dt / 16.666);
          
          return {
            ...ball,
            x: targetX,
            y: targetY,
            vx: isNaN(calculatedVx) ? 0 : Math.max(-12, Math.min(12, calculatedVx)),
            vy: isNaN(calculatedVy) ? 0 : Math.max(-12, Math.min(12, calculatedVy)),
            trail: [] // smooth trail recovery
          };
        }
        return ball;
      }));
      
      lastMousePosRef.current = { x: currX, y: currY, time: now };
    }

    // B: ROTATE element dragging
    else if (isRotating && selectedId) {
      setElements(prev => prev.map(el => {
        if (el.id === selectedId) {
          const currentAngleRad = Math.atan2(currY - el.y, currX - el.x);
          const deltaRad = currentAngleRad - rotationalStartAngle;
          const deltaDeg = (deltaRad * 180) / Math.PI;
          
          let targetDeg = (elementStartAngle + deltaDeg) % 360;
          if (e.shiftKey) {
            targetDeg = Math.round(targetDeg / 15) * 15;
          }

          return {
            ...el,
            angle: Math.round(targetDeg),
            currentAngle: Math.round(targetDeg)
          };
        }
        return el;
      }));
    }

    // C: POSITION element dragging
    else if (draggedElementId) {
      setElements(prev => prev.map(el => {
        if (el.id === draggedElementId) {
          let newX = Math.round(currX - dragOffset.x);
          let newY = Math.round(currY - dragOffset.y);
          
          newX = Math.max(25, Math.min(775, newX));
          newY = Math.max(30, Math.min(570, newY));

          const offsets: Partial<RailElement> = {};
          if (el.type === 'lever_vertical') {
            offsets.pivotX = newX - 20;
            offsets.pivotY = newY + 30;
          }
          if (el.type === 'lever_horizontal') {
            offsets.pivotX = newX;
            offsets.pivotY = newY;
          }

          return {
            ...el,
            x: newX,
            y: newY,
            ...offsets
          };
        }
        return el;
      }));
    }

    // D: DYNAMIC MOUSE CURSOR VISUAL FEEDBACK
    let targetCursor = 'crosshair';
    if (isRotating || draggedBallId) {
      targetCursor = 'grabbing';
    } else if (draggedElementId) {
      targetCursor = 'move';
    } else {
      // Check active element rotation handle overlap
      let rotationHover = false;
      if (selectedId) {
        const activeEl = elements.find(el => el.id === selectedId);
        if (activeEl) {
          const rad = (activeEl.angle * Math.PI) / 180;
          const handleLocalY = -55;
          const handleX = activeEl.x - handleLocalY * Math.sin(rad);
          const handleY = activeEl.y + handleLocalY * Math.cos(rad);
          const distToHandle = Math.sqrt((currX - handleX) ** 2 + (currY - handleY) ** 2);
          if (distToHandle < 18) {
            rotationHover = true;
            targetCursor = 'pointer';
          }
        }
      }

      if (!rotationHover) {
        // Is hovering over any ball?
        const hoveredBall = ballsRef.current.find(b => {
          const dist = Math.sqrt((currX - b.x) ** 2 + (currY - b.y) ** 2);
          return dist <= b.radius + 15;
        });
        if (hoveredBall) {
          targetCursor = 'grab';
        } else {
          // Is hovering over any structural element?
          let elementHover = false;
          elements.forEach(el => {
            const rad = (el.angle * Math.PI) / 180;
            const cos = Math.cos(-rad);
            const sin = Math.sin(-rad);
            const dx = currX - el.x;
            const dy = currY - el.y;
            const rx = dx * cos - dy * sin;
            const ry = dx * sin + dy * cos;
            
            let hW = el.width / 2;
            let hH = (el.height || 20) / 2;
            
            if (el.type === 'rail_straight' || el.type === 'lever_horizontal') hH = 15;
            else if (el.type === 'rail_curve') hH = 25;
            else if (el.type === 'lever_vertical') { hW = 30; hH = 45; }
            else if (el.type === 'waterwheel') { hW = el.width / 2; hH = el.width / 2; }
            else if (el.type === 'collector') hH = 30;
            else if (el.type === 'spawner') { hW = 30; hH = 20; }

            const margin = 12;
            if (Math.abs(rx) <= (hW + margin) && Math.abs(ry) <= (hH + margin)) {
              elementHover = true;
            }
          });
          if (elementHover) {
            targetCursor = 'pointer';
          }
        }
      }
    }
    canvas.style.cursor = targetCursor;
  };

  const handleMouseUp = () => {
    setDraggedElementId(null);
    setIsRotating(false);
    setDraggedBallId(null);
  };

  // Add customized element right in center viewport
  const handleAddElement = (type: RailType) => {
    const newId = `el_${type}_${Math.random().toString(36).substr(2, 5)}_${Date.now()}`;
    let newEl: RailElement = {
      id: newId,
      type,
      x: 400,
      y: 200,
      width: type === 'waterwheel' ? 140 : type === 'collector' ? 130 : 200,
      height: type === 'rail_curve' ? 50 : type === 'collector' ? 60 : 10,
      angle: type === 'rail_straight' ? 15 : 0,
      currentAngle: type === 'rail_straight' ? 15 : 0
    };

    if (type === 'waterwheel') {
      newEl.bucketCount = 8;
      newEl.wheelSpeed = 0;
      newEl.ballsCaptured = [];
    }
    else if (type === 'lever_vertical') {
      newEl.width = 80;
      newEl.height = 90;
      newEl.x = 420;
      newEl.y = 230;
      newEl.pivotX = 400;
      newEl.pivotY = 260;
      newEl.currentAngle = 0;
      newEl.targetAngle = 0;
    }
    else if (type === 'lever_horizontal') {
      newEl.width = 160;
      newEl.height = 12;
      newEl.pivotX = 400;
      newEl.pivotY = 200;
      newEl.angle = -5;
      newEl.currentAngle = -5;
    }
    else if (type === 'collector') {
      newEl.ballCount = 0;
    }

    setElements(prev => [...prev, newEl]);
    setSelectedId(newId);
  };

  const handleDeleteSelected = () => {
    if (selectedId) {
      setElements(prev => prev.filter(el => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleClearAll = () => {
    if (confirm("정격 설치된 모든 레일과 공을 삭제하고 새로 설계하시겠습니까?")) {
      setElements([]);
      setBalls([]);
      setSelectedId(null);
    }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  // Helper labels
  const getLabelForType = (type: RailType) => {
    switch(type) {
      case 'rail_straight': return '직선 레일';
      case 'rail_curve': return '완만한 곡선 레일';
      case 'lever_horizontal': return '가로지레 (수평 시소)';
      case 'lever_vertical': return '세로지레 (수직 버킷 낙하기)';
      case 'waterwheel': return '중력 회전 물레방아';
      case 'collector': return '공이 모이는 정거장';
      case 'spawner': return '공 공급 깔때기';
      default: return '레일 소자';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative" id="physics-workspace">
      
      {/* Simulation Header Sub-Bar */}
      <div className="bg-slate-950 px-4 py-2.5 flex flex-wrap items-center justify-between border-b border-slate-800 text-slate-300 gap-3">
        {/* Preset levels dropdown picker */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-slate-400 font-sans tracking-wide">수업 템플릿 로드:</label>
          <select
            id="preset-picker"
            value={activePresetId}
            onChange={(e) => handleLoadPreset(e.target.value)}
            className="bg-slate-800 text-slate-100 rounded-lg text-xs py-1 px-2 border border-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {presets.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Real-time telemetry specs */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            FPS: <b className="text-[#34d399]">{fps}</b>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-[11px]">
            공 개수: <b className="text-white">{balls.length}개</b>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-[11px]">
            누적 검증: <b className="text-indigo-400">{totalSimulatedCount}회</b>
          </span>
        </div>
      </div>

      {/* Editor Spawners Tool rail - Quick adding buttons */}
      <div className="bg-slate-900/50 p-2.5 flex flex-wrap gap-1.5 items-center justify-center border-b border-slate-800">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-1.5 font-mono select-none">레일 공작도구:</span>
        <button
          id="btn-add-straight"
          onClick={() => handleAddElement('rail_straight')}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer"
        >
          <Plus className="w-3 h-3 text-emerald-500" />
          직선 레일
        </button>
        <button
          id="btn-add-curve"
          onClick={() => handleAddElement('rail_curve')}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer"
        >
          <Plus className="w-3 h-3 text-sky-500" />
          곡선 가이드
        </button>
        <button
          id="btn-add-lever-h"
          onClick={() => handleAddElement('lever_horizontal')}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer"
        >
          <Plus className="w-3 h-3 text-yellow-500" />
          가로지레 (시소)
        </button>
        <button
          id="btn-add-lever-v"
          onClick={() => handleAddElement('lever_vertical')}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer"
        >
          <Plus className="w-3 h-3 text-blue-500" />
          세로지레 (버킷)
        </button>
        <button
          id="btn-add-wheel"
          onClick={() => handleAddElement('waterwheel')}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer"
        >
          <Plus className="w-3 h-3 text-indigo-500" />
          물레방아 기어
        </button>
        <button
          id="btn-add-collector"
          onClick={() => handleAddElement('collector')}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer"
        >
          <Plus className="w-3 h-3 text-emerald-500" />
          수집 정거장
        </button>
        <div className="h-4 w-[1px] bg-slate-800 mx-1"></div>
        <button
          id="btn-clear-all"
          onClick={handleClearAll}
          className="flex items-center gap-1 hover:bg-rose-950 hover:text-rose-400 text-slate-400 rounded-lg px-2 py-1.5 text-xs transition border border-transparent hover:border-rose-900"
        >
          <Trash2 className="w-3 h-3" />
          초기화
        </button>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef} 
        className="flex-1 bg-slate-950 flex items-center justify-center relative overflow-hidden select-none"
        style={{ minHeight: '420px' }}
      >
        <canvas
          id="physics-canvas"
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="max-w-full max-h-full block cursor-crosshair border border-slate-800 rounded shadow-md relative bg-[#0f172a]"
        />

        {/* Hover/Visual rotation indicators */}
        {selectedId && selectedElement ? (
          <div className="absolute top-3 left-4 bg-slate-900/95 text-slate-100 text-xs py-1.5 px-3 rounded-lg border border-slate-800 pointer-events-none font-sans flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-emerald-400 block animate-pulse"></span>
            <span>선택된 레일: <b>{getLabelForType(selectedElement.type)}</b> (드래그 이동 / 키보드 방향키 / R, E 회전)</span>
          </div>
        ) : (
          <div className="absolute top-3 left-4 bg-slate-900/95 text-slate-300 text-xs py-1.5 px-3 rounded-lg border border-slate-800 pointer-events-none font-sans flex items-center gap-2 backdrop-blur-sm shadow-xl">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping block"></span>
            <span><b>꿀팁:</b> 구슬(공)을 직접 마우스로 잡고 드래그해 마음껏 던져보세요! 🚀</span>
          </div>
        )}
      </div>

      {/* Control Panel: Simulation variables  */}
      <div className="bg-slate-950 p-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-5 text-slate-300">
        
        {/* Playback Run actions */}
        <div className="md:col-span-4 flex flex-col justify-between gap-3">
          <div className="flex gap-2">
            {isRunning ? (
              <button
                id="btn-pause"
                onClick={() => setIsRunning(false)}
                className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 shadow shadow-amber-900/20 cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-white" /> 일시정지
              </button>
            ) : (
              <button
                id="btn-play"
                onClick={() => setIsRunning(true)}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 shadow shadow-emerald-900/20 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" /> 시뮬레이션 개시
              </button>
            )}

            <button
              id="btn-recycle"
              onClick={clearBalls}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition hover:text-white"
              title="화면 구슬 청소"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Core Spawners (5+ Balls constraint trigger) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">구슬 대량 투입 (수행 핵심)</span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={recycleEnabled}
                  onChange={(e) => setRecycleEnabled(e.target.checked)}
                  className="rounded border-slate-800 text-emerald-600 focus:ring-0 cursor-pointer"
                />
                자동 순환 (깔때기 왕복)
              </label>
            </div>
            
            <div className="flex gap-1.5">
              <button
                id="btn-spawn-one"
                onClick={() => spawnBall()}
                className="flex-1 py-2 px-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 shadow cursor-pointer"
              >
                <Dribbble className="w-3.5 h-3.5" />
                구슬 1개 투입
              </button>
              
              <button
                id="btn-spawn-multi"
                onClick={() => spawnBallSeries(6)}
                className="flex-1 py-2 px-2.5 bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 active:scale-95 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 shadow cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                구슬 5개 연속투입
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Sliders Core Physical variables */}
        <div className="md:col-span-5 space-y-3.5">
          {/* Gravity presets select */}
          <div>
            <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
              <span>태블릿 천체 경사 중력 환경 preset</span>
              <span className="font-mono text-emerald-400">g = {config.gravity.toFixed(1)} m/s²</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { name: '무중력', g: 0.0, clr: 'bg-slate-800 text-slate-300' },
                { name: '달나라', g: 1.6, clr: 'bg-slate-800 text-slate-100' },
                { name: '화성', g: 3.7, clr: 'bg-slate-800 text-slate-100' },
                { name: '지구', g: 9.8, clr: 'bg-emerald-600/70 text-white font-semibold' }
              ].map(p => (
                <button
                  key={p.name}
                  onClick={() => setConfig(prev => ({ ...prev, gravity: p.g }))}
                  className={`py-1 rounded text-[10px] transition font-sans ${
                    Math.abs(config.gravity - p.g) < 0.2 
                      ? p.name === '지구' ? 'bg-emerald-600 text-white ring-1 ring-emerald-500' : 'bg-indigo-600 text-white'
                      : 'bg-slate-800/80 hover:bg-slate-850'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mass / Color of spawner ball */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">투입 공 속성 (질량)</label>
              <select
                value={config.selectedBallMass}
                onChange={e => {
                  const m = parseFloat(e.target.value);
                  let col = '#fbbf24'; // Gold
                  if (m < 1.0) col = '#f87171'; // Red bouncy
                  else if (Math.abs(m - 1.0) < 0.1) col = '#cbd5e1'; // Silver plastic/iron
                  
                  setConfig(prev => ({ ...prev, selectedBallMass: m, selectedBallColor: col }));
                }}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[11px] rounded-lg p-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="0.3">유리구슬 (0.3kg - 가벼움)</option>
                <option value="1.0">철제구슬 (1.0kg - 표준 무게)</option>
                <option value="4.5">황동구슬 (4.5kg - 무겁고 둔함)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">시뮬레이션 재생속도</label>
              <select
                value={config.speedFactor}
                onChange={e => setConfig(prev => ({ ...prev, speedFactor: parseFloat(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[11px] rounded-lg p-1 px-1.5 focus:outline-none"
              >
                <option value="0.5">0.5배속 (슬로우 모션)</option>
                <option value="1.0">1.0배속 (현실 구름)</option>
                <option value="1.5">1.5배속 (가속 분석)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Selected Component Properties Editor Panel */}
        <div className="md:col-span-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          {selectedElement ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[11px] font-bold text-slate-400">도구 속성 조작</span>
                <button
                  onClick={handleDeleteSelected}
                  className="text-red-400 hover:text-red-300 p-0.5"
                  title="선택 부품 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Angle scale slider */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>정밀 각도 조절</span>
                  <span className="font-mono text-emerald-400">{selectedElement.angle}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={selectedElement.angle}
                  onChange={e => {
                    const ang = parseInt(e.target.value);
                    setElements(prev => prev.map(el => {
                      if (el.id === selectedId) {
                        return { ...el, angle: ang, currentAngle: ang };
                      }
                      return el;
                    }));
                  }}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-1.5"
                />
                {/* Quick Angle Shorts */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {[-30, -15, 0, 15, 30].map(val => (
                    <button
                      key={val}
                      onClick={() => {
                        setElements(prev => prev.map(el => {
                          if (el.id === selectedId) {
                            return { ...el, angle: val, currentAngle: val };
                          }
                          return el;
                        }));
                      }}
                      className="text-[9px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 py-0.5 px-1 rounded border border-slate-700 transition cursor-pointer"
                    >
                      {val > 0 ? `+${val}°` : `${val}°`}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setElements(prev => prev.map(el => {
                        if (el.id === selectedId) {
                          const nextAng = ((el.angle + 45) % 360);
                          return { ...el, angle: nextAng, currentAngle: nextAng };
                        }
                        return el;
                      }));
                    }}
                    className="text-[9px] bg-indigo-950 hover:bg-indigo-900 active:scale-95 text-indigo-300 py-0.5 px-1 rounded border border-indigo-900 transition cursor-pointer"
                    title="45도 회전"
                  >
                    +45°
                  </button>
                </div>
              </div>

              {/* Length scale slider */}
              {selectedElement.type !== 'spawner' && (
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>좌우 길이/너비</span>
                    <span className="font-mono text-indigo-400">{selectedElement.width}px</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    value={selectedElement.width}
                    onChange={e => {
                      const w = parseInt(e.target.value);
                      setElements(prev => prev.map(el => {
                        if (el.id === selectedId) {
                          return { ...el, width: w };
                        }
                        return el;
                      }));
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-1.5"
                  />
                  {/* Quick Length Shorts */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[-30, -10, 10, 30].map(diff => (
                      <button
                        key={diff}
                        onClick={() => {
                          setElements(prev => prev.map(el => {
                            if (el.id === selectedId) {
                              const nextW = Math.max(50, Math.min(300, el.width + diff));
                              return { ...el, width: nextW };
                            }
                            return el;
                          }));
                        }}
                        className="text-[9px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 py-0.5 px-1 rounded border border-slate-700 transition cursor-pointer"
                      >
                        {diff > 0 ? `+${diff}` : `${diff}`}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setElements(prev => prev.map(el => {
                          if (el.id === selectedId) {
                            return { ...el, width: 160 };
                          }
                          return el;
                        }));
                      }}
                      className="text-[9px] bg-slate-900 border border-indigo-900 text-indigo-300 py-0.5 px-1.5 rounded hover:bg-indigo-950 transition cursor-pointer"
                    >
                      기본(160)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-2 text-slate-500 h-full">
              <Sliders className="w-6 h-6 mb-1 text-slate-600" />
              <p className="text-[10px] leading-normal font-sans">
                위 화면에서 레일 부품을 더블클릭하거나 터치하면 실시간 미세 각도와 길이를 조정할 수 있습니다.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
