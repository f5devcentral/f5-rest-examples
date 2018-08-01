import 'babel-polyfill';
import './styles.css';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, hashHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import store from './stores/configStore';
import routes from './routes';
let my_helper = require('./helpers/my_helper.js');

export const history = syncHistoryWithStore(hashHistory, store);

my_helper.getToken()
    .then(()=>{
        return my_helper.GetInitialConfig();
    })
    .then((response) => {
        let serverResponse = JSON.parse(JSON.stringify(response));
        store.dispatch({ type: '@@f5/LOAD_CONFIG', payload: serverResponse});
    })
    .then(()=>{
        ReactDOM.render(
            <Provider store={store}>
                <Router history={history} routes={routes} />
            </Provider>,
            document.querySelector('#app')
        );
    })
    .catch(error =>{
        console.log("Error getting Token", error);
    });
