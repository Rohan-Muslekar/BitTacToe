# BitTacToe - Scalable Multiplayer Tic-Tac-Toe

BitTacToe is a scalable multiplayer tic-tac-toe game service built in Go that can handle millions of concurrent games.

## Features

- Efficient game board representation using bitwise operations
- O(1) time complexity for MakeMove() and GetWinner() operations
- RESTful API for game management
- Real-time game updates using WebSockets
- Scalable architecture for handling millions of concurrent games

## Architecture

The system is designed with the following components:

1. **Game Logic**: Core game mechanics with efficient bitwise operations
2. **Game Manager**: Manages concurrent games in memory with thread-safe operations
3. **HTTP Server**: Provides RESTful API endpoints for game interactions
4. **WebSocket Server**: Delivers real-time game updates to connected clients

## API Endpoints

- `POST /api/games` - Create a new game
- `GET /api/games/{id}` - Get game details
- `POST /api/games/{id}/join` - Join an existing game
- `POST /api/games/{id}/move` - Make a move in a game
- `GET /api/games` - List all active games
- `WS /ws/games/{id}` - WebSocket endpoint for real-time updates

## Bitwise Board Representation

The tic-tac-toe board is represented using two 16-bit integers:
- One for X's positions
- One for O's positions

This allows for efficient O(1) operations for moves and win checking.

## Running the Application

```bash
# Clone the repository
git clone https://github.com/Rohan-Muslekar/TicTacToe.git
cd TicTacToe

# Build the application
go build -o bittactoe main.go

# Run the server
./bittactoe
```

The server will start on port 8080.

## Scaling Considerations

For handling millions of concurrent games, the following scaling strategies are implemented:

1. **Efficient Memory Usage**: The bitwise board representation uses minimal memory
2. **Concurrent Operations**: Thread-safe game management with mutex locks
3. **Sharding Support**: Ready for horizontal scaling across multiple servers

## Future Enhancements

1. Add database persistence for game state
2. Implement matchmaking system
3. Add user authentication
4. Develop a distributed deployment architecture
