import {expect} from 'chai';
// import sinon from 'sinon';
import {marbles} from 'rxjs-marbles/mocha';

import eventToError from './eventToError';
import {CONNECT_ERROR} from '../internals/actions';

describe('eventToError', () => {
  it('should export a function', () => {
    expect(eventToError).to.be.a('function');
  });

  it('should return a stream of any errors', marbles(m => {
    const socket = {};
    const events = [
      [socket, {type: 'foo', data: {foo: 'bar'}}],
      [socket, {type: CONNECT_ERROR, error: new Error('connection error')}],
      [socket, {type: 'foo', data: {foo: 'bar'}}],
    ];
    const input$ = m.cold('-0--1(2|)', events);
    const result$ = input$.pipe(eventToError());
    const expected$ = m.cold('----0|', [new Error('connection error')]);
    m.expect(result$).toBeObservable(expected$);
  }));
});
