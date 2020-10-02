const path = require('path')
const express = require('express')
const xss = require('xss')
//const logger = require('./logger');
const foldersService = require('./folders-service')

const foldersRouter = express.Router()
const jsonParser = express.json()

const serializeFolder = folder => ({
    id: folder.id,
    name: xss(folder.name),
})

const serializeNote = note => ({
    ...note,
    name: xss(note.name),
    content: xss(note.content)
});
  
foldersRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        foldersService.getAllFolders(knexInstance)
        .then(folders => {
            res.json(folders.map(serializeFolder))
        })
      .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { name } = req.body
        const newFolder = { name }

    for (const [key, value] of Object.entries(newFolder)) {
        if (value == null) {
            return res.status(400).json({
                error: { message: `Missing '${key}' in request body` }
            })
        }
    }
    newFolder.name = name
    foldersService.insertFolder(
        req.app.get('db'),
        newFolder
    )
    .then(folder => {
        res
            .status(201)
            .location(path.posix.join(req.originalUrl, `/${folder.id}`))
            .json(serializeFolder(folder))
    })
            .catch(next)
    })

foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        foldersService.getById(
            req.app.get('db'),
            req.params.folderId
        )
    .then(folder => {
        if (!folder) {
            return res.status(404).json({
                error: { message: `Folder doesn't exist` }
            })
        }
        res.folder = folder // save the article for the next middleware
        next() // don't forget to call next so the next middleware happens!
    })
    .catch(next)
    })
    .get((req,res,next) => {
      const knexInstance = req.app.get('db');
      foldersService.getFolderNotes(knexInstance, req.params.id)
        .then((notes)=>{
          res.json(notes.map(note => serializeNote(note)));
        })
        .catch(next);
    })
    .delete((req,res,next)=>{
      const { id } = req.params;
      const knexInstance = req.app.get('db');
      foldersService.deleteFolder(knexInstance,id)
        .then(() => {
          res.status(204).end();
        })
        .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const { name } = req.body
        const folderToUpdate = { name }
        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain 'name'`
                }
            })
        }
        foldersService.updateFolder(
          req.app.get('db'),
          req.params.folderId,
          folderToUpdate
        )
          .then(() => {
            res.status(204).end();
          })
          .catch(next);
      });

module.exports = foldersRouter