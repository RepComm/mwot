
import { Object2D, Vec2 } from "@repcomm/scenario2d";
import { TextChunk } from "./textchunk.js";

export interface CursorJson {

}

export class Cursor extends Object2D {
  static tracked: Map<string, Cursor>;

  _tx: number;
  _ty: number;
  needsCalcRenderPos: boolean;
  _lastLineStartX: number;

  /**Database record id*/
  id: string;

  actualLocalPos: Vec2;
  lerpRate: number;

  get tx() {
    return this._tx;
  }
  get ty() {
    return this._ty;
  }
  setTextPos(tx: number, ty: number, lineStart: boolean = false) {
    if (tx !== undefined) this._tx = tx;
    if (ty !== undefined) this._ty = ty;
    if (lineStart) this._lastLineStartX = this._tx;
    this.needsCalcRenderPos = true;
  }
  addTextPos(tx: number = 1, ty: number = 0, lineStart: boolean = false) {
    this.setTextPos(this._tx + tx, this._ty + ty, lineStart);
  }
  newLine() {
    this.setTextPos(this._lastLineStartX, this._ty + 1, true);
  }
  tryCalcRenderPos() {
    if (!TextChunk.metricsMonoWidth) return; //needs to render a chunk first to get metrics info

    let x = TextChunk.metricsMonoWidth * this._tx;
    let y = TextChunk.metricsLineHeight * this._ty;
    this.actualLocalPos.set(x, y);
    this.needsCalcRenderPos = false;
  }
  constructor(x: number = 0, y: number = 0) {
    super();
    this.actualLocalPos = new Vec2();
    this.lerpRate = 0.5;
    this.setTextPos(x, y, true);
  }
  onRenderSelf(ctx: CanvasRenderingContext2D): this {
    if (this.needsCalcRenderPos) this.tryCalcRenderPos();

    this.localTransform.position.lerp(this.actualLocalPos, this.lerpRate); //animate instead of jumping

    ctx.strokeRect(0, 0, TextChunk.metricsMonoWidth, TextChunk.metricsLineHeight);
    return this;
  }
}
Cursor.tracked = new Map();