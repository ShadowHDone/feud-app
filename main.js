var exp = require('express');
var app = exp();
const client = require('http');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
var options = JSON.parse(fs.readFileSync('config.json', 'utf8'));

let rooms = {};

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

io.on('connection', socket => {
    let key = undefined;
    let isLeader = false;
    socket.on('connectToGameByLeader', msg => {
        key = msg.key;
        isLeader = true;
        connectToGameByLeaderCallback(msg, socket);
    });
    socket.on('sendSignalByLeader', msg => {
        if (isLeader) {
            key = msg.key;
            sendSignalByLeaderCallback(msg, socket);
        } else {
            handleError('Socket it not leader', socket);
        }
    });
    socket.on('connectToGameByPlayer', msg => {
        key = msg.key;
        connectToGameByPlayerCallback(msg, socket);
    });
    socket.on('disconnect', () => {
        disconnectCallback(key, socket, isLeader);
    });
    console.log('connection event');
});

function disconnectCallback(key, socket, isLeader) {
    if (key !== undefined) {
        socket.leave(key);
        if (isLeader === true) {
            delete rooms[key];
        }
    }
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
        handleError('Key is not defined', socket);
    }
    console.log('connectToGame event');
}

function connectToGameByLeaderCallback(msg, socket) {
    if (msg.hasOwnProperty('key')) {
        socket.join(msg.key);
        getGameByKey(msg.key).then(game => {
            for (let q of game.questions) {
                q.clicked = false;
                for (let a of q.answers) {
                    a.clicked = false;
                }
            }
            rooms[msg.key] = game;
            socket.emit('receiveUpdateByPlayer', {
                payload: rooms[msg.key]
            });
        }, errorMessage => {
            console.log(errorMessage);
            handleError(errorMessage, socket);
        });
    } else {
        console.error('Key is not defined');
        handleError('Key is not defined', socket);
    }
    console.log('connectToGameByLeader event');
}

function handleError(message, socket) {
    socket.emit('err', {
        errorMessage: message
    });
}

function sendSignalByLeaderCallback(msg, socket) {
    if (msg.hasOwnProperty('key') && msg.hasOwnProperty('eventType') && msg.hasOwnProperty('eventData')) {
        if (rooms.hasOwnProperty(msg.key)) {
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
            console.error('Key is not defined');
            handleError('Key is not defined', socket);
        }
    } else {
        console.error('Some json fields is not defined');
        handleError('Some json fields is not defined', socket);
    }
    console.log('sendSignalByLeader event');
}

function getGameByKey(key) {
    return new Promise((resolve, reject) => {
        let optionsCopy = JSON.parse(JSON.stringify(options));
        optionsCopy.path = "/api/v1/game/key/" + key;
        optionsCopy.method = "GET";
        const req = client.request(optionsCopy, res => {
            if (res.statusCode === 200) {
                res.on('data', data => {
                    try {
                        resolve(JSON.parse(String.fromCharCode.apply(String, data)).game);
                    } catch (e) {
                        reject(e);
                    }
                });
            } else {
               reject('Response status is not 200');
            }
        });
        req.on('error', error => {
            reject(error);
        });
        req.end();
    }); 
}