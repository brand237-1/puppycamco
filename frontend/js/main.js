// Shared UI Injection
function initSharedUI() {
    console.log("Initializing Shared UI...");
    injectNavbar();
    injectFooter();
    injectFloatingElements();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedUI);
} else {
    initSharedUI();
}

async function injectNavbar() {
    const nav = document.getElementById('navbar-container');
    if (!nav) return;

    let authLinksDesktop = `<a href="user-login.html" class="hover:text-forest transition duration-200">Login / Sign Up 🐶</a>`;
    let authLinksMobile = `<a href="user-login.html" class="block px-4 py-2 hover:bg-gray-100 transition">Login / Sign Up 🐶</a>`;

    try {
        const res = await fetch('/api/auth/status');
        const data = await res.json();
        if (data.loggedIn) {
            authLinksDesktop = `
                <a href="profile.html" class="hover:text-forest transition duration-200 relative">
                    <i class="fa-solid fa-user"></i> My Profile
                    <span id="nav-profile-badge" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full hidden">0</span>
                </a>
                <a href="#" onclick="logoutUser(event)" class="hover:text-red-500 transition duration-200">Logout</a>
            `;
            authLinksMobile = `
                <a href="profile.html" class="block px-4 py-2 hover:bg-gray-100 transition">My Profile</a>
                <a href="#" onclick="logoutUser(event)" class="block px-4 py-2 hover:bg-red-50 text-red-500 transition">Logout</a>
            `;
        }
    } catch (e) {
        console.error("Auth check failed", e);
    }

    nav.innerHTML = `
        <!-- Top Bar for Concierge -->
        <div class="bg-forest text-white text-xs py-2 px-6 flex justify-end tracking-wider font-bold">
            <span class="flex items-center gap-2"><i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp Concierge: <a href="https://api.whatsapp.com/send?phone=447459485307" target="_blank" class="hover:underline">+44 7459 485307</a></span>
        </div>
        <!-- Main Navbar -->
        <nav class="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm" id="main-nav">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between h-24">
                    <div class="flex items-center">
                        <a href="index.html" class="flex-shrink-0 flex items-center gap-4">
                            <img class="h-16 w-auto rounded-full shadow-sm object-cover border-2 border-beige" src="favicon.png" alt="Logo">
                            <span class="font-serif font-bold text-2xl md:text-3xl text-black tracking-tight">Puppy Cam Co.</span>
                        </a>
                    </div>

                    <!-- Mobile Menu Button -->
                    <div class="flex items-center md:hidden">
                        <button onclick="toggleMobileMenu()" class="text-slate hover:text-black focus:outline-none text-2xl">
                            <i class="fa-solid fa-bars" id="mobile-menu-icon"></i>
                        </button>
                    </div>

                    <!-- Desktop Nav -->
                    <div class="hidden md:ml-6 md:flex md:items-center md:space-x-8 uppercase text-sm font-bold tracking-wide text-slate">
                        <a href="pets.html" class="hover:text-forest transition duration-200">Available Puppies 🐾</a>
                        <a href="our-promise.html" class="hover:text-forest transition duration-200">Our Promise ✨</a>
                        
                        <a href="admin-login.html" class="text-brown hover:text-yellow-600 transition duration-200 flex items-center gap-1" title="Admin Dashboard">
                            <i class="fa-solid fa-crown text-xs"></i> VIP Area 👑
                        </a>

                        ${authLinksDesktop}
                        
                        <a href="adoption-list.html" class="ml-6 px-5 py-2.5 bg-beige text-black rounded relative hover:bg-gray-200 transition">
                            <i class="fa-solid fa-clipboard-list mr-1"></i> Selection
                            <span id="nav-list-count" class="absolute -top-2 -right-2 bg-brown text-white text-xs px-2 py-0.5 rounded-full hidden">0</span>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Mobile Menu Dropdown -->
            <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-100 animate-slide-down">
                <div class="px-6 py-4 space-y-2 uppercase text-sm font-bold tracking-wide text-slate">
                    <a href="pets.html" class="block px-4 py-2 hover:bg-gray-100 transition">Available Puppies</a>
                    <a href="our-promise.html" class="block px-4 py-2 hover:bg-gray-100 transition">Our Promise</a>
                    <a href="admin-login.html" class="block px-4 py-2 text-brown hover:bg-yellow-50 transition">VIP Area</a>
                    ${authLinksMobile}
                    <div class="pt-4 mt-4 border-t border-gray-100">
                        <a href="adoption-list.html" class="block px-4 py-3 bg-beige text-black rounded text-center">
                            <i class="fa-solid fa-clipboard-list mr-1"></i> My Selection
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <style>
            @keyframes slide-down {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-slide-down {
                animation: slide-down 0.3s ease-out forwards;
            }
        </style>
    `;

    updateNavListCount();
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('mobile-menu-icon');
    if (menu) {
        menu.classList.toggle('hidden');
        if (menu.classList.contains('hidden')) {
            icon.classList.replace('fa-xmark', 'fa-bars');
        } else {
            icon.classList.replace('fa-bars', 'fa-xmark');
        }
    }
}

async function logoutUser(e) {
    if (e) e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = 'index.html';
}

function injectFooter() {
    const footer = document.getElementById('footer-container');
    if (!footer) return;

    footer.innerHTML = `
        <footer class="bg-black text-white pt-16 pb-8">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-gray-800 pb-12">
                    <div class="col-span-1 md:col-span-2">
                        <a href="index.html" class="flex items-center gap-3 mb-6">
                            <img class="h-12 w-auto rounded-full bg-white p-1" src="favicon.png" alt="Logo">
                            <span class="font-serif font-bold text-2xl tracking-tight">Puppy Cam Co.</span>
                        </a>
                        <p class="text-gray-400 text-sm leading-relaxed max-w-md">Our trusted community connects loving families with responsible breeders to ensure healthy, happy puppies. Guided by our Scientific Advisory Board, we provide a 10-year health commitment.</p>
                    </div>
                    <div>
                        <span class="font-bold text-lg uppercase tracking-wider mb-6 block text-forest">Explore 🐾</span>
                        <ul class="text-gray-400 text-sm space-y-3">
                            <li><a href="pets.html" class="hover:text-white transition">Available Puppies 🐶</a></li>
                            <li><a href="our-promise.html" class="hover:text-white transition">Our Promise ✨</a></li>
                            <li><a href="breeder-standards.html" class="hover:text-white transition">Breeder Standards 🏠</a></li>
                            <li><a href="health-commitment.html" class="hover:text-white transition">Health Commitment ❤️</a></li>
                        </ul>
                    </div>
                    <div>
                        <span class="font-bold text-lg uppercase tracking-wider mb-6 block text-forest">Contact</span>
                        <ul class="text-gray-400 text-sm space-y-3">
                            <li class="flex items-center gap-3"><i class="fa-brands fa-whatsapp w-4 text-center text-forest"></i> <a href="https://api.whatsapp.com/send?phone=447459485307" target="_blank" class="hover:text-white">+44 7459 485307</a></li>
                            <li class="flex items-center gap-3"><i class="fa-solid fa-envelope w-4 text-center"></i> puppycamco@gmail.com</li>
                        </ul>
                    </div>
                </div>
                <div class="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                    <p>&copy; 2026 Puppy Cam Co. All Rights Reserved. Not acting as a middleman, only partnering with verified breeders.</p>
                    <div class="flex items-center gap-4 mt-4 md:mt-0">
                        <a href="#" class="hover:text-gray-300">Terms of Service</a>
                        <a href="#" class="hover:text-gray-300">Privacy Policy</a>
                        <a href="admin-login.html" class="text-gray-700 hover:text-white transition duration-300 ml-4" title="VIP Dashboard Access"><i class="fa-solid fa-crown text-base"></i></a>
                    </div>
                </div>
            </div>
        </footer>
    `;
}

function injectFloatingElements() {
    const container = document.createElement('div');
    container.innerHTML = `
        <!-- Floating Email Button -->
        <a href="mailto:puppycamco@gmail.com" id="floating-email-btn" class="fixed bottom-6 right-6 bg-forest text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:bg-green-700 transform transition duration-300 z-[9999] text-2xl hover:scale-110 border-2 border-white">
            <i class="fa-solid fa-envelope"></i>
        </a>
    `;
    document.body.appendChild(container);
}

// Global Cart/Adoption List logic
function getAdoptionList() {
    return JSON.parse(localStorage.getItem('adoptionList') || '[]');
}

function addToAdoptionList(item) {
    const list = getAdoptionList();
    if (!list.find(i => i.id === item.id && i.type === item.type)) {
        list.push(item);
        localStorage.setItem('adoptionList', JSON.stringify(list));
        updateNavListCount();
        showToast('Puppy added to selection!');
    } else {
        showToast('Already in your selection.');
    }
}

function updateNavListCount() {
    const countEl = document.getElementById('nav-list-count');
    if (!countEl) return;
    const count = getAdoptionList().length;
    if (count > 0) {
        countEl.textContent = count;
        countEl.classList.remove('hidden');
    } else {
        countEl.classList.add('hidden');
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-32 left-1/2 transform -translate-x-1/2 bg-forest text-white px-8 py-3 rounded shadow-2xl z-50 transition-all duration-300 opacity-0 translate-y-[-20px] font-bold tracking-wide text-sm';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-[-20px]');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-20px]');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function updateUnreadCounts() {
    try {
        const res = await fetch('/api/unread-counts');
        if (!res.ok) return;
        const data = await res.json();

        // Chat Badge
        const chatBadge = document.getElementById('chat-unread-badge');
        if (chatBadge) {
            if (data.chat > 0) {
                chatBadge.textContent = data.chat;
                chatBadge.classList.remove('hidden');
            } else {
                chatBadge.classList.add('hidden');
            }
        }

        // Profile Badge
        const profileBadge = document.getElementById('nav-profile-badge');
        if (profileBadge) {
            const total = (data.chat || 0) + (data.notifications || 0);
            if (total > 0) {
                profileBadge.textContent = total;
                profileBadge.classList.remove('hidden');
            } else {
                profileBadge.classList.add('hidden');
            }
        }
    } catch (e) { console.error(e); }
}
