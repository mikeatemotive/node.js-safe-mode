//  safe mode tests.
// 
"use strict";

var assert = require('assert');
var dgram = require("dgram");
var fs = require('fs')
var net = require('net');

var fname = "file1.txt";
var data = "foo\n";

fs.writeFileSync(fname, data);
assert.equal(fs.readFileSync("file1.txt"), data);
var stats = fs.statSync(".");
stats = fs.statSync(fname);
assert.throws(function() {
     fs.statSync("..");
});
assert.throws(function() {
     fs.statSync("../bad");
});
assert.throws(function() {
     fs.statSync("/usr/local");
});
assert.throws(function() {
    fs.writeFileSync("../" + fname, data);
});

var good_tcp_port = process.argv[2];
var good_udp_port = process.argv[3];
var bad_tcp_port = process.argv[4];
var bad_udp_port = process.argv[5];
var uds_name = process.argv[6];

var uds_server_error = false;
var tcp_client_error = false;
var udp_client_error = false;

// cannot create a UDS server
var server = net.createServer(function(c) { 
    throw new Error("Should not be able to connect");
    c.on('end', function() {
    });
});
server.on('error', function(err) {
    uds_server_error = true;
    assert.equal(err.errno, "EPERM");
});
server.listen(uds_name, function() {
});

// cannot connect to blocked TCP port
var client1 = net.connect({port: bad_tcp_port}, function() { 
    throw new Error("Should not be able to connect");
});
client1.on('data', function(data) {
});
client1.on('error', function(err) {
    assert.equal(err.errno, "EPERM");
    tcp_client_error = true;
});
client1.on('end', function() {
});

// Cannot connect to blocked UDP port
var message2 = new Buffer("Some bytes");
var client2 = dgram.createSocket("udp4");
client2.send(message2, 0, message2.length, bad_udp_port, "localhost", function(err, bytes) {
    assert.equal(err.errno, "EPERM");
    client2.close();
    udp_client_error = !!err;
});

// Can connect to good TCP port
var result3 = "";
var client3 = net.connect({port: good_tcp_port}, function() { 
    client3.write('world');
});
client3.on('data', function(data) {
    result3 += data.toString();
    client3.end();
});
client3.on('error', function(err) {
});
client3.on('end', function() {
    assert.equal(result3, "hello, world");
});

// Can connect to good UDP port
var filename = "udpmessage.txt";
var message4 = new Buffer(filename);
var client4 = dgram.createSocket("udp4");
client4.send(message4, 0, message4.length, good_udp_port, "localhost", function(err, bytes) {
    assert.ifError(err);
    client4.close();
    setTimeout(function() {
        var data = fs.readFileSync(filename);
        assert.equal(data, "Message received\n");
  }, 2000);
});

// check that all errors were trigggered as expected
setTimeout(function() {
    assert.equal(uds_server_error, true);
    assert.equal(tcp_client_error, true);
    assert.equal(udp_client_error, true);
}, 5000);

