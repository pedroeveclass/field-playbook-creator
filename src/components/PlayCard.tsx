import React, { useState, useRef } from 'react';
import { Play } from '@/types';
import FieldCanvas from '@/components/FieldCanvas';
import { Trash2, Play as PlayIcon, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayCardProps {
  play: Play;
  onDelete: (id: string) => void;
}

const PlayCard: React.FC<PlayCardProps> = ({ play, onDelete }) => {
  const [animating, setAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const animRef = useRef<number>();

  const handleAnimate = () => {
    if (animating) {
      cancelAnimationFrame(animRef.current!);
      setAnimating(false);
      setProgress(0);
      return;
    }
    setAnimating(true);
    setProgress(0);
    const duration = 2000;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setAnimating(false);
        setTimeout(() => setProgress(0), 500);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden group">
      <div className="p-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg tracking-wide">{play.name}</h3>
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              play.side === 'offense' ? 'text-offense' : 'text-defense'
            }`}
          >
            {play.side === 'offense' ? 'Ataque' : 'Defesa'}
          </span>
        </div>
        <div className="flex gap-1">
          {play.routes.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleAnimate}>
              {animating ? <Square className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(play.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="px-3 pb-3">
        <FieldCanvas
          players={play.players}
          routes={play.routes}
          side={play.side}
          onPlayersChange={() => {}}
          onRoutesChange={() => {}}
          selectedPlayerId={null}
          onSelectPlayer={() => {}}
          readOnly
          animationProgress={animating ? progress : undefined}
        />
      </div>
    </div>
  );
};

export default PlayCard;
