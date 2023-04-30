migrate((db) => {
  const collection = new Collection({
    "id": "w9z8r0sw2fbx7x1",
    "created": "2023-04-29 19:55:39.280Z",
    "updated": "2023-04-29 19:55:39.280Z",
    "name": "chunks",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "xmstuov3",
        "name": "src",
        "type": "text",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 128,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "sau7vx2o",
        "name": "cx",
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
        "id": "pokiiq7g",
        "name": "cy",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_6wJ6twA` ON `chunks` (\n  `cx`,\n  `cy`\n)"
    ],
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
  const collection = dao.findCollectionByNameOrId("w9z8r0sw2fbx7x1");

  return dao.deleteCollection(collection);
})
