import fields from 'json!./form_fields.json';

const constants = {
  timeout: 1000,
  api: {
    configuration: '/mgmt/shared/iapp/ipAddressExpansion',
    updateDevice: '/mgmt/shared/iapp/ipAddressExpansion/devices',
    updatePool: '/mgmt/shared/iapp/ipAddressExpansion/config',
    tokenUrl: '/mgmt/shared/authn/login'
  },
  fields,
  getBlockFullPath: id => `https://localhost/mgmt/shared/iapp/blocks/${id}`,
  maxErrorCount: 10,
  appState: {
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE',
    DISABLED: 'DISABLED',
    ERROR: 'ERROR',
    TRANSITION: 'TRANSITION',
    UNKNOWN: 'UNKNOWN',
  },
  blockState: {
    BINDING: 'BINDING',
    BOUND: 'BOUND',
    UNBINDING: 'UNBINDING',
    UNBOUND: 'UNBOUND',
    TEMPLATE: 'TEMPLATE',
    ERROR: 'ERROR',
  },
};

export default constants;
