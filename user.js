// User

/*function sendXHR(message) {
  let xhrobj = new XMLHttpRequest();;
  xhrobj.open('POST', 'user.php', true);
  xhrobj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhrobj.send(message);
  xhrobj.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      alert(xhrobj.responseText);
    }
  }
}

function getSessionStatus() {
  let xhrobj = new XMLHttpRequest();;
  xhrobj.open('POST', 'user.php', true);
  xhrobj.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhrobj.send('');
  xhrobj.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      alert(xhrobj.responseText);
    }
  }
}*/