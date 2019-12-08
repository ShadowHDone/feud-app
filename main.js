var exp = require('express');
var app = exp();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

io.on('connection', socket => {
    console.log('lol');
    socket.on('disconnect', () => {
        console.log('dis');
    });
})