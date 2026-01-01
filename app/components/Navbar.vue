<template>
    <nav class="navbar w-full bg-base-300 px-4">
        <div class="flex items-center gap-2">
            <label for="my-drawer-4" class="btn btn-square btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" fill="none"
                    stroke="currentColor" class="size-5">
                    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
                    <path d="M9 4v16" />
                    <path d="M14 10l2 2l-2 2" />
                </svg>
            </label>

            <span class="font-semibold">Cherry Music</span>
        </div>

        <div class="ml-auto">
            <div class="dropdown dropdown-end">
                <button tabindex="0" ref="trigger" class="btn btn-square btn-ghost">
                    <Palette class="size-5" />
                </button>

                <ul tabindex="0" ref="menu"
                    class="dropdown-content menu menu-sm bg-base-100 rounded-box shadow w-44 mt-2">
                    <li v-for="theme in themes" :key="theme">
                        <button @click="selectTheme(theme)" :class="{
                            'active': currentTheme === theme,
                            'font-semibold': currentTheme === theme
                        }">
                            {{ themeLabel(theme) }}
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Palette } from 'lucide-vue-next'

const themes = ['light', 'dark', 'coffee', 'valentine', 'luxury']
const currentTheme = ref('coffee')

const selectTheme = (theme) => {
    currentTheme.value = theme
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
}

const themeLabel = (theme) => {
    if (theme === 'coffee') return 'Coffee (Default)'
    return theme.charAt(0).toUpperCase() + theme.slice(1)
}

onMounted(() => {
    const saved = localStorage.getItem('theme')
    if (saved) {
        currentTheme.value = saved
        document.documentElement.setAttribute('data-theme', saved)
    }
})
</script>
