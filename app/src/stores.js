import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import InitStore from './init-store';
import dispatcher from './dispatcher';
import config from './config';

const initStore = new InitStore(dispatcher);
const sculptureStore = new SculptureStore(dispatcher, config);

export {initStore, sculptureStore};
