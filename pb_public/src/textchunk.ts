
import { Object2D, Vec2 } from "@repcomm/scenario2d";

export class TextChunk extends Object2D {
  /**Number of chars wide max*/
  static CHAR_WIDTH: number;
  /**Number of chars tall max*/
  static CHAR_HEIGHT: number;

  static metrics: TextMetrics;
  static metricsLineHeight: number;
  static metricsMonoWidth: number;

  static tracked: Map<string, TextChunk>;

  /**database record ID*/
  id: string;

  cx: number;
  cy: number;

  /**Set the source text
   * Automatically trims lines that are longer than TextChunk.WIDTH
   * Automatically trims line count to be at most TextChunk.CHAR_HEIGHT
   * Stores baked version of lines for easy rendering
  */
  set src(s: string) {
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
  _src: string;
  _lines: string[];

  constructor(cx: number = 0, cy: number = 0) {
    super();
    this.setIndex(cx, cy);
  }
  getIndexStr() {
    return `${this.cx}:${this.cy}`;
  }
  static getIndexStr (cx: number, cy: number) {
    return `${cx}:${cy}`;
  }
  calcRenderPos() {
    let x = (TextChunk.metricsMonoWidth * TextChunk.CHAR_WIDTH) * this.cx;
    let y = (TextChunk.metricsLineHeight * TextChunk.CHAR_HEIGHT) * this.cy;
    this.localTransform.position.set(x, y);
    this.needsCalcRenderPos = false;
  }
  needsCalcRenderPos: boolean;

  setIndex(cx: number, cy: number) {
    this.cx = cx;
    this.cy = cy;
    this.needsCalcRenderPos = true;
  }
  onRenderSelf(ctx: CanvasRenderingContext2D): this {
    
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
  static isLoaded (cx: number, cy: number) {
    const indexStr = TextChunk.getIndexStr(cx, cy);
    return TextChunk.tracked.has(indexStr);
  }
  static tryLoad (cx: number, cy: number): TextChunk {
    if (TextChunk.isLoaded(cx, cy)) return;

    let result = new TextChunk(cx, cy);
    TextChunk.tracked.set(result.getIndexStr() , result);
    result.subscribe();
    return result;
  }
  static tryUnload (cx: number, cy: number) {
    let indexStr = TextChunk.getIndexStr(cx, cy);
    let chunk = TextChunk.tracked.get(indexStr);
    if (!chunk) return;
    TextChunk.tracked.delete(indexStr);
    chunk.removeSelf();
    chunk.unsubscribe();
  }
  unsubscribe () {
    //TODO - handle database unsubscribe
  }
  subscribe () {
    //TODO - handle database subscribe
    this.src = "0123456789abcdef\n0123456789abcdef\n0123456789abcdef\n0123456789abcdef\n0123456789abcdef\n0123456789abcdef\n0123456789abcdef\n0123456789abcdef";
  }
}
TextChunk.CHAR_HEIGHT = 8;
TextChunk.CHAR_WIDTH = 16;
TextChunk.tracked = new Map();
