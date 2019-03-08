// Relay
//const relayAddr = '0xe0fbce58cfaa72812103f003adce3f284fe5fc7c';

// Name server
//const nameServerUrl = 'http://127.0.0.1:7000/api/unstable';
// const nameServerUrl = 'https://relay.iden3.io/api/unstable';

//const notificationUrl = 'http://127.0.0.1:10000/api/unstable';
//const notificationServer = new iden3.NotificationServer(notificationUrl);

// new database
const db = new iden3.Db();
// new key container using localStorage
const kc = new iden3.KeyContainer('localStorage', db);

function getPassphrase() {
  return document.getElementById('kc-passphrase').value;
}

// g is the global state object
let g = {};
g.id = null;

function saveG() {
  localStorage.setItem("g", JSON.stringify(g));
}

function loadG() {
  const gSto = JSON.parse(localStorage.getItem("g"));
  const relay = new iden3.Relay(gSto.id.relay.url, gSto.id.relay.debug);
  const nameServer = new iden3.NameServer(gSto.id.nameServer.url, gSto.id.nameServer.debug);
  const notificationServer = new iden3.NotificationServer(gSto.id.notificationServer.url,
    gSto.id.notificationServer.debug);

  // Make a copy of gSto into g, so that we don't erease gSto.id afterwards
  g = JSON.parse(JSON.stringify(gSto));
  g.id = new iden3.Id(gSto.id.keyOperationalPub, gSto.id.keyRecover, gSto.id.keyRevoke, relay,
    gSto.id.relayAddr, nameServer, notificationServer, '', undefined, 0);
  g.id.idAddr = gSto.id.idAddr;
  g.id.tokenLogin = gSto.id.tokenLogin;

  //g.idName = gSto.idName;
  //g.proofKSign = gSto.proofKSign;
  //g.proofEthName = gSto.proofEthName;
  //g.keyAddressOp = gSto.keyAddressOp;
  //g.keys = gSto.keys;
  //g.masterSeed = gSto.masterSeed;
  //g.notifications = gSto.notifications;
  //g.notificationLastId = gSto.notificationLastId;

  if (gSto.backupServer != null) {
    const backupServer = new iden3.Backup(gSto.backupServer.url, gSto.backupServer.username,
      gSto.backupServer.password, gSto.backupServer.debug);
    g.backupServer = backupServer
  }
}

if(localStorage.getItem("g")) {
  loadG();
  console.log("id", g.id);
  printKeys(g.keys);

  document.getElementById('masterSeed-result').innerHTML = g.masterSeed;
  document.getElementById('keyAddressOp-result').innerHTML = g.keyAddressOp;
  document.getElementById('keyPublicOp-result').innerHTML = g.id.keyOperationalPub;
  document.getElementById('keyRecover-result').innerHTML = g.id.keyRecover;
  document.getElementById('keyRevoke-result').innerHTML = g.id.keyRevoke;
  document.getElementById('idaddr-result').innerHTML = g.id.idAddr;
  document.getElementById('idaddr-header').innerHTML = g.id.idAddr;
  document.getElementById('proofClaimOperationalKey-result').innerHTML = g.proofKSign;
  document.getElementById('assignName-result').innerHTML = JSON.stringify(g.proofEthName);
}

let servers = null;
function loadServers() {
  servers = {};
  servers.relayUrl = document.getElementById('relay-url').value;
  servers.relayAddr = document.getElementById('relay-addr').value;
  servers.nameServerUrl = document.getElementById('name-server-url').value;
  servers.nameServerAddr = document.getElementById('name-server-addr').value;
  servers.notificationServerUrl = document.getElementById('notification-server-url').value;

  toastr.info('Servers loaded');
}


function newWallet() {
  if (servers == null) {
    toastr.error('No servers loaded!');
    return;
  }
  const relay = new iden3.Relay(servers.relayUrl, false);
  const nameServer = new iden3.NameServer(servers.nameServerUrl, false);
  const notificationServer = new iden3.NotificationServer(servers.notificationServerUrl, true);

  const passphrase = getPassphrase();;
  console.log('passphrase', passphrase);
  kc.unlock(passphrase);
  // generate master seed
  kc.generateMasterSeed();
  g.masterSeed = kc.getMasterSeed();
  document.getElementById('masterSeed-result').innerHTML = g.masterSeed;
  kc.generateKeyBackUp(g.masterSeed);
  // Generate keys for first identity
  g.keys = kc.createKeys();
  // key[1] that is a pubic key in its compressed form
  g.keyAddressOp = g.keys[0];
  let keyPublicOp = g.keys[1];
  let keyRecover = g.keys[2];
  let keyRevoke = g.keys[3];

  document.getElementById('keyAddressOp-result').innerHTML = g.keyAddressOp;
  document.getElementById('keyPublicOp-result').innerHTML = keyPublicOp;
  document.getElementById('keyRecover-result').innerHTML = keyRecover;
  document.getElementById('keyRevoke-result').innerHTML = keyRevoke;

  // create a new id object
  g.id = new iden3.Id(keyPublicOp, keyRecover, keyRevoke, relay, servers.relayAddr, nameServer,
    notificationServer, '', undefined, 0);
  g.id.createId()
  .then((createIdRes) => {
    // Successfull create identity api call to relay
    console.log(createIdRes.idAddr); // Identity counterfactoual address

    const idAddr = createIdRes.idAddr;
    document.getElementById('idaddr-result').innerHTML = idAddr;
    document.getElementById('idaddr-header').innerHTML = idAddr;

    g.proofKSign = createIdRes.proofClaim;
    document.getElementById('proofClaimOperationalKey-result').innerHTML = JSON.stringify(g.proofKSign);
    console.log(g.proofKSign); // Proof of claim regarding authorization of key public operational
    console.log('Create and authorize new key for address');

    toastr.success('New wallet created');
    saveG();
  })
  .catch((err) => {
    toastr.error(err);
    console.error(err.response.data);
  });
}

function printKeys(keys) {
  let html = '';
  for(let i=0; i<keys.length; i++) {
    html += `<textarea rows="1" cols="80" class="textarea-blue col-sm-9" onclick="selectAndCopy(this)" readonly="readonly">`
    + keys[i] + `</textarea>`;
  }
  document.getElementById('keysBox').innerHTML = html;
}

function newKey() {
  const passphrase = getPassphrase();;
  kc.unlock(passphrase);
  const keyLabel = 'testKey' + g.keys.length;
  try {
    const newKey = g.id.createKey(kc, keyLabel, true);
    g.keys.push(newKey);
    printKeys(g.keys);
    saveG();
    toastr.success("New key created");
  } catch(err) {
    console.error(err);
    toastr.error("Error with passphrase");
  }
}

function assignName() {
  const passphrase = getPassphrase();;
  kc.unlock(passphrase);
  // bind the identity address to a label. It send required data to name-resolver service and name-resolver issue a claim 'assignName' binding identity address with label
  const idName = document.getElementById('nameInput').value;
  g.id.bindId(kc, g.id.keyOperationalPub, g.proofKSign, idName)
    .then((bindRes) => {
      console.log(bindRes.data);
      g.proofEthName = bindRes.data;
      document.getElementById('assignName-result').innerHTML = JSON.stringify(g.proofEthName);
      toastr.success("Assign name success");
      g.idName = idName;
      saveG();
      // request idenity address to name-resolver ( currently name-resolver service is inside relay) from a given label
      g.id.nameServer.resolveName(`${idName}@iden3.io`) // TODO: Don't use hardcoded domain
        .then((resolveRes) => {
          const idAddress = resolveRes.data.idAddr;
          console.log(`${idName}@iden3.io associated with addres: ${idAddress}`); // TODO: Don't use hardcoded domain
        })
        .catch((err) => {
          toastr.error(err);
          console.error(err.response.data);
        });
    })
    .catch((err) => {
      toastr.error(err);
      console.error(err.response.data);
    });
}

function login() {
  let signatureRequest = document.getElementById('qr-login-input').value;
  console.log(signatureRequest);

  const date = new Date();
  const unixtime = Math.round((date).getTime() / 1000);
  const expirationTime = unixtime + (3600 * 60);
  let ksign = id.keyOperationalPub;
  // TODO: Don't use hardcoded domain
  const signedPacket = iden3.protocols.login.signIdenAssertV01(signatureRequest, g.id.idAddr,
    `${idName}@iden3.io`, g.proofEthName.proofClaimAssignName, kc, ksign, g.proofKSign, expirationTime);
  return axios.post(`${signatureRequest.url}/login`, { signedPacket: signedPacket, });
}

function appReset() {
  localStorage.clear();
  location.reload();
}

// Notification Tab
function updateNotificationsPanel(){
  let notificationSendIdAddress = document.getElementById('notification-send-idAddress');
  if (notificationSendIdAddress.value === '') {
    notificationSendIdAddress.value = g.id.idAddr;
  }
  let notificationSendContent = document.getElementById('notification-send-content');
  if (notificationSendContent.value === '') {
    notificationSendContent.value = 'Test notification message';
  }
  showNotifications();
}


function sendNotifications(){

}

//
// BACKUP
//
function exportBackup() {
  const passphrase = getPassphrase();;
  kc.unlock(passphrase);
  const lsEncrypted = db.exportWallet(kc);
  console.log(lsEncrypted);
  document.getElementById('exportedBackup').innerHTML = lsEncrypted;
  toastr.info("Backup exported");
}

function importBackup() {
  const passphrase = getPassphrase();;
  kc.unlock(passphrase);
  let seedBackup = document.getElementById('masterSeed-input').value;
  let toImport = document.getElementById('importBackup').value;
  const ack = db.importWallet(seedBackup, kc, toImport);
  if (!ack) {
    toastr.error('Error importing backup');
  } else {
    toastr.success("Backup imported");
    setTimeout(function(){
      location.reload();
    }, 500);
  }
}

function loadBackupServer() {
  const backupUrl = document.getElementById("backup-server-url").value;
  const username = document.getElementById("backup-server-username").value;
  const password = document.getElementById("backup-server-password").value;
  g.backupServer = new iden3.Backup(backupUrl, username, password, true);
  saveG();
  toastr.info('Backup servers loaded');
}

function registerBackup() {
  g.backupServer.register().then((res) => {
    console.log("res", res);
    console.log("Backup register success");
    toastr.success("Backup register success");
  }).catch((err) => {
    toastr.error(err);
    console.error(err.response.data);
  });
}

function uploadBackup() {
  const passphrase = getPassphrase();;
  kc.unlock(passphrase);
  const lsEncrypted = db.exportWallet(kc);

  g.backupServer.upload(lsEncrypted).then((res) => {
    console.log("res", res);
    console.log("Backup upload success");
    toastr.success("Backup upload success");
  }).catch((err) => {
    toastr.error(err);
    console.error(err.response.data);
  });
}

function downloadBackup() {
  if (document.getElementById('masterSeed-input').value=="") {
    console.log("No seed specified");
    toastr.error("No seed specified");
    return;
  }

  g.backupServer.download().then((res) => {
    console.log("res", res);
    console.log("Backup download success");
    toastr.success("Backup download success");
    const passphrase = getPassphrase();;
    kc.unlock(passphrase);
    let seedBackup = document.getElementById('masterSeed-input').value;
    let toImport = document.getElementById('importBackup').value;
    const ack = db.importWallet(seedBackup, kc, res.data.backup);
    if (!ack) {
      console.error('Error importing backup');
      toastr.error('Error importing backup');
    } else {
      toastr.success("Backup imported");
      setTimeout(function(){
        location.reload();
      }, 500);
    }
  }).catch((err) => {
    toastr.error(err);
    console.error(err.response.data);
  });
}

// Helper function to add an entry to a list and scroll the list.
function appendList(listId, head1, head2, body) {
  const list = document.getElementById(listId);

  let entry = document.createElement('div');
  entry.className += "list-group-item list-group-item-action flex-column align-items-start p-2 list-group-item-light";
  let div = document.createElement('div');
  entry.innerHTML =`
<div class="d-flex w-100 justify-content-between">
  <small>${head1}</small>
  <small>${head2}</small>
</div>
<p class="mb-1">${body}</p>`;

  list.appendChild(entry);
  list.scrollTo(0, list.scrollTopMax);

  return entry;
}

function sendNotifications() {
  const notificationSendIdAddress = document.getElementById('notification-send-idAddress').value;
  const notificationSendContent = document.getElementById('notification-send-content').value;

  const notificationSentList = document.getElementById('notification-sent-list');

  let entry = appendList('notification-sent-list', `To <b>${notificationSendIdAddress}</b>`,
    new Date().toLocaleTimeString(), notificationSendContent);
  g.id.notificationServer.postNotification(notificationSendIdAddress, notificationSendContent)
    .then((res) => {
      entry.classList.remove('list-group-item-light');
      entry.classList.add('list-group-item-success');
    }).catch((err) => {
      toastr.error(err);
      entry.classList.remove('list-group-item-light');
      entry.classList.add('list-group-item-danger');
      console.error(err.response.status, err.response.statusText);
    });
}

function loginNotifications() {
  const passphrase = getPassphrase();;
  kc.unlock(passphrase);

  const elemToken = document.getElementById('notification-auth-token');
  elemToken.value = '...';
  g.id.loginNotificationServer(g.proofEthName, kc, g.id.keyOperationalPub, g.proofKSign)
  .then((res) => {
    elemToken.value = res.data.token;
    toastr.success("Successfull login");
    saveG();
  })
  .catch((err) => {
    toastr.error(err);
    elemToken.value = `Error: ${err.response.data}`;
    console.error(err.response.status, err.response.data);
  });
}

function showNotifications() {
  if (g.notifications == null) {
    return;
  }
  const list = document.getElementById('notification-recv-list');
  list.innerHTML = ''
  // WTF, js doesn't sort numbers using number comparison!
  const ids = Object.keys(g.notifications).map(s => Number(s)).sort((a, b) => a - b);
  ids.forEach((id) => {
    appendList('notification-recv-list', id, '-', g.notifications[id]);
  });
}

// Ask to notification server for last 10 notifications
function getNotifications() {
  if (g.notifications == null) {
    g.notifications = {};
    g.notificationLastId = 0;
  }
  g.id.getNotifications(0, g.notificationLastId)
    .then((res) => {
      const notifications = res.data.notifications;
      if (notifications == null) {
        toastr.info("No new notifications");
        return
      }
      notifications.forEach((notif) => {
        g.notifications[notif.id] = notif.data;
        if (notif.id > g.notificationLastId) {
          g.notificationLastId = notif.id;
        }
      });
      showNotifications();
      saveG();
    })
    .catch((err) => {
      toastr.error(err);
      console.error(err.response.data);
    });
}

// Delete last 10 notifications
function deleteNotifications(){

}

// const hello = await axiosGetDebug(`${loginUrl}/auth/hello`, { headers: { Authorization: `Bearer ${token.data.token}` } });
