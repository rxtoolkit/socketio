const {interval,merge,of} = require('rxjs');
const {delay,map,tap} = require('rxjs/operators');
const {conduit} = require('../dist/index');

const sendMessages = function sendMessages({
  url,
  transports = ['websocket'],
  token = 'foobar',
  timeInterval = 3500
}) {
  const initialGreeting$ = of({greeting: 'Hello! Nice to meet you.'}).pipe(delay(1000));
  const checkinMessage$ = interval(timeInterval).pipe(
    map(n => ({greeting: `Hi again ${n}`}))
  );
  const io$ = merge(initialGreeting$, checkinMessage$).pipe(
    tap(m => console.log('MESSAGE_TO_CONDUIT', m)),
    conduit({url, socketOptions: {transports, auth: {token}}})
  );
  return io$;
};

console.log('starting client...');
sendMessages({url: 'http://localhost:3010'}).subscribe(
  message => console.log('message', {message}),
  err => console.log('error', err),
  () => console.log('DONE')
);
