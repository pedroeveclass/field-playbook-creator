import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Users } from 'lucide-react';
import { Team, Player, OFFENSE_POSITIONS, DEFENSE_POSITIONS } from '@/types';
import { toast } from 'sonner';

const ALL_POSITIONS = [...OFFENSE_POSITIONS, ...DEFENSE_POSITIONS];

const TeamManager: React.FC = () => {
  const { teams, addTeam, deleteTeam, addPlayerToTeam, removePlayerFromTeam, setActiveTeam } = useAppStore();
  const [newTeamName, setNewTeamName] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState<string>(ALL_POSITIONS[0]);

  const handleAddTeam = () => {
    if (!newTeamName.trim()) return;
    const team: Team = {
      id: crypto.randomUUID(),
      name: newTeamName.trim(),
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
      roster: [],
    };
    addTeam(team);
    setActiveTeam(team.id);
    setNewTeamName('');
    toast.success(`Time "${team.name}" criado!`);
  };

  const handleAddPlayer = (teamId: string) => {
    if (!newPlayerName.trim()) return;
    const player: Player = {
      id: crypto.randomUUID(),
      name: newPlayerName.trim(),
      number: parseInt(newPlayerNumber) || 0,
      position: newPlayerPosition as Player['position'],
    };
    addPlayerToTeam(teamId, player);
    setNewPlayerName('');
    setNewPlayerNumber('');
  };

  const getPositionSide = (pos: string) => {
    if ((OFFENSE_POSITIONS as readonly string[]).includes(pos)) return 'ATK';
    return 'DEF';
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Nome do time..."
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
          className="bg-secondary border-border"
        />
        <Button onClick={handleAddTeam} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Criar Time
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nenhum time criado ainda.</p>
          <p className="text-sm">Crie um time para começar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div key={team.id} className="bg-card rounded-lg border border-border overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                  <h3 className="font-display text-xl tracking-wide">{team.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {team.roster.length} jogador{team.roster.length !== 1 ? 'es' : ''}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTeam(team.id);
                    toast.success('Time removido');
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {expandedTeamId === team.id && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      className="bg-secondary border-border"
                    />
                    <Input
                      placeholder="#"
                      value={newPlayerNumber}
                      onChange={(e) => setNewPlayerNumber(e.target.value)}
                      className="bg-secondary border-border w-16"
                    />
                    <select
                      value={newPlayerPosition}
                      onChange={(e) => setNewPlayerPosition(e.target.value)}
                      className="bg-secondary text-foreground border border-border rounded-lg px-2 py-2 text-sm w-24"
                    >
                      <optgroup label="Ataque">
                        {OFFENSE_POSITIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Defesa">
                        {DEFENSE_POSITIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </optgroup>
                    </select>
                    <Button size="sm" onClick={() => handleAddPlayer(team.id)} className="shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {team.roster.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">Elenco vazio</p>
                  ) : (
                    <div className="space-y-1">
                      {team.roster.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between px-3 py-2 rounded-md bg-secondary/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-display text-primary text-lg">#{player.number}</span>
                            <span className="text-sm font-medium">{player.name}</span>
                            <span className="text-xs text-muted-foreground uppercase">{player.position}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              getPositionSide(player.position) === 'ATK'
                                ? 'bg-offense/20 text-offense'
                                : 'bg-defense/20 text-defense'
                            }`}>
                              {getPositionSide(player.position)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePlayerFromTeam(team.id, player.id)}
                            className="text-destructive h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamManager;
