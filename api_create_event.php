<?php
require_once 'db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Nincs bejelentkezve']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $_SESSION['user_id'];

if (isset($data['title']) && isset($data['date'])) {
    $sql = "INSERT INTO events (title, event_date, created_by, is_public) VALUES (?, ?, ?, 0)";
    $stmt = $pdo->prepare($sql);
    try {
        $stmt->execute([$data['title'], $data['date'], $user_id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Hiányzó adatok']);
}
?>
