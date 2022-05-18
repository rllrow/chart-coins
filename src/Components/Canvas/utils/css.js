export  function css (el,styles){
  Object.assign(el.style,styles)
}
export function computeBoundaries({columns, types}) {
  let min
  let max

  columns.forEach((col) => {
    if (types[col[0]] !== 'line') {
      return
    }
    if (typeof min !== 'number') min = col[1]
    if (typeof max !== 'number') max = col[1]

    for (let i = 2; i < col.length; i++) {
      if (min > col[i]) min = col[i]
      if (max < col[i]) max = col[i]
    }

  })


  return [min, max]
}

export function line(ctx, coords, color) {
  ctx.beginPath()
  ctx.lineWidth = 4
  ctx.strokeStyle = color
  for (const [x, y] of coords) {
    ctx.lineTo(x, y)

  }
  ctx.stroke()
  ctx.closePath()

}