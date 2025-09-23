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
$prn = $_GET['prn'] ?? '';

if ($action == 'get') {
    try {
        // Get student information
        $stmt = $db->prepare("SELECT * FROM students WHERE prn = :prn");
        $stmt->bindParam(':prn', $prn);
        $stmt->execute();
        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            echo json_encode(['success' => false, 'message' => 'Student not found']);
            exit;
        }

        // Get program requirements
        $stmt = $db->prepare("SELECT * FROM programme_rules WHERE admission_year = :admission_year AND programme = :programme");
        $stmt->bindParam(':admission_year', $student['admission_year']);
        $stmt->bindParam(':programme', $student['programme']);
        $stmt->execute();
        $requirements = $stmt->fetch(PDO::FETCH_ASSOC);

        // Get all approved activities
        $stmt = $db->prepare("
            SELECT a.*, am.activity_name as activity_type_name
            FROM activities a
            LEFT JOIN activities_master am ON a.activity_type = am.id
            WHERE a.prn = :prn AND a.status = 'Approved'
            ORDER BY a.date DESC
        ");
        $stmt->bindParam(':prn', $prn);
        $stmt->execute();
        $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate category-wise points
        $categoryPoints = [
            'A' => ['earned' => 0, 'required' => $requirements['technical'] ?? 0, 'name' => 'Technical Skills'],
            'B' => ['earned' => 0, 'required' => $requirements['sports_cultural'] ?? 0, 'name' => 'Sports & Cultural'],
            'C' => ['earned' => 0, 'required' => $requirements['community_outreach'] ?? 0, 'name' => 'Community Outreach'],
            'D' => ['earned' => 0, 'required' => $requirements['innovation'] ?? 0, 'name' => 'Innovation'],
            'E' => ['earned' => 0, 'required' => $requirements['leadership'] ?? 0, 'name' => 'Leadership']
        ];

        $totalEarned = 0;
        foreach ($activities as &$activity) {
            $categoryPoints[$activity['category']]['earned'] += $activity['points'];
            $totalEarned += $activity['points'];
            $activity['activity_type'] = $activity['activity_type_name'] ?? $activity['activity_type'];
        }

        // Prepare categories array
        $categories = [];
        foreach ($categoryPoints as $cat => $data) {
            $categories[] = [
                'category' => $cat,
                'name' => $data['name'],
                'earned' => $data['earned'],
                'required' => $data['required']
            ];
        }

        $transcript = [
            'student' => $student,
            'summary' => [
                'total_earned' => $totalEarned,
                'total_required' => $requirements['total_points'] ?? 0,
                'total_activities' => count($activities)
            ],
            'categories' => $categories,
            'activities' => $activities
        ];

        echo json_encode([
            'success' => true,
            'transcript' => $transcript
        ]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

if ($action == 'download') {
    // This would generate a PDF transcript - for now return success
    echo json_encode(['success' => true, 'message' => 'PDF generation not implemented yet']);
}
?>