import React, { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export interface ShapeGridProps {
  speed?: number;
  squareSize?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  borderColor?: string;
  hoverFillColor?: string;
  shape?: 'square' | 'circle' | 'cross' | string;
  hoverTrailAmount?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ShapeGrid: React.FC<ShapeGridProps> = ({
  speed = 0,
  squareSize = 45,
  direction = 'down',
  borderColor,
  hoverFillColor,
  shape = 'square',
  hoverTrailAmount = 0,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Mouse hover state
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  // Trail history for hover trail
  const trailRef = useRef<Array<{ x: number; y: number; alpha: number }>>([]);

  // Default colors adapted to current theme if not specified explicitly
  const defaultBorderColor = borderColor ?? (isLight ? 'rgba(203, 213, 225, 0.45)' : 'rgba(255, 255, 255, 0.08)');
  const defaultHoverFillColor = hoverFillColor ?? (isLight ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.25)');

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };

      if (hoverTrailAmount > 0) {
        trailRef.current.unshift({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          alpha: 1.0,
        });
        if (trailRef.current.length > hoverTrailAmount + 5) {
          trailRef.current.pop();
        }
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Offset animation based on speed & direction
      if (speed > 0) {
        offset = (offset + speed) % squareSize;
      }

      let offsetX = 0;
      let offsetY = 0;
      if (direction === 'down') offsetY = offset;
      else if (direction === 'up') offsetY = -offset;
      else if (direction === 'right') offsetX = offset;
      else if (direction === 'left') offsetX = -offset;

      const cols = Math.ceil(width / squareSize) + 2;
      const rows = Math.ceil(height / squareSize) + 2;

      const startX = -squareSize + (offsetX % squareSize);
      const startY = -squareSize + (offsetY % squareSize);

      const activeX = mouseRef.current.x;
      const activeY = mouseRef.current.y;
      const isMouseActive = mouseRef.current.active;

      // Decay trail alphas
      if (hoverTrailAmount > 0) {
        trailRef.current.forEach((t) => {
          t.alpha *= 0.88;
        });
        trailRef.current = trailRef.current.filter((t) => t.alpha > 0.02);
      }

      // Draw Grid Lines / Shapes
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * squareSize;
          const y = startY + r * squareSize;

          // Check if mouse is inside this grid square
          const isHovered =
            isMouseActive &&
            activeX >= x &&
            activeX < x + squareSize &&
            activeY >= y &&
            activeY < y + squareSize;

          // Check if trail point affects this grid square
          let trailIntensity = 0;
          if (hoverTrailAmount > 0 && trailRef.current.length > 0) {
            for (let i = 0; i < trailRef.current.length; i++) {
              const pt = trailRef.current[i];
              if (pt.x >= x && pt.x < x + squareSize && pt.y >= y && pt.y < y + squareSize) {
                trailIntensity = Math.max(trailIntensity, pt.alpha);
              }
            }
          }

          // Fill background of hovered / trailed cell
          if (isHovered || trailIntensity > 0) {
            ctx.fillStyle = defaultHoverFillColor;
            ctx.globalAlpha = isHovered ? 1.0 : trailIntensity;
            ctx.fillRect(x, y, squareSize, squareSize);
            ctx.globalAlpha = 1.0;
          }

          // Render Shape outline
          ctx.strokeStyle = defaultBorderColor;
          ctx.lineWidth = 1;

          if (shape === 'square') {
            ctx.strokeRect(x, y, squareSize, squareSize);
          } else if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(x + squareSize / 2, y + squareSize / 2, squareSize / 2.5, 0, Math.PI * 2);
            ctx.stroke();
          } else if (shape === 'cross') {
            const pad = squareSize * 0.3;
            ctx.beginPath();
            ctx.moveTo(x + pad, y + pad);
            ctx.lineTo(x + squareSize - pad, y + squareSize - pad);
            ctx.moveTo(x + squareSize - pad, y + pad);
            ctx.lineTo(x + pad, y + squareSize - pad);
            ctx.stroke();
          } else {
            // Default square
            ctx.strokeRect(x, y, squareSize, squareSize);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();
    };
  }, [
    squareSize,
    speed,
    direction,
    defaultBorderColor,
    defaultHoverFillColor,
    shape,
    hoverTrailAmount,
    isLight,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden w-full h-full ${className}`}
      style={style}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block pointer-events-auto"
      />
    </div>
  );
};
