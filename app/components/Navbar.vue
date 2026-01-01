<template>
    <!-- Navbar -->
    <nav class="navbar w-full bg-base-300 px-4">
        <!-- Left -->
        <div class="flex items-center gap-2">
            <label for="my-drawer-4" aria-label="open sidebar" class="btn btn-square btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round"
                    stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="size-5">
                    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
                    <path d="M9 4v16" />
                    <path d="M14 10l2 2l-2 2" />
                </svg>
            </label>

            <span class="font-semibold">Cherry Music</span>
        </div>

        <!-- Right -->
        <div class="ml-auto">
            <div class="dropdown dropdown-end">
                <button class="btn btn-square btn-ghost">
                    <!-- Lucide Palette Icon -->
                    <Palette class="size-5" />
                </button>

                <ul class="dropdown-content menu menu-sm bg-base-100 rounded-box shadow w-40 mt-2">
                    <li>
                        <button @click="setTheme('light')">Light</button>
                    </li>
                    <li>
                        <button @click="setTheme('dark')">Dark</button>
                    </li>
                    <li>
                        <button @click="setTheme('coffee')">Coffee (Default)</button>
                    </li>
                    <li>
                        <button @click="setTheme('valentine')">Valentine</button>
                    </li>
                    <li>
                        <button @click="setTheme('luxury')">Luxury</button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { Palette } from 'lucide-vue-next'

const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
}

onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme)
    }
})
</script>
