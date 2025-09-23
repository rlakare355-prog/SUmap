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

$data = json_decode(file_get_contents("php://input"));

if ($data->action == 'login') {
    $userType = $data->userType;
    $username = $data->username;
    $password = $data->password;

    try {
        switch ($userType) {
            case 'student':
                $query = "SELECT * FROM students WHERE prn = :username";
                break;
            case 'coordinator':
                $query = "SELECT * FROM coordinators WHERE id = :username";
                break;
            case 'hod':
                $query = "SELECT * FROM hods WHERE id = :username";
                break;
            case 'admin':
                $query = "SELECT * FROM admins WHERE id = :username";
                break;
            default:
                echo json_encode(['success' => false, 'message' => 'Invalid user type']);
                exit;
        }

        $stmt = $db->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Verify password (assuming plain text for now, should use password_hash in production)
            if ($user['password'] === $password) {
                unset($user['password']); // Remove password from response
                echo json_encode([
                    'success' => true,
                    'user' => $user,
                    'message' => 'Login successful'
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
?>