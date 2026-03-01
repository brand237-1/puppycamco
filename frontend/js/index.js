document.addEventListener('DOMContentLoaded', () => {
    fetchReviews();
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
