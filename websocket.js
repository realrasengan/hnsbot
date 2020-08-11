const he = require('he');
const punycode = require('punycode');

const IRC_SERVER = "irc.imperialfamily.com";
const IRC_NICK = "handshakelive";
const IRC_CHANNELS = ['#handshake-live'];

const request = require('async-request');
const fs = require('fs');
const irc = require('irc');
const net = require('net');

const _b = String.fromCharCode(2);

var express = require('express');
var app = express();
const port = 11111;

app.listen(port, () => console.log('Listening... '+port));


let client = new irc.Client(IRC_SERVER, IRC_NICK, {
  userName: IRC_NICK,
  realName: "Handshake Live",
  channels: IRC_CHANNELS,
});


const {NodeClient} = require('hs-client');
const {Network} = require('hsd');
const network = Network.get('main');
const {TX} = require('hsd');
const {BloomFilter} = require('bfilter');

const nodeOptions = {
  network: network.type,
  port: network.rpcPort,
  apiKey: 'fb46901f7d93eba7b9e37c1164081b90c9e3951ea28478794d921ff80da6ae5b'
}
const nodeClient = new NodeClient(nodeOptions);

(async () => {
  const filter = BloomFilter.fromRate(1, 1, BloomFilter.flags.NONE);
  filter.filter.fill(0xff);  // hack so that everything matches the filter

  try {
    await nodeClient.open();
    await nodeClient.call('set filter', filter.encode());
    await nodeClient.call('watch mempool');
  }
  catch {
    process.exit();
  }
})();

nodeClient.bind('tx', async (raw) => {
  let _tx = TX.fromRaw(raw).hash().toString('hex');
  tx = await nodeClient.getTX(_tx);

  for(x=0;x<tx.outputs.length;x++) {
    address=tx.outputs[x].address;
    value=tx.outputs[x].value;
    price=fs.readFileSync("/home/rasengan/dnslive/coingecko");
    price=parseFloat(price);
    if(tx.outputs[x].covenant.action=='REVEAL') {
     name = Buffer.from(tx.inputs[0].coin.covenant.items[2],'hex').toString('ascii')
     name = he.decode(punycode.toUnicode(name))
     usd = parseFloat((value/1000000)*price).toFixed(2);
     client.say('#handshake-live',address + " REVEALED a BID of "+value/1000000+" HNS ($"+usd+") for "+name);
    }
    else if(tx.outputs[x].covenant.action=='BID') {
     name = Buffer.from(tx.outputs[x].covenant.items[2],'hex').toString('ascii')
     name = he.decode(punycode.toUnicode(name))
     usd = parseFloat((value/1000000)*price).toFixed(2);
     client.say('#handshake-live',address + " BID "+value/1000000+" HNS ($"+usd+") for "+name);
    }
    else if(tx.outputs[x].covenant.action=='OPEN') {
     name = Buffer.from(tx.outputs[x].covenant.items[2],'hex').toString('ascii')
     name = he.decode(punycode.toUnicode(name))
     client.say('#handshake-live',address+" OPENED "+name);
    }
  }
});

