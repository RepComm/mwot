import { CursorJson } from "./cursor";

export interface UserJson {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  cursors: CursorJson[];
}
