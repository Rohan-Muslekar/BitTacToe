function handleJoinGame() {
    if (!gameState.currentGameID) {
        showNotification('No game selected', 'error');
        return;
    }
    
    console.log(`Joining game ${gameState.currentGameID}...`);
    
    // Show loading state and disable button to prevent multiple clicks
    elements.joinGameButton.disabled = true;
    elements.joinGameButton.innerHTML = '<div class="spinner"></div>';
    
    // Log the request data for debugging
    const requestData = {
        player_id: gameState.playerID,
        player_name: gameState.playerName
    };
    console.log('Join game request data:', requestData);
    
    fetch(`/api/games/${gameState.currentGameID}/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        console.log('Join game response status:', response.status);
        
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.error || `Failed to join game: ${response.status} ${response.statusText}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Joined game successfully:', data);
        gameState.playerSymbol = 'O';
        
        // Update UI to reflect player joined
        if (elements.playerOName) {
            elements.playerOName.textContent = gameState.playerName;
        }
        
        // Hide join button after successful join
        elements.joinGameButton.classList.add('hidden');
        
        showNotification('Joined game successfully', 'success');
        
        // Force refresh game state
        fetch(`/api/games/${gameState.currentGameID}`)
            .then(response => response.json())
            .then(game => {
                gameState.currentGame = game;
                renderGameState(game);
            });
    })
    .catch(error => {
        console.error('Error joining game:', error);
        showNotification(`Error joining game: ${error.message}`, 'error');
    })
    .finally(() => {
        // Reset button
        elements.joinGameButton.disabled = false;
        elements.joinGameButton.textContent = 'Join Game';
    });
}
