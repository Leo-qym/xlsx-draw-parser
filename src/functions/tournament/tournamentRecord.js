import { xlsxStore } from 'stores/xlsxStore';
import { unique } from 'functions/utilities';
import { INDIVIDUAL, PAIR, QUALIFYING } from 'types/todsConstants';

export function createTournamentRecord({draws, tournamentRecord, allPlayers, allParticipants }) {
  const matchUps = draws.map(draw => draw.matchUps).flat();
 
  const { events } = getEvents({draws});
  Object.assign(tournamentRecord, { events });

  const { participants } = getParticipants({allPlayers, allParticipants});
  Object.assign(tournamentRecord, { participants });
  
  xlsxStore.dispatch({
    type: 'set tournament record',
    payload: { tournamentRecord, matchUps, originalDraws: draws }
  });
}

function getParticipants({allPlayers, allParticipants}) {
  let participants = Object.keys(allParticipants).map(participantId => {
    const participantIds = allParticipants[participantId].participantIds;
    if (participantIds.length === 2) {
      return pairParticipant(participantId);   
    } else {
      return individualParticipant(participantId);
    }
  })
  
  return { participants };
 
  function pairParticipant(participantId) {
    const pair = allParticipants[participantId];
    const participantIds = pair.participantIds;
    const players = participantIds.map(participantId => allPlayers[participantId]);
    const name = players.map(player => player.last_name).join('/');
    const participant = {
      name,
      participantId,
      participantType: PAIR,
      participantIds 
    };
    return participant;
  }
  
  function individualParticipant(participantId) {
    const player = allPlayers[participantId];
    if (!player) {
      console.log('no player', {participantId});
      return {};
    }
    const participant = {
      participantId,
      participantType: INDIVIDUAL,
      name: player.last_name,
      preferredGivenName: player.first_name,
      person: {
        personId: player.personId,
        gender: player.gender
      }
    }
    return participant;
  }
}

function getEvents({draws}) {
  const eventTypes = unique(draws.map(draw => `${draw.event}|${draw.drawFormat}`));
  const events = eventTypes.reduce((events, type) => {
    const [event, format] = type.split('|');
    const eventDraws = draws
      .filter(draw => draw.event === event && draw.drawFormat === format)
    const drawId = eventDraws[0].drawId;
    const entries = getEventEntries({eventDraws});
    const eventCategory = eventDraws[0].event;
    const eventFormat = eventDraws[0].drawFormat;
    const eventName = [eventCategory, eventFormat].join(' ');
    const structures = eventDraws.map(draw => draw.structure);
    const candidate = {
      eventName,
      eventId: `${drawId}-E`,
      draws: [
        {
          drawId,
          entries,
          structures
        }
      ]
    };
    return events.concat(candidate);
  }, []);
 
  return { events };
}

function getEventEntries({eventDraws}) {
  let entriesMap = {};
  eventDraws.map(draw => {
    const entryStage = draw.structure.stage;
    const participantIds = draw.entries.map(entry => entry.participantId);
    return participantIds.map(participantId => ({ participantId, entryStage }));
  }).flat().forEach(entry => {
    const participantId = entry.participantId;
    if (!entriesMap[participantId] || entry.entryStage === QUALIFYING) {
      entriesMap[participantId] = entry;
    }
  });
  const entries = Object.keys(entriesMap).map(key => entriesMap[key]);
  return entries;
}