package api

// CreateGameRequest represents the request to create a new game
type CreateGameRequest struct {
	PlayerID   string `json:"player_id"`
	PlayerName string `json:"player_name"`
}

// CreateGameResponse represents the response after creating a game
type CreateGameResponse struct {
	GameID string `json:"game_id"`
	Status string `json:"status"`
}

// JoinGameRequest represents the request to join an existing game
type JoinGameRequest struct {
	PlayerID   string `json:"player_id"`
	PlayerName string `json:"player_name"`
}

// JoinGameResponse represents the response after joining a game
type JoinGameResponse struct {
	Status string `json:"status"`
}

// MakeMoveRequest represents the request to make a move in a game
type MakeMoveRequest struct {
	PlayerID string `json:"player_id"`
	Position int    `json:"position"`
}

// MakeMoveResponse represents the response after making a move
type MakeMoveResponse struct {
	Status      string `json:"status"`
	CurrentTurn bool   `json:"current_turn"`
	Winner      string `json:"winner,omitempty"`
}

// GameStateResponse represents the current state of a game
type GameStateResponse struct {
	ID         string      `json:"id"`
	Status     string      `json:"status"`
	Board      [3][3]byte  `json:"board"`
	PlayerX    *PlayerInfo `json:"player_x,omitempty"`
	PlayerO    *PlayerInfo `json:"player_o,omitempty"`
	CurrentTurn bool       `json:"current_turn"`
	Winner     string      `json:"winner,omitempty"`
	CreatedAt  string      `json:"created_at"`
	UpdatedAt  string      `json:"updated_at"`
}

// PlayerInfo represents information about a player
type PlayerInfo struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

// GameListResponse represents a list of games
type GameListResponse struct {
	Games []GameSummary `json:"games"`
}

// GameSummary represents a summary of a game
type GameSummary struct {
	ID        string `json:"id"`
	Status    string `json:"status"`
	PlayerX   string `json:"player_x,omitempty"`
	PlayerO   string `json:"player_o,omitempty"`
	CreatedAt string `json:"created_at"`
}
