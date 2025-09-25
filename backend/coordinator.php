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
            // Get coordinator information to determine department and year
            $stmt = $db->prepare("SELECT * FROM coordinators WHERE id = :coordinator_id");
            $stmt->bindParam(':coordinator_id', $coordinator_id);
            $stmt->execute();
            $coordinator = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$coordinator) {
                echo json_encode(['success' => false, 'message' => 'Coordinator not found']);
                exit;
            }
            
            $department = $coordinator['department'];
            $year = $coordinator['year'];

            // Get coordinator's class students (assuming coordinator manages specific class)
            $stmt = $db->prepare("
                SELECT s.*, pr.total_points as required_points,
                       COALESCE(SUM(CASE WHEN a.status = 'Approved' THEN a.points ELSE 0 END), 0) as earned_points,
                       MAX(a.submitted_at) as last_activity
                FROM students s
                LEFT JOIN programme_rules pr ON s.admission_year = pr.admission_year AND s.programme = pr.programme
                LEFT JOIN activities a ON s.prn = a.prn
                WHERE s.dept = :department AND s.year = :year
                GROUP BY s.prn
                ORDER BY s.first_name, s.last_name
            ");
            $stmt->bindParam(':department', $department);
            $stmt->bindParam(':year', $year);
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

            // Get pending submissions count for this coordinator's students
            $stmt = $db->prepare("
                SELECT COUNT(*) as pending 
                FROM activities a
                JOIN students s ON a.prn = s.prn
                WHERE a.status = 'Pending' AND s.dept = :department AND s.year = :year
            ");
            $stmt->bindParam(':department', $department);
            $stmt->bindParam(':year', $year);
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
                    WHERE s.dept = :department AND s.year = :year
                    GROUP BY s.prn, a.category, pr.total_points
                ) as category_stats
                LEFT JOIN programme_rules pr ON 1=1
                WHERE category IS NOT NULL
                GROUP BY category
            ");
            $stmt->bindParam(':department', $department);
            $stmt->bindParam(':year', $year);
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
                WHERE a.status = 'Pending' AND s.dept = :department AND s.year = :year
                ORDER BY a.submitted_at DESC
                LIMIT 10
            ");
            $stmt->bindParam(':department', $department);
            $stmt->bindParam(':year', $year);
            $stmt->execute();
            $pendingSubmissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'coordinator' => $coordinator,
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

    if ($action == 'get_student_certificates') {
        try {
            $prn = $_GET['prn'] ?? '';
            
            // Get student information
            $stmt = $db->prepare("SELECT * FROM students WHERE prn = :prn");
            $stmt->bindParam(':prn', $prn);
            $stmt->execute();
            $student_info = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get all student activities with certificates
            $stmt = $db->prepare("
                SELECT a.*, am.activity_name as activity_type
                FROM activities a
                LEFT JOIN activities_master am ON a.activity_type = am.id
                WHERE a.prn = :prn
                ORDER BY a.submitted_at DESC
            ");
            $stmt->bindParam(':prn', $prn);
            $stmt->execute();
            $certificates = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'certificates' => $certificates,
                'student_info' => $student_info
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }
    if ($action == 'pending_submissions') {
        try {
            // Get coordinator information
            $stmt = $db->prepare("SELECT * FROM coordinators WHERE id = :coordinator_id");
            $stmt->bindParam(':coordinator_id', $coordinator_id);
            $stmt->execute();
            $coordinator = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$coordinator) {
                echo json_encode(['success' => false, 'message' => 'Coordinator not found']);
                exit;
            }
            
            $department = $coordinator['department'];
            $year = $coordinator['year'];

            $stmt = $db->prepare("
                SELECT a.*, s.first_name, s.last_name, 
                       CONCAT(s.first_name, ' ', s.last_name) as student_name,
                       am.activity_name as activity_type
                FROM activities a
                JOIN students s ON a.prn = s.prn
                LEFT JOIN activities_master am ON a.activity_type = am.id
                WHERE a.status = 'Pending' AND s.dept = :department AND s.year = :year
                ORDER BY a.submitted_at DESC
            ");
            $stmt->bindParam(':department', $department);
            $stmt->bindParam(':year', $year);
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