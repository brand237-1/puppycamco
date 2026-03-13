document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    fetch('/api/admin/check')
        .then(res => res.json())
        .then(data => {
            if (!data.loggedIn) {
                window.location.href = 'admin-login.html';
            } else {
                document.getElementById('dashboard-body').classList.remove('hidden');
                initDashboard();
            }
        });
});

function initDashboard() {
    // Initial load of the first tab (e.g., pets)
    showTab('pets');

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = 'index.html'; // Redirect to home on logout
    });


    // Form Submissions
    setupForm('form-add-pet', '/api/pets', 'add-pet-modal', loadPets);
    setupForm('form-add-product', '/api/products', 'add-product-modal', loadProducts);
    setupForm('form-add-review', '/api/reviews', 'add-review-modal', loadReviews);
}

function toggleMobileAdminMenu() {
    const sidebar = document.getElementById('mobile-sidebar');
    const content = document.getElementById('mobile-sidebar-content');
    if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        setTimeout(() => content.classList.remove('-translate-x-full'), 10);
    } else {
        content.classList.add('-translate-x-full');
        setTimeout(() => sidebar.classList.add('hidden'), 300);
    }
}

function showTab(tabId) {
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    // Close mobile menu if open
    const sidebar = document.getElementById('mobile-sidebar');
    if (sidebar && !sidebar.classList.contains('hidden')) {
        toggleMobileAdminMenu();
    }

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('bg-forest', 'text-white');
        btn.classList.add('text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
    });

    const activeBtn = Array.from(document.querySelectorAll('.admin-tab-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
        activeBtn.classList.add('bg-forest', 'text-white');
    }

    // Auto-load data based on tab
    if (tabId === 'pets') loadPets();
    if (tabId === 'products') loadProducts();
    if (tabId === 'reviews') loadReviews();
    if (tabId === 'adoption') loadAdoptionList();
    if (tabId === 'users') loadUsersList();
}

async function loadUsersList() {
    const tbody = document.getElementById('users-table-body');
    try {
        const users = await fetch('/api/admin/users').then(res => res.json());
        tbody.innerHTML = users.map(user => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="h-10 w-10 rounded-full bg-forest/10 text-forest flex items-center justify-center font-bold">
                            ${user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-bold text-gray-900">${user.full_name}</div>
                            <div class="text-xs text-gray-500">ID: #${user.id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900"><i class="fa-solid fa-envelope mr-1 text-gray-400"></i> ${user.email}</div>
                    <div class="text-sm text-gray-500"><i class="fa-solid fa-phone mr-1 text-gray-400"></i> ${user.phone || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(user.created_at).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="sendNotification(${user.id})" 
                            class="text-forest hover:text-green-900 bg-green-50 px-3 py-1.5 rounded-lg transition border border-green-100 flex items-center gap-1">
                            <i class="fa-solid fa-bell"></i> Notify
                        </button>
                </td>
            </tr>
        `).join('');
        if (users.length === 0) tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-gray-400">No users found</td></tr>`;
    } catch (e) {
        console.error("Failed to load users", e);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-red-500">Error loading users</td></tr>`;
    }
}

function showToast(msg) {
    const toast = document.getElementById('admin-toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.remove('opacity-0', 'translate-y-[-20px]'), 10);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-20px]');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

function setupForm(formId, apiEndpoint, modalId, reloadFn) {
    document.getElementById(formId).addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const formData = new FormData(form);

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                document.getElementById(modalId).classList.add('hidden');
                form.reset();
                showToast('Successfully added!');
                reloadFn();
            } else {
                alert('Failed to save. Check console for details.');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

async function deleteItem(endpoint, id, reloadFn) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const response = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Item deleted');
            reloadFn();
        } else {
            alert('Failed to delete item.');
        }
    } catch (err) {
        console.error(err);
    }
}

// Data Loading Functions
async function loadPets() {
    const tbody = document.getElementById('pets-table-body');
    const pets = await fetch('/api/pets').then(res => res.json());

    tbody.innerHTML = pets.map(pet => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                    ${pet.image_base64 ? `<img src="${pet.image_base64}" class="h-full w-full object-cover">` : '<i class="fa-solid fa-cat mt-4 ml-4 text-gray-400"></i>'}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-bold text-gray-900">${pet.name}</div>
                <div class="text-sm text-gray-500">${pet.breed} • ${pet.age}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900 line-clamp-2 max-w-xs">${pet.description}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="deleteItem('/api/pets', ${pet.id}, loadPets)" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition">Delete</button>
            </td>
        </tr>
    `).join('');
    if (pets.length === 0) tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">No pets found</td></tr>`;
}

async function loadProducts() {
    const tbody = document.getElementById('products-table-body');
    const products = await fetch('/api/products').then(res => res.json());

    tbody.innerHTML = products.map(p => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="h-12 w-12 rounded bg-gray-50 border border-gray-100 flex items-center justify-center p-1">
                    ${p.image_base64 ? `<img src="${p.image_base64}" class="h-full w-full object-contain">` : '<i class="fa-solid fa-box text-gray-400"></i>'}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-bold text-gray-900">${p.name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${p.old_price ? `<span class="text-xs text-gray-400 line-through mr-2">£${p.old_price}</span>` : ''}
                <span class="text-sm font-bold text-forest">£${p.new_price}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="deleteItem('/api/products', ${p.id}, loadProducts)" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition">Delete</button>
            </td>
        </tr>
    `).join('');
    if (products.length === 0) tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">No products found</td></tr>`;
}

async function loadReviews() {
    const container = document.getElementById('reviews-grid');
    const reviews = await fetch('/api/reviews').then(res => res.json());

    container.innerHTML = reviews.map(r => `
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                        ${r.image_base64 ? `<img src="${r.image_base64}" class="h-full w-full object-cover">` : '<i class="fa-solid fa-user mt-2 ml-3 text-gray-400"></i>'}
                    </div>
                    <div>
                        <div class="font-bold text-black text-sm">${r.customer_name}</div>
                        <div class="text-brown text-xs">
                            ${Array(r.rating).fill('<i class="fa-solid fa-star"></i>').join('')}
                            ${Array(5 - r.rating).fill('<i class="fa-regular fa-star"></i>').join('')}
                        </div>
                    </div>
                </div>
                <button onclick="deleteItem('/api/reviews', ${r.id}, loadReviews)" class="text-red-400 hover:text-red-600 transition"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <p class="text-gray-600 text-sm italic flex-1">"${r.comment}"</p>
        </div>
    `).join('');
    if (reviews.length === 0) container.innerHTML = `<div class="col-span-full text-center py-4 text-gray-500">No reviews found</div>`;
}

async function loadAdoptionList() {
    const tbody = document.getElementById('adoption-table-body');
    try {
        const list = await fetch('/api/adoption-list').then(res => res.json());

        // Group by submission_id
        const grouped = {};
        list.forEach(item => {
            const sid = item.submission_id || `LEGACY-${item.id}`;
            if (!grouped[sid]) {
                grouped[sid] = {
                    id: sid,
                    customer_name: item.customer_name,
                    email: item.email,
                    phone: item.phone,
                    address: item.address,
                    user_id: item.user_id,
                    created_at: item.created_at,
                    items: [],
                    total_proposed: 0
                };
            }
            grouped[sid].items.push(item);
            grouped[sid].total_proposed += (item.proposed_price || 0);
        });

        const sortedGroups = Object.values(grouped).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        tbody.innerHTML = sortedGroups.map(group => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(group.created_at).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">
                    ${group.id}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-bold text-black">${group.customer_name}</div>
                    <div class="text-xs text-gray-500">${group.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-700">
                        ${group.items.length} ${group.items.length === 1 ? 'Item' : 'Items'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-black text-forest">£${group.total_proposed.toFixed(2)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="viewOrderDetails('${group.id}')" 
                        class="bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition shadow-sm flex items-center gap-2 ml-auto">
                        <i class="fa-solid fa-eye"></i> View Order
                    </button>
                </td>
            </tr>
        `).join('');

        window.allOrders = grouped;
        if (sortedGroups.length === 0) tbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-gray-400">No submissions found</td></tr>`;
    } catch (e) {
        console.error("Failed to load adoption list", e);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-red-500">Error loading data. Check console.</td></tr>`;
    }
}

function viewOrderDetails(orderId) {
    const order = window.allOrders[orderId];
    if (!order) return;

    // Populate Modal Metadata
    document.getElementById('modal-order-id').textContent = `Order ${orderId}`;
    document.getElementById('modal-order-date').textContent = `Submitted: ${new Date(order.created_at).toLocaleString()}`;
    document.getElementById('modal-customer-name').textContent = order.customer_name;
    document.getElementById('modal-customer-email').textContent = order.email;
    document.getElementById('modal-customer-phone').textContent = order.phone;
    document.getElementById('modal-customer-address').textContent = order.address || 'N/A';
    document.getElementById('modal-order-total').textContent = `£${order.total_proposed.toFixed(2)}`;

    // Populate Items
    const itemsContainer = document.getElementById('modal-order-items');
    itemsContainer.innerHTML = order.items.map(item => `
        <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-gray-50 flex items-center justify-center text-gray-400">
                    ${item.item_type === 'pet' ? '<i class="fa-solid fa-cat text-sm"></i>' : '<i class="fa-solid fa-box text-sm"></i>'}
                </div>
                <div>
                    <p class="text-sm font-bold text-black">${item.item_name}</p>
                    <p class="text-[10px] text-slate uppercase">${item.item_type}</p>
                </div>
            </div>
            <p class="text-sm font-bold text-forest">£${(item.proposed_price || 0).toFixed(2)}</p>
        </div>
    `).join('');

    // Show Modal
    document.getElementById('order-details-modal').classList.remove('hidden');
}

async function sendNotification(userId, message) {
    if (!message) {
        message = prompt("Enter the notification message for the user:");
    }
    if (!message) return;

    try {
        const res = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, message })
        });
        if (res.ok) {
            showToast('Notification sent successfully!');
        } else {
            alert('Failed to send notification.');
        }
    } catch (e) {
        console.error(e);
        alert('Error sending notification.');
    }
}
