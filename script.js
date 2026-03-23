// Aktuális felhasználó lekérése a sessionből (vagy localStorage-ból a frontendnek)
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Navigáció kezelése
function updateNav() {
    const navItems = document.getElementById('nav-items');
    if (!navItems) return;

    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    const currentPage = page || 'index.html';

    if (currentUser) {
        navItems.innerHTML = `
            <li><a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">Főoldal</a></li>
            <li><a href="public_events.html" class="${currentPage === 'public_events.html' ? 'active' : ''}">Publikus események</a></li>
            <li><a href="todo_app_dashboard.html" class="${currentPage === 'todo_app_dashboard.html' ? 'active' : ''}">Vezérlőpult</a></li>
            <li><a href="profile.html" class="${currentPage === 'profile.html' ? 'active' : ''}">Profil</a></li>
            <li><a href="#" onclick="logout()">Kijelentkezés (${currentUser.username})</a></li>
        `;
    } else {
        navItems.innerHTML = `
            <li><a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">Főoldal</a></li>
            <li><a href="public_events.html" class="${currentPage === 'public_events.html' ? 'active' : ''}">Publikus események</a></li>
            <li><a href="login.html" class="${currentPage === 'login.html' ? 'active' : ''}">Bejelentkezés</a></li>
            <li><a href="register.html" class="${currentPage === 'register.html' ? 'active' : ''}">Regisztráció</a></li>
        `;
    }
}

async function initPage() {
    updateNav();
    
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    const currentPage = page || 'index.html';
    
    if (currentPage === 'public_events.html') {
        renderPublicEvents();
    } else if (currentPage === 'todo_app_dashboard.html') {
        if (!currentUser) { window.location.href = 'login.html'; return; }
        renderUserEvents();
    } else if (currentPage === 'profile.html') {
        if (!currentUser) { window.location.href = 'login.html'; return; }
        renderProfile();
    } else if (currentPage === 'edit_todo.html') {
        if (!currentUser) { window.location.href = 'login.html'; return; }
        loadEventForEdit();
    } else if (currentPage === 'edit_profile.html') {
        if (!currentUser) { window.location.href = 'login.html'; return; }
        loadProfileForEdit();
    }
}

// Publikus események listázása (Adatbázisból)
async function renderPublicEvents() {
    const eventList = document.getElementById('static-event-list');
    if (!eventList) return;
    
    const response = await fetch('api_get_events.php?type=public');
    const events = await response.json();
    
    eventList.innerHTML = '';
    events.forEach(event => {
        const li = document.createElement('li');
        const isJoined = parseInt(event.is_joined) > 0;
        
        li.innerHTML = `
            <div>
                <strong>${event.title}</strong> - ${event.event_date}
                <br><small>Készítette: ${event.creator_name || 'Rendszer'}</small>
                <br><small>Résztvevők: ${event.attendees_count} fő</small>
            </div>
            <div>
                ${currentUser ? 
                    (isJoined ? 
                        '<span class="joined-status">✓ Felvéve</span>' : 
                        `<button onclick="updateEventAction(${event.id}, 'join')">Felvétel</button>`
                    ) : ''
                }
            </div>
        `;
        eventList.appendChild(li);
    });
}

// Saját és felvett események listázása
async function renderUserEvents() {
    const eventList = document.getElementById('user-event-list');
    if (!eventList) return;
    
    const response = await fetch('api_get_events.php?type=user');
    const events = await response.json();
    
    eventList.innerHTML = '';
    if (events.length === 0) {
        eventList.innerHTML = '<li>Még nincsenek saját vagy felvett eseményeid.</li>';
        return;
    }

    events.forEach(event => {
        const li = document.createElement('li');
        const isOwn = parseInt(event.is_own) === 1;
        
        li.innerHTML = `
            <div>
                <strong>${event.title}</strong> - ${event.event_date}
                <br><small>Résztvevők: ${event.attendees_count} fő ${isOwn ? ' (Saját)' : ' (Felvett)'}</small>
            </div>
            <div>
                ${isOwn && parseInt(event.is_public) === 0 ? `<button class="public-btn" onclick="updateEventAction(${event.id}, 'make_public')">Publikussá tétel</button>` : ''}
                ${isOwn ? `<button class="edit-btn" onclick="window.location.href='edit_todo.html?id=${event.id}'">Szerkesztés</button>` : ''}
                ${!isOwn ? `<button class="remove-btn" onclick="updateEventAction(${event.id}, 'leave')">Eltávolítás</button>` : ''}
            </div>
        `;
        eventList.appendChild(li);
    });
}

async function updateEventAction(eventId, action) {
    const response = await fetch('api_update_event.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, action: action })
    });
    const result = await response.json();
    if (result.success) {
        const path = window.location.pathname;
        if (path.includes('public_events.html')) renderPublicEvents();
        else renderUserEvents();
    } else {
        alert(result.message || 'Hiba történt!');
    }
}

// Új esemény mentése
async function createEvent(e) {
    if (e) e.preventDefault();
    
    const title = document.getElementById('new-event-title').value;
    const date = document.getElementById('new-event-date').value;
    
    const response = await fetch('api_create_event.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title, date: date })
    });
    const result = await response.json();
    
    if (result.success) {
        alert('Esemény létrehozva!');
        document.getElementById('new-event-title').value = '';
        document.getElementById('new-event-date').value = '';
        renderUserEvents();
    } else {
        alert('Hiba: ' + result.message);
    }
}

// Profil adatok
async function renderProfile() {
    const profileContent = document.getElementById('profile-content');
    if (!profileContent) return;
    
    const response = await fetch('api_profile.php');
    const user = await response.json();
    
    profileContent.innerHTML = `
        <div class="profile-info">
            <p><strong>Felhasználónév:</strong> ${user.username}</p>
            <p><strong>Név:</strong> ${user.name || 'Nincs megadva'}</p>
            <p><strong>Email:</strong> ${user.email || 'Nincs megadva'}</p>
            <p><strong>Telefonszám:</strong> ${user.phone || 'Nincs megadva'}</p>
            <p><strong>Város:</strong> ${user.city || 'Nincs megadva'}</p>
            <p><strong>Születési dátum:</strong> ${user.birthdate || 'Nincs megadva'}</p>
            <button onclick="window.location.href='edit_profile.html'">Profil szerkesztése</button>
        </div>
        <div class="change-password">
            <h3>Jelszó megváltoztatása</h3>
            <form id="change-password-form">
                <input type="password" id="old-password" placeholder="Régi jelszó" required>
                <input type="password" id="new-password" placeholder="Új jelszó" required>
                <input type="password" id="new-password-confirm" placeholder="Új jelszó újra" required>
                <button type="submit">Jelszó frissítése</button>
            </form>
        </div>
    `;
    
    const changePassForm = document.getElementById('change-password-form');
    if (changePassForm) changePassForm.onsubmit = changePassword;
}

// Jelszó változtatás
async function changePassword(e) {
    e.preventDefault();
    const oldPass = document.getElementById('old-password').value;
    const newPass = document.getElementById('new-password').value;
    const newPassConfirm = document.getElementById('new-password-confirm').value;

    if (newPass !== newPassConfirm) { alert('Az új jelszavak nem egyeznek!'); return; }

    const response = await fetch('api_profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_password', old_password: oldPass, new_password: newPass })
    });
    const result = await response.json();
    
    if (result.success) {
        alert('Jelszó sikeresen megváltoztatva!');
        e.target.reset();
    } else {
        alert(result.message);
    }
}

// Bejelentkezés
async function login(e) {
    e.preventDefault();
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    
    const response = await fetch('api_login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
    });
    const result = await response.json();
    
    if (result.success) {
        currentUser = result.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        window.location.href = 'todo_app_dashboard.html';
    } else {
        alert(result.message);
    }
}

// Regisztráció
async function register(e) {
    e.preventDefault();
    const data = {
        username: document.getElementById('reg-username').value,
        password: document.getElementById('reg-password').value,
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value,
        city: document.getElementById('reg-city').value,
        birthdate: document.getElementById('reg-birthdate').value
    };
    
    if (data.password !== document.getElementById('reg-password-confirm').value) {
        alert('A jelszavak nem egyeznek!'); return;
    }
    
    const response = await fetch('api_register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    
    if (result.success) {
        alert('Sikeres regisztráció!');
        window.location.href = 'login.html';
    } else {
        alert(result.message);
    }
}

// Esemény szerkesztése betöltés
async function loadEventForEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    if (!eventId) return;

    const response = await fetch(`api_edit_todo.php?id=${eventId}`);
    const event = await response.json();
    
    document.getElementById('edit-event-id').value = event.id;
    document.getElementById('edit-event-title').value = event.title;
    document.getElementById('edit-event-date').value = event.event_date;
}

// Profil szerkesztése betöltés
async function loadProfileForEdit() {
    const response = await fetch('api_profile.php');
    const user = await response.json();
    
    document.getElementById('edit-profile-name').value = user.name || '';
    document.getElementById('edit-profile-email').value = user.email || '';
    document.getElementById('edit-profile-phone').value = user.phone || '';
    document.getElementById('edit-profile-city').value = user.city || '';
    document.getElementById('edit-profile-birthdate').value = user.birthdate || '';
}

// Form beküldések figyelése
document.addEventListener('DOMContentLoaded', () => {
    initPage();

    const loginForm = document.querySelector('form[onsubmit="login(event)"]');
    if (loginForm) loginForm.onsubmit = login;

    const regForm = document.querySelector('form[onsubmit="register(event)"]');
    if (regForm) regForm.onsubmit = register;

    const createForm = document.querySelector('#create-event-area form');
    if (createForm) createForm.onsubmit = createEvent;
    
    const editEventForm = document.getElementById('edit-event-form');
    if (editEventForm) {
        editEventForm.onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                id: document.getElementById('edit-event-id').value,
                title: document.getElementById('edit-event-title').value,
                event_date: document.getElementById('edit-event-date').value
            };
            const resp = await fetch('api_edit_todo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const res = await resp.json();
            if (res.success) { alert('Sikeres módosítás!'); window.location.href = 'todo_app_dashboard.html'; }
        };
    }
    
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('edit-profile-name').value,
                email: document.getElementById('edit-profile-email').value,
                phone: document.getElementById('edit-profile-phone').value,
                city: document.getElementById('edit-profile-city').value,
                birthdate: document.getElementById('edit-profile-birthdate').value
            };
            const resp = await fetch('api_profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const res = await resp.json();
            if (res.success) { alert('Profil frissítve!'); window.location.href = 'profile.html'; }
        };
    }
});

function logout() {
    localStorage.removeItem('currentUser');
    fetch('api_logout.php').then(() => {
        window.location.href = 'index.html';
    });
}
