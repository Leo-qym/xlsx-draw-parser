
export function loadFile(file, callback) {
  let reader = new FileReader();
  reader.onload = function(evt) {
     if (evt.target.error) { return; }

     let file_content = evt.target.result;
     callback(file_content)
  };

  reader.readAsBinaryString(file);
}
