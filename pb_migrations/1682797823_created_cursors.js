migrate((db) => {
  const collection = new Collection({
    "id": "6xvpfvfa6nr2hfs",
    "created": "2023-04-29 19:50:23.919Z",
    "updated": "2023-04-29 19:50:23.919Z",
    "name": "cursors",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "caxioqbf",
        "name": "tx",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null
        }
      },
      {
        "system": false,
        "id": "xj746ehf",
        "name": "ty",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("6xvpfvfa6nr2hfs");

  return dao.deleteCollection(collection);
})
