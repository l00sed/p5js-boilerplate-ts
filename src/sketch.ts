/* Script adapted by Daniel Tompkins AKA l00sed
 * https://github.com/l00sed/p5js-boilerplate-ts
 */

// Types for MediaRecorder and related classes
// are included in the dev dependency:
// '@types/dom-mediacapture-record'

// Typed p5.js library and add-ons
import p5Typed from 'p5'
import p5DOM from 'p5/lib/addons/p5.dom'
import p5Sound from 'p5/lib/addons/p5.sound'

// Bug fix to attach video duration on save
// --------------------------------------------------
// https://github.com/yusitnikov/fix-webm-duration/blob/master/fix-webm-duration.js
// --------------------------------------------------
import ysFixWebmDuration from 'fix-webm-duration'

// Fixes issues with HTMLCanvasElement type not recognizing
// "captureStream" method (captureStream is still a working draft
// as of June 2021)
// --------------------------------------------------
// https://stackoverflow.com/questions/50651091/unresolved-method-capturestream-on-htmlcanvaselement
// --------------------------------------------------
interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?:number):MediaStream
}

/**
 * @param {p5} p
 */

export const sketch = (p:p5Typed, d:p5DOM, s:p5Sound) => {
  /* ==================================
   * Animation recording mechanics
   * ================================== */

  // Set recording (and sketch) framerate
  const framerate:number = 30
  // Set MediaRecorder options
  const options:Object = {
    videoBitsPerSecond: <number> 5000000, // sets 5Mb bitrate
    mimeType: <string> 'video/webm; codecs=H264' // use h.264 codec
  }
  let mediaRecorder:MediaRecorder
  let mediaParts:Array<BlobPart> = []
  let startTime:number // will use exact start time in milliseconds
  let recording:boolean = false // toggles on or off

  // Setup canvas for recording to file
  let canvas:CanvasElement
  let stream:MediaStream

  // Start recording the HTML canvas
  const startRecording = (stream:MediaStream, options:Object) => {
    mediaParts = [] // empty if recording exists
    mediaRecorder = new MediaRecorder(stream, options)
    mediaRecorder.onstop = function() {
      let duration = Date.now() - startTime // get duration
      let buggyBlob = new Blob(mediaParts, { type: 'video/mp4' })
      // This is a bug fix that attaches duration to video container
      ysFixWebmDuration(buggyBlob, duration, function(fixedBlob:Blob) {
        displayResult(fixedBlob) // callback to append video to HTML
      })
    }
    mediaRecorder.ondataavailable = function(event) {
      let data = event.data
      if (data && data.size > 0) {
        mediaParts.push(data)
      }
    }
    mediaRecorder.start()
    // Start time = now in milliseconds
    startTime = Date.now()
  }

  // Stop recording of canvas element
  const stopRecording = () => {
    mediaRecorder.stop()
  }

  // Display recorded video in HTML
  const displayResult = (blob:Blob) => {
    // Draw video to screen
    let videoElement = document.createElement('video')
    videoElement.setAttribute('id', <string> Date.now().toString())
    videoElement.controls = true
    document.body.appendChild(videoElement)
    videoElement.src = window.URL.createObjectURL(blob)

    // Download the video
    let url = URL.createObjectURL(blob)
    let a = document.createElement('a')
    document.body.appendChild(a)
    a.setAttribute('style', 'display:none')
    a.href = url
    a.download = 'sketch.mp4'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  /*
    NOTE
    -----------------------------------------------
      Once downloaded, if your video-editing
      software has issues with the compression
      codecs, try to copy to .mp4 using ffmpeg:

      ffmpeg -i sketch.mp4 --fflags +genpts -r 25 -crf 0 -c:v copy sketch.mp4
    -----------------------------------------------
  */

  /* =====================================
   * P5.js - Setup
   * ===================================== */

  // Setup sketch parameters
  const width:number = 1500
  const height:number = 1500

  let context // Leave for use with gradients

  p.setup = () => {
    // Define your initial environment props & other stuff here
    p.createCanvas(width, height) // Define canvas element
    p.frameRate(framerate) // Use recording framerate
    context = (p as any).drawingContext // Leave to disable eslint warning by setting "p as any"
  }

  /* ===========================================
   * p5.js - Drawing
   * =========================================== */

  let t:number = 0 // loop counter

  p.draw = () => {
    // Define render logic for your sketch here

    t+=1 // counter
  }

  p.keyPressed = () => {
    // toggle recording true or false
    recording = !recording
    console.log('RECORDING: ')
    console.log(recording)

    // Export sketch's canvas to file when pressing "r"
    // if recording now true, start recording
    if (p.keyCode === 82 && recording) {
      console.log('Video recording started')
      canvas = <CanvasElement> document.querySelector('canvas')
      stream = canvas.captureStream(framerate)
      startRecording(stream, options)
    }
    // if we are recording, stop recording
    if (p.keyCode === 82 && !recording) {
      console.log('Video recording stopped')
      stopRecording()
    }
    // Export sketch's canvas to .png image file when pressing "p"
    if (p.keyCode === 80) {
      console.log('saving .png')
      p.saveCanvas('sketch', 'png')
    }
  }
}
