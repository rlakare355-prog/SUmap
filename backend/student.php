<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

// Handle GET requests
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $action = $_GET['action'] ?? '';
    $prn = $_GET['prn'] ?? '';

    if ($action == 'dashboard') {
        try {
            // Get student info
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

            // Get student's activities and points
            $stmt = $db->prepare("SELECT * FROM activities WHERE prn = :prn AND status = 'Approved'");
            $stmt->bindParam(':prn', $prn);
            $stmt->execute();
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calculate points by category
            $categoryPoints = [
                'A' => 0, 'B' => 0, 'C' => 0, 'D' => 0, 'E' => 0
            ];
            $totalEarned = 0;

            foreach ($activities as $activity) {
                $categoryPoints[$activity['category']] += $activity['points'];
                $totalEarned += $activity['points'];
            }

            // Get recent activities
            $stmt = $db->prepare("SELECT a.*, am.activity_name as activity_type_name FROM activities a LEFT JOIN activities_master am ON a.activity_type = am.id WHERE a.prn = :prn ORDER BY a.id DESC LIMIT 5");
            $stmt->bindParam(':prn', $prn);
            $stmt->execute();
            $recentActivities = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get total activities count
            $stmt = $db->prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved FROM activities WHERE prn = :prn");
            $stmt->bindParam(':prn', $prn);
            $stmt->execute();
            $activityStats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Prepare category data for charts
            $categoryData = [
                ['category' => 'A', 'name' => 'Technical Skills', 'earned' => $categoryPoints['A'], 'required' => $requirements['technical'] ?? 0],
                ['category' => 'B', 'name' => 'Sports & Cultural', 'earned' => $categoryPoints['B'], 'required' => $requirements['sports_cultural'] ?? 0],
                ['category' => 'C', 'name' => 'Community Outreach', 'earned' => $categoryPoints['C'], 'required' => $requirements['community_outreach'] ?? 0],
                ['category' => 'D', 'name' => 'Innovation', 'earned' => $categoryPoints['D'], 'required' => $requirements['innovation'] ?? 0],
                ['category' => 'E', 'name' => 'Leadership', 'earned' => $categoryPoints['E'], 'required' => $requirements['leadership'] ?? 0]
            ];

            echo json_encode([
                'success' => true,
                'progress' => [
                    'earned_points' => $totalEarned,
                    'required_points' => $requirements['total_points'] ?? 0,
                    'total_activities' => $activityStats['total'],
                    'approved_activities' => $activityStats['approved']
                ],
                'categoryData' => $categoryData,
                'recentActivities' => $recentActivities
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

    if ($action == 'my_submissions') {
        try {
            $stmt = $db->prepare("
                SELECT a.*, am.activity_name as activity_type_name, a.submitted_at
                FROM activities a 
                LEFT JOIN activities_master am ON a.activity_type = am.id 
                WHERE a.prn = :prn 
                ORDER BY a.id DESC
            ");
            $stmt->bindParam(':prn', $prn);
            $stmt->execute();
            $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format the data for frontend
            foreach ($submissions as &$submission) {
                $submission['activity_type'] = $submission['activity_type_name'] ?? $submission['activity_type'];
                $submission['submitted_at'] = $submission['submitted_at'] ?? date('Y-m-d H:i:s');
            }

            echo json_encode([
                'success' => true,
                'submissions' => $submissions
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }
}

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Handle file uploads
    if (isset($_POST['action']) && $_POST['action'] == 'submit_activity') {
        try {
            $prn = $_POST['prn'];
            $category = $_POST['category'];
            $activity_type = $_POST['activity_type'];
            $level = $_POST['level'];
            $date = $_POST['date'];
            $remarks = $_POST['remarks'] ?? '';
            $proof_type = $_POST['proof_type'] ?? '';

            // Handle file uploads
            $certificate_path = '';
            $proof_path = '';

            if (isset($_FILES['certificate']) && $_FILES['certificate']['error'] == 0) {
                $upload_dir = 'uploads/';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0777, true);
                }
                
                $certificate_name = time() . '_cert_' . $_FILES['certificate']['name'];
                $certificate_path = $upload_dir . $certificate_name;
                
                if (move_uploaded_file($_FILES['certificate']['tmp_name'], $certificate_path)) {
                    $certificate_path = $certificate_name;
                } else {
                    throw new Exception('Failed to upload certificate');
                }
            }

            if (isset($_FILES['proof']) && $_FILES['proof']['error'] == 0) {
                $upload_dir = 'uploads/';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0777, true);
                }
                
                $proof_name = time() . '_proof_' . $_FILES['proof']['name'];
                $proof_path = $upload_dir . $proof_name;
                
                if (move_uploaded_file($_FILES['proof']['tmp_name'], $proof_path)) {
                    $proof_path = $proof_name;
                } else {
                    throw new Exception('Failed to upload proof');
                }
            }

            // Insert activity
            $stmt = $db->prepare("
                INSERT INTO activities (prn, category, activity_type, level, certificate, proof, proof_type, date, remarks, submitted_at) 
                VALUES (:prn, :category, :activity_type, :level, :certificate, :proof, :proof_type, :date, :remarks, NOW())
            ");
            
            $stmt->bindParam(':prn', $prn);
            $stmt->bindParam(':category', $category);
            $stmt->bindParam(':activity_type', $activity_type);
            $stmt->bindParam(':level', $level);
            $stmt->bindParam(':certificate', $certificate_path);
            $stmt->bindParam(':proof', $proof_path);
            $stmt->bindParam(':proof_type', $proof_type);
            $stmt->bindParam(':date', $date);
            $stmt->bindParam(':remarks', $remarks);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Activity submitted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to submit activity']);
            }

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }
}
?>