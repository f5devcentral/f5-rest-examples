import React from 'react';
import { Route, Redirect } from 'react-router';

// Components
import Main from './containers/Main';
import GeneralConfiguration from './containers/GeneralConfiguration.js'

export default (
    <Route component={Main}>
        <div>
            <Route path="/generalConfiguration" component={GeneralConfiguration} />
        </div>
        <Redirect from="/*" to="/generalConfiguration" />
        <Redirect from="*" to="/generalConfiguration" />
    </Route>
);
