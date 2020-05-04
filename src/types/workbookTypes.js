export const workbookTypes = [
  {
    organization: 'MTSZ', 
    mustContainSheetNames: ['Altalanos'],
    validSheet:  sheetName => {
      const matchesStart = sheetName.length && ['F', 'L'].includes(sheetName[0]);
      const matchesEnd = ['F', 'P', 'Q'].includes(sheetName[sheetName.length-1]);
      return matchesStart && matchesEnd;
    },
    profile: {
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
      rows: {
        header: {
          defaultRow: 5,
          elements: [
            'rangs', 'rangsor', 'kód', 'kódszám',
            'kiem', 'családi név', 'Keresztnév',
            'egyesület', 'döntő', '2. forduló'
          ],
          minimumElements: 5
        },
        footer: {
          defaultRow: null,
          elements: [
            'rangsor', 'kiemeltek', 'alternatívok',
            'helyettesítik', 'sorsolás ideje',
            'szerencés vesztes', 'sorsolás időpontja:',
            'kiemelt párosok'
          ],
          minimumElements: 3
        }
      },
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
      playerRows: { lastName: true, firstName: true }
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
