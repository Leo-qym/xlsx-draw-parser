function download(filename, dataStr) {
  let a = document.createElement('a');
  a.style.display = 'none';
  a.setAttribute('href', dataStr);
  a.setAttribute('download', filename);
  let elem = document.body.appendChild(a);
  elem.click();
  elem.remove();
}

export function exportJSON(filename, json) {
  let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 2));
  download(filename, dataStr);
}