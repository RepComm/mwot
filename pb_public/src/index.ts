
import { Object2D, Vec2 } from "@repcomm/scenario2d";
import { exponent, UIBuilder } from "@roguecircuitry/htmless";
import { TextChunk } from "./textchunk.js";
import { Cursor } from "./cursor.js";

import PocketBase, { RecordAuthResponse } from "pocketbase";
import { UserJson } from "./user.js";
const pbUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
const pb = new PocketBase(pbUrl);

function isLoggedIn() {
  return pb.authStore.isValid;
}

async function main() {

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
    }
  };

  let userData: RecordAuthResponse<UserJson>;
  async function login(uname: string, upass: string) {
    pb.collection("users").authWithPassword(uname, upass).then((record) => {
      userData = record;
      console.log("Login result", userData);
      alert("Successfully logged in");



      // pb.collection("cursors").getList<CursorJson>(0, 10, {
      //   filter: `created<${}`
      // })

    }).catch((reason) => {
      alert(reason);
    });
  }

  const ui = new UIBuilder();

  ui.default(exponent);

  ui.create("div").id("container").mount(document.body);
  const container = ui.e;

  const hSplit = ui.create("div", "h-split").style({ flexDirection: "column" }).mount(container).e;
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

  const r = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  };
  scene.onRenderSelf = (ctx) => {
    ctx.strokeRect(r.x * TextChunk.CHAR_WIDTH * TextChunk.metricsMonoWidth, r.y * TextChunk.CHAR_HEIGHT * TextChunk.metricsLineHeight, r.w, r.h);
    return this;
  };

  ui.ref(canvas).on("click", (evt) => {
    //get offset of mouse from canvas top left pixels
    mPosCanvasOffset.set(evt.offsetX, evt.offsetY);

    //convert to text column, row
    pos.canvas.to.textIndex(mPosCanvasOffset, mPosText);
    //convert to chunk column, row
    pos.canvas.to.chunkIndex(mPosCanvasOffset, mPosChunk);

    //set our cursor position
    cursor.setTextPos(mPosText.x, mPosText.y, true);
    
    //demo render code for chunk border
    r.x = mPosChunk.x;
    r.y = mPosChunk.y;
    r.w = TextChunk.CHAR_WIDTH * TextChunk.metricsMonoWidth;
    r.h = TextChunk.CHAR_HEIGHT * TextChunk.metricsLineHeight;
  });

  window.addEventListener("keypress", ()=>{

  });
  window.addEventListener("keydown", (evt)=>{
    // console.log(evt);
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
        //TODO - handle backspace
        break;
      case "Spacebar":
        cursor.addTextPos(1, 0);
        //TODO - handle space
        break;
      default:
        
        break;
    }

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
