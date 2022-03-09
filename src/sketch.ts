import p5Typed from 'p5'
import p5DOM from 'p5/lib/addons/p5.dom'
import p5DOM from 'p5/lib/addons/p5.sound'

/**
 * @param {p5} p
 */

export const sketch = ( p: p5Typed ) => {
  let recording = false
  let recorder
  let chunks = []

  const record = () => {
    chunks.length = 0
    let stream = document.querySelector( 'canvas' ).captureStream( framerate )
    recorder = new MediaRecorder( stream )
    recorder.ondataavailable = e => {
      if ( e.data.size ) {
        chunks.push( e.data )
      }
    }
    recorder.onstop = exportVideo
  }

  const exportVideo = () => {
    var blob = new Blob( chunks, { 'type' : 'video/mp4' } )

    // Draw video to screen
    var videoElement = document.createElement( 'video')
    videoElement.setAttribute( 'id', Date.now().toString() )
    videoElement.controls = true
    document.body.appendChild( videoElement )
    videoElement.src = window.URL.createObjectURL( blob )

    // Download the video
    var url = URL.createObjectURL( blob )
    var a = document.createElement( 'a' )
    document.body.appendChild( a )
    a.setAttribute( 'style', 'display: none' )
    a.href = url
    a.download = 'sketch.mp4'
    a.click()
    window.URL.revokeObjectURL( url )
  }

  const width: number = 150
  const height: number = 150
  const framerate: number = 30

  p.setup = () => {
    // Define your initial environment props & other stuff here

    // Leave this for video-recording functionality
    record()
  }

  p.draw = () => {
    // Define render logic for your sketch here
  }

  p.keyPressed = () => {
    // toggle recording true or false
    recording = !recording
    console.log( "RECORDING: " )
    console.log(recording)

    // Export sketch's canvas to file when pressing "r"
    // if recording now true, start recording
    if ( p.keyCode === 82 && recording ) {
      console.log( ".mp4 recording started" )
      recorder.start()
    }

    // if we are recording, stop recording
    if ( p.keyCode === 82 && !recording) {
      console.log( ".mp4 recording stopped" )
      recorder.stop()
    }

    // Export sketch's canvas to file when pressing "p"
    if ( p.keyCode === 80 ) {
      console.log( "saving .png" )
      p.saveCanvas( 'sketch', 'png' )
    }
  }
}
