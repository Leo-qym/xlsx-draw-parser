import { xlsxStore } from 'stores/xlsxStore';

export function createTournamentRecord({draws, tournamentRecord }) {
  const matchUps = draws.map(draw => draw.matchUps).flat();
  const eventTypes = draws.map(draw => `${draw.event}|${draw.drawFormat}`);
  const events = eventTypes.reduce((events, type) => {
    const [event, format] = type.split('|');
    const structures = draws
      .filter(draw => draw.event === event && draw.drawFormat === format)
      .map(draw => draw.structures)
    const candidate = {
      structures
    };
    return events.concat(candidate);
  }, []);
  Object.assign(tournamentRecord, { events });
  xlsxStore.dispatch({
    type: 'set tournament record',
    payload: { tournamentRecord, matchUps, originalDraws: draws }
  });
}