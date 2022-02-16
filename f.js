doEv=ev=>c=>document.dispatchEvent(new KeyboardEvent(ev,{bubbles:1,keyCode:c}));
press = doEv("keydown");
release = doEv("keyup");
s=document.createElement("script");
s.src = "https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js@0.22.2/dist/face-api.min.js";
document.body.appendChild(s);
s.onload = async ()=>{
    var noseLengthSamples = [];
    await faceapi.loadTinyFaceDetectorModel('https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js@0.22.2/weights');
    await faceapi.loadFaceLandmarkModel('https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js@0.22.2/weights');
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    const videoEl = document.createElement("video");
    document.body.appendChild(videoEl);
    videoEl.style.position = "fixed";
    videoEl.style.top = "0px";
    videoEl.style.right = "0px";
	videoEl.style.width = "30%";
	videoEl.style.height = "30%";
    videoEl.style.transform = "scaleX(-1)";
    videoEl.srcObject = stream;
    videoEl.play();
    videoEl.addEventListener("loadedmetadata", async function onPlay() {
        console.log("playing")
      if(videoEl.paused || videoEl.ended || !faceapi.nets.tinyFaceDetector.params)
        return requestAnimationFrame(onPlay);

      const r = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 })).withFaceLandmarks();

      if (r) {
		var topLip = r.landmarks.positions[62],
		    bottomLip = r.landmarks.positions[66],
            leftLip = r.landmarks.positions[48],
		    rightLip = r.landmarks.positions[54],
			noseTop = r.unshiftedLandmarks.positions[27],
			noseBottom = r.unshiftedLandmarks.positions[30],
			leftSide = r.unshiftedLandmarks.positions[2],
			rightSide = r.unshiftedLandmarks.positions[14],
            leftEnd = r.unshiftedLandmarks.positions[0],
			rightEnd = r.unshiftedLandmarks.positions[16],
            browLeft = r.unshiftedLandmarks.positions[19],
            browRight = r.unshiftedLandmarks.positions[24];
		
		// how open is your mouth, as a ratio of box size?
		var mouthOpenRatio = Math.sqrt(
            (topLip.x - bottomLip.x)**2 +
            (topLip.y - bottomLip.y)**2
        ) / r.alignedRect.box.height;
		
		if(mouthOpenRatio > 0.08) { press(32); }
		else { release(32); }
		
		window.noseLengthRatio = Math.sqrt(
            (noseTop.x - noseBottom.x)**2 +
            (noseTop.y - noseBottom.y)**2
        ) / r.alignedRect.box.height;
	
		if(noseLengthSamples.length < 20) { noseLengthSamples.push(noseLengthRatio); }
		else {
		    var averageNoseLength = noseLengthSamples.reduce((a,b)=>(a+b)/2);
			if(noseLengthRatio > averageNoseLength * 1.05) { press(40); }
            else { release(40); }
			if(noseLengthRatio < averageNoseLength * .8) { press(38); }
            else { release(38); }
		}

		var skew = (leftEnd.y - rightEnd.y) / r.alignedRect.box.height;
		if(skew > 0.15) { press(39); }
        else { release(39); }
		if(skew < -0.15) { press(37); }
        else { release(37); }

		window.mouthWidthRatio = Math.sqrt(
            (rightLip.x - leftLip.x)**2 +
            (rightLip.y - leftLip.y)**2
        ) / r.alignedRect.box.width;

        //if(mouthOpenRatio < 0.08 && mouthWidthRatio > 0.3) { press(49); }
        //else { release(49); }
      }

      requestAnimationFrame(onPlay);
    });
}
