// A conservative color hint from the center of a photograph. Never sent off device.
export function guessColorFromPixels(data: ArrayLike<number>): string | undefined {
  const votes = new Map<string, number>()
  let count = 0
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 220) continue
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]].map((channel) => channel / 255)
    const hi = Math.max(r, g, b)
    const lo = Math.min(r, g, b)
    const range = hi - lo
    const saturation = hi ? range / hi : 0
    let hue = 0
    if (range) hue = 60 * (hi === r ? ((g - b) / range + 6) % 6 : hi === g ? (b - r) / range + 2 : (r - g) / range + 4)
    let label: string
    if (hi < .19) label = 'Black'
    else if (saturation < .12) label = hi > .87 ? 'White' : 'Gray'
    else if (hi > .68 && saturation < .4 && hue > 22 && hue < 63) label = 'Beige'
    else if (hue < 16 || hue >= 345) label = hi > .65 && saturation < .5 ? 'Pink' : 'Red'
    else if (hue < 46) label = hi < .6 ? 'Brown' : 'Orange'
    else if (hue < 69) label = hi < .55 ? 'Olive' : 'Yellow'
    else if (hue < 161) label = 'Green'
    else if (hue < 192) label = 'Teal'
    else if (hue < 258) label = hi < .48 ? 'Navy' : 'Blue'
    else if (hue < 292) label = 'Purple'
    else label = 'Pink'
    count += 1
    votes.set(label, (votes.get(label) ?? 0) + 1)
  }
  if (count < 20) return
  const [[name, lead], [, second = 0] = []] = [...votes.entries()].sort((a, b) => b[1] - a[1])
  // Don't guess when multiple colors, patterns, or backgrounds compete.
  if (lead / count >= .62 && (lead - second) / count >= .22) return name
}

export function hintColorFromImage(source: CanvasImageSource, width: number, height: number) {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 20; canvas.height = 20
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx || !width || !height) return undefined
    ctx.drawImage(source, width * .235, height * .2, width * .53, height * .6, 0, 0, 20, 20)
    return guessColorFromPixels(ctx.getImageData(0, 0, 20, 20).data)
  } catch { return undefined }
}
