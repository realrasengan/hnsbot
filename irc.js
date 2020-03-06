// MIT Licensed etc.

const request = require('request');
const irc = require('irc');
const {NodeClient} = require('hs-client');
const {Network} = require('hsd');
const network = Network.get('main');

const clientOptions = {
  network: network.type,
  port: network.rpcPort,
  apiKey: 'keygoeshere'
}

const nodeclient = new NodeClient(clientOptions);

let client = new irc.Client('irc.freenode.net', 'nicknamegoeshere'', {
  userName: "username",
  realName: "handshake bot",
  channels: ['#somechannel'],
  //secure: true,
//  sasl: true,
  //password: "can uncomment sasl and put password here"
});
client.addListener('raw',function(msg) {
  console.dir(msg);
});
client.addListener('message#',async function(sender,target,text) {
  if(target=="#handshake") {
    let message=text.split(" ");
    if(message[0]=="hns") {
      switch(message[1].toUpperCase()) {
        case "INFO":
          if(message[2]=="" || message[2]==null) {
            result = await nodeclient.execute('getinfo');
            request('https://api.coingecko.com/api/v3/coins/handshake',{json:true},function(err,res,body) {
              if(err)
                return;
              else
                client.say(target,"Handshake is currently at block "+result.blocks+" with difficulty "+result.difficulty+".  Currently, a single HNS coin is worth $"+body.market_data.current_price.usd);
            });
          }
          else {
            result = await nodeclient.execute('getnameinfo', [ message[2] ]);
            if(result.start.reserved) {
              client.say(target,message[2]+" was pre-reserved");
            }
            else if(result.info==null) {
              client.say(target,message[2]+" will be available at block "+result.start.start);
            }
            else {
              switch(result.info.state) {
                case "CLOSED":
                  addressresult = await nodeclient.getCoin(result.info.owner.hash, result.info.owner.index);
                  address=addressresult.address;
                  client.say(target,message[2]+" was purchased for "+result.info.value/1000000
                                              +" HNS by "+address+" and started at block " + result.info.stats.renewalPeriodStart + " and must be renewed before block "+result.info.stats.renewalPeriodEnd);
                  break;
                case "REVEAL":
                  addressresult = await nodeclient.getCoin(result.info.owner.hash, result.info.owner.index);
                  address=addressresult.address;
                  client.say(target,message[2]+"'s auction started at block "+result.info.height+" and is in reveal since block "+result.info.stats.revealPeriodStart+" with current highest bidder "
                                              +address+". The current 2nd highest bid is "+result.info.value/1000000+" HNS and the reveal will end at block "+result.info.stats.revealPeriodEnd);
                  break;
                case "BIDDING":
                  client.say(target,message[2]+" was opened for auction at block "+result.info.height+" and has been open for bids since block "+result.info.stats.bidPeriodStart+" and the bidding will end at block "+result.info.stats.bidPeriodEnd);
                  break;
                case "OPENING":
                  client.say(target,message[2]+" has been opening since block " + result.info.stats.openPeriodStart + " and bidding will start at block "+result.info.stats.openPeriodEnd);
                  break;
              }
            }
          }
          break;
      }
    }
  }
});

