
export function loadFile(file, callback, ...args) {
  let reader = new FileReader();
  reader.onload = function(evt) {
     if (evt.target.error) { return; }

     let file_content = evt.target.result;
     callback(file_content, ...args)
  };

  reader.readAsBinaryString(file);
}
