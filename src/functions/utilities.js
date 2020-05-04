export function maxInstance(values) {
  const valueCounts = instanceCount(values);
  const valueInstances = Math.max(0, ...Object.values(valueCounts));
  return Object.keys(valueCounts).reduce((p, c) => valueCounts[c] === valueInstances ? c : p, undefined);
}
export function instanceCount(values) { return values.reduce((a, c) => { if (!a[c]) a[c] = 0; a[c]++; return a; }, {}); }
export function unique(arr) { return arr.filter((item, i, s) => s.lastIndexOf(item) === i); }
export function letterValue(letter) { return parseInt(letter, 36) - 9; }