<script setup>
import { ref, inject, watch, computed, onUnmounted } from 'vue'

const songs = ref([
    { title: "About You", name: "The 1975", cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLHxGbeuivjpsMdf5JN_gdw-8zQ4YT8ZCBUQ&s", duration: 245 },
    { title: "Terbuang Dalam Waktu", name: "Barasuara", cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUuTu9hgKTUHTLDph1dxmiN9y3sm61NA1d8g&s", duration: 198 },
    { title: "Tentang Kita", name: "Kla Project", cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf9fiPFas91vcPMNpHJBbg3JbyKQLSh2nN1Q&s", duration: 267 },
    { title: "Kita", name: "Sheila On 7", cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWTCNdffqey5USEAA4Nlcbpall7kE14Js6AA&s", duration: 223 },
    { title: "A Sorrowful Reunion", name: "Reality Club", cover: "https://i.scdn.co/image/ab67616d0000b2736019b1ddb28634421cc291a0", duration: 189 },
    { title: "Multo", name: "Cup of Joe", cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRy0atfrNCY8LtVZIPyDQFW2DqLIJnn9Ac4Tg&s", duration: 234 },
    { title: "Andai Aku Bisa", name: "Chrisye", cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7zi6CZqkMjevZu3yetGaJFNkR-Zp9k-8eNQ&s", duration: 256 },
    { title: "Team", name: "Lorde", cover: "https://i1.sndcdn.com/artworks-000064437418-ni6751-t500x500.jpg", duration: 193 },
    { title: "Kasih Putih", name: "Yovie Widianto", cover: "https://i.scdn.co/image/ab67616d0000b2731ce2ae44de421c5852ef7eeb", duration: 241 },
    { title: "Soulmate", name: "Kahitna", cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsv13oQtPRYQO4iQl5FqwUZ5nsdGYc6OtgrA&s", duration: 278 },
])

const currentSong = ref(null)
const currentIndex = ref(-1)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

let intervalId = null

const lyricsState = inject('lyricsState')

const gridClass = computed(() => {
    if (lyricsState?.lyricsOpen.value) {
        return 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    }
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
})

// Sync currentSong dengan layout
watch(currentSong, (newSong) => {
    if (lyricsState) {
        lyricsState.setCurrentSong(newSong)
    }
    if (newSong) {
        duration.value = newSong.duration
        currentTime.value = 0
    }
})

// Sync currentTime dengan layout
watch(currentTime, (time) => {
    if (lyricsState) {
        lyricsState.setCurrentTime(time)
    }
})

// Simulasi audio playback
watch(isPlaying, (playing) => {
    if (playing) {
        intervalId = setInterval(() => {
            if (currentTime.value < duration.value) {
                currentTime.value++
            } else {
                // Auto next song ketika selesai
                nextSong()
            }
        }, 1000) // 1 detik = 1 detik simulasi
    } else {
        if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
        }
    }
})

onUnmounted(() => {
    if (intervalId) {
        clearInterval(intervalId)
    }
})

const playSong = (song, index) => {
    currentSong.value = song
    currentIndex.value = index
    currentTime.value = 0
    isPlaying.value = true
}

const togglePlay = () => {
    isPlaying.value = !isPlaying.value
}

const nextSong = () => {
    if (currentIndex.value < songs.value.length - 1) {
        currentIndex.value++
        currentSong.value = songs.value[currentIndex.value]
        currentTime.value = 0
        isPlaying.value = true
    } else {
        // Sudah di akhir playlist
        isPlaying.value = false
    }
}

const previousSong = () => {
    if (currentIndex.value > 0) {
        currentIndex.value--
        currentSong.value = songs.value[currentIndex.value]
        currentTime.value = 0
        isPlaying.value = true
    }
}

const seekTo = (time) => {
    currentTime.value = time
}

const openLyrics = () => {
    if (lyricsState) {
        lyricsState.openLyrics()
    }
}
</script>

<template>
    <div class="pb-32">
        <div class="container mx-auto max-w-6xl px-4">
            <div class="py-6 md:py-8">
                <h1 class="text-xs font-bold opacity-60">Created by you</h1>
                <h1 class="text-3xl font-bold mb-6">All Songs</h1>

                <div class="grid gap-4 transition-all duration-300" :class="gridClass">
                    <div v-for="(song, index) in songs" :key="index" @click="playSong(song, index)"
                        class="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group">
                        <figure class="px-4 pt-4 relative">
                            <div class="relative w-full">
                                <img :src="song.cover" alt="Song Cover"
                                    class="rounded-xl aspect-square object-cover w-full" />
                                <div
                                    class="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"
                                        class="w-16 h-16 drop-shadow-lg">
                                        <path
                                            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                    </svg>
                                </div>

                                <!-- Now Playing Indicator -->
                                <div v-if="currentSong?.title === song.title && isPlaying"
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

        <!-- Music Player Bar -->
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