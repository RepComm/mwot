import { Object2D } from "@repcomm/scenario2d";
export class TextChunk extends Object2D {
  /**Number of chars wide max*/

  /**Number of chars tall max*/

  /**database record ID*/

  /**Set the source text
   * Automatically trims lines that are longer than TextChunk.WIDTH
   * Automatically trims line count to be at most TextChunk.CHAR_HEIGHT
   * Stores baked version of lines for easy rendering
  */
  set src(s) {
    this._lines = s.split("\n", TextChunk.CHAR_HEIGHT);
    let changed = false;
    for (let i = 0; i < this._lines.length; i++) {
      let line = this._lines[i];
      if (line.length > TextChunk.CHAR_WIDTH) {
        line = line.substring(0, TextChunk.CHAR_WIDTH);
        this._lines[i] = line;
        changed = true;
      }
    }
    if (changed) {
      this._src = this._lines.join("\n");
    } else {
      this._src = s;
    }
  }
  get src() {
    return this._src;
  }
  constructor(cx = 0, cy = 0) {
    super();
    this.setIndex(cx, cy);
  }
  getIndexStr() {
    return `${this.cx}:${this.cy}`;
  }
  calcRenderPos() {
    let x = TextChunk.metricsMonoWidth * TextChunk.CHAR_WIDTH * this.cx;
    let y = TextChunk.metricsLineHeight * TextChunk.CHAR_HEIGHT * this.cy;
    this.localTransform.position.set(x, y);
    this.needsCalcRenderPos = false;
  }
  setIndex(cx, cy) {
    this.cx = cx;
    this.cy = cy;
    this.needsCalcRenderPos = true;
  }
  onRenderSelf(ctx) {
    let x = 0;
    let y = 0;
    if (!TextChunk.metrics) {
      TextChunk.metrics = ctx.measureText("A");
      TextChunk.metricsLineHeight = TextChunk.metrics.fontBoundingBoxAscent + TextChunk.metrics.fontBoundingBoxDescent;
      TextChunk.metricsMonoWidth = TextChunk.metrics.width;
    }
    if (this.needsCalcRenderPos) this.calcRenderPos();
    for (let line of this._lines) {
      y += TextChunk.metricsLineHeight;
      if (!line) continue;
      ctx.fillText(line, x, y);
    }
    return this;
  }
  static tryLoad(cx, cy) {
    let result = new TextChunk(cx, cy);
    TextChunk.tracked.set(result.getIndexStr(), result);
    return result;
  }
}
TextChunk.CHAR_HEIGHT = 8;
TextChunk.CHAR_WIDTH = 16;
TextChunk.tracked = new Map();