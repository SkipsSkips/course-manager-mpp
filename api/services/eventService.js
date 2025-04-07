// Central event service to avoid circular dependencies
const clients = new Set();

// Helper function to send an event to a client
function sendEventToClient(client, event, data) {
  client.write(`event: ${event}\n`);
  client.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Helper function to broadcast an event to all clients
function broadcastEvent(event, data) {
  clients.forEach(client => {
    sendEventToClient(client, event, data);
  });
}

// Add a client to the set
function addClient(client) {
  clients.add(client);
  return () => clients.delete(client);
}

module.exports = {
  sendEventToClient,
  broadcastEvent,
  addClient
};
