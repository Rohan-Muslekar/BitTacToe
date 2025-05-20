/**
 * BitTacToe Game Initialization
 * This file handles the websocket integration with the main game logic
 */

// Update the existing connectWebSocket function to use our new WebSocketManager
function connectWebSocket(gameId) {
    console.log(`Setting up WebSocketManager for game ${gameId}...`);
    
    // If there's an existing connection, close it
    if (gameState.wsManager) {
        gameState.wsManager.close();
    }
    
    // Create a new WebSocketManager
    gameState.wsManager = new WebSocketManager(gameId);
    
    // Setup event handlers
    gameState.wsManager.on('open', function() {
        console.log('WebSocket connection established');
        showNotification('Connected to game server', 'success');
    });
    
    gameState.wsManager.on('message', function(data) {
        console.log('Game update received:', data);
        gameState.currentGame = data;
        renderGameState(data);
    });
    
    gameState.wsManager.on('close', function() {
        console.log('WebSocket connection closed');
    });
    
    gameState.wsManager.on('error', function(error) {
        console.error('WebSocket error:', error);
        showNotification('Connection error. Please refresh the page.', 'error');
    });
    
    gameState.wsManager.on('reconnect', function(attempt, max) {
        console.log(`Reconnect attempt ${attempt}/${max}`);
        showNotification(`Reconnecting to game server (${attempt}/${max})...`, 'warning');
    });
    
    console.log('WebSocketManager setup complete');
}

// Make this function available globally to ensure it can be used by the main game.js
window.connectWebSocketWithManager = connectWebSocket;
