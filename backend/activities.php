<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

$action = $_GET['action'] ?? '';

if ($action == 'get_by_category') {
    $category = $_GET['category'] ?? '';
    
    try {
        $stmt = $db->prepare("SELECT * FROM activities_master WHERE category_id = :category");
        $stmt->bindParam(':category', $category);
        $stmt->execute();
        $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'activities' => $activities
        ]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

if ($action == 'get_levels') {
    $activity_id = $_GET['activity_id'] ?? '';
    
    try {
        // First check if this activity has levels
        $stmt = $db->prepare("SELECT points_type, min_points FROM activities_master WHERE id = :activity_id");
        $stmt->bindParam(':activity_id', $activity_id);
        $stmt->execute();
        $activity = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($activity['points_type'] == 'Fixed') {
            // Return fixed points as a single "level"
            echo json_encode([
                'success' => true,
                'levels' => [
                    ['level' => 'Fixed', 'points' => $activity['min_points']]
                ]
            ]);
        } else {
            // Get levels from activity_levels table
            $stmt = $db->prepare("SELECT level, points FROM activity_levels WHERE activity_id = :activity_id");
            $stmt->bindParam(':activity_id', $activity_id);
            $stmt->execute();
            $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'levels' => $levels
            ]);
        }

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>