import { fromJS } from 'immutable';

export const INIT = '@@f5/INIT';
export const INIT_SUCCESS = '@@f5/INIT_SUCCESS';
export const INIT_FAIL = '@@f5/INIT_FAIL';
export const LOAD = '@@f5/LOAD';
export const LOAD_CONFIG = '@@f5/LOAD_CONFIG';

export const MODAL_ON = '@@f5/MODAL_ON';
export const MODAL_OFF = '@@f5/MODAL_OFF';

export const SAVE_ON = '@@f5/SAVE_ON';
export const SAVE_OFF = '@@f5/SAVE_OFF';

export const LOAD_ON = '@@f5/LOAD_ON';
export const LOAD_OFF = '@@f5/LOAD_OFF';

const initialState = fromJS({
    initialized: false,
    state: false,
    config: {},
    generalConfig: {},
    modalIsOpen: false,
    saveStatus: false,
    loadStatus: true,
});

export default function reducer(state = initialState, { type, payload }) {
    switch (type) {
        // Initializing Application
        case INIT: {
            return state
                .set('initializing', true)
                .set('initialized', false);
            }
        case INIT_SUCCESS: {
            return state
                .set('initializing', false)
                .set('initialized', true);
            }
        case INIT_FAIL: {
            return state
                .set('initializing', true)
                .set('initialized', false)
                .set('error', fromJS(payload.error));
        }
        // Loading State
        case LOAD: {
            return state.set('loading', true);
        }
        case LOAD_CONFIG: {
            return state
                .set('generalConfig', fromJS(payload))
                .set('modalIsOpen', false);
        }
        case MODAL_ON: {
            return state.set('modalIsOpen', true);
        }
        case MODAL_OFF: {
            return state.set('modalIsOpen', false);
        }
        case SAVE_ON: {
            return state.set('saveStatus', true);
        }
        case SAVE_OFF: {
            return state.set('saveStatus', false);
        }
        case LOAD_ON: {
            return state.set('loadStatus', true);
        }
        case LOAD_OFF: {
            return state.set('loadStatus', false);
        }
        // Returns current state
        default: {
            return state;
        }
    }
}


