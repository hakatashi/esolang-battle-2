import React from "react";
import { trpc } from "../utils/trpc";

type OwnerColor = "neutral" | "red" | "blue";

function cellClass(color: OwnerColor): string {
  switch (color) {
    case "red": return "cell cell-red";
    case "blue": return "cell cell-blue";
    default: return "cell cell-neutral";
  }
}

export function BoardTab({ contestId }: { contestId: number }) {
  const { data: me } = trpc.me.useQuery();
  const { data: board, isLoading: isLoadingBoard, error: boardError, refetch: refetchBoard } = trpc.getBoard.useQuery({ contestId });
  
  // 自分のチームの提出可能言語を取得
  const myTeam = me?.teams.find(t => t.contestId === contestId);
  const { data: submittableLanguageIds } = trpc.getSubmittableLanguageIdsForTeam.useQuery(
    { teamId: myTeam?.id ?? 0, contestId },
    { enabled: !!myTeam }
  );

  const [boardSize, setBoardSize] = React.useState<{ width: number; height: number } | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!board) return;

    function updateBoardSize() {
      const padding = 48;
      const headerReserve = 96;
      const maxWidth = Math.max(window.innerWidth - padding * 2, 0);
      const maxHeight = Math.max(window.innerHeight - headerReserve - padding * 2, 0);

      if (maxWidth <= 0 || maxHeight <= 0) return;

      const cellSize = Math.min(maxWidth / board!.width, maxHeight / board!.height);
      setBoardSize({ width: cellSize * board!.width, height: cellSize * board!.height });
    }

    updateBoardSize();
    window.addEventListener("resize", updateBoardSize);
    return () => window.removeEventListener("resize", updateBoardSize);
  }, [board]);

  if (boardError) return <div style={{ color: "#b00020", marginTop: "16px" }}>Error: {boardError.message}</div>;
  if (isLoadingBoard || !board) return <div style={{ marginTop: "16px" }}>Loading board...</div>;

  const { width, height, cells } = board;

  return (
    <div>
      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gridTemplateRows: `repeat(${height}, 1fr)`,
          width: boardSize ? `${boardSize.width}px` : undefined,
          height: boardSize ? `${boardSize.height}px` : undefined,
        }}
      >
        {cells.map((cell, index) => (
          <div
            key={index}
            className={cellClass(cell.owner as OwnerColor)}
            style={cell.languageId !== null ? { cursor: "pointer" } : undefined}
            onClick={() => {
              if (cell.languageId === null) return;
              if (!me) {
                setToastMessage("ログインしていません");
                setTimeout(() => setToastMessage(null), 2000);
                return;
              }

              if (submittableLanguageIds && !submittableLanguageIds.includes(cell.languageId)) {
                setToastMessage("ルール上このマスの言語には提出できません");
                setTimeout(() => setToastMessage(null), 2000);
                return;
              }

              const url = new URL(window.location.href);
              url.pathname = `/contest/${contestId}/submit`;
              url.searchParams.set("languageId", String(cell.languageId));
              window.history.pushState(null, "", url.toString());
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            <div className="cell-label">
              {cell.languageName && <div className="cell-label-name">{cell.languageName}</div>}
              {cell.score !== null && <div className="cell-label-score">{cell.score}</div>}
            </div>
          </div>
        ))}

        {toastMessage && (
          <div style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            backgroundColor: "rgba(0,0,0,0.8)", color: "#fff", padding: "8px 16px",
            borderRadius: 4, zIndex: 1000, fontSize: 14,
          }}>
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
