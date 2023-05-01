
import type pocketbaseEs from "pocketbase";
import PocketBase, { RecordAuthResponse } from "pocketbase";
import { UserJson } from "./user";

export const db = {
  url: undefined as string,
  ctx: undefined as pocketbaseEs,
  userData: undefined as RecordAuthResponse<UserJson>,

  init () {
    db.url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
    db.ctx = new PocketBase(db.url);
  },
  isLoggedIn () {
    return db.ctx.authStore.isValid;
  },
  async login(uname: string, upass: string) {
    db.ctx.collection("users")
    .authWithPassword(uname, upass).then((record) => {
      db.userData = record;
      console.log("Login result", db.userData);
      alert("Successfully logged in");

      // pb.collection("cursors").getList<CursorJson>(0, 10, {
      //   filter: `created<${}`
      // })

    }).catch((reason) => {
      alert(reason);
    });
  }
};
