var exp = require('express');
var app = exp();
const client = require('http');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
const shortid = require('shortid');
var options = JSON.parse(fs.readFileSync('config.json', 'utf8'));

let rooms = {};

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

http.listen(options.application.port, () => {
    console.log('listening on *:' + options.application.port);
});

io.on('connection', socket => {
    let key = undefined;
    let isLeader = false;
    socket.on('connectToGameByLeader', msg => {
        isLeader = true;
        connectToGameByLeaderCallback(msg.id, socket).then(game => {
            rooms[game.key] = game;
            key = game.key;
            socket.emit('receiveUpdateByPlayer', {
                payload: rooms[game.key]
            });
        }, error => {
            handleError(error, socket);
        });
    });
    socket.on('sendSignalByLeader', msg => {
        if (isLeader) {
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

function connectToGameByLeaderCallback(id, socket) {
    return new Promise((resolve, reject) => {
        let gameKey = shortid.generate();
        socket.join(gameKey);
        getGameById(id).then(game => {
            game.key = gameKey;
            for (let q of game.questions) {
                q.clicked = false;
                for (let a of q.answers) {
                    a.clicked = false;
                }
            }
            resolve(game);
        }, errorMessage => {
            reject(errorMessage);
        });
        console.log('connectToGameByLeader event');
    })
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

function getGameById(id) {
    return new Promise((resolve, reject) => {
        let httpOps = {
            hostname: options.host,
            path: options.getGameByIdURL + id,
            port: options.port,
            method: 'GET'
        }
        const req = client.request(httpOps, res => {
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