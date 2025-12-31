<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
    isOpen: Boolean,
    currentSong: Object,
    currentTime: Number
})

const emit = defineEmits(['close', 'seek'])

const lyricsContainerDesktop = ref(null)
const lyricsContainerMobile = ref(null)
const isAutoScrollEnabled = ref(true)
const showSyncButton = ref(false)
const isScrollingProgrammatically = ref(false)
const scrollDebounceTimer = ref(null)
const lastProgrammaticScrollTime = ref(0)

const lyricsData = [
    { time: 44.76, text: "I know a place" },
    { time: 54.54, text: "It's somewhere I go when I need to remember your face" },
    { time: 61.27, text: "" },
    { time: 64.01, text: "We get married in our heads" },
    { time: 70.76, text: "" },
    { time: 74.78, text: "Something to do while we try to recall how we met" },
    { time: 81.51, text: "" },
    { time: 84.11, text: "Do you think I have forgotten?" },
    { time: 89.12, text: "Do you think I have forgotten?" },
    { time: 94.14, text: "Do you think I have forgotten" },
    { time: 99.34, text: "About you?" },
    { time: 104.11, text: "You and I (don't let go)" },
    { time: 109.15, text: "We're alive (don't let go)" },
    { time: 114.58, text: "With nothing to do, I could lay and just look in your eyes" },
    { time: 124.73, text: "Wait (don't let go)" },
    { time: 129.16, text: "And pretend (don't let go)" },
    { time: 134.75, text: "Hold on and hope that we'll find our way back in the end" },
    { time: 141.54, text: "" },
    { time: 144.29, text: "Do you think I have forgotten?" },
    { time: 149.22, text: "Do you think I have forgotten?" },
    { time: 154.26, text: "Do you think I have forgotten" },
    { time: 159.18, text: "About you?" },
    { time: 162.11, text: "" },
    { time: 164.15, text: "Do you think I have forgotten?" },
    { time: 169.16, text: "Do you think I have forgotten?" },
    { time: 174.10, text: "Do you think I have forgotten" },
    { time: 179.17, text: "About you?" },
    { time: 184.53, text: "And there was something 'bout you that now I can't remember" },
    { time: 189.60, text: "It's the same damn thing that made my heart surrender" },
    { time: 194.47, text: "And I miss you on a train, I miss you in the morning" },
    { time: 199.55, text: "I never know what to think about" },
    { time: 203.52, text: "I think about you (so don't let go)" },
    { time: 209.10, text: "About you (so don't let go)" },
    { time: 214.25, text: "Do you think I have forgotten" },
    { time: 219.21, text: "About you? (Don't let go)" },
    { time: 224.27, text: "About you" },
    { time: 229.11, text: "About you" },
    { time: 231.88, text: "" },
    { time: 234.16, text: "Do you think I have forgotten" },
    { time: 239.28, text: "About you? (Don't let go)" }
]

const currentLineIndex = computed(() => {
    if (!props.currentSong || props.currentSong.title !== "About You") return -1

    // PERBAIKAN: Kalau belum sampai lyric pertama, return -1 (belum ada yang aktif)
    if (props.currentTime < lyricsData[0].time) {
        return -1
    }

    for (let i = lyricsData.length - 1; i >= 0; i--) {
        if (props.currentTime >= lyricsData[i].time) {
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

    // PERBAIKAN: Jangan scroll kalau belum waktunya lyric (index -1)
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
    // PERBAIKAN: Kalau belum ada yang aktif (-1), semua jadi future
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
    return props.isOpen && props.currentSong && props.currentSong.title === "About You"
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
                <div ref="lyricsContainerDesktop" @scroll="handleUserScroll"
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
                    <div v-if="showSyncButton"
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
                <div ref="lyricsContainerMobile" @scroll="handleUserScroll"
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
                    <div v-if="showSyncButton"
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
    bottom: 125px;
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
    font-size: 0.875rem;
    opacity: 0.3;
    filter: blur(0.5px);
    transform: scale(0.95);
}

.lyric-line.active {
    font-size: 1.125rem;
    font-weight: 700;
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
    text-shadow:
        0 0 20px oklch(var(--p) / 0.5),
        0 0 40px oklch(var(--p) / 0.3),
        0 0 60px oklch(var(--p) / 0.2);
    color: oklch(var(--p));
}

.lyric-line.past {
    font-size: 0.875rem;
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