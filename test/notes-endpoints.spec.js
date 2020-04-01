const knex = require('knex')
const app = require('../src/app')
const {makeNotesArray, makeMaliciousNote} = require('./notes.fixtures')
const {makeFoldersArray} = require('./folders.fixtures')


describe.only(`Notes endpoints`, function() {
    let db

    before(`make knex instance`, () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    after(`disconnect from db`, () => db.destroy())

    before(`clean the table`, () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    afterEach( `cleanup`, () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    beforeEach('fill folder db', () => {
        const folders = makeFoldersArray()
        return db
        .into('noteful_folders')
        .insert(folders)
    })
    
    describe(`GET /api/notes`, () =>{
        context(`given no notes`, () => {
            describe(`Get /api/notes`, () => {
                it('responds with 200', () => {
                    return supertest(app)
                    .get(`/api/notes`)
                    .expect(200, [])
                })
            })    
        })

        context(`given notes`, () => {
            const testNotes = makeNotesArray()
            beforeEach('insert notes into db', () => {
                return db
                    .into('noteful_notes')
                    .insert(testNotes)
            })

            it(`responds with 200 and notes`, () => {
                return supertest(app)
                .get('/api/notes')
                .expect(200, testNotes)
            })
        })
    })

    describe(`GET /api/notes/:id`, () => {
        context(`Given no notes`, () => {
            let id = 12345

            it(`responds with 404`, () => {
                return supertest(app)
                .get(`/api/notes/${id}`)
                .expect(404, {error: {message: 'note not found'}})
            })
        })

        context(`given notes`, () => {
            const testNotes = makeNotesArray()
            let id = 2
            let expectedNote = testNotes[id - 1]
            beforeEach('insert notes into db', () => {
                return db
                .into('noteful_notes')
                .insert(testNotes)
            })

            it(`responds with 200 and the note`, () => {
                return supertest(app)
                .get(`/api/notes/${id}`)
                .expect(200, expectedNote)
            })
        })
    })

    describe(`POST /api/notes`, () => {
        it(`creates a note, responding with 201 and the new note`, () => {
            this.retries(3)
            const newNote = {
                folder_id: 1,
                note_name: 'test',
                content: 'content'
            }

            return supertest(app)
            .post('/api/notes')
            .send(newNote)
            .expect(201)
            .expect(res => {
                expect(res.body.folder_id).to.eql(newNote.folder_id)
                expect(res.body.note_name).to.eql(newNote.note_name)
                expect(res.body.content).to.eql(newNote.content)
                expect(res.body).to.have.property('id')
                expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
            })
            .then(postRes => 
                supertest(app)
                .get(`/api/notes/${postRes.body.id}`)
                .expect(postRes.body)
            )
        })

        const requiredFields = ['folder_id', 'note_name', 'content']

        requiredFields.forEach(field => {
            const newNote = {
              note_name: 'Test new article',
              folder_id: 1,
              content: 'Test new note content...'
            }
      
            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
              delete newNote[field]
      
              return supertest(app)
                .post('/api/articles')
                .send(newNote)
                .expect(400, {
                  error: { message: `Missing '${field}' in request body` }
                })
            })
        })
    })

    describe(`DELETE /api/notes/:id`, () => {
        context(`given there are articles in the db`, () => {
            const testnotes = makeNotesArray()

            beforeEach('insert notes into db', () => {
                return db
                .into('noteful_notes')
                .insert(testnotes)
            })

            it(`responds with 204 and removes the bookmark`, () => {
                const idToRemove = 2
                const expectednotes = testnotes.filter(note => note.id !== idToRemove)

                return supertest(app)
                .delete(`/api/notes/${idToRemove}`)
                .expect(204)
                .then(res => 
                    supertest(app)
                    .get(`/api/notes`)
                    .expect(expectednotes)
                )
            })
        })
    })
})