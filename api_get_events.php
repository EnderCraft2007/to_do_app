<?php
require_once 'db.php';

header('Content-Type: application/json');

$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
$type = isset($_GET['type']) ? $_GET['type'] : 'public';

if ($type === 'public') {
    // Publikus események (vagy amiknek nincs készítője - bár az adatbázisban mindenhez van készítő a tesztadatoknál)
    $stmt = $pdo->prepare('SELECT e.*, u.username as creator_name, 
                          (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id AND ep.user_id = ?) as is_joined
                          FROM events e 
                          LEFT JOIN users u ON e.created_by = u.id 
                          WHERE e.is_public = 1');
    $stmt->execute([$user_id]);
    $events = $stmt->fetchAll();
    echo json_encode($events);
} elseif ($type === 'user') {
    if (!$user_id) {
        echo json_encode(['error' => 'Not logged in']);
        exit;
    }
    // Saját létrehozású VAGY felvett események
    $stmt = $pdo->prepare('SELECT e.*, u.username as creator_name, 
                          (CASE WHEN e.created_by = ? THEN 1 ELSE 0 END) as is_own
                          FROM events e
                          LEFT JOIN users u ON e.created_by = u.id
                          WHERE e.created_by = ? 
                          OR e.id IN (SELECT event_id FROM event_participants WHERE user_id = ?)');
    $stmt->execute([$user_id, $user_id, $user_id]);
    $events = $stmt->fetchAll();
    echo json_encode($events);
}
?>
