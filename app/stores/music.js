// app/stores/music.js
import { defineStore } from 'pinia'

export const useMusicStore = defineStore('music', {
    state: () => ({
        songs: [],
        loading: false,
        error: null,
        // Detail songs cache (key: songId, value: song detail with lyrics)
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
                    // Map API response ke format yang dipakai di component
                    this.songs = response.data.map(song => ({
                        id: song.id,
                        title: song.title,
                        name: song.artist, // API pakai 'artist', component pakai 'name'
                        cover: song.cover_url || 'https://placehold.co/300x300/333/fff?text=No+Cover',
                        duration: song.duration,
                        audio_url: song.audio_url,
                        youtube_url: song.youtube_url
                    }))
                }
            } catch (err) {
                this.error = err.message || 'Failed to fetch songs'
                console.error('Error fetching songs:', err)
                this.songs = [] // Clear songs on error
            } finally {
                this.loading = false
            }
        },

        async fetchSongDetail(songId) {
            // Check cache first
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

                    // Cache the detail
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
        }
    }
})