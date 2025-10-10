CREATE INDEX idx_players_name_trgm
    ON "Player" USING gin ((unaccent(lower("summonerName"))) gin_trgm_ops);
