<?php
// brands.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

require_once 'middleware.php';
if ($method !== 'GET') {
    verifyAdminToken();
}

if ($method === 'POST' && isset($_GET['_method'])) {
    $method = strtoupper($_GET['_method']);
}

// Helper: ensure brand uploads directory exists
function ensureBrandUploadsDir() {
    $uploadDir = rtrim(getUploadsPath(), '/\\') . '/brands/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    return $uploadDir;
}

// Helper: save base64 image to file
function saveBrandBase64Image($base64String) {
    if (empty($base64String) || strpos($base64String, 'data:image') !== 0) {
        return $base64String;
    }
    $uploadDir = ensureBrandUploadsDir();
    preg_match('/data:image\/(\w+);base64,/', $base64String, $matches);
    $ext = isset($matches[1]) ? $matches[1] : 'png';
    $fileName = time() . '_brand_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $data = preg_replace('/^data:image\/\w+;base64,/', '', $base64String);
    $data = base64_decode($data);
    if ($data === false) return '';
    file_put_contents($uploadDir . $fileName, $data);
    return '/uploads/brands/' . $fileName;
}

// Helper: handle brand image from either file upload or existing path
function handleBrandImage() {
    $imagePath = '';
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = ensureBrandUploadsDir();
        $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
        $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        if (!in_array($ext, $allowedExts)) $ext = 'png';
        $fileName = time() . '_brand_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $targetPath = $uploadDir . $fileName;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
            $imagePath = '/uploads/brands/' . $fileName;
        }
    } elseif (isset($_POST['existingImage']) && !empty($_POST['existingImage'])) {
        $imagePath = $_POST['existingImage'];
    }
    return $imagePath;
}

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM brands ORDER BY id ASC");
        $brands = $stmt->fetchAll();
        echo json_encode($brands);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to fetch brands", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true);
        $name = $input['name'] ?? '';
        $slug = $input['slug'] ?? '';
        $image = saveBrandBase64Image($input['image'] ?? '');
    } else {
        // FormData
        $name = $_POST['name'] ?? '';
        $slug = $_POST['slug'] ?? '';
        $image = handleBrandImage();
    }
    
    if (empty($name) || empty($slug)) {
        http_response_code(400);
        echo json_encode(["error" => "Name and slug are required"]);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO brands (name, slug, image) VALUES (?, ?, ?)");
        $stmt->execute([$name, $slug, $image]);
        
        $id = $pdo->lastInsertId();
        echo json_encode(["message" => "Brand created successfully", "id" => $id, "image" => $image]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to create brand", "message" => $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
        $name = $input['name'] ?? null;
        $slug = $input['slug'] ?? null;
        $image = isset($input['image']) ? saveBrandBase64Image($input['image']) : null;
    } else {
        // FormData
        $id = $_POST['id'] ?? null;
        $name = $_POST['name'] ?? null;
        $slug = $_POST['slug'] ?? null;
        $image = handleBrandImage();
        if (empty($image)) $image = null; // Don't update image if none provided
    }
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID is required"]);
        exit;
    }
    
    try {
        $sql = "UPDATE brands SET ";
        $params = [];
        $updates = [];
        
        if ($name !== null) { $updates[] = "name = ?"; $params[] = $name; }
        if ($slug !== null) { $updates[] = "slug = ?"; $params[] = $slug; }
        if ($image !== null) { $updates[] = "image = ?"; $params[] = $image; }
        
        if (empty($updates)) {
            echo json_encode(["message" => "No fields to update"]);
            exit;
        }
        
        $sql .= implode(", ", $updates) . " WHERE id = ?";
        $params[] = $id;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(["message" => "Brand updated successfully", "image" => $image]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update brand", "message" => $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID is required"]);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM brands WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["message" => "Brand deleted successfully"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to delete brand", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
?>
