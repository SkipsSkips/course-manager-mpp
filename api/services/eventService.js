// Helper service for Server-Sent Events (SSE)
const clients = new Set();

/**
 * Add a client to the list of connected clients
 * @param {object} res - Express response object
 * @returns {function} Function to remove client on disconnect
 */
const addClient = (res) => {
  if (!res || typeof res.write !== 'function') {
    console.error('Invalid response object provided to addClient');
    return () => {};
  }

  // Add client to the set
  clients.add(res);
  console.log(`Client connected. Total clients: ${clients.size}`);

  // Return function to remove client
  return () => {
    if (clients.has(res)) {
      clients.delete(res);
      console.log(`Client disconnected. Total clients: ${clients.size}`);
    }
  };
};

/**
 * Send an event to a specific client
 * @param {object} res - Express response object
 * @param {string} eventName - Name of the event
 * @param {object} data - Event data
 */
const sendEventToClient = (res, eventName, data) => {
  try {
    if (!res || typeof res.write !== 'function') {
      console.error('Invalid response object provided to sendEventToClient');
      return;
    }

    // Check if client connection is still open
    if (res.socket && res.socket.writable) {
      const payload = JSON.stringify(data);
      res.write(`event: ${eventName}\n`);
      res.write(`data: ${payload}\n\n`);
      // Flush the data (important for some clients/proxies)
      if (typeof res.flush === 'function') {
        res.flush();
      }
    } else {
      // Clean up if connection is closed
      console.log('Client connection not writable, removing from clients list');
      clients.delete(res);
    }
  } catch (error) {
    console.error('Error sending event to client:', error);
    // Remove client on error
    clients.delete(res);
  }
};

/**
 * Broadcast an event to all connected clients
 * @param {string} eventName - Name of the event
 * @param {object} data - Event data
 */
const broadcastEvent = (eventName, data) => {
  const deadClients = new Set();

  clients.forEach(client => {
    try {
      // Check if client is still connected
      if (client.socket && client.socket.writable) {
        sendEventToClient(client, eventName, data);
      } else {
        // Mark for removal if not connected
        deadClients.add(client);
      }
    } catch (error) {
      console.error('Error broadcasting event to client:', error);
      // Mark for removal on error
      deadClients.add(client);
    }
  });

  // Clean up dead clients
  deadClients.forEach(client => clients.delete(client));
  if (deadClients.size > 0) {
    console.log(`Removed ${deadClients.size} dead client(s). Total clients: ${clients.size}`);
  }
};

module.exports = {
  addClient,
  sendEventToClient,
  broadcastEvent
};
