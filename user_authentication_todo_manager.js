// Shared Business Logic
let todos = JSON.parse(localStorage.getItem('todos_v3')) || [];
let users = JSON.parse(localStorage.getItem('users_v3')) || {};

function login(username, password) {
    username = username.trim().toLowerCase();
    if (!username || !password) return { success: false, message: 'Please enter both username and password' };

    if (users[username]) {
        if (users[username] === password) {
            return performLogin(username);
        } else {
            return { success: false, message: 'Incorrect password' };
        }
    } else {
        users[username] = password;
        localStorage.setItem('users_v3', JSON.stringify(users));
        return performLogin(username);
    }
}

function performLogin(username) {
    localStorage.setItem('currentUser_v3', username);
    window.location.href = 'app.html';
    return { success: true };
}

function logout() {
    localStorage.removeItem('currentUser_v3');
    window.location.href = 'index.html';
}

function addTodo(text, date, time) {
    const currentUser = localStorage.getItem('currentUser_v3');
    if (!text.trim() || !currentUser) return;

    const newTodo = {
        id: Date.now(),
        user: currentUser,
        text: text,
        date: date,
        time: time,
        completed: false
    };

    todos.push(newTodo);
    saveTodos();
    return newTodo;
}

function toggleTodo(id) {
    todos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
}

function saveTodos() {
    localStorage.setItem('todos_v3', JSON.stringify(todos));
}

function getTodosForUser() {
    const currentUser = localStorage.getItem('currentUser_v3');
    return todos.filter(t => t.user === currentUser);
}
