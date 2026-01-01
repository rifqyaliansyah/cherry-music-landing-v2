<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { X } from 'lucide-vue-next'
import { useMusicStore } from '~/stores/music'

const props = defineProps({
    isOpen: Boolean,
    currentSong: Object,
    currentTime: Number
})

const emit = defineEmits(['close', 'seek'])

const musicStore = useMusicStore()

const lyricsContainerDesktop = ref(null)
const lyricsContainerMobile = ref(null)
const isAutoScrollEnabled = ref(true)
const showSyncButton = ref(false)
const isScrollingProgrammatically = ref(false)
const scrollDebounceTimer = ref(null)
const lastProgrammaticScrollTime = ref(0)

const loadingLyrics = computed(() => musicStore.loadingDetail)

const lyricsData = computed(() => {
    if (!props.currentSong?.id) return []

    const songDetail = musicStore.getSongDetail(props.currentSong.id)
    if (!songDetail || !songDetail.lyrics) return []

    // Convert string time to number
    return songDetail.lyrics.map(lyric => ({
        time: parseFloat(lyric.time),
        text: lyric.text
    }))
})

const hasLyrics = computed(() => {
    return lyricsData.value && lyricsData.value.length > 0
})

const currentLineIndex = computed(() => {
    if (!props.currentSong || !hasLyrics.value) return -1

    // Kalau belum sampai lyric pertama, return -1 (belum ada yang aktif)
    if (props.currentTime < lyricsData.value[0].time) {
        return -1
    }

    for (let i = lyricsData.value.length - 1; i >= 0; i--) {
        if (props.currentTime >= lyricsData.value[i].time) {
            return i
        }
    }
    return -1
})

const handleUserScroll = () => {
    const now = Date.now()
    if (now - lastProgrammaticScrollTime.value < 1500) {
        return
    }

    if (isScrollingProgrammatically.value) {
        return
    }

    if (scrollDebounceTimer.value) {
        clearTimeout(scrollDebounceTimer.value)
    }

    scrollDebounceTimer.value = setTimeout(() => {
        const checkNow = Date.now()
        if (checkNow - lastProgrammaticScrollTime.value >= 1500 && !isScrollingProgrammatically.value) {
            isAutoScrollEnabled.value = false
            showSyncButton.value = true
        }
    }, 200)
}

const syncLyrics = async () => {
    isAutoScrollEnabled.value = true
    showSyncButton.value = false
    isScrollingProgrammatically.value = true
    lastProgrammaticScrollTime.value = Date.now()

    if (scrollDebounceTimer.value) {
        clearTimeout(scrollDebounceTimer.value)
        scrollDebounceTimer.value = null
    }

    await nextTick()
    scrollToActiveLine(true)

    setTimeout(() => {
        isScrollingProgrammatically.value = false
    }, 1200)
}

const scrollToActiveLine = async (immediate = false) => {
    if (!isAutoScrollEnabled.value) return

    // Jangan scroll kalau belum waktunya lyric (index -1)
    if (currentLineIndex.value === -1) return

    await nextTick()

    const container = window.innerWidth >= 1024
        ? lyricsContainerDesktop.value
        : lyricsContainerMobile.value

    if (container) {
        const activeLine = container.querySelector(`[data-index="${currentLineIndex.value}"]`)
        if (activeLine) {
            lastProgrammaticScrollTime.value = Date.now()
            isScrollingProgrammatically.value = true

            const containerRect = container.getBoundingClientRect()
            const lineRect = activeLine.getBoundingClientRect()
            const scrollTop = container.scrollTop
            const offset = (lineRect.top - containerRect.top) + scrollTop - (containerRect.height / 2) + (lineRect.height / 2)

            container.scrollTo({
                top: offset,
                behavior: immediate ? 'auto' : 'smooth'
            })

            const delay = immediate ? 200 : 700
            setTimeout(() => {
                isScrollingProgrammatically.value = false
            }, delay)
        }
    }
}

watch(currentLineIndex, () => {
    if (isAutoScrollEnabled.value) {
        scrollToActiveLine()
    }
})

const getLineState = (index) => {
    // Kalau belum ada yang aktif (-1), semua jadi future
    if (currentLineIndex.value === -1) return 'future'

    if (index === currentLineIndex.value) return 'active'
    if (index < currentLineIndex.value) return 'past'
    return 'future'
}

const handleLyricClick = async (lyricTime) => {
    emit('seek', lyricTime)

    isAutoScrollEnabled.value = true
    showSyncButton.value = false
    isScrollingProgrammatically.value = true
    lastProgrammaticScrollTime.value = Date.now()

    if (scrollDebounceTimer.value) {
        clearTimeout(scrollDebounceTimer.value)
        scrollDebounceTimer.value = null
    }

    await nextTick()
    setTimeout(() => {
        scrollToActiveLine(true)
    }, 100)

    setTimeout(() => {
        isScrollingProgrammatically.value = false
    }, 1200)
}

const showLyrics = computed(() => {
    return props.isOpen && props.currentSong
})
</script>

<template>
    <!-- Desktop Sidebar -->
    <Transition name="slide-left">
        <div v-if="showLyrics" class="lyrics-sidebar-desktop">
            <div class="flex items-center justify-between px-4 py-5">
                <h2 class="font-bold text-base">Now Playing</h2>
                <button @click="$emit('close')" class="btn btn-ghost btn-xs btn-square">
                    <X :size="18" />
                </button>
            </div>

            <div class="p-4 flex flex-col items-center">
                <img :src="currentSong.cover" alt="Cover" class="w-32 h-32 rounded-lg shadow-lg object-cover mb-2" />
                <h3 class="text-base font-bold text-center">{{ currentSong.title }}</h3>
                <p class="text-xs opacity-60">{{ currentSong.name }}</p>
            </div>

            <div class="relative flex-1 overflow-hidden">
                <!-- Loading State -->
                <div v-if="loadingLyrics" class="h-full flex items-center justify-center">
                    <span class="loading loading-spinner loading-lg"></span>
                </div>

                <!-- No Lyrics State -->
                <div v-else-if="!hasLyrics" class="h-full flex flex-col items-center justify-center px-4 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 opacity-30 mb-3" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="text-sm opacity-60">Lyrics not available for this song</p>
                </div>

                <!-- Lyrics Content -->
                <div v-else ref="lyricsContainerDesktop" @scroll="handleUserScroll"
                    class="h-full overflow-y-auto px-4 py-3 lyrics-container">
                    <div class="py-0">
                        <div v-for="(line, index) in lyricsData" :key="index" :data-index="index"
                            class="lyric-line cursor-pointer" :class="getLineState(index)"
                            @click="handleLyricClick(line.time)">
                            {{ line.text || '♪' }}
                        </div>
                    </div>
                </div>

                <!-- Sync Button Desktop -->
                <Transition name="fade-slide">
                    <div v-if="showSyncButton && hasLyrics"
                        class="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                        <button @click="syncLyrics" class="btn btn-primary btn-sm shadow-lg pointer-events-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Sync Lyrics
                        </button>
                    </div>
                </Transition>
            </div>
        </div>
    </Transition>

    <!-- Mobile Backdrop -->
    <Transition name="fade">
        <div v-if="showLyrics" class="lg:hidden fixed inset-0 bg-black/50 z-40" @click="$emit('close')">
        </div>
    </Transition>

    <!-- Mobile Sidebar -->
    <Transition name="slide-left">
        <div v-if="showLyrics"
            class="lg:hidden fixed top-0 right-0 bottom-0 w-full sm:w-80 bg-base-200 shadow-2xl z-50 flex flex-col">

            <div class="flex items-center justify-between px-4 py-3">
                <h2 class="font-bold text-base">Now Playing</h2>
                <button @click="$emit('close')" class="btn btn-ghost btn-xs btn-square">
                    <X :size="18" />
                </button>
            </div>

            <div class="p-4 flex flex-col items-center">
                <img :src="currentSong.cover" alt="Cover" class="w-32 h-32 rounded-lg shadow-lg object-cover mb-2" />
                <h3 class="text-base font-bold text-center">{{ currentSong.title }}</h3>
                <p class="text-xs opacity-60">{{ currentSong.name }}</p>
            </div>

            <div class="relative flex-1 overflow-hidden">
                <!-- Loading State -->
                <div v-if="loadingLyrics" class="h-full flex items-center justify-center">
                    <span class="loading loading-spinner loading-lg"></span>
                </div>

                <!-- No Lyrics State -->
                <div v-else-if="!hasLyrics" class="h-full flex flex-col items-center justify-center px-4 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 opacity-30 mb-3" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="text-sm opacity-60">Lyrics not available for this song</p>
                </div>

                <!-- Lyrics Content -->
                <div v-else ref="lyricsContainerMobile" @scroll="handleUserScroll"
                    class="h-full overflow-y-auto px-4 py-3 lyrics-container">
                    <div class="py-0">
                        <div v-for="(line, index) in lyricsData" :key="index" :data-index="index"
                            class="lyric-line cursor-pointer" :class="getLineState(index)"
                            @click="handleLyricClick(line.time)">
                            {{ line.text || '♪' }}
                        </div>
                    </div>
                </div>

                <!-- Sync Button Mobile -->
                <Transition name="fade-slide">
                    <div v-if="showSyncButton && hasLyrics"
                        class="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                        <button @click="syncLyrics" class="btn btn-primary btn-sm shadow-lg pointer-events-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Sync Lyrics
                        </button>
                    </div>
                </Transition>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.lyrics-sidebar-desktop {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 105px;
    width: 20rem;
    background-color: oklch(var(--b2));
    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    border-left: 1px solid oklch(var(--bc) / 0.2);
    z-index: 30;
    display: none;
    flex-direction: column;
}

@media (min-width: 1024px) {
    .lyrics-sidebar-desktop {
        display: flex;
    }
}

.lyrics-container {
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.lyrics-container::-webkit-scrollbar {
    display: none;
}

.lyric-line {
    text-align: center;
    padding: 0.75rem 0;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    line-height: 1.4;
}

.lyric-line:hover {
    opacity: 1 !important;
    transform: scale(1.02);
}

.lyric-line.future {
    opacity: 0.3;
    filter: blur(0.5px);
    transform: scale(0.95);
}

.lyric-line.active {
    font-weight: 700;
    opacity: 1;
    filter: blur(0);
    transform: scale(1.05);
    text-shadow:
        0 0 20px oklch(var(--p) / 0.5),
        0 0 40px oklch(var(--p) / 0.3),
        0 0 60px oklch(var(--p) / 0.2);
    color: oklch(var(--p));
}

.lyric-line.past {
    opacity: 0.25;
    filter: blur(0.5px);
    transform: scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.slide-left-enter-active,
.slide-left-leave-active {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
    transform: translateX(100%);
}

.slide-left-leave-to {
    transform: translateX(100%);
}
</style>