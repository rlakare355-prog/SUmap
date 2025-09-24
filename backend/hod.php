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
$hod_id = $_GET['id'] ?? '';

if ($action == 'dashboard') {
    try {
        // Get HoD information to determine department
        $stmt = $db->prepare("SELECT * FROM hods WHERE id = :hod_id");
        $stmt->bindParam(':hod_id', $hod_id);
        $stmt->execute();
        $hod = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$hod) {
            echo json_encode(['success' => false, 'message' => 'HoD not found']);
            exit;
        }
        
        $department = $hod['department'];
        
        // Get department statistics
        $stmt = $db->prepare("
            SELECT 
                COUNT(DISTINCT s.prn) as total_students,
                AVG(CASE WHEN pr.total_points > 0 THEN (earned_points / pr.total_points) * 100 ELSE 0 END) as compliance_rate,
                SUM(CASE WHEN (earned_points / pr.total_points) * 100 < 50 THEN 1 ELSE 0 END) as at_risk_students,
                SUM(earned_points) as total_points
            FROM students s
            LEFT JOIN programme_rules pr ON s.admission_year = pr.admission_year AND s.programme = pr.programme
            LEFT JOIN (
                SELECT prn, SUM(CASE WHEN status = 'Approved' THEN points ELSE 0 END) as earned_points
                FROM activities
                GROUP BY prn
            ) a ON s.prn = a.prn
            WHERE s.dept = :department
        ");
        $stmt->bindParam(':department', $department);
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        // Get class-wise data
        $stmt = $db->prepare("
            SELECT 
                CONCAT(s.programme, ' - Year ', s.year) as class,
                s.programme as program,
                s.year,
                COUNT(s.prn) as total_students,
                SUM(CASE WHEN (COALESCE(a.earned_points, 0) / pr.total_points) * 100 >= 100 THEN 1 ELSE 0 END) as compliant,
                SUM(CASE WHEN (COALESCE(a.earned_points, 0) / pr.total_points) * 100 BETWEEN 50 AND 99 THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN (COALESCE(a.earned_points, 0) / pr.total_points) * 100 < 50 THEN 1 ELSE 0 END) as at_risk,
                AVG(CASE WHEN pr.total_points > 0 THEN (COALESCE(a.earned_points, 0) / pr.total_points) * 100 ELSE 0 END) as compliance_rate
            FROM students s
            LEFT JOIN programme_rules pr ON s.admission_year = pr.admission_year AND s.programme = pr.programme
            LEFT JOIN (
                SELECT prn, SUM(CASE WHEN status = 'Approved' THEN points ELSE 0 END) as earned_points
                FROM activities
                GROUP BY prn
            ) a ON s.prn = a.prn
            WHERE s.dept = :department
            GROUP BY s.programme, s.year, pr.total_points
            ORDER BY s.programme, s.year
        ");
        $stmt->bindParam(':department', $department);
        $stmt->execute();
        $classData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get compliance distribution for pie chart
        $compliantCount = 0;
        $inProgressCount = 0;
        $atRiskCount = 0;

        foreach ($classData as $class) {
            $compliantCount += $class['compliant'];
            $inProgressCount += $class['in_progress'];
            $atRiskCount += $class['at_risk'];
        }

        $complianceData = [
            ['name' => 'Compliant', 'value' => $compliantCount],
            ['name' => 'In Progress', 'value' => $inProgressCount],
            ['name' => 'At Risk', 'value' => $atRiskCount]
        ];

        echo json_encode([
            'success' => true,
            'hod' => $hod,
            'stats' => $stats,
            'classData' => $classData,
            'complianceData' => $complianceData
        ]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage(), 'debug' => $e->getTraceAsString()]);
    }
}

if ($action == 'download_report') {
    // This would generate a PDF report - for now return success
    echo json_encode(['success' => true, 'message' => 'Report generation not implemented yet']);
}
?>