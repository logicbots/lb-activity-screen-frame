import React, { useState } from 'react'
import Webcam from 'react-webcam'
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import * as tmPose from "@teachablemachine/pose";
import './index.css';
// import FrameSvg from "./home-frame-photo.svg";

import Icon from './Icon';


const Tensor = () => {

    const videoConstraints = {
        width: 800,
        height: 800,
        facingMode: 'user',
    }

    const [picture, setPicture] = useState('')
    const webcamRef = React.useRef(null)


    const URL = "https://teachablemachine.withgoogle.com/models/xIP6aU3bz/";
    let model, webcam, ctx, labelContainer, maxPredictions;

    async function init() {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // load the model and metadata
        // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
        // Note: the pose library adds a tmPose object to your window (window.tmPose)
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Convenience function to setup a webcam
        const size = 400;
        const flip = true; // whether to flip the webcam
        webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        window.requestAnimationFrame(loop);

        // append/get elements to the DOM
        const canvas = document.getElementById("canvas");
        canvas.width = size; canvas.height = size;
        ctx = canvas.getContext("2d");
        labelContainer = document.getElementById("label-container");
        for (let i = 0; i < maxPredictions; i++) { // and class labels
            labelContainer.appendChild(document.createElement("div"));
        }
    }

    async function loop(timestamp) {
        webcam.update(); // update the webcam frame
        await predict();
        window.requestAnimationFrame(loop);
    }

    async function predict() {

        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
        const prediction = await model.predict(posenetOutput);

        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction =
                prediction[i].className + ": " + prediction[i].probability.toFixed(2);
            labelContainer.childNodes[i].innerHTML = classPrediction;
            console.log("classPrediction>>>>>", classPrediction)
            console.log("prediction[i].probability.toFixed(2)>>>>>>>", prediction[i].probability.toFixed(2))
            if ((i == 1 || i == 2) && prediction[i].probability.toFixed(2) == 1) {
                console.log("correct pose>>>>>>>>>")
                capture()
            }
        }
        drawPose(pose);
    }

    function drawPose(pose) {
        if (webcam.canvas) {
            ctx.drawImage(webcam.canvas, 0, 0);
            if (pose) {
                const minPartConfidence = 0.5;
                tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
                tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
            }
        }
    }

    const capture = React.useCallback(() => {
        const pictureSrc = webcamRef.current.getScreenshot()
        setPicture(pictureSrc)
    })

    return (

        <div>
            <h1>Photo Frame Activity</h1>
            {picture == '' ?
                <>
                    <button type="button" onClick={(e) => { init() }}>Start</button>
                    <div><canvas id="canvas"></canvas></div>
                    <div id="label-container"></div>
                    <Webcam
                        muted={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                    />
                </>
                :

                <>
                    <div style={{ backgroundImage: `url(${picture})`, backgroundRepeat: 'no-repeat', width: '37em', height: '31em' }}>
                        <Icon />

                    </div>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </>
            }

        </div>


    )
}

export default Tensor