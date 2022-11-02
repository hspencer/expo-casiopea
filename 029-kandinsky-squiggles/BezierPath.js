const SAMPLE_SPACING = 2

class BezierSegment {
  constructor(A, B, C, D) {
    this.A = A
    this.B = B
    this.C = C
    this.D = D
  }

  tangentAtParameter(parameter) {
    const t = Math.max(0, Math.min(1, parameter)) // clamp to [0, 1]
    const adjustedT = 1 - t
    const x =
      3 * this.D.x * Math.pow(t, 2) -
      3 * this.C.x * Math.pow(t, 2) +
      6 * this.C.x * adjustedT * t -
      6 * this.B.x * adjustedT * t +
      3 * this.B.x * Math.pow(adjustedT, 2) -
      3 * this.A.x * Math.pow(adjustedT, 2)

    const y =
      3 * this.D.y * Math.pow(t, 2) -
      3 * this.C.y * Math.pow(t, 2) +
      6 * this.C.y * adjustedT * t -
      6 * this.B.y * adjustedT * t +
      3 * this.B.y * Math.pow(adjustedT, 2) -
      3 * this.A.y * Math.pow(adjustedT, 2)

    return { x, y }
  }

  pointAtParameter(parameter) {
    const t = Math.max(0, Math.min(1, parameter)) // clamp to [0, 1]
    return {
      x:
        Math.pow(1 - t, 3) * this.A.x +
        3 * Math.pow(1 - t, 2) * t * this.B.x +
        3 * (1 - t) * Math.pow(t, 2) * this.C.x +
        Math.pow(t, 3) * this.D.x,
      y:
        Math.pow(1 - t, 3) * this.A.y +
        3 * Math.pow(1 - t, 2) * t * this.B.y +
        3 * (1 - t) * Math.pow(t, 2) * this.C.y +
        Math.pow(t, 3) * this.D.y,
    }
  }

  getTotalLength() {
    if (this._totalLength === undefined) {
      const initialSamples = Math.max(
        10,
        Math.ceil(
          (Math.hypot(this.B.x - this.A.x, this.B.y - this.A.y) +
            Math.hypot(this.C.x - this.B.x, this.C.y - this.B.y) +
            Math.hypot(this.D.x - this.C.x, this.D.y - this.C.y)) /
            SAMPLE_SPACING
        )
      )
      const pts = times(initialSamples).map((i) =>
        this.pointAtParameter(i / (initialSamples - 1))
      )
      let total = 0
      for (let i = 1; i < pts.length; i++) {
        total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
      }
      this._totalLength = total
    }

    return this._totalLength
  }
}

class BezierPath {
  constructor(segments) {
    this.segments = segments
    this.samples = []

    const segmentLengths = segments.map((s) => s.getTotalLength())
    const segmentOffsets = [0]
    for (let i = 1; i < segmentLengths.length; i++) {
      segmentOffsets.push(segmentOffsets[i - 1] + segmentLengths[i - 1])
    }
    this._totalLength =
      segmentOffsets[segmentOffsets.length - 1] +
      segmentLengths[segmentLengths.length - 1]

    const numSamples = Math.max(
      10,
      Math.ceil(this._totalLength / SAMPLE_SPACING)
    )
    const stepSize = 1 / numSamples / 10

    const avgDist = this._totalLength / numSamples
    this.samples.push({
      dist: 0,
      pt: this.segments[0].A,
      tan: this.segments[0].tangentAtParameter(0),
      segIdx: 0,
      t: 0,
    })
    segments.forEach((seg, segIdx) => {
      const numSegSamples = Math.max(
        1,
        Math.round(numSamples * (seg.getTotalLength() / this._totalLength))
      )

      // Include one extra point at the end at t = 1
      const ts = times(numSegSamples + 1).map((i) => i / numSegSamples)
      const pts = ts.map((t) => seg.pointAtParameter(t))
      let dists
      for (let it = 0; it < 4; it++) {
        dists = times(numSegSamples).map((i) =>
          Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y)
        )
        const distErrors = dists.map((d) => d - avgDist)
        let offset = 0
        for (let i = 1; i < ts.length - 1; i++) {
          // Shift this t value to get closer to the target length
          offset += distErrors[i - 1]
          ts[i] -= stepSize * offset

          // Sample the point at the new t value
          pts[i] = seg.pointAtParameter(ts[i])
        }
      }

      let lastOffset = 0
      pts.slice(1).forEach((pt, i) => {
        lastOffset += dists[i]
        this.samples.push({
          dist: segmentOffsets[segIdx] + lastOffset,
          pt,
          tan: this.segments[segIdx].tangentAtParameter(ts[i + 1]),
          segIdx,
          t: ts[i + 1],
        })
      })
    })
  }

  getTotalLength() {
    return this._totalLength
  }

  findClosestSampleIdx(dist) {
    // Binary search to find the sample with the closest dist
    let lo = 0
    let hi = this.samples.length - 1

    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)

      if (this.samples[mid].dist > dist) {
        hi = mid - 1
      } else if (this.samples[mid].dist < dist) {
        lo = mid + 1
      } else {
        return mid
      }
    }

    return Math.max(
      0,
      Math.min(this.samples.length - 1, Math.floor((lo + hi) / 2)),
    )
  }

  getPointAtLength(length, approximate) {
    if (length <= 0) return this.samples[0].pt
    if (length >= this._totalLength)
      return this.samples[this.samples.length - 1].pt

    const idxA = this.findClosestSampleIdx(length)
    const idxB =
      this.samples[idxA].dist < length
        ? Math.min(idxA + 1, this.samples.length - 1)
        : Math.max(0, idxA - 1)
    const mix =
      (length - this.samples[idxA].dist) /
      (this.samples[idxB].dist - this.samples[idxA].dist)

    if (
      approximate ||
      this.samples[idxA].segIdx !== this.samples[idxB].segIdx
    ) {
      // We have a set of evenly spaced samples that are close enough together
      // that we can probably just linearly interpolate between them without
      // too much loss of quality
      const x =
        (1 - mix) * this.samples[idxA].pt.x + mix * this.samples[idxB].pt.x
      const y =
        (1 - mix) * this.samples[idxA].pt.y + mix * this.samples[idxB].pt.y
      return { x, y }
    } else {
      // Find the t value between the two samples. This is not EXACTLY the point
      // at the target distance along the path, but it's so close that it
      // is effectively the same
      const segment = this.segments[this.samples[idxA].segIdx]
      const t = (1 - mix) * this.samples[idxA].t + mix * this.samples[idxB].t
      return segment.pointAtParameter(t)
    }
  }

  getAngleAtLength(length, approximate) {
    const a = this.getTangentAtLength(length, approximate)
    const angle = Math.atan2(a.y, a.x)
    return angle
  }

  getTangentAtLength(length, approximate) {
    if (length <= 0) return this.samples[0].tan
    if (length >= this._totalLength)
      return this.samples[this.samples.length - 1].tan

    const idxA = this.findClosestSampleIdx(length)
    const idxB =
      this.samples[idxA].dist < length
        ? Math.min(idxA + 1, this.samples.length - 1)
        : Math.max(0, idxA - 1)
    const mix =
      (length - this.samples[idxA].dist) /
      (this.samples[idxB].dist - this.samples[idxA].dist)

    if (
      approximate ||
      this.samples[idxA].segIdx !== this.samples[idxB].segIdx
    ) {
      // We have a set of evenly spaced samples that are close enough together
      // that we can probably just linearly interpolate between them without
      // too much loss of quality
      const x =
        (1 - mix) * this.samples[idxA].tan.x + mix * this.samples[idxB].tan.x
      const y =
        (1 - mix) * this.samples[idxA].tan.y + mix * this.samples[idxB].tan.y
      return { x, y }
    } else {
      // Find the t value between the two samples. This is not EXACTLY the point
      // at the target distance along the path, but it's so close that it
      // is effectively the same
      const segment = this.segments[this.samples[idxA].segIdx]
      const t = (1 - mix) * this.samples[idxA].t + mix * this.samples[idxB].t
      return segment.tangentAtParameter(t)
    }
  }
}


// https://stackoverflow.com/questions/64945219/split-a-svg-path-d-to-array-of-objects
const PATH_COMMANDS = {
  M: ["x", "y"],
  m: ["dx", "dy"],
  H: ["x"],
  h: ["dx"],
  V: ["y"],
  v: ["dy"],
  L: ["x", "y"],
  l: ["dx", "dy"],
  Z: [],
  C: ["x1", "y1", "x2", "y2", "x", "y"],
  c: ["dx1", "dy1", "dx2", "dy2", "dx", "dy"],
  S: ["x2", "y2", "x", "y"],
  s: ["dx2", "dy2", "dx", "dy"],
  Q: ["x1", "y1", "x", "y"],
  q: ["dx1", "dy1", "dx", "dy"],
  T: ["x", "y"],
  t: ["dx", "dy"],
  A: ["rx", "ry", "rotation", "large-arc", "sweep", "x", "y"],
  a: ["rx", "ry", "rotation", "large-arc", "sweep", "dx", "dy"]
};

function fromPathToArray(path) {
  const items = path.replace(/[\n\r]/g, '').
                replace(/-/g, ' -').
                replace(/(\d*\.)(\d+)(?=\.)/g, '$1$2 ').
                replace(/(\d)([A-Za-z])/g, '$1 $2').
                replace(/([A-Za-z])(\d)/g, '$1 $2').
                trim().
                split(/\s*,|\s+/)
  const segments = [];
  let currentCommand = '';
  let currentElement = {};
  while (items.length > 0){
    let it = items.shift();
    if (PATH_COMMANDS.hasOwnProperty(it)){
      currentCommand = it;
    }
    else{
      items.unshift(it);
    }
    currentElement = {type: currentCommand};
    PATH_COMMANDS[currentCommand].forEach((prop) => {
      it = items.shift();  // TODO sanity check
      currentElement[prop] = parseFloat(it);
    });
    if (currentCommand === 'M'){
      currentCommand = 'L';
    }
    else if (currentCommand === 'm'){
      currentCommand = 'l';
    }
    segments.push(currentElement);
  }
  return segments
}

const bezierFromPath = (el) => {
  const commands = fromPathToArray(el.getAttribute('d'))
  if (commands.length < 2) {
    throw new Error(`Path doesn't have enough commands: ${JSON.stringify(commands)}`)
  }
  if (commands[0].type !== 'M') {
    throw new Error(`Path starts with ${commands[0].type} instead of M!`)
  }
  let lastPoint = { x: commands[0].x, y: commands[0].y }
  commands.shift()
  const segments = []
  while (commands.length > 0) {
    const command = commands.shift()
    if (command.type === 'C') {
      segments.push(new BezierSegment(
        lastPoint,
        { x: command.x1, y: command.y1 },
        { x: command.x2, y: command.y2 },
        { x: command.x, y: command.y }
      ))
      lastPoint = { x: command.x, y: command.y }
    } else if (command.type === 'L') {
      segments.push(new BezierSegment(
        lastPoint,
        lastPoint,
        { x: command.x, y: command.y },
        { x: command.x, y: command.y }
      ))
      lastPoint = { x: command.x, y: command.y }
		} else if (command.type === 'H') {
      segments.push(new BezierSegment(
        lastPoint,
        lastPoint,
        { x: command.x, y: lastPoint.y },
        { x: command.x, y: lastPoint.y }
      ))
      lastPoint = { x: command.x, y: lastPoint.y }
		} else if (command.type === 'V') {
      segments.push(new BezierSegment(
        lastPoint,
        lastPoint,
        { x: lastPoint.x, y: command.y },
        { x: lastPoint.x, y: command.y }
      ))
      lastPoint = { x: lastPoint.x, y: command.y }
    } else if (command.type === 'Z') {
      // noop
    } else {
      throw new Error(`Unsupported path command ${command.type}; use only H, V, M, L, C, Z!`)
    }
  }
  return new BezierPath(segments)
}

const bezierFromLine = (el) => {
  const [x1, x2, y1, y2] = ['x1', 'x2', 'y1', 'y2']
    .map((prop) => parseFloat(el.getAttribute(prop) || '0'))
  
  return new BezierPath([
    new BezierSegment(
      { x: x1, y: y1 },
      { x: x1, y: y1 },
      { x: x2, y: y2 },
      { x: x2, y: y2 }
    )
  ])
}

const bezierFromCircle = (el) => {
  const [cx, cy, r] = ['cx', 'cy', 'r']
    .map((prop) => parseFloat(el.getAttribute(prop) || '0'))
  
  const k = 1.3
  return new BezierPath([
    new BezierSegment(
      { x: cx - r, y: cy },
      { x: cx - r, y: cy - k*r },
      { x: cx + r, y: cy - k*r },
      { x: cx + r, y: cy }
    ),
    new BezierSegment(
      { x: cx + r, y: cy },
      { x: cx + r, y: cy + k*r },
      { x: cx - r, y: cy + k*r },
      { x: cx - r, y: cy }
    ),
  ])
}

const bezierFromElement = (el) => {
  const tag = el.tagName.toLowerCase()
  if (tag === 'path') {
    return bezierFromPath(el)
  } else if (tag === 'line') {
    return bezierFromLine(el)
  } else if (tag === 'circle') {
    return bezierFromCircle(el)
  } else {
    throw new Error(`Unsupported SVG tag: ${tag}`)
  }
}

const createBezierPath = (points) => {
  const segments = []
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    segments.push(
      new BezierSegment(
        prev.pt,
        prev.right || prev.pt,
        curr.left || curr.pt,
        curr.pt,
      ),
    )
  }
  return new BezierPath(segments)
}

function times(n) {
	return new Array(n).fill(0).map((_, i) => i)
}