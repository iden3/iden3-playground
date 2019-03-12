function select(e) {
  e.focus();
  e.select()
}
function selectAndCopy(e) {
  e.focus();
  e.select()
  let copyText = e;
  copyText.select();
  document.execCommand("copy");
  toastr.info("data copied");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomName() {
  let text = "";
  let possible = "abcdefghijklmnopqrstuvwxyz";
  for (var i = 0; i < 5; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function strToHex(str) {
  var result = '';
    for (var i=0; i<str.length; i++) {
      result += str.charCodeAt(i).toString(16);
    }
    return result;
}
