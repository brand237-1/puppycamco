document.addEventListener('DOMContentLoaded', () => {
    fetchReviews();
    fetchFeaturedPets();
});

async function fetchReviews() {
    const container = document.getElementById('reviews-container');
    try {
        const response = await fetch('/api/reviews');
        if (!response.ok) throw new Error('Failed to fetch reviews');

        const reviews = await response.json();

        if (reviews.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">No reviews yet. Be the first to leave one!</div>';
            return;
        }

        container.innerHTML = reviews.map(review => `
            <div class="glass p-6 rounded-3xl transition duration-300 shadow-lg border border-gray-100 flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-full bg-gray-200 mb-4 overflow-hidden shadow-md">
                    ${review.image_base64
                ? `<img src="${review.image_base64}" alt="${review.customer_name}" class="w-full h-full object-cover">`
                : `<div class="w-full h-full flex items-center justify-center text-gray-400"><i class="fa-solid fa-user"></i></div>`
            }
                </div>
                <div class="text-golden text-sm mb-3">
                    ${Array(review.rating).fill('<i class="fa-solid fa-star"></i>').join('')}
                    ${Array(5 - review.rating).fill('<i class="fa-regular fa-star"></i>').join('')}
                </div>
                <p class="text-gray-600 mb-4 text-sm italic">"${review.comment}"</p>
                <div class="font-bold text-mint mt-auto">- ${review.customer_name}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="col-span-full text-center text-red-500 py-10">Could not load reviews. Note: Requires the backend server to be running.</div>';
    }
}
async function fetchFeaturedPets() {
    const container = document.getElementById('featured-pets-container');
    try {
        const res = await fetch('/api/pets');
        if (!res.ok) return;
        const pets = await res.json();

        // Take the 3 most recent
        const featured = pets.slice(-3).reverse();

        if (featured.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-slate py-10 bg-gray-50 rounded-xl italic">New puppy arrivals coming soon! Check back later.</div>';
            return;
        }

        container.innerHTML = featured.map(pet => `
            <div class="bg-white rounded-2xl overflow-hidden smooth-shadow border border-gray-100 group hover:translate-y-[-5px] transition-all duration-300">
                <div class="h-64 overflow-hidden relative">
                    ${pet.image_base64
                ? `<img src="${pet.image_base64}" alt="${pet.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">`
                : `<div class="w-full h-full bg-beige flex items-center justify-center text-forest text-4xl"><i class="fa-solid fa-dog"></i></div>`
            }
                    <div class="absolute top-4 right-4 bg-forest text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg ring-4 ring-white/20">Featured</div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="text-xl font-serif font-bold text-black">${pet.name}</h3>
                            <p class="text-xs text-slate font-bold uppercase tracking-wider">${pet.breed || 'Purebred'}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-forest font-bold text-lg font-serif">£${pet.new_price.toLocaleString()}</p>
                            ${pet.old_price ? `<p class="text-gray-400 line-through text-[10px]">£${pet.old_price.toLocaleString()}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-4 text-xs text-slate mb-6 border-t border-gray-50 pt-4">
                        <span class="flex items-center gap-1"><i class="fa-solid fa-venus-mars text-blue"></i> ${pet.gender || 'N/A'}</span>
                        <span class="flex items-center gap-1"><i class="fa-solid fa-calendar text-brown"></i> ${pet.age || 'N/A'}</span>
                    </div>
                    <a href="pets.html" class="block w-full text-center py-3 bg-beige text-black rounded font-bold hover:bg-forest hover:text-white transition uppercase tracking-widest text-xs border border-gray-100">Reserve Me</a>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p class="text-red-500 text-center col-span-full">Failed to load puppies.</p>';
    }
}
