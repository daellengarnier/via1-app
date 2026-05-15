-- Spielzeit pro Game-Eintrag. Default 0 fuer Bestandseintraege.
ALTER TABLE "game_scores"
  ADD COLUMN "durationSec" INTEGER NOT NULL DEFAULT 0;
