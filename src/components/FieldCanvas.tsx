import React, { useRef, useCallback } from 'react';
import { PlayerOnField, Route, RoutePoint, DrawTool } from '@/types';

interface FieldCanvasProps {
  players: PlayerOnField[];
  routes: Route[];
  side: 'offense' | 'defense';
  onPlayersChange: (players: PlayerOnField[]) => void;
  onRoutesChange: (routes: Route[]) => void;
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
  drawTool?: DrawTool;
  drawing?: boolean;
  currentRoute?: RoutePoint[];
  onDrawStart?: (pt: RoutePoint) => void;
  onDrawAdd?: (pt: RoutePoint) => void;
  onDrawEnd?: () => void;
  readOnly?: boolean;
  animationProgress?: number; // 0..1 for playback
}

const FIELD_WIDTH = 700;
const FIELD_HEIGHT = 300;

// Field zones (proportional): endzone(10%) | zone(20%) | zone(20%) | zone(20%) | zone(20%) | endzone(10%)
const EZ_WIDTH = FIELD_WIDTH * 0.1; // 70
const PLAY_WIDTH = FIELD_WIDTH * 0.8; // 560
const ZONE_WIDTH = PLAY_WIDTH / 4; // 140

const FieldCanvas: React.FC<FieldCanvasProps> = ({
  players,
  routes,
  side,
  onPlayersChange,
  onRoutesChange,
  selectedPlayerId,
  onSelectPlayer,
  drawTool = 'select',
  drawing = false,
  currentRoute = [],
  onDrawStart,
  onDrawAdd,
  onDrawEnd,
  readOnly = false,
  animationProgress,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<string | null>(null);

  const getSVGPoint = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * FIELD_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * FIELD_HEIGHT,
    };
  }, []);

  const handleFieldClick = useCallback(
    (e: React.MouseEvent) => {
      if (readOnly || draggingRef.current) return;
      if (drawTool === 'select') return;
      if (drawTool === 'eraser') return;

      const pt = getSVGPoint(e);

      if (drawTool === 'circle') {
        // Circle: place at click point
        onDrawStart?.(pt);
        onDrawEnd?.();
        return;
      }

      // Line tools
      if (!drawing) {
        onDrawStart?.(pt);
      } else {
        onDrawAdd?.(pt);
      }
    },
    [readOnly, drawTool, drawing, getSVGPoint, onDrawStart, onDrawAdd, onDrawEnd]
  );

  const handleDoubleClick = useCallback(() => {
    if (!drawing || readOnly) return;
    onDrawEnd?.();
  }, [drawing, readOnly, onDrawEnd]);

  const handlePlayerMouseDown = useCallback(
    (e: React.MouseEvent, playerId: string) => {
      if (readOnly) return;
      if (drawTool !== 'select') return;
      e.stopPropagation();
      draggingRef.current = playerId;
      onSelectPlayer(playerId);
    },
    [readOnly, drawTool, onSelectPlayer]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingRef.current || readOnly) return;
      const pt = getSVGPoint(e);
      onPlayersChange(
        players.map((p) =>
          p.playerId === draggingRef.current ? { ...p, x: pt.x, y: pt.y } : p
        )
      );
    },
    [readOnly, getSVGPoint, players, onPlayersChange]
  );

  const handleMouseUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  const handleRouteClick = useCallback(
    (routeIndex: number) => {
      if (readOnly || drawTool !== 'eraser') return;
      onRoutesChange(routes.filter((_, i) => i !== routeIndex));
    },
    [readOnly, drawTool, routes, onRoutesChange]
  );

  const offenseColor = 'hsl(210, 90%, 56%)';
  const defenseColor = 'hsl(0, 80%, 58%)';
  const routeColor = 'hsl(48, 95%, 55%)';
  const fieldGreen = 'hsl(145, 65%, 30%)';
  const fieldGreenDark = 'hsl(145, 65%, 25%)';
  const lineColor = 'hsla(0, 0%, 100%, 0.85)';
  const lineColorFaint = 'hsla(0, 0%, 100%, 0.3)';

  // Compute animated player positions
  const getAnimatedPosition = (player: PlayerOnField) => {
    if (animationProgress === undefined) return { x: player.x, y: player.y };
    const route = routes.find((r) => r.playerId === player.playerId);
    if (!route || route.points.length < 2) return { x: player.x, y: player.y };

    const totalLen: number[] = [0];
    for (let i = 1; i < route.points.length; i++) {
      const dx = route.points[i].x - route.points[i - 1].x;
      const dy = route.points[i].y - route.points[i - 1].y;
      totalLen.push(totalLen[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    const total = totalLen[totalLen.length - 1];
    if (total === 0) return { x: player.x, y: player.y };

    const targetDist = animationProgress * total;
    for (let i = 1; i < totalLen.length; i++) {
      if (totalLen[i] >= targetDist) {
        const segLen = totalLen[i] - totalLen[i - 1];
        const t = segLen > 0 ? (targetDist - totalLen[i - 1]) / segLen : 0;
        return {
          x: route.points[i - 1].x + (route.points[i].x - route.points[i - 1].x) * t,
          y: route.points[i - 1].y + (route.points[i].y - route.points[i - 1].y) * t,
        };
      }
    }
    const last = route.points[route.points.length - 1];
    return { x: last.x, y: last.y };
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
      className={`w-full rounded-lg border border-border select-none ${
        drawTool === 'eraser' ? 'cursor-not-allowed' : drawTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'
      }`}
      style={{ maxHeight: '70vh' }}
      onClick={handleFieldClick}
      onDoubleClick={handleDoubleClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Full field background */}
      <rect width={FIELD_WIDTH} height={FIELD_HEIGHT} fill={fieldGreen} rx="4" />

      {/* End zones */}
      <rect x={0} y={0} width={EZ_WIDTH} height={FIELD_HEIGHT} fill={fieldGreenDark} />
      <rect x={FIELD_WIDTH - EZ_WIDTH} y={0} width={EZ_WIDTH} height={FIELD_HEIGHT} fill={fieldGreenDark} />

      {/* End zone borders */}
      <line x1={EZ_WIDTH} y1={0} x2={EZ_WIDTH} y2={FIELD_HEIGHT} stroke={lineColor} strokeWidth="2" />
      <line x1={FIELD_WIDTH - EZ_WIDTH} y1={0} x2={FIELD_WIDTH - EZ_WIDTH} y2={FIELD_HEIGHT} stroke={lineColor} strokeWidth="2" />

      {/* Yard lines (dividing 4 zones) */}
      {[1, 2, 3].map((i) => {
        const x = EZ_WIDTH + i * ZONE_WIDTH;
        return (
          <line key={`yard-${i}`} x1={x} y1={0} x2={x} y2={FIELD_HEIGHT} stroke={lineColor} strokeWidth="1.5" />
        );
      })}

      {/* No-run zone lines (dashed) - at 1/3 of each half */}
      {[1, 3].map((i) => {
        const x = EZ_WIDTH + i * ZONE_WIDTH;
        const noRunX1 = x - ZONE_WIDTH / 3;
        const noRunX2 = x + ZONE_WIDTH / 3;
        return (
          <React.Fragment key={`norun-${i}`}>
            <line x1={noRunX1} y1={0} x2={noRunX1} y2={FIELD_HEIGHT} stroke={lineColorFaint} strokeWidth="1" strokeDasharray="6 6" />
            <line x1={noRunX2} y1={0} x2={noRunX2} y2={FIELD_HEIGHT} stroke={lineColorFaint} strokeWidth="1" strokeDasharray="6 6" />
          </React.Fragment>
        );
      })}

      {/* Center line (midfield) */}
      <line
        x1={FIELD_WIDTH / 2}
        y1={0}
        x2={FIELD_WIDTH / 2}
        y2={FIELD_HEIGHT}
        stroke={lineColor}
        strokeWidth="2"
      />

      {/* Hash marks (small center ticks) */}
      {[1, 3].map((i) => {
        const x = EZ_WIDTH + i * ZONE_WIDTH + ZONE_WIDTH / 2;
        const midY = FIELD_HEIGHT / 2;
        return (
          <line key={`hash-${i}`} x1={x} y1={midY - 8} x2={x} y2={midY + 8} stroke={lineColor} strokeWidth="2" />
        );
      })}

      {/* Outer border */}
      <rect x={0} y={0} width={FIELD_WIDTH} height={FIELD_HEIGHT} fill="none" stroke={lineColor} strokeWidth="2" rx="4" />

      {/* Existing routes */}
      {routes.map((route, ri) => {
        if (route.drawingType === 'circle' && route.points.length >= 1) {
          return (
            <circle
              key={`route-${ri}`}
              cx={route.points[0].x}
              cy={route.points[0].y}
              r="20"
              fill="none"
              stroke={routeColor}
              strokeWidth="2.5"
              opacity={0.9}
              onClick={(e) => { e.stopPropagation(); handleRouteClick(ri); }}
              className={drawTool === 'eraser' ? 'cursor-pointer hover:opacity-50' : ''}
            />
          );
        }
        if (route.points.length < 2) return null;
        const d = route.points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
          .join(' ');
        return (
          <g key={`route-${ri}`}>
            <path
              d={d}
              fill="none"
              stroke={routeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={route.drawingType === 'dashed' ? '8 5' : undefined}
              opacity={0.9}
              onClick={(e) => { e.stopPropagation(); handleRouteClick(ri); }}
              className={drawTool === 'eraser' ? 'cursor-pointer hover:opacity-50' : ''}
            />
            {/* Arrow at end */}
            <circle
              cx={route.points[route.points.length - 1].x}
              cy={route.points[route.points.length - 1].y}
              r="4"
              fill={routeColor}
            />
          </g>
        );
      })}

      {/* Current drawing route */}
      {currentRoute.length > 0 && (
        <path
          d={currentRoute.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
          fill="none"
          stroke={routeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={drawTool === 'dashed' ? '8 5' : '6 3'}
          opacity={0.7}
        />
      )}

      {/* Players */}
      {players.map((player) => {
        const isOffense = side === 'offense';
        const color = isOffense ? offenseColor : defenseColor;
        const isSelected = selectedPlayerId === player.playerId;
        const pos = animationProgress !== undefined ? getAnimatedPosition(player) : player;
        return (
          <g
            key={player.playerId}
            onMouseDown={(e) => handlePlayerMouseDown(e, player.playerId)}
            className={!readOnly && drawTool === 'select' ? 'cursor-grab active:cursor-grabbing' : ''}
          >
            {isSelected && (
              <circle cx={pos.x} cy={pos.y} r="20" fill="none" stroke={routeColor} strokeWidth="2" opacity={0.8} />
            )}
            {isOffense ? (
              <circle cx={pos.x} cy={pos.y} r="14" fill={color} stroke="hsla(0, 0%, 100%, 0.8)" strokeWidth="2" />
            ) : (
              <rect
                x={pos.x - 12}
                y={pos.y - 12}
                width="24"
                height="24"
                rx="3"
                fill={color}
                stroke="hsla(0, 0%, 100%, 0.8)"
                strokeWidth="2"
              />
            )}
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="9"
              fontWeight="bold"
              className="pointer-events-none select-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {player.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default FieldCanvas;
