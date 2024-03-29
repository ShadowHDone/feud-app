# feud-app
This module of Feud project is used for signal flow control from leader to other players, which may be browser tabs, TV-monitors, mobile devices etc.
Leader and players is related by connectivity 'one-to-many'. Details are described below.

## Specifications for Feud Websocket API:

### Specifications for player client application

Player is application, that used to connect to prepared game by key and receive state of game from server.
Sequence of actions:

1. Initialization of socket.io object:

```
var socket = io();
```

2. After you need to implement 'connect' callback. For example:

```
socket.on('connect', function (msg) {
	console.log('connect!!!');
});
```
 
3. Also you need to implement 'receiveUpdateByPlayer' callback, that contains msg as argument:

Structure of msg:

```
{
   "payload": {
      "id": 1,
      "key": 'LOLOLO',
      "description": "desc",
      "questions": [
         {
            "text": "quest",
            "answers": [
               {
                  "text": "answer",
                  "score": 10,
                  "clicked": false
               }
            ],
            "clicked": true
         }
      ]
   }
}
```

Example of implementation:

```
socket.on('receiveUpdateByPlayer', function(msg) {
    for (let q of msg.payload.questions) {
        console.log(q.text);
        for (let a of q.answers) {
            console.log(a.text);
        }
    }
});
```

4. Next step is impelementing of 'connectToGameByPlayer' emitter, that send key of game to server. Example is here:

```
socket.emit('connectToGameByPlayer', {
	key: 'LOLOLO'
});
```              
Result of this action is emitting 'receiveUpdateByPlayer' event on this client application of player.

### Specifications for leader client application

Leader is client application, that user for game control by signaling through mobile device.

Sequence of actions:

1. Initialization of socket.io object:

```
var socket = io();
```

2. After you need to implement 'connect' callback. For example:

```
socket.on('connect', function (msg) {
	console.log('connect!!!');
});
```

3. Also you need to implement 'receiveUpdateByPlayer' callback', that works same as described upper.

4. Also you need to implement 'connectToGameByLeader' emitter to connect to game by id (use can get id from feud-admin application):

```
socket.emit('connectToGameByLeader', {
	id: 1
});
```
Result is emitting of 'receiveUpdateByPlayer' event in this application.

5. Last step is imlementing of 'sendSignalByLeader' emitter, that updates state of game on server and sends broadcast request to other players and to itself.

Example of implementation of opening one answer indexed by questionIndex and answerIndex:
```
socket.emit('sendSignalByLeader', {
	key: 'LOLOLO',
	eventType: 'openAnswer',
	eventData: {
		questionIndex: 0,
		answerIndex: 0
	}
});
```

Example of implementation of opening one question indexed by questionIndex only:
```
socket.emit('sendSignalByLeader', {
	key: 'LOLOLO',
	eventType: 'openQuestion',
	eventData: {
		questionIndex: 0
	}
});
```
Result of this action is updating state of game on server and broadcast sending to all participants of game. In other words, emitting 'receiveUpdateByPlayer' event for entire room.

Both applications must have handling error messages from event 'err'. Example is described below:
```
socket.on('err', function(msg) {
   console.log(msg.errorMessage);
}
```
Structure of msg:
```
{
   "errorMessage": "message"
}
```

Sequence diagram of interaction process: https://drive.google.com/open?id=1uVTBjUkszRlBra3WKLGSEStv9IWhYimu







