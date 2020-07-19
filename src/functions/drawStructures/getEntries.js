export function getEntries({matchUps}) {
  const matchUpSides = matchUps
    .map(matchUp => [matchUp.winningSide, matchUp.losingSide])

  const matchUpPlayers = matchUpSides
    .flat(Infinity)
    .filter(participant => participant && !participant.isBye)
    .map(participant => ({ [participant.participantId]: participant }));

  const playersMap = Object.assign({}, ...matchUpPlayers);

  const participantsMap = Object.assign({}, ...matchUpSides
    .map(matchUp => matchUp.map(getSideParticipant).filter(f=>f))
    .flat());
    
  const seedAssignments = Object.keys(participantsMap)
    .map(participantId => ({ participantId, seedNumber: participantsMap[participantId].seedNumber }))
    .sort((a, b) => a.seedNumber - b.seedNumber);
   
  const positionAssignments = Object.keys(participantsMap)
    .map(participantId => ({
      participantId,
      drawPosition: participantsMap[participantId].drawPosition
    }))
    .sort((a, b) => a.drawPosition - b.drawPosition);

  const entries = Object.keys(participantsMap).map(eventEntry);
  
  return { playersMap, participantsMap, entries, seedAssignments, positionAssignments };

  function eventEntry(participantId) {
    const playerParticipant = playersMap[participantId];
    const categoryRanking = playerParticipant && playerParticipant.rank;
    const entry = {
      participantId,
      categoryRanking
    }
    return entry;
  }
}

function getSideParticipant(side, i) {
  const isBye = !side || side.reduce((p, c) => c.isBye, undefined);
  if (!isBye && side[0]) {
    const participantIds = side.map(player => player.participantId);
    const participantId = participantIds.sort().join('|');
    const drawPosition = side[0].drawPosition;
    const seedNumber = side[0].seed;
    const participant = { [participantId]: { drawPosition, seedNumber, participantIds }};
    return participant;
  }
}

