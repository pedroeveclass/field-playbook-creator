import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import FieldCanvas from '@/components/FieldCanvas';
import { Play, PlayerOnField, Route } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_OFFENSE: PlayerOnField[] = [
  { playerId: 'o-qb', x: 360, y: 240, label: 'QB' },
  { playerId: 'o-c', x: 360, y: 200, label: 'C' },
  { playerId: 'o-wr1', x: 360, y: 60, label: 'WR' },
  { playerId: 'o-wr2', x: 360, y: 420, label: 'WR' },
  { playerId: 'o-rb', x: 400, y: 240, label: 'RB' },
];

const DEFAULT_DEFENSE: PlayerOnField[] = [
  { playerId: 'd-lb1', x: 310, y: 180, label: 'LB' },
  { playerId: 'd-lb2', x: 310, y: 300, label: 'LB' },
  { playerId: 'd-cb1', x: 260, y: 60, label: 'CB' },
  { playerId: 'd-cb2', x: 260, y: 420, label: 'CB' },
  { playerId: 'd-s', x: 200, y: 240, label: 'S' },
];

const PlayEditor: React.FC = () => {
  const { teams, addPlay } = useAppStore();
  const [side, setSide] = useState<'offense' | 'defense'>('offense');
  const [playName, setPlayName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || '');
  const [players, setPlayers] = useState<PlayerOnField[]>(DEFAULT_OFFENSE);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const handleSideChange = (newSide: 'offense' | 'defense') => {
    setSide(newSide);
    setPlayers(newSide === 'offense' ? DEFAULT_OFFENSE : DEFAULT_DEFENSE);
    setRoutes([]);
    setSelectedPlayerId(null);
  };

  const handleReset = () => {
    setPlayers(side === 'offense' ? DEFAULT_OFFENSE : DEFAULT_DEFENSE);
    setRoutes([]);
    setSelectedPlayerId(null);
  };

  const handleSave = () => {
    if (!playName.trim()) {
      toast.error('Dê um nome para a jogada!');
      return;
    }
    if (!selectedTeamId) {
      toast.error('Selecione um time primeiro!');
      return;
    }

    const play: Play = {
      id: crypto.randomUUID(),
      name: playName.trim(),
      side,
      teamId: selectedTeamId,
      players: [...players],
      routes: [...routes],
      createdAt: new Date().toISOString(),
    };

    addPlay(play);
    toast.success(`Jogada "${play.name}" salva!`);
    setPlayName('');
    handleReset();
  };

  const handleDeleteLastRoute = () => {
    setRoutes((prev) => prev.slice(0, -1));
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Side toggle */}
        <div className="flex rounded-lg overflow-hidden border border-border">
          <button
            onClick={() => handleSideChange('offense')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              side === 'offense'
                ? 'bg-offense text-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Ataque
          </button>
          <button
            onClick={() => handleSideChange('defense')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              side === 'defense'
                ? 'bg-defense text-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Defesa
          </button>
        </div>

        {/* Team select */}
        {teams.length > 0 && (
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        <Input
          placeholder="Nome da jogada..."
          value={playName}
          onChange={(e) => setPlayName(e.target.value)}
          className="w-48 bg-secondary border-border"
        />

        <Button onClick={handleSave} size="sm" className="gap-2">
          <Save className="w-4 h-4" />
          Salvar
        </Button>

        <Button onClick={handleReset} size="sm" variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Resetar
        </Button>

        {routes.length > 0 && (
          <Button onClick={handleDeleteLastRoute} size="sm" variant="outline" className="gap-2">
            <Trash2 className="w-4 h-4" />
            Desfazer rota
          </Button>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs text-muted-foreground">
        Arraste os jogadores para posicioná-los. Selecione um jogador e clique no campo para desenhar a rota. 
        Duplo-clique para finalizar a rota.
      </p>

      {/* Field */}
      <FieldCanvas
        players={players}
        routes={routes}
        side={side}
        onPlayersChange={setPlayers}
        onRoutesChange={setRoutes}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={setSelectedPlayerId}
      />
    </div>
  );
};

export default PlayEditor;
