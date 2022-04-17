import get from 'lodash/get';
import {
  CONNECT_ERROR,
  RECONNECT_ERROR,
  SOCKET_ERROR,
  CONNECT_TIMEOUT,
  RECONNECT_FAILED
} from '../internals/actions';
import {filter,map} from 'rxjs/operators';

const errors = [
  CONNECT_ERROR,
  RECONNECT_ERROR,
  SOCKET_ERROR,
  // CONNECT_TIMEOUT,
  // RECONNECT_FAILED
];

const eventIsError = () => e => errors.includes(e.type);

const mapEventToError = () => e => {
  // if (e.type === CONNECT_TIMEOUT) return new Error('connection timeout');
  // if (e.type === RECONNECT_FAILED) return new Error('reconnection failed');
  return get(e, 'error');
};

const eventToError = () => ws$ => ws$.pipe(
  map(([,event]) => event),
  filter(eventIsError()),
  map(mapEventToError())
);

export default eventToError;
