// Keep track of our socket connection
var socket;
var img;
var load = false;
var lastClick = 0;

function preload() {
  img = loadImage("img5.png");
}

 
function setup() {
  createCanvas(1236, 901);
  //background(0);
  image(img,0,0,1236,901);
}

function draw() {
  drawGrid();
  socket = io.connect('52.24.24.27');
  
  socket.on('mouse',
    // When we receive data
    function(data) {
      console.log("Got: " + data.x + " " + data.y);
      // Draw a blue circle
      fill(89, 171, 227);
      noStroke();
      ellipse(data.x,data.y,16,16);
    }
  );

  socket.on('drawMap',


    // When we receive data
    function(data2) {
      console.log("Got: " + data2.x + " " + data2.y);
      // Draw a blue circle
      fill(data2.red,data2.green, data2.blue);
      noStroke();
      ellipse(data2.x,data2.y,16,16);
    }
  );

  socket.on('refresh', function() {
    image(img,0,0,1236,901);
  });
}

var touchStarted = mousePressed = function() {
  var clickTime = new Date().getTime();
  
  if (lastClick == 0) {
    lastClick = clickTime - 40000;
  }

  if (!(clickTime - lastClick > 30000)) {
    return;
  }

  else {
    lastClick = clickTime;
  }


 // using or (`||`) means `x` and `y` will be set to whichever value is non-zero
 // on desktop they will take the `mouseX/Y` values, on mobile the `touchX/Y` values
 var x = mouseX || touchX;
 var y = mouseY || touchY;
 if(mousePressed && touchStarted && x < 1236 && y < 501){
  fill(89,171, 227);
  noStroke();
  ellipse(x, y, 16, 16);

  sendmouse(x,y);

}
};




// Function for sending to the socket
function sendmouse(xpos, ypos) {
  // We are sending!
  console.log("sendmouse: " + xpos + " " + ypos);
  
  // Make a little object with  and y
  var data = {
    x:xpos,y:ypos
  };

  // Send that object to the socket
  socket.emit('mouse',data);
}

function drawGrid() {
  fill(255);
  stroke(190, 192, 195);
  //strokeWeight(2);
  rect(0,501,1236,100);
  fill(255);
  stroke(190, 192, 195);
  rect(0,601,1236,100);
  fill(255);
  stroke(190, 192, 195);
  rect(0,700,1236,100);

  fill(255);
  rect(75,721,1100,55);
  fill(52, 152, 219)
  rect(1185,730,35,40);
  textSize(10);
  fill(255);
  stroke(255);
  text("Enter",1190,745);

  stroke(0);
  fill(0);


  text("Chat",10,750);

  textSize(40);
  text("USFpark",10,570);

  stroke(0);
  textSize(10);

  text("Time",10,650);
  text("0-1",100,650);
  text("1-3",200,650);
  text("3+",300,650);

  fill(52, 152, 219);
  ellipse(150,650,16,16);
  fill(255, 255, 0);

  ellipse(250,650,16,16);
  fill(255,0,0);
  ellipse(350,650,16,16);

  stroke(255);
  fill(255);
}
