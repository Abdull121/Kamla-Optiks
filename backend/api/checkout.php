<?php
// checkout.php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Basic validation
    if (empty($data['cart']) || empty($data['customer'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid checkout payload"]);
        exit;
    }
    
    $customer = $data['customer'];
    $cart = $data['cart'];
    $subtotal = $data['subtotal'] ?? 0;
    $deliveryCharges = $data['deliveryCharges'] ?? 0;
    $total = $data['total'] ?? 0;
    
    // Generate order number
    $order_number = 'KML-' . rand(10000000, 99999999);
    
    try {
        $pdo->beginTransaction();
        
        // Insert order
        $stmt = $pdo->prepare("INSERT INTO orders (order_number, customer_name, email, phone, address, subtotal, delivery_charges, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $order_number,
            $customer['fullName'] ?? 'Unknown',
            $customer['email'] ?? 'unknown@example.com',
            $customer['phone'] ?? 'N/A',
            $customer['address'] ?? 'N/A',
            $subtotal,
            $deliveryCharges,
            $total
        ]);
        
        $order_id = $pdo->lastInsertId();
        
        // Insert order items
        $itemStmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price, selected_color, selected_size, lens_option, prescription_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        
        foreach ($cart as $item) {
            $lensOption = $item['lensOption'] ?? null;
            $selectedColor = $item['selectedColor'] ?? null;
            $selectedSize = $item['selectedSize'] ?? null;
            $prescription = null;
            if (!empty($item['prescription'])) {
                $prescription = json_encode($item['prescription']);
            }
            
            $itemStmt->execute([
                $order_id,
                $item['id'],
                $item['quantity'] ?? 1,
                $item['price'] ?? 0,
                $selectedColor,
                $selectedSize,
                $lensOption,
                $prescription
            ]);
        }
        
        $pdo->commit();
        
        echo json_encode([
            "success" => true,
            "orderNumber" => $order_number
        ]);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["error" => "Checkout failed", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
?>
