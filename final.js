var canvas = document.getElementById('myCanvas');
var gl = canvas.getContext('webgl');

var startTimeInSeconds = new Date().getTime()
startTimeInSeconds = startTimeInSeconds/1000;

const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

const fragmentShaderSource = `
precision highp float;

uniform vec2 u_canvasSize;
uniform float u_time;
uniform float u_freqParam1;
uniform float u_freqParam2;
uniform float u_freqParam3;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float noise(vec3 P) {
    vec3 i0 = mod289(floor(P)), i1 = mod289(i0 + vec3(1.0));
    vec3 f0 = fract(P), f1 = f0 - vec3(1.0), f = fade(f0);
    vec4 ix = vec4(i0.x, i1.x, i0.x, i1.x), iy = vec4(i0.yy, i1.yy);
    vec4 iz0 = i0.zzzz, iz1 = i1.zzzz;
    vec4 ixy = permute(permute(ix) + iy), ixy0 = permute(ixy + iz0), ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 * (1.0 / 7.0), gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    vec4 gx1 = ixy1 * (1.0 / 7.0), gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0); gx1 = fract(gx1);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0), sz0 = step(gz0, vec4(0.0));
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1), sz1 = step(gz1, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g0 = vec3(gx0.x,gy0.x,gz0.x), g1 = vec3(gx0.y,gy0.y,gz0.y),
        g2 = vec3(gx0.z,gy0.z,gz0.z), g3 = vec3(gx0.w,gy0.w,gz0.w),
        g4 = vec3(gx1.x,gy1.x,gz1.x), g5 = vec3(gx1.y,gy1.y,gz1.y),
        g6 = vec3(gx1.z,gy1.z,gz1.z), g7 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g0,g0), dot(g2,g2), dot(g1,g1), dot(g3,g3)));
    vec4 norm1 = taylorInvSqrt(vec4(dot(g4,g4), dot(g6,g6), dot(g5,g5), dot(g7,g7)));
    g0 *= norm0.x; g2 *= norm0.y; g1 *= norm0.z; g3 *= norm0.w;
    g4 *= norm1.x; g6 *= norm1.y; g5 *= norm1.z; g7 *= norm1.w;
    vec4 nz = mix(vec4(dot(g0, vec3(f0.x, f0.y, f0.z)), dot(g1, vec3(f1.x, f0.y, f0.z)),
        dot(g2, vec3(f0.x, f1.y, f0.z)), dot(g3, vec3(f1.x, f1.y, f0.z))),
        vec4(dot(g4, vec3(f0.x, f0.y, f1.z)), dot(g5, vec3(f1.x, f0.y, f1.z)),
            dot(g6, vec3(f0.x, f1.y, f1.z)), dot(g7, vec3(f1.x, f1.y, f1.z))), f.z);
    return 2.2 * mix(mix(nz.x,nz.z,f.y), mix(nz.y,nz.w,f.y), f.x);
}
float noise(vec2 P) { return noise(vec3(P, 0.0)); }

vec2 normalizeByWidth(vec2 P) {
    return P / u_canvasSize.x;
}

float turbulence(vec3 P) {
    float f = 0., s = 1.;
    for (int i = 0 ; i < 9 ; i++) {
        f += abs(noise(s * P)) / s;
        s *= 2.;
        P = vec3(.866 * P.x + .5 * P.z, P.y + 100., -.5 * P.x + .866 * P.z);
    }
    return f;
}

vec3 clouds(float x, float y) {
    float L = turbulence(vec3(x, y, u_time * .1 + 0.5*u_freqParam2/255. ));
    return vec3(noise(vec3(u_freqParam2/255., 0.5, L) * 0.7));
}

void main() {
    vec3 color;
    vec2 vPosition = normalizeByWidth(gl_FragCoord.xy);
    float x = vPosition.x;
    float y = vPosition.y;

    vec3 cloudEffect = clouds(vPosition.x, vPosition.y);
    color = cloudEffect + vec3(0.6, u_freqParam1/255., u_freqParam3/255.);
    gl_FragColor = vec4(color, 1.);
}
`

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

var program = createProgram(gl, vertexShader, fragmentShader);

//uniform locations
var positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
var canvasSizeUniformLocation = gl.getUniformLocation(program, "u_canvasSize");
var timeUniformLocation = gl.getUniformLocation(program, "u_time");

//create the buffer
var positionBuffer = gl.createBuffer();

function setCanvasDimensions(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
    
    //set the time uniform
    let currentTimeInSeconds = new Date().getTime()
    currentTimeInSeconds = currentTimeInSeconds/1000;
    gl.uniform1f(timeUniformLocation, currentTimeInSeconds - startTimeInSeconds);

    //set the frequency parameter uniforms
    analyser.getByteFrequencyData(frequencyData);
    let groupedFrequencyData = makeGroupedFrequencyData(3);
    let freqParam1 = frequencyData[0];
    let freqParam2 = frequencyData[1];
    let freqParam3 = frequencyData[2];
    gl.uniform1f(gl.getUniformLocation(program, "u_freqParam1"), freqParam1);
    gl.uniform1f(gl.getUniformLocation(program, "u_freqParam2"), freqParam2);
    gl.uniform1f(gl.getUniformLocation(program, "u_freqParam3"), freqParam3);


    var primitiveType = gl.TRIANGLES;
    var count = 6;

    gl.drawArrays(primitiveType, offset, count);

}

function main(){
    setCanvasDimensions();
    placeDataInBuffer();
    drawScene();
}

const data = null;

const xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener('readystatechange', function () {
    if (this.readyState === this.DONE) {
        const response = JSON.parse(this.responseText);
        const audioUrl = response.preview;

        const audioTag = document.getElementById('audio');
        audioTag.src = audioUrl;

        // Create a new Audio object and start playing the audio
        // const audio = new Audio(audioUrl);
        // audio.play();
    }
});

xhr.open('GET', 'https://deezerdevs-deezer.p.rapidapi.com/track/2459517655');
xhr.setRequestHeader('X-RapidAPI-Key', '72a07891a0mshf0b1eaca04b5b16p152df9jsn8502a0d17c56');
xhr.setRequestHeader('X-RapidAPI-Host', 'deezerdevs-deezer.p.rapidapi.com');

xhr.send(data);

// Create a new AudioContext
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Create an audio source from the audio tag
const audioElement = document.getElementById('audio');
const audioSource = audioContext.createMediaElementSource(audioElement);

// Create a new analyser node
const analyser = audioContext.createAnalyser();

// Connect the audio source to the analyser
audioSource.connect(analyser);

// Also connect the audio source to the audio context's destination
audioSource.connect(audioContext.destination);

audioElement.addEventListener('play', function() {
    audioContext.resume().then(() => {
        // console.log('Playback resumed successfully');
    });
});

// Use the analyser node to get the frequency data
var frequencyData = new Uint8Array(analyser.frequencyBinCount);

function makeGroupedFrequencyData(numBars){
    let dataPointsPerBar = Math.floor(frequencyData.length / numBars);
    let groupedFrequencyData = [];
    for (let i = 0; i < numBars; i++){
        let sum = 0;
        for (let j = 0; j < dataPointsPerBar; j++){
            sum += frequencyData[i*dataPointsPerBar + j];
        }
        groupedFrequencyData.push(sum);
    }
    return groupedFrequencyData;
}


setInterval(main, 1000/60);



