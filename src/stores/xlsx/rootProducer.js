import produce from "immer";

const setToasterState = (state, action) => produce(state, draftState => {
  if (action.payload) {
    draftState.toasterState.visible = true;
    Object.assign(draftState.toasterState, action.payload);
    if (action.payload.cancelLoading) {
      draftState.loadingState = undefined;
      draftState.tournamentRecord = {};
      draftState.originalDraws = [];
      draftState.matchUps = [];
    }
  } else {
    draftState.toasterState.visible = null;
    draftState.toasterState.message = '';
  }
});

const setLoadingState = (state, action) => produce(state, draftState => {
  draftState.loadingState = action.payload;
  if (!action.payload) {
    draftState.tournamentRecord = {};
    draftState.originalDraws = [];
    draftState.matchUps = [];
  }
});

const setTournamentRecord = (state, action) => produce(state, draftState => {
  const { tournamentRecord, matchUps, originalDraws } = action.payload;
  
  draftState.tournamentRecord = tournamentRecord;
  draftState.originalDraws = originalDraws;
  draftState.matchUps = matchUps;
  
  draftState.loadingState = false;
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