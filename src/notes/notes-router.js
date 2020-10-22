const express = require('express');
const xss = require('xss');
const notesService = require('./notes-service');

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = note => ({
  note_id: note.note_id,
  note_name: xss(note.note_name),
  content: xss(note.content),
  modified: note.modified,
  folder_id: note.folder_id,
})

notesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    notesService.getAllNotes(knexInstance)
      .then(notes => {
        res.json(notes.map(serializeNote))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { note_name, content, folder_id } = req.body;
    const newNote = { note_name, content, folder_id };

    for(const [key, value] of Object.entries(newNote)){
      if(value == null){
          return res.status(400).json({
              error: { message: `Missing '${key}' in request body'`}
          });
      }
    }
    
    notesService.newNote(knexInstance, newNote)
      .then(note => {
        res.status(201)
        .location(req.originalUrl + `/${note.note_id}`)
        .json(serializeNote(note))
      })
      .catch(next)
  });

notesRouter
  .route('/:note_id')
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    const noteId = req.params.note_id;

      notesService.getById(knexInstance, noteId)
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: { message: `Note doesn't exist` }
          });
        }
        res.note = note
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    return res.json(serializeNote(note))
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get('db');
    const deleteNoteId = res.note.note_id;

    notesService.deleteNote(knexInstance, deleteNoteId)
       .then(() => res.status(204).end())
       .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const updateNoteId = res.note.note_id;
    const { note_name, content, folder_id } = req.body;
    const updatedNote = { note_name, content, folder_id };

    //check that at least one field is getting updated in order to patch
    const numberOfValues = Object.values(updatedNote).filter(Boolean).length;
    if(numberOfValues === 0){
        return res.status(400).json({
            error: { message: `Request body must contain either 'note_name', 'content', or 'folder_id'`}
        });
    }

    updatedNote.modified = new Date();

    notesService.updateNote(knexInstance, updateNoteId, updatedNote)
     .then(() => res.status(204).end())
     .catch(next);
  });

 module.exports = notesRouter;