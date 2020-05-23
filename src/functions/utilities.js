export function isPowerOf2(x) { return x === nearestPowerOf2(x); }
export function letterValue(letter) { return parseInt(letter, 36) - 9; }
export function numArr(count) { return [...Array(count)].map((_, i) => i); }
export function nearestPowerOf2(x) { return Math.pow(2, Math.ceil(Math.log(x)/Math.log(2))); }
export function unique(arr) { return arr.filter((item, i, s) => s.lastIndexOf(item) === i); }
export function instanceCount(values) { return values.reduce((a, c) => { if (!a[c]) a[c] = 0; a[c]++; return a; }, {}); }
export function generateRange(start, end) { return Array.from({length: (end - start)}, (v, k) => k + start); }

export function maxInstance(values) {
  const valueCounts = instanceCount(values);
  const valueInstances = Math.max(0, ...Object.values(valueCounts));
  return Object.keys(valueCounts).reduce((p, c) => valueCounts[c] === valueInstances ? c : p, undefined);
}

export function chunkArray(arr, chunksize) {
  return arr.reduce((all,one,i) => {
      const ch = Math.floor(i/chunksize); 
      all[ch] = [].concat((all[ch]||[]),one); 
      return all;
  }, []);
}

const hashCode = (str) => {
   var hash = 0;
   if (str.length === 0) { return hash; }
   for (var i = 0; i < str.length; i++) {
       var char = str.charCodeAt(i);
       hash = ((hash<<5)-hash)+char;
       hash = hash & hash; // Convert to 32bit integer
   }
   return hash;
};

export function hashId(str) { return `SDP${hashCode(str)}` }
