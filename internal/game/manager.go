package game

import (
	"errors"
	"log"
	"sync"
	"time"
)

// Player represents a player in the game
type Player struct {
	ID       string
	Username string
}

// Game represents a single game of tic-tac-toe
type Game struct {
	ID         string
	Board      *BitBoard
	PlayerX    *Player
	PlayerO    *Player
	CurrentTurn bool // true for X, false for O
	Status      string // "waiting", "in_progress", "completed"
	Winner      byte   // 'X', 'O', 'D' for draw, or 0 if game is in progress
	CreatedAt   time.Time
	UpdatedAt   time.Time
	mu          sync.Mutex
}

// NewGame creates a new game with the specified ID and first player
func NewGame(id string, firstPlayer *Player) *Game {
	log.Printf("Creating new game with ID: %s, Player X: %s", id, firstPlayer.Username)
	return &Game{
		ID:         id,
		Board:      NewBitBoard(),
		PlayerX:    firstPlayer,
		PlayerO:    nil,
		CurrentTurn: true, // X goes first
		Status:     "waiting",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
}

// AddSecondPlayer adds the second player to the game
func (g *Game) AddSecondPlayer(player *Player) error {
	g.mu.Lock()
	defer g.mu.Unlock()

	log.Printf("Adding second player %s to game %s", player.Username, g.ID)

	if g.Status != "waiting" {
		log.Printf("Cannot add player: game %s is not in waiting state (current: %s)", g.ID, g.Status)
		return errors.New("game is not in waiting state")
	}

	if g.PlayerO != nil {
		log.Printf("Cannot add player: game %s already has a second player", g.ID)
		return errors.New("second player already added")
	}

	g.PlayerO = player
	g.Status = "in_progress"
	g.UpdatedAt = time.Now()
	log.Printf("Player %s successfully added as Player O to game %s", player.Username, g.ID)
	return nil
}

// MakeMove makes a move for the current player
func (g *Game) MakeMove(playerID string, position int) error {
	g.mu.Lock()
	defer g.mu.Unlock()

	log.Printf("Processing move for player %s at position %d in game %s", playerID, position, g.ID)

	if g.Status != "in_progress" {
		log.Printf("Move rejected: game %s is not in progress (status: %s)", g.ID, g.Status)
		return errors.New("game is not in progress")
	}

	// Verify it's the player's turn
	isPlayerX := g.PlayerX != nil && g.PlayerX.ID == playerID
	isPlayerO := g.PlayerO != nil && g.PlayerO.ID == playerID

	if (isPlayerX && !g.CurrentTurn) || (isPlayerO && g.CurrentTurn) {
		log.Printf("Move rejected: not player's turn (player: %s, current turn: %v)", playerID, g.CurrentTurn)
		return errors.New("not your turn")
	}

	// Make the move on the board
	err := g.Board.MakeMove(position, g.CurrentTurn)
	if err != nil {
		log.Printf("Move rejected: %v", err)
		return err
	}

	log.Printf("Move accepted for player %s at position %d", playerID, position)
	g.Board.PrintBoard()

	// Check if there's a winner or draw
	g.Winner = g.Board.GetWinner()
	if g.Winner != 0 {
		g.Status = "completed"
		log.Printf("Game %s completed. Winner: %c", g.ID, g.Winner)
	}

	// Toggle turn
	g.CurrentTurn = !g.CurrentTurn
	g.UpdatedAt = time.Now()
	log.Printf("Turn switched to: %v", g.CurrentTurn)

	return nil
}

// Manager handles multiple concurrent games
type Manager struct {
	games map[string]*Game
	mu    sync.RWMutex
}

// NewManager creates a new game manager
func NewManager() *Manager {
	log.Println("Initializing game manager")
	return &Manager{
		games: make(map[string]*Game),
	}
}

// CreateGame creates a new game and returns its ID
func (m *Manager) CreateGame(id string, player *Player) *Game {
	m.mu.Lock()
	defer m.mu.Unlock()

	game := NewGame(id, player)
	m.games[id] = game
	log.Printf("Game %s created and added to game manager", id)
	return game
}

// GetGame retrieves a game by ID
func (m *Manager) GetGame(id string) (*Game, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	game, ok := m.games[id]
	if !ok {
		log.Printf("Game %s not found", id)
		return nil, errors.New("game not found")
	}
	return game, nil
}

// ListGames returns a list of all active games
func (m *Manager) ListGames() []*Game {
	m.mu.RLock()
	defer m.mu.RUnlock()

	games := make([]*Game, 0, len(m.games))
	for _, game := range m.games {
		games = append(games, game)
	}
	log.Printf("Listed %d active games", len(games))
	return games
}

// CleanupCompletedGames removes completed games older than the specified duration
func (m *Manager) CleanupCompletedGames(olderThan time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	cutoff := time.Now().Add(-olderThan)
	removedCount := 0
	
	for id, game := range m.games {
		if game.Status == "completed" && game.UpdatedAt.Before(cutoff) {
			delete(m.games, id)
			removedCount++
		}
	}
	
	log.Printf("Cleaned up %d completed games older than %v", removedCount, olderThan)
}
