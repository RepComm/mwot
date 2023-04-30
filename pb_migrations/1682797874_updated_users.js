migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("_pb_users_auth_")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "3c5dwqdx",
    "name": "cursors",
    "type": "relation",
    "required": false,
    "unique": false,
    "options": {
      "collectionId": "6xvpfvfa6nr2hfs",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": null,
      "displayFields": []
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("_pb_users_auth_")

  // remove
  collection.schema.removeField("3c5dwqdx")

  return dao.saveCollection(collection)
})
