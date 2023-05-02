migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("w9z8r0sw2fbx7x1")

  collection.createRule = "@request.auth.id != \"\" && editorid = @request.auth.id"
  collection.updateRule = "@request.auth.id != \"\" && editorid = @request.auth.id"
  collection.deleteRule = ""

  // remove
  collection.schema.removeField("rod9lhks")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "lxqtv1ln",
    "name": "editorid",
    "type": "text",
    "required": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("w9z8r0sw2fbx7x1")

  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = null

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

  // remove
  collection.schema.removeField("lxqtv1ln")

  return dao.saveCollection(collection)
})
