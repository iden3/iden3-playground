// Relay
const relayAddr = '0xe0fbce58cfaa72812103f003adce3f284fe5fc7c';
let relayUrl = 'http://127.0.0.1:8000/api/unstable';
let relay;

// Name server
const nameServerUrl = 'http://127.0.0.1:7000/api/unstable';
// const nameServerUrl = 'https://relay.iden3.io/api/unstable';
const nameServer = new iden3.NameServer(nameServerUrl);

// new database
const db = new iden3.Db();
// new key container using localStorage
const kc = new iden3.KeyContainer('localStorage', db);
let passphrase = '';
passphrase = document.getElementById('kc-passphrase').value;
let id = {};
let idName = '';
let idAddr = '';
let proofKSign = {};
let proofEthName = {};
let keyAddressOp = '';
let keyPublicOp = '';
let keyRecover = '';
let keyRevoke = '';
let keys = [];
let backupService;

if(localStorage.getItem("id")) {
  const idStorage = JSON.parse(localStorage.getItem("id"));
  id = new iden3.Id(idStorage.keyOperationalPub, idStorage.keyRecover, idStorage.keyRevoke, idStorage.relay, idStorage.relayAddr,idStorage.nameServer, '', undefined, 0);
  id.idAddr = idStorage.idAddr;
}
console.log("id", id);
if(localStorage.getItem("keys")) {
  keys = JSON.parse(localStorage.getItem("keys"));
  printKeys(keys);
}
// load wallet from localstorage
document.getElementById('masterSeed-result').innerHTML = localStorage.getItem("masterSeed");
document.getElementById('keyAddressOp-result').innerHTML = localStorage.getItem("keyAddressOp");
document.getElementById('keyPublicOp-result').innerHTML = localStorage.getItem("keyPublicOp");
document.getElementById('keyRecover-result').innerHTML = localStorage.getItem("keyRecover");
document.getElementById('keyRevoke-result').innerHTML = localStorage.getItem("keyRevoke");
document.getElementById('idaddr-result').innerHTML = localStorage.getItem("idAddr");
document.getElementById('idaddr-header').innerHTML = localStorage.getItem("idAddr");
document.getElementById('proofClaimOperationalKey-result').innerHTML = localStorage.getItem("proofKSign");

function loadRelay() {
  relayUrl = document.getElementById('relayUrl').value;
  relay = new iden3.Relay(relayUrl);
  toastr.info('Relay loaded');
}

function newWallet() {
  passphrase = document.getElementById('kc-passphrase').value;
  console.log('passphrase', passphrase);
  kc.unlock(passphrase);
  // generate master seed
  kc.generateMasterSeed();
  masterSeed = kc.getMasterSeed();
  document.getElementById('masterSeed-result').innerHTML = masterSeed;
  localStorage.setItem("masterSeed", masterSeed);
  kc.generateKeyBackUp(masterSeed);
  // Generate keys for first identity
  const keys = kc.createKeys();
  // key[1] that is a pubic key in its compressed form
  keyAddressOp = keys[0];
  keyPublicOp = keys[1];
  keyRecover = keys[2];
  keyRevoke = keys[3];

  document.getElementById('keyAddressOp-result').innerHTML = keyAddressOp;
  document.getElementById('keyPublicOp-result').innerHTML = keyPublicOp;
  document.getElementById('keyRecover-result').innerHTML = keyRecover;
  document.getElementById('keyRevoke-result').innerHTML = keyRevoke;

  localStorage.setItem("keyAddressOp", keyAddressOp);
  localStorage.setItem("keyPublicOp", keyPublicOp);
  localStorage.setItem("keyRecover", keyRecover);
  localStorage.setItem("keyRevoke", keyRevoke);


  // create a new id object
  id = new iden3.Id(keyPublicOp, keyRecover, keyRevoke, relay, relayAddr, nameServer, '', undefined, 0);
  id.createId()
  .then((createIdRes) => {
    // Successfull create identity api call to relay
    console.log(createIdRes.idAddr); // Identity counterfactoual address

    idAddr = createIdRes.idAddr;
    document.getElementById('idaddr-result').innerHTML = idAddr;
    document.getElementById('idaddr-header').innerHTML = idAddr;
    localStorage.setItem("idAddr", idAddr);
    localStorage.setItem("id", JSON.stringify(id));

    proofKSign = createIdRes.proofClaim;
    document.getElementById('proofClaimOperationalKey-result').innerHTML = JSON.stringify(proofKSign);
    localStorage.setItem("proofKSign", JSON.stringify(proofKSign));

    console.log(proofKSign); // Proof of claim regarding authorization of key public operational
    console.log('Create and authorize new key for address');
  })
  .catch((error) => {
    console.error(error.message);
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
  passphrase = document.getElementById('kc-passphrase').value;
  kc.unlock(passphrase);
  const keyLabel = 'testKey' + keys.length;
  try {
    const newKey = id.createKey(kc, keyLabel, true);
    keys.push(newKey);
    printKeys(keys);
    localStorage.setItem("keys", JSON.stringify(keys));
    toastr.success("New key created");
  } catch(err) {
    console.error(err);
    toastr.error("Error with passphrase");
  }
}

function assignName() {
  passphrase = document.getElementById('kc-passphrase').value;
  kc.unlock(passphrase);
  // bind the identity address to a label. It send required data to name-resolver service and name-resolver issue a claim 'assignName' binding identity address with label
  idName = document.getElementById('nameInput').value;
  proofKSignJson = document.getElementById('proofClaimOperationalKey-result').value;
  const proofKSignOpPub = JSON.parse(proofKSignJson);
  console.log(proofKSignOpPub);
  id.bindId(kc, id.keyOperationalPub, proofKSignOpPub, idName)
    .then((bindRes) => {
      console.log(bindRes.data);
      proofEthName = bindRes.data;
      document.getElementById('assignName-result').innerHTML = JSON.stringify(proofEthName);
      toastr.success("Assign name success");
      // request idenity address to name-resolver ( currently name-resolver service is inside relay) from a given label
      nameServer.resolveName(`${idName}@iden3.io`)
        .then((resolveRes) => {
          const idAddress = resolveRes.data.idAddr;
          console.log(`${idName}@iden3.io associated with addres: ${idAddress}`);
        })
        .catch((error) => {
          console.error(error.message);
        });
    })
    .catch((error) => {
      console.error(error.message);
    });
}

function login() {
  let signatureRequest = document.getElementById('qr-login-input').value;
  console.log(signatureRequest);

  const date = new Date();
  const unixtime = Math.round((date).getTime() / 1000);
  const expirationTime = unixtime + (3600 * 60);
  let ksign = keyPublicOp;
  const signedPacket = iden3.protocols.login.signIdenAssertV01(signatureRequest, id.idAddr, `${idName}@iden3.io`, proofEthName.proofClaimAssignName, kc, ksign, proofKSign, expirationTime);
  return axios.post(`${signatureRequest.url}/login`,
      {
        signedPacket: signedPacket,
      });
}

function appReset() {
  localStorage.clear();
  location.reload();
}


// Notification Tab
function updateNotificationsPanel(){
  const notificationsAddr = localStorage.getItem("idAddr");
  if(notificationsAddr) {
    document.getElementById('notification-idAddress').innerHTML = "Send notifications to address: " + localStorage.getItem("idAddr");
  }
  else {
    document.getElementById('notification-idAddress').innerHTML = "There is no address to send notifications";
  }
}

function sendNotifications(){

}

//
// BACKUP
//
function exportBackup() {
    passphrase = document.getElementById('kc-passphrase').value;
    kc.unlock(passphrase);
    const lsEncrypted = db.exportWallet(kc);
    console.log(lsEncrypted);
    document.getElementById('exportedBackup').innerHTML = lsEncrypted;
    toastr.info("Backup exported");
}

function importBackup() {
    passphrase = document.getElementById('kc-passphrase').value;
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

function registerBackup() {
  backupUrl = document.getElementById("backupUrl").value;
  username = document.getElementById("backupUsername").value;
  password = document.getElementById("backupPassword").value;
  backupService = new iden3.Backup(backupUrl, username, password, true);
  backupService.register().then((res) => {
    console.log("res", res);
    console.log("Backup register success");
    toastr.success("Backup register success");
  });

}

function uploadBackup() {
  passphrase = document.getElementById('kc-passphrase').value;
  kc.unlock(passphrase);
  const lsEncrypted = db.exportWallet(kc);


  backupUrl = document.getElementById("backupUrl").value;
  username = document.getElementById("backupUsername").value;
  password = document.getElementById("backupPassword").value;
  backupService = new iden3.Backup(backupUrl, username, password, true);

  backupService.upload(lsEncrypted).then((res) => {
    console.log("res", res);
    console.log("Backup upload success");
    toastr.success("Backup upload success");

  });

}

function downloadBackup() {
  if (document.getElementById('masterSeed-input').value=="") {
    console.log("No seed specified");
    toastr.error("No seed specified");
    return;
  }

  backupUrl = document.getElementById("backupUrl").value;
  username = document.getElementById("backupUsername").value;
  password = document.getElementById("backupPassword").value;
  backupService = new iden3.Backup(backupUrl, username, password, true);

  backupService.download().then((res) => {
    console.log("res", res);
    console.log("Backup download success");
    toastr.success("Backup download success");
    passphrase = document.getElementById('kc-passphrase').value;
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
  });

// Notification Tab
function updateNotificationsPanel(){
  const notificationsAddr = localStorage.getItem("idAddr");
  if(notificationsAddr) {
    document.getElementById('notification-idAddress').innerHTML = "Send notifications to address: " + localStorage.getItem("idAddr");
  }
  else {
    document.getElementById('notification-idAddress').innerHTML = "There is no address to send notifications";
  }
}

let counter = 0;

function sendNotifications(){
  const notificationList = document.getElementById('notifications-list').innerHTML;
  document.getElementById('notifications-list').innerHTML = notificationList + counter.toString() + "\n"; 
  counter++;
}

const loginUrl = 'http://localhost:9000';
async function loginNotfications(){
  // Ask notification server for 'signedPacket'
  const login = await axiosGetDebug(`${loginUrl}/login`);
  const sigReq = login.data.sigReq;
  // Sign 'signedPacket'
  const date = new Date();
  const unixtime = Math.round((date).getTime() / 1000);
  const expirationTime = unixtime + 60;
  const signedPacket = iden3.protocols.login.signIdenAssertV01(sigReq, id.idAddr, `${name}@iden3.io`, proofEthName.proofAssignName, kc, ksign, proofKSign, expirationTime);
  // Send back to notification server 'signIdenAssert' 
  const token = await axiosPostDebug(`${loginUrl}/login`, {jws: signedPacket});
  // Get Token authentication for notification server
  const tokenString = "expire date: " + (token.data.expire).toString();
  tokenString += "\n" + "token:" + (token.data.token).toString();
}

// Ask to notification server for last 10 notifications
function getNotifications(){

}

// Delete last 10 notifications
function deleteNotifications(){

}

// const hello = await axiosGetDebug(`${loginUrl}/auth/hello`, { headers: { Authorization: `Bearer ${token.data.token}` } });
    
