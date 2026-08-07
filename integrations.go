package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"game-alt-hub/models"
)

const (
	rawgEndpoint  = "https://api.rawg.io/api/games"
	steamEndpoint = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
	steamCdn      = "https://cdn.cloudflare.steamstatic.com/steam/apps/%d/header.jpg"
	httpTimeout   = 20 * time.Second
)

var httpClient = &http.Client{Timeout: httpTimeout}

// ---------- SETTINGS ----------

// GetSettings returns all stored settings (API keys, Steam ID, ...)
func (a *App) GetSettings() (map[string]string, error) {
	rows, err := a.db.Query(`SELECT key, value FROM settings`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	settings := map[string]string{}
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			return nil, err
		}
		settings[k] = v
	}
	return settings, nil
}

// SaveSettings upserts the given settings key/value pairs
func (a *App) SaveSettings(settings map[string]string) error {
	for k, v := range settings {
		if _, err := a.db.Exec(
			`INSERT INTO settings (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
			k, v,
		); err != nil {
			return err
		}
	}
	return nil
}

func (a *App) getSetting(key string) string {
	var v string
	err := a.db.QueryRow(`SELECT value FROM settings WHERE key = ?`, key).Scan(&v)
	if err != nil {
		return ""
	}
	return v
}

// ---------- RAWG (cover art + metadata) ----------

// FetchGameArtwork searches RAWG for the best matching game metadata
func (a *App) FetchGameArtwork(title string) (models.GameDetails, error) {
	key := a.getSetting("rawg_api_key")
	if key == "" {
		return models.GameDetails{}, errors.New("RAWG API key is not configured. Add it in Settings → Integrations")
	}

	u := fmt.Sprintf("%s?key=%s&search=%s&page_size=1", rawgEndpoint, url.QueryEscape(key), url.QueryEscape(title))
	body, status, err := httpGet(u)
	if err != nil {
		return models.GameDetails{}, err
	}
	if status == http.StatusUnauthorized {
		return models.GameDetails{}, errors.New("RAWG API key is invalid or expired")
	}
	if status != http.StatusOK {
		return models.GameDetails{}, fmt.Errorf("RAWG API returned status %d", status)
	}

	var resp struct {
		Results []struct {
			ID         int     `json:"id"`
			Name       string  `json:"name"`
			Background string  `json:"background_image"`
			Metacritic *int    `json:"metacritic"`
			Rating     float64 `json:"rating"`
			Released   string  `json:"released"`
			Genres     []struct {
				Name string `json:"name"`
			} `json:"genres"`
		} `json:"results"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return models.GameDetails{}, err
	}
	if len(resp.Results) == 0 {
		return models.GameDetails{}, fmt.Errorf("no game found on RAWG for \"%s\"", title)
	}

	r := resp.Results[0]
	details := models.GameDetails{
		Title:    r.Name,
		CoverURL: r.Background,
		Rating:   r.Rating,
		Released: r.Released,
		RawgID:   r.ID,
	}
	if r.Metacritic != nil {
		details.Metacritic = *r.Metacritic
	}
	for _, g := range r.Genres {
		details.Genres = append(details.Genres, g.Name)
	}
	return details, nil
}

// ---------- STEAM (owned games + playtime) ----------

// FetchSteamLibrary returns the user's owned games with playtime
func (a *App) FetchSteamLibrary(apiKey, steamID string) ([]models.SteamGame, error) {
	if strings.TrimSpace(apiKey) == "" {
		return nil, errors.New("Steam API key is not configured. Add it in Settings → Integrations")
	}
	if strings.TrimSpace(steamID) == "" {
		return nil, errors.New("Steam ID is not configured. Add it in Settings → Integrations")
	}

	u := fmt.Sprintf("%s?key=%s&steamid=%s&include_appinfo=true&include_played_free_games=true",
		steamEndpoint, url.QueryEscape(apiKey), url.QueryEscape(steamID))
	body, status, err := httpGet(u)
	if err != nil {
		return nil, err
	}
	if status == http.StatusUnauthorized {
		return nil, errors.New("Steam API key is invalid")
	}
	if status == http.StatusInternalServerError {
		return nil, errors.New("Steam returned an error — check that your Steam ID is correct (17-digit profile ID)")
	}
	if status != http.StatusOK {
		return nil, fmt.Errorf("Steam API returned status %d", status)
	}

	var resp struct {
		Response struct {
			Games []struct {
				AppID    int    `json:"appid"`
				Name     string `json:"name"`
				Playtime int    `json:"playtime_forever"`
				IconURL  string `json:"img_icon_url"`
			} `json:"games"`
		} `json:"response"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}

	games := make([]models.SteamGame, 0, len(resp.Response.Games))
	for _, g := range resp.Response.Games {
		if strings.TrimSpace(g.Name) == "" {
			continue
		}
		games = append(games, models.SteamGame{
			AppID:         g.AppID,
			Title:         g.Name,
			PlaytimeHours: g.Playtime / 60,
			CoverURL:      fmt.Sprintf(steamCdn, g.AppID),
		})
	}
	return games, nil
}

// AddSteamGames imports the given Steam games into the library (skips existing titles)
func (a *App) AddSteamGames(games []models.SteamGame) (int, error) {
	added := 0
	for _, g := range games {
		if strings.TrimSpace(g.Title) == "" {
			continue
		}
		var exists int
		err := a.db.QueryRow(`SELECT COUNT(*) FROM games WHERE title = ?`, g.Title).Scan(&exists)
		if err != nil {
			return added, err
		}
		if exists > 0 {
			continue
		}
		if _, err := a.db.Exec(
			`INSERT INTO games (id, title, cover_art, total_playtime, steam_app_id)
             VALUES (?, ?, ?, ?, ?)`,
			generateID(), g.Title, g.CoverURL, g.PlaytimeHours, g.AppID,
		); err != nil {
			return added, err
		}
		added++
	}
	return added, nil
}

// httpGet performs a GET request and returns the response body and status code
func httpGet(u string) ([]byte, int, error) {
	req, err := http.NewRequest(http.MethodGet, u, nil)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("User-Agent", "Nexus-Game-Alt-Tracker/1.0")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, resp.StatusCode, err
	}
	if resp.StatusCode != http.StatusOK {
		log.Printf("HTTP %d from %s: %s", resp.StatusCode, u, string(body))
	}
	return body, resp.StatusCode, nil
}
