/**
 * BitTacToe - Interactive Tic-Tac-Toe Game Client
 * A modern web client for the BitTacToe multiplayer game
 */

// Game state and player information
const gameState = {
    playerID: generateUUID(),
    playerName: '',
    currentGameID: null,
    playerSymbol: null,
    webSocket: null,
    currentGame: null,
    games: [],
    activeView: 'welcome' // 'welcome', 'lobby', 'game'
};

// DOM Elements - initialize after DOM is loaded
let elements = {};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing application...');
    
    // Initialize DOM elements
    elements = {
        // Views
        welcomeView: document.getElementById('welcome-view'),
        lobbyView: document.getElementById('lobby-view'),
        gameView: document.getElementById('game-view'),
        
        // Welcome screen
        usernameInput: document.getElementById('username-input'),
        startButton: document.getElementById('start-button'),
        
        // Lobby
        gamesContainer: document.getElementById('games-container'),
        createGameButton: document.getElementById('create-game-button'),
        refreshGamesButton: document.getElementById('refresh-games-button'),
        playerDisplay: document.getElementById('player-display'),
        playerAvatar: document.getElementById('player-avatar'),
        
        // Game
        gameBoard: document.getElementById('game-board'),
        gameIDDisplay: document.getElementById('game-id'),
        gameStatusDisplay: document.getElementById('game-status'),
        playerXName: document.getElementById('player-x-name'),
        playerOName: document.getElementById('player-o-name'),
        playerXDisplay: document.getElementById('player-x'),
        playerODisplay: document.getElementById('player-o'),
        joinGameButton: document.getElementById('join-game-button'),
        backToLobbyButton: document.getElementById('back-to-lobby-button'),
        gameCopyButton: document.getElementById('game-copy-button'),
        gameResult: document.getElementById('game-result'),
    };
    
    elements.cells = document.querySelectorAll('.cell');
    
    // Ensure we have all required elements
    const requiredElements = [
        'welcomeView', 'lobbyView', 'gameView', 'usernameInput', 'startButton',
        'gamesContainer', 'createGameButton', 'refreshGamesButton', 'playerDisplay',
        'gameBoard', 'gameIDDisplay', 'joinGameButton', 'backToLobbyButton'
    ];
    
    const missingElements = requiredElements.filter(id => !elements[id]);
    if (missingElements.length > 0) {
        console.error('Missing required DOM elements:', missingElements);
    } else {
        console.log('All required DOM elements found');
        init();
    }
});

// Event Listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Welcome screen
    elements.startButton.addEventListener('click', handleStart);
    elements.usernameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleStart();
    });
    
    // Lobby
    elements.createGameButton.addEventListener('click', handleCreateGame);
    elements.refreshGamesButton.addEventListener('click', handleRefreshGames);
    
    // Game
    console.log('Setting up game board click handler');
    elements.gameBoard.addEventListener('click', handleCellClick);
    
    console.log('Setting up join game button handler');
    elements.joinGameButton.addEventListener('click', function(e) {
        console.log('Join Game button clicked!');
        // Prevent any other handlers from being called
        e.stopImmediatePropagation();
        handleJoinGame();
    });
    
    console.log('Setting up back to lobby button handler');
    elements.backToLobbyButton.addEventListener('click', handleBackToLobby);
    
    console.log('Setting up copy game ID button handler');
    elements.gameCopyButton.addEventListener('click', handleCopyGameID);
    
    // Make sure join button is visible and styled properly
    console.log('Ensuring join button is visible');
    elements.joinGameButton.style.display = 'block';
    
    // Debug cell click events
    elements.cells.forEach((cell, index) => {
        cell.addEventListener('click', function(e) {
            console.log(`Cell ${index} clicked! Position: ${this.dataset.position}`);
        });
        
        cell.addEventListener('mouseenter', () => {
            if (!cell.classList.contains('x') && !cell.classList.contains('o') && 
                gameState.currentGameID && canMakeMove()) {
                const hoverClass = gameState.playerSymbol === 'X' ? 'hover-x' : 'hover-o';
                cell.classList.add(hoverClass);
            }
        });
        
        cell.addEventListener('mouseleave', () => {
            cell.classList.remove('hover-x', 'hover-o');
        });
    });
    
    console.log('Event listeners set up successfully!');
}

// Initialize application
function init() {
    console.log('Initializing application...');
    
    setupEventListeners();
    
    // Check for stored username
    const storedUsername = localStorage.getItem('bittactoe_username');
    if (storedUsername) {
        elements.usernameInput.value = storedUsername;
    }
    
    // Show welcome view
    showView('welcome');
    
    console.log('Application initialized successfully!');
    console.log('Player ID:', gameState.playerID);
}

// View Management
function showView(viewName) {
    console.log(`Switching to view: ${viewName}`);
    
    gameState.activeView = viewName;
    
    // Hide all views
    elements.welcomeView.classList.add('hidden');
    elements.lobbyView.classList.add('hidden');
    elements.gameView.classList.add('hidden');
    
    // Show requested view
    switch (viewName) {
        case 'welcome':
            elements.welcomeView.classList.remove('hidden');
            break;
        case 'lobby':
            elements.lobbyView.classList.remove('hidden');
            updatePlayerDisplay();
            handleRefreshGames();
            break;
        case 'game':
            elements.gameView.classList.remove('hidden');
            updateGameDisplay();
            break;
    }
}

// Utility Functions
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();
}

function showNotification(message, type = 'info') {
    console.log(`Notification (${type}): ${message}`);
    
    // Remove any existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after timeout
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function canMakeMove() {
    const gameData = gameState.currentGame;
    if (!gameData) {
        console.log('Cannot make move: no current game data');
        return false;
    }
    
    // Check if game is in progress
    if (gameData.status !== 'in_progress') {
        console.log(`Cannot make move: game status is ${gameData.status}`);
        return false;
    }
    
    // Check if it's player's turn
    const isPlayerX = gameData.player_x && gameData.player_x.id === gameState.playerID;
    const isPlayerO = gameData.player_o && gameData.player_o.id === gameState.playerID;
    
    const canMove = (gameData.current_turn && isPlayerX) || (!gameData.current_turn && isPlayerO);
    console.log(`Can make move: ${canMove} (player symbol: ${gameState.playerSymbol}, current turn: ${gameData.current_turn ? 'X' : 'O'})`);
    
    // X's turn and player is X OR O's turn and player is O
    return canMove;
}

// Event Handlers
function handleStart() {
    const username = elements.usernameInput.value.trim();
    if (!username) {
        elements.usernameInput.focus();
        showNotification('Please enter a username', 'error');
        return;
    }
    
    gameState.playerName = username;
    localStorage.setItem('bittactoe_username', username);
    
    showView('lobby');
}

function handleCreateGame() {
    console.log('Creating a new game...');
    
    // Show loading state
    elements.createGameButton.disabled = true;
    elements.createGameButton.innerHTML = '<div class="spinner"></div>';
    
    fetch('/api/games', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            player_id: gameState.playerID,
            player_name: gameState.playerName
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Game created successfully:', data);
        gameState.currentGameID = data.game_id;
        gameState.playerSymbol = 'X';
        showView('game');
        connectWebSocket(data.game_id);
        showNotification('Game created successfully', 'success');
    })
    .catch(error => {
        console.error('Error creating game:', error);
        showNotification(`Error creating game: ${error.message}`, 'error');
    })
    .finally(() => {
        // Reset button
        elements.createGameButton.disabled = false;
        elements.createGameButton.textContent = 'Create New Game';
    });
}

function handleRefreshGames() {
    console.log('Refreshing games list...');
    
    // Show loading state
    elements.gamesContainer.innerHTML = '<div class="spinner"></div>';
    
    fetch('/api/games')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(games => {
            console.log(`Found ${games.length} active games`);
            gameState.games = games;
            renderGamesList();
        })
        .catch(error => {
            console.error('Error fetching games:', error);
            elements.gamesContainer.innerHTML = '<p class="text-center">Error loading games. Please try again.</p>';
            showNotification(`Error loading games: ${error.message}`, 'error');
        });
}

// FIXED VERSION: Join Game Handler
function handleJoinGame() {
    if (!gameState.currentGameID) {
        showNotification('No game selected', 'error');
        return;
    }
    
    // Check if player is already in the game
    if (gameState.currentGame && gameState.currentGame.player_x && gameState.currentGame.player_x.id === gameState.playerID) {
        showNotification('You are already in this game as Player X', 'info');
        return;
    }
    
    if (gameState.currentGame && gameState.currentGame.player_o && gameState.currentGame.player_o.id === gameState.playerID) {
        showNotification('You are already in this game as Player O', 'info');
        return;
    }
    
    console.log(`Joining game ${gameState.currentGameID} as player ${gameState.playerName} (ID: ${gameState.playerID})...`);
    
    // Show loading state and disable button to prevent double-clicks
    const joinButton = document.getElementById('join-game-button');
    joinButton.disabled = true;
    joinButton.innerHTML = '<div class="spinner"></div>';
    
    // Log the request payload for debugging
    const payload = {
        player_id: gameState.playerID,
        player_name: gameState.playerName
    };
    console.log('Join game request payload:', payload);
    
    fetch(`/api/games/${gameState.currentGameID}/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        console.log('Join game response status:', response.status);
        
        // If the response is not OK, parse the error and throw it
        if (!response.ok) {
            return response.text().then(text => {
                try {
                    // Try to parse as JSON first
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || `Failed to join game: ${response.status}`);
                } catch (e) {
                    // If not valid JSON, use the response text directly
                    throw new Error(text || `Failed to join game: ${response.status}`);
                }
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Joined game successfully:', data);
        
        // Set the player symbol
        gameState.playerSymbol = 'O';
        
        // Notify the user
        showNotification('Joined game successfully!', 'success');
        
        // Refresh the game state
        return fetch(`/api/games/${gameState.currentGameID}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to refresh game state');
                }
                return response.json();
            });
    })
    .then(gameData => {
        if (gameData) {
            // Update the game state and UI
            gameState.currentGame = gameData;
            renderGameState(gameData);
            
            // Reconnect to WebSocket to ensure we get updates
            connectWebSocket(gameState.currentGameID);
        }
    })
    .catch(error => {
        console.error('Error joining game:', error);
        showNotification(`Error joining game: ${error.message}`, 'error');
    })
    .finally(() => {
        // Reset button state regardless of outcome
        joinButton.disabled = false;
        joinButton.textContent = 'Join Game';
    });
}

function handleCellClick(event) {
    const cell = event.target.closest('.cell');
    
    if (!cell) {
        console.log('No cell was clicked');
        return;
    }
    
    const position = parseInt(cell.dataset.position);
    console.log(`Cell clicked at position ${position}`);
    
    // Return if cell already has a value or it's not player's turn
    if (cell.classList.contains('x') || cell.classList.contains('o')) {
        console.log('Cell already has a value');
        return;
    }
    
    if (!canMakeMove()) {
        console.log('Cannot make a move right now');
        showNotification("It's not your turn or the game is not in progress", 'error');
        return;
    }
    
    console.log(`Making move at position ${position}...`);
    
    fetch(`/api/games/${gameState.currentGameID}/move`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            player_id: gameState.playerID,
            position: position
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.error || 'Failed to make move');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Move made successfully:', data);
        
        // Add a temporary visual feedback
        cell.classList.add(gameState.playerSymbol === 'X' ? 'x' : 'o');
        cell.querySelector('.content').textContent = gameState.playerSymbol;
    })
    .catch(error => {
        console.error('Error making move:', error);
        showNotification(`Error making move: ${error.message}`, 'error');
    });
}

function handleBackToLobby() {
    console.log('Returning to lobby...');
    
    // Disconnect WebSocket
    if (gameState.webSocket) {
        gameState.webSocket.close();
        gameState.webSocket = null;
    }
    
    // Reset game state
    gameState.currentGameID = null;
    gameState.playerSymbol = null;
    gameState.currentGame = null;
    
    // Clear game board
    document.querySelectorAll('.cell').forEach(cell => {
        cell.className = 'cell';
        cell.innerHTML = '<div class="content"></div>';
    });
    
    // Hide result
    elements.gameResult.classList.add('hidden');
    
    // Show lobby
    showView('lobby');
}

function handleCopyGameID() {
    if (!gameState.currentGameID) return;
    
    navigator.clipboard.writeText(gameState.currentGameID)
        .then(() => {
            showNotification('Game ID copied to clipboard', 'success');
        })
        .catch(err => {
            showNotification('Failed to copy Game ID', 'error');
        });
}

// Rendering Functions
function renderGamesList() {
    const gamesContainer = elements.gamesContainer;
    gamesContainer.innerHTML = '';
    
    if (gameState.games.length === 0) {
        gamesContainer.innerHTML = '<p class="text-center">No active games found. Create a new game to start playing!</p>';
        return;
    }
    
    gameState.games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card animate-fade-in';
        
        let statusClass = '';
        if (game.status === 'waiting') {
            statusClass = 'status-waiting';
        } else if (game.status === 'in_progress') {
            statusClass = 'status-in-progress';
        } else if (game.status === 'completed') {
            statusClass = 'status-completed';
        }
        
        gameCard.innerHTML = `
            <div class="game-card-header">
                <div class="game-card-id tooltip">
                    ${game.id.substring(0, 8)}...
                    <span class="tooltip-text">Click to join</span>
                </div>
                <div class="game-card-status ${statusClass}">
                    ${game.status.replace('_', ' ')}
                </div>
            </div>
            <div class="game-card-players">
                <div class="game-card-player">
                    <div class="game-card-player-symbol symbol-x">X</div>
                    <div class="game-card-player-name">${game.player_x || 'Waiting...'}</div>
                </div>
                <div class="game-card-player">
                    <div class="game-card-player-symbol symbol-o">O</div>
                    <div class="game-card-player-name">${game.player_o || 'Waiting...'}</div>
                </div>
            </div>
            <div class="game-card-time">
                Created: ${formatDate(game.created_at)}
            </div>
        `;
        
        gameCard.addEventListener('click', () => {
            gameState.currentGameID = game.id;
            showView('game');
            connectWebSocket(game.id);
        });
        
        gamesContainer.appendChild(gameCard);
    });
}

function updatePlayerDisplay() {
    if (!gameState.playerName) return;
    
    elements.playerDisplay.textContent = gameState.playerName;
    elements.playerAvatar.textContent = getInitials(gameState.playerName);
}

function updateGameDisplay() {
    if (!gameState.currentGameID) return;
    
    console.log(`Updating game display for game ${gameState.currentGameID}...`);
    elements.gameIDDisplay.textContent = gameState.currentGameID;
    
    // Fetch initial game state
    fetch(`/api/games/${gameState.currentGameID}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(game => {
            console.log('Retrieved game state:', game);
            gameState.currentGame = game;
            renderGameState(game);
            connectWebSocket(gameState.currentGameID);
        })
        .catch(error => {
            console.error('Error fetching game:', error);
            showNotification(`Error loading game: ${error.message}`, 'error');
            handleBackToLobby();
        });
}

function renderGameState(game) {
    console.log('Rendering game state:', game);
    
    // Update game info
    elements.gameStatusDisplay.textContent = game.status.replace('_', ' ');
    elements.gameStatusDisplay.className = `game-status ${game.status}`;
    
    // Update players
    if (game.player_x) {
        elements.playerXName.textContent = game.player_x.username;
        if (game.player_x.id === gameState.playerID) {
            gameState.playerSymbol = 'X';
            console.log('You are player X');
        }
    } else {
        elements.playerXName.textContent = 'Waiting...';
    }
    
    if (game.player_o) {
        elements.playerOName.textContent = game.player_o.username;
        if (game.player_o.id === gameState.playerID) {
            gameState.playerSymbol = 'O';
            console.log('You are player O');
        }
    } else {
        elements.playerOName.textContent = 'Waiting...';
    }
    
    // Update active player indication
    elements.playerXDisplay.classList.toggle('active', game.current_turn === true);
    elements.playerODisplay.classList.toggle('active', game.current_turn === false);
    
    // Update board
    const cells = elements.cells;
    if (game.board) {
        console.log('Updating board with state:', game.board);
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const value = game.board[row][col];
            
            cell.className = 'cell'; // Reset classes
            cell.innerHTML = '<div class="content"></div>';
            
            if (value === 'X') {
                cell.classList.add('x');
                cell.querySelector('.content').textContent = 'X';
            } else if (value === 'O') {
                cell.classList.add('o');
                cell.querySelector('.content').textContent = 'O';
            }
        });
    }
    
    // Update join button visibility
    const isPlayerInGame = (game.player_x && game.player_x.id === gameState.playerID) || 
                          (game.player_o && game.player_o.id === gameState.playerID);
    
    console.log('Join button visibility check:');
    console.log('- Game status:', game.status);
    console.log('- Player O exists:', !!game.player_o);
    console.log('- Is player in game:', isPlayerInGame);
    
    if (game.status === 'waiting' && !game.player_o && !isPlayerInGame) {
        console.log('Showing join button');
        elements.joinGameButton.classList.remove('hidden');
        elements.joinGameButton.style.display = 'block';
    } else {
        console.log('Hiding join button');
        elements.joinGameButton.classList.add('hidden');
    }
    
    // Update game result
    if (game.winner) {
        elements.gameResult.classList.remove('hidden');
        
        if (game.winner === 'X' || game.winner === 'O') {
            const winnerName = game.winner === 'X' ? game.player_x.username : game.player_o.username;
            const isCurrentPlayer = (game.winner === 'X' && gameState.playerSymbol === 'X') || 
                                   (game.winner === 'O' && gameState.playerSymbol === 'O');
            
            elements.gameResult.innerHTML = `
                <div class="result-icon ${isCurrentPlayer ? 'pulse' : ''}">${isCurrentPlayer ? '🏆' : '🎮'}</div>
                <div class="result-message">
                    ${isCurrentPlayer ? 'You won!' : `${winnerName} won!`}
                </div>
                <button class="btn btn-primary mt-2" onclick="handleBackToLobby()">Back to Lobby</button>
            `;
        } else if (game.winner === 'D') {
            elements.gameResult.innerHTML = `
                <div class="result-icon">🤝</div>
                <div class="result-message">Game ended in a draw!</div>
                <button class="btn btn-primary mt-2" onclick="handleBackToLobby()">Back to Lobby</button>
            `;
        }
        
        // Highlight winning line if there is a winner
        if (game.winner === 'X' || game.winner === 'O') {
            highlightWinningLine(game);
        }
    } else {
        elements.gameResult.classList.add('hidden');
    }
}

function highlightWinningLine(game) {
    // Define winning patterns
    const winPatterns = [
        [0, 1, 2], // Top row
        [3, 4, 5], // Middle row
        [6, 7, 8], // Bottom row
        [0, 3, 6], // Left column
        [1, 4, 7], // Middle column
        [2, 5, 8], // Right column
        [0, 4, 8], // Diagonal from top-left
        [2, 4, 6]  // Diagonal from top-right
    ];
    
    const cells = elements.cells;
    const winnerSymbol = game.winner;
    
    // Check each win pattern
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        
        // Convert from 1D to 2D indices
        const positions = [a, b, c].map(idx => {
            return {
                row: Math.floor(idx / 3),
                col: idx % 3
            };
        });
        
        // Check if this pattern is the winning one
        if (game.board[positions[0].row][positions[0].col] === winnerSymbol && 
            game.board[positions[1].row][positions[1].col] === winnerSymbol && 
            game.board[positions[2].row][positions[2].col] === winnerSymbol) {
            
            // Highlight cells
            cells[a].classList.add('win');
            cells[b].classList.add('win');
            cells[c].classList.add('win');
            
            // Add winning line
            const boardRect = elements.gameBoard.getBoundingClientRect();
            const line = document.createElement('div');
            line.className = 'win-line';
            
            // Determine line position and rotation
            if (pattern === winPatterns[0] || pattern === winPatterns[1] || pattern === winPatterns[2]) {
                // Horizontal line
                const rowIdx = Math.floor(a / 3);
                line.style.width = '100%';
                line.style.height = '10px';
                line.style.top = `calc(${(rowIdx + 0.5) * 100 / 3}% - 5px)`;
                line.style.left = '0';
            } else if (pattern === winPatterns[3] || pattern === winPatterns[4] || pattern === winPatterns[5]) {
                // Vertical line
                const colIdx = a % 3;
                line.style.width = '10px';
                line.style.height = '100%';
                line.style.top = '0';
                line.style.left = `calc(${(colIdx + 0.5) * 100 / 3}% - 5px)`;
            } else if (pattern === winPatterns[6]) {
                // Diagonal from top-left
                line.style.width = '140%';
                line.style.height = '10px';
                line.style.top = '50%';
                line.style.left = '-20%';
                line.style.transformOrigin = 'center';
                line.style.transform = 'rotate(45deg)';
            } else if (pattern === winPatterns[7]) {
                // Diagonal from top-right
                line.style.width = '140%';
                line.style.height = '10px';
                line.style.top = '50%';
                line.style.left = '-20%';
                line.style.transformOrigin = 'center';
                line.style.transform = 'rotate(-45deg)';
            }
            
            elements.gameBoard.appendChild(line);
            break;
        }
    }
}

// WebSocket Management
function connectWebSocket(gameId) {
    // Close existing connection
    if (gameState.webSocket) {
        gameState.webSocket.close();
    }
    
    // Create new WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/games/${gameId}`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}...`);
    
    try {
        gameState.webSocket = new WebSocket(wsUrl);
        
        gameState.webSocket.onopen = function() {
            console.log('WebSocket connected');
        };
        
        gameState.webSocket.onmessage = function(event) {
            console.log('WebSocket message received:', event.data);
            try {
                const game = JSON.parse(event.data);
                gameState.currentGame = game;
                renderGameState(game);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        gameState.webSocket.onclose = function(event) {
            console.log('WebSocket disconnected', event.code, event.reason);
            
            // Attempt to reconnect if this wasn't a normal closure
            if (event.code !== 1000 && event.code !== 1001) {
                console.log('Attempting to reconnect in 3 seconds...');
                setTimeout(function() {
                    if (gameState.currentGameID === gameId) {
                        connectWebSocket(gameId);
                    }
                }, 3000);
            }
        };
        
        gameState.webSocket.onerror = function(error) {
            console.error('WebSocket error:', error);
            // Don't show notification for every error since we'll try to reconnect
        };
    } catch (error) {
        console.error('Error creating WebSocket:', error);
        showNotification('Error connecting to game', 'error');
    }
}

// Make handlers globally accessible 
window.handleBackToLobby = handleBackToLobby;
window.handleJoinGame = handleJoinGame;