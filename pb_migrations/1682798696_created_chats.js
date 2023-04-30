migrate((db) => {
  const collection = new Collection({
    "id": "trieto883ded5dp",
    "created": "2023-04-29 20:04:56.010Z",
    "updated": "2023-04-29 20:04:56.010Z",
    "name": "chats",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "oktycw9d",
        "name": "from",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": [
            "name"
          ]
        }
      },
      {
        "system": false,
        "id": "98aumwb9",
        "name": "to",
        "type": "relation",
        "required": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 3,
          "displayFields": []
        }
      },
      {
        "system": false,
        "id": "yogximuw",
        "name": "message",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": 256,
          "pattern": ""
        }
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.id != \"\" && (@request.auth.id = from.id || @request.auth.id = to.id )",
    "viewRule": "@request.auth.id != \"\" && (@request.auth.id = from.id || @request.auth.id = to.id )",
    "createRule": "@request.auth.id != \"\" && @request.auth.id = from.id",
    "updateRule": "@request.auth.id != \"\" && @request.auth.id = from.id",
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("trieto883ded5dp");

  return dao.deleteCollection(collection);
})
