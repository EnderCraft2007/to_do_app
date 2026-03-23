<?php
require_once 'db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Nincs bejelentkezve']);
    exit;
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $event_id = isset($_GET['id']) ? $_GET['id'] : null;
    if ($event_id) {
        $stmt = $pdo->prepare('SELECT * FROM events WHERE id = ? AND created_by = ?');
        $stmt->execute([$event_id, $user_id]);
        $event = $stmt->fetch();
        echo json_encode($event);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $event_id = isset($data['id']) ? $data['id'] : null;
    
    if ($event_id) {
        $stmt = $pdo->prepare('UPDATE events SET title = ?, event_date = ? WHERE id = ? AND created_by = ?');
        $stmt->execute([$data['title'], $data['event_date'], $event_id, $user_id]);
        echo json_encode(['success' => true]);
    }
}
?>
