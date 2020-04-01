const express = require('express')
const logger = require('../logger')
const bodyParser = express.json()
const xss = require('xss')
const path = require('path')
const notesService = require('./notes-service')
const notesRouter = express.Router()

const serializeNotes = note => (
    {
        id: note.id,
        folder_id: note.folder_id,
        modified: note.modified,
        note_name: xss(note.note_name),
        content: xss(note.content)
    }
)


notesRouter
    .route('/')
    .get((req, res, next) => {
        notesService.getAllNotes(req.app.get('db'))
        .then(notes => {
            if(!notes) {
                return res.status(200).send([]).end()
            }
            res.json(notes.map(serializeNotes))
        })
        .catch(next)
    })

    .post(bodyParser, (req,res, next) => {
        const { folder_id, modified, note_name, content} = req.body;
        const newNote = {folder_id, note_name, content};

        for (const [key, value] of Object.entries(newNote))
            if (value == null){
                return res.status(400).json({
            error: { message: `Missing '${key}' in request body` }
            })
        }

        newNote.modified = modified


        notesService.createNewNote(
            req.app.get('db'),
            newNote
        )
        .then(note => {
            res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${note.id}`))
                .json(serializeNotes(note))

            logger.info(`note with id ${note.id} and name ${note.note_name} created`)

        })
        .catch(next)
    })

notesRouter
    .route('/:id')
    .all((req, res, next) => {
        notesService.getNoteById(
            req.app.get('db'),
            req.params.id
        )
        .then(note => {
            if(!note){
                return res.status(404).json({
                    error: {message: 'note not found'}
                })
            }
            res.note = note
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeNotes(res.note))
    })

    .delete((req, res, next) => {
        notesService.deleteNote(
            req.app.get('db'),
            req.params.id
        )
        .then(() => {
            res.status(204).end()
        })
        .catch(next)
    })

module.exports = notesRouter;