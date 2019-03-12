let identity = undefined;

onmessage = function (oEvent) {
  if ( identity == undefined ) {
    identity = JSON.parse(oEvent.data);
    console.log(identity.notificationServer);
    console.log('identity object passed to worker');
  }
}
let i = 0;
async function pollNotificationServer() {
  if ( identity != undefined ) {
    // console.log(identity);
    // const resGetNot = await identity.getNotifications();
    console.log(i);
    i =i +1;
    // postMessage(resGetNot.data);
  } else {
    console.log('no worker action is required');
  }
  setTimeout("pollNotificationServer()",5000);
}

function test() {
  console.log('test');
}
pollNotificationServer();