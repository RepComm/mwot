# mwot
My World Of Text

Similar in ways to [Our World Of Text](https://ourworldoftext.com) aka [NodeWorldOfText](https://github.com/system2k/NodeWorldOfText)

## How it works
- backend - pocketbase, database and static web server
- admin bot (not impl yet) - node.js script, connects to pocketbase as superuser, queries and adjusts data
- client - typescript, HTML 2d canvas, connects w/ realtime API of pocketbase, facilitates frontend experience

### data
- chunks
  - unique chunk index cx,cy
  - src - raw text of the chunk, client uses fixed width/height to render text
  - editorid - last user id string required for create/update of chunk
- chats
  - from - single user, required to create/update a message
  - to - zero, or multiple users - when populated, message only queryable by these users, otherwise visible to any user
  - message - raw text content
- cursors
  - tx,ty global text offset in the world, used to render user's cursor(s)
- users
  - normal user stuff
  - cursors - refers to cursors collection, a set of cursors belonging to the user

