<script setup>
import { provide, ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useMusicStore } from '~/stores/music'

const musicStore = useMusicStore()

const lyricsOpen = ref(false)
const currentSong = ref(null)
const currentTime = ref(0)

const currentIndex = ref(-1)
const isPlaying = ref(false)
const duration = ref(0)
const isLoadingAudio = ref(false)
const shuffleEnabled = ref(false)
const repeatMode = ref('off')
const volume = ref(1)
const shuffledIndices = ref([])
const isUserSeeking = ref(false)
const audioRef = ref(null)

const songs = ref([])

const loadSongs = async () => {
    try {
        songs.value = await musicStore.fetchSongs()
    } catch (err) {
        console.error('Error loading songs:', err)
        songs.value = []
    }
}

const contentMarginClass = computed(() => {
    return currentSong.value ? 'mb-[105px]' : ''
})

const loadAndPlayAudio = async (song) => {
    if (!audioRef.value) return

    isLoadingAudio.value = true
    isPlaying.value = false
    currentTime.value = 0

    if (song.duration) {
        duration.value = song.duration
    }

    audioRef.value.src = song.audio_url
    audioRef.value.load()
    audioRef.value.volume = volume.value

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

const nextSong = async () => {
    if (songs.value.length === 0) return

    let nextIndex

    if (shuffleEnabled.value && shuffledIndices.value.length > 0) {
        const currentPos = shuffledIndices.value.indexOf(currentIndex.value)
        const nextPos = (currentPos + 1) % shuffledIndices.value.length
        nextIndex = shuffledIndices.value[nextPos]
    } else {
        if (currentIndex.value < songs.value.length - 1) {
            nextIndex = currentIndex.value + 1
        } else {
            nextIndex = 0
        }
    }

    const songDetail = await musicStore.fetchSongDetail(songs.value[nextIndex].id)
    let songToPlay = songDetail || songs.value[nextIndex]

    currentSong.value = songToPlay
    currentIndex.value = nextIndex

    await loadAndPlayAudio(songToPlay)
    isPlaying.value = true
}

const previousSong = async () => {
    if (songs.value.length === 0) return

    let prevIndex

    if (shuffleEnabled.value && shuffledIndices.value.length > 0) {
        const currentPos = shuffledIndices.value.indexOf(currentIndex.value)
        const prevPos = currentPos - 1 < 0 ? shuffledIndices.value.length - 1 : currentPos - 1
        prevIndex = shuffledIndices.value[prevPos]
    } else {
        if (currentIndex.value > 0) {
            prevIndex = currentIndex.value - 1
        } else {
            prevIndex = songs.value.length - 1
        }
    }

    const songDetail = await musicStore.fetchSongDetail(songs.value[prevIndex].id)
    let songToPlay = songDetail || songs.value[prevIndex]

    currentSong.value = songToPlay
    currentIndex.value = prevIndex

    await loadAndPlayAudio(songToPlay)
    isPlaying.value = true
}

const handleSongEnd = () => {
    if (repeatMode.value === 'one') {
        audioRef.value.currentTime = 0
        audioRef.value.play()
    } else if (repeatMode.value === 'all') {
        nextSong()
    } else {
        if (shuffleEnabled.value) {
            const currentPos = shuffledIndices.value.indexOf(currentIndex.value)
            if (currentPos < shuffledIndices.value.length - 1) {
                nextSong()
            } else {
                isPlaying.value = false
            }
        } else {
            if (currentIndex.value < songs.value.length - 1) {
                nextSong()
            } else {
                isPlaying.value = false
            }
        }
    }
}

const shufflePlaylist = () => {
    if (songs.value.length === 0) return

    if (shuffleEnabled.value) {
        shuffledIndices.value = [...Array(songs.value.length).keys()]
            .sort(() => Math.random() - 0.5)

        if (currentIndex.value !== -1) {
            const currentPos = shuffledIndices.value.indexOf(currentIndex.value)
            if (currentPos > 0) {
                [shuffledIndices.value[0], shuffledIndices.value[currentPos]] =
                    [shuffledIndices.value[currentPos], shuffledIndices.value[0]]
            }
        }
    } else {
        shuffledIndices.value = []
    }
}

const toggleShuffle = () => {
    if (repeatMode.value !== 'off') return
    shuffleEnabled.value = !shuffleEnabled.value
    shufflePlaylist()
    musicStore.savePlaybackSettings(shuffleEnabled.value, repeatMode.value)
}

const toggleRepeat = () => {
    if (shuffleEnabled.value) return
    const modes = ['off', 'all', 'one']
    const currentModeIndex = modes.indexOf(repeatMode.value)
    repeatMode.value = modes[(currentModeIndex + 1) % modes.length]
    musicStore.savePlaybackSettings(shuffleEnabled.value, repeatMode.value)
}

const handleVolumeChange = (newVolume) => {
    volume.value = newVolume
    if (audioRef.value) {
        audioRef.value.volume = newVolume
    }
}

const handleSeekStart = () => {
    isUserSeeking.value = true
}

const handleSeekEnd = () => {
    setTimeout(() => {
        isUserSeeking.value = false
    }, 100)
}

const toggleLyrics = () => {
    lyricsOpen.value = !lyricsOpen.value
}

const seekTo = (time) => {
    if (audioRef.value && currentSong.value) {
        audioRef.value.currentTime = time
        currentTime.value = time
    }
}

const handleLyricsSeek = (time) => {
    seekTo(time)
}

const setupAudioEvents = () => {
    if (!audioRef.value) return

    const audio = audioRef.value

    const updateTime = () => {
        if (!isNaN(audio.currentTime)) {
            if (duration.value > 0 && audio.currentTime >= duration.value && !isUserSeeking.value) {
                audio.pause()
                currentTime.value = duration.value
                handleSongEnd()
                return
            }

            const clampedTime = duration.value > 0
                ? Math.min(audio.currentTime, duration.value)
                : audio.currentTime

            currentTime.value = clampedTime
        }
        if (!duration.value && !isNaN(audio.duration) && audio.duration > 0) {
            duration.value = audio.duration
        }
    }

    audio.addEventListener('loadedmetadata', () => {
        if (!duration.value && !isNaN(audio.duration)) {
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
        if (!isUserSeeking.value) {
            handleSongEnd()
        }
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

const restorePlayerState = async () => {
    const savedState = musicStore.loadPlayerState()

    if (!savedState || !savedState.currentSong) {
        return
    }

    const isValid = await musicStore.validateSavedSong(savedState.currentSong.id)

    if (!isValid) {
        return
    }

    const freshSong = songs.value.find(s => s.id === savedState.currentSong.id)

    if (!freshSong) {
        musicStore.clearPlayerState()
        return
    }

    const songDetail = await musicStore.fetchSongDetail(freshSong.id)
    const songToRestore = songDetail || freshSong

    currentSong.value = songToRestore
    currentIndex.value = songs.value.findIndex(s => s.id === freshSong.id)

    if (audioRef.value) {
        audioRef.value.src = songToRestore.audio_url
        audioRef.value.load()
        if (songToRestore.duration) {
            duration.value = songToRestore.duration
        }
        audioRef.value.volume = volume.value
    }
}

const restorePlaybackSettings = () => {
    const settings = musicStore.loadPlaybackSettings()
    if (settings) {
        shuffleEnabled.value = settings.shuffleEnabled || false
        repeatMode.value = settings.repeatMode || 'off'

        if (shuffleEnabled.value) {
            shufflePlaylist()
        }
    }
}

provide('lyricsState', {
    lyricsOpen,
    currentSong,
    currentTime,
    openLyrics: () => {
        lyricsOpen.value = true
    },
    closeLyrics: () => {
        lyricsOpen.value = false
    },
    setCurrentSong: (song) => { currentSong.value = song },
    setCurrentTime: (time) => { currentTime.value = time },
    seekTo: (time) => { currentTime.value = time }
})

provide('playerState', {
    currentSong,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    isLoadingAudio,
    playSong: async (song, index) => {
        if (currentSong.value?.id === song.id) {
            togglePlay()
            return
        }

        const songDetail = await musicStore.fetchSongDetail(song.id)
        let songToPlay = songDetail || song

        currentSong.value = songToPlay
        currentIndex.value = index

        await loadAndPlayAudio(songToPlay)
        isPlaying.value = true
    },
    togglePlay,
    nextSong,
    previousSong,
    seekTo
})

watch(currentSong, (newSong) => {
    if (newSong) {
        musicStore.savePlayerState(newSong, currentIndex.value)
    } else {
        musicStore.clearPlayerState()
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

watch(songs, () => {
    if (shuffleEnabled.value) {
        shufflePlaylist()
    }
})

onMounted(async () => {
    await loadSongs()
    restorePlaybackSettings()
    await restorePlayerState()
    setupAudioEvents()
})

onUnmounted(() => {
    if (audioRef.value) {
        audioRef.value.pause()
        audioRef.value.src = ''
    }
})
</script>

<template>
    <div class="relative h-screen overflow-hidden">
        <audio ref="audioRef" preload="auto" style="display: none;"></audio>

        <div v-if="isLoadingAudio"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 pointer-events-none">
            <div class="loading loading-spinner loading-lg"></div>
        </div>

        <div class="drawer lg:drawer-open h-screen overflow-hidden">
            <input id="my-drawer-4" type="checkbox" class="drawer-toggle" />

            <div class="drawer-content flex flex-col h-full overflow-hidden transition-all duration-300"
                :class="{ 'lg:mr-80': lyricsOpen }">
                <Navbar />
                <div class="flex-1 overflow-y-auto" :class="contentMarginClass">
                    <slot />
                </div>
            </div>

            <Sidebar />
        </div>

        <LyricsSidebar :is-open="lyricsOpen" :current-song="currentSong" :current-time="currentTime"
            @close="lyricsOpen = false" @seek="handleLyricsSeek" />

        <MusicPlayerBar :current-song="currentSong" :is-playing="isPlaying" :current-time="currentTime"
            :duration="duration" :shuffle-enabled="shuffleEnabled" :repeat-mode="repeatMode" :volume="volume"
            :lyrics-open="lyricsOpen" @toggle-play="togglePlay" @next="nextSong" @previous="previousSong" @seek="seekTo"
            @open-lyrics="toggleLyrics" @toggle-shuffle="toggleShuffle" @toggle-repeat="toggleRepeat"
            @volume-change="handleVolumeChange" @seek-start="handleSeekStart" @seek-end="handleSeekEnd" />
    </div>
</template>