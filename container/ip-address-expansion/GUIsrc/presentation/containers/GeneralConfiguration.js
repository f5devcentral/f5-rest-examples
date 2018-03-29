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
import { Button } from 'react-bootstrap';
let my_helper = require('../helpers/my_helper.js');
import Modal from 'react-modal';

const addDevice = {
    content : {
        top                   : '50%',
        left                  : '35%',
        right                 : 'auto',
        bottom                : 'auto',
        marginRight           : '-50%',
        transform             : 'translate(-50%, -50%)',
        width                 : '80em'
    }
};
const progress = {
    content : {
        top                   : '25%',
        left                  : '28%',
        right                 : '10em',
        marginRight           : '-50%',
        transform             : 'translate(-50%, -50%)',
        width                 : '10em',
        bottom                : 'auto',
        paddingLeft           : '15px',
        border                : 'none',
        background            : 'transparent'
    }
};

const mapStateToProps = (state) => ({
    generalConfig: state.iapp.get('generalConfig').toJS(),
    saveStatus: state.iapp.get('saveStatus'),
    loadStatus: state.iapp.get('loadStatus'),
    clientId: state.iapp.get('clientId')
});

const dispatch_updateApplication = generalConfig => ({ type: '@@f5/LOAD_CONFIG', payload: generalConfig });

const mapDispatchToProp = {
    dispatch_updateApplication
};

export class GeneralConfigurationTab extends Component {

    constructor(props) {
        super(props);
        this.state = {
            progressModal: false
        };
        /*this.checkIP = this.checkIP.bind(this);
        this.checkPort = this.checkPort.bind(this);*/
    }

    renderBigIp(device, index){
        let deviceChecked = false;
        if (device.hasOwnProperty("checked")){
            deviceChecked = device.checked;
        }

        let trustedDevice = "hidden";
        if (device.hasOwnProperty("trustGroup")){
            trustedDevice = 'visible';
        }

        return (
            <tr key={"device_"+index}>
                <td>
                    <input style={{marginLeft:'0.35em', paddingLeft: '0.5em'}} type='checkbox' checked={deviceChecked} onChange={ev => this.checkRow(index, ev.target)}/>
                </td>
                <td style={{textAlign:'center'}}>
                    <span style={{display: 'inline', color: 'green', visibility:trustedDevice}} className='glyphicon glyphicon-lock'/>
                    <input type='text' className='form-control' style={{display: 'inline', width: '9.5em', paddingLeft: '0.5em'}} value={device.name}/>
                </td>
                <td style={{textAlign:'center'}}>
                    <input type='text' className='form-control' style={{display: 'inline', width: '7.5em', paddingLeft: '0.5em'}} value={device.mgmtIp}/>
                </td>
                <td style={{textAlign:'center'}}>
                    <input type='text' className='form-control' style={{display: 'inline', width: '4em', paddingLeft: '0.5em'}} value={device.mgmtPort}/>
                </td>
                <td style={{textAlign:'center'}}>
                    <input type='text' className='form-control' style={{display: 'inline', width: '7.5em', paddingLeft: '0.5em'}} defaultValue={device.virtualIp} onBlur={ev => this.updateVirtualIp(ev.target, index)}/>
                </td>
                <td style={{textAlign:'center'}}>
                    <input type='text' className='form-control' style={{display: 'inline', width: '4em', paddingLeft: '0.5em'}} defaultValue={device.virtualPort} onBlur={ev => this.updateVirtualPort(ev.target, index)}/>
                </td>
            </tr>
        );
    }

    checkRow(index, element){
        const {generalConfig, dispatch_updateApplication} = this.props;
        generalConfig.devices[index].checked = element.checked;
        dispatch_updateApplication(generalConfig);
    }

    updateVirtualPort(element, index){
        const {generalConfig, dispatch_updateApplication} = this.props;
        let device = generalConfig.devices[index];
        if (device.virtualPort !== element.value) {
            if (GeneralConfigurationTab.checkPort(element.value)) {
                if ((device.virtualIp !== "")&&(device.virtualIp !== undefined)) {
                    this.showProgress();
                    my_helper.updateDevice(device.name, device.virtualIp, element.value);
                    this.hideProgress();
                }
                device.virtualPort = element.value;
                dispatch_updateApplication(generalConfig);
            } else {
                bootbox.alert("Virtual Port you entered is not valid.");
                element.style.borderColor = "red";
                if (device.virtualPort !== undefined) {
                    element.value = device.virtualPort;
                } else {
                    element.value = "";
                }
                setTimeout(() => {
                    element.style.borderColor = "rgb(204, 204, 204)";
                    reject("Virtual Port you entered is not valid.");
                }, 3000);
            }
        }
    }

    updateVirtualIp(element, index){
        const {generalConfig, dispatch_updateApplication} = this.props;
        let device = generalConfig.devices[index];
        if (device.virtualIp !== element.value) {
            if (GeneralConfigurationTab.checkIP(element.value)) {
                if ((device.virtualPort !== "")&&(device.virtualPort !== undefined)) {
                    this.showProgress();
                    my_helper.updateDevice(device.name, element.value, device.virtualPort);
                    this.hideProgress();
                }
                device.virtualIp = element.value;
                dispatch_updateApplication(generalConfig);
            } else {
                bootbox.alert("Virtual IP you entered is not valid. Please correct it");
                element.style.borderColor = "red";
                if (device.virtualIp !== undefined) {
                    element.value = device.virtualIp;
                } else {
                    element.value = "";
                }
                setTimeout(() => {
                    element.style.borderColor = "rgb(204, 204, 204)";
                }, 3000);
                element.style.borderColor = "red";
            }
        }
    }

    static checkIP(ip){
        let ipRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(%\d+)*$/;
        return !!ip.match(ipRegex);
    }

    static checkPort(port){
        let portRegex = /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;
        return !!port.match(portRegex);
    }

    Add(){
        const {generalConfig, dispatch_updateApplication} = this.props;
        const name = document.getElementById("newBigIPName").value;
        const mgmtIp = document.getElementById("newBigIP").value;
        const mgmtPort = document.getElementById("newBigIPPort").value;
        const username = document.getElementById("newBigIPusername").value;
        const password = document.getElementById("newBigIPpassword").value;
        if (name !== "") {
            if (GeneralConfigurationTab.checkIP(mgmtIp)) {
                if ((username !== "") && (password !== "")) {
                    if (GeneralConfigurationTab.checkPort(mgmtPort)) {
                        this.showProgress();
                        my_helper.addDevice(name, mgmtIp, mgmtPort, username, password)
                            .then(() => {
                                this.setState({
                                    open: false
                                });
                                generalConfig.devices.push({name: name, mgmtIp: mgmtIp, mgmtPort: mgmtPort});
                                dispatch_updateApplication(generalConfig);
                                this.hideProgress();
                            })
                            .catch((err) => {
                                this.hideProgress();
                                this.setState({
                                    open: false
                                });
                                bootbox.alert("Failed to connect to " + mgmtIp + ". Error: " + err);
                            });
                    } else {
                        bootbox.alert("Management Port is invalid");
                    }
                } else {
                    bootbox.alert("Username and password can not be empty");
                }
            } else {
                bootbox.alert("Management IP has incorrect format");
            }
        } else {
            bootbox.alert("BigIP name can not be empty");
        }
    }

    Delete(){
        const { generalConfig } = this.props;
        generalConfig.devices.map((device, index) => {
            if (device.hasOwnProperty("checked")) {
                if (device.checked === true) {
                    this.deleteDevice(index, this);
                }
            }
        });
    }

    deleteDevice(index, that){
        const {dispatch_updateApplication, generalConfig } = this.props;
        bootbox.confirm("Please confirm deletion of Device " + generalConfig.devices[index].name, function (result) {
            if (result) { //pressed OK
                that.showProgress();
                my_helper.deleteDevice(generalConfig.devices[index].name)
                    .then(() => {
                        generalConfig.devices.splice(index, 1);
                        dispatch_updateApplication(generalConfig);
                        that.hideProgress();
                    })
                    .catch(err => {
                        that.hideProgress();
                        console.log("Failed to delete device" + generalConfig.devices[index].name, err);
                    });
            }
        });
    }

    showPortal(){
        this.setState({
            open: true
        });
    }

    hideAddDevice(){
        this.setState({
            open: false
        });
    }

    showProgress(){
        this.setState({
            progressModal: true
        });
    }

    hideProgress(){
        let that = this;
        setTimeout(function () {
            that.setState({
                progressModal: false
            });
        }, 500);
    }

    updatePool(element, type){
        const {dispatch_updateApplication, generalConfig } = this.props;
        if ((generalConfig.config[type] !== element.value) && (element.value !== "")) {
            if (type === "poolPort"){
                if (!GeneralConfigurationTab.checkPort(element.value)) {
                    bootbox.alert("Pool Port you entered is not valid.");
                    element.style.borderColor = "red";
                    element.value = generalConfig.config[type];
                    setTimeout(() => {
                        element.style.borderColor = "rgb(204, 204, 204)";
                    }, 3000);
                    return;
                }
            }
            if ((type === "poolStart")||(type === "poolEnd")){
                if (!GeneralConfigurationTab.checkIP(element.value)) {
                    bootbox.alert("IP address you entered is not valid.");
                    element.style.borderColor = "red";
                    element.value = generalConfig.config[type];
                    setTimeout(() => {
                        element.style.borderColor = "rgb(204, 204, 204)";
                    }, 3000);
                    return;
                }
            }
            this.showProgress();
            my_helper.updatePool(element.value, type)
                .then(() => {
                    generalConfig.config[type] = element.value;
                    dispatch_updateApplication(generalConfig);
                    this.hideProgress();
                })
                .catch(err => {
                    console.log("Failed to update Pool Start IP", err);
                });
        } else {
            if (element.value === "") {
                bootbox.alert("This field can not be empty.");
                element.style.borderColor = "red";
                element.value = generalConfig.config[type];
                setTimeout(() => {
                    element.style.borderColor = "rgb(204, 204, 204)";
                }, 3000);
            }
        }
    }

    render() {
        const {generalConfig, saveStatus} = this.props;
        let configurationIssuesList;
        const addButton1 = (<button style={{marginLeft: '0.5em'}} className="btn btn-default" onClick={()=>{this.showPortal()}}>Add</button>);
        let configurationIssuesListClass = "messagesUL";

        if (saveStatus){
            configurationIssuesListClass = "messagesUL saveConfirmation";
            configurationIssuesList = "Configuration was saved successfully";
        }

        let devices;
        if (!generalConfig.hasOwnProperty("devices")) {
            devices = [];
        } else {
            devices = generalConfig.devices;
        }

        let config = {};
        if (generalConfig.hasOwnProperty("config")) {
            config = generalConfig.config;
        } else {
            return(
                <div/>
            );
        }
        return (
            <div id="generalConfigurationTab" style={{marginLeft: "5em"}}>
                <div>
                    <ul id="configurationIssuesList" className={configurationIssuesListClass}>
                        {configurationIssuesList}
                    </ul>
                </div>

                <Modal
                    closeOnEsc
                    contentLabel="Add BigIP"
                    isOpen={this.state.open}
                    style={addDevice}
                    //openByClickOn={addButton1}
                >
                    <div>
                        <div>
                            <label>Name</label>
                            <input id="newBigIPName" type='text' className='form-control' style={{display: 'inline', width: '7.5em', paddingLeft: '0.5em', marginLeft:'0.5em'}}/>
                            <label style={{marginLeft:'1.5em'}}>Management IP</label>
                            <input id="newBigIP" type='text' className='form-control' style={{display: 'inline', width: '7.5em', paddingLeft: '0.5em', marginLeft:'0.5em'}}/>
                            <label style={{marginLeft:'1.5em'}}>Management Port</label>
                            <input id="newBigIPPort" type='text' className='form-control' style={{display: 'inline', width: '4em', paddingLeft: '0.5em', marginLeft:'0.5em'}} defaultValue='443'/>
                            <label style={{marginLeft:'1.5em'}}>Username</label>
                            <input id="newBigIPusername" type='password' className='form-control' style={{display: 'inline', width: '9.5em', paddingLeft: '0.5em', marginLeft:'0.5em'}}/>
                            <label style={{marginLeft:'1.5em'}}>Password</label>
                            <input id="newBigIPpassword" type='password' className='form-control' style={{display: 'inline', width: '9.5em', paddingLeft: '0.5em', marginLeft:'0.5em'}}/>
                        </div>
                        <div style={{marginTop: '1em', marginLeft: '37%'}}>
                            <Button style={{display: 'inline'}} onClick={()=>this.hideAddDevice()}>Cancel</Button>
                            <Button style={{display: 'inline', marginLeft:'5em'}} onClick={()=>this.Add()}>Add</Button>
                        </div>

                    </div>
                </Modal>

                <Modal
                    isOpen={this.state.progressModal}
                    style={progress}
                    contentLabel="Save Progress"
                >
                    <div id="saveProgress" title="Save Progress">
                        <img src="/iapps/ipAddressExpansion/assets/semantic/loading.gif" height="90" width="90"/>
                    </div>
                </Modal>

                <div className="divBorder" style={{paddingTop:'0.7em'}}>
                    <label style={{marginLeft:'42em', verticalAlign:'top'}}>Shared Data</label>
                    <div style={{marginLeft:'3em'}}>
                        <div className="App">
                            <label style={{display:'inline'}}>Pool Name</label>
                            <input className='form-control' style={{display:'inline', marginLeft:'7em', width: '9.5em', paddingLeft: '0.5em'}} placeholder='Pool Name' defaultValue={config.poolName} onBlur={ev => this.updatePool(ev.target, "poolName")}/>
                        </div>
                        <div className="App" style={{marginTop:'0.5em'}}>
                            <label style={{display:'inline'}}>Pool Members Range</label>
                            <input className='form-control' style={{display:'inline', marginLeft:'2em', width: '9.5em', paddingLeft: '0.5em'}} placeholder='Start IP' defaultValue={config.poolStart} onBlur={ev => this.updatePool(ev.target, "poolStart")}/>
                            <input className='form-control' style={{display:'inline', marginLeft:'1em', width: '9.5em', paddingLeft: '0.5em'}} placeholder='End IP' defaultValue={config.poolEnd} onBlur={ev => this.updatePool(ev.target, "poolEnd")}/>
                        </div>
                        <div className="App" style={{marginTop:'0.5em', marginBottom: '1em'}}>
                            <label style={{display:'inline'}}>Pool Members Port</label>
                            <input className='form-control' style={{display:'inline', marginLeft:'3.07em', width: '9.5em', paddingLeft: '0.5em'}} placeholder='Port' defaultValue={config.poolPort} onBlur={ev => this.updatePool(ev.target, "poolPort")}/>
                        </div>
                    </div>
                </div>
                <div className="divBorder" style={{marginTop:'1em'}}>
                    <table className="table table-hover parentTable" id="applications">
                        <thead className="table-head">
                        <tr>
                            <td style={{width:'2em'}}/>
                            <th style={{width:'11em', textAlign: 'center'}}>BigIP Name</th>
                            <th style={{width:'13em', textAlign: 'center'}}>Management Ip</th>
                            <th style={{width:'10em', textAlign: 'center'}}>Management Port</th>
                            <th style={{width:'9em', textAlign: 'center'}}>Virtual Ip</th>
                            <th style={{width:'7em', textAlign: 'center'}}>Virtual Port</th>
                        </tr>
                        </thead>
                        <tbody>
                            {
                                devices.map((device, index) => {
                                    return this.renderBigIp(device, index)
                                })
                            }
                        </tbody>
                    </table>
                    <div className="internalButtonsBar">
                        <div className="bottomButtons">
                            {addButton1}
                            <Button style={{marginLeft: '0.5em'}} className="btn btn-default" onClick={() => this.Delete()}>Delete</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
export default connect(mapStateToProps, mapDispatchToProp)(GeneralConfigurationTab);
