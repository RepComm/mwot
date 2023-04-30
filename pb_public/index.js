import { Object2D, Vec2 } from "@repcomm/scenario2d";
import { exponent, UIBuilder } from "@roguecircuitry/htmless";
import PocketBase from "pocketbase";
const pbUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
console.log(pbUrl);
const pb = new PocketBase(pbUrl);
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
export class Cursor extends Object2D {
  /**Database record id*/

  get tx() {
    return this._tx;
  }
  get ty() {
    return this._ty;
  }
  setTextPos(tx, ty, lineStart = false) {
    if (tx !== undefined) this._tx = tx;
    if (ty !== undefined) this._ty = ty;
    if (lineStart) this._lastLineStartX = this._tx;
    this.needsCalcRenderPos = true;
  }
  addTextPos(tx = 1, ty = 0) {
    this.setTextPos(this._tx + tx, this._ty + ty);
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
  constructor(x = 0, y = 0) {
    super();
    this.actualLocalPos = new Vec2();
    this.lerpRate = 0.5;
    this.setTextPos(x, y, true);
  }
  onRenderSelf(ctx) {
    if (this.needsCalcRenderPos) this.tryCalcRenderPos();
    this.localTransform.position.lerp(this.actualLocalPos, this.lerpRate); //animate instead of jumping

    ctx.strokeRect(0, 0, TextChunk.metricsMonoWidth, TextChunk.metricsLineHeight);
    return this;
  }
}
Cursor.tracked = new Map();
async function main() {
  function isLoggedIn() {
    return pb.authStore.isValid;
  }
  function canvasToTextIndex(v, out, floor = true) {
    out.copy(v);
    out.divScalar(scene.localTransform.scale);
    out.x /= TextChunk.metricsMonoWidth;
    out.y /= TextChunk.metricsLineHeight;
    if (floor) {
      out.x = Math.floor(out.x);
      out.y = Math.floor(out.y);
    }
  }
  function canvasToChunkIndex(v, out, floor = true) {
    canvasToTextIndex(v, out, false);
    out.x /= TextChunk.CHAR_WIDTH;
    out.y /= TextChunk.CHAR_HEIGHT;
    if (floor) {
      out.x = Math.floor(out.x);
      out.y = Math.floor(out.y);
    }
  }
  let userData;
  async function login(uname, upass) {
    pb.collection("users").authWithPassword(uname, upass).then(record => {
      userData = record;
      console.log("Login result", userData);
      alert("Successfully logged in");

      // pb.collection("cursors").getList<CursorJson>(0, 10, {
      //   filter: `created<${}`
      // })
    }).catch(reason => {
      alert(reason);
    });
  }
  const ui = new UIBuilder();
  ui.default(exponent);
  ui.create("div").id("container").mount(document.body);
  const container = ui.e;
  const hSplit = ui.create("div", "h-split").style({
    flexDirection: "column"
  }).mount(container).e;
  const menuBar = ui.create("div", "menubar").mount(hSplit).e;
  const authButton = ui.create("button", "auth").textContent("Authenticate").mount(menuBar).on("click", () => {
    if (isLoggedIn()) {
      alert("already logged in");
      return;
    }
    let uname = prompt("Enter username");
    let upass = prompt("Enter password");
    login(uname, upass);
  });
  const canvas = ui.create("canvas").style({
    flex: "20",
    minWidth: "0",
    maxWidth: "100%",
    minHeight: "0",
    maxHeight: "100%"
  }).mount(hSplit).e;
  const ctx = canvas.getContext("2d");
  const scene = new Object2D();
  let time_last = 0;
  let time_now = 0;
  let time_delta = 0;
  let target_fps = 30;
  let time_min = 1000 / target_fps;
  let fps = 0;
  let chunk = TextChunk.tryLoad(0, 0);
  chunk.src = "Hey\nWhats up\nMultiple lines!\nA really really long line\nEtc";
  scene.add(chunk);
  let viewWidth = TextChunk.CHAR_WIDTH * 2;
  let fontSize = 1;
  const fontFamily = "monospace";
  const calcCanvasSize = () => {
    const {
      width,
      height
    } = ui.ref(canvas).getRect();
    canvas.width = width;
    canvas.height = height;
    const scale = 1 / width * (viewWidth * (fontSize * 2));
    scene.localTransform.scale = 1 / scale;
    ctx.lineWidth = scale;

    //https://stackoverflow.com/questions/40732357/why-changing-canvas-size-resets-its-parameters
    ctx.font = `${fontSize}px ${fontFamily}`;
    TextChunk.metrics = null;
    for (let [id, chunk] of TextChunk.tracked) {
      chunk.needsCalcRenderPos = true;
    }
    for (let [id, cursor] of Cursor.tracked) {
      cursor.needsCalcRenderPos = true;
    }
  };
  window.addEventListener("resize", () => {
    calcCanvasSize();
  });
  setTimeout(() => {
    calcCanvasSize();
  }, 200);
  const cursor = new Cursor(0, 0);
  scene.add(cursor);

  /**Mouse position in canvas element offset*/
  const mousePos = new Vec2();
  /**Mouse position in text coordinates*/
  const mouseTextPos = new Vec2();
  const mouseChunkPos = new Vec2();
  const r = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  };
  scene.onRenderSelf = ctx => {
    ctx.strokeRect(r.x * TextChunk.CHAR_WIDTH * TextChunk.metricsMonoWidth, r.y * TextChunk.CHAR_HEIGHT * TextChunk.metricsLineHeight, r.w, r.h);
    return this;
  };
  ui.ref(canvas).on("click", evt => {
    mousePos.set(evt.offsetX, evt.offsetY);
    canvasToTextIndex(mousePos, mouseTextPos);
    canvasToChunkIndex(mousePos, mouseChunkPos);
    r.x = mouseChunkPos.x;
    r.y = mouseChunkPos.y;
    r.w = TextChunk.CHAR_WIDTH * TextChunk.metricsMonoWidth;
    r.h = TextChunk.CHAR_HEIGHT * TextChunk.metricsLineHeight;
    cursor.setTextPos(mouseTextPos.x, mouseTextPos.y, true);
  });
  const tryRender = () => {
    window.requestAnimationFrame(tryRender);
    time_now = performance.now();
    time_delta = time_now - time_last;
    fps = 1 / (time_delta / 1000);
    if (time_delta < time_min) return;
    time_last = time_now;
    document.title = `FPS: ${fps.toFixed(1)} / ${target_fps.toFixed(1)}`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scene.render(ctx);
  };
  window.requestAnimationFrame(tryRender);
}
main();