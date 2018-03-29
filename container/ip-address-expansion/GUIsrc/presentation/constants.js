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
  maxErrorCount: 10
};

export default constants;
