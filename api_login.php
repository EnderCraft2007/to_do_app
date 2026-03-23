<?php
require_once 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['username']) && isset($data['password'])) {
    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch();

    if ($user && $data['password'] === $user['password']) { // Ideális esetben password_verify kéne
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        echo json_encode(['success' => true, 'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'name' => $user['name']
        ]]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Hibás felhasználónév vagy jelszó!']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Hiányzó adatok!']);
}
?>
