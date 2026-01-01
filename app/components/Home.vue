<script setup>
import { inject, computed } from 'vue'
import { useMusicStore } from '~/stores/music'

const musicStore = useMusicStore()

const songs = computed(() => musicStore.songs)
const loading = computed(() => musicStore.loading)
const error = computed(() => musicStore.error)

// Inject states from layout
const lyricsState = inject('lyricsState')
const playerState = inject('playerState')

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

const playSong = (song, index) => {
    if (playerState) {
        playerState.playSong(song, index)
    }
}
</script>

<template>
    <div class="pb-0">
        <div class="container mx-auto max-w-6xl px-4">
            <div class="py-6 md:py-8">
                <h1 class="text-xs font-bold opacity-60">Created for you</h1>
                <h1 class="text-3xl font-bold mb-6">All Music</h1>

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

                <div v-else-if="error" class="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ error }}</span>
                </div>

                <div v-else-if="!songs.length" class="flex flex-col items-center justify-center py-20">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 opacity-30 mb-4" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p class="text-lg opacity-60">No songs found</p>
                </div>

                <div v-else class="grid gap-4 transition-all duration-300" :class="gridClass">
                    <div v-for="(song, index) in songs" :key="song.id" @click="playSong(song, index)"
                        class="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group">
                        <figure class="px-4 pt-4 relative">
                            <div class="relative w-full">
                                <img :src="song.cover" alt="Song Cover"
                                    class="rounded-xl aspect-square object-cover w-full" />

                                <div
                                    class="hidden md:flex absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center pointer-events-none">
                                    <div class="hover:scale-110 transition-transform">
                                        <svg v-if="playerState?.currentSong.value?.id !== song.id || !playerState?.isPlaying.value"
                                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"
                                            class="w-16 h-16 drop-shadow-lg">
                                            <path
                                                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                        </svg>
                                        <svg v-else-if="playerState?.isPlaying.value && playerState?.currentSong.value?.id === song.id"
                                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"
                                            class="w-16 h-16 drop-shadow-lg">
                                            <path fill-rule="evenodd"
                                                d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"
                                                clip-rule="evenodd" />
                                        </svg>
                                        <span v-else class="loading loading-spinner loading-md"></span>
                                    </div>
                                </div>

                                <div v-if="playerState?.currentSong.value?.id === song.id"
                                    class="md:hidden absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div class="bg-black/60 rounded-full p-2">
                                        <svg v-if="!playerState?.isPlaying.value" xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24" fill="white" class="w-8 h-8 drop-shadow-lg">
                                            <path
                                                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                        </svg>
                                        <svg v-else-if="playerState?.isPlaying.value" xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24" fill="white" class="w-8 h-8 drop-shadow-lg">
                                            <path fill-rule="evenodd"
                                                d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"
                                                clip-rule="evenodd" />
                                        </svg>
                                        <span v-else class="loading loading-spinner loading-md"></span>
                                    </div>
                                </div>

                                <div v-if="playerState?.currentSong.value?.id === song.id && playerState?.isPlaying.value"
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

                                <div v-if="playerState?.currentSong.value?.id === song.id && !playerState?.isPlaying.value"
                                    class="absolute top-2 right-2 bg-primary text-primary-content px-2 py-1 rounded-full text-xs font-bold">
                                    Paused
                                </div>
                            </div>
                        </figure>
                        <div class="card-body p-4">
                            <h2 class="card-title text-base line-clamp-2 leading-tight">{{ song.title }}</h2>
                            <p class="text-xs opacity-60 truncate">{{ song.artist }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
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