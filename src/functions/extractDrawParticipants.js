import { cellValue, numberValue } from 'functions/sheetAccess';
import { columnMatches } from 'functions/columnMatches';
import { roundData, nameHash, lastFirstI } from 'functions/drawFx';

export function extractDrawParticipants({ sheet, headerRow, columns, rows, range, finals, preround_rows}) {
let players = [];
  let playoff3rd = [];
  let playoff3rd_rows = [];
  let hasharray = [];
  
  let extract_seed = /\[(\d+)(\/\d+)?\]/;

  rows.forEach(row => {
     let draw_position = numberValue(sheet, `${columns.position}${row}`);

     // MUST BE DOUBLES
     if (!draw_position) draw_position = numberValue(sheet, `${columns.position}${row + 1}`);

     let player = extractPlayer(row, draw_position);

     if (['', 'bye', 'byebye'].indexOf(player.hash) >= 0) {
        players.push(player);
     } else if (['', 'bye', 'byebye'].indexOf(player.hash) < 0 && hasharray.indexOf(player.hash) < 0) {
        hasharray.push(player.hash);
        players.push(player);
     } else {
        playoff3rd_rows.push(row);
        playoff3rd.push(player);
     }
  });

  // rows from playoff round are excluded
  rows = rows.filter(row => playoff3rd_rows.indexOf(row) < 0);
  range = [Math.min(...rows), Math.max(...rows)];

  let preround = { rows: [], players: [] };
  preround_rows.forEach(row => {
     let draw_position = numberValue(sheet, `${columns.position}${row}`);

     let player = extractPlayer(row, draw_position);
     if (player.hash) {
        preround.rows.push(row);
        preround.players.push(player);
     }

  });

  preround.range = [Math.min(...preround.rows), Math.max(...preround.rows)];
  let pdata = roundData({sheet, columns, headerRow, player_data: { players: preround.players, range: preround.range }});

  if (pdata[0] && pdata[0].column_references) {
     // there should be only one column of relevant data
     preround.matches = columnMatches(sheet, pdata[0], preround.players).matches.filter(match => match.result);
  }

  return { players, rows, playoff3rd, playoff3rd_rows, range, finals, preround };

  function extractPlayer(row, draw_position) {
     let player = { draw_position };
     if (columns.seed) player.seed = numberValue(sheet, `${columns.seed}${row}`);

     let firstName = cellValue(sheet[`${columns.firstName}${row}`]);
     let lastName = cellValue(sheet[`${columns.lastName}${row}`]);
     let fullName = firstName && lastName ? `${lastName}, ${firstName}` : cellValue(sheet[`${columns.players}${row}`]);
     
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
      const value = cellValue(sheet[cellReference]);
      // TODO: this should be part of profile
      player.id = value.replace('"', '');
     }
     if (columns.club) player.club = cellValue(sheet[`${columns.club}${row}`]);
     if (columns.rank) player.rank = numberValue(sheet, `${columns.rank}${row}`);
     if (columns.entry) player.entry = cellValue(sheet[`${columns.entry}${row}`]);
     if (columns.country) player.ioc = cellValue(sheet[`${columns.country}${row}`]);
     if (columns.rr_result) player.rr_result = numberValue(sheet, `${columns.rr_result}${row}`);
     return player;
  }
  
};
