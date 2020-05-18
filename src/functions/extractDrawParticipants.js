import { getCellValue, numberValue } from 'functions/sheetAccess';
import { getColumnMatches } from 'functions/columnMatches';
import { getRoundData, nameHash, lastFirstI } from 'functions/drawFx';

export function extractDrawParticipants({ profile, sheet, headerRow, columns, rows, range, finals, preround_rows}) {
   let players = [];
   let playoff3rd = [];
   let playoff3rd_rows = [];
   let hasharray = [];

   let isDoubles = false;
   let expectedDrawPosition = 1;
   
   const extract_seed = /\[(\d+)(\/\d+)?\]/;
   const rowOffset = profile.doubles.drawPosition.rowOffset;

   rows.forEach(row => {
      let drawPosition = numberValue(sheet, `${columns.position}${row}`);

      if (!drawPosition) {
         // MUST BE DOUBLES
         isDoubles = true;
         drawPosition = numberValue(sheet, `${columns.position}${row + rowOffset}`);
      }

      let player = extractPlayer({row, drawPosition, isDoubles});

      if (['bye,', 'bye', 'byebye'].indexOf(player.hash) >= 0) {
         player.isBye = true;
         players.push(player);
      } else if (
            ['', 'bye', 'byebye'].indexOf(player.hash) < 0 &&
            hasharray.indexOf(player.hash) < 0 &&
            player.first_name && player.last_name
         ) {
            hasharray.push(player.hash);
            players.push(player);
            expectedDrawPosition = drawPosition + 1;
      } else if (drawPosition === expectedDrawPosition) {
         player.isBye = true;
         players.push(player);
      } else {
         playoff3rd_rows.push(row);
         playoff3rd.push(player);
      }
  });

  // rows from playoff round are excluded
  rows = rows.filter(row => playoff3rd_rows.indexOf(row) < 0);
  range = [Math.min(0, ...rows), Math.max(0, ...rows)];

  let preround = { rows: [], players: [] };
  preround_rows.forEach(row => {
     let drawPosition = numberValue(sheet, `${columns.position}${row}`);

     let player = extractPlayer({row, drawPosition});
     if (player.hash) {
        preround.rows.push(row);
        preround.players.push(player);
     }

  });

  preround.range = [Math.min(0, ...preround.rows), Math.max(0, ...preround.rows)];
  let pdata = getRoundData({sheet, columns, headerRow, player_data: { players: preround.players, range: preround.range }});

  if (pdata[0] && pdata[0].column_references) {
     // there should be only one column of relevant data
     preround.matchUps = getColumnMatches({
        sheet,
        round: pdata[0],
        players: preround.players,
        isDoubles,
        rowOffset
      }).matchUps.filter(match => match.result);
  }

  console.log({players, playoff3rd});

  return { players, rows, playoff3rd, playoff3rd_rows, range, finals, preround, isDoubles };

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
     if (columns.id) {
      const cellReference = `${columns.id}${row}`; 
      const value = getCellValue(sheet[cellReference]);
      // TODO: this should be part of profile
      player.id = value.replace('"', '');
     }
     if (columns.club) player.club = getCellValue(sheet[`${columns.club}${row}`]);
     if (columns.rank) player.rank = numberValue(sheet, `${columns.rank}${row}`);
     if (columns.entry) player.entry = getCellValue(sheet[`${columns.entry}${row}`]);
     if (columns.country) player.ioc = getCellValue(sheet[`${columns.country}${row}`]);
     if (columns.rr_result) player.rr_result = numberValue(sheet, `${columns.rr_result}${row}`);
     return player;
  }
  
};
