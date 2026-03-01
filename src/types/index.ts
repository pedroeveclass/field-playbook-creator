export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
}

export interface PlayerOnField {
  playerId: string;
  x: number;
  y: number;
  label: string;
}

export interface RoutePoint {
  x: number;
  y: number;
}

export interface Route {
  playerId: string;
  points: RoutePoint[];
  type: 'route' | 'block' | 'coverage' | 'rush';
}

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
