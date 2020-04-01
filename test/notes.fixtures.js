function makeNotesArray() {
    return [
        {
            id: 1,
            folder_id: 1,
            note_name: 'test',
            content: 'content',
            modified: '2100-05-22T16:28:32.615Z'

        },
        {
            id: 2,
            folder_id: 1,
            note_name: 'test',
            content: 'content',
            modified: '2100-05-22T16:28:32.615Z'
    }
    ]
}

function makeMaliciousNote() {
    const maliciousNote = {
        id: 911,
        name: 'naughty <script>alert("xss");</script>',
    }

    const expectedNote = {
        ...maliciousBookmark,
        name: 'naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;'
    }

    return {maliciousNote, expectedNote}
}

module.exports = {
    makeNotesArray,
    makeMaliciousNote
}