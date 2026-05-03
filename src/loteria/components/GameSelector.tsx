import type { GameConfig } from '../types';
import { GAMES } from '../types';
import { useLoteriaStore } from '../store/useLoteriaStore';

export function GameSelector() {
  const { selectedGame, selectGame } = useLoteriaStore();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {GAMES.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          selected={selectedGame.id === game.id}
          onSelect={() => selectGame(game)}
        />
      ))}
    </div>
  );
}

function GameCard({
  game,
  selected,
  onSelect,
}: {
  game: GameConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`rounded-xl p-3 text-center transition-all border-2 ${
        selected
          ? `${game.bgColor} text-white border-transparent shadow-lg scale-105`
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className={`text-xs font-bold ${selected ? 'text-white' : game.color}`}>
        {game.name}
      </div>
      <div className={`text-xs mt-0.5 ${selected ? 'text-white/80' : 'text-gray-500'}`}>
        {game.isSuperSete
          ? '7 colunas'
          : `${game.pickCount} de ${game.maxNum}`}
      </div>
    </button>
  );
}
