const knex = require('knex')
const app = require('../src/app')
const {makeFoldersArray, makeMaliciousFolder} = require('./folders.fixtures')


describe.skip(`Folders endpoints`, function() {
    let db

    before(`make knex instance`, () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    after(`disconnect from db`, () => db.destroy())

    before(`clean the table`, () => db.raw('TRUNCATE noteful_folders RESTART IDENTITY CASCADE'))

    afterEach( `cleanup`, () => db.raw('TRUNCATE noteful_folders RESTART IDENTITY CASCADE'))
    
    describe(`GET /api/folders`, () =>{
        context(`given no folders`, () => {
            describe(`Get /api/folders`, () => {
                it('responds with 200', () => {
                    return supertest(app)
                    .get(`/api/folders`)
                    .expect(200, [])
                })
            })    
        })

        context(`given folders`, () => {
            const testFolders = makeFoldersArray()
            beforeEach('insert folders into db', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it(`responds with 200 and folders`, () => {
                return supertest(app)
                .get('/api/folders')
                .expect(200, testFolders)
            })
        })
    })

    describe(`GET /api/folders/:id`, () => {
        context(`Given no folders`, () => {
            let id = 12345

            it(`responds with 404`, () => {
                return supertest(app)
                .get(`/api/folders/${id}`)
                .expect(404, {error: {message: 'Folder not found'}})
            })
        })

        context(`given folders`, () => {
            const testFolders = makeFoldersArray()
            let id = 2
            let expectedFolder = testFolders[id - 1]
            beforeEach('insert folders into db', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
            })

            it(`responds with 200 and the folder`, () => {
                return supertest(app)
                .get(`/api/folders/${id}`)
                .expect(200, expectedFolder)
            })
        })
    })

    describe(`POST /api/folders`, () => {
        it(`creates a folder, responding with 201 and the new folder`, () => {
            this.retries(3)
            const newFolder = {
                name: 'new folder'
            }

            return supertest(app)
            .post('/api/folders')
            .send(newFolder)
            .expect(201)
            .expect(res => {
                expect(res.body.name).to.eql(newFolder.name)
                expect(res.body).to.have.property('id')
                expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
            })
            .then(postRes => 
                supertest(app)
                .get(`/api/folders/${postRes.body.id}`)
                .expect(postRes.body)
            )
        })
    })

    describe(`DELETE /api/folders/:id`, () => {
        context(`given there are articles in the db`, () => {
            const testFolders = makeFoldersArray()

            beforeEach('insert folders into db', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
            })

            it(`responds with 204 and removes the bookmark`, () => {
                const idToRemove = 2
                const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove)

                return supertest(app)
                .delete(`/api/folders/${idToRemove}`)
                .expect(204)
                .then(res => 
                    supertest(app)
                    .get(`/api/folders`)
                    .expect(expectedFolders)
                )
            })
        })
    })
})