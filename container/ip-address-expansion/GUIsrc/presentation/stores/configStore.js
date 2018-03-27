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
