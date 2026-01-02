import { defineStore } from 'pinia'
import {
    initDB,
    getAllSongs,
    getSongById,
    addSong,
    updateSong,
    deleteSong
} from '~/utils/indexedDB'

const STORAGE_KEY = 'music_player_state'
const PLAYBACK_SETTINGS_KEY = 'playback_settings'

export const useMusicStore = defineStore('music', {
    state: () => ({}),

    actions: {
        async initDatabase() {
            try {
                await initDB()
                console.log('IndexedDB initialized')
            } catch (err) {
                console.error('Failed to initialize IndexedDB:', err)
                throw err
            }
        },

        async fetchSongs() {
            try {
                await this.initDatabase()
                const songs = await getAllSongs()
                return songs
            } catch (err) {
                console.error('Error fetching songs from IndexedDB:', err)
                throw new Error(err.message || 'Failed to fetch songs')
            }
        },

        async fetchSongDetail(songId) {
            try {
                await this.initDatabase()
                const song = await getSongById(songId)
                return song
            } catch (err) {
                console.error('Error fetching song detail:', err)
                return null
            }
        },

        async addNewSong(songData) {
            try {
                await this.initDatabase()
                const song = await addSong(songData)
                return song
            } catch (err) {
                console.error('Error adding song:', err)
                throw new Error(err.message || 'Failed to add song')
            }
        },

        async updateExistingSong(songId, updates) {
            try {
                await this.initDatabase()
                const song = await updateSong(songId, updates)
                return song
            } catch (err) {
                console.error('Error updating song:', err)
                throw new Error(err.message || 'Failed to update song')
            }
        },

        async deleteExistingSong(songId) {
            try {
                await this.initDatabase()
                await deleteSong(songId)
                return true
            } catch (err) {
                console.error('Error deleting song:', err)
                throw new Error(err.message || 'Failed to delete song')
            }
        },

        async getAudioDuration(audioFile) {
            return new Promise((resolve) => {
                const audio = new Audio()
                const url = URL.createObjectURL(audioFile)

                audio.addEventListener('loadedmetadata', () => {
                    resolve(audio.duration)
                    URL.revokeObjectURL(url)
                })

                audio.addEventListener('error', () => {
                    resolve(0)
                    URL.revokeObjectURL(url)
                })

                audio.src = url
            })
        },

        async downloadFromYouTube(youtubeUrl, metadata) {
            try {
                const config = useRuntimeConfig()
                const apiBaseUrl = config.public.apiBaseUrl

                const formData = new FormData()
                formData.append('youtube_url', youtubeUrl)
                formData.append('title', metadata.title)
                formData.append('artist', metadata.artist)

                if (metadata.cover instanceof File) {
                    formData.append('cover', metadata.cover)
                }

                if (metadata.lyrics) {
                    formData.append('lyrics', JSON.stringify(metadata.lyrics))
                }

                const response = await $fetch(`${apiBaseUrl}/songs/download`, {
                    method: 'POST',
                    body: formData
                })

                if (response.success && response.data) {
                    const audioResponse = await fetch(response.data.audio_url)
                    const audioBlob = await audioResponse.blob()

                    let coverBlob = null
                    if (response.data.cover_url && !response.data.cover_url.includes('placehold.co')) {
                        const coverResponse = await fetch(response.data.cover_url)
                        coverBlob = await coverResponse.blob()
                    } else if (metadata.cover instanceof File) {
                        coverBlob = metadata.cover
                    }

                    const songData = {
                        title: response.data.title,
                        artist: response.data.artist,
                        audioBlob: audioBlob,
                        coverBlob: coverBlob,
                        duration: response.data.duration || 0,
                        lyrics: metadata.lyrics || [],
                        youtube_url: youtubeUrl
                    }

                    const savedSong = await this.addNewSong(songData)
                    return savedSong
                }

                throw new Error('Failed to download from YouTube')
            } catch (err) {
                console.error('Error downloading from YouTube:', err)
                throw err
            }
        },

        savePlayerState(song, index) {
            if (!song) {
                this.clearPlayerState()
                return
            }

            try {
                const state = {
                    currentSong: {
                        id: song.id,
                        title: song.title,
                        artist: song.artist,
                        cover: song.cover,
                        duration: song.duration,
                        audio_url: song.audio_url,
                        youtube_url: song.youtube_url
                    },
                    currentIndex: index,
                    timestamp: Date.now()
                }

                localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
            } catch (err) {
                console.error('Error saving player state:', err)
            }
        },

        loadPlayerState() {
            try {
                const saved = localStorage.getItem(STORAGE_KEY)
                if (!saved) return null

                const state = JSON.parse(saved)

                if (!state.currentSong || !state.currentSong.id) {
                    this.clearPlayerState()
                    return null
                }

                return state
            } catch (err) {
                console.error('Error loading player state:', err)
                this.clearPlayerState()
                return null
            }
        },

        clearPlayerState() {
            try {
                localStorage.removeItem(STORAGE_KEY)
            } catch (err) {
                console.error('Error clearing player state:', err)
            }
        },

        async validateSavedSong(songId) {
            try {
                const song = await this.fetchSongDetail(songId)

                if (!song) {
                    console.warn(`Song ${songId} not found, clearing player state`)
                    this.clearPlayerState()
                    return false
                }

                return true
            } catch (err) {
                console.error('Error validating saved song:', err)
                return false
            }
        },

        savePlaybackSettings(shuffleEnabled, repeatMode) {
            try {
                const settings = {
                    shuffleEnabled,
                    repeatMode
                }
                localStorage.setItem(PLAYBACK_SETTINGS_KEY, JSON.stringify(settings))
            } catch (err) {
                console.error('Error saving playback settings:', err)
            }
        },

        loadPlaybackSettings() {
            try {
                const saved = localStorage.getItem(PLAYBACK_SETTINGS_KEY)
                if (!saved) return null

                const settings = JSON.parse(saved)
                return settings
            } catch (err) {
                console.error('Error loading playback settings:', err)
                return null
            }
        },
        
        async downloadFromYouTubeOnly(youtubeUrl, metadata) {
            try {
                const config = useRuntimeConfig()
                const apiBaseUrl = config.public.apiBaseUrl

                const formData = new FormData()
                formData.append('youtube_url', youtubeUrl)
                formData.append('title', metadata.title)
                formData.append('artist', metadata.artist)

                if (metadata.cover instanceof File) {
                    formData.append('cover', metadata.cover)
                }

                if (metadata.lyrics) {
                    formData.append('lyrics', JSON.stringify(metadata.lyrics))
                }

                const response = await $fetch(`${apiBaseUrl}/songs/download-only`, {
                    method: 'POST',
                    body: formData
                })

                if (response.success && response.data) {
                    const audioResponse = await fetch(response.data.audio_url)
                    const audioBlob = await audioResponse.blob()

                    let coverBlob = null
                    if (response.data.cover_url && !response.data.cover_url.includes('placehold.co')) {
                        const coverResponse = await fetch(response.data.cover_url)
                        coverBlob = await coverResponse.blob()
                    } else if (metadata.cover instanceof File) {
                        coverBlob = metadata.cover
                    }

                    const songData = {
                        title: response.data.title,
                        artist: response.data.artist,
                        audioBlob: audioBlob,
                        coverBlob: coverBlob,
                        duration: response.data.duration || 0,
                        lyrics: metadata.lyrics || [],
                        youtube_url: youtubeUrl
                    }

                    const savedSong = await this.addNewSong(songData)
                    return savedSong
                }

                throw new Error('Failed to download from YouTube')
            } catch (err) {
                console.error('Error downloading from YouTube:', err)
                throw err
            }
        }
    }
})