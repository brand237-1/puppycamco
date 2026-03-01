document.addEventListener('DOMContentLoaded', async () => {
    // Try to auto-fill if logged in
    try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
            const user = await res.json();
            document.getElementById('cust-name').value = user.full_name;
            document.getElementById('cust-email').value = user.email;
            document.getElementById('cust-phone').value = user.phone;
            document.getElementById('cust-address').value = user.address || '';
        }
        renderList();
    } catch (e) {
        console.log("Guest mode active");
        renderList();
    }

    document.getElementById('adoption-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitInquiry();
    });
});

function renderList() {
    const list = getAdoptionList();
    const container = document.getElementById('selected-items');
    const countEl = document.getElementById('item-count');
    const submitBtn = document.getElementById('submit-btn');

    countEl.textContent = list.length;

    if (list.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-10 italic">Your list is empty. Explore our pets and products!</div>';
        submitBtn.disabled = true;
        return;
    }

    container.innerHTML = list.map((item, index) => `
        <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-forest/10 text-forest flex items-center justify-center">
                    ${item.type === 'pet' ? '<i class="fa-solid fa-cat"></i>' : '<i class="fa-solid fa-box"></i>'}
                </div>
                <div>
                    <h3 class="font-bold text-black text-sm truncate w-48">${item.name}</h3>
                    <p class="text-xs text-gray-500 capitalize">${item.type} • £${item.price || '0.00'}</p>
                </div>
            </div>
            <button onclick="removeItem(${index})" class="text-red-400 hover:text-red-600 transition w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join('');

    // Update total price
    const total = list.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const totalEl = document.getElementById('total-price');
    if (totalEl) totalEl.textContent = total.toFixed(2);
}

function removeItem(index) {
    const list = getAdoptionList();
    list.splice(index, 1);
    localStorage.setItem('adoptionList', JSON.stringify(list));
    renderList();
    updateNavListCount();
}

async function submitInquiry() {
    const items = getAdoptionList();
    if (items.length === 0) return;

    // Check auth before submitting
    const authRes = await fetch('/api/auth/status');
    const authData = await authRes.json();
    if (!authData.loggedIn) {
        alert("Please login or create an account to submit your selection.");
        window.location.href = 'user-login.html';
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    const loader = document.getElementById('form-loader');

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Sending...';
    }
    if (loader) loader.classList.remove('hidden');

    const customerName = document.getElementById('cust-name').value;
    const email = document.getElementById('cust-email').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;
    const proposedPrice = document.getElementById('cust-price').value;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

    const payload = {
        customerName,
        email,
        phone,
        address,
        proposedPrice: proposedPrice,
        paymentMethod: paymentMethod,
        items: items
    };

    try {
        const res = await fetch('/api/adoption-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            // Success
            localStorage.setItem('adoptionList', '[]');
            renderList();
            if (typeof updateNavListCount === 'function') updateNavListCount();

            // Show Success UI with Review Prompt
            const formContainer = document.querySelector('form').parentElement;
            formContainer.innerHTML = `
                <div class="text-center py-10 animate-fade-in">
                    <div class="relative inline-block mb-6">
                        <div class="w-24 h-24 bg-forest/20 text-forest rounded-full flex items-center justify-center text-5xl mx-auto animate-bounce-slow shadow-lg">
                            <i class="fa-solid fa-paper-plane"></i>
                        </div>
                        <div class="absolute -top-2 -right-2 bg-brown text-white w-8 h-8 rounded-full flex items-center justify-center border-4 border-white animate-pulse">
                            <i class="fa-solid fa-check text-xs"></i>
                        </div>
                    </div>
                    
                    <h2 class="text-4xl font-serif font-black text-black mb-4 tracking-tight">Offer Sent!</h2>
                    
                    <div class="max-w-md mx-auto bg-green-50 border border-green-100 rounded-3xl p-6 mb-8 transform hover:scale-105 transition shadow-sm">
                        <p class="text-green-800 font-bold mb-2 flex items-center justify-center gap-2">
                            <i class="fa-solid fa-circle-info"></i> ACTION REQUIRED
                        </p>
                        <p class="text-green-700 text-sm leading-relaxed">
                            Please <b>wait for admin confirmation</b>. You will receive a notification directly in your <a href="profile.html" class="underline font-bold">account profile</a> once approved. 
                            <span class="block mt-2 font-medium">Keep in touch through your profile or text our company email for priority support.</span>
                        </p>
                    </div>

                    <div id="review-form-container" class="bg-beige/30 p-8 rounded-3xl border-2 border-beige border-dashed text-left shadow-inner">
                        <h3 class="font-bold text-black text-lg mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-star text-yellow-500"></i> Share Your Experience
                        </h3>
                        <form id="post-checkout-review" class="space-y-4">
                            <input type="hidden" id="rev-name" value="${customerName}">
                            <div>
                                <label class="block text-xs font-bold text-slate uppercase mb-1">Rating</label>
                                <select id="rev-rating" class="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:ring-forest focus:ring-2 outline-none">
                                    <option value="5">5 - Excellent</option>
                                    <option value="4">4 - Very Good</option>
                                    <option value="3">3 - Average</option>
                                    <option value="2">2 - Poor</option>
                                    <option value="1">1 - Terrible</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate uppercase mb-1">Your Comment</label>
                                <textarea id="rev-comment" required placeholder="Tell us how we did..." class="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:ring-forest focus:ring-2 outline-none h-24"></textarea>
                            </div>
                            <button type="submit" id="submit-rev-btn" class="w-full bg-forest text-white py-3 rounded font-bold hover:bg-green-700 transition shadow-sm">
                                Submit Review
                            </button>
                        </form>
                    </div>

                    <a href="pets.html" class="inline-block mt-8 text-forest font-bold hover:underline">Return to Gallery</a>
                </div>
            `;

            // Handle review submission
            document.getElementById('post-checkout-review').addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('submit-rev-btn');
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                const revData = {
                    customer_name: document.getElementById('rev-name').value,
                    rating: document.getElementById('rev-rating').value,
                    comment: document.getElementById('rev-comment').value
                };

                try {
                    const rRes = await fetch('/api/reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(revData)
                    });
                    if (rRes.ok) {
                        document.getElementById('review-form-container').innerHTML = `
                            <div class="text-center py-4 text-green-600 font-bold">
                                <i class="fa-solid fa-circle-check mr-2"></i> Thank you for your feedback!
                            </div>
                        `;
                    }
                } catch (err) {
                    console.error(err);
                    btn.disabled = false;
                    btn.textContent = 'Try Again';
                }
            });
        } else {
            // Negotiation failed or error
            alert(data.error || 'Failed to submit. Please try again.');
            // Re-enable button so user can try again
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane text-lg"></i> Submit Offer';
            }
        }

    } catch (err) {
        console.error(err);
        alert('Server connection failed. Please try again later.');
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane text-lg"></i> Submit Offer';
        }
    } finally {
        const loader = document.getElementById('form-loader');
        if (loader) loader.classList.add('hidden');
    }
}

// New helper for real-time price comparison
function updateNegotiationComparison(proposedValue) {
    const list = getAdoptionList();
    const totalOriginal = list.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const summaryEl = document.getElementById('negotiation-summary');
    const proposed = parseFloat(proposedValue) || 0;

    if (!summaryEl) return;

    if (proposed > 0) {
        summaryEl.classList.remove('hidden');
        document.getElementById('orig-total-summary').textContent = totalOriginal.toFixed(2);
        document.getElementById('prop-total-summary').textContent = proposed.toFixed(2);

        const saving = totalOriginal - proposed;
        const savingEl = document.getElementById('saving-summary');
        savingEl.textContent = Math.max(0, saving).toFixed(2);

        const minPrice = totalOriginal * 0.8;
        const hintEl = document.getElementById('min-price-hint');
        if (proposed < minPrice) {
            hintEl.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-1"></i> Your offer is too low. Minimum required: <b>£${minPrice.toFixed(2)}</b>`;
            hintEl.classList.remove('text-green-600');
            hintEl.classList.add('text-red-500');
        } else {
            hintEl.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> Great! This offer meets our minimum standard.`;
            hintEl.classList.remove('text-red-500');
            hintEl.classList.add('text-green-600');
        }
    } else {
        summaryEl.classList.add('hidden');
    }
}
