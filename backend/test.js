const http = require('http');
const server = http.createServer((req, res) => {
    res.end('Hello');
});
server.listen(3001, () => {
    console.log('Test server listening on port 3001');
});
