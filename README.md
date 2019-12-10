# feud-app
This module of Feud project is used for signal flow control from leader to other players, which may be browser tabs, TV-monitors, mobile devices etc.
Leader and players related by connectivity 'one-to-many'. Below described, how it works.

## Specifications for Feud Websocket API:

### Scecifications for player client application

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

````
{
   "payload": {
      "id": null,
      "key": null,
      "description": "desc",
      "questions": [
         {
            "text": "quest",
            "answers": [
               {
                  "text": "answer",
                  "score": 10
               }
            ]
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
	key: 'c21da5a9-754c-4af0-ab4c-fa6a3417088d'
});
```              
Result of this action is emitting 'receiveUpdateByPlayer' event on this client application of player.

### Scecifications for leader client application







