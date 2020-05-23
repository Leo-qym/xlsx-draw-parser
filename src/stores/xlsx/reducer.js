import rootProducer from './rootProducer';

const initialState = {
  loadingState: null,
  toasterState: {
    visible: null,
    anchorOrigin: {
      vertical: 'top',
      horizontal: 'center'
    },
    severity: 'success',
    message: ''
  },
  tournamentRecord: {},
  originalDraws: [],
  matchUps: []
};

const createReducer = handlers => (state=initialState, action) => {
    if (!Object.keys(handlers).includes(action.type)) { return state; }
    return handlers[action.type](state, action);
};

const producerArray = [
    rootProducer,
];

const producers = Object.assign({}, ...producerArray);

export default createReducer(producers);