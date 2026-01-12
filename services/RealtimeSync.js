/**
 * RealtimeSync - Service for real-time collaborative form editing
 * Handles synchronization between user and notary during video calls
 */

class RealtimeSync {
  constructor(options = {}) {
    this.isConnected = false;
    this.callbacks = {};
    this.sessionId = null;
    this.userId = null;
    this.userRole = null;
    this.lastSyncTimestamp = null;
    
    // Configuration
    this.syncInterval = options.syncInterval || 1000; // 1 second
    this.maxRetries = options.maxRetries || 5;
    this.retryDelay = options.retryDelay || 2000; // 2 seconds
    
    // Connection options
    this.useWebSocket = options.useWebSocket !== false; // Default true
    this.useFirestore = options.useFirestore || false;
    this.usePusher = options.usePusher || false;
    
    // Internal state
    this.connection = null;
    this.retryCount = 0;
    this.pendingUpdates = [];
    this.syncTimer = null;
    
    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.syncFormData = this.syncFormData.bind(this);
    this.handleIncomingUpdate = this.handleIncomingUpdate.bind(this);
  }

  /**
   * Initialize connection for real-time sync
   */
  async connect(sessionId, userId, userRole) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.userRole = userRole;

    try {
      if (this.useWebSocket) {
        await this.connectWebSocket();
      } else if (this.useFirestore) {
        await this.connectFirestore();
      } else if (this.usePusher) {
        await this.connectPusher();
      } else {
        // Fallback to polling
        this.connectPolling();
      }

      this.isConnected = true;
      this.retryCount = 0;
      this.startSyncTimer();
      
      this.emit('connected', { sessionId, userId, userRole });
      
      console.log(`RealtimeSync connected for session ${sessionId}`);
    } catch (error) {
      console.error('Failed to connect RealtimeSync:', error);
      this.scheduleRetry();
    }
  }

  /**
   * WebSocket connection implementation
   */
  async connectWebSocket() {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    const url = `${wsUrl}/workflow/${this.sessionId}?userId=${this.userId}&role=${this.userRole}`;
    
    this.connection = new WebSocket(url);
    
    return new Promise((resolve, reject) => {
      this.connection.onopen = () => {
        console.log('WebSocket connected');
        resolve();
      };

      this.connection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingUpdate(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.connection.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.scheduleRetry();
      };

      this.connection.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.connection.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Firestore connection implementation
   */
  async connectFirestore() {
    // This would require Firebase SDK setup
    // For now, we'll create a placeholder that uses polling
    console.log('Firestore connection not implemented, falling back to polling');
    this.connectPolling();
  }

  /**
   * Pusher connection implementation
   */
  async connectPusher() {
    // This would require Pusher SDK setup
    // For now, we'll create a placeholder that uses polling
    console.log('Pusher connection not implemented, falling back to polling');
    this.connectPolling();
  }

  /**
   * Polling fallback implementation
   */
  connectPolling() {
    this.connection = {
      type: 'polling',
      interval: null
    };

    // Start polling for updates
    this.connection.interval = setInterval(async () => {
      try {
        await this.pollForUpdates();
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, this.syncInterval);
  }

  /**
   * Poll server for updates (fallback method)
   */
  async pollForUpdates() {
    try {
      const response = await fetch(`/api/workflow/${this.sessionId}/sync`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.userId}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.updates && data.updates.length > 0) {
          data.updates.forEach(update => {
            if (update.timestamp > this.lastSyncTimestamp) {
              this.handleIncomingUpdate(update);
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to poll for updates:', error);
    }
  }

  /**
   * Disconnect from real-time sync
   */
  disconnect() {
    this.isConnected = false;
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (this.connection) {
      if (this.connection.type === 'polling' && this.connection.interval) {
        clearInterval(this.connection.interval);
      } else if (this.connection.close) {
        this.connection.close();
      }
      this.connection = null;
    }

    this.emit('disconnected');
    console.log('RealtimeSync disconnected');
  }

  /**
   * Sync form data to other participants
   */
  async syncFormData(formData, fieldId = null) {
    if (!this.isConnected || !this.sessionId) {
      // Queue update for when connection is restored
      this.pendingUpdates.push({
        type: 'form_update',
        formData,
        fieldId,
        timestamp: Date.now(),
        userId: this.userId,
        userRole: this.userRole
      });
      return;
    }

    const update = {
      type: 'form_update',
      sessionId: this.sessionId,
      formData,
      fieldId,
      timestamp: Date.now(),
      userId: this.userId,
      userRole: this.userRole
    };

    try {
      if (this.useWebSocket && this.connection.readyState === WebSocket.OPEN) {
        this.connection.send(JSON.stringify(update));
      } else {
        // Send via HTTP API
        await fetch(`/api/workflow/${this.sessionId}/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.userId}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(update)
        });
      }

      this.lastSyncTimestamp = update.timestamp;
    } catch (error) {
      console.error('Failed to sync form data:', error);
      // Add to pending updates for retry
      this.pendingUpdates.push(update);
    }
  }

  /**
   * Sync signature data
   */
  async syncSignature(fieldId, signature, signedBy) {
    if (!this.isConnected || !this.sessionId) return;

    const update = {
      type: 'signature_update',
      sessionId: this.sessionId,
      fieldId,
      signature,
      signedBy,
      timestamp: Date.now(),
      userId: this.userId,
      userRole: this.userRole
    };

    try {
      if (this.useWebSocket && this.connection.readyState === WebSocket.OPEN) {
        this.connection.send(JSON.stringify(update));
      } else {
        await fetch(`/api/workflow/${this.sessionId}/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.userId}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(update)
        });
      }
    } catch (error) {
      console.error('Failed to sync signature:', error);
    }
  }

  /**
   * Sync workflow status changes
   */
  async syncWorkflowStatus(status, step) {
    if (!this.isConnected || !this.sessionId) return;

    const update = {
      type: 'workflow_status',
      sessionId: this.sessionId,
      status,
      step,
      timestamp: Date.now(),
      userId: this.userId,
      userRole: this.userRole
    };

    try {
      if (this.useWebSocket && this.connection.readyState === WebSocket.OPEN) {
        this.connection.send(JSON.stringify(update));
      } else {
        await fetch(`/api/workflow/${this.sessionId}/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.userId}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(update)
        });
      }
    } catch (error) {
      console.error('Failed to sync workflow status:', error);
    }
  }

  /**
   * Handle incoming updates from other participants
   */
  handleIncomingUpdate(data) {
    // Don't process updates from ourselves
    if (data.userId === this.userId) return;

    // Update last sync timestamp
    if (data.timestamp > this.lastSyncTimestamp) {
      this.lastSyncTimestamp = data.timestamp;
    }

    // Emit specific events based on update type
    switch (data.type) {
      case 'form_update':
        this.emit('formUpdate', {
          formData: data.formData,
          fieldId: data.fieldId,
          userId: data.userId,
          userRole: data.userRole,
          timestamp: data.timestamp
        });
        break;

      case 'signature_update':
        this.emit('signatureUpdate', {
          fieldId: data.fieldId,
          signature: data.signature,
          signedBy: data.signedBy,
          userId: data.userId,
          userRole: data.userRole,
          timestamp: data.timestamp
        });
        break;

      case 'workflow_status':
        this.emit('workflowStatusUpdate', {
          status: data.status,
          step: data.step,
          userId: data.userId,
          userRole: data.userRole,
          timestamp: data.timestamp
        });
        break;

      case 'user_joined':
        this.emit('userJoined', {
          userId: data.userId,
          userRole: data.userRole,
          timestamp: data.timestamp
        });
        break;

      case 'user_left':
        this.emit('userLeft', {
          userId: data.userId,
          userRole: data.userRole,
          timestamp: data.timestamp
        });
        break;

      default:
        console.warn('Unknown update type:', data.type);
    }

    // Emit general update event
    this.emit('update', data);
  }

  /**
   * Process pending updates when connection is restored
   */
  async processPendingUpdates() {
    if (!this.isConnected || this.pendingUpdates.length === 0) return;

    const updates = [...this.pendingUpdates];
    this.pendingUpdates = [];

    for (const update of updates) {
      try {
        if (update.type === 'form_update') {
          await this.syncFormData(update.formData, update.fieldId);
        }
        // Add other update types as needed
      } catch (error) {
        console.error('Failed to process pending update:', error);
        // Re-add to pending if it failed
        this.pendingUpdates.push(update);
      }
    }
  }

  /**
   * Start periodic sync timer
   */
  startSyncTimer() {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(() => {
      if (this.isConnected) {
        this.processPendingUpdates();
      }
    }, this.syncInterval);
  }

  /**
   * Schedule connection retry
   */
  scheduleRetry() {
    if (this.retryCount >= this.maxRetries) {
      console.error('Max retry attempts reached, giving up');
      this.emit('maxRetriesReached');
      return;
    }

    this.retryCount++;
    console.log(`Scheduling retry ${this.retryCount}/${this.maxRetries} in ${this.retryDelay}ms`);

    setTimeout(() => {
      if (!this.isConnected && this.sessionId) {
        console.log(`Retrying connection (attempt ${this.retryCount})`);
        this.connect(this.sessionId, this.userId, this.userRole);
      }
    }, this.retryDelay);
  }

  /**
   * Event system for callbacks
   */
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  off(event, callback) {
    if (!this.callbacks[event]) return;
    this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.callbacks[event]) return;
    this.callbacks[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event callback for ${event}:`, error);
      }
    });
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      sessionId: this.sessionId,
      userId: this.userId,
      userRole: this.userRole,
      retryCount: this.retryCount,
      pendingUpdates: this.pendingUpdates.length,
      lastSyncTimestamp: this.lastSyncTimestamp
    };
  }
}

// Singleton instance
let realtimeSyncInstance = null;

export const getRealtimeSync = (options) => {
  if (!realtimeSyncInstance) {
    realtimeSyncInstance = new RealtimeSync(options);
  }
  return realtimeSyncInstance;
};

export default RealtimeSync;
