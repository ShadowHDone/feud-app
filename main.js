var exp = require('express');
var app = exp();
const client = require('http');
var http = require('http').createServer(app);
var io = require('socket.io')(http);

let rooms = {};

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

io.on('connection', socket => {
    socket.on('connectToGameByLeader', msg => {
        connectToGameByLeaderCallback(msg, socket);
    });
    socket.on('sendSignalByLeader', msg => {
        sendSignalByLeaderCallback(msg);
    });
    socket.on('connectToGameByPlayer', msg => {
        connectToGameByPlayerCallback(msg, socket);
    });
    socket.on('disconnect', msg => {
        disconnectCallback(msg);
    });
    console.log('connection event');
});

function disconnectCallback() {
    console.log('disconnect');
}

function connectToGameByPlayerCallback(msg, socket) {
    if (msg.hasOwnProperty('key')) {
        socket.join(msg.key);
        socket.emit('receiveUpdateByPlayer', {
            payload: rooms[msg.key]
        });
    } else {
        console.error('Key is not defined');
    }
    console.log('connectToGame event');
}

function connectToGameByLeaderCallback(msg, socket) {
    if (msg.hasOwnProperty('key')) {
        socket.join(msg.key);
        callGameByKeyAndSaveToRooms(msg.key, socket);
    } else {
        console.error('Key is not defined');
    }
}

function sendSignalByLeaderCallback(msg) {
    if (msg.hasOwnProperty('key') && msg.hasOwnProperty('eventType') && msg.hasOwnProperty('eventData')) {
        if (msg.eventType === 'openQuestion' && msg.eventData.hasOwnProperty('questionIndex')) {
            rooms[msg.key].questions[msg.eventData.questionIndex].clicked = true;
        }
        if (msg.eventType === 'openAnswer' && msg.eventData.hasOwnProperty('questionIndex') && msg.eventData.hasOwnProperty('answerIndex')) {
            rooms[msg.key].questions[msg.eventData.questionIndex].answers[msg.eventData.answerIndex].clicked = true;
        }
        io.to(msg.key).emit('receiveUpdateByPlayer', {
            payload: rooms[msg.key]
        });
    } else {
        console.error('Some json fieilds is not defined');
    }
    console.log('sendSignalByLeader event');
}

function callGameByKeyAndSaveToRooms(key, socket) {
    const req = client.request({
        hostname: 'localhost',
        port: 8080,
        path: '/api/v1/game/key/' + key,
        merhod: 'GET'
    }, res => {
        res.on('data', data => {
            let game = JSON.parse(String.fromCharCode.apply(String, data)).game;
            for (let q of game.questions) {
                q.clicked = false;
                for (let a of q.answers) {
                    a.clicked = false;
                }
            }
            rooms[key] = game;
            socket.emit('receiveUpdateByPlayer', {
                payload: rooms[msg.key]
            });
        });
    });
    req.on('error', error => {
        console.error(error);
    });
    req.end();
}