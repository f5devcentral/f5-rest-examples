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

import React, { Component } from 'react';
import { connect } from 'react-redux';
//import store from '../stores/configStore';
import GeneralConfiguration from './GeneralConfiguration.js'




const mapStateToProps = (state) => ({
    licensed: state.iapp.get('licensed')
});

export class App extends Component {
    render() {
        const {licensed} = this.props;
        //let licensed = store.getState().iapp.get('licensed');

        return (
            <div className="main">
                <GeneralConfiguration/>
            </div>
        );
    }
}

export default connect(mapStateToProps)(App);
