/*
  Copyright (c) 2017, F5 Networks, Inc.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  *
  http://www.apache.org/licenses/LICENSE-2.0
  *
  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
  either express or implied. See the License for the specific
  language governing permissions and limitations under the License.
*/

import { createStore, applyMiddleware, compose } from 'redux';

// Using redux-thunk for complex action handling mainly involves multiple
// async api calls and redux-promise for a simple async API call.
import ThunkMiddleware from 'redux-thunk';
import createSagaMiddleware from 'redux-saga';
import reducer from './rootReducer';
//import saga from './rootSaga';
export const sagaMiddleware = createSagaMiddleware();

/**
 * A Redux Store Factory that creates a store with necessary dependencies
 * @returns {*}
 */
export const configStore = (initialState = {}) => {
  let configureStore;

  // Store for production use. Remove any devtool related hooks
  if (process.env.NODE_ENV === 'production') {
    configureStore = createStore(
      reducer,
      initialState,
      compose(
        applyMiddleware(sagaMiddleware, ThunkMiddleware),
        // ToDo: Devtool to be deleted for production
        window.devToolsExtension ? window.devToolsExtension() : f => f
      )
    );

  // Store for development / test use. Add dev tool support.
  } else {
    configureStore = createStore(
      reducer,
      initialState,
      compose(
        applyMiddleware(sagaMiddleware, ThunkMiddleware),
        window.devToolsExtension ? window.devToolsExtension() : f => f
      )
    );
  }
  return configureStore;
};

const store = configStore();
//sagaMiddleware.run(saga, store);

export default store;
