<script setup>
import { X } from 'lucide-vue-next'

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false
    },
    currentSong: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['close'])

const sampleLyrics = `[Intro]
I know when you told me you don't want my love
Just know that I'm always gonna hold you down

[Verse 1]
Even if the sky was falling down
I knew we'd never hit the ground
No matter what, you've got my word
I'll be here from now, darling, I'm yours

[Pre-Chorus]
And I don't think I've ever known
Anyone quite like you
And I don't think I've ever known
Anyone quite like you

[Chorus]
So if you get lonely, you know I'm always around
If you're feeling lost, I can always be found
Just know when you told me you don't want my love
Just know that I'm always gonna hold you down

[Verse 2]
Tell me it's okay if I stay here with you tonight
I could be your company when you're feeling lonely
And I'll make sure you never feel alone

[Bridge]
Through the darkest nights
I'll be by your side
With every breath you take
I'll be there, I swear

[Chorus]
So if you get lonely, you know I'm always around
If you're feeling lost, I can always be found
Just know when you told me you don't want my love
Just know that I'm always gonna hold you down`
</script>

<template>
    <Transition name="slide-left">
        <div v-if="isOpen && currentSong" class="lyrics-sidebar-desktop">
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

            <div class="flex-1 overflow-y-auto px-4 py-3">
                <h3 class="font-bold mb-2 text-sm">Lyrics</h3>
                <div class="text-xs leading-relaxed whitespace-pre-line opacity-80">
                    {{ sampleLyrics }}
                </div>
            </div>
        </div>
    </Transition>

    <Transition name="fade">
        <div v-if="isOpen && currentSong" class="lg:hidden fixed inset-0 bg-black/50 z-40" @click="$emit('close')">
        </div>
    </Transition>

    <Transition name="slide-left">
        <div v-if="isOpen && currentSong"
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

            <div class="flex-1 overflow-y-auto px-4 py-3">
                <h3 class="font-bold mb-2 text-sm">Lyrics</h3>
                <div class="text-xs leading-relaxed whitespace-pre-line opacity-80">
                    {{ sampleLyrics }}
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