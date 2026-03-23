<?php
require_once 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['username']) && isset($data['password'])) {
    // Ellenőrizni, hogy létezik-e már
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$data['username']]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Ez a felhasználónév már foglalt!']);
        exit;
    }

    $sql = "INSERT INTO users (username, password, name, email, phone, city, birthdate) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    try {
        $stmt->execute([
            $data['username'],
            $data['password'], // Élesben password_hash
            $data['name'] ?? '',
            $data['email'] ?? '',
            $data['phone'] ?? '',
            $data['city'] ?? '',
            $data['birthdate'] ?? null
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Hiba a regisztráció során: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Hiányzó adatok!']);
}
?>
