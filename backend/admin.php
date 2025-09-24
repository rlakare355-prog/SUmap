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

    if ($action == 'dashboard') {
        try {
            // Get system-wide statistics
            $stmt = $db->prepare("
                SELECT 
                    COUNT(DISTINCT s.prn) as total_students,
                    COUNT(DISTINCT a.id) as total_activities,
                    AVG(CASE WHEN pr.total_points > 0 THEN (earned_points / pr.total_points) * 100 ELSE 0 END) as system_compliance,
                    COUNT(DISTINCT pr.programme) as active_programs
                FROM students s
                LEFT JOIN programme_rules pr ON s.admission_year = pr.admission_year AND s.programme = pr.programme
                LEFT JOIN (
                    SELECT prn, SUM(CASE WHEN status = 'Approved' THEN points ELSE 0 END) as earned_points
                    FROM activities
                    GROUP BY prn
                ) earned ON s.prn = earned.prn
                LEFT JOIN activities a ON s.prn = a.prn AND a.status = 'Approved'
            ");
            $stmt->execute();
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Get program-wise data
            $stmt = $db->prepare("
                SELECT 
                    pr.programme as program,
                    COUNT(DISTINCT s.prn) as total_students,
                    COUNT(DISTINCT CASE WHEN pr.total_points > 0 AND (COALESCE(earned.earned_points, 0) / pr.total_points) >= 1 THEN s.prn END) as eligible_students,
                    AVG(CASE WHEN pr.total_points > 0 THEN (COALESCE(earned.earned_points, 0) / pr.total_points) * 100 ELSE 0 END) as compliance_rate,
                    COUNT(DISTINCT a.id) as total_activities
                FROM programme_rules pr
                LEFT JOIN students s ON pr.admission_year = s.admission_year AND pr.programme = s.programme
                LEFT JOIN (
                    SELECT prn, SUM(CASE WHEN status = 'Approved' THEN points ELSE 0 END) as earned_points
                    FROM activities
                    GROUP BY prn
                ) earned ON s.prn = earned.prn
                LEFT JOIN activities a ON s.prn = a.prn AND a.status = 'Approved'
                GROUP BY pr.programme, pr.total_points
                ORDER BY pr.programme
            ");
            $stmt->execute();
            $programData = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get activity trends (mock data for now)
            $activityTrends = [
                ['month' => 'Jan', 'submissions' => 45, 'approvals' => 38],
                ['month' => 'Feb', 'submissions' => 52, 'approvals' => 45],
                ['month' => 'Mar', 'submissions' => 48, 'approvals' => 42],
                ['month' => 'Apr', 'submissions' => 61, 'approvals' => 55],
                ['month' => 'May', 'submissions' => 55, 'approvals' => 48],
                ['month' => 'Jun', 'submissions' => 67, 'approvals' => 58]
            ];

            echo json_encode([
                'success' => true,
                'stats' => $stats,
                'programData' => $programData,
                'activityTrends' => $activityTrends
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage(), 'debug' => $e->getTraceAsString()]);
        }
    }

    if ($action == 'get_users') {
        $type = $_GET['type'] ?? 'student';
        
        try {
            switch ($type) {
                case 'student':
                    $stmt = $db->prepare("SELECT * FROM students ORDER BY first_name, last_name");
                    break;
                case 'coordinator':
                    $stmt = $db->prepare("SELECT * FROM coordinators ORDER BY department, year, name");
                    break;
                case 'hod':
                    $stmt = $db->prepare("SELECT * FROM hods ORDER BY department, name");
                    break;
                case 'admin':
                    $stmt = $db->prepare("SELECT * FROM admins ORDER BY name");
                    break;
                default:
                    throw new Exception('Invalid user type');
            }

            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'users' => $users
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage(), 'debug' => $e->getTraceAsString()]);
        }
    }

    if ($action == 'get_program_rules') {
        try {
            $stmt = $db->prepare("SELECT * FROM programme_rules ORDER BY admission_year DESC, programme");
            $stmt->execute();
            $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'programs' => $programs
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

    if ($action == 'get_activities') {
        $category = $_GET['category'] ?? '';
        
        try {
            $stmt = $db->prepare("
                SELECT am.*, 
                       GROUP_CONCAT(CONCAT(al.level, ':', al.points) SEPARATOR '|') as levels_data
                FROM activities_master am
                LEFT JOIN activity_levels al ON am.id = al.activity_id
                WHERE am.category_id = :category
                GROUP BY am.id
                ORDER BY am.activity_name
            ");
            $stmt->bindParam(':category', $category);
            $stmt->execute();
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Process levels data
            foreach ($activities as &$activity) {
                if ($activity['levels_data']) {
                    $levels = [];
                    $levelPairs = explode('|', $activity['levels_data']);
                    foreach ($levelPairs as $pair) {
                        list($level, $points) = explode(':', $pair);
                        $levels[] = ['level' => $level, 'points' => (int)$points];
                    }
                    $activity['levels'] = $levels;
                } else {
                    $activity['levels'] = [];
                }
                unset($activity['levels_data']);
            }

            echo json_encode([
                'success' => true,
                'activities' => $activities
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }
}

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if ($data->action == 'create_user' || $data->action == 'update_user') {
        try {
            $user_type = $data->user_type;
            $isUpdate = ($data->action == 'update_user');

            switch ($user_type) {
                case 'student':
                    if ($isUpdate) {
                        $stmt = $db->prepare("
                            UPDATE students 
                            SET first_name = :first_name, middle_name = :middle_name, last_name = :last_name,
                                dept = :dept, year = :year, programme = :programme, 
                                course_duration = :course_duration, admission_year = :admission_year
                            WHERE prn = :prn
                        ");
                        $stmt->bindParam(':prn', $data->prn);
                    } else {
                        $stmt = $db->prepare("
                            INSERT INTO students (prn, first_name, middle_name, last_name, dept, year, programme, course_duration, admission_year, password)
                            VALUES (:prn, :first_name, :middle_name, :last_name, :dept, :year, :programme, :course_duration, :admission_year, :password)
                        ");
                        $stmt->bindParam(':prn', $data->prn);
                        $stmt->bindParam(':password', $data->password);
                    }
                    
                    $stmt->bindParam(':first_name', $data->first_name);
                    $stmt->bindParam(':middle_name', $data->middle_name);
                    $stmt->bindParam(':last_name', $data->last_name);
                    $stmt->bindParam(':dept', $data->dept);
                    $stmt->bindParam(':year', $data->year);
                    $stmt->bindParam(':programme', $data->programme);
                    $stmt->bindParam(':course_duration', $data->course_duration);
                    $stmt->bindParam(':admission_year', $data->admission_year);
                    break;

                default:
                    $table = $user_type . 's';
                    if ($isUpdate) {
                        if ($user_type === 'coordinator') {
                            $stmt = $db->prepare("UPDATE $table SET name = :name, department = :department, year = :year WHERE id = :id");
                            $stmt->bindParam(':department', $data->department);
                            $stmt->bindParam(':year', $data->year);
                        } elseif ($user_type === 'hod') {
                            $stmt = $db->prepare("UPDATE $table SET name = :name, department = :department WHERE id = :id");
                            $stmt->bindParam(':department', $data->department);
                        } else {
                            $stmt = $db->prepare("UPDATE $table SET name = :name WHERE id = :id");
                        }
                        $stmt->bindParam(':id', $data->user_id);
                    } else {
                        if ($user_type === 'coordinator') {
                            $stmt = $db->prepare("INSERT INTO $table (name, department, year, password) VALUES (:name, :department, :year, :password)");
                            $stmt->bindParam(':department', $data->department);
                            $stmt->bindParam(':year', $data->year);
                        } elseif ($user_type === 'hod') {
                            $stmt = $db->prepare("INSERT INTO $table (name, department, password) VALUES (:name, :department, :password)");
                            $stmt->bindParam(':department', $data->department);
                        } else {
                            $stmt = $db->prepare("INSERT INTO $table (name, password) VALUES (:name, :password)");
                        }
                        $stmt->bindParam(':password', $data->password);
                    }
                    $stmt->bindParam(':name', $data->name);
                    break;
            }

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'User saved successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to save user']);
            }

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

    if ($data->action == 'create_program_rule' || $data->action == 'update_program_rule') {
        try {
            $isUpdate = ($data->action == 'update_program_rule');

            if ($isUpdate) {
                $stmt = $db->prepare("
                    UPDATE programme_rules 
                    SET admission_year = :admission_year, programme = :programme, duration = :duration,
                        technical = :technical, sports_cultural = :sports_cultural, 
                        community_outreach = :community_outreach, innovation = :innovation, 
                        leadership = :leadership, total_points = :total_points
                    WHERE id = :id
                ");
                $stmt->bindParam(':id', $data->program_id);
            } else {
                $stmt = $db->prepare("
                    INSERT INTO programme_rules (admission_year, programme, duration, technical, sports_cultural, community_outreach, innovation, leadership, total_points)
                    VALUES (:admission_year, :programme, :duration, :technical, :sports_cultural, :community_outreach, :innovation, :leadership, :total_points)
                ");
            }

            $stmt->bindParam(':admission_year', $data->admission_year);
            $stmt->bindParam(':programme', $data->programme);
            $stmt->bindParam(':duration', $data->duration);
            $stmt->bindParam(':technical', $data->technical);
            $stmt->bindParam(':sports_cultural', $data->sports_cultural);
            $stmt->bindParam(':community_outreach', $data->community_outreach);
            $stmt->bindParam(':innovation', $data->innovation);
            $stmt->bindParam(':leadership', $data->leadership);
            $stmt->bindParam(':total_points', $data->total_points);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Program rule saved successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to save program rule']);
            }

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

    if ($data->action == 'create_activity' || $data->action == 'update_activity') {
        try {
            $isUpdate = ($data->action == 'update_activity');

            if ($isUpdate) {
                $stmt = $db->prepare("
                    UPDATE activities_master 
                    SET category_id = :category_id, activity_name = :activity_name, 
                        document_evidence = :document_evidence, points_type = :points_type,
                        min_points = :min_points, max_points = :max_points
                    WHERE id = :id
                ");
                $stmt->bindParam(':id', $data->activity_id);
                
                // Delete existing levels
                $deleteStmt = $db->prepare("DELETE FROM activity_levels WHERE activity_id = :activity_id");
                $deleteStmt->bindParam(':activity_id', $data->activity_id);
                $deleteStmt->execute();
            } else {
                $stmt = $db->prepare("
                    INSERT INTO activities_master (category_id, activity_name, document_evidence, points_type, min_points, max_points)
                    VALUES (:category_id, :activity_name, :document_evidence, :points_type, :min_points, :max_points)
                ");
            }

            $stmt->bindParam(':category_id', $data->category_id);
            $stmt->bindParam(':activity_name', $data->activity_name);
            $stmt->bindParam(':document_evidence', $data->document_evidence);
            $stmt->bindParam(':points_type', $data->points_type);
            $stmt->bindParam(':min_points', $data->min_points);
            $stmt->bindParam(':max_points', $data->max_points);

            if ($stmt->execute()) {
                $activity_id = $isUpdate ? $data->activity_id : $db->lastInsertId();

                // Insert levels if it's a level-based activity
                if ($data->points_type == 'Level' && !empty($data->levels)) {
                    $levelStmt = $db->prepare("INSERT INTO activity_levels (activity_id, level, points) VALUES (:activity_id, :level, :points)");
                    
                    foreach ($data->levels as $level) {
                        $levelStmt->bindParam(':activity_id', $activity_id);
                        $levelStmt->bindParam(':level', $level->level);
                        $levelStmt->bindParam(':points', $level->points);
                        $levelStmt->execute();
                    }
                }

                echo json_encode(['success' => true, 'message' => 'Activity saved successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to save activity']);
            }

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }
}
?>