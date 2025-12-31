<script setup>
import { ref, watch, computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
    isOpen: Boolean,
    currentSong: Object,
    currentTime: Number
})

const emit = defineEmits(['close'])

const lyricsContainerDesktop = ref(null)
const lyricsContainerMobile = ref(null)

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
    if (!props.currentSong || props.currentSong.title !== "About You") return 0

    for (let i = lyricsData.length - 1; i >= 0; i--) {
        if (props.currentTime >= lyricsData[i].time) {
            return i
        }
    }
    return 0
})

watch(currentLineIndex, async (newIndex) => {
    await new Promise(resolve => setTimeout(resolve, 50))

    const container = window.innerWidth >= 1024
        ? lyricsContainerDesktop.value
        : lyricsContainerMobile.value

    if (container) {
        const activeLine = container.querySelector(`[data-index="${newIndex}"]`)
        if (activeLine) {
            const containerRect = container.getBoundingClientRect()
            const lineRect = activeLine.getBoundingClientRect()
            const scrollTop = container.scrollTop
            const offset = (lineRect.top - containerRect.top) + scrollTop - (containerRect.height / 2) + (lineRect.height / 2)

            container.scrollTo({
                top: offset,
                behavior: 'smooth'
            })
        }
    }
})

const getLineState = (index) => {
    if (index === currentLineIndex.value) return 'active'
    if (index < currentLineIndex.value) return 'past'
    return 'future'
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

            <div ref="lyricsContainerDesktop" class="flex-1 overflow-y-auto px-4 py-3 lyrics-container">
                <div class="py-0">
                    <div v-for="(line, index) in lyricsData" :key="index" :data-index="index" class="lyric-line"
                        :class="getLineState(index)">
                        {{ line.text || '♪' }}
                    </div>
                </div>
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

            <div ref="lyricsContainerMobile" class="flex-1 overflow-y-auto px-4 py-3 lyrics-container">
                <div class="py-0">
                    <div v-for="(line, index) in lyricsData" :key="index" :data-index="index" class="lyric-line"
                        :class="getLineState(index)">
                        {{ line.text || '♪' }}
                    </div>
                </div>
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