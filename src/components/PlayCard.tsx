import React from 'react';
import { Play } from '@/types';
import FieldCanvas from '@/components/FieldCanvas';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayCardProps {
  play: Play;
  onDelete: (id: string) => void;
}

const PlayCard: React.FC<PlayCardProps> = ({ play, onDelete }) => {
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(play.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
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
        />
      </div>
    </div>
  );
};

export default PlayCard;
