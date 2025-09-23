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
    $coordinator_id = $_GET['id'] ?? '';

    if ($action == 'dashboard') {
        try {
            // Get coordinator's class students (assuming coordinator manages specific class)
            $stmt = $db->prepare("
                SELECT s.*, pr.total_points as required_points,
                       COALESCE(SUM(CASE WHEN a.status = 'Approved' THEN a.points ELSE 0 END), 0) as earned_points,
                       MAX(a.submitted_at) as last_activity
                FROM students s
                LEFT JOIN programme_rules pr ON s.admission_year = pr.admission_year AND s.programme = pr.programme
                LEFT JOIN activities a ON s.prn = a.prn
                GROUP BY s.prn
                ORDER BY s.first_name, s.last_name
            ");
            $stmt->execute();
            $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calculate statistics
            $totalStudents = count($students);
            $compliantStudents = 0;
            $atRiskStudents = 0;

            foreach ($students as &$student) {
                $progress = $student['required_points'] > 0 ? 
                    ($student['earned_points'] / $student['required_points']) * 100 : 0;
                
                if ($progress >= 100) $compliantStudents++;
                if ($progress < 50) $atRiskStudents++;
            }

            // Get pending submissions count
            $stmt = $db->prepare("SELECT COUNT(*) as pending FROM activities WHERE status = 'Pending'");
            $stmt->execute();
            $pendingCount = $stmt->fetch(PDO::FETCH_ASSOC)['pending'];

            // Get category-wise performance
            $stmt = $db->prepare("
                SELECT category, AVG(
                    CASE WHEN pr.total_points > 0 
                    THEN (earned_points / pr.total_points) * 100 
                    ELSE 0 END
                ) as average_progress
                FROM (
                    SELECT s.prn, a.category, 
                           COALESCE(SUM(CASE WHEN a.status = 'Approved' THEN a.points ELSE 0 END), 0) as earned_points,
                           pr.total_points
                    FROM students s
                    LEFT JOIN programme_rules pr ON s.admission_year = pr.admission_year AND s.programme = pr.programme
                    LEFT JOIN activities a ON s.prn = a.prn
                    GROUP BY s.prn, a.category, pr.total_points
                ) as category_stats
                LEFT JOIN programme_rules pr ON 1=1
                WHERE category IS NOT NULL
                GROUP BY category
            ");
            $stmt->execute();
            $categoryData = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get recent pending submissions
            $stmt = $db->prepare("
                SELECT a.*, s.first_name, s.last_name, 
                       CONCAT(s.first_name, ' ', s.last_name) as student_name,
                       am.activity_name as activity_type
                FROM activities a
                JOIN students s ON a.prn = s.prn
                LEFT JOIN activities_master am ON a.activity_type = am.id
                WHERE a.status = 'Pending'
                ORDER BY a.submitted_at DESC
                LIMIT 10
            ");
            $stmt->execute();
            $pendingSubmissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'stats' => [
                    'total_students' => $totalStudents,
                    'pending_submissions' => $pendingCount,
                    'compliant_students' => $compliantStudents,
                    'at_risk_students' => $atRiskStudents
                ],
                'students' => $students,
                'categoryData' => $categoryData,
                'pendingSubmissions' => $pendingSubmissions
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

    if ($action == 'pending_submissions') {
        try {
            $stmt = $db->prepare("
                SELECT a.*, s.first_name, s.last_name, 
                       CONCAT(s.first_name, ' ', s.last_name) as student_name,
                       am.activity_name as activity_type
                FROM activities a
                JOIN students s ON a.prn = s.prn
                LEFT JOIN activities_master am ON a.activity_type = am.id
                WHERE a.status = 'Pending'
                ORDER BY a.submitted_at DESC
            ");
            $stmt->execute();
            $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
    $data = json_decode(file_get_contents("php://input"));

    if ($data->action == 'verify_submission') {
        try {
            $submission_id = $data->submission_id;
            $verification_action = $data->verification_action; // 'approve' or 'reject'
            $points = $data->points ?? 0;
            $remarks = $data->remarks ?? '';
            $coordinator_id = $data->coordinator_id;

            $status = ($verification_action == 'approve') ? 'Approved' : 'Rejected';
            $awarded_points = ($verification_action == 'approve') ? $points : 0;

            $stmt = $db->prepare("
                UPDATE activities 
                SET status = :status, points = :points, coordinator_remarks = :remarks, verified_at = NOW(), verified_by = :coordinator_id
                WHERE id = :submission_id
            ");
            
            $stmt->bindParam(':status', $status);
            $stmt->bindParam(':points', $awarded_points);
            $stmt->bindParam(':remarks', $remarks);
            $stmt->bindParam(':coordinator_id', $coordinator_id);
            $stmt->bindParam(':submission_id', $submission_id);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Submission verified successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to verify submission']);
            }

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }
}
?>