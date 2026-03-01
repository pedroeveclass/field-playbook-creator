import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Team, Play, Player } from '@/types';

interface AppStore {
  teams: Team[];
  plays: Play[];
  activeTeamId: string | null;
  addTeam: (team: Team) => void;
  updateTeam: (id: string, data: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  addPlayerToTeam: (teamId: string, player: Player) => void;
  removePlayerFromTeam: (teamId: string, playerId: string) => void;
  addPlay: (play: Play) => void;
  updatePlay: (id: string, data: Partial<Play>) => void;
  deletePlay: (id: string) => void;
  setActiveTeam: (id: string | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      teams: [],
      plays: [],
      activeTeamId: null,

      addTeam: (team) => set((s) => ({ teams: [...s.teams, team] })),
      updateTeam: (id, data) =>
        set((s) => ({
          teams: s.teams.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),
      deleteTeam: (id) =>
        set((s) => ({
          teams: s.teams.filter((t) => t.id !== id),
          plays: s.plays.filter((p) => p.teamId !== id),
          activeTeamId: s.activeTeamId === id ? null : s.activeTeamId,
        })),

      addPlayerToTeam: (teamId, player) =>
        set((s) => ({
          teams: s.teams.map((t) =>
            t.id === teamId ? { ...t, roster: [...t.roster, player] } : t
          ),
        })),
      removePlayerFromTeam: (teamId, playerId) =>
        set((s) => ({
          teams: s.teams.map((t) =>
            t.id === teamId
              ? { ...t, roster: t.roster.filter((p) => p.id !== playerId) }
              : t
          ),
        })),

      addPlay: (play) => set((s) => ({ plays: [...s.plays, play] })),
      updatePlay: (id, data) =>
        set((s) => ({
          plays: s.plays.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deletePlay: (id) =>
        set((s) => ({ plays: s.plays.filter((p) => p.id !== id) })),

      setActiveTeam: (id) => set({ activeTeamId: id }),
    }),
    { name: 'flag-football-store' }
  )
);
