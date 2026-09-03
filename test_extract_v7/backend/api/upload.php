<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['image'])) {
        http_response_code(400);
        exit(json_encode(['error' => 'No image provided']));
    }
    
    $base64String = $data['image'];
    
    if (empty($base64String) || strpos($base64String, 'data:') !== 0) {
        http_response_code(400);
        exit(json_encode(['error' => 'Invalid image format']));
    }
    
    $uploadDir = rtrim(getUploadsPath(), '/\\') . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    preg_match('/data:image\/([a-zA-Z0-9\+\-\.]+);base64,/', $base64String, $matches);
    $ext = isset($matches[1]) ? str_replace('+', '', $matches[1]) : 'png';
    if (strpos($ext, 'svg') !== false) $ext = 'svg';
    if ($ext === 'jpeg') $ext = 'jpg';
    
    $fileName = 'rx_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    
    $parts = explode(',', $base64String);
    if (count($parts) < 2) {
        http_response_code(400);
        exit(json_encode(['error' => 'Invalid image data']));
    }
    
    $fileData = base64_decode($parts[1]);
    if ($fileData === false) {
        http_response_code(400);
        exit(json_encode(['error' => 'Failed to decode image']));
    }
    
    file_put_contents($uploadDir . $fileName, $fileData);
    
    echo json_encode(['success' => true, 'path' => $fileName]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
