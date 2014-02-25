//------------ Use this portion -------------------------------//
// How to implement your custom graphics:
// 1. Create a javascript file and link it in sound.html (see how
// mygraphics.js is linked for an example). Define your functions in here.
//
// 2. Set initGraphics to equal the name of your init function.
// No parameters are taken, see mygraphics.js for example.
var initGraphics = initFreqBars;

// 3. Set updateGraphics to equal the name of your update function.
// This function must take in a single parameter "array" which is
// the frequency array bin.
// see mygraphics.js for example.
var updateGraphics = drawBars;

//update song to equal the name of the mp3 file you want to play
var song = "audio/three.mp3";

// ------------------------------------------------------------//


// You can basically ignore everything below here //


//         
//     |---|   |---| 
//
//          ||
//
//   __-           ---
//     ---      ---
//       --------
//
	var context;
	var audioBuffer;
	var sourceNode;
	var analyser;
	var javascriptNode;
	var canv;
	var ctx;
	var gradient;
	var canvasWidth;
	var canvasHeight;
	var maxBinCount;
	
	//Beat variables
	var beatCutOff = 0;
	var beatTime = 0;
	var levelHistory = []; //last 256 ave norm levels
	var levelsData = []; //levels of each frequecy - from 0 - 1 . no sound is 0. Array [levelsCount]

	var BEAT_HOLD_TIME = 40; //num of frames to hold a beat
	var BEAT_DECAY_RATE = 0.4;
	var BEAT_MIN = 0.30; //a volume less than this is no beat


function initSound() {
	
	if (! window.AudioContext) {
        if (! window.webkitAudioContext) {
            alert('no audiocontext found');
        }
        window.AudioContext = window.webkitAudioContext;
    }
	context = new AudioContext();
	canv = document.getElementById("canvas");
	ctx = canv.getContext("2d");
	var length = 256;
		for(var i = 0; i < length; i++) {
		    levelHistory.push(0);
		}
	
	initGraphics();
	initNavigator();
	initKeyboardPerf();
	microClick();
}

function initKeyboardPerf() {
	document.onkeydown = function (event) {
		code = event.keyCode;
		if(code == 49) goFullScreen(); // 1
		//else if(code == 67) toggleCircle(); // C
		//else if(code == 68) toggleDoubleBars(); // D
		//else if(code == 70) toggleFluid();// F
		//else if(code == 65) toggleColor(); // A
		//else if(code == 90) toggleFlippedBars(); // Z
		//else if(code == 77) toggleMiddleBars(); // M
		else if(code==190) lowerExpandFactor(); // Period
		else if(code==191) increaseExpandFactor(); // For. Slash
		else if(code==75) lowerRiseFactor(); // Period
		else if(code==76) increaseRiseFactor(); // For. Slash
		//else if(code >=37 && code <=40) catchArrowKey(code); // Arrow Keys
		//else if(code==80) toggleBallDrop(); // P
	}
}


//function to init the canvas element. Should be called from all init methods using the html canvas
	function initCanvas() {
		
		d3.select("svg").remove();
		canvasWidth = window.innerWidth - 5;
		canvasHeight = window.innerHeight -5;
	   	canv.setAttribute("width", canvasWidth);
	    canv.setAttribute("height", canvasHeight);
	    canv.setAttribute("style","background:black");
	    document.getElementById("screen").setAttribute("style", "background:black");
	    document.getElementById("screen").setAttribute("style", "border:3px solid #A9BCF5; background:black" );
	}
	
//function to init the svg element. Should be called from all init methods using an svg container as a background (all applications using d3)
	function initSVG(){
		d3.select("svg").remove();
		canv.setAttribute("width", 0);
	    canv.setAttribute("height", 0);
		var svgWidth = window.innerWidth - 225;
		var svgHeight = window.innerHeight -150;
		d3.select("#screen").style("background-color", "black")	
		var svgContainer = d3.select("#screen").append("svg").attr("width", svgWidth).attr("height",svgHeight);
	}	
	
	
	
	function updateVisualization() {
	    // get the average for the first channel
	    var freqArray =  new Uint8Array(analyser.frequencyBinCount);
	    analyser.getByteFrequencyData(freqArray);
	   
	   var waveArray = new Uint8Array(analyser.frequencyBinCount);
	   analyser.getByteTimeDomainData(waveArray);
	   
	   maxBinCount = freqArray.length;
	   
	   var beat = gotBeat(freqArray);
	    // clear the current state
	    //ctx.clearRect(0, 0, 1000, 325);
	    // set the fill style
	    //ctx.fillStyle=gradient;
	    updateGraphics(freqArray,waveArray, beat);
	    rafID = window.requestAnimationFrame(updateVisualization);
	}
	
	function loadFreqBars() {
		initGraphics = initFreqBars;
		updateGraphics = drawBars;
	}
	
	function gotBeat(freqArray){
	/*	//normalize levelsData from freqByteData
		for(var i = 0; i < levelsCount; i++) {
			var sum = 0;
			for(var j = 0; j < levelBins; j++) {
				sum += freqByteData[(i * levelBins) + j];
			}
			levelsData[i] = sum / levelBins/256 * ControlsHandler.audioParams.volSens; //freqData maxs at 256

			//adjust for the fact that lower levels are percieved more quietly
			//make lower levels smaller
			//levelsData[i] *=  1 + (i/levelsCount)/2;
		}*/
		
		//GET AVG LEVEL
		var sum = 0;
		var beat = false;
		for(var j = 0; j < maxBinCount; j++) {
		//	sum += levelsData[j];
			sum+=freqArray[j];
		}
		
		level = sum / maxBinCount;

		levelHistory.push(level);
		levelHistory.shift(1);

		//BEAT DETECTION
		if (level  > beatCutOff && level > BEAT_MIN){
			beat = true;
			beatCutOff = level *1.1;
			beatTime = 0;
		}else{
			if (beatTime <= BEAT_HOLD_TIME){
				beatTime ++;
			}else{
				beatCutOff *= BEAT_DECAY_RATE
				beatCutOff = Math.max(beatCutOff,BEAT_MIN);
			}
		}


		//bpmTime = (new Date().getTime() - bpmStart)/msecsAvg;
		return beat;
	}
	
	
	function enlargeCanvas() {
		//canvas.setAttribute("width",screen.width);
		//canvas.setAttribute("height",screen.height);
		console.log("changed");
	}
	
	function exitFullScreen() {
		console.log("Exiting full");
		initCanvas();
	}
	
	function playClick() {
		inputtype = "play"
		clearNodes();
		setupAudioNodes();

		// when the javascript node is called
    	// we use information from the analyzer node
    	// to draw the volume
    	
    	////javascriptNode.onaudioprocess = updateVisualization
    	loadSound(song);
	}
	
	function initNavigator() {
		if (!!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
	            navigator.mozGetUserMedia || navigator.msGetUserMedia)) {
			
			//handle different types navigator objects of different browsers
			navigator.getUserMedia = navigator.getUserMedia||navigator.webkitGetUserMedia ||navigator.mozGetUserMedia ||navigator.msGetUserMedia;
	            }
	}
	
	function microClick() {
		//capturing input of the micropone
		navigator.getUserMedia({audio: true, video: false}, 
				//success
				handleMicrophoneInput, 
					//failed	
				function () {
					console.log('capturing microphone data failed!');
					console.log(evt);
				}
		);
	}
	function handleMicrophoneInput (stream) {
		clearNodes();
		//convert audio stream to mediaStreamSource (node)
		microphone = context.createMediaStreamSource(stream);
		//create analyser
	  	if (analyser == null) analyser = context.createAnalyser();
	  	//connect microphone to analyser
	    microphone.connect(analyser);
	    //start updating
		rafID = window.requestAnimationFrame( updateVisualization );
	}
    function clearNodes() {
    	if (sourceNode) {
    		sourceNode.stop(0);
    	}
    	analyser = null;
    	sourceNode = null;
    }
    
    function setupAudioNodes() {
        analyser = context.createAnalyser();
        sourceNode = context.createBufferSource();
        sourceNode.connect(analyser);
        sourceNode.connect(context.destination);
        rafID = window.requestAnimationFrame(updateVisualization);
    }


    //change to external URL sound
    function changeSound(){
    	song = $("#soundUrl").val();
    	console.log(song)
    	playClick()
    	return true;
    }

        // load the specified sound
    function loadSound(url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // When loaded decode the data
        request.onload = function() {

            // decode the data
            context.decodeAudioData(request.response, function(buffer) {
                // when the audio is decoded play the sound
                playSound(buffer);
            }, onError);
        }
        request.send();
    }

    function playSound(buffer) {
        sourceNode.buffer = buffer;
        sourceNode.start(0);
        console.log(song);
    }

    // log if an error occurs
    function onError(e) {
    	console.log("error");
        console.log(e);
    }
    
    


function goFullScreen(){
    var canvas = canv;
    if(canvas.requestFullScreen) {
        canvas.requestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
    else if(canvas.webkitRequestFullScreen) {
        canvas.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
    else if(canvas.mozRequestFullScreen)
        canvas.mozRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
}





	
	
	