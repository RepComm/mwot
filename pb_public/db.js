import PocketBase from "pocketbase";
export const db = {
  url: undefined,
  ctx: undefined,
  init() {
    db.url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
    db.ctx = new PocketBase(db.url);
    // db.ctx.autoCancellation(false);
  },

  isLoggedIn() {
    return db.ctx.authStore.isValid;
  },
  async login(uname, upass) {
    db.ctx.collection("users").authWithPassword(uname, upass).then(record => {
      alert("Successfully logged in");

      // pb.collection("cursors").getList<CursorJson>(0, 10, {
      //   filter: `created<${}`
      // })
    }).catch(reason => {
      alert(reason);
    });
  }
};