package models

type Game struct {
    ID            string `json:"id"`
    Title         string `json:"title"`
    CoverArt      string `json:"coverArt"`
    TotalPlaytime int    `json:"totalPlaytime"`
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