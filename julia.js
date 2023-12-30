//initialize the canvas and WebGL2 context
var canvas = document.getElementById("myCanvas");
var gl = canvas.getContext("webgl2");

//create the shaders
var vertexShaderSource = document.getElementById('vertex-shader-2d').text;
var fragmentShaderSource = document.getElementById('fragment-shader-2d').text;

var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

//create the program
var program = createProgram(gl, vertexShader, fragmentShader);

//uniform locations
var positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
var mouseLocationUniformLocation = gl.getUniformLocation(program, "u_mouseLocation");
var canvasSizeUniformLocation = gl.getUniformLocation(program, "u_canvasSize");

//create the buffer
var positionBuffer = gl.createBuffer();

//variables related to the mouse location
var mouseLocation = {x: 0.0, y: 0.0};

window.addEventListener('mousemove', event => {
    mouseLocation = { x: event.clientX, y: event.clientY };
    drawScene();  //redraw the scene when the mouse moves
});

function browserToFragCoords(browserLocation){
    return {x: browserLocation.x, y: gl.canvas.height - browserLocation.y};
}

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success){
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader){
    var program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    var success = gl.getProgramParameter(program, gl.LINK_STATUS);

    if(success){
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function setCanvasDimensions(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function placeDataInBuffer(){
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var positions = [
        -1, -1,
        -1,  1,
         1, -1,
         1, -1,
        -1,  1,
         1,  1
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
}

function drawScene(){
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var size = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;

    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

    //set the canvas size uniform
    gl.uniform2f(canvasSizeUniformLocation, gl.canvas.width, gl.canvas.height);
    
    //set the mouse location uniform
    let mouseFragCoords = browserToFragCoords(mouseLocation);
    gl.uniform2f(mouseLocationUniformLocation, mouseFragCoords.x, mouseFragCoords.y);

    var primitiveType = gl.TRIANGLES;
    var count = 6;

    gl.drawArrays(primitiveType, offset, count);

}

function main(){
    setCanvasDimensions();
    placeDataInBuffer();
    drawScene();
}

main();