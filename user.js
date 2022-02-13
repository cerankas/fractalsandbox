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

/*function initializeUserPane() {
  userPane = new Tweakpane.Pane();
  userPane.hidden = true;
  mainPane.addInput(parameters, 'email');
  mainPane.addInput(parameters, 'password');
  mainPane.addInput(parameters, 'nickname');
  mainPane.addButton({title: 'login'}).on('click', () => { sendXHR('action=login&email=' + parameters.email + '&password=' + parameters.password); });
  mainPane.addButton({title: 'logout'}).on('click', () => { sendXHR('action=logout'); });
  mainPane.addButton({title: 'register'}).on('click', () => { sendXHR('action=register&email=' + parameters.email + '&password=' + parameters.password + '&nickname=' + parameters.nickname); });
  mainPane.addButton({title: 'reset password'}).on('click', () => { sendXHR('action=reset&email=' + parameters.email); });
}*/
