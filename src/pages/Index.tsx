import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import PlayEditor from '@/components/PlayEditor';
import PlayCard from '@/components/PlayCard';
import TeamManager from '@/components/TeamManager';
import { BookOpen, PenTool, Users, Trophy } from 'lucide-react';

type Tab = 'editor' | 'playbook' | 'teams';

const Index: React.FC = () => {
  const { plays, teams, deletePlay } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('teams');
  const [filterSide, setFilterSide] = useState<'all' | 'offense' | 'defense'>('all');
  const [filterTeamId, setFilterTeamId] = useState<string>('all');

  const filteredPlays = plays.filter((p) => {
    if (filterSide !== 'all' && p.side !== filterSide) return false;
    if (filterTeamId !== 'all' && p.teamId !== filterTeamId) return false;
    return true;
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'teams', label: 'Times', icon: <Users className="w-5 h-5" /> },
    { id: 'editor', label: 'Editor', icon: <PenTool className="w-5 h-5" /> },
    { id: 'playbook', label: 'Playbook', icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl leading-none">Flag Playbook</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Gerencie seus times e jogadas</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'teams' && <TeamManager />}

        {activeTab === 'editor' && (
          teams.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <PenTool className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Crie um time primeiro para começar a montar jogadas.</p>
              <button
                onClick={() => setActiveTab('teams')}
                className="mt-3 text-primary underline text-sm"
              >
                Ir para Times
              </button>
            </div>
          ) : (
            <PlayEditor />
          )
        )}

        {activeTab === 'playbook' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex rounded-lg overflow-hidden border border-border">
                {(['all', 'offense', 'defense'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterSide(s)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      filterSide === s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s === 'all' ? 'Todas' : s === 'offense' ? 'Ataque' : 'Defesa'}
                  </button>
                ))}
              </div>

              {teams.length > 1 && (
                <select
                  value={filterTeamId}
                  onChange={(e) => setFilterTeamId(e.target.value)}
                  className="bg-secondary text-foreground border border-border rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="all">Todos os times</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Plays grid */}
            {filteredPlays.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhuma jogada salva ainda.</p>
                <button
                  onClick={() => setActiveTab('editor')}
                  className="mt-3 text-primary underline text-sm"
                >
                  Criar jogada
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlays.map((play) => (
                  <PlayCard key={play.id} play={play} onDelete={deletePlay} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
