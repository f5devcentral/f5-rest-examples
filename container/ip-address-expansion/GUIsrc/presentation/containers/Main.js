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
