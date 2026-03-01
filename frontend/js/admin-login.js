document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    fetch('/api/admin/check')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                window.location.href = 'admin.html';
            }
        });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('login-btn');
        const errorMsg = document.getElementById('error-msg');

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Authenticating...';
        errorMsg.classList.add('hidden');

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                document.getElementById('password').value = ''; // Clear password before redirect
                window.location.href = 'admin.html';
            } else {
                errorMsg.textContent = data.error || 'Authentication failed';
                errorMsg.classList.remove('hidden');
                btn.disabled = false;
                btn.innerHTML = 'Access Dashboard';
            }
        } catch (err) {
            errorMsg.textContent = 'Server connection error. Ensure backend is running.';
            errorMsg.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = 'Access Dashboard';
        }
    });
});
