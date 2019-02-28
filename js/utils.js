
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
