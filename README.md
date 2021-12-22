# @buccaneerai/rxjs-socketio
> 🚰 Hooks for RxJS Observables to interface with Socket.io (v4) servers

## Installation
This is a private package. It requires setting up access in your npm config.

```bash
yarn add @buccaneerai/rxjs-socketio
```

## Compatability

| Platform | Support |
| :--- | :--- |
| node.js \(&gt;10.0\) | ✅ |
| Browsers | ✅ |
| React Native | ✅ |
| Electron | ✅ |

## API

### `conduit()`
Opens a two-way channel of communication with the server.  Items sent into
the operator will be sent to the server.  By default, the output stream is the messages
sent back from the server.
```js
import {from} from 'rxjs';
import {conduit} from '@buccaneerai/rxjs-socketio';

const messageIn$ = from([
  {topic: 'message', body: 'yarrr'},
  {topic: 'message', body: 'arrr matey'},
  {topic: 'message', body: 'Vitamin C? Never heard of it.'},
  {topic: 'message', body: 'Why is all the rum gone?'},
]);

const socketConfig = {
  url: 'http://localhost:9080/ws', // socket.io server
  topics: ['message'], // topics to subscribe to. (Defaults to ['message']).
  // the socket options get passed directly to the Socket.io instance, allowing
  // any customization that the socket.io client supports.
  socketOptions: {
    transports: ['websocket'],
    auth: {token: 'secretjwttoken'},
  },
}; 
// the conduit operator sends messages from messageIn$ and emits messages 
// from the server
const messageBack$ = messageIn$.pipe(conduit({...socketConfig}));
messageBack$.subscribe(console.log);
// {topic: 'message', body: 'Welcome Matey.'}
// {topic: 'message', body: 'Yo ho. Yo ho. I am a message from the server.'}
```

You can also send binary data:
```js
import {from} from 'rxjs';
import {conduit} from '@buccaneerai/rxjs-socketio';

const messageIn$ = from([
  {topic: 'next-audio-chunk', index: 0, binary: Buffer.from('foobar', 'base64')},
  {topic: 'next-audio-chunk', index: 1, binary: Buffer.from('foobar', 'base64')},
]);
const socketConfig = {
  url: 'http://localhost:9080/ws',
  topics: ['message', 'audio-received'],
};
messageIn$.pipe(conduit({...socketConfig}));
// {topic: 'audio-received', index: 0}
// {topic: 'audio-received', index: 1}
```

The library also supports some advanced features commonly needed in real applications (like sending binary, verifying receipt of messages before sending the next, customizing the socket.io client, serializers/deserializers and handling disconnections).  See the documentation for more information.

```

## Contributing, Deployments, etc.
See [CONTRIBUTING.md](https://github.com/buccaneerai/rxjs-socketio/blob/master/docs/CONTRIBUTING.md) file for information about deployments, etc.
