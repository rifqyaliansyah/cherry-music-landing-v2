<script setup>
import { provide, ref, computed, onMounted } from 'vue'
import { useMusicStore } from '~/stores/music'

const musicStore = useMusicStore()

const lyricsOpen = ref(false)
const currentSong = ref(null)
const currentTime = ref(0)

const contentMarginClass = computed(() => {
    return currentSong.value ? 'mb-[125px]' : ''
})

// Lyrics sidebar always closed on mount
// No need to restore lyrics state from localStorage

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

const handleLyricsSeek = (time) => {
    currentTime.value = time
}
</script>

<template>
    <div class="relative h-screen overflow-hidden">
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
    </div>
</template>