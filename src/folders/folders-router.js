const express = require('express')
const logger = require('../logger')
const bodyParser = express.json()
const xss = require('xss')
const path = require('path')
const FoldersService = require('./folders-service')
const foldersRouter = express.Router()

const serializeFolders = folder => (
    {
        id: folder.id,
        ...(folder.name && {name: xss(folder.name)})
    }
)


foldersRouter
    .route('/')
    .get((req, res, next) => {
        FoldersService.getAllFolders(req.app.get('db'))
        .then(folders => {
            if(!folders) {
                return res.status(200).send([]).end()
            }
            res.json(folders.map(serializeFolders))
        })
        .catch(next)
    })

    .post(bodyParser, (req,res, next) => {
        const name = req.body.name;

        if(!name){
            logger.error('Must include a name');
            return res
                .status(400)
                .send('Invalid name')
        }

        const folder = { name }

        FoldersService.createNewFolder(
            req.app.get('db'),
            folder
        )
        .then(folder => {
            res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                .json(folder)
        })
        .catch(next)
        logger.info(`Folder with id ${folder.id} and name ${folder.name} created`)
    })

foldersRouter
    .route('/:id')
    .all((req, res, next) => {
        FoldersService.getFolderById(
            req.app.get('db'),
            req.params.id
        )
        .then(folder => {
            if(!folder){
                return res.status(404).json({
                    error: {message: 'Folder not found'}
                })
            }
            res.folder = folder
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeFolders(res.folder))
    })

    .delete((req, res, next) => {
        FoldersService.deleteFolder(
            req.app.get('db'),
            req.params.id
        )
        .then(() => {
            res.status(204).end()
        })
        .catch(next)
    })

module.exports = foldersRouter;