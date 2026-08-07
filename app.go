package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"

	"game-alt-hub/models"

	"github.com/google/uuid"
	_ "modernc.org/sqlite"
)

// App struct
type App struct {
	ctx context.Context
	db  *sql.DB
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// Startup initializes the database when the app starts
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	var err error
	a.db, err = sql.Open("sqlite", "./gamerhub.db")
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}

	createTableSQL := `
    CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        cover_art TEXT,
        total_playtime INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS alt_accounts (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        name TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        playtime_hours INTEGER DEFAULT 0,
        last_played TEXT,
        progress TEXT DEFAULT '{}',
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    `
	_, err = a.db.Exec(createTableSQL)
	if err != nil {
		log.Fatal("Failed to create tables:", err)
	}

	a.migrateGamesTable()
	log.Println("✅ Database initialized successfully!")
}

// migrateGamesTable adds newer columns to the games table for existing databases
func (a *App) migrateGamesTable() {
	rows, err := a.db.Query(`PRAGMA table_info(games)`)
	if err != nil {
		log.Println("⚠️ Failed to inspect games table:", err)
		return
	}
	defer rows.Close()

	existing := map[string]bool{}
	for rows.Next() {
		var cid int
		var name, ctype string
		var notnull int
		var dflt, pk sql.NullString
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err == nil {
			existing[name] = true
		}
	}
	rows.Close()

	columns := []struct {
		name, def string
	}{
		{"metacritic", "INTEGER DEFAULT 0"},
		{"rating", "REAL DEFAULT 0"},
		{"released", "TEXT DEFAULT ''"},
		{"genres", "TEXT DEFAULT ''"},
		{"rawg_id", "INTEGER DEFAULT 0"},
		{"steam_app_id", "INTEGER DEFAULT 0"},
	}
	for _, c := range columns {
		if existing[c.name] {
			continue
		}
		if _, err := a.db.Exec("ALTER TABLE games ADD COLUMN " + c.name + " " + c.def); err != nil {
			log.Printf("⚠️ Could not add column %s: %v", c.name, err)
		}
	}
}

func generateID() string {
	return uuid.New().String()
}

// ---------- FUNCTIONS YOUR UI WILL CALL ----------

// GetAllGames returns all games in your library
func (a *App) GetAllGames() ([]models.Game, error) {
	rows, err := a.db.Query(`SELECT id, title, cover_art, total_playtime, metacritic, rating, released, genres, rawg_id, steam_app_id FROM games ORDER BY title`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var games []models.Game
	for rows.Next() {
		var g models.Game
		err := rows.Scan(&g.ID, &g.Title, &g.CoverArt, &g.TotalPlaytime,
			&g.Metacritic, &g.Rating, &g.Released, &g.Genres, &g.RawgID, &g.SteamAppID)
		if err != nil {
			return nil, err
		}
		games = append(games, g)
	}
	return games, nil
}

// AddGame adds a new game to your library
func (a *App) AddGame(title string, coverArt string) (string, error) {
	id := generateID()
	_, err := a.db.Exec(`INSERT INTO games (id, title, cover_art) VALUES (?, ?, ?)`, id, title, coverArt)
	if err != nil {
		return "", err
	}
	return id, nil
}

// AddGameWithDetails adds a game including enriched metadata (RAWG/Steam)
func (a *App) AddGameWithDetails(title, coverArt string, metacritic int, rating float64, released, genres string, rawgID, steamAppID int) (string, error) {
	id := generateID()
	_, err := a.db.Exec(
		`INSERT INTO games (id, title, cover_art, metacritic, rating, released, genres, rawg_id, steam_app_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, title, coverArt, metacritic, rating, released, genres, rawgID, steamAppID,
	)
	if err != nil {
		return "", err
	}
	return id, nil
}

// GetAltsByGame returns all alt accounts for a specific game
func (a *App) GetAltsByGame(gameID string) ([]models.AltAccount, error) {
	rows, err := a.db.Query(
		`SELECT id, game_id, name, level, playtime_hours, last_played, progress 
         FROM alt_accounts WHERE game_id = ?`,
		gameID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alts []models.AltAccount
	for rows.Next() {
		var alt models.AltAccount
		var progressStr string
		err := rows.Scan(&alt.ID, &alt.GameID, &alt.Name, &alt.Level,
			&alt.PlaytimeHours, &alt.LastPlayed, &progressStr)
		if err != nil {
			return nil, err
		}
		// Convert the JSON string back to a map
		if len(progressStr) > 0 && progressStr != "{}" {
			json.Unmarshal([]byte(progressStr), &alt.Progress)
		} else {
			alt.Progress = make(map[string]interface{})
		}
		alts = append(alts, alt)
	}
	return alts, nil
}

// AddAlt adds a new alt account for a game
func (a *App) AddAlt(gameID, name string, level int, playtimeHours int, lastPlayed string, progress map[string]interface{}) (string, error) {
	id := generateID()
	progressJSON, _ := json.Marshal(progress)
	_, err := a.db.Exec(
		`INSERT INTO alt_accounts (id, game_id, name, level, playtime_hours, last_played, progress) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		id, gameID, name, level, playtimeHours, lastPlayed, string(progressJSON),
	)
	if err != nil {
		return "", err
	}
	return id, nil
}

// UpdateAlt updates an existing alt account
func (a *App) UpdateAlt(id, name string, level int, playtimeHours int, lastPlayed string, progress map[string]interface{}) error {
	progressJSON, _ := json.Marshal(progress)
	_, err := a.db.Exec(
		`UPDATE alt_accounts SET name = ?, level = ?, playtime_hours = ?, last_played = ?, progress = ? WHERE id = ?`,
		name, level, playtimeHours, lastPlayed, string(progressJSON), id,
	)
	return err
}

// DeleteAlt deletes an alt account
func (a *App) DeleteAlt(id string) error {
	_, err := a.db.Exec(`DELETE FROM alt_accounts WHERE id = ?`, id)
	return err
}

// UpdateGame updates a game's title and cover art
func (a *App) UpdateGame(id, title, coverArt string) error {
	_, err := a.db.Exec(`UPDATE games SET title = ?, cover_art = ? WHERE id = ?`, title, coverArt, id)
	return err
}

// UpdateGameWithDetails updates a game's title, cover art and enriched metadata
func (a *App) UpdateGameWithDetails(id, title, coverArt string, metacritic int, rating float64, released, genres string, rawgID, steamAppID int) error {
	_, err := a.db.Exec(
		`UPDATE games SET title = ?, cover_art = ?, metacritic = ?, rating = ?, released = ?, genres = ?, rawg_id = ?, steam_app_id = ? WHERE id = ?`,
		title, coverArt, metacritic, rating, released, genres, rawgID, steamAppID, id,
	)
	return err
}

// DeleteGame deletes a game and all its alts (cascade)
func (a *App) DeleteGame(id string) error {
	_, err := a.db.Exec(`DELETE FROM games WHERE id = ?`, id)
	return err
}

// UpdateGamePlaytime updates the total playtime for a game
func (a *App) UpdateGamePlaytime(id string, playtime int) error {
	_, err := a.db.Exec(`UPDATE games SET total_playtime = ? WHERE id = ?`, playtime, id)
	return err
}
