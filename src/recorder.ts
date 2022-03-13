/* ==================================================
 * This file is an adaptation of the P5Recorder by
 * aferriss on GitHub:
 * --------------------------------------------------
 * https://github.com/aferriss/p5Recorder
 * --------------------------------------------------
 * It includes adjustments to include video duration
 * when saving from MediaStream
 * ================================================== */


/* ==================================================
 * Bug fix to attach video duration on save
 * --------------------------------------------------
 * https://github.com/yusitnikov/fix-webm-duration/blob/master/fix-webm-duration.js
 * ================================================== */
import ysFixWebmDuration from 'fix-webm-duration'


/* ==================================================
 * Fixes issues with HTMLCanvasElement type not recognizing
 * "captureStream" method (captureStream is still a working draft
 * as of June 2021)
 * --------------------------------------------------
 * https://stackoverflow.com/questions/50651091/unresolved-method-capturestream-on-htmlcanvaselement
 * ================================================== */
interface CanvasElement extends HTMLCanvasElement {
  captureStream?(frameRate?:number):MediaStream
}


export default class Recorder {
  audioOnly:boolean
  buggyBlob:Blob
  canvas:CanvasElement
  codec:string
  duration:number
  filename:string
  fps:number
  mediaRecorder:MediaRecorder
  mediaStream:MediaStream
  p5:p5
  recording:boolean // toggles on or off
  settings:Object
  startTime:number // will use exact start time in milliseconds
  videoBitsPerSecond:number
  videoChunks:Array<BlobPart>

  constructor(canvas:CanvasElement, p5Inst:p5, settings:Object) {
    // Hold on to the p5 instance
    this.p5 = p5Inst
    this.canvas = canvas

    // Some member variables for keeping our streams around
    this.mediaStream = null
    this.mediaRecorder = null
    this.videoChunks = []

    // Settings
    this.settings = settings
    this.audioOnly = settings.audioOnly || false
    this.fps = settings.fps || 60
    this.filename = settings.filename || (settings.audioOnly ? 'sketch.ogg' : 'sketch.mp4')
    this.codec = settings.codec || (settings.audioOnly ? 'audio/webm;codecs=opus' : 'video/webm;codecs=h264,opus')
    this.videoBitsPerSecond = settings.videoBitsPerSecond || 2500000

    // Are we recording or not
    this.recording = false
  }

  createStreams() {
    // Create an audio stream destination node
    const audioStreamDestinationNode = this.p5
      .getAudioContext()
      .createMediaStreamDestination()

    // Connect p5's sound to the stream destination
    this.p5.soundOut.output.connect(audioStreamDestinationNode)

    // Get the tracks from the stream destination
    const audioTracks = audioStreamDestinationNode.stream.getAudioTracks()

    if (this.audioOnly) {
      this.mediaStream = audioStreamDestinationNode.stream
    } else {
      // Get the capture stream from the p5 canvas
      this.mediaStream = this.canvas.captureStream(this.fps)
      // Add the audio to the canvas stream
      this.mediaStream.addTrack(audioTracks[0])
    }
  }

  // Start recording
  start() {
    if (!this.recording) {
      this.startTime = Date.now()
      this.createStreams()
      this.setupMediaRecorder()
      this.mediaRecorder.start()
      this.recording = true
    }
  }

  // Stop recording
  stop(filename?:string) {
    if (this.mediaRecorder) {
      if (this.recording) {
        this.filename = filename || this.filename
        this.mediaRecorder.stop()
        this.recording = false
      }
    } else {
      console.log(
        "Media Recorder has not been setup. You may have forgotten to call start"
      )
    }
  }

  fixAndDisplay() {
    // This is a bug fix that attaches duration to video container
    ysFixWebmDuration(this.buggyBlob, this.duration, function(fixedBlob:Blob) {
      // Draw video to screen
      let videoElement = document.createElement('video')
      videoElement.setAttribute('id', <string> Date.now().toString())
      videoElement.controls = true
      document.body.appendChild(videoElement)
      videoElement.src = window.URL.createObjectURL(fixedBlob)

      // Download the video
      let url = URL.createObjectURL(fixedBlob)
      let a = document.createElement('a')
      document.body.appendChild(a)
      a.setAttribute('style', 'display:none')
      a.href = url
      a.download = 'sketch.mp4'
      a.click()
      window.URL.revokeObjectURL(url)
    })
  }

  setupMediaRecorder() {
    this.videoChunks = []

    // Creates a media recorder object
    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      videoBitsPerSecond: this.videoBitsPerSecond,
      mimeType: this.codec,
    })

    // When we have data chunks, push them into the array
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.videoChunks.push(e.data)
      } else {
        console.log("Data is 0")
      }
    }

    // When we stop, get the data, create a link and prompt the user to save a video
    this.mediaRecorder.onstop = () => {
      this.duration = Date.now() - this.startTime // get duration
      this.buggyBlob = new Blob(this.videoChunks, { type: 'video/mp4' })
      this.fixAndDisplay()
    }
  }
}

