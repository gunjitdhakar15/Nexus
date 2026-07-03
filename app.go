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
    `
    _, err = a.db.Exec(createTableSQL)
    if err != nil {
        log.Fatal("Failed to create tables:", err)
    }
    log.Println("✅ Database initialized successfully!")
}

func generateID() string {
    return uuid.New().String()
}

// ---------- FUNCTIONS YOUR UI WILL CALL ----------

// GetAllGames returns all games in your library
func (a *App) GetAllGames() ([]models.Game, error) {
    rows, err := a.db.Query(`SELECT id, title, cover_art, total_playtime FROM games ORDER BY title`)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var games []models.Game
    for rows.Next() {
        var g models.Game
        err := rows.Scan(&g.ID, &g.Title, &g.CoverArt, &g.TotalPlaytime)
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