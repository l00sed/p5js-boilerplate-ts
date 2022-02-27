import p5 from 'p5'

/**
 * @param {p5} p
 */
export const sketch = (p: p5) => {
  p.setup = () => {
    // Define your initial environment props & other stuff here
    p.createCanvas( 300, 800, p.WEBGL )
    p.background( 0 )
  }

  p.draw = () => {
    // Define render logic for your sketch here
    let diameter = 6
    let points = [
      {
        "x": 2,
        "y": -20
      },
      {
        "x": 80,
        "y": -159
      },
      {
        "x": -80,
        "y": -259
      },
      {
        "x": -80,
        "y": 300
      }
    ]
    p.stroke( 255 )
    let last = [{ "x":"", "y":"" }]
    points.forEach( ( point, i ) => {
      p.circle( point["x"], point["y"], diameter )
      if ( i != 0 && ( last["x"] != point["x"] || last["y"] != point["y"] ) ) {
        p.line( last["x"], last["y"], point["x"], point["y"] )
        last["x"] = point["x"]
        last["y"] = point["y"]
      } else {
        last["x"] = point["x"]
        last["y"] = point["y"]
      }
    } )
  }

  p.keyPressed = () => {
    // Export sketch's canvas to file when pressing "p"
    if ( p.keyCode === 80 ) {
      p.saveCanvas('sketch', 'png')
    }
  }
}
