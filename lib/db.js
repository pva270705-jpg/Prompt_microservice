const { Pool } = require('pg');
const { setTimeout: sleep } = require('node:timers/promises');
async function postgres(url, schema) {
  const pool = new Pool({ connectionString: url });
  for (let i = 0; ; i++) { try { await pool.query('SELECT 1'); break; } catch (e) { if (i >= 20) throw e; console.log('Waiting for PostgreSQL...'); await sleep(2000); } }
  await pool.query(schema);
  return pool;
}
async function mongo(uri, mongoose, schemaFn) {
  for (let i = 0; ; i++) { try { await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 }); break; } catch (e) { if (i >= 20) throw e; console.log('Waiting for MongoDB...'); await sleep(2000); } }
  return schemaFn();
}
module.exports = { postgres, mongo };
