export const OFFENSE_POSITIONS = ['WR', 'QB', 'SN'] as const;
export const DEFENSE_POSITIONS = ['OD', 'ID', 'BL'] as const;
export type OffensePosition = typeof OFFENSE_POSITIONS[number];
export type DefensePosition = typeof DEFENSE_POSITIONS[number];

export interface Player {
  id: string;
  name: string;
  number: number;
  position: OffensePosition | DefensePosition;
}

export interface PlayerOnField {
  playerId: string;
  rosterId?: string; // links to Player.id from roster
  x: number;
  y: number;
  label: string;
}

export interface RoutePoint {
  x: number;
  y: number;
}

export type DrawingType = 'solid' | 'dashed' | 'circle';

export interface Route {
  playerId: string;
  points: RoutePoint[];
  type: 'route' | 'block' | 'coverage' | 'rush';
  drawingType: DrawingType;
}

export type DrawTool = 'select' | 'solid' | 'dashed' | 'circle' | 'eraser';

export interface Play {
  id: string;
  name: string;
  side: 'offense' | 'defense';
  teamId: string;
  players: PlayerOnField[];
  routes: Route[];
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  roster: Player[];
}

export interface AppState {
  teams: Team[];
  plays: Play[];
}
