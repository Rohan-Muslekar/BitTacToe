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
        elements.joinGameButton.style.display = 'inline-block';
        elements.joinGameButton.disabled = false;
    } else {
        console.log('Hiding join button');
        elements.joinGameButton.classList.add('hidden');
        elements.joinGameButton.style.display = 'none';
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