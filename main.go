package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/Rohan-Muslekar/TicTacToe/internal/game"
	"github.com/Rohan-Muslekar/TicTacToe/internal/server"
)

func main() {
	// Configure logging
	log.SetOutput(os.Stdout)
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	
	// Print startup banner
	printBanner()
	
	log.Println("Starting BitTacToe server...")
	
	// Initialize game manager
	log.Println("Initializing game manager...")
	gameManager := game.NewManager()
	
	// Initialize and start HTTP server
	log.Println("Setting up HTTP server...")
	srv := server.NewServer(gameManager)
	
	// Configure server port
	port := getPortFromEnv("8080")
	addr := fmt.Sprintf(":%s", port)
	
	// Start the server
	log.Printf("Server listening on %s", addr)
	log.Println("Press Ctrl+C to stop the server")
	log.Fatal(http.ListenAndServe(addr, srv.Router))
}

// printBanner prints a startup banner
func printBanner() {
	banner := `
╔══════════════════════════════════════════════════╗
║                                                  ║
║   ██████╗ ██╗████████╗████████╗ █████╗  ██████╗  ║
║   ██╔══██╗██║╚══██╔══╝╚══██╔══╝██╔══██╗██╔════╝  ║
║   ██████╔╝██║   ██║      ██║   ███████║██║       ║
║   ██╔══██╗██║   ██║      ██║   ██╔══██║██║       ║
║   ██████╔╝██║   ██║      ██║   ██║  ██║╚██████╗  ║
║   ╚═════╝ ╚═╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝ ╚═════╝  ║
║                                                  ║
║           Efficient. Scalable. Fun.              ║
║                                                  ║
╚══════════════════════════════════════════════════╝
	`
	fmt.Println(banner)
	fmt.Printf("Server starting at: %s\n\n", time.Now().Format(time.RFC1123))
}

// getPortFromEnv gets the port from environment variable or uses default
func getPortFromEnv(defaultPort string) string {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}
	return port
}
