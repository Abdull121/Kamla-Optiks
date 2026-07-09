<?php
require_once 'db.php';

$file = $_GET['file'] ?? '';

// Basic security check to prevent directory traversal
if (empty($file) || strpos($file, '..') !== false || strpos($file, '/') !== false || strpos($file, '\\') !== false) {
    http_response_code(400);
    exit("Invalid file request.");
}

$type = $_GET['type'] ?? ''; // 'products', 'categories', or 'brands'
$uploadPath = rtrim(getUploadsPath(), '/\\');

if ($type === 'categories') {
    $path = $uploadPath . '/categories/' . $file;
} else if ($type === 'brands') {
    $path = $uploadPath . '/brands/' . $file;
} else {
    // Default to products
    $path = $uploadPath . '/' . $file;
}

if (!file_exists($path)) {
    http_response_code(404);
    exit("File not found.");
}

$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
$mime_types = [
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png'  => 'image/png',
    'gif'  => 'image/gif',
    'webp' => 'image/webp',
    'svg'  => 'image/svg+xml',
];

$content_type = $mime_types[$ext] ?? 'application/octet-stream';

header('Content-Type: ' . $content_type);
header('Content-Length: ' . filesize($path));
header('Cache-Control: public, max-age=31536000'); // Cache for 1 year
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');

readfile($path);
exit;
