const relayAddr = '0xe0fbce58cfaa72812103f003adce3f284fe5fc7c';
// const relayUrl = 'http://127.0.0.1:8000/api/unstable';
const relayUrl = 'https://relay.iden3.io/api/unstable';
const relay = new iden3.Relay(relayUrl);

// new database
const db = new iden3.Db();
// new key container using localStorage
const kc = new iden3.KeyContainer('localStorage', db);
let passphrase = '';
let id = {};
let idName = '';
let proofKSign = {};
let proofEthName = {};
let keyAddressOp = '';
let keyPublicOp = '';
let keyRecover = '';
let keyRevoke = '';

function newWallet() {
  passphrase = document.getElementById('passphrase').value;
  console.log('passphrase', passphrase);
  kc.unlock(passphrase);
  // generate master seed
  kc.generateMasterSeed();
  masterSeed = kc.getMasterSeed();
  document.getElementById('masterSeed-result').innerHTML = masterSeed;
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


  // create a new id object
  id = new iden3.Id(keyPublicOp, keyRecover, keyRevoke, relay, relayAddr, '', undefined, 0);
  id.createID()
  .then((createIdRes) => {
    // Successfull create identity api call to relay
    console.log(createIdRes.idAddr); // Identity counterfactoual address

    document.getElementById('idaddr-result').innerHTML = createIdRes.idAddr;
    proofKSign = createIdRes.proofClaim;
    document.getElementById('proofClaimOperationalKey-result').innerHTML = JSON.stringify(proofKSign);
    console.log(proofKSign); // Proof of claim regarding authorization of key public operational
    console.log('Create and authorize new key for address');
  })
  .catch((error) => {
    console.error(error.message);
  });
}

function assignName() {
  console.log(id);
  kc.unlock(passphrase);
  // console.log('Bind label to an identity');
  // bind the identity address to a label. It send required data to name-resolver service and name-resolver issue a claim 'assignName' binding identity address with label
  idName = document.getElementById('nameInput').value;
  id.bindId(kc, idName)
    .then((bindRes) => {
      console.log(bindRes.data);
      proofEthName = bindRes.data;
      // request idenity address to name-resolver ( currently name-resolver service is inside relay) from a given label
      relay.resolveName(`${idName}@iden3.io`)
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
