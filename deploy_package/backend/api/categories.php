<?php
// categories.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_GET['_method'])) {
    $method = strtoupper($_GET['_method']);
}

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM categories ORDER BY id ASC");
        $categories = $stmt->fetchAll();
        echo json_encode($categories);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to fetch categories", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if it's a multipart form data (with image file) or json
    $name = $_POST['name'] ?? $input['name'] ?? '';
    $slug = $_POST['slug'] ?? $input['slug'] ?? '';
    $image = $input['image'] ?? '';
    
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/categories/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $fileName = time() . '_' . basename($_FILES['image']['name']);
        $targetPath = $uploadDir . $fileName;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
            $image = '/backend/uploads/categories/' . $fileName;
        }
    }
    
    if (empty($name) || empty($slug)) {
        http_response_code(400);
        echo json_encode(["error" => "Name and slug are required"]);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO categories (name, slug, image) VALUES (?, ?, ?)");
        $stmt->execute([$name, $slug, $image]);
        
        $id = $pdo->lastInsertId();
        echo json_encode(["message" => "Category created successfully", "id" => $id]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to create category", "message" => $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $id = $input['id'] ?? null;
    $name = $input['name'] ?? null;
    $slug = $input['slug'] ?? null;
    $image = $input['image'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID is required"]);
        exit;
    }
    
    try {
        $sql = "UPDATE categories SET ";
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
        
        echo json_encode(["message" => "Category updated successfully"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update category", "message" => $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID is required"]);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["message" => "Category deleted successfully"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to delete category", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
?>
