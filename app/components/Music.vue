<script setup>
import { computed } from 'vue'
import { useMusicStore } from '~/stores/music'
import { Clock3 } from 'lucide-vue-next'

const musicStore = useMusicStore()

const songs = computed(() => musicStore.songs)
const loading = computed(() => musicStore.loading)
const error = computed(() => musicStore.error)

const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleEdit = (song) => {
    console.log('Edit song:', song)
    // TODO: Implement edit modal
}

const handleDelete = (song) => {
    console.log('Delete song:', song)
    // TODO: Implement delete confirmation
}

const handleAddNew = () => {
    console.log('Add new song')
    // TODO: Implement add new song modal
}
</script>

<template>
    <div class="pb-0">
        <div class="container mx-auto max-w-6xl px-4">
            <div class="py-6 md:py-8">
                <div class="flex items-end justify-between mb-6 gap-4">
                    <div>
                        <h1 class="text-xs font-bold opacity-60">Panel for</h1>
                        <h1 class="text-2xl font-bold md:text-3xl">Manage Music</h1>
                    </div>
                    <button @click="handleAddNew" class="btn btn-primary btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                            stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span class="hidden sm:inline">Add New Music</span>
                        <span class="sm:hidden">Add</span>
                    </button>
                </div>

                <div v-if="loading" class="space-y-4">
                    <div v-for="i in 5" :key="i" class="card bg-base-100 shadow-md">
                        <div class="card-body">
                            <div class="flex gap-4">
                                <div class="skeleton w-20 h-20 rounded-xl"></div>
                                <div class="flex-1 space-y-2">
                                    <div class="skeleton h-5 w-3/4"></div>
                                    <div class="skeleton h-4 w-1/2"></div>
                                    <div class="skeleton h-4 w-1/4"></div>
                                </div>
                            </div>
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
                    <p class="text-lg opacity-60 mb-4">No songs found</p>
                    <button @click="handleAddNew" class="btn btn-primary">Add Your First Song</button>
                </div>

                <div v-else class="overflow-x-auto">
                    <table class="table table-zebra">
                        <thead>
                            <tr>
                                <th class="w-12">#</th>
                                <th class="hidden md:table-cell w-20"></th>
                                <th>Title</th>
                                <th class="hidden sm:table-cell">Artist</th>
                                <th class="hidden lg:table-cell w-32 text-center">
                                    <Clock3 :size="16" class="inline-block" />
                                </th>
                                <th class="text-center w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(song, index) in songs" :key="song.id" class="hover">
                                <td class="font-mono text-sm opacity-60">{{ index + 1 }}</td>

                                <td class="hidden md:table-cell">
                                    <div class="avatar">
                                        <div class="w-12 h-12 rounded-lg">
                                            <img :src="song.cover" :alt="song.title" class="object-cover" />
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    <div class="font-bold">{{ song.title }}</div>
                                    <div class="text-xs opacity-60 sm:hidden">{{ song.artist }}</div>
                                </td>

                                <td class="hidden sm:table-cell">{{ song.artist }}</td>

                                <td class="hidden lg:table-cell text-center">
                                    <span class="font-mono text-sm">{{ formatDuration(song.duration) }}</span>
                                </td>

                                <td>
                                    <div class="flex gap-2 justify-center">
                                        <button @click="handleEdit(song)" class="btn btn-ghost btn-sm btn-square"
                                            title="Edit">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                        </button>
                                        <button @click="handleDelete(song)"
                                            class="btn btn-ghost btn-sm btn-square text-error hover:bg-error hover:text-error-content"
                                            title="Delete">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>