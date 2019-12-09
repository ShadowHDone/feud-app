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
    socket.on('connectToGameByLeader', msg => {
        //create game
    });
    socket.on('connectToGameByPlayer', msg => {
        if (msg.hasOwnProperty('key')) {
            socket.join(msg.key);
        } else {
            console.log('Key is not defined');
        }
        console.log('connectToGame event');
    });
    socket.on('sendSignalByLeader', msg => {
        if (msg.hasOwnProperty('key')) {
            io.to(msg.key).emit('receiveUpdateByPlayer', {
                payload: 'update is received'
            });
        } else {
            console.log('Key is not defined');
        }
        console.log('sendSignalByLeader event');
    });
    socket.on('disconnect', () => {
        console.log('disconnect');
    });
    console.log('connection');
});