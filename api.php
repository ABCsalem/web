<?php
// تفعيل عرض الأخطاء لمساعدتك في التشخيص
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// تحديد مسار ملف users.json (نفس المجلد)
$usersFile = __DIR__ . '/users.json';

// دالة قراءة المستخدمين
function readUsers($file) {
    if (!file_exists($file)) {
        // إذا لم يكن الملف موجوداً، أنشئه بالمستخدم الافتراضي
        $default = [
            'admin' => [
                'password' => 'admin123',
                'isAdmin' => true,
                'quotas' => ['officers' => 20, 'soldiers' => 50, 'employees' => 10]
            ]
        ];
        file_put_contents($file, json_encode($default, JSON_PRETTY_PRINT));
        return $default;
    }
    
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    
    // إذا كان الملف تالفاً، أعد إنشائه
    if ($data === null) {
        $default = [
            'admin' => [
                'password' => 'admin123',
                'isAdmin' => true,
                'quotas' => ['officers' => 20, 'soldiers' => 50, 'employees' => 10]
            ]
        ];
        file_put_contents($file, json_encode($default, JSON_PRETTY_PRINT));
        return $default;
    }
    
    return $data;
}

// دالة كتابة المستخدمين
function writeUsers($file, $users) {
    // تأكد من أن المجلد قابل للكتابة
    $dir = dirname($file);
    if (!is_writable($dir)) {
        throw new Exception('المجلد غير قابل للكتابة: ' . $dir);
    }
    file_put_contents($file, json_encode($users, JSON_PRETTY_PRINT));
}

// قراءة الإجراء (action)
$action = $_GET['action'] ?? '';

// ===== معالجة طلب GET (جلب المستخدمين) =====
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

// ===== معالجة طلب POST =====
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

try {
    $users = readUsers($usersFile);
    
    if ($action === 'add') {
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        $quotas = $input['quotas'] ?? ['officers' => 0, 'soldiers' => 0, 'employees' => 0];
        $isAdmin = $input['isAdmin'] ?? false;
        
        if (!$username || !$password) {
            throw new Exception('اسم المستخدم وكلمة المرور مطلوبان');
        }
        if (isset($users[$username])) {
            throw new Exception('المستخدم موجود بالفعل');
        }
        
        $users[$username] = [
            'password' => $password,
            'isAdmin' => $isAdmin,
            'quotas' => $quotas
        ];
        writeUsers($usersFile, $users);
        echo json_encode(['success' => true]);
        exit;
    }
    
    if ($action === 'update') {
        $username = $input['username'] ?? '';
        $quotas = $input['quotas'] ?? [];
        
        if (!$username) {
            throw new Exception('اسم المستخدم مطلوب');
        }
        if (!isset($users[$username])) {
            throw new Exception('المستخدم غير موجود');
        }
        
        $users[$username]['quotas'] = $quotas;
        writeUsers($usersFile, $users);
        echo json_encode(['success' => true]);
        exit;
    }
    
    if ($action === 'delete') {
        $username = $input['username'] ?? '';
        
        if ($username === 'admin') {
            throw new Exception('لا يمكن حذف المدير الرئيسي');
        }
        if (!isset($users[$username])) {
            throw new Exception('المستخدم غير موجود');
        }
        
        unset($users[$username]);
        writeUsers($usersFile, $users);
        echo json_encode(['success' => true]);
        exit;
    }
    
    // إذا لم يتم التعرف على الإجراء
    throw new Exception('إجراء غير معروف');
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}

// إذا وصلنا إلى هنا، فهذا يعني أن الطلب غير صحيح
http_response_code(400);
echo json_encode(['success' => false, 'error' => 'طلب غير صحيح']);
?>