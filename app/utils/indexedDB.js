const DB_NAME = 'cherry_music_db'
const DB_VERSION = 1
const STORE_NAME = 'songs'

let db = null

export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
            db = request.result
            resolve(db)
        }

        request.onupgradeneeded = (event) => {
            const db = event.target.result

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
                objectStore.createIndex('title', 'title', { unique: false })
                objectStore.createIndex('artist', 'artist', { unique: false })
                objectStore.createIndex('createdAt', 'createdAt', { unique: false })
            }
        }
    })
}

const generateId = () => {
    return `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const addSong = async (songData) => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)

        const song = {
            id: generateId(),
            title: songData.title,
            artist: songData.artist,
            audioBlob: songData.audioBlob,
            coverBlob: songData.coverBlob,
            duration: songData.duration || 0,
            lyrics: songData.lyrics || [],
            youtube_url: songData.youtube_url || null,
            createdAt: Date.now()
        }

        const request = store.add(song)

        request.onsuccess = () => resolve(song)
        request.onerror = () => reject(request.error)
    })
}

export const getAllSongs = async () => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAll()

        request.onsuccess = () => {
            const songs = request.result.map(song => ({
                id: song.id,
                title: song.title,
                artist: song.artist,
                cover: song.coverBlob ? URL.createObjectURL(song.coverBlob) : 'https://placehold.co/300x300/333/fff?text=No+Cover',
                duration: song.duration,
                audio_url: song.audioBlob ? URL.createObjectURL(song.audioBlob) : null,
                youtube_url: song.youtube_url,
                createdAt: song.createdAt
            }))
            resolve(songs)
        }

        request.onerror = () => reject(request.error)
    })
}

export const getSongById = async (id) => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(id)

        request.onsuccess = () => {
            const song = request.result
            if (song) {
                resolve({
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    cover: song.coverBlob ? URL.createObjectURL(song.coverBlob) : 'https://placehold.co/300x300/333/fff?text=No+Cover',
                    duration: song.duration,
                    audio_url: song.audioBlob ? URL.createObjectURL(song.audioBlob) : null,
                    youtube_url: song.youtube_url,
                    lyrics: song.lyrics || []
                })
            } else {
                resolve(null)
            }
        }

        request.onerror = () => reject(request.error)
    })
}

export const updateSong = async (id, updates) => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const getRequest = store.get(id)

        getRequest.onsuccess = () => {
            const song = getRequest.result

            if (!song) {
                reject(new Error('Song not found'))
                return
            }

            if (updates.title !== undefined) song.title = updates.title
            if (updates.artist !== undefined) song.artist = updates.artist
            if (updates.audioBlob !== undefined) song.audioBlob = updates.audioBlob
            if (updates.coverBlob !== undefined) song.coverBlob = updates.coverBlob
            if (updates.duration !== undefined) song.duration = updates.duration
            if (updates.lyrics !== undefined) song.lyrics = updates.lyrics
            if (updates.youtube_url !== undefined) song.youtube_url = updates.youtube_url

            const updateRequest = store.put(song)

            updateRequest.onsuccess = () => resolve(song)
            updateRequest.onerror = () => reject(updateRequest.error)
        }

        getRequest.onerror = () => reject(getRequest.error)
    })
}

export const deleteSong = async (id) => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(id)

        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
    })
}

export const clearAllSongs = async () => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.clear()

        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
    })
}