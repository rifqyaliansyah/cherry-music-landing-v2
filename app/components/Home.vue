<script setup>
import { ref, inject, watch, computed, onMounted, onUnmounted } from 'vue'
import { useMusicStore } from '~/stores/music'

const musicStore = useMusicStore()

const songs = computed(() => musicStore.songs)
const loading = computed(() => musicStore.loading)
const error = computed(() => musicStore.error)

const currentSong = ref(null)
const currentIndex = ref(-1)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isLoadingAudio = ref(false)

const audioRef = ref(null)

const lyricsState = inject('lyricsState')

const gridClass = computed(() => {
    if (lyricsState?.lyricsOpen.value) {
        return 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    }
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
})

const skeletonCount = computed(() => {
    if (lyricsState?.lyricsOpen.value) {
        return 8
    }
    return 10
})

// Restore player state dari localStorage
const restorePlayerState = async () => {
    const savedState = musicStore.loadPlayerState()

    if (!savedState || !savedState.currentSong) {
        return
    }

    // Validate if song still exists
    const isValid = await musicStore.validateSavedSong(savedState.currentSong.id)

    if (!isValid) {
        return
    }

    // Get fresh data from songs list (updated dari API)
    const freshSong = songs.value.find(s => s.id === savedState.currentSong.id)

    if (!freshSong) {
        musicStore.clearPlayerState()
        return
    }

    // Fetch detail (termasuk lyrics) dari API
    const songDetail = await musicStore.fetchSongDetail(freshSong.id)
    const songToRestore = songDetail || freshSong

    // Restore dengan data yang fresh
    currentSong.value = songToRestore
    currentIndex.value = songs.value.findIndex(s => s.id === freshSong.id)

    // Sync with layout
    if (lyricsState) {
        lyricsState.setCurrentSong(songToRestore)
    }

    // Load audio (tapi jangan auto play)
    if (audioRef.value) {
        audioRef.value.src = songToRestore.audio_url
        audioRef.value.load()
        duration.value = songToRestore.duration || 0
    }
}

// Fetch songs dan restore state
onMounted(async () => {
    await musicStore.fetchSongs()
    await restorePlayerState()
    setupAudioEvents()
})

const setupAudioEvents = () => {
    if (!audioRef.value) return

    const audio = audioRef.value

    const updateTime = () => {
        if (!isNaN(audio.currentTime)) {
            currentTime.value = audio.currentTime
        }
        if (!isNaN(audio.duration) && audio.duration > 0) {
            duration.value = audio.duration
        }
    }

    audio.addEventListener('loadedmetadata', () => {
        if (!isNaN(audio.duration)) {
            duration.value = audio.duration
        }
    })

    audio.addEventListener('canplay', () => {
        isLoadingAudio.value = false
        if (isPlaying.value) {
            audio.play().catch(err => {
                console.error('Error playing audio:', err)
                isPlaying.value = false
            })
        }
    })

    audio.addEventListener('loadstart', () => {
        isLoadingAudio.value = true
    })

    audio.addEventListener('timeupdate', updateTime)

    audio.addEventListener('ended', () => {
        nextSong()
    })

    audio.addEventListener('play', () => {
        isPlaying.value = true
    })

    audio.addEventListener('pause', () => {
        isPlaying.value = false
    })

    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e)
        isLoadingAudio.value = false
        isPlaying.value = false
    })
}

watch(currentSong, (newSong) => {
    if (lyricsState) {
        lyricsState.setCurrentSong(newSong)
    }

    // Save to localStorage whenever song changes
    if (newSong) {
        musicStore.savePlayerState(newSong, currentIndex.value)
    } else {
        musicStore.clearPlayerState()
    }
})

watch(currentTime, (time) => {
    if (lyricsState) {
        lyricsState.setCurrentTime(time)
    }
})

watch(() => lyricsState?.currentTime.value, (newTime) => {
    if (newTime !== undefined && newTime !== currentTime.value && audioRef.value) {
        audioRef.value.currentTime = newTime
        currentTime.value = newTime
    }
})

watch(isPlaying, async (playing) => {
    if (!audioRef.value || !currentSong.value) return

    await nextTick()

    if (playing) {
        if (audioRef.value.readyState >= 2) {
            audioRef.value.play().catch(err => {
                console.error('Error playing audio:', err)
                isPlaying.value = false
            })
        } else {
            const playWhenReady = () => {
                audioRef.value.play().catch(err => {
                    console.error('Error playing audio:', err)
                    isPlaying.value = false
                })
                audioRef.value.removeEventListener('canplay', playWhenReady)
            }
            audioRef.value.addEventListener('canplay', playWhenReady)
        }
    } else {
        audioRef.value.pause()
    }
})

onUnmounted(() => {
    if (audioRef.value) {
        audioRef.value.pause()
        audioRef.value.src = ''
    }
})

const loadAndPlayAudio = async (song) => {
    if (!audioRef.value) return

    isLoadingAudio.value = true
    isPlaying.value = false

    currentTime.value = 0

    audioRef.value.src = song.audio_url
    audioRef.value.load()

    duration.value = song.duration || 0

    return new Promise((resolve) => {
        const onCanPlay = () => {
            audioRef.value.removeEventListener('canplay', onCanPlay)
            isLoadingAudio.value = false
            resolve(true)
        }

        const onError = () => {
            audioRef.value.removeEventListener('error', onError)
            isLoadingAudio.value = false
            resolve(false)
        }

        audioRef.value.addEventListener('canplay', onCanPlay)
        audioRef.value.addEventListener('error', onError)

        setTimeout(() => {
            audioRef.value.removeEventListener('canplay', onCanPlay)
            audioRef.value.removeEventListener('error', onError)
            isLoadingAudio.value = false
            resolve(false)
        }, 5000)
    })
}

const playSong = async (song, index) => {
    const songDetail = await musicStore.fetchSongDetail(song.id)

    let songToPlay = songDetail || song

    currentSong.value = songToPlay
    currentIndex.value = index

    await loadAndPlayAudio(songToPlay)

    isPlaying.value = true
}

const togglePlay = () => {
    if (!currentSong.value) return

    if (isLoadingAudio.value) {
        setTimeout(() => {
            isPlaying.value = !isPlaying.value
        }, 100)
    } else {
        isPlaying.value = !isPlaying.value
    }
}

const togglePlayFromCard = async (song, index, event) => {
    event.stopPropagation()

    if (currentSong.value?.id === song.id) {
        togglePlay()
    } else {
        await playSong(song, index)
    }
}

const nextSong = async () => {
    if (songs.value.length === 0) return

    if (currentIndex.value < songs.value.length - 1) {
        currentIndex.value++
        await playSong(songs.value[currentIndex.value], currentIndex.value)
    } else {
        currentIndex.value = 0
        await playSong(songs.value[0], 0)
    }
}

const previousSong = async () => {
    if (songs.value.length === 0) return

    if (currentIndex.value > 0) {
        currentIndex.value--
        await playSong(songs.value[currentIndex.value], currentIndex.value)
    } else {
        currentIndex.value = songs.value.length - 1
        await playSong(songs.value[songs.value.length - 1], songs.value.length - 1)
    }
}

const seekTo = (time) => {
    if (audioRef.value && currentSong.value) {
        audioRef.value.currentTime = time
        currentTime.value = time
    }
}

const openLyrics = () => {
    if (lyricsState) {
        lyricsState.openLyrics()
    }
}
</script>

<template>
    <div class="pb-32">
        <!-- Audio element (hidden) -->
        <audio ref="audioRef" preload="auto" style="display: none;"></audio>

        <!-- Loading overlay untuk audio -->
        <div v-if="isLoadingAudio"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 pointer-events-none">
            <div class="loading loading-spinner loading-lg"></div>
        </div>

        <div class="container mx-auto max-w-6xl px-4">
            <div class="py-6 md:py-8">
                <h1 class="text-xs font-bold opacity-60">Created by you</h1>
                <h1 class="text-3xl font-bold mb-6">All Songs</h1>

                <!-- Loading State with Skeleton -->
                <div v-if="loading" class="grid gap-4 transition-all duration-300" :class="gridClass">
                    <div v-for="i in skeletonCount" :key="i" class="card bg-base-100 shadow-md">
                        <figure class="px-4 pt-4">
                            <div class="skeleton w-full aspect-square rounded-xl"></div>
                        </figure>
                        <div class="card-body p-4">
                            <div class="skeleton h-5 w-3/4 mb-2"></div>
                            <div class="skeleton h-4 w-1/2"></div>
                        </div>
                    </div>
                </div>

                <!-- Error State -->
                <div v-else-if="error" class="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ error }}</span>
                </div>

                <!-- Empty State -->
                <div v-else-if="!songs.length" class="flex flex-col items-center justify-center py-20">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 opacity-30 mb-4" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p class="text-lg opacity-60">Belum ada lagu tersedia</p>
                </div>

                <!-- Songs Grid -->
                <div v-else class="grid gap-4 transition-all duration-300" :class="gridClass">
                    <div v-for="(song, index) in songs" :key="song.id" @click="playSong(song, index)"
                        class="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group">
                        <figure class="px-4 pt-4 relative">
                            <div class="relative w-full">
                                <img :src="song.cover" alt="Song Cover"
                                    class="rounded-xl aspect-square object-cover w-full" />
                                <div
                                    class="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button @click="togglePlayFromCard(song, index, $event)"
                                        class="hover:scale-110 transition-transform"
                                        :disabled="isLoadingAudio && currentSong?.id === song.id">
                                        <svg v-if="currentSong?.id !== song.id || !isPlaying"
                                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"
                                            class="w-16 h-16 drop-shadow-lg">
                                            <path
                                                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                        </svg>
                                        <svg v-else-if="isPlaying && currentSong?.id === song.id"
                                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"
                                            class="w-16 h-16 drop-shadow-lg">
                                            <path fill-rule="evenodd"
                                                d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"
                                                clip-rule="evenodd" />
                                        </svg>
                                        <span v-else class="loading loading-spinner loading-md"></span>
                                    </button>
                                </div>

                                <div v-if="currentSong?.id === song.id && isPlaying"
                                    class="absolute top-2 right-2 bg-primary text-primary-content px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <span class="flex gap-0.5">
                                        <span class="w-0.5 h-3 bg-current animate-pulse"
                                            style="animation-delay: 0s"></span>
                                        <span class="w-0.5 h-3 bg-current animate-pulse"
                                            style="animation-delay: 0.15s"></span>
                                        <span class="w-0.5 h-3 bg-current animate-pulse"
                                            style="animation-delay: 0.3s"></span>
                                    </span>
                                    Playing
                                </div>

                                <div v-if="currentSong?.id === song.id && !isPlaying"
                                    class="absolute top-2 right-2 bg-primary text-primary-content px-2 py-1 rounded-full text-xs font-bold">
                                    Paused
                                </div>
                            </div>
                        </figure>
                        <div class="card-body p-4">
                            <h2 class="card-title text-base truncate">{{ song.title }}</h2>
                            <p class="text-xs opacity-60 truncate">{{ song.name }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <MusicPlayerBar :current-song="currentSong" :is-playing="isPlaying" :current-time="currentTime"
            :duration="duration" @toggle-play="togglePlay" @next="nextSong" @previous="previousSong" @seek="seekTo"
            @open-lyrics="openLyrics" />
    </div>
</template>

<style scoped>
@keyframes pulse {

    0%,
    100% {
        transform: scaleY(0.5);
    }

    50% {
        transform: scaleY(1);
    }
}

.animate-pulse {
    animation: pulse 1s ease-in-out infinite;
}
</style>