import { hashId } from 'functions/utilities';
import { nameHash, lastFirstI } from 'functions/drawStructures/drawFx';
import { getCellValue, numberValue } from 'functions/dataExtraction/sheetAccess';

export function extractRoundRobinParticipants({ profile, sheet, headerRow, columns, rows, range, gender, finals, preround_rows}) {
  
  let players = [];
  let isDoubles = false;
  let lastDrawPositionCharCode;

  const drawPositions = [];
  const extract_seed = /\[(\d+)(\/\d+)?\]/;
  const rowOffset = profile.doubles.drawPosition.rowOffset;
  const drawPositionIsNumber = false;
 
  rows.forEach(row => {
    const drawPosition = drawPositionIsNumber ? numberValue(sheet, `${columns.position}${row}`) : getCellValue(sheet[`${columns.position}${row}`]);
    const dpcc = drawPosition.charCodeAt();
    const player = extractPlayer({row, drawPosition, isDoubles});
    const validDrawPosition = player && drawPosition && (!lastDrawPositionCharCode || lastDrawPositionCharCode + 1 === dpcc);
    if (validDrawPosition) {
      drawPositions.push(drawPosition);
      players.push(player);
    } else if (drawPosition) {
      if (drawPositions.includes(drawPosition)) {
        console.log('extract results row', {drawPosition});
      }
    }
  });

  return { players, isDoubles };

  function extractPlayer({row, drawPosition, isDoubles}) {
    let player = { drawPosition };
    if (columns.seed) {
      const seedRow = isDoubles ? row + rowOffset : row;
      player.seed = numberValue(sheet, `${columns.seed}${seedRow}`);
    }

    let firstName = getCellValue(sheet[`${columns.firstName}${row}`]);
    let lastName = getCellValue(sheet[`${columns.lastName}${row}`]);
    let fullName = firstName && lastName ? `${lastName}, ${firstName}` : getCellValue(sheet[`${columns.players}${row}`]);

    if (extract_seed.test(fullName)) {
      player.seed = parseInt(extract_seed.exec(fullName)[1]);
      fullName = fullName.split('[')[0].trim();
    }

    player.full_name = fullName;
    player.last_first_i = lastFirstI(fullName);
    player.last_name = lastName || fullName.split(',')[0].trim().toLowerCase();
    player.first_name = firstName || fullName.split(',').reverse()[0].trim().toLowerCase();
    player.hash = nameHash(player.first_name + player.last_name);
    player.participantId = `${hashId(player.hash)}-P`;
    if (columns.id) {
       const cellReference = `${columns.id}${row}`; 
       const value = getCellValue(sheet[cellReference]);
       player.personId = value.replace('"', '');
    }
    if (gender) player.gender = gender;
    if (columns.club) player.club = getCellValue(sheet[`${columns.club}${row}`]);
    if (columns.rank) player.rank = numberValue(sheet, `${columns.rank}${row}`);
    if (columns.entry) player.entry = getCellValue(sheet[`${columns.entry}${row}`]);
    if (columns.country) player.ioc = getCellValue(sheet[`${columns.country}${row}`]);
    if (columns.rr_result) player.rr_result = numberValue(sheet, `${columns.rr_result}${row}`);

    return fullName ? player : undefined;
  }
}
