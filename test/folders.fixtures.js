function makeFoldersArray() {
    return [
        {
            id: 1,
            name: 'name'
        },
        {
            id: 2,
            name: 'name2'
        }
    ]
}

function makeMaliciousFolder() {
    const maliciousFolder = {
        id: 911,
        name: 'naughty <script>alert("xss");</script>',
    }

    const expectedFolder = {
        ...maliciousBookmark,
        name: 'naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;'
    }

    return {maliciousFolder, expectedFolder}
}

module.exports = {
    makeFoldersArray,
    makeMaliciousFolder
}