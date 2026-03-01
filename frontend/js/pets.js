// Pets and Products Listing Logic with Front-end Filtering

let allPets = [];
let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/auth/status');
        const data = await res.json();
        if (!data.loggedIn) {
            window.location.href = 'user-login.html';
            return;
        }

        // Load items only if authenticated
        loadItems();
    } catch (e) {
        console.error(e);
        window.location.href = 'user-login.html';
        return;
    }

    // Tab switching
    document.getElementById('tab-pets').addEventListener('click', (e) => switchTab(e, 'pets-grid'));
    document.getElementById('tab-products').addEventListener('click', (e) => switchTab(e, 'products-grid'));

    // Filter event listeners
    document.getElementById('filter-travel').addEventListener('change', renderPets);
    document.querySelectorAll('input[name="gender"]').forEach(el => el.addEventListener('change', renderPets));
    document.getElementById('filter-breed').addEventListener('input', renderPets);
    document.getElementById('reset-filters').addEventListener('click', () => {
        document.getElementById('filter-form').reset();
        renderPets();
    });
});

function switchTab(e, targetId) {
    // Reset tabs UI
    document.getElementById('tab-pets').className = 'text-lg font-bold text-slate hover:text-black pb-1 px-4 cursor-pointer transition';
    document.getElementById('tab-products').className = 'text-lg font-bold text-slate hover:text-black pb-1 px-4 cursor-pointer transition';
    e.target.className = 'text-lg font-bold text-forest border-b-2 border-forest pb-1 px-4 cursor-pointer transition';

    document.getElementById('pets-grid').classList.add('hidden');
    document.getElementById('products-grid').classList.add('hidden');
    document.getElementById(targetId).classList.remove('hidden');

    // Hide sidebar on products tab
    const sidebar = document.querySelector('aside');
    if (targetId === 'products-grid') {
        sidebar.classList.add('hidden', 'md:hidden');
        document.querySelector('main').classList.replace('md:w-3/4', 'md:w-full');
    } else {
        sidebar.classList.remove('hidden', 'md:hidden');
        document.querySelector('main').classList.replace('md:w-full', 'md:w-3/4');
    }
}

async function loadItems() {
    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');

    try {
        const [petsRes, prodsRes] = await Promise.all([
            fetch('/api/pets'),
            fetch('/api/products')
        ]);

        allPets = await petsRes.json();
        allProducts = await prodsRes.json();

        renderPets();
        renderProducts(allProducts);
    } catch (err) {
        console.error('Error loading items:', err);
    } finally {
        loader.classList.add('hidden');
    }
}

function renderPets() {
    // Collect filter values
    const travelReady = document.getElementById('filter-travel').checked;
    const gender = document.querySelector('input[name="gender"]:checked').value.toLowerCase();
    const breedQuery = document.getElementById('filter-breed').value.toLowerCase().trim();

    // Apply Filters
    const filteredPets = allPets.filter(p => {
        if (travelReady && !p.travel_ready) return false;
        if (gender !== 'all') {
            if ((p.gender || '').toLowerCase() !== gender) return false;
        }
        if (breedQuery && !(p.breed || '').toLowerCase().includes(breedQuery)) return false;
        return true;
    });

    const grid = document.getElementById('pets-grid');
    grid.innerHTML = '';

    if (filteredPets.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-slate">No puppies match your filters. Try clearing them!</div>';
        return;
    }

    filteredPets.forEach(pet => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl overflow-hidden smooth-shadow border border-gray-100 hover:-translate-y-1 transform transition duration-300 flex flex-col group';

        const priceHTML = pet.old_price
            ? `<span class="line-through text-slate text-sm font-normal mr-2">£${pet.old_price.toFixed(2)}</span>
               <span class="text-xl font-bold text-forest">£${(pet.new_price || 0).toFixed(2)}</span>`
            : `<span class="text-xl font-bold text-forest">£${(pet.new_price || 0).toFixed(2)}</span>`;

        const travelBadge = pet.travel_ready
            ? `<div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-blue text-xs font-bold px-3 py-1 rounded-full shadow-sm"><i class="fa-solid fa-plane"></i> Ready to Travel</div>`
            : '';

        card.innerHTML = `
            <div class="relative h-64 overflow-hidden">
                <img src="${pet.image_base64 || 'favicon.png'}" alt="${pet.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                ${travelBadge}
            </div>
            <div class="p-6 flex-1 flex flex-col">
                <div class="flex justify-between items-start mb-2">
                    <h2 class="text-2xl font-serif font-bold text-black">${pet.name}</h2>
                    <div class="bg-gray-50 px-3 py-1 rounded border border-gray-100 text-xs font-bold text-slate">${pet.gender || 'Any'}</div>
                </div>
                
                <ul class="text-sm text-slate mb-4 space-y-1">
                    <li><strong>Breed:</strong> ${pet.breed}</li>
                    <li><strong>Age:</strong> ${pet.age}</li>
                    <li><strong>Color:</strong> ${pet.color || 'N/A'}</li>
                </ul>
                
                <p class="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">${pet.description}</p>
                
                <div class="flex justify-between border-t border-gray-100 pt-4 mb-4 items-center">
                    <div class="font-serif">${priceHTML}</div>
                </div>

                <div class="grid gap-2">
                    <button onclick="addAdoptionItem(this, ${pet.id}, '${pet.name}', 'pet', ${pet.new_price || 0})" class="w-full bg-forest text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-sm uppercase tracking-wider text-sm">
                        Add to Adoption List
                    </button>
                    <a href="https://api.whatsapp.com/send?phone=447459485307&text=Hi, I am interested in adopting ${pet.name} the ${pet.breed}!" target="_blank" class="w-full bg-white text-forest border border-forest py-3 rounded-lg font-bold hover:bg-forest hover:text-white transition shadow-sm flex items-center justify-center gap-2 uppercase tracking-wider text-sm">
                        <i class="fa-brands fa-whatsapp text-lg"></i> Message Us
                    </a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-slate">No accessories available right now.</div>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl overflow-hidden smooth-shadow border border-gray-100 hover:-translate-y-1 transform transition duration-300 flex flex-col group';

        const priceHTML = product.old_price
            ? `<span class="line-through text-slate text-sm font-normal mr-2">£${product.old_price.toFixed(2)}</span>
               <span class="text-xl font-bold text-brown">£${(product.new_price || 0).toFixed(2)}</span>`
            : `<span class="text-xl font-bold text-brown">£${(product.new_price || 0).toFixed(2)}</span>`;

        card.innerHTML = `
            <div class="h-56 bg-white flex justify-center items-center overflow-hidden border-b border-gray-100 p-4 relative">
                <img src="${product.image_base64 || 'favicon.png'}" alt="${product.name}" class="h-full object-contain group-hover:scale-105 transition duration-500">
                <div class="absolute top-4 left-4 bg-brown text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm"><i class="fa-solid fa-tag"></i> Accessory</div>
            </div>
            <div class="p-6 flex-1 flex flex-col">
                <h2 class="text-xl font-bold text-black mb-2">${product.name}</h2>
                <p class="text-sm text-slate mb-4 line-clamp-2 min-h-[40px] flex-1">${product.description}</p>
                <div class="font-serif mb-6">${priceHTML}</div>
                
                <div class="grid gap-2">
                    <button onclick="addAdoptionItem(this, ${product.id}, '${product.name}', 'product', ${product.new_price || 0})" class="w-full bg-brown text-white py-3 rounded-lg font-bold hover:bg-yellow-800 transition shadow-sm uppercase tracking-wider text-sm">
                        Add to List
                    </button>
                    <a href="https://api.whatsapp.com/send?phone=447459485307&text=Hi, I want to purchase ${product.name}!" target="_blank" class="w-full bg-white text-brown border border-brown py-3 rounded-lg font-bold hover:bg-brown hover:text-white transition shadow-sm flex items-center justify-center gap-2 uppercase tracking-wider text-sm">
                        <i class="fa-brands fa-whatsapp text-lg"></i> Buy via WhatsApp
                    </a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Wrapper for global function
function addAdoptionItem(btn, id, name, type, price) {
    if (typeof addToAdoptionList === 'function') {
        addToAdoptionList({ id, name, type, price });
        btn.textContent = "Added!";
        btn.classList.add('opacity-75');
        setTimeout(() => {
            btn.innerHTML = 'Add to List';
            btn.classList.remove('opacity-75');
        }, 2000);
    } else {
        console.error("Global adoption logic not found!");
    }
}
