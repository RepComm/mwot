
import { Object2D, Vec2 } from "@repcomm/scenario2d";
import { exponent, UIBuilder } from "@roguecircuitry/htmless";
import { Cursor } from "./cursor.js";
import { ChunkJson, TextChunk } from "./textchunk.js";

import { db } from "./db.js";

async function main() {

  db.init();

  const pos = {
    canvas: {
      to: {
        textIndex(v: Vec2, out: Vec2, floor: boolean = true) {
          out.copy(v);
          out.divScalar(scene.localTransform.scale);
          out.x /= TextChunk.metricsMonoWidth;
          out.y /= TextChunk.metricsLineHeight;
          if (floor) {
            out.x = Math.floor(out.x);
            out.y = Math.floor(out.y);
          }
        },
        chunkIndex(v: Vec2, out: Vec2, floor: boolean = true) {
          pos.canvas.to.textIndex(v, out, false);
          out.x /= TextChunk.CHAR_WIDTH;
          out.y /= TextChunk.CHAR_HEIGHT;
          if (floor) {
            out.x = Math.floor(out.x);
            out.y = Math.floor(out.y);
          }
        }
      }
    },
    text: {
      to: {
        chunkIndex(v: Vec2, out: Vec2, floor: boolean = true) {
          // pos.canvas.to.textIndex(v, out, false);
          out.x /= TextChunk.CHAR_WIDTH;
          out.y /= TextChunk.CHAR_HEIGHT;
          if (floor) {
            out.x = Math.floor(out.x);
            out.y = Math.floor(out.y);
          }
        }
      }
    }
  };

  const ui = new UIBuilder();

  ui.default(exponent);

  ui.create("div").id("container").mount(document.body);
  const container = ui.e;

  const hSplit = ui.create("div", "h-split").style({ flexDirection: "column" }).mount(container).e;
  const menuBar = ui.create("div", "menubar").mount(hSplit).e;

  const authButton = ui.create("button", "auth").mount(menuBar).on("click", () => {
    if (db.isLoggedIn()) {
      db.ctx.authStore.clear();
      alert("Logged out");
    } else {
      let uname = prompt("Enter username");
      let upass = prompt("Enter password");
      db.login(uname, upass);
    }
    updateAuthButton();
  });
  function updateAuthButton () {
    authButton.textContent(db.isLoggedIn() ? "Logout" : "Login");
  }
  updateAuthButton();

  const canvas = ui.create("canvas").style({
    flex: "20",
    minWidth: "0",
    maxWidth: "100%",
    minHeight: "0",
    maxHeight: "100%"
  }).mount(hSplit).e;

  //make this work app on mobile, canvas can't pull up mobile keyboard.
  const mobileCapableTypeArea = ui.create("input", "mobile-capable-type-area")
  .style({flex: "1"})
  .mount(hSplit)
  .on("change", (evt)=>{
    let v = mobileCapableTypeArea.value;
    mobileCapableTypeArea.value = "";

    for (let i=0; i<v.length; i++) {
      setTimeout(()=>{
        keyDownHandler({
          key: v[i]
        });
      }, 150 * i);
    }
  })
  .on("click", (evt)=>{
    canvasFocus = false;
  })
  .e;

  const ctx = canvas.getContext("2d");

  const scene = new Object2D();

  let time_last = 0;
  let time_now = 0;
  let time_delta = 0;
  let target_fps = 15;
  let time_min = 1000 / target_fps;

  let fps = 0;

  let chunk = TextChunk.tryLoad(0, 0);
  // chunk._src = " ";
  scene.add(chunk);

  let viewWidth = TextChunk.CHAR_WIDTH * 2;
  let fontSize = 1;
  const fontFamily = "monospace";

  const calcCanvasSize = () => {

    const { width, height } = ui.ref(canvas).getRect();
    canvas.width = width;
    canvas.height = height;

    const scale = (1 / width) * (viewWidth * (fontSize * 2));
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
  }
  window.addEventListener("resize", () => {
    calcCanvasSize();
  });
  setTimeout(() => { calcCanvasSize() }, 200);

  const cursor = new Cursor(0, 0);
  scene.add(cursor);

  /**Mouse position in canvas element offset*/
  const mPosCanvasOffset = new Vec2();
  /**Mouse position in text index space*/
  const mPosText = new Vec2();
  /**Mouse position in chunk index space*/
  const mPosChunk = new Vec2();

  ui.ref(canvas).on("click", (evt) => {
    canvasFocus = true;
    //get offset of mouse from canvas top left pixels
    mPosCanvasOffset.set(evt.offsetX, evt.offsetY);

    //convert to text column, row
    pos.canvas.to.textIndex(mPosCanvasOffset, mPosText);
    //convert to chunk column, row
    pos.canvas.to.chunkIndex(mPosCanvasOffset, mPosChunk);

    //set our cursor position
    cursor.setTextPos(mPosText.x, mPosText.y, true);
  });

  function isChunkVisible (cx: number, cy: number) {
    const p = loopVisibleChunksPos;
    const min = loopVisibleChunksMin;
    const max = loopVisibleChunksMax;
    
    p.copy(scene.localTransform.position);

    pos.canvas.to.chunkIndex(p, min);
    p.x += canvas.width;
    p.y += canvas.height;
    pos.canvas.to.chunkIndex(p, max);

    return (
      cx >= min.x && cx <= max.x &&
      cy >= min.y && cy <= max.y
    );
  }

  const loopVisibleChunksPos = new Vec2();
  const loopVisibleChunksMin = new Vec2();
  const loopVisibleChunksMax = new Vec2();
  function loopVisibleChunks (cb: (p: Vec2)=> void) {
    const p = loopVisibleChunksPos;
    const min = loopVisibleChunksMin;
    const max = loopVisibleChunksMax;
    
    p.copy(scene.localTransform.position);

    pos.canvas.to.chunkIndex(p, min);
    p.x += canvas.width;
    p.y += canvas.height;
    pos.canvas.to.chunkIndex(p, max);

    for (let x=min.x; x<max.x+1; x++) {
      for (let y=min.y; y<max.y+1; y++) {
        p.x = x;
        p.y = y;
        cb(p);
      }
    }
  }

  function populateVisibleChunks () {
    //loop over rendered chunks
    for (let [index, ch] of TextChunk.tracked) {
      //check if its visible
      if (isChunkVisible(ch.cx, ch.cy)) {
        // if (!ch.id) {

        // }
        continue;
      }
      TextChunk.tryUnload(ch.cx, ch.cy);
    }
    loopVisibleChunks((c)=>{
      let ch = TextChunk.tryLoad(c.x, c.y);
      if (!ch) return;
      scene.add(ch);
    })
  }

  db.ctx.collection("chunks").subscribe<ChunkJson>("*", (data)=>{
    let { cx, cy, id, src } = data.record;
    let ch = TextChunk.getLoaded(cx, cy);
    if (!ch) return;
    
    ch._src = src;
    ch._binFromSrc();
    
    //this won't do anything if chunk has been subscribe to already
    ch.subscribe(id);

  });

  setInterval(()=>{
    populateVisibleChunks();
  }, 1000);

  const tryTypeVec = new Vec2();
  function tryType (tx: number, ty: number, ch: string) {
    tryTypeVec.set(tx, ty);
    pos.text.to.chunkIndex(tryTypeVec, tryTypeVec);
    let cx = tryTypeVec.x;
    let cy = tryTypeVec.y;
    
    let chunk = TextChunk.getLoaded(cx, cy);
    if (chunk === undefined) return;
    
    const column = tx % TextChunk.CHAR_WIDTH;
    const row = ty % TextChunk.CHAR_HEIGHT;
    const idx = TextChunk._2dTo1d(column, row, TextChunk.CHAR_WIDTH);
    chunk._bin[idx] = ch.charCodeAt(0);
    chunk._srcFromBin();

    chunk.trySend();
  }

  const keyDownHandler = (evt: {key: string})=>{
    const { key } = evt;

    switch (key) {
      case "ArrowRight":
        cursor.addTextPos(1, 0);
        break;
      case "ArrowLeft": 
        cursor.addTextPos(-1, 0);
        break;
      case "ArrowUp":
        cursor.addTextPos(0, -1);
        break;
      case "ArrowDown":
        cursor.addTextPos(0, 1);
        break;
      case "Enter":
        cursor.newLine();
        break;
      case "Backspace":
        cursor.addTextPos(-1, 0, true);
        tryType(cursor.tx, cursor.ty, " ");
        //TODO - handle backspace
        break;
      case "Spacebar":
        cursor.addTextPos(1, 0);
        //TODO - handle space
        break;
      case "Shift":
      case "Control":
      case "CapsLock":
        //do nothing
        break;
      case "Tab":
        cursor.addTextPos(2, 0);
        break;
      default:
        tryType(cursor.tx, cursor.ty, key);
        cursor.addTextPos(1, 0);
        //TODO - handle type char
        break;
    }
  };

  let canvasFocus = true;

  window.addEventListener("keydown", (evt)=>{
    if (!canvasFocus) return;
    keyDownHandler(evt);
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
