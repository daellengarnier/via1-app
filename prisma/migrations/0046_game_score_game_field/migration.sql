-- AlterTable: add 'game' column to game_scores so wir verschiedene
-- Spiele (tetris, snake, ...) auf eigenen Ranglisten halten koennen.
-- Defaults auf 'tetris' damit bestehende Eintraege als Tetris-Scores
-- weitergefuehrt werden.
ALTER TABLE "game_scores" ADD COLUMN "game" TEXT NOT NULL DEFAULT 'tetris';

-- Composite-Index fuer Leaderboard-Queries pro Spiel
CREATE INDEX "game_scores_game_score_idx" ON "game_scores"("game", "score" DESC);
