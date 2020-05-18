import produce from "immer";

const setToasterState = (state, action) => produce(state, draftState => {
  if (action.payload) {
    draftState.toasterState.visible = true;
    Object.assign(draftState.toasterState, action.payload);
  } else {
    draftState.toasterState.visible = null;
    draftState.toasterState.message = '';
  }
});

const setLoadingState = (state, action) => produce(state, draftState => { draftState.loadingState = action.payload; });

const setTournamentRecord = (state, action) => produce(state, draftState => {
  draftState.tournamentRecord = action.payload;
});

const setMatchUps = (state, action) => produce(state, draftState => {
  draftState.matchUps = action.payload || [];
});

const rootProducer = {
    'toaster state': setToasterState,
    'loading state': setLoadingState,
   
    'set tournament record': setTournamentRecord,
    'set matchUps': setMatchUps
};

export default rootProducer;