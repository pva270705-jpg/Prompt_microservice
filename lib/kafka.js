const { Kafka } = require('kafkajs');
function kafkaFor(clientId) { return new Kafka({ clientId, brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','), retry: { initialRetryTime: 500, retries: 20 } }); }
async function connectWithRetry(client) { for (let i = 0; ; i++) { try { await client.connect(); return; } catch (e) { if (i >= 30) throw e; console.log('Waiting for Kafka...'); await new Promise(r => setTimeout(r, 2000)); } } }
module.exports = { kafkaFor, connectWithRetry };
