// create servers for use by safe mode tests.
// 
"use strict";

var net = require('net');
var dgram = require("dgram");
var fs = require('fs');

var good_tcp_port = process.argv[2];
var good_udp_port = process.argv[3];
var bad_tcp_port = process.argv[4];
var bad_udp_port = process.argv[5];

// Good TCP server
var server1 = net.createServer(function(c) { //'connection' listener
  console.log('server1 connected');
  c.on('end', function() {
    console.log('server1 disconnected');
  });
  c.write('hello, ');
  c.pipe(c);
});
server1.listen(good_tcp_port, function() { //'listening' listener
  console.log('server1 bound');
});

// bad TCP server
var server2 = net.createServer(function(c) { //'connection' listener
  console.log('server2 connected');
  c.on('end', function() {
    console.log('server2 disconnected');
  });
  c.write('hello\r\n');
  c.pipe(c);
});
server2.listen(bad_tcp_port, function() { //'listening' listener
  console.log('server2 bound');
});

// Good UDP listener

var server3 = dgram.createSocket("udp4");

server3.on("message", function (msg, rinfo) {
  console.log("server3 got: " + msg + " from " +
    rinfo.address + ":" + rinfo.port);
  fs.writeFileSync(msg.toString(), "Message received\n");  
});

server3.on("listening", function () {
  var address = server3.address();
  console.log("server3 listening " +
      address.address + ":" + address.port);
});

server3.bind(good_udp_port);

// badd UDP listener

var server4 = dgram.createSocket("udp4");

server4.on("message", function (msg, rinfo) {
  console.log("server4 got: " + msg + " from " +
    rinfo.address + ":" + rinfo.port);
  fs.writeFileSync(msg.toString(), "Message received\n");  
});

server4.on("listening", function () {
  var address = server4.address();
  console.log("server4 listening " +
      address.address + ":" + address.port);
});

server4.bind(bad_udp_port);
