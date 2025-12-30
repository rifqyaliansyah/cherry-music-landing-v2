<template>
    <div class="drawer lg:drawer-open h-screen overflow-hidden">
        <input id="my-drawer-4" type="checkbox" class="drawer-toggle" />

        <div class="drawer-content flex flex-col h-full overflow-hidden">
            <Navbar />
            <div class="flex-1 overflow-y-auto p-4">
                <slot />
            </div>
        </div>

        <Sidebar />
    </div>
</template>