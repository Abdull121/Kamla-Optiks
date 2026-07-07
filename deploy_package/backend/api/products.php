<?php
// products.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_GET['_method'])) {
    $method = strtoupper($_GET['_method']);
}

if ($method === 'GET') {
    // Fetch all products
    try {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
        $products = $stmt->fetchAll();
        
        // Convert string to proper types for JSON
        foreach ($products as &$product) {
            $product['price'] = (float) $product['price'];
            $product['discountPrice'] = $product['discount_price'] !== null ? (float) $product['discount_price'] : null;
            $product['stockQuantity'] = (int) $product['stock_quantity'];
            $product['deliveryCharges'] = (float) $product['delivery_charges'];
            $product['inStock'] = (bool) $product['in_stock'];
            $product['isTrending'] = (bool) $product['is_trending'];
            $product['rating'] = (float) $product['rating'];
            $product['reviewsCount'] = (int) $product['reviews_count'];
            $product['categoryId'] = $product['category_id'];
            $product['brandId'] = $product['brand_id'];
        }
        
        echo json_encode($products);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to fetch products", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Determine if it's JSON or Multipart Form Data (for image upload)
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if (strpos($contentType, 'application/json') !== false) {
        // Handling JSON payload (e.g. from fetch without file upload)
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
        $image = $data['image'] ?? ''; // Might be base64 from old system
        $in_stock = ($stock_quantity > 0) ? 1 : 0;
        $is_trending = isset($data['isTrending']) && $data['isTrending'] ? 1 : 0;
        
        try {
            $stmt = $pdo->prepare("INSERT INTO products (name, sku, category_id, brand_id, price, discount_price, stock_quantity, delivery_charges, description, image, in_stock, is_trending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $sku, $category_id, $brand_id, $price, $discount_price, $stock_quantity, $delivery_charges, $description, $image, $in_stock, $is_trending]);
            
            echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to insert product", "message" => $e->getMessage()]);
        }
    } else {
        // Handling form-data (Real image upload)
        $name = $_POST['name'] ?? '';
        $sku = $_POST['sku'] ?? '';
        $category_id = $_POST['categoryId'] ?? '';
        $brand_id = $_POST['brandId'] ?? '';
        $price = $_POST['price'] ?? 0;
        $discount_price = isset($_POST['discountPrice']) && $_POST['discountPrice'] !== '' ? $_POST['discountPrice'] : null;
        $stock_quantity = $_POST['stockQuantity'] ?? 0;
        $delivery_charges = $_POST['deliveryCharges'] ?? 250;
        $description = $_POST['description'] ?? '';
        $in_stock = ($stock_quantity > 0) ? 1 : 0;
        $is_trending = isset($_POST['isTrending']) && ($_POST['isTrending'] === 'true' || $_POST['isTrending'] == 1) ? 1 : 0;
        
        // Handle file upload
        $imagePath = '';
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            $fileName = time() . '_' . basename($_FILES['image']['name']);
            $targetPath = $uploadDir . $fileName;
            
            if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                $imagePath = '/backend/uploads/' . $fileName;
            }
        }
        
        try {
            $stmt = $pdo->prepare("INSERT INTO products (name, sku, category_id, brand_id, price, discount_price, stock_quantity, delivery_charges, description, image, in_stock, is_trending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $sku, $category_id, $brand_id, $price, $discount_price, $stock_quantity, $delivery_charges, $description, $imagePath, $in_stock, $is_trending]);
            
            echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to insert product", "message" => $e->getMessage()]);
        }
    }
} elseif ($method === 'PUT') {
    // Update product (Assuming JSON payload)
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    
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
    $image = $data['image'] ?? '';
    $in_stock = ($stock_quantity > 0) ? 1 : 0;
    $is_trending = isset($data['isTrending']) && $data['isTrending'] ? 1 : 0;
    
    try {
        $stmt = $pdo->prepare("UPDATE products SET name=?, sku=?, category_id=?, brand_id=?, price=?, discount_price=?, stock_quantity=?, delivery_charges=?, description=?, image=?, in_stock=?, is_trending=? WHERE id=?");
        $stmt->execute([$name, $sku, $category_id, $brand_id, $price, $discount_price, $stock_quantity, $delivery_charges, $description, $image, $in_stock, $is_trending, $id]);
        
        echo json_encode(["success" => true]);
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
