const relayAddr = '0xe0fbce58cfaa72812103f003adce3f284fe5fc7c';
const relayUrl = 'http://127.0.0.1:8000/api/unstable';
const relay = new iden3.Relay(relayUrl);

// new database
const db = new iden3.Db();
// new key container using localStorage
const keyContainer = new iden3.KeyContainer('localStorage', db);
let passphrase = 'pass';
let id = {};

function newWallet() {
  keyContainer.unlock(passphrase);
  // generate master seed
  keyContainer.generateMasterSeed();
  masterSeed = keyContainer.getMasterSeed();
  document.getElementById("masterSeed-result").innerHTML = masterSeed;
  // Generate keys for first identity
  const keys = keyContainer.createKeys();
  // key[1] that is a pubic key in its compressed form
  let keyAddressOp = keys[0];
  let keyPublicOp = keys[1];
  let keyRecover = keys[2];
  let keyRevoke = keys[3];

  // create a new id object
  id = new iden3.Id(keyPublicOp, keyRecover, keyRevoke, relay, relayAddr, '', undefined, 0);
  id.createID()
  .then((createIdRes) => {
    // Successfull create identity api call to relay
    console.log(createIdRes.idAddr); // Identity counterfactoual address

    document.getElementById("idaddr-result").innerHTML = createIdRes.idAddr;
    proofKsign = createIdRes.proofClaim;
    document.getElementById("proofClaimOperationalKey-result").innerHTML = JSON.stringify(proofKsign);
    console.log(proofKsign); // Proof of claim regarding authorization of key public operational
    console.log('Create and authorize new key for address');
  })
  .catch((error) => {
    console.error(error.message);
  });
}
function assignName() {
  console.log(id);
  keyContainer.unlock(passphrase);
  // console.log('Bind label to an identity');
  // bind the identity address to a label. It send required data to name-resolver service and name-resolver issue a claim 'assignName' binding identity address with label
  const name = document.getElementById('nameInput').value;
  id.bindId(keyContainer, name)
    .then((bindRes) => {
      console.log(bindRes.data);
      // request idenity address to name-resolver ( currently name-resolver service is inside relay) from a given label
      relay.resolveName(`${name}@iden3.io`)
        .then((resolveRes) => {
          const idAddress = resolveRes.data.idAddr;
          console.log(`${name}@iden3.io associated with addres: ${idAddress}`);
        })
        .catch((error) => {
          console.error(error.message);
        });
    })
    .catch((error) => {
      console.error(error.message);
    });
}
