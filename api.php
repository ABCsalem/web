<?php
// تأكد من عدم وجود أي مسافات أو أحرف قبل هذا السطر
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$usersFile = __DIR__ . '/users.json';

function readUsers($file) {
    if (!file_exists($file)) {
        $default = ['admin' => ['password' => 'admin123', 'isAdmin' => true, 'quotas' => ['officers' => 20, 'soldiers' => 50, 'employees' => 10]]];
        file_put_contents($file, json_encode($default, JSON_PRETTY_PRINT));
        return $default;
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    if ($data === null) {
        $default = ['admin' => ['password' => 'admin123', 'isAdmin' => true, 'quotas' => ['officers' => 20, 'soldiers' => 50, 'employees' => 10]]];
        file_put_contents($file, json_encode($default, JSON_PRETTY_PRINT));
        return $default;
    }
    return $data;
}

function writeUsers($file, $users) {
    file_put_contents($file, json_encode($users, JSON_PRETTY_PRINT));
}

$action = $_GET['action'] ?? '';

if ($action === 'get') {
    try {
        $users = readUsers($usersFile);
        echo json_encode($users);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

try {
    $users = readUsers($usersFile);
    
    if ($action === 'add') {
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        $quotas = $input['quotas'] ?? ['officers' => 0, 'soldiers' => 0, 'employees' => 0];
        $isAdmin = $input['isAdmin'] ?? false;
        
        if (!$username || !$password) throw new Exception('اسم المستخدم وكلمة المرور مطلوبان');
        if (isset($users[$username])) throw new Exception('المستخدم موجود بالفعل');
        
        $users[$username] = ['password' => $password, 'isAdmin' => $isAdmin, 'quotas' => $quotas];
        writeUsers($usersFile, $users);
        echo json_encode(['success' => true]);
        exit;
    }
    
    if ($action === 'update') {
        $username = $input['username'] ?? '';
        $quotas = $input['quotas'] ?? [];
        if (!$username) throw new Exception('اسم المستخدم مطلوب');
        if (!isset($users[$username])) throw new Exception('المستخدم غير موجود');
        $users[$username]['quotas'] = $quotas;
        writeUsers($usersFile, $users);
        echo json_encode(['success' => true]);
        exit;
    }
    
    if ($action === 'delete') {
        $username = $input['username'] ?? '';
        if ($username === 'admin') throw new Exception('لا يمكن حذف المدير الرئيسي');
        if (!isset($users[$username])) throw new Exception('المستخدم غير موجود');
        unset($users[$username]);
        writeUsers($usersFile, $users);
        echo json_encode(['success' => true]);
        exit;
    }
    
    throw new Exception('إجراء غير معروف');
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>