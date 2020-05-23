import { xlsxStore } from 'stores/xlsxStore';

export function createTournamentRecord({draws, tournamentRecord }) {
  const matchUps = draws.map(draw => draw.matchUps).flat();
  xlsxStore.dispatch({ type: 'set tournament record', payload: { tournamentRecord, matchUps }});
}