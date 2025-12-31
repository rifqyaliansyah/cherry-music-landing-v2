<script setup>
import { ListMusic } from 'lucide-vue-next'

const closeDrawer = () => {
    if (window.innerWidth < 1024) {
        const drawer = document.getElementById('my-drawer-4')
        if (drawer) {
            drawer.checked = false
        }
    }
}
</script>

<template>
    <div class="drawer-side is-drawer-close:overflow-visible">
        <label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>

        <div class="flex min-h-full flex-col items-start bg-base-200
             is-drawer-close:w-14
             is-drawer-open:w-64">
            <ul class="menu w-full grow">
                <li>
                    <NuxtLink to="/" @click="closeDrawer"
                        class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-3"
                        data-tip="All Songs">
                        <ListMusic class="my-1.5 inline-block size-4" />
                        <span class="is-drawer-close:hidden">All Songs</span>
                    </NuxtLink>
                </li>

                <!-- <li>
                    <NuxtLink to="/playlist" @click="closeDrawer"
                        class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-3"
                        data-tip="Playlist">
                        <ListMusic class="my-1.5 inline-block size-4" />
                        <span class="is-drawer-close:hidden">Playlist</span>
                    </NuxtLink>
                </li>

                <li>
                    <NuxtLink to="/like" @click="closeDrawer"
                        class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-3"
                        data-tip="Liked Music">
                        <Heart class="my-1.5 inline-block size-4" />
                        <span class="is-drawer-close:hidden">Liked</span>
                    </NuxtLink>
                </li>

                <li>
                    <NuxtLink to="/search" @click="closeDrawer"
                        class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-3"
                        data-tip="Search">
                        <Search class="my-1.5 inline-block size-4" />
                        <span class="is-drawer-close:hidden">Search</span>
                    </NuxtLink>
                </li> -->
            </ul>
        </div>
    </div>
</template>