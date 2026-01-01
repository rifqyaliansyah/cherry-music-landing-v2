<script setup>
import { ref, watch } from 'vue'
import { ListMusic, Volume2, VolumeX } from 'lucide-vue-next'

const props = defineProps({
    currentSong: Object,
    isPlaying: Boolean,
    currentTime: Number,
    duration: Number,
    shuffleEnabled: Boolean,
    repeatMode: String,
    volume: Number
})

const emit = defineEmits([
    'toggle-play',
    'next',
    'previous',
    'seek',
    'open-lyrics',
    'toggle-shuffle',
    'toggle-repeat',
    'volume-change'
])

const progressBar = ref(null)
const progress = ref(0)
const isDragging = ref(false)

watch(() => props.currentTime, (time) => {
    if (props.duration > 0 && !isDragging.value) {
        progress.value = (time / props.duration) * 100
    }
})

const handleProgressInteraction = (e) => {
    if (!progressBar.value || !props.duration) return

    const rect = progressBar.value.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = (clickX / rect.width) * 100

    const newProgress = Math.max(0, Math.min(100, percentage))
    progress.value = newProgress
    const newTime = Math.floor((newProgress / 100) * props.duration)

    emit('seek', newTime)
}

const handleProgressClick = (e) => {
    handleProgressInteraction(e)
}

const handleMouseDown = (e) => {
    isDragging.value = true
    handleProgressInteraction(e)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e) => {
    if (isDragging.value) {
        handleProgressInteraction(e)
    }
}

const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
}

const toggleMute = () => {
    if (props.volume > 0) {
        emit('volume-change', 0)
    } else {
        emit('volume-change', 1)
    }
}

const formatTime = (seconds) => {
    // Batasi seconds agar tidak melebihi duration
    const clampedSeconds = Math.min(seconds, props.duration || seconds)
    const roundedSeconds = Math.floor(clampedSeconds)
    const mins = Math.floor(roundedSeconds / 60)
    const secs = roundedSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
    <Transition name="slide-up">
        <div v-if="currentSong"
            class="fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 z-40 shadow-2xl">
            <div class="container mx-auto max-w-6xl px-4 py-3">
                <div class="flex items-center gap-4">
                    <!-- Song Info - Left -->
                    <div class="flex items-center gap-3 w-[30%] min-w-[120px] lg:min-w-[180px]">
                        <img :src="currentSong.cover"
                            class="w-16 h-16 md:w-14 md:h-14 rounded object-cover shadow-lg" />
                        <div class="overflow-hidden hidden md:block">
                            <div class="font-semibold text-sm truncate">{{ currentSong.title }}</div>
                            <div class="text-xs opacity-60 truncate">{{ currentSong.name }}</div>
                        </div>
                    </div>

                    <!-- Play Controls - Center -->
                    <div class="flex-1 flex flex-col items-center gap-2 max-w-[500px] -ml-4 md:ml-0">
                        <div class="flex items-center gap-2">
                            <!-- Shuffle Button -->
                            <button @click="$emit('toggle-shuffle')" class="btn btn-square btn-neutral btn-xs"
                                :class="{ 'btn-primary': shuffleEnabled }">
                                <svg width="12" height="12" viewBox="0 0 48 48" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M40 33L44 37L40 41" stroke="currentColor" stroke-width="4"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M40 7L44 11L40 15" stroke="currentColor" stroke-width="4"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M44 11H37C29.8203 11 24 16.8203 24 24C24 31.1797 29.8203 37 37 37H44"
                                        stroke="currentColor" stroke-width="4" stroke-linecap="round" />
                                    <path d="M4 37H11C18.1797 37 24 31.1797 24 24C24 16.8203 18.1797 11 11 11H4"
                                        stroke="currentColor" stroke-width="4" stroke-linecap="round" />
                                </svg>
                            </button>

                            <button @click="$emit('previous')" class="btn btn-square btn-neutral btn-sm md:btn-md">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="size-4 shrink-0">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M21 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061A1.125 1.125 0 0 1 21 8.689v8.122ZM11.25 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061a1.125 1.125 0 0 1 1.683.977v8.122Z" />
                                </svg>
                            </button>

                            <button @click="$emit('toggle-play')" class="btn btn-square btn-neutral btn-lg">
                                <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" fill="none"
                                    viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                                    class="size-5 md:size-6 shrink-0">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="size-5 md:size-6 shrink-0">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                </svg>
                            </button>

                            <button @click="$emit('next')" class="btn btn-square btn-neutral btn-sm md:btn-md">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="size-4 shrink-0">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z" />
                                </svg>
                            </button>

                            <!-- Repeat Button -->
                            <button @click="$emit('toggle-repeat')" class="btn btn-square btn-neutral btn-xs relative"
                                :class="{ 'btn-primary': repeatMode !== 'off' }">
                                <svg width="12" height="12" viewBox="0 0 48 48" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M44 23C44 29.6498 38.6038 35 32 35H4" stroke="currentColor"
                                        stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M10 41L4 35L10 29" stroke="currentColor" stroke-width="4"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M4 25C4 18.3502 9.39624 13 16 13H44" stroke="currentColor" stroke-width="4"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M38 7L44 13L38 19" stroke="currentColor" stroke-width="4"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                <!-- Indicator for Repeat One -->
                                <span v-if="repeatMode === 'one'"
                                    class="absolute -top-1 -right-1 bg-primary text-primary-content rounded-full w-3 h-3 flex items-center justify-center text-[8px] font-bold">
                                    1
                                </span>
                            </button>
                        </div>

                        <!-- Progress Bar - DRAGGABLE -->
                        <div class="w-full flex items-center gap-2">
                            <span class="text-xs opacity-50 text-right pt-1">{{ formatTime(currentTime) }}</span>
                            <div class="relative cursor-pointer select-none flex-1" @click="handleProgressClick"
                                @mousedown="handleMouseDown" ref="progressBar">
                                <progress class="progress pointer-events-none" :value="progress" max="100"></progress>
                            </div>
                            <span class="text-xs opacity-50 pt-1">{{ formatTime(duration) }}</span>
                        </div>
                    </div>

                    <!-- Extra Controls - Right -->
                    <div class="hidden lg:flex items-center gap-2 w-[30%] justify-end">
                        <button @click="$emit('open-lyrics')" class="btn btn-square btn-neutral btn-sm">
                            <ListMusic :size="16" />
                        </button>

                        <!-- Mute/Unmute Toggle -->
                        <button @click="toggleMute" class="btn btn-square btn-neutral btn-sm">
                            <Volume2 v-if="volume > 0" :size="16" />
                            <VolumeX v-else :size="16" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
}

.slide-up-enter-from {
    transform: translateY(100%);
    opacity: 0;
}

.slide-up-leave-to {
    transform: translateY(100%);
    opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
    transform: translateY(0);
    opacity: 1;
}
</style>