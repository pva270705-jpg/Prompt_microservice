const grpc = require('@grpc/grpc-js');
const loader = require('@grpc/proto-loader');
const path = require('node:path');
function load(file, pkg) { return grpc.loadPackageDefinition(loader.loadSync(path.join(__dirname, '..', 'proto', file), { keepCase: false, longs: String, enums: String, defaults: true, oneofs: true }))[pkg]; }
function serverFor(port, Service, methods) { const server = new grpc.Server(); server.addService(Service, methods); server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err) => { if (err) throw err; server.start(); console.log(`gRPC listening on ${port}`); }); }
module.exports = { grpc, load, serverFor };
