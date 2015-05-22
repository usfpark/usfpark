// HTTP Portion
var http = require('http');
// URL module
var url = require('url');
var path = require('path');

var points = new Queue();
var toYellow = new Queue();
var toRed = new Queue();
var toRemove = new Queue();

// Using the filesystem module
var fs = require('fs');

var server = http.createServer(handleRequest);
server.listen(8080);

console.log('Server started on port 8080');

function handleRequest(req, res) {
  // What did we request?
  var pathname = req.url;
  
  // If blank let's ask for index.html
  if (pathname == '/') {
    pathname = '/index.html';
  }
  
  // Ok what's our file extension
  var ext = path.extname(pathname);

  // Map extension to file type
  var typeExt = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css'
  };

  
  var contentType = typeExt[ext] || 'text/plain';

  // User file system module
  fs.readFile(__dirname + pathname,
    // Callback function for reading
    function (err, data) {
      // if there is an error
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + pathname);
      }
      // Otherwise, send the data, the contents of the file
      res.writeHead(200,{ 'Content-Type': contentType });
      res.end(data);
    }
  );
}


// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(server);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
  // We are given a websocket object in our function
  function (socket) {
  
    var idNumber = socket.id;
    console.log("We have a new client: " + idNumber);

    setInterval(function() {
      if (!points.empty()) {
        var currentTime = new Date().getTime();
        var toUpdate = false;
        var index = -1;

        if (!toYellow.empty()) {
            while (toYellow.head != toYellow.tail && currentTime - toYellow.getPoint(toYellow.head).startTime > 60000) {
                index = toYellow.dequeue().index;
                points.getPoint(index).red = 255;
                points.getPoint(index).green = 255;
                points.getPoint(index).blue = 0;

                console.log(index);
                var data2 = {
                    x:points.getPoint(index).xCoord,y:points.getPoint(index).yCoord,
                    red:points.getPoint(index).red, green:points.getPoint(index).green,
                    blue:points.getPoint(index).blue
                };

                io.sockets.emit('drawMap', data2);
            }
        }

        if (!toRed.empty()) {
            while (toRed.head != toRed.tail && currentTime - toRed.getPoint(toRed.head).startTime > 120000) {
                index = toRed.dequeue().index;
                points.getPoint(index).red = 255;
                points.getPoint(index).green = 0;
                points.getPoint(index).blue = 0;
                console.log(index);

                var data2 = {
                    x:points.getPoint(index).xCoord,y:points.getPoint(index).yCoord,
                    red:points.getPoint(index).red, green:points.getPoint(index).green,
                    blue:points.getPoint(index).blue
                };

                io.sockets.emit('drawMap', data2);
            }
        }

        if (!toRemove.empty()) {
            while (toRemove.head != toRemove.tail && currentTime - toRemove.getPoint(toRemove.head).startTime > 180000) {
                toRemove.dequeue();
                toUpdate = true;
            }
        }

        if (toUpdate) {
            io.sockets.emit('refresh');

            for (var i = points.head; i != points.tail && (currentTime - points.getPoint(i).startTime) >= 180000; i = (i + 1) % points.size) {
                points.dequeue();
                console.log("dequeued")
            }

            for (var i = points.head; i != points.tail; i = (i + 1) % points.size) {
                var data2 = {
                    x:points.getPoint(i).xCoord,y:points.getPoint(i).yCoord,
                    red:points.getPoint(i).red, green:points.getPoint(i).green,
                    blue:points.getPoint(i).blue
                };

                io.sockets.emit('drawMap', data2);

            }
        }


      }
    }, 5000);


    for (var i = points.head; i != points.tail; i = (i + 1) % points.size) {
        var data2 = {
           x:points.getPoint(i).xCoord,y:points.getPoint(i).yCoord,
           red:points.getPoint(i).red, green:points.getPoint(i).green,
           blue:points.getPoint(i).blue
        };

        console.log("Broadcasting: " + data2.x + " " + data2.y);
        io.sockets.emit('drawMap', data2);
    }
    
    // When this user emits, client side: socket.emit('otherevent',some data);
    socket.on('mouse',
      function(data) {
        // Data comes in as whatever was sent, including objects
        console.log("Received: 'mouse' " + data.x + " " + data.y);


        var newPoint = new Point(data.x, data.y, 89, 171, 227);
        points.enqueue(newPoint);
        toYellow.enqueue(newPoint);
        toRed.enqueue(newPoint);
        toRemove.enqueue(newPoint);

        io.sockets.emit('mouse', data);


      }
    );
    
    socket.on('disconnect', function() {
      console.log("Client has disconnected");
    });
  }
);

function Queue() {
  this.size = 10000;
  this.points = [];
  this.head = 0;
  this.tail = 0;

  this.enqueue = function(point) {
    this.points[this.tail] = point;
    this.tail = (this.tail + 1) % this.size;
  }

  this.dequeue = function() {
    if (this.head == this.tail) {
      return null;
    }

    var point = this.points[this.head];
    this.head = (this.head + 1) % this.size;
    return point;
  }

  this.empty = function() {
    return this.head == this.tail;
  }

  this.getPoint = function(index) {
    if (this.head == this.tail)
      return null;
    return this.points[index];
  }
}

function Point(ixCoord, iyCoord, ired, igreen, iblue) {
  this.xCoord = ixCoord;
  this.yCoord = iyCoord;
  this.startTime = new Date().getTime();
  this.red = 89;
  this.green = 171;
  this.blue = 227;
  this.index = points.tail;

  this.getXCoordinate = function() {
    return this.xCoord;
  }

  this.getYCoordinate = function() {
    return this.yCoord;
  }

  this.setXCoordinate = function(axCoord) {
    this.xCoord = axCoord;
  }

  this.setYCoordinate = function(ayCoord) {
    this.yCoord = ayCoord;
  }

  this.setRGBValues = function(ared, agreen, ablue) {
    this.red = ared;
    this.green = agreen;
    this.blue = ablue;
  }
}



