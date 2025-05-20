/**
 * WebSocket Manager for BitTacToe
 * Handles real-time game state updates
 */

// Configuration
const WS_RECONNECT_DELAY = 3000; // ms
const WS_PING_INTERVAL = 30000; // ms

class WebSocketManager {
    constructor(gameId) {
        this.gameId = gameId;
        this.connection = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.pingInterval = null;
        this.callbacks = {
            onOpen: [],
            onMessage: [],
            onClose: [],
            onError: [],
            onReconnect: []
        };
        
        this.connect();
    }
    
    // Connect to the WebSocket server
    connect() {
        if (this.connection) {
            this.connection.close();
        }
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/games/${this.gameId}`;
        
        console.log(`Connecting to WebSocket at ${wsUrl}...`);
        
        this.connection = new WebSocket(wsUrl);
        
        this.connection.onopen = (event) => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Setup ping interval
            this.pingInterval = setInterval(() => this.ping(), WS_PING_INTERVAL);
            
            // Trigger callbacks
            this.callbacks.onOpen.forEach(callback => callback(event));
        };
        
        this.connection.onmessage = (event) => {
            console.log('WebSocket message received', event.data);
            try {
                const data = JSON.parse(event.data);
                // Trigger callbacks
                this.callbacks.onMessage.forEach(callback => callback(data));
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        this.connection.onclose = (event) => {
            console.log('WebSocket disconnected', event);
            this.isConnected = false;
            clearInterval(this.pingInterval);
            
            // Trigger callbacks
            this.callbacks.onClose.forEach(callback => callback(event));
            
            // Attempt to reconnect
            this.attemptReconnect();
        };
        
        this.connection.onerror = (error) => {
            console.error('WebSocket error:', error);
            
            // Trigger callbacks
            this.callbacks.onError.forEach(callback => callback(error));
        };
    }
    
    // Send a ping to keep the connection alive
    ping() {
        if (this.isConnected) {
            try {
                this.connection.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                console.log('Ping sent to server');
            } catch (error) {
                console.error('Error sending ping:', error);
                this.attemptReconnect();
            }
        }
    }
    
    // Attempt to reconnect to the WebSocket server
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
            this.callbacks.onError.forEach(callback => 
                callback(new Error('Max reconnect attempts reached'))
            );
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        // Trigger reconnect callbacks
        this.callbacks.onReconnect.forEach(callback => 
            callback(this.reconnectAttempts, this.maxReconnectAttempts)
        );
        
        // Wait before reconnecting
        setTimeout(() => {
            this.connect();
        }, WS_RECONNECT_DELAY);
    }
    
    // Add an event callback
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
        return this; // For chaining
    }
    
    // Remove an event callback
    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
        return this; // For chaining
    }
    
    // Close the connection
    close() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
            this.isConnected = false;
            clearInterval(this.pingInterval);
            console.log('WebSocket connection closed');
        }
    }
}

// Export the WebSocketManager
window.WebSocketManager = WebSocketManager;
