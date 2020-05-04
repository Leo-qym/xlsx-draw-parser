import { unique, instanceCount } from 'functions/utilities';

export function numberValue(sheet, reference) {
  return !isNaN(parseInt(cellValue(sheet[reference]))) ? parseInt(cellValue(sheet[reference])) : '';
}
export function cellsContaining({sheet, term}) {
  let references = Object.keys(sheet);
  return references.filter(ref => (sheet[ref].v + '').toLowerCase().indexOf(term.toLowerCase()) >= 0);
};

export function cellValue(cell) {
  let val = cell ? cell.v + '' : '';
  val = (typeof val === 'string') ? val.trim() : val;
  val = val.indexOf(',,') >= 0 ? val.replace(',,', ',') : val;
  val = val.indexOf(',') >= 0 ? val.split(',').map(v => v.trim()).join(', ') : val;
  return val;
};

export function getRow(reference) {
  const numericPart = reference && /\d+/.exec(reference);
  return numericPart ? parseInt(numericPart[0]) : undefined;
}

export function getCol(reference) { return reference ? reference[0] : undefined; }

export function findValueRefs(searchText, sheet, options) {
  function transformValue(value) {
    if (options) {
      if (options.lowerCase) value = value.toLowerCase();
      if (options.remove && Array.isArray(options.remove)) {
        options.remove.forEach(replace => {
          const re = new RegExp(replace,"g");
          value = value.replace(re, '');
        });
      }
    }
    return value;
  }
  return Object.keys(sheet).filter(ref => transformValue(cellValue(sheet[ref])) === searchText);
}

export function findRow({sheet, rowDefinition}) {
  const rowElements = rowDefinition && rowDefinition.elements;
  if (!rowElements) return;
  const options = { lowerCase: true, remove: [':'] };
  const elementRows = [].concat(...rowElements
    .map(element => {
      const valueRefs = findValueRefs(element, sheet, options);
      // remove duplicate instances on the same row
      return unique(valueRefs.map(getRow));
    })
    .filter(f=>f.length));
  const valueCounts = instanceCount(elementRows);
  const elementInstances = Math.max(0, ...Object.values(valueCounts));
  if (elementInstances >= rowDefinition.minimumElements) {
    return Object.keys(valueCounts).reduce((p, c) => valueCounts[c] === elementInstances ? c : p, undefined);
  }
}
