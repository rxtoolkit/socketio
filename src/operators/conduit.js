import {BehaviorSubject,merge,of,throwError} from 'rxjs';
import {
  bufferWhen,
  delayWhen,
  filter,
  map,
  mergeMap,
  pairwise,
  share,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';

// import {CONNECT} from '../internals/actions';
import io from '../creators/io';
import send from './send';
import consume from './consume';
import eventToError from '../lib/eventToError';
import {CONNECT,RECONNECT} from '../internals/actions';

const errors = {
  noUrl: new Error('conduit operator requires a {url<String>}'),
};

function createMessageBuffer(ioEvent$) {
  return messageIn$ => {
    const ioEventSub$ = ioEvent$.pipe(share());
    // close buffer whenever the socket connects
    const closeBuffer = () => ioEventSub$.pipe(
      map(([socket]) => socket && socket.connected),
      pairwise(),
      filter(([wasConnected, nowConnected]) => (!wasConnected && nowConnected)),
    );
    const bufferedMessage$ = messageIn$.pipe(
      withLatestFrom(merge(of([null, null]), ioEventSub$)),
      // buffer messages whenever the socket is closed or not available
      filter(([, [socket]]) => !socket || !socket.connected),
      map(([message]) => message),
      bufferWhen(closeBuffer),
      mergeMap(bufferedItems => of(...bufferedItems)),
    );
    return bufferedMessage$;
  };
}

function passthroughMessageBuffer(ioEvent$) {
  return messageIn$ => messageIn$.pipe(
    withLatestFrom(merge(of([null, null]), ioEvent$)),
    filter(([,[socket]]) => socket && socket.connected),
    map(([message]) => message)
  );
}

function bufferMessages(
  ioEvent$,
  _createMessageBuffer = createMessageBuffer,
  _passthroughMessageBuffer = passthroughMessageBuffer,
) {
  return messageIn$ => {
    const messageInSub$ = messageIn$.pipe(share());
    const ioEventSub$ = ioEvent$.pipe(share());
    // buffer messages when socket.io client is not ready to send them
    const bufferedMessage$ = messageInSub$.pipe(
      _createMessageBuffer(ioEventSub$)
    );
    // when messages don't need to be buffered, simply pass them through
    const unbufferedMessage$ = messageInSub$.pipe(
      _passthroughMessageBuffer(ioEventSub$)
    );
    return merge(bufferedMessage$, unbufferedMessage$);
  };
}

const conduit = function conduit({
  url,
  socketOptions = {},
  stop$ = of(),
  reconnect = null,
  // serializer = JSON.stringify,
  // deserializer = JSON.parse,
  topicsOut = ['message'],
  _bufferMessages = bufferMessages,
  _send = send,
  _consume = consume,
  _io = io,
  bufferOnDisconnect = true,
}) {
  if (!url) return () => throwError(errors.noUrl);
  return messageIn$ => {
    // create socket.io client
    const ioEvent$ = _io({url, socketOptions, stop$}).pipe(share());
    const initiallyConnected$ = new BehaviorSubject();
    const connected$ = ioEvent$.pipe(
      filter(event => event.type === CONNECT), // @XXX does this need to be [socket, event] ??
      take(1),
      tap(event => initiallyConnected$.next(event))
    );
    const reconnected$ = reconnect ? ioEvent$.pipe(
      filter(([socket, event]) => event.type === RECONNECT),
      map(event => reconnect(event))
    ) : of();
    const error$ = ioEvent$.pipe(eventToError());
    const publisher$ = merge(reconnected$, messageIn$).pipe(
        // delay initial messages until connection is established
        delayWhen(() => merge(connected$, initiallyConnected$)),
        // add message buffering/queueing logic (for disconnections)
        (bufferOnDisconnect ? _bufferMessages(ioEvent$) : tap(() => true)),
        _send({io$: ioEvent$}), // send messages to server
        filter(() => false) // there should be no output!
    );
    const consumer$ = ioEvent$.pipe(_consume()); // consume messages from client
    // subscribe to both producer and consumer
    let output$ = merge(publisher$, consumer$).pipe(takeUntil(stop$));
    output$.error$ = error$;
    return output$;
  };
};

export const testExports = {createMessageBuffer, passthroughMessageBuffer};
export default conduit;
