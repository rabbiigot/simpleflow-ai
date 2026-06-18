import { Input } from "@/components/ui/input";
import {
  getTrelloStatus,
  listTrelloBoards,
  listTrelloCards,
  type TrelloBoardItem,
  type TrelloCardItem,
  type TrelloStatus,
} from "@/lib/backend-api";
import trelloIcon from "@/assets/trello.svg";
import { ChevronLeft, Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  userId: string;
  /** Optional default board linked to the workspace; if absent the user picks one. */
  boardId?: string | null;
  onClose: () => void;
  onSelect: (card: TrelloCardItem) => void;
};

/**
 * Popup to replicate a Trello card as a task. If the workspace has a linked
 * board it jumps straight to that board's cards; otherwise the user first picks
 * a board (so they can see which board's cards they're pulling from).
 */
export default function TrelloCardPicker({
  userId,
  boardId,
  onClose,
  onSelect,
}: Props) {
  const [status, setStatus] = useState<TrelloStatus | null>(null);
  const [boards, setBoards] = useState<TrelloBoardItem[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(
    boardId ?? null,
  );
  const [cards, setCards] = useState<TrelloCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Connection + initial data: boards list, or cards if a board is preselected.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const st = await getTrelloStatus(userId).catch(
        () => ({ connected: false }) as TrelloStatus,
      );
      if (cancelled) return;
      setStatus(st);
      if (!st.connected) {
        setIsLoading(false);
        return;
      }
      if (selectedBoard) {
        const c = await listTrelloCards(userId, selectedBoard).catch(() => []);
        if (!cancelled) setCards(c);
      } else {
        const b = await listTrelloBoards(userId).catch(() => []);
        if (!cancelled) setBoards(b);
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const openBoard = async (id: string) => {
    setSelectedBoard(id);
    setIsLoading(true);
    setSearch("");
    const c = await listTrelloCards(userId, id).catch(() => []);
    setCards(c);
    setIsLoading(false);
  };

  const backToBoards = async () => {
    setSelectedBoard(null);
    setCards([]);
    if (!boards.length) {
      setIsLoading(true);
      setBoards(await listTrelloBoards(userId).catch(() => []));
      setIsLoading(false);
    }
  };

  const filteredCards = cards.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const wrap =
    "absolute top-full right-0 mt-1 w-80 rounded-lg border bg-card shadow-lg z-20";

  if (status && !status.connected) {
    return (
      <div className={`${wrap} p-3`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Trello
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center py-3">
          Trello not connected. Go to Profile Settings → Integrations to connect.
        </p>
      </div>
    );
  }

  return (
    <div className={wrap}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-xs font-medium flex items-center gap-1.5">
          {selectedBoard && !boardId && (
            <button
              type="button"
              onClick={() => void backToBoards()}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          )}
          <img src={trelloIcon} alt="" className="h-3.5 w-3.5 dark:invert" />
          {selectedBoard ? "Pick a card" : "Pick a board"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search (cards view only) */}
      {selectedBoard && (
        <div className="px-3 py-1.5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards..."
              className="h-7 text-xs pl-7"
            />
          </div>
        </div>
      )}

      <div className="max-h-64 overflow-auto px-1.5 pb-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : selectedBoard ? (
          filteredCards.length ? (
            filteredCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelect(card)}
                className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-muted transition-colors cursor-pointer"
              >
                <span className="text-xs font-medium text-card-foreground line-clamp-1">
                  {card.name}
                </span>
                {card.listName && (
                  <span className="text-[10px] text-muted-foreground">
                    in {card.listName}
                  </span>
                )}
              </button>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">
              No open cards on this board.
            </p>
          )
        ) : boards.length ? (
          boards.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => void openBoard(b.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted transition-colors cursor-pointer"
            >
              <img src={trelloIcon} alt="" className="h-3.5 w-3.5 dark:invert" />
              <span className="text-xs font-medium text-card-foreground line-clamp-1">
                {b.name}
              </span>
            </button>
          ))
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">
            No Trello boards found.
          </p>
        )}
      </div>
    </div>
  );
}
