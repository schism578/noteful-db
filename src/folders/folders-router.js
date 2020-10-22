const path = require('path');
const express = require('express');
const xss = require('xss');
const foldersService = require('./folders-service');

const foldersRouter = express.Router()
const jsonParser = express.json()

const serializeFolder = folder => ({
    folder_id: folder.folder_id,
    folder_name: xss(folder.folder_name),
})

const serializeNote = note => ({
    ...note,
    note_name: xss(note.note_name),
    content: xss(note.content)
});
  
foldersRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');

        foldersService.getAllFolders(knexInstance)
        .then(folders => {
            res.json(folders.map(serializeFolder))
        })
      .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db');
        const { folder_name } = req.body;
        const newFolder = { folder_name };

    for (const [key, value] of Object.entries(newFolder)) {
        if (value == null) {
            return res.status(400).json({
                error: { message: `Missing '${key}' in request body` }
            })
        }
    }
    newFolder.folder_name = folder_name;

    foldersService.insertFolder(knexInstance, newFolder)
        .then(folder => {
            res.status(201)
            .location(path.posix.join(req.originalUrl + `/${folder.id}`))
            .json(serializeFolder(folder))
        })
        .catch(next)
    })

foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        foldersService.getById(req.app.get('db'), req.params.folder_id)
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

      foldersService.getFolderNotes(knexInstance, req.params.folder_id)
        .then((notes)=>{
          res.json(notes.map(note => serializeNote(note)));
        })
        .catch(next);
    })
    .delete((req,res,next)=>{
        const folderToDelete = req.params.folder_id;
      const knexInstance = req.app.get('db');

      foldersService.deleteFolder(knexInstance, folderToDelete)
        .then(() => {
          res.status(204).end();
        })
        .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db');
        const { folder_name } = req.body;
        const folderToUpdate = req.params.folder_id;
        const updatedFolder = { folder_name };
    
    if(!folder_name){
        return res.status(400).json({ 
            error: { message: `Request body must contain Folder Name`}
        });
    }

    foldersService.updateFolder(knexInstance, folderToUpdate, updatedFolder)
     .then(() => {
         res.status(204).end();
     })
     .catch(next);
  })
  

 module.exports = foldersRouter
