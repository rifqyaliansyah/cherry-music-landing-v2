<script setup>
import { ref, onMounted } from 'vue'
import { Clock3, X, Upload, Link } from 'lucide-vue-next'
import { useMusicStore } from '~/stores/music'

const musicStore = useMusicStore()

const songs = ref([])
const loading = ref(false)
const error = ref(null)

const selectedSong = ref(null)
const activeAddTab = ref('youtube')
const activeEditTab = ref('youtube')

const addForm = ref({
    youtube_url: '',
    title: '',
    artist: '',
    cover: null,
    lyrics: '',
    audioFile: null
})

const editForm = ref({
    youtube_url: '',
    title: '',
    artist: '',
    cover: null,
    lyrics: '',
    audioFile: null
})

const submitting = ref(false)
const deleting = ref(false)
const errorMessage = ref('')

const addAudioInputKey = ref(0)
const addCoverInputKey = ref(0)
const editAudioInputKey = ref(0)
const editCoverInputKey = ref(0)

const fetchSongs = async () => {
    loading.value = true
    error.value = null

    try {
        songs.value = await musicStore.fetchSongs()
    } catch (err) {
        error.value = err.message || 'Failed to fetch songs'
        console.error('Error fetching songs:', err)
        songs.value = []
    } finally {
        loading.value = false
    }
}

const fetchSongDetail = async (songId) => {
    try {
        return await musicStore.fetchSongDetail(songId)
    } catch (err) {
        console.error('Error fetching song detail:', err)
        return null
    }
}

onMounted(() => {
    fetchSongs()
})

const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatLyricsForDisplay = (lyrics) => {
    if (!lyrics || lyrics.length === 0) return ''

    const formatted = lyrics.map(lyric =>
        `  { "time": "${lyric.time}", "text": "${lyric.text}" }`
    ).join(',\n')

    return `[\n${formatted}\n]`
}

const resetAddForm = () => {
    addForm.value = {
        youtube_url: '',
        title: '',
        artist: '',
        cover: null,
        lyrics: '',
        audioFile: null
    }

    addAudioInputKey.value++
    addCoverInputKey.value++
}

const resetEditForm = () => {
    editForm.value = {
        youtube_url: '',
        title: '',
        artist: '',
        cover: null,
        lyrics: '',
        audioFile: null
    }

    editAudioInputKey.value++
    editCoverInputKey.value++
}

const handleEdit = async (song) => {
    selectedSong.value = song
    activeEditTab.value = song.youtube_url ? 'youtube' : 'upload'
    submitting.value = true
    errorMessage.value = ''

    resetEditForm()

    try {
        const songDetail = await fetchSongDetail(song.id)

        if (songDetail) {
            editForm.value = {
                youtube_url: songDetail.youtube_url || '',
                title: songDetail.title,
                artist: songDetail.artist,
                cover: null,
                lyrics: songDetail.lyrics && songDetail.lyrics.length > 0
                    ? formatLyricsForDisplay(songDetail.lyrics)
                    : '',
                audioFile: null
            }
        } else {
            editForm.value = {
                youtube_url: song.youtube_url || '',
                title: song.title,
                artist: song.artist,
                cover: null,
                lyrics: '',
                audioFile: null
            }
        }
    } catch (err) {
        console.error('Error fetching song detail:', err)
        editForm.value = {
            youtube_url: song.youtube_url || '',
            title: song.title,
            artist: song.artist,
            cover: null,
            lyrics: '',
            audioFile: null
        }
    } finally {
        submitting.value = false
    }

    document.getElementById('edit_modal').showModal()
}

const handleDelete = (song) => {
    selectedSong.value = song
    errorMessage.value = ''
    document.getElementById('delete_modal').showModal()
}

const handleAddNew = () => {
    activeAddTab.value = 'youtube'
    resetAddForm()
    errorMessage.value = ''
    document.getElementById('add_modal').showModal()
}

const closeModal = (modalId) => {
    document.getElementById(modalId).close()
    errorMessage.value = ''

    if (modalId === 'add_modal') {
        resetAddForm()
    } else if (modalId === 'edit_modal') {
        resetEditForm()
    }
}

const switchAddTab = (tab) => {
    activeAddTab.value = tab
}

const switchEditTab = (tab) => {
    activeEditTab.value = tab
}

const handleAddAudioFile = (event) => {
    addForm.value.audioFile = event.target.files[0]
}

const handleAddCoverFile = (event) => {
    addForm.value.cover = event.target.files[0]
}

const handleEditAudioFile = (event) => {
    editForm.value.audioFile = event.target.files[0]
}

const handleEditCoverFile = (event) => {
    editForm.value.cover = event.target.files[0]
}

const submitAddSong = async () => {
    errorMessage.value = ''
    submitting.value = true

    try {
        if (activeAddTab.value === 'youtube') {
            if (!addForm.value.youtube_url || !addForm.value.title || !addForm.value.artist) {
                errorMessage.value = 'YouTube URL, title, and artist are required'
                return
            }

            let parsedLyrics = []
            if (addForm.value.lyrics) {
                try {
                    parsedLyrics = JSON.parse(addForm.value.lyrics)
                } catch (e) {
                    errorMessage.value = 'Invalid lyrics format. Must be valid JSON array.'
                    return
                }
            }

            const metadata = {
                title: addForm.value.title,
                artist: addForm.value.artist,
                cover: addForm.value.cover,
                lyrics: parsedLyrics
            }

            await musicStore.downloadFromYouTube(addForm.value.youtube_url, metadata)

            resetAddForm()
            await fetchSongs()
            closeModal('add_modal')
        } else {
            if (!addForm.value.audioFile || !addForm.value.title || !addForm.value.artist) {
                errorMessage.value = 'Audio file, title, and artist are required'
                return
            }

            let parsedLyrics = []
            if (addForm.value.lyrics) {
                try {
                    parsedLyrics = JSON.parse(addForm.value.lyrics)
                } catch (e) {
                    errorMessage.value = 'Invalid lyrics format. Must be valid JSON array.'
                    return
                }
            }

            const duration = await musicStore.getAudioDuration(addForm.value.audioFile)

            const songData = {
                title: addForm.value.title,
                artist: addForm.value.artist,
                audioBlob: addForm.value.audioFile,
                coverBlob: addForm.value.cover,
                duration: duration,
                lyrics: parsedLyrics,
                youtube_url: null
            }

            await musicStore.addNewSong(songData)

            resetAddForm()
            await fetchSongs()
            closeModal('add_modal')
        }
    } catch (err) {
        console.error('Add song error:', err)
        errorMessage.value = err.message || 'Failed to add song'
    } finally {
        submitting.value = false
    }
}

const submitEditSong = async () => {
    if (!selectedSong.value) return

    errorMessage.value = ''
    submitting.value = true

    try {
        const updates = {}

        if (activeEditTab.value === 'youtube') {
            if (editForm.value.youtube_url && editForm.value.youtube_url !== selectedSong.value.youtube_url) {
                errorMessage.value = 'Changing YouTube URL is not supported in edit mode. Please delete and re-add the song.'
                return
            }
        } else {
            if (editForm.value.audioFile instanceof File) {
                updates.audioBlob = editForm.value.audioFile
                updates.duration = await musicStore.getAudioDuration(editForm.value.audioFile)
            }
        }

        if (editForm.value.title) {
            updates.title = editForm.value.title
        }

        if (editForm.value.artist) {
            updates.artist = editForm.value.artist
        }

        if (editForm.value.cover instanceof File) {
            updates.coverBlob = editForm.value.cover
        }

        if (editForm.value.lyrics !== null && editForm.value.lyrics !== undefined) {
            if (editForm.value.lyrics.trim() === '') {
                updates.lyrics = []
            } else {
                try {
                    updates.lyrics = JSON.parse(editForm.value.lyrics)
                } catch (e) {
                    errorMessage.value = 'Invalid lyrics format. Must be valid JSON array.'
                    return
                }
            }
        }

        await musicStore.updateExistingSong(selectedSong.value.id, updates)

        resetEditForm()
        await fetchSongs()
        closeModal('edit_modal')
    } catch (err) {
        console.error('Edit song error:', err)
        errorMessage.value = err.message || 'Failed to update song'
    } finally {
        submitting.value = false
    }
}

const submitDeleteSong = async () => {
    if (!selectedSong.value) return

    errorMessage.value = ''
    deleting.value = true

    try {
        await musicStore.deleteExistingSong(selectedSong.value.id)
        await fetchSongs()
        closeModal('delete_modal')
    } catch (err) {
        console.error('Delete song error:', err)
        errorMessage.value = err.message || 'Failed to delete song'
    } finally {
        deleting.value = false
    }
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

                <div v-if="loading" class="overflow-x-auto">
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
                            <tr v-for="i in 5" :key="i">
                                <td>
                                    <div class="skeleton h-4 w-6"></div>
                                </td>
                                <td class="hidden md:table-cell">
                                    <div class="skeleton w-12 h-12 rounded-lg"></div>
                                </td>
                                <td>
                                    <div class="skeleton h-4 w-32 mb-1"></div>
                                    <div class="skeleton h-3 w-20 sm:hidden"></div>
                                </td>
                                <td class="hidden sm:table-cell">
                                    <div class="skeleton h-4 w-24"></div>
                                </td>
                                <td class="hidden lg:table-cell text-center">
                                    <div class="skeleton h-4 w-12 mx-auto"></div>
                                </td>
                                <td>
                                    <div class="flex gap-2 justify-center">
                                        <div class="skeleton w-8 h-8 rounded-btn"></div>
                                        <div class="skeleton w-8 h-8 rounded-btn"></div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
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
                    <!-- <button @click="handleAddNew" class="btn btn-primary">Add Your First Song</button> -->
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

        <dialog id="add_modal" class="modal modal-bottom sm:modal-middle">
            <div class="modal-box max-w-3xl">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold">Add New Music</h3>
                    <button @click="closeModal('add_modal')" class="btn btn-sm btn-circle btn-ghost">
                        <X :size="20" />
                    </button>
                </div>

                <div v-if="errorMessage" class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ errorMessage }}</span>
                </div>

                <div class="space-y-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text font-semibold mb-2">Audio Source</span>
                        </label>

                        <div class="flex flex-col sm:flex-row gap-4 mb-4">
                            <label
                                class="label cursor-pointer justify-start gap-3 bg-base-200 rounded-lg p-4 flex-1 hover:bg-base-300 transition-colors"
                                :class="{ 'ring-2 ring-primary': activeAddTab === 'youtube' }">
                                <input type="radio" name="add-source" class="radio radio-primary"
                                    :checked="activeAddTab === 'youtube'" @change="switchAddTab('youtube')" />
                                <div class="flex items-center gap-2">
                                    <Link :size="18" />
                                    <span class="label-text font-medium">YouTube URL</span>
                                </div>
                            </label>

                            <label
                                class="label cursor-pointer justify-start gap-3 bg-base-200 rounded-lg p-4 flex-1 hover:bg-base-300 transition-colors"
                                :class="{ 'ring-2 ring-primary': activeAddTab === 'upload' }">
                                <input type="radio" name="add-source" class="radio radio-primary"
                                    :checked="activeAddTab === 'upload'" @change="switchAddTab('upload')" />
                                <div class="flex items-center gap-2">
                                    <Upload :size="18" />
                                    <span class="label-text font-medium">Upload Audio File</span>
                                </div>
                            </label>
                        </div>

                        <div v-if="activeAddTab === 'youtube'">
                            <input v-model="addForm.youtube_url" type="url" placeholder="https://youtu.be/..."
                                class="input input-bordered w-full" />
                            <label class="label text-xs">Paste YouTube video URL</label>
                        </div>

                        <div v-if="activeAddTab === 'upload'">
                            <input @change="handleAddAudioFile" type="file"
                                class="file-input file-input-bordered w-full" accept="audio/*"
                                :key="addAudioInputKey" />
                            <label class="label text-xs">Supported: MP3, WAV, OGG, M4A</label>
                        </div>
                    </div>

                    <div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text font-semibold mb-2">Title</span>
                                </label>
                                <input v-model="addForm.title" type="text" placeholder="Music title"
                                    class="input input-bordered w-full" />
                            </div>

                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text font-semibold mb-2">Artist</span>
                                </label>
                                <input v-model="addForm.artist" type="text" placeholder="Artist name"
                                    class="input input-bordered w-full" />
                            </div>
                        </div>
                    </div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text font-semibold mb-2">Cover Image</span>
                        </label>
                        <input @change="handleAddCoverFile" type="file" class="file-input file-input-bordered w-full"
                            accept="image/*" :key="addCoverInputKey" />
                        <label class="label text-xs">Recommended: Square image, min 500x500px</label>
                    </div>

                    <div class="form-control flex flex-col w-full">
                        <label class="label">
                            <span class="label-text font-semibold mb-2">Lyrics (Optional)</span>
                        </label>

                        <textarea v-model="addForm.lyrics" class="textarea textarea-bordered h-24 w-full" placeholder='[
    { "time": "1.80", "text": "Dalam benakku lama tertanam" },
    { "time": "8.05", "text": "Sejuta bayangan dirimu" }
]'></textarea>

                        <label class="label text-xs mt-2">Format: [{"time": "seconds", "text": "lyrics text"}]</label>
                    </div>
                </div>

                <div class="modal-action mt-6">
                    <button @click="closeModal('add_modal')" class="btn btn-ghost"
                        :disabled="submitting">Cancel</button>
                    <button @click="submitAddSong" class="btn btn-primary" :disabled="submitting">
                        <span v-if="submitting" class="loading loading-spinner"></span>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        {{ submitting ? 'Adding...' : 'Add Music' }}
                    </button>
                </div>
                <p class="text-xs text-base-content/60 text-right mt-2">
                    Note: Adding music may take a few moments.
                </p>
            </div>
        </dialog>

        <dialog id="edit_modal" class="modal modal-bottom sm:modal-middle">
            <div class="modal-box max-w-3xl">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold">Edit Music</h3>
                    <button @click="closeModal('edit_modal')" class="btn btn-sm btn-circle btn-ghost">
                        <X :size="20" />
                    </button>
                </div>

                <div v-if="errorMessage" class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ errorMessage }}</span>
                </div>

                <div v-if="selectedSong">
                    <div class="space-y-4">
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-semibold mb-2">Audio Source</span>
                            </label>

                            <div class="alert mb-4" :class="selectedSong.youtube_url ? 'alert-info' : 'alert-success'">
                                <div class="flex items-center gap-2">
                                    <Link v-if="selectedSong.youtube_url" :size="20" />
                                    <Upload v-else :size="20" />
                                    <div>
                                        <p class="font-semibold">
                                            Current: {{ selectedSong.youtube_url ? 'YouTube' : 'Uploaded File' }}
                                        </p>
                                        <p class="text-sm opacity-80" v-if="selectedSong.youtube_url">
                                            {{ selectedSong.youtube_url }}
                                        </p>
                                        <p class="text-sm opacity-80" v-else>
                                            Audio file uploaded manually
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div class="flex flex-col sm:flex-row gap-4 mb-4">
                                <label
                                    class="label cursor-pointer justify-start gap-3 bg-base-200 rounded-lg p-4 flex-1 hover:bg-base-300 transition-colors"
                                    :class="{ 'ring-2 ring-primary': activeEditTab === 'youtube' }">
                                    <input type="radio" name="edit-source" class="radio radio-primary"
                                        :checked="activeEditTab === 'youtube'" @change="switchEditTab('youtube')" />
                                    <div class="flex items-center gap-2">
                                        <Link :size="18" />
                                        <span class="label-text font-medium">YouTube URL</span>
                                    </div>
                                </label>

                                <label
                                    class="label cursor-pointer justify-start gap-3 bg-base-200 rounded-lg p-4 flex-1 hover:bg-base-300 transition-colors"
                                    :class="{ 'ring-2 ring-primary': activeEditTab === 'upload' }">
                                    <input type="radio" name="edit-source" class="radio radio-primary"
                                        :checked="activeEditTab === 'upload'" @change="switchEditTab('upload')" />
                                    <div class="flex items-center gap-2">
                                        <Upload :size="18" />
                                        <span class="label-text font-medium">Upload Audio File</span>
                                    </div>
                                </label>
                            </div>

                            <div v-if="activeEditTab === 'youtube'">
                                <input v-model="editForm.youtube_url" type="url" placeholder="https://youtu.be/..."
                                    class="input input-bordered w-full" disabled />
                                <label class="label text-xs text-warning">
                                    Changing YouTube URL not supported. Delete and re-add to change source.
                                </label>
                            </div>

                            <div v-if="activeEditTab === 'upload'">
                                <input @change="handleEditAudioFile" type="file"
                                    class="file-input file-input-bordered w-full" accept="audio/*"
                                    :key="editAudioInputKey" />
                                <label class="label text-xs">
                                    Upload new audio file or leave unchanged
                                </label>
                            </div>
                        </div>

                        <div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <div class="form-control w-full">
                                    <label class="label">
                                        <span class="label-text font-semibold mb-2">Title</span>
                                    </label>
                                    <input v-model="editForm.title" type="text" placeholder="Music title"
                                        class="input input-bordered w-full" />
                                </div>

                                <div class="form-control w-full">
                                    <label class="label">
                                        <span class="label-text font-semibold mb-2">Artist</span>
                                    </label>
                                    <input v-model="editForm.artist" type="text" placeholder="Artist name"
                                        class="input input-bordered w-full" />
                                </div>
                            </div>
                        </div>

                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-semibold mb-2">Cover Image</span>
                            </label>
                            <input @change="handleEditCoverFile" type="file"
                                class="file-input file-input-bordered w-full" accept="image/*"
                                :key="editCoverInputKey" />
                            <label class="label text-xs">Upload new cover or leave empty to keep current</label>
                        </div>

                        <div class="form-control flex flex-col w-full">
                            <label class="label">
                                <span class="label-text font-semibold mb-2">Lyrics (Optional)</span>
                            </label>
                            <textarea v-model="editForm.lyrics" class="textarea textarea-bordered h-24 w-full"
                                placeholder='[
    { "time": "1.80", "text": "Dalam benakku lama tertanam" },
    { "time": "8.05", "text": "Sejuta bayangan dirimu" }
]'></textarea>

                            <label class="label text-xs mt-2">Format: [{"time": "seconds", "text": "lyrics
                                text"}]</label>
                        </div>
                    </div>
                </div>

                <div class="modal-action mt-6">
                    <button @click="closeModal('edit_modal')" class="btn btn-ghost"
                        :disabled="submitting">Cancel</button>
                    <button @click="submitEditSong" class="btn btn-primary" :disabled="submitting">
                        <span v-if="submitting" class="loading loading-spinner"></span>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {{ submitting ? 'Saving...' : 'Save Changes' }}
                    </button>
                </div>
                <p class="text-xs text-base-content/60 text-right mt-2">
                    Note: Updating may take a few moments.
                </p>
            </div>
        </dialog>

        <dialog id="delete_modal" class="modal modal-bottom sm:modal-middle">
            <div class="modal-box">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-error">Delete Music</h3>
                    <button @click="closeModal('delete_modal')" class="btn btn-sm btn-circle btn-ghost">
                        <X :size="18" />
                    </button>
                </div>

                <div v-if="errorMessage" class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ errorMessage }}</span>
                </div>

                <div v-if="selectedSong" class="py-4">
                    <p class="mb-4">Are you sure you want to delete this music?</p>
                    <div class="card bg-base-200">
                        <div class="card-body p-4">
                            <div class="flex gap-3 items-center">
                                <img :src="selectedSong.cover" alt="Cover" class="w-16 h-16 rounded-lg object-cover" />
                                <div>
                                    <p class="font-bold">{{ selectedSong.title }}</p>
                                    <p class="text-sm opacity-60">{{ selectedSong.artist }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-action">
                    <button @click="closeModal('delete_modal')" class="btn btn-ghost"
                        :disabled="deleting">Cancel</button>
                    <button @click="submitDeleteSong" class="btn btn-error" :disabled="deleting">
                        <span v-if="deleting" class="loading loading-spinner"></span>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        {{ deleting ? 'Deleting...' : 'Delete' }}
                    </button>
                </div>
            </div>
        </dialog>
    </div>
</template>