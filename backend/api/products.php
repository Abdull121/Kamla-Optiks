<?php
// products.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_GET['_method'])) {
    $method = strtoupper($_GET['_method']);
}

// Helper: ensure uploads directory exists
function ensureUploadsDir() {
    $uploadDir = rtrim(getUploadsPath(), '/\\') . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    return $uploadDir;
}

// Helper: save base64 image string to file, return public path
function saveBase64Image($base64String) {
    if (empty($base64String) || strpos($base64String, 'data:image') !== 0) {
        return $base64String; // Not base64, return as-is (could be a path)
    }
    $uploadDir = ensureUploadsDir();
    // Extract extension from data URI
    preg_match('/data:image\/(\w+);base64,/', $base64String, $matches);
    $ext = isset($matches[1]) ? $matches[1] : 'png';
    $fileName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $data = preg_replace('/^data:image\/\w+;base64,/', '', $base64String);
    $data = base64_decode($data);
    if ($data === false) return '';
    file_put_contents($uploadDir . $fileName, $data);
    return '/uploads/' . $fileName;
}

if ($method === 'GET') {
    // Fetch all products
    try {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
        $products = $stmt->fetchAll();
        
        foreach ($products as &$product) {
            $product['price'] = (float) $product['price'];
            $product['discountPrice'] = $product['discount_price'] !== null ? (float) $product['discount_price'] : null;
            $product['stockQuantity'] = (int) $product['stock_quantity'];
            $product['deliveryCharges'] = (float) $product['delivery_charges'];
            $product['inStock'] = (bool) $product['in_stock'];
            $product['isTrending'] = isset($product['is_trending']) ? (bool) $product['is_trending'] : false;
            $product['rating'] = (float) $product['rating'];
            $product['reviewsCount'] = (int) $product['reviews_count'];
            $product['categoryId'] = $product['category_id'];
            $product['brandId'] = $product['brand_id'];
            $product['colors'] = isset($product['colors']) && $product['colors'] ? json_decode($product['colors'], true) : [];
            $product['sizes'] = isset($product['sizes']) && $product['sizes'] ? json_decode($product['sizes'], true) : [];
            $product['images'] = isset($product['images']) && $product['images'] ? json_decode($product['images'], true) : [];
        }
        
        echo json_encode($products);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to fetch products", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Handle both FormData (file upload) and JSON payloads
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if (strpos($contentType, 'application/json') !== false) {
        // JSON payload â€” convert any base64 images to files
        $data = json_decode(file_get_contents('php://input'), true);
        
        $name = $data['name'] ?? '';
    $sku = $data['sku'] ?? '';
    $category_id = $data['categoryId'] ?? '';
    $brand_id = $data['brandId'] ?? '';
    $price = $data['price'] ?? 0;
    $discount_price = isset($data['discountPrice']) && $data['discountPrice'] !== '' ? $data['discountPrice'] : null;
    $stock_quantity = $data['stockQuantity'] ?? 0;
    $delivery_charges = $data['deliveryCharges'] ?? 250;
    $description = $data['description'] ?? '';
    $color = $data['color'] ?? '';
    $colors = $data['colors'] ?? '[]';
    $sizes = $data['sizes'] ?? '[]';
    $imagesJson = $data['images'] ?? '[]';
    
    $in_stock = ($stock_quantity > 0) ? 1 : 0;
    $is_trending = isset($data['isTrending']) && ($data['isTrending'] === 'true' || $data['isTrending'] == 1 || $data['isTrending'] === true) ? 1 : 0;
    
    try {
        $stmt = $pdo->prepare("UPDATE products SET name=?, sku=?, category_id=?, brand_id=?, price=?, discount_price=?, stock_quantity=?, delivery_charges=?, description=?, color=?, colors=?, sizes=?, image=?, images=?, in_stock=?, is_trending=? WHERE id=?");
        $stmt->execute([$name, $sku, $category_id, $brand_id, $price, $discount_price, $stock_quantity, $delivery_charges, $description, $color, $colors, $sizes, $image, $imagesJson, $in_stock, $is_trending, $id]);
        
        // Ensure image paths are returned for the frontend
        echo json_encode(["success" => true, "image" => $image, "images" => json_decode($imagesJson, true)]);
    } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to insert product", "message" => $e->getMessage()]);
        }
    } else {
        
        // FormData (multipart) â€” real file upload
        $name = $_POST['name'] ?? '';
        $sku = $_POST['sku'] ?? '';
        $category_id = $_POST['categoryId'] ?? '';
        $brand_id = $_POST['brandId'] ?? '';
        $price = $_POST['price'] ?? 0;
        $discount_price = isset($_POST['discountPrice']) && $_POST['discountPrice'] !== '' ? $_POST['discountPrice'] : null;
        $stock_quantity = $_POST['stockQuantity'] ?? 0;
        $delivery_charges = $_POST['deliveryCharges'] ?? 250;
        $description = $_POST['description'] ?? '';
        $color = $_POST['color'] ?? '';
        $colors = $_POST['colors'] ?? '[]';
        $sizes = $_POST['sizes'] ?? '[]';
        
        $in_stock = ($stock_quantity > 0) ? 1 : 0;
        $is_trending = isset($_POST['isTrending']) && ($_POST['isTrending'] === 'true' || $_POST['isTrending'] == 1) ? 1 : 0;
        
        // Handle single image upload (legacy)
        $imagePath = '';
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = ensureUploadsDir();
            $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
            $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
            if (!in_array($ext, $allowedExts)) $ext = 'png';
            $fileName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $targetPath = $uploadDir . $fileName;
            
            if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                $imagePath = '/uploads/' . $fileName;
            }
        } elseif (isset($_POST['existingImage']) && !empty($_POST['existingImage'])) {
            $imagePath = $_POST['existingImage'];
        }

        // Handle multiple images upload
        $existingImages = isset($_POST['existingImages']) ? json_decode($_POST['existingImages'], true) : [];
        if (!is_array($existingImages)) $existingImages = [];
        
        $imagesPaths = $existingImages;
        if (isset($_FILES['images'])) {
            $uploadDir = ensureUploadsDir();
            foreach ($_FILES['images']['tmp_name'] as $key => $tmp_name) {
                if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {
                    $ext = strtolower(pathinfo($_FILES['images']['name'][$key], PATHINFO_EXTENSION));
                    $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                    if (!in_array($ext, $allowedExts)) $ext = 'png';
                    $fileName = time() . '_' . bin2hex(random_bytes(4)) . '_' . $key . '.' . $ext;
                    $targetPath = $uploadDir . $fileName;
                    if (move_uploaded_file($tmp_name, $targetPath)) {
                        $imagesPaths[] = '/uploads/' . $fileName;
                    }
                }
            }
        }
        $imagesJson = json_encode($imagesPaths);
        // Also sync legacy image if empty
        if (empty($imagePath) && count($imagesPaths) > 0) {
            $imagePath = $imagesPaths[0];
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO products (name, sku, category_id, brand_id, price, discount_price, stock_quantity, delivery_charges, description, color, colors, sizes, image, images, in_stock, is_trending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $sku, $category_id, $brand_id, $price, $discount_price, $stock_quantity, $delivery_charges, $description, $color, $colors, $sizes, $imagePath, $imagesJson, $in_stock, $is_trending]);
            
            echo json_encode(["success" => true, "id" => $pdo->lastInsertId(), "image" => $imagePath, "images" => $imagesPaths]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to insert product", "message" => $e->getMessage()]);
        }
    }
} elseif ($method === 'PUT') {
    // Update product â€” handle both JSON and FormData
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;
        $image = $data['image'] ?? '';
        $image = saveBase64Image($image);
    } else {
        // FormData
        $id = $_POST['id'] ?? null;
        $data = $_POST;
        
        // Handle file upload for update
        $image = '';
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = ensureUploadsDir();
            $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
            $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
            if (!in_array($ext, $allowedExts)) $ext = 'png';
            $fileName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $targetPath = $uploadDir . $fileName;
            if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                $image = '/uploads/' . $fileName;
            }
        } elseif (isset($_POST['existingImage']) && !empty($_POST['existingImage'])) {
            $image = $_POST['existingImage'];
        }
    }
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Product ID required"]);
        exit;
    }
    
    $name = $data['name'] ?? '';
    $sku = $data['sku'] ?? '';
    $category_id = $data['categoryId'] ?? '';
    $brand_id = $data['brandId'] ?? '';
    $price = $data['price'] ?? 0;
    $discount_price = isset($data['discountPrice']) && $data['discountPrice'] !== '' ? $data['discountPrice'] : null;
    $stock_quantity = $data['stockQuantity'] ?? 0;
    $delivery_charges = $data['deliveryCharges'] ?? 250;
    $description = $data['description'] ?? '';
        $color = $data['color'] ?? '';
    $in_stock = ($stock_quantity > 0) ? 1 : 0;
    $is_trending = isset($data['isTrending']) && ($data['isTrending'] === 'true' || $data['isTrending'] == 1 || $data['isTrending'] === true) ? 1 : 0;
    
    try {
        $stmt = $pdo->prepare("UPDATE products SET name=?, sku=?, category_id=?, brand_id=?, price=?, discount_price=?, stock_quantity=?, delivery_charges=?, description=?, image=?, in_stock=?, is_trending=? WHERE id=?");
        $stmt->execute([$name, $sku, $category_id, $brand_id, $price, $discount_price, $stock_quantity, $delivery_charges, $description, $image, $in_stock, $is_trending, $id]);
        
        echo json_encode(["success" => true, "image" => $image]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update product", "message" => $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        try {
            // First delete associated order items to prevent foreign key constraint failures
            $stmtItems = $pdo->prepare("DELETE FROM order_items WHERE product_id=?");
            $stmtItems->execute([$id]);
            
            // Then delete the product
            $stmt = $pdo->prepare("DELETE FROM products WHERE id=?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to delete product", "message" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Product ID required"]);
    }
}
?>
