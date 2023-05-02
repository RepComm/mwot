migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("w9z8r0sw2fbx7x1")

  collection.createRule = "@request.auth.id != \"\" && lasteditor.id = @request.auth.id"
  collection.updateRule = "@request.auth.id != \"\" && lasteditor.id = @request.auth.id"

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "rod9lhks",
    "name": "lasteditor",
    "type": "relation",
    "required": false,
    "unique": false,
    "options": {
      "collectionId": "_pb_users_auth_",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": []
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("w9z8r0sw2fbx7x1")

  collection.createRule = null
  collection.updateRule = null

  // remove
  collection.schema.removeField("rod9lhks")

  return dao.saveCollection(collection)
})
