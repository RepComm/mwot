
import { UIBuilder } from "@roguecircuitry/htmless";

async function main () {
  
  let ui = new UIBuilder();

  ui.create("div").id("container").mount(document.body);
  let container = ui.e;

  ui.create("span").textContent("Hello World").mount(container);

    
}

main();
