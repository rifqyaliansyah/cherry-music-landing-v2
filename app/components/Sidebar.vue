<script setup>
import { ListMusic, SlidersHorizontal } from 'lucide-vue-next'

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
    <div class="drawer-side is-drawer-close:overflow-visible lg:z-auto z-50">
        <label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>

        <div class="flex min-h-full flex-col items-start bg-base-200
             is-drawer-close:w-14
             is-drawer-open:w-64">
            <ul class="menu w-full grow">
                <li>
                    <NuxtLink to="/" @click="closeDrawer"
                        class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-3"
                        data-tip="All Music">
                        <ListMusic class="my-1.5 inline-block size-4" />
                        <span class="is-drawer-close:hidden">All Music</span>
                    </NuxtLink>
                </li>

                <li>
                    <NuxtLink to="/music" @click="closeDrawer"
                        class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-3"
                        data-tip="Manage Music">
                        <SlidersHorizontal class="my-1.5 inline-block size-4" />
                        <span class="is-drawer-close:hidden">Manage Music</span>
                    </NuxtLink>
                </li>
            </ul>
        </div>
    </div>
</template>