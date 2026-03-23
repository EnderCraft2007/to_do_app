<?php
require_once 'db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Nincs bejelentkezve']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $_SESSION['user_id'];
$event_id = isset($data['event_id']) ? $data['event_id'] : null;
$action = isset($data['action']) ? $data['action'] : '';

if (!$event_id) {
    echo json_encode(['success' => false, 'message' => 'Nincs esemény azonosító']);
    exit;
}

if ($action === 'make_public') {
    // Csak a sajátját teheti publikussá
    $stmt = $pdo->prepare('UPDATE events SET is_public = 1 WHERE id = ? AND created_by = ?');
    $stmt->execute([$event_id, $user_id]);
    echo json_encode(['success' => $stmt->rowCount() > 0]);
} elseif ($action === 'join') {
    try {
        $stmt = $pdo->prepare('INSERT INTO event_participants (event_id, user_id) VALUES (?, ?)');
        $stmt->execute([$event_id, $user_id]);
        
        $stmt = $pdo->prepare('UPDATE events SET attendees_count = attendees_count + 1 WHERE id = ?');
        $stmt->execute([$event_id]);
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Már felvetted ezt az eseményt']);
    }
} elseif ($action === 'leave') {
    $stmt = $pdo->prepare('DELETE FROM event_participants WHERE event_id = ? AND user_id = ?');
    $stmt->execute([$event_id, $user_id]);
    
    if ($stmt->rowCount() > 0) {
        $stmt = $pdo->prepare('UPDATE events SET attendees_count = attendees_count - 1 WHERE id = ?');
        $stmt->execute([$event_id]);
    }
    
    echo json_encode(['success' => true]);
}
?>
