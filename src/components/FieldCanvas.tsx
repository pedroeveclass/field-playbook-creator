import React, { useState, useRef, useCallback } from 'react';
import { PlayerOnField, Route, RoutePoint } from '@/types';

interface FieldCanvasProps {
  players: PlayerOnField[];
  routes: Route[];
  side: 'offense' | 'defense';
  onPlayersChange: (players: PlayerOnField[]) => void;
  onRoutesChange: (routes: Route[]) => void;
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
}

const FIELD_WIDTH = 720;
const FIELD_HEIGHT = 480;
const YARD_LINES = 8; // simplified

const FieldCanvas: React.FC<FieldCanvasProps> = ({
  players,
  routes,
  side,
  onPlayersChange,
  onRoutesChange,
  selectedPlayerId,
  onSelectPlayer,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RoutePoint[]>([]);
  const [draggingPlayer, setDraggingPlayer] = useState<string | null>(null);

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
      if (draggingPlayer) return;
      if (!selectedPlayerId) return;

      const pt = getSVGPoint(e);

      if (!drawing) {
        setDrawing(true);
        setCurrentRoute([pt]);
      } else {
        setCurrentRoute((prev) => [...prev, pt]);
      }
    },
    [drawing, selectedPlayerId, draggingPlayer, getSVGPoint]
  );

  const handleDoubleClick = useCallback(() => {
    if (!drawing || !selectedPlayerId) return;
    const routeType = side === 'offense' ? 'route' : 'coverage';
    const newRoute: Route = {
      playerId: selectedPlayerId,
      points: currentRoute,
      type: routeType,
    };
    onRoutesChange([...routes, newRoute]);
    setCurrentRoute([]);
    setDrawing(false);
  }, [drawing, selectedPlayerId, currentRoute, routes, onRoutesChange, side]);

  const handlePlayerMouseDown = useCallback(
    (e: React.MouseEvent, playerId: string) => {
      e.stopPropagation();
      setDraggingPlayer(playerId);
      onSelectPlayer(playerId);
    },
    [onSelectPlayer]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingPlayer) return;
      const pt = getSVGPoint(e);
      onPlayersChange(
        players.map((p) =>
          p.playerId === draggingPlayer ? { ...p, x: pt.x, y: pt.y } : p
        )
      );
    },
    [draggingPlayer, getSVGPoint, players, onPlayersChange]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingPlayer(null);
  }, []);

  const offenseColor = 'hsl(210, 90%, 56%)';
  const defenseColor = 'hsl(0, 80%, 58%)';
  const routeColor = 'hsl(48, 95%, 55%)';

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
      className="w-full rounded-lg border border-border cursor-crosshair select-none"
      style={{ maxHeight: '70vh' }}
      onClick={handleFieldClick}
      onDoubleClick={handleDoubleClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Field background */}
      <rect width={FIELD_WIDTH} height={FIELD_HEIGHT} fill="hsl(145, 65%, 25%)" rx="8" />

      {/* Yard lines */}
      {Array.from({ length: YARD_LINES + 1 }).map((_, i) => {
        const x = (i * FIELD_WIDTH) / YARD_LINES;
        return (
          <line
            key={`yard-${i}`}
            x1={x}
            y1={0}
            x2={x}
            y2={FIELD_HEIGHT}
            stroke="hsla(60, 20%, 95%, 0.2)"
            strokeWidth="1"
          />
        );
      })}

      {/* Horizontal hash marks */}
      {[FIELD_HEIGHT / 3, (2 * FIELD_HEIGHT) / 3].map((y, i) => (
        <line
          key={`hash-${i}`}
          x1={0}
          y1={y}
          x2={FIELD_WIDTH}
          y2={y}
          stroke="hsla(60, 20%, 95%, 0.15)"
          strokeWidth="1"
          strokeDasharray="8 8"
        />
      ))}

      {/* Line of scrimmage */}
      <line
        x1={FIELD_WIDTH / 2}
        y1={0}
        x2={FIELD_WIDTH / 2}
        y2={FIELD_HEIGHT}
        stroke="hsla(48, 95%, 55%, 0.6)"
        strokeWidth="2"
        strokeDasharray="6 4"
      />

      {/* End zones */}
      <rect width={FIELD_WIDTH / YARD_LINES} height={FIELD_HEIGHT} fill="hsla(0, 80%, 40%, 0.3)" rx="8" />
      <rect
        x={FIELD_WIDTH - FIELD_WIDTH / YARD_LINES}
        width={FIELD_WIDTH / YARD_LINES}
        height={FIELD_HEIGHT}
        fill="hsla(210, 80%, 40%, 0.3)"
      />

      {/* Existing routes */}
      {routes.map((route, ri) => {
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
              opacity={0.9}
            />
            {/* Arrow at end */}
            {route.points.length >= 2 && (
              <circle
                cx={route.points[route.points.length - 1].x}
                cy={route.points[route.points.length - 1].y}
                r="5"
                fill={routeColor}
              />
            )}
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
          strokeDasharray="6 3"
          opacity={0.7}
        />
      )}

      {/* Players */}
      {players.map((player) => {
        const isOffense = side === 'offense';
        const color = isOffense ? offenseColor : defenseColor;
        const isSelected = selectedPlayerId === player.playerId;
        return (
          <g
            key={player.playerId}
            onMouseDown={(e) => handlePlayerMouseDown(e, player.playerId)}
            className="cursor-grab active:cursor-grabbing"
          >
            {isSelected && (
              <circle
                cx={player.x}
                cy={player.y}
                r="22"
                fill="none"
                stroke={routeColor}
                strokeWidth="2"
                opacity={0.8}
              />
            )}
            {isOffense ? (
              <circle
                cx={player.x}
                cy={player.y}
                r="16"
                fill={color}
                stroke="hsla(60, 20%, 95%, 0.8)"
                strokeWidth="2"
              />
            ) : (
              <rect
                x={player.x - 14}
                y={player.y - 14}
                width="28"
                height="28"
                rx="4"
                fill={color}
                stroke="hsla(60, 20%, 95%, 0.8)"
                strokeWidth="2"
              />
            )}
            <text
              x={player.x}
              y={player.y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="11"
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
