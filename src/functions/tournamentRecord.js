import { xlsxStore } from 'stores/xlsxStore';

export function createTournamentRecord({draws, tournamentRecord }) {
  const matchUps = draws.map(draw => draw.matchUps).flat();
  const eventTypes = draws.map(draw => `${draw.event}|${draw.drawFormat}`);
  const events = eventTypes.reduce((events, type) => {
    const [event, format] = type.split('|');
    const eventDraws = draws
      .filter(draw => draw.event === event && draw.drawFormat === format)
    const drawId = eventDraws[0].drawId;
    const entries = eventDraws[0].entries;
    const structures = eventDraws
      .map(draw => draw.structures)
    const candidate = {
      drawId,
      entries,
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