migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("w9z8r0sw2fbx7x1")

  collection.createRule = "@request.auth.id != \"\" && @request.data.editorid = @request.auth.id"
  collection.updateRule = "@request.auth.id != \"\" && @request.data.editorid = @request.auth.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("w9z8r0sw2fbx7x1")

  collection.createRule = null
  collection.updateRule = null

  return dao.saveCollection(collection)
})
