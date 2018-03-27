import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';
import { routerReducer as routing } from 'react-router-redux';

import iapp from './modules/f5_iapp';

export default combineReducers({
  iapp,
  form,
  routing,
});

/**
 * @typedef {Object} FSA
 * @property {String} type
 * @property {*} [Payload]
 */
