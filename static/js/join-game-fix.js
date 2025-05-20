// Function to handle joining a game
function handleJoinGame() {
    if (!gameState.currentGameID) {
        showNotification('No game selected', 'error');
        return;
    }
    
    console.log(`Joining game ${gameState.currentGameID}...`);
    
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
            return response.json().then(errorData => {
                throw new Error(errorData.error || `Failed to join game: ${response.status}`);
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

// Make sure handleJoinGame is available globally
window.handleJoinGame = handleJoinGame;