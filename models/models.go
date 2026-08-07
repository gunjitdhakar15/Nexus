package models

type Game struct {
	ID            string  `json:"id"`
	Title         string  `json:"title"`
	CoverArt      string  `json:"coverArt"`
	TotalPlaytime int     `json:"totalPlaytime"`
	Metacritic    int     `json:"metacritic"`
	Rating        float64 `json:"rating"`
	Released      string  `json:"released"`
	Genres        string  `json:"genres"`
	RawgID        int     `json:"rawgId"`
	SteamAppID    int     `json:"steamAppId"`
}

// GameDetails is the enriched metadata returned by the RAWG API
type GameDetails struct {
	Title      string   `json:"title"`
	CoverURL   string   `json:"coverUrl"`
	Rating     float64  `json:"rating"`
	Metacritic int      `json:"metacritic"`
	Released   string   `json:"released"`
	Genres     []string `json:"genres"`
	RawgID     int      `json:"rawgId"`
}

// SteamGame is a game from the user's Steam library
type SteamGame struct {
	AppID         int    `json:"appId"`
	Title         string `json:"title"`
	PlaytimeHours int    `json:"playtimeHours"`
	CoverURL      string `json:"coverUrl"`
	HeaderURL     string `json:"headerUrl"`
}

type AltAccount struct {
	ID            string                 `json:"id"`
	GameID        string                 `json:"gameId"`
	Name          string                 `json:"name"`
	Level         int                    `json:"level"`
	PlaytimeHours int                    `json:"playtimeHours"`
	LastPlayed    string                 `json:"lastPlayed"`
	Progress      map[string]interface{} `json:"progress"`
}
