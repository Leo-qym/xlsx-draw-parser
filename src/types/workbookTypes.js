import { HEADER, FOOTER } from './sheetElements';
import { KNOCKOUT, ROUND_ROBIN, PARTICIPANTS } from './sheetTypes';

export const workbookTypes = [
  {
    organization: 'MTSZ', 
    mustContainSheetNames: ['Altalanos'],
    validSheet:  sheetName => {
      const knockout = /^[FL]{1}[1-8]{2}/.test(sheetName);
      const roundRobin = /^[1-8]{1}\.*cs/.test(sheetName);
      const rrPlayoff = /^[1-8]{1}\.*nap/.test(sheetName);
      return knockout || (roundRobin || rrPlayoff);
    },
    profile: {
      skipWords: ['umpire'],
      identification: {
        includes: [],
        sub_includes: []
      },
      columnsMap: {
        position:   'A',
        rank:       'C',
        id:         'D',
        seed:       'E',
        lastName:   'F',
        firstName:  'G',
        club:       'I',
        rounds:     'K'
      },
      rowDefinitions: [
        {
          type: HEADER,
          id: 'knockoutParticipants',
          elements: [
            'rangs', 'rangsor', 'kód', 'kódszám',
            'kiem', 'családi név', 'keresztnév',
            'egyesület', 'döntő', '2. forduló'
          ],
          minimumElements: 5
        },
        {
          type: HEADER,
          id: 'roundRobinParticipants',
          elements: [
            'kiem', 'kódszám', 'rangsor',
            'vezetéknév', 'keresztnév', 'egyesület',
            'helyezés', 'pontszám', 'bónusz'
          ],
          minimumElements: 7
        },
        {
          type: HEADER,
          id: 'singlesParticipants',
          elements: [
            'sor', 'családi név', 'keresztnév', 'egyesület', 'kódszám',
            'aláírás', 'nevezési rangsor', 'elfogadási státusz',
            'sorsolási rangsor', 'kiemelés'
          ],
          minimumElements: 8
        },
        {
          type: HEADER,
          id: 'doublesParticipants',
          elements: [
            'ssz.', 'családi név', 'keresztnév', 'egyesületi', 'kódszám',
            '1. játékos ranglista', 'aláírás', '2. játékos ranglista',
            'páros egyesített rangsora', 'kIemelés'
          ],
          minimumElements: 8
        },
        {
          type: FOOTER,
          id: 'drawFooter',
          elements: [
            'rangsor', 'kiemeltek', 'alternatívok',
            'helyettesítik', 'sorsolás ideje',
            'szerencés vesztes', 'sorsolás időpontja',
            'kiemelt párosok'
          ],
          minimumElements: 3
        }
      ],
      sheetDefinitions: [
        {
          type: KNOCKOUT,
          rowIds: ['knockoutParticipants', 'drawFooter']
        },
        {
          type: ROUND_ROBIN,
          rowIds: ['roundRobinParticipants', 'drawFooter']
        },
        {
          type: PARTICIPANTS,
          rowIds: ['singlesParticipants']
        },
        {
          type: PARTICIPANTS,
          rowIds: ['doublesParticipants']
        }
      ],
      gaps: { draw:     { term: 'Round 1', gap: 0 } },
      headerColumns: [
          { attr: 'rank',       header: 'Rangs' },
          { attr: 'rank',       header: 'Rangsor' },
          { attr: 'id',         header: 'kód' },
          { attr: 'id',         header: 'Kódszám' },
          { attr: 'seed',       header: 'Kiem' },
          { attr: 'lastName',   header: 'Családi név' },
          { attr: 'firstName',  header: 'Keresztnév' },
          { attr: 'club',       header: 'Egyesület' },
          { attr: 'rounds',     header: 'Döntő' },
          { attr: 'rounds',     header: '2. forduló' }
      ],
      playerRows: { playerNames: true, lastName: true, firstName: true }
    }
  },  
  {
    organization: 'HTS', 
    mustContainSheetNames: ['Pocetna', 'Rang-lista', 'Izvjestaj'],
    validSheet:  sheetName => {
      const nameLength = sheetName.length;
      const Singles = sheetName.length && sheetName.slice(0,2) === 'Si';
      const Doubles = sheetName.length && sheetName.slice(0,2) === 'Do';
      const validDrawSize = ['RR', '4', '8', '12', '16', '24', '32', '48', '64']
        .includes(sheetName.slice(nameLength - 2, nameLength));
      return (Singles || Doubles) && validDrawSize;
    }
  }  
];
