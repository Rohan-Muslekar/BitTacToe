package game

import (
	"errors"
	"fmt"
	"log"
)

// BitBoard represents a tic-tac-toe board using bitwise operations
type BitBoard struct {
	X uint16 // Positions of X's pieces
	O uint16 // Positions of O's pieces
}

// Win patterns for a 3x3 board
const (
	ROW1  uint16 = 0b000000111 // First row
	ROW2  uint16 = 0b000111000 // Second row
	ROW3  uint16 = 0b111000000 // Third row
	COL1  uint16 = 0b001001001 // First column
	COL2  uint16 = 0b010010010 // Second column
	COL3  uint16 = 0b100100100 // Third column
	DIAG1 uint16 = 0b100010001 // Top-left to bottom-right diagonal
	DIAG2 uint16 = 0b001010100 // Top-right to bottom-left diagonal
)

// All possible winning patterns
var winPatterns = []uint16{ROW1, ROW2, ROW3, COL1, COL2, COL3, DIAG1, DIAG2}

// NewBitBoard creates a new empty tic-tac-toe board
func NewBitBoard() *BitBoard {
	return &BitBoard{
		X: 0,
		O: 0,
	}
}

// MakeMove places a piece at the specified position (0-8) for the given player
// Returns an error if the position is already occupied or invalid
// This is an O(1) operation
func (b *BitBoard) MakeMove(position int, isX bool) error {
	if position < 0 || position > 8 {
		return errors.New("invalid position: must be between 0 and 8")
	}

	// Debug the board state before making a move
	log.Printf("Current board state before move - X: %09b, O: %09b", b.X, b.O)
	log.Printf("Attempting to place %s at position %d", map[bool]string{true: "X", false: "O"}[isX], position)

	// Check if position is already occupied
	mask := uint16(1 << position)
	if (b.X|b.O)&mask != 0 {
		return fmt.Errorf("position %d already occupied", position)
	}

	// Make the move
	if isX {
		b.X |= mask
	} else {
		b.O |= mask
	}

	// Debug the board state after making a move
	log.Printf("Board state after move - X: %09b, O: %09b", b.X, b.O)

	return nil
}

// GetWinner checks if there's a winner or a draw
// Returns 'X' for X winner, 'O' for O winner, 'D' for draw, or 0 if game is still in progress
// This is an O(1) operation
func (b *BitBoard) GetWinner() byte {
	// Check if X has any winning pattern
	for _, pattern := range winPatterns {
		if b.X&pattern == pattern {
			log.Printf("X wins with pattern %09b", pattern)
			return 'X'
		}
		if b.O&pattern == pattern {
			log.Printf("O wins with pattern %09b", pattern)
			return 'O'
		}
	}

	// Check for draw - all positions filled
	if (b.X | b.O) == 0b111111111 {
		log.Println("Game ended in a draw")
		return 'D'
	}

	// Game still in progress
	return 0
}

// IsBoardFull checks if the board is completely filled
func (b *BitBoard) IsBoardFull() bool {
	return (b.X | b.O) == 0b111111111
}

// GetBoardState returns the current state of the board as a 2D array
// This is useful for displaying the board
func (b *BitBoard) GetBoardState() [3][3]byte {
	var state [3][3]byte

	for i := 0; i < 9; i++ {
		row := i / 3
		col := i % 3

		if b.X&(1<<i) != 0 {
			state[row][col] = 'X'
		} else if b.O&(1<<i) != 0 {
			state[row][col] = 'O'
		} else {
			state[row][col] = ' '
		}
	}

	return state
}

// PrintBoard prints the board state to the console for debugging
func (b *BitBoard) PrintBoard() {
	state := b.GetBoardState()
	log.Println("Current board state:")
	log.Println("-------------")
	for i := 0; i < 3; i++ {
		log.Printf("| %c | %c | %c |", state[i][0], state[i][1], state[i][2])
		log.Println("-------------")
	}
}
