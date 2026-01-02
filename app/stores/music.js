import { defineStore } from 'pinia'

const STORAGE_KEY = 'music_player_state'
const PLAYBACK_SETTINGS_KEY = 'playback_settings'

export const useMusicStore = defineStore('music', {
    state: () => ({
        // Tidak ada state untuk songs dan songDetails lagi
        // Semua akan fetch langsung dari API
    }),

    getters: {
        // Getters dihapus karena tidak ada state lagi
    },

    actions: {
        // Fetch songs langsung dari API tanpa simpan ke state
        async fetchSongs() {
            try {
                const config = useRuntimeConfig()
                const apiBaseUrl = config.public.apiBaseUrl

                const response = await $fetch(`${apiBaseUrl}/songs`)

                if (response.success && response.data) {
                    return response.data.map(song => ({
                        id: song.id,
                        title: song.title,
                        artist: song.artist,
                        cover: song.cover_url || 'https://placehold.co/300x300/333/fff?text=No+Cover',
                        duration: song.duration,
                        audio_url: song.audio_url,
                        youtube_url: song.youtube_url
                    }))
                }
                return []
            } catch (err) {
                console.error('Error fetching songs:', err)
                throw new Error(err.message || 'Failed to fetch songs')
            }
        },

        // Fetch song detail langsung dari API tanpa cache
        async fetchSongDetail(songId) {
            try {
                const config = useRuntimeConfig()
                const apiBaseUrl = config.public.apiBaseUrl

                const response = await $fetch(`${apiBaseUrl}/songs/${songId}`)

                if (response.success && response.data) {
                    return {
                        id: response.data.id,
                        title: response.data.title,
                        artist: response.data.artist,
                        cover: response.data.cover_url || 'https://placehold.co/300x300/333/fff?text=No+Cover',
                        duration: response.data.duration,
                        audio_url: response.data.audio_url,
                        youtube_url: response.data.youtube_url,
                        lyrics: response.data.lyrics || []
                    }
                }
                return null
            } catch (err) {
                console.error('Error fetching song detail:', err)
                return null
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
                        artist: song.artist,
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

        // Validate if saved song still exists (fetch dari API)
        async validateSavedSong(songId) {
            try {
                const songs = await this.fetchSongs()
                const songExists = songs.some(song => song.id === songId)

                if (!songExists) {
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