<?php
// db.php
// Force no caching on all API responses
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");
header("Content-Type: application/json");

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost'; // Usually localhost on shared hosting
$db_name = 'u941234394_db_kamalOptiks'; // Replace with actual database name
$username = 'u941234394_userKamal'; // Replace with actual database user
$password = 'Moizkonceptnext998'; // Replace with actual database password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    // Set PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Fetch data as associative array by default
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed", "message" => $e->getMessage()]);
    exit();
}
function getUploadsPath() {
    $dir = __DIR__;
    if (strpos($dir, 'public_html') !== false) {
        // If on Hostinger, store outside public_html to prevent wiping on deploy
        $parts = explode('public_html', $dir);
        $path = rtrim($parts[0], '/\\') . '/uploads/';
    } else {
        // Local environment
        $path = __DIR__ . '/../uploads/';
    }
    
    if (!is_dir($path)) {
        mkdir($path, 0755, true);
    }
    return $path;
}

?>
