package server

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/Rohan-Muslekar/TicTacToe/internal/game"
	gamemodule "github.com/Rohan-Muslekar/TicTacToe/internal/game"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// Server represents the HTTP server for the Tic-Tac-Toe game
type Server struct {
	Router      *mux.Router
	GameManager *game.Manager
	clients     map[*websocket.Conn]string // map of websocket connections to game IDs
	upgrader    websocket.Upgrader         // WebSocket upgrader with configured settings
}

// NewServer creates a new HTTP server
func NewServer(gameManager *game.Manager) *Server {
	s := &Server{
		Router:      mux.NewRouter(),
		GameManager: gameManager,
		clients:     make(map[*websocket.Conn]string),
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all connections in development
			},
		},
	}

	// Set up routes
	s.Router.HandleFunc("/api/games", s.createGameHandler).Methods("POST")
	s.Router.HandleFunc("/api/games", s.listGamesHandler).Methods("GET")
	s.Router.HandleFunc("/api/games/{id}", s.getGameHandler).Methods("GET")
	s.Router.HandleFunc("/api/games/{id}/join", s.joinGameHandler).Methods("POST")
	s.Router.HandleFunc("/api/games/{id}/move", s.makeMovesHandler).Methods("POST")

	// Set up websocket handler
	s.Router.HandleFunc("/ws/games/{id}", s.websocketHandler)

	// Serve static files
	s.Router.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("static"))))

	return s
}

// joinGameHandler allows a second player to join a game
func (s *Server) joinGameHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	log.Printf("Join game request received for game ID: %s", gameID)

	// Parse the JSON directly without consuming the body first
	var req struct {
		PlayerID   string `json:"player_id"`
		PlayerName string `json:"player_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error parsing JSON: %v", err)
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	log.Printf("Parsed join request - Player ID: %s, Name: %s", req.PlayerID, req.PlayerName)

	if req.PlayerID == "" || req.PlayerName == "" {
		log.Printf("Missing player information in join request")
		http.Error(w, "Missing player ID or name", http.StatusBadRequest)
		return
	}

	game, err := s.GameManager.GetGame(gameID)
	if err != nil {
		log.Printf("Game not found: %s", gameID)
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	// Check if player is already in the game
	if (game.PlayerX != nil && game.PlayerX.ID == req.PlayerID) ||
		(game.PlayerO != nil && game.PlayerO.ID == req.PlayerID) {
		log.Printf("Player %s is already in the game", req.PlayerName)
		http.Error(w, "You are already in this game", http.StatusBadRequest)
		return
	}

	// Join game
	if err := game.AddSecondPlayer(&gamemodule.Player{
		ID:       req.PlayerID,
		Username: req.PlayerName,
	}); err != nil {
		log.Printf("Error joining game: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("Player %s joined game %s successfully", req.PlayerName, gameID)

	// Notify clients
	s.broadcastGameUpdate(game)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "joined",
	})
}

// createGameHandler creates a new game
func (s *Server) createGameHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PlayerID   string `json:"player_id"`
		PlayerName string `json:"player_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	if req.PlayerID == "" || req.PlayerName == "" {
		http.Error(w, "Missing player ID or name", http.StatusBadRequest)
		return
	}

	gameID := uuid.New().String()

	// Create game with first player
	s.GameManager.CreateGame(gameID, &gamemodule.Player{
		ID:       req.PlayerID,
		Username: req.PlayerName,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"game_id": gameID,
	})
}

// listGamesHandler returns a list of active games
func (s *Server) listGamesHandler(w http.ResponseWriter, r *http.Request) {
	games := s.GameManager.ListGames()

	// Convert to simple format for frontend
	gamesList := make([]map[string]interface{}, 0, len(games))
	for _, g := range games {
		gameData := map[string]interface{}{
			"id":         g.ID,
			"status":     g.Status,
			"created_at": g.CreatedAt.Format(time.RFC3339),
		}

		if g.PlayerX != nil {
			gameData["player_x"] = g.PlayerX.Username
		}

		if g.PlayerO != nil {
			gameData["player_o"] = g.PlayerO.Username
		}

		gamesList = append(gamesList, gameData)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(gamesList)
}

// getGameHandler returns details for a specific game
func (s *Server) getGameHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	game, err := s.GameManager.GetGame(gameID)
	if err != nil {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	// Convert to frontend-friendly format
	boardState := game.Board.GetBoardState()
	boardArray := make([][]string, 3)
	for i := 0; i < 3; i++ {
		boardArray[i] = make([]string, 3)
		for j := 0; j < 3; j++ {
			boardArray[i][j] = string(boardState[i][j])
		}
	}

	gameData := map[string]interface{}{
		"id":           game.ID,
		"status":       game.Status,
		"current_turn": game.CurrentTurn,
		"board":        boardArray,
		"created_at":   game.CreatedAt.Format(time.RFC3339),
		"winner":       string(game.Winner),
	}

	if game.PlayerX != nil {
		gameData["player_x"] = map[string]string{
			"id":       game.PlayerX.ID,
			"username": game.PlayerX.Username,
		}
	}

	if game.PlayerO != nil {
		gameData["player_o"] = map[string]string{
			"id":       game.PlayerO.ID,
			"username": game.PlayerO.Username,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(gameData)
}

// makeMovesHandler processes a game move
func (s *Server) makeMovesHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	var req struct {
		PlayerID string `json:"player_id"`
		Position int    `json:"position"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	game, err := s.GameManager.GetGame(gameID)
	if err != nil {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	if err := game.MakeMove(req.PlayerID, req.Position); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Broadcast the updated game state to all clients
	s.broadcastGameUpdate(game)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
	})
}

// websocketHandler handles websocket connections for real-time game updates
func (s *Server) websocketHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	// Upgrade the HTTP connection to a WebSocket connection
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading connection to WebSocket: %v", err)
		return
	}

	// Add this client to our clients map
	s.clients[conn] = gameID
	log.Printf("New WebSocket connection established for game %s", gameID)

	// Ensure the connection is closed when this function returns
	defer func() {
		conn.Close()
		delete(s.clients, conn)
		log.Printf("WebSocket connection closed for game %s", gameID)
	}()

	// Send initial game state
	game, err := s.GameManager.GetGame(gameID)
	if err == nil {
		if err := s.sendGameUpdate(conn, game); err != nil {
			log.Printf("Error sending initial game state: %v", err)
			return
		}
	}

	// Keep the connection alive and handle incoming messages
	for {
		messageType, _, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Error reading WebSocket message: %v", err)
			break
		}

		// Echo the message back (just for connection health check)
		if messageType == websocket.PingMessage {
			if err := conn.WriteMessage(websocket.PongMessage, []byte{}); err != nil {
				log.Printf("Error sending pong: %v", err)
				break
			}
		}
	}
}

// broadcastGameUpdate sends the current game state to all connected clients for that game
func (s *Server) broadcastGameUpdate(game *game.Game) {
	for client, gameID := range s.clients {
		if gameID == game.ID {
			if err := s.sendGameUpdate(client, game); err != nil {
				log.Printf("Error broadcasting game update: %v", err)
				client.Close()
				delete(s.clients, client)
			}
		}
	}
}

// sendGameUpdate sends the current game state to a specific client
func (s *Server) sendGameUpdate(conn *websocket.Conn, game *game.Game) error {
	// Convert board state to array for frontend
	boardState := game.Board.GetBoardState()
	boardArray := make([][]string, 3)
	for i := 0; i < 3; i++ {
		boardArray[i] = make([]string, 3)
		for j := 0; j < 3; j++ {
			boardArray[i][j] = string(boardState[i][j])
		}
	}

	// Convert to frontend-friendly format
	gameData := map[string]interface{}{
		"id":           game.ID,
		"status":       game.Status,
		"current_turn": game.CurrentTurn,
		"board":        boardArray,
		"created_at":   game.CreatedAt.Format(time.RFC3339),
		"winner":       string(game.Winner),
	}

	if game.PlayerX != nil {
		gameData["player_x"] = map[string]string{
			"id":       game.PlayerX.ID,
			"username": game.PlayerX.Username,
		}
	}

	if game.PlayerO != nil {
		gameData["player_o"] = map[string]string{
			"id":       game.PlayerO.ID,
			"username": game.PlayerO.Username,
		}
	}

	return conn.WriteJSON(gameData)
}

