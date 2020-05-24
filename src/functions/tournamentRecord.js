import { xlsxStore } from 'stores/xlsxStore';

export function createTournamentRecord({draws, tournamentRecord, allPersonIds, allPlayers, allParticipants }) {
  const matchUps = draws.map(draw => draw.matchUps).flat();
 
  const { events } = getEvents({draws});
  Object.assign(tournamentRecord, { events });

  const { participants } = getParticipants({allPersonIds, allPlayers, allParticipants});
  Object.assign(tournamentRecord, { participants });
  
  xlsxStore.dispatch({
    type: 'set tournament record',
    payload: { tournamentRecord, matchUps, originalDraws: draws }
  });
}

function getParticipants({allPersonIds, allPlayers, allParticipants}) {
  let participants = [];
  console.log({allPersonIds, allPlayers, allParticipants});
  
  return { participants };
}

function getEvents({draws}) {
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
 
  return { events };
}