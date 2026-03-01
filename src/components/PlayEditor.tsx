import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import FieldCanvas from '@/components/FieldCanvas';
import { Play, PlayerOnField, Route, RoutePoint, DrawTool, OFFENSE_POSITIONS, DEFENSE_POSITIONS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, RotateCcw, Trash2, Minus, MoreHorizontal, Circle, Eraser, MousePointer, Play as PlayIcon, Square } from 'lucide-react';
import { toast } from 'sonner';

const PlayEditor: React.FC = () => {
  const { teams, addPlay } = useAppStore();
  const [side, setSide] = useState<'offense' | 'defense'>('offense');
  const [playName, setPlayName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || '');
  const [players, setPlayers] = useState<PlayerOnField[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [drawTool, setDrawTool] = useState<DrawTool>('select');
  const [drawing, setDrawing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RoutePoint[]>([]);
  const [animating, setAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const animRef = useRef<number>();

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const availablePlayers = selectedTeam?.roster.filter((p) => {
    const offPositions: readonly string[] = OFFENSE_POSITIONS;
    const defPositions: readonly string[] = DEFENSE_POSITIONS;
    if (side === 'offense') return offPositions.includes(p.position);
    return defPositions.includes(p.position);
  }) || [];

  const handleSideChange = (newSide: 'offense' | 'defense') => {
    setSide(newSide);
    setPlayers([]);
    setRoutes([]);
    setSelectedPlayerId(null);
    setDrawTool('select');
    setDrawing(false);
    setCurrentRoute([]);
  };

  const handleReset = () => {
    setPlayers([]);
    setRoutes([]);
    setSelectedPlayerId(null);
    setDrawTool('select');
    setDrawing(false);
    setCurrentRoute([]);
  };

  const handleAddPlayerToField = (rosterId: string) => {
    const rosterPlayer = selectedTeam?.roster.find((p) => p.id === rosterId);
    if (!rosterPlayer) return;
    // Check if already on field
    if (players.some((p) => p.rosterId === rosterId)) {
      toast.error('Jogador já está em campo!');
      return;
    }
    if (players.length >= 5) {
      toast.error('Máximo 5 jogadores em campo!');
      return;
    }
    const newPlayer: PlayerOnField = {
      playerId: crypto.randomUUID(),
      rosterId,
      x: 350 + (Math.random() - 0.5) * 60,
      y: 150 + (Math.random() - 0.5) * 100,
      label: `${rosterPlayer.position}`,
    };
    setPlayers((prev) => [...prev, newPlayer]);
  };

  const handleRemovePlayerFromField = (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.playerId !== playerId));
    setRoutes((prev) => prev.filter((r) => r.playerId !== playerId));
    if (selectedPlayerId === playerId) setSelectedPlayerId(null);
  };

  const handleDrawStart = useCallback(
    (pt: RoutePoint) => {
      if (!selectedPlayerId) {
        toast.error('Selecione um jogador primeiro!');
        return;
      }
      if (drawTool === 'circle') {
        const newRoute: Route = {
          playerId: selectedPlayerId,
          points: [pt],
          type: side === 'offense' ? 'route' : 'coverage',
          drawingType: 'circle',
        };
        setRoutes((prev) => [...prev, newRoute]);
        return;
      }
      setDrawing(true);
      setCurrentRoute([pt]);
    },
    [selectedPlayerId, drawTool, side]
  );

  const handleDrawAdd = useCallback(
    (pt: RoutePoint) => {
      setCurrentRoute((prev) => [...prev, pt]);
    },
    []
  );

  const handleDrawEnd = useCallback(() => {
    if (currentRoute.length < 2 || !selectedPlayerId) {
      setDrawing(false);
      setCurrentRoute([]);
      return;
    }
    const newRoute: Route = {
      playerId: selectedPlayerId,
      points: currentRoute,
      type: side === 'offense' ? 'route' : 'coverage',
      drawingType: drawTool === 'dashed' ? 'dashed' : 'solid',
    };
    setRoutes((prev) => [...prev, newRoute]);
    setCurrentRoute([]);
    setDrawing(false);
  }, [currentRoute, selectedPlayerId, side, drawTool]);

  const handleSave = () => {
    if (!playName.trim()) {
      toast.error('Dê um nome para a jogada!');
      return;
    }
    if (!selectedTeamId) {
      toast.error('Selecione um time primeiro!');
      return;
    }
    if (players.length === 0) {
      toast.error('Adicione jogadores ao campo!');
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

  const handlePlayAnimation = () => {
    if (animating) {
      cancelAnimationFrame(animRef.current!);
      setAnimating(false);
      setAnimationProgress(0);
      return;
    }
    if (routes.length === 0) {
      toast.error('Desenhe rotas antes de animar!');
      return;
    }
    setAnimating(true);
    setAnimationProgress(0);
    const duration = 2000; // 2 seconds
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setAnimating(false);
        setTimeout(() => setAnimationProgress(0), 500);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const tools: { id: DrawTool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer className="w-4 h-4" />, label: 'Mover' },
    { id: 'solid', icon: <Minus className="w-4 h-4" />, label: 'Linha' },
    { id: 'dashed', icon: <MoreHorizontal className="w-4 h-4" />, label: 'Pontilhada' },
    { id: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Círculo' },
    { id: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Borracha' },
  ];

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-border">
          <button
            onClick={() => handleSideChange('offense')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              side === 'offense'
                ? 'bg-offense text-white'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Ataque
          </button>
          <button
            onClick={() => handleSideChange('defense')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              side === 'defense'
                ? 'bg-defense text-white'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Defesa
          </button>
        </div>

        {teams.length > 0 && (
          <select
            value={selectedTeamId}
            onChange={(e) => { setSelectedTeamId(e.target.value); handleReset(); }}
            className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
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

        <Button onClick={handlePlayAnimation} size="sm" variant="outline" className="gap-2">
          {animating ? <Square className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
          {animating ? 'Parar' : 'Animar'}
        </Button>
      </div>

      {/* Player selector + Drawing tools row */}
      <div className="flex flex-wrap gap-4">
        {/* Player selector */}
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
            Jogadores ({side === 'offense' ? 'Ataque' : 'Defesa'}) — clique para adicionar
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availablePlayers.length === 0 ? (
              <span className="text-xs text-muted-foreground">Nenhum jogador de {side === 'offense' ? 'ataque' : 'defesa'} cadastrado neste time.</span>
            ) : (
              availablePlayers.map((p) => {
                const onField = players.some((fp) => fp.rosterId === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => onField ? handleRemovePlayerFromField(players.find((fp) => fp.rosterId === p.id)!.playerId) : handleAddPlayerToField(p.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border ${
                      onField
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-primary/50'
                    }`}
                  >
                    #{p.number} {p.name} <span className="opacity-60">({p.position})</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Drawing tools */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Ferramentas</p>
          <div className="flex rounded-lg overflow-hidden border border-border">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => { setDrawTool(tool.id); setDrawing(false); setCurrentRoute([]); }}
                title={tool.label}
                className={`px-3 py-2 transition-colors ${
                  drawTool === tool.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {tool.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xs text-muted-foreground">
        {drawTool === 'select' && 'Arraste os jogadores para posicioná-los. Selecione um jogador clicando nele.'}
        {drawTool === 'solid' && 'Selecione um jogador, clique no campo para pontos da rota. Duplo-clique para finalizar.'}
        {drawTool === 'dashed' && 'Selecione um jogador, clique no campo para pontos. Duplo-clique para finalizar (linha pontilhada).'}
        {drawTool === 'circle' && 'Selecione um jogador e clique no campo para posicionar um círculo de cobertura.'}
        {drawTool === 'eraser' && 'Clique em uma rota para removê-la.'}
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
        drawTool={drawTool}
        drawing={drawing}
        currentRoute={currentRoute}
        onDrawStart={handleDrawStart}
        onDrawAdd={handleDrawAdd}
        onDrawEnd={handleDrawEnd}
        animationProgress={animating ? animationProgress : undefined}
      />

      {/* On-field player list */}
      {players.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {players.map((p) => {
            const rosterPlayer = selectedTeam?.roster.find((r) => r.id === p.rosterId);
            return (
              <div
                key={p.playerId}
                onClick={() => setSelectedPlayerId(p.playerId)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs cursor-pointer transition-all border ${
                  selectedPlayerId === p.playerId
                    ? 'bg-primary/20 border-primary text-foreground'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="font-bold">{p.label}</span>
                {rosterPlayer && <span>#{rosterPlayer.number} {rosterPlayer.name}</span>}
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemovePlayerFromField(p.playerId); }}
                  className="ml-1 text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlayEditor;
