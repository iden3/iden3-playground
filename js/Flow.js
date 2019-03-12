// Flow Zero-Knowledge proof
// Globals objects
let identityFlow = undefined;
let dbFlow = undefined;
let kcFlow = undefined;
// Global services
const relayAddrFlow = '0xe0fbce58cfaa72812103f003adce3f284fe5fc7c';
let relayFlow = undefined;
let nameFlow = undefined;
let notFlow = undefined;
// Global variables
let proofKSignFlow = undefined;
let proofEthNameFlow = undefined;

function loadObjects() {
  dbFlow = new iden3.Db();
  kcFlow = new iden3.KeyContainer('localStorage', dbFlow);
  relayFlow = new iden3.Relay('http://127.0.0.1:8000/api/unstable');
  nameFlow = new iden3.NameServer('http://127.0.0.1:7000/api/unstable');
  notFlow = new iden3.NotificationServer('http://127.0.0.1:10000/api/unstable');
}

function updateZkFlow() {
  // Manage buttons
  document.getElementById("but_1").disabled = false;
  document.getElementById("but_2").disabled = true;
  document.getElementById("but_3").disabled = true;
  document.getElementById("but_4").disabled = true;
  document.getElementById("but_5").disabled = true;
  document.getElementById("but_6").disabled = true;
  document.getElementById("but_7").disabled = true;
  let i = 0;
  for(i = 1; i < 8; i++) {
    const str = `progress_${i}`;
    updateProgress(str,'',0);
  }
  identityFlow = undefined;
  loadObjects();
} 

// Step 1 --> Create identity and bind to a name
async function flow_1() {
  try {
    // Actions required and update progress bar
    // Create keys for identity
    updateProgress('progress_1', 'create keys', 25);
    kcFlow.unlock('');
    kcFlow.generateMasterSeed();
    const keys = kcFlow.createKeys();
    await sleep(1500);
    // Create Identity
    updateProgress('progress_1', 'create identity', 50);
    identityFlow = new iden3.Id(keys[1], keys[2], keys[3], relayFlow, relayAddrFlow, nameFlow, notFlow, '', undefined, 0);
    const resCreate = await identityFlow.createId();
    proofKSignFlow = resCreate.proofClaim;
    await sleep(1500);
    // Bind it to a name
    const name = randomName();
    updateProgress('progress_1', 'bind it to name', 75);
    const resBind = identityFlow.bindId(kcFlow, identityFlow.keyOperationalPub ,proofKSignFlow, name);
    proofEthNameFlow = resBind.data;
    await sleep(1500);
    updateProgress('progress_1', 'finish step 1', 100);
    // Manage buttons
    document.getElementById("but_1").disabled = true;
    document.getElementById("but_2").disabled = false;
    kcFlow.lock();
  } catch (error) {
    console.log(error);
  }
}

// Step 2 --> Send information to claim server
async function flow_2() {
  try {
    // Information which needs to be send to claim server
    // object identifier hash, identity address, identity notification server
    const dataToClaimServer = {
      hashFlow: iden3.utils.bytesToHex(iden3.utils.hashBytes('this is an object')),
      idAddr: identityFlow.idAddr,
      notificationServerUrl: identityFlow.notificationServer.url,
    }
    console.log(dataToClaimServer);
    // Manage buttons
    document.getElementById("but_2").disabled = true;
    document.getElementById("but_3").disabled = false;
  } catch (error) {
    console.log(error);
  }
}

// Step 3 --> Send claim to notification server
async function flow_3() {
  // Manage buttons
  document.getElementById("but_3").disabled = true;
  document.getElementById("but_4").disabled = false;
}

// Step 4 --> Get claim from notification server
async function flow_4() {
  // Manage buttons
  document.getElementById("but_4").disabled = true;
  document.getElementById("but_5").disabled = false;
}

// Step 5 --> Generate Zk proof of the claim
async function flow_5() {
  // Manage buttons
  document.getElementById("but_5").disabled = true;
  document.getElementById("but_6").disabled = false;;
}

// Step 6 --> Send Zk proof to gas station
async function flow_6() {
  // Manage buttons
  document.getElementById("but_6").disabled = true;
  document.getElementById("but_7").disabled = false;
}

// Step 7 --> Check Zk smart contract validation
async function flow_7() {
  // Manage buttons
  document.getElementById("but_7").disabled = true;
}

function updateProgress(id, text, percentage) {
  document.getElementById(id).style = `width: ${percentage}%`;
  document.getElementById(id).innerHTML = text;
}