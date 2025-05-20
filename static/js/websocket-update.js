// Update the connectWebSocket function in game.js

// WebSocket Management
function connectWebSocket(gameId) {
    // Close existing connection
    if (gameState.webSocket) {
        gameState.webSocket.close();
        gameState.webSocket = null;
    }
    
    // Use the new WebSocketManager if available
    if (window.WebSocketManager) {
        if (gameState.wsManager) {
            gameState.wsManager.close();
        }
        
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
        return;
    }
    
    // Fallback to regular WebSocket if WebSocketManager is not available
    console.log("WebSocketManager not available, using regular WebSocket");
    
    // Create new WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/games/${gameId}`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}...`);
    
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
    
    gameState.webSocket.onclose = function() {
        console.log('WebSocket disconnected');
    };
    
    gameState.webSocket.onerror = function(error) {
        console.error('WebSocket error:', error);
        showNotification('Connection error', 'error');
    };
}
