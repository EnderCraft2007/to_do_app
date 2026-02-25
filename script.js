// Adatok betöltése
let users = JSON.parse(localStorage.getItem('users')) || [];
let events = JSON.parse(localStorage.getItem('events')) || [
    { id: 1, title: "Koncert", date: "2026-05-20", attendees: 12 },
    { id: 2, title: "Webfejlesztő Workshop", date: "2026-06-15", attendees: 8 },
    { id: 3, title: "Sportnap", date: "2026-07-02", attendees: 25 }
];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Kezdeti felhasználók betöltése fájlból, ha a tároló üres
if (users.length === 0) {
    fetch('users.json')
        .then(response => response.json())
        .then(data => {
            users = data;
            localStorage.setItem('users', JSON.stringify(users));
        })
        .catch(err => console.error("Hiba a users.json betöltésekor:", err));
}

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

function initPage() {
    updateNav();
    
    // Aktuális oldal beazonosítása
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    const currentPage = page || 'index.html';
    
    if (currentPage === 'index.html' || currentPage === '') {
        // Főoldalon jelenleg nincs dinamikus tartalom a nav-on kívül
    } else if (currentPage === 'public_events.html') {
        renderStaticEvents();
    } else if (currentPage === 'todo_app_dashboard.html') {
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        renderUserEvents();
    } else if (currentPage === 'profile.html') {
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        renderProfile();
    } else if (currentPage === 'login.html' || currentPage === 'register.html') {
        if (currentUser) {
            window.location.href = 'todo_app_dashboard.html';
        }
    }
}

function updateCreateEventVisibility() {
    const createArea = document.getElementById('create-event-area');
    if (createArea) {
        createArea.style.display = currentUser ? 'block' : 'none';
    }
}

// Publikus események listázása
function renderStaticEvents() {
    const eventList = document.getElementById('static-event-list');
    if (!eventList) return;
    
    // Csak a rendszer alapértelmezett eseményeit mutatjuk
    const staticEvents = events.filter(e => !e.createdBy);
    
    eventList.innerHTML = '';
    staticEvents.forEach(event => {
        const li = document.createElement('li');
        const isJoined = event.joinedUsers && event.joinedUsers.includes(currentUser ? currentUser.username : '');
        
        li.innerHTML = `
            <div>
                <strong>${event.title}</strong> - ${event.date}
                <br><small>Felvették: ${event.attendees} fő</small>
            </div>
            <div>
                ${currentUser ? 
                    (isJoined ? 
                        '<span class="joined-status">✓ Felvéve</span>' : 
                        `<button onclick="joinEvent(${event.id}, 'static')">Felvétel</button>`
                    ) : ''
                }
            </div>
        `;
        eventList.appendChild(li);
    });
}

// Saját és felvett események listázása
function renderUserEvents() {
    const eventList = document.getElementById('user-event-list');
    if (!eventList || !currentUser) {
        if (eventList) eventList.innerHTML = '<li>Kérlek jelentkezz be az eseményeid megtekintéséhez.</li>';
        return;
    }
    
    // Saját létrehozású vagy felvett események szűrése
    const userEvents = events.filter(e => 
        e.createdBy === currentUser.username || 
        (e.joinedUsers && e.joinedUsers.includes(currentUser.username))
    );
    
    eventList.innerHTML = '';
    if (userEvents.length === 0) {
        eventList.innerHTML = '<li>Még nincsenek saját vagy felvett eseményeid.</li>';
        return;
    }

    userEvents.forEach(event => {
        const li = document.createElement('li');
        const isOwn = event.createdBy === currentUser.username;
        
        li.innerHTML = `
            <div>
                <strong>${event.title}</strong> - ${event.date}
                <br><small>Felvették: ${event.attendees} fő ${isOwn ? ' (Saját)' : ' (Felvett)'}</small>
            </div>
            <div>
                ${isOwn ? '<button class="public-btn" title="Későbbi funkció">Publikussá tétel</button>' : ''}
                ${!isOwn ? `<button class="remove-btn" onclick="leaveEvent(${event.id})">Eltávolítás</button>` : ''}
            </div>
        `;
        eventList.appendChild(li);
    });
}

function joinEvent(eventId, type) {
    if (!currentUser) {
        alert('A funkció használatához be kell jelentkezned!');
        return;
    }

    const event = events.find(e => e.id === eventId);
    if (event) {
        if (!event.joinedUsers) event.joinedUsers = [];
        
        // Csak egyszer lehessen felvenni egy eseményt
        if (event.joinedUsers.includes(currentUser.username) || event.createdBy === currentUser.username) {
            alert('Ezt az eseményt már felvetted vagy te hoztad létre!');
            return;
        }

        event.attendees++;
        event.joinedUsers.push(currentUser.username);
        
        // Mentés és frissítés
        const eventIndex = events.findIndex(e => e.id === eventId);
        if (eventIndex !== -1) {
            events[eventIndex] = event;
            localStorage.setItem('events', JSON.stringify(events));
        }
        
        if (type === 'static') renderStaticEvents();
        else renderUserEvents();
        
        alert('Esemény sikeresen felvéve!');
    }
}

function leaveEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (event && event.joinedUsers) {
        const index = event.joinedUsers.indexOf(currentUser.username);
        if (index > -1) {
            event.joinedUsers.splice(index, 1);
            event.attendees--;
            localStorage.setItem('events', JSON.stringify(events));
            renderUserEvents();
            alert('Esemény eltávolítva a listádról.');
        }
    }
}

// Új esemény mentése
function createEvent(e) {
    if (e) e.preventDefault();
    
    const titleInput = document.getElementById('new-event-title');
    const dateInput = document.getElementById('new-event-date');
    
    if (!titleInput || !dateInput) {
        console.error('Nem találhatók az űrlap mezői!');
        return;
    }

    const title = titleInput.value;
    const date = dateInput.value;
    
    if (!title || !date) {
        alert('Kérlek töltsd ki az összes mezőt!');
        return;
    }

    if (!currentUser) {
        alert('Be kell jelentkezned az esemény létrehozásához!');
        return;
    }
    
    const newEvent = {
        id: Date.now(),
        title: title,
        date: date,
        attendees: 0,
        createdBy: currentUser.username,
        joinedUsers: []
    };
    
    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));
    
    // Alaphelyzetbe állítás
    titleInput.value = '';
    dateInput.value = '';
    
    alert('Esemény létrehozva!');
    renderUserEvents();
}

// Profiladatok kitöltése
function renderProfile() {
    const profileContent = document.getElementById('profile-content');
    if (!profileContent || !currentUser) return;
    
    profileContent.innerHTML = `
        <div class="profile-info">
            <p><strong>Felhasználónév:</strong> ${currentUser.username}</p>
            <p><strong>Név:</strong> ${currentUser.name || 'Nincs megadva'}</p>
            <p><strong>Email:</strong> ${currentUser.email || 'Nincs megadva'}</p>
            <p><strong>Telefonszám:</strong> ${currentUser.phone || 'Nincs megadva'}</p>
            <p><strong>Város:</strong> ${currentUser.city || 'Nincs megadva'}</p>
            <p><strong>Születési dátum:</strong> ${currentUser.birthdate || 'Nincs megadva'}</p>
        </div>
        <div class="change-password">
            <h3>Jelszó megváltoztatása</h3>
            <form onsubmit="changePassword(event)">
                <input type="password" id="old-password" placeholder="Régi jelszó" required>
                <input type="password" id="new-password" placeholder="Új jelszó" required>
                <input type="password" id="new-password-confirm" placeholder="Új jelszó újra" required>
                <button type="submit">Jelszó frissítése</button>
            </form>
        </div>
    `;
}

// Jelszó változtatás
function changePassword(e) {
    e.preventDefault();
    const oldPass = document.getElementById('old-password').value;
    const newPass = document.getElementById('new-password').value;
    const newPassConfirm = document.getElementById('new-password-confirm').value;

    if (oldPass !== currentUser.password) {
        alert('A régi jelszó hibás!');
        return;
    }

    if (newPass !== newPassConfirm) {
        alert('Az új jelszavak nem egyeznek!');
        return;
    }

    if (newPass.length < 4) {
        alert('Az új jelszónak legalább 4 karakterből kell állnia!');
        return;
    }

    // Felhasználó adatainak frissítése a users listában
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex].password = newPass;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Aktuális felhasználó frissítése
        currentUser.password = newPass;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        alert('Jelszó sikeresen megváltoztatva!');
        e.target.reset();
    }
}

// Bejelentkezés
function login(e) {
    e.preventDefault();
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    
    const foundUser = users.find(u => u.username === user && u.password === pass);
    if (foundUser) {
        currentUser = foundUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        window.location.href = 'todo_app_dashboard.html';
    } else {
        alert('Hibás felhasználónév vagy jelszó!');
    }
}

// Regisztráció
function register(e) {
    e.preventDefault();
    const user = document.getElementById('reg-username').value;
    const pass = document.getElementById('reg-password').value;
    const passConfirm = document.getElementById('reg-password-confirm').value;
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const city = document.getElementById('reg-city').value;
    const birthdate = document.getElementById('reg-birthdate').value;
    
    if (pass !== passConfirm) {
        alert('A jelszavak nem egyeznek!');
        return;
    }
    
    if (users.find(u => u.username === user)) {
        alert('Ez a felhasználónév már foglalt!');
        return;
    }
    
    const newUser = {
        username: user,
        password: pass,
        name: name,
        email: email,
        phone: phone,
        city: city,
        birthdate: birthdate
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert('Sikeres regisztráció!');
    window.location.href = 'login.html';
}

// Kijelentkezés
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Eseménykezelők beállítása az oldal betöltésekor
document.addEventListener('DOMContentLoaded', () => {
    initPage();

    // Űrlap beküldés figyelése
    const createEventForm = document.querySelector('#create-event-area form');
    if (createEventForm) {
        createEventForm.addEventListener('submit', createEvent);
    }
});
