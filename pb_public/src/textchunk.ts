
import { Object2D, Vec2 } from "@repcomm/scenario2d";
import { db } from "./db.js";

export interface ChunkJson {
  id: string;
  src: string;
  cx: number;
  cy: number;
}

const td = new TextDecoder();
const te = new TextEncoder();

export class TextChunk extends Object2D {
  /**Number of chars wide max*/
  static CHAR_WIDTH: number;
  /**Number of chars tall max*/
  static CHAR_HEIGHT: number;

  static metrics: TextMetrics;
  static metricsLineHeight: number;
  static metricsMonoWidth: number;

  static tracked: Map<string, TextChunk>;

  static _2dTo1d (x: number, y: number, width: number) {
    return x + width * y;
  }
  
  /** given an index in an array w/ size (width * height) and the width of the chunk
   * Returns the X coordinate inside the width, height of the chunk
   */
  static _1dTo2dX (index: number, width: number): number {
    return index % width;
  }
  
  /** given an index in an array w/ size (width * height) and the width of the chunk
   * Returns the Y coordinate inside the width, height of the chunk
   */
  static _1dTo2dY (index: number, width: number): number {
    return index / width;
  }

  /**database record ID*/
  id: string;

  cx: number;
  cy: number;

  _bin: Uint8Array;

  _binClear () {
    this._bin.fill(" ".charCodeAt(0));
  }
  _binInit () {
    this._bin = new Uint8Array(TextChunk.CHAR_WIDTH * TextChunk.CHAR_HEIGHT);
    this._binClear();
  }
  _srcFromBin () {
    this._src = td.decode(this._bin);
  }
  _binFromSrc () {
    let max = Math.min(this._src.length, this._bin.byteLength);
    for (let i=0; i<max; i++) {
      this._bin[i] = this._src.charCodeAt(i);
    }
    if (max < this._bin.byteLength) {
      this._bin.fill(" ".charCodeAt(0), max);
    }
  }
  _src: string;

  constructor(cx: number = 0, cy: number = 0) {
    super();
    this._binInit();
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

    let ch: string;
    let chb: number;
    for (let i=0; i<this._bin.byteLength-1; i++) {
      chb = this._bin[i];
      ch = String.fromCharCode(chb);

      x = TextChunk._1dTo2dX(i, TextChunk.CHAR_WIDTH) * TextChunk.metricsMonoWidth;
      if (x === 0) y+= TextChunk.metricsLineHeight;
      //not sure why this doesn't work, but adding to Y is cheaper anyways
      // y = Math.floor(TextChunk._1dTo2dY(i, TextChunk.CHAR_WIDTH) * TextChunk.metricsLineHeight);
      ctx.fillText(ch, x, y);
    }
    return this;
  }
  static isLoaded (cx: number, cy: number) {
    const indexStr = TextChunk.getIndexStr(cx, cy);
    return TextChunk.tracked.has(indexStr);
  }
  static getLoaded (cx: number, cy: number): TextChunk|undefined {
    const indexStr = TextChunk.getIndexStr(cx, cy);
    return TextChunk.tracked.get(indexStr);
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
    if (this.id) db.ctx.collection("chunks").unsubscribe(this.id);
  }
  subscribe () {
    //TODO - handle database subscribe

    db.ctx.collection("chunks").getFirstListItem<ChunkJson>(`cx = ${this.cx} && cy = ${this.cy}`).then((rec)=>{
      console.log(rec);
      this._src = rec.src;
      this._binFromSrc();
      this.id = rec.id;

      db.ctx.collection("chunks").subscribe<ChunkJson>(rec.id, (data)=>{
        // console.log("Changed", data);
        this._src = data.record.src;
        this._binFromSrc();
      });

    }).catch((ex)=>{
      //empty chunks are not instantiated in the database, and are created as content is needed
    });
  }
}
TextChunk.CHAR_HEIGHT = 8;
TextChunk.CHAR_WIDTH = 16;
TextChunk.tracked = new Map();
