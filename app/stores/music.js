import { defineStore } from 'pinia'

const STORAGE_KEY = 'music_player_state'
const PLAYBACK_SETTINGS_KEY = 'playback_settings'

export const useMusicStore = defineStore('music', {
    state: () => ({
        songs: [],
        loading: false,
        error: null,
        songDetails: {},
        loadingDetail: false,
        errorDetail: null
    }),

    getters: {
        hasSongs: (state) => state.songs.length > 0,
        getSongById: (state) => (id) => {
            return state.songs.find(song => song.id === id)
        },
        getSongDetail: (state) => (id) => {
            return state.songDetails[id] || null
        },
        hasLyrics: (state) => (id) => {
            const detail = state.songDetails[id]
            return detail && detail.lyrics && detail.lyrics.length > 0
        }
    },

    actions: {
        async fetchSongs() {
            this.loading = true
            this.error = null

            try {
                const config = useRuntimeConfig()
                const apiBaseUrl = config.public.apiBaseUrl

                const response = await $fetch(`${apiBaseUrl}/songs`)

                if (response.success && response.data) {
                    this.songs = response.data.map(song => ({
                        id: song.id,
                        title: song.title,
                        name: song.artist,
                        cover: song.cover_url || 'https://placehold.co/300x300/333/fff?text=No+Cover',
                        duration: song.duration,
                        audio_url: song.audio_url,
                        youtube_url: song.youtube_url
                    }))
                }
            } catch (err) {
                this.error = err.message || 'Failed to fetch songs'
                console.error('Error fetching songs:', err)
                this.songs = []
            } finally {
                this.loading = false
            }
        },

        async fetchSongDetail(songId) {
            if (this.songDetails[songId]) {
                return this.songDetails[songId]
            }

            this.loadingDetail = true
            this.errorDetail = null

            try {
                const config = useRuntimeConfig()
                const apiBaseUrl = config.public.apiBaseUrl

                const response = await $fetch(`${apiBaseUrl}/songs/${songId}`)

                if (response.success && response.data) {
                    const songDetail = {
                        id: response.data.id,
                        title: response.data.title,
                        name: response.data.artist,
                        cover: response.data.cover_url || 'https://placehold.co/300x300/333/fff?text=No+Cover',
                        duration: response.data.duration,
                        audio_url: response.data.audio_url,
                        youtube_url: response.data.youtube_url,
                        lyrics: response.data.lyrics || []
                    }

                    this.songDetails[songId] = songDetail

                    return songDetail
                }
            } catch (err) {
                this.errorDetail = err.message || 'Failed to fetch song detail'
                console.error('Error fetching song detail:', err)
                return null
            } finally {
                this.loadingDetail = false
            }
        },

        clearDetailCache(songId) {
            if (songId) {
                delete this.songDetails[songId]
            } else {
                this.songDetails = {}
            }
        },

        // LocalStorage actions for player state
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
                        name: song.name,
                        cover: song.cover,
                        duration: song.duration,
                        audio_url: song.audio_url,
                        youtube_url: song.youtube_url,
                        lyrics: song.lyrics || []
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

                // Validate state structure
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

        // Validate if saved song still exists
        async validateSavedSong(songId) {
            // Wait for songs to be loaded
            if (this.loading) {
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (!this.loading) {
                            clearInterval(checkInterval)
                            resolve()
                        }
                    }, 100)
                })
            }

            // Check if song exists in current songs list
            const songExists = this.songs.some(song => song.id === songId)

            if (!songExists) {
                console.warn(`Song ${songId} not found, clearing player state`)
                this.clearPlayerState()
                return false
            }

            return true
        },

        // LocalStorage actions for playback settings
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
        }
    }
})