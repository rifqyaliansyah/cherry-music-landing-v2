<script setup>
import { provide, ref, computed } from 'vue'

const lyricsOpen = ref(false)
const currentSong = ref(null)

const contentMarginClass = computed(() => {
    return currentSong.value ? 'mb-[125px]' : ''
})

provide('lyricsState', {
    lyricsOpen,
    currentSong,
    openLyrics: () => { lyricsOpen.value = true },
    closeLyrics: () => { lyricsOpen.value = false },
    setCurrentSong: (song) => { currentSong.value = song }
})
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

        <LyricsSidebar :is-open="lyricsOpen" :current-song="currentSong" @close="lyricsOpen = false" />
    </div>
</template>