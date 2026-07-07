<?php
// orders.php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Fetch orders
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
        $orders = $stmt->fetchAll();
        
        // Fetch order items and attach to respective orders
        $itemsStmt = $pdo->query("
            SELECT oi.*, p.name as product_name, p.image as product_image 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id
        ");
        $all_items = $itemsStmt->fetchAll();
        
        foreach ($orders as &$order) {
            $order['total'] = (float) $order['total'];
            $order['subtotal'] = (float) $order['subtotal'];
            $order['deliveryCharges'] = (float) $order['delivery_charges'];
            $order['customerName'] = $order['customer_name'];
            $order['id'] = $order['order_number']; // Frontend uses id for order_number string
            $order['date'] = date('F j, Y', strtotime($order['created_at']));
            
            $order['items'] = [];
            foreach ($all_items as $item) {
                if ($item['order_id'] == $order['id']) {
                    $order['items'][] = [
                        'id' => $item['product_id'],
                        'name' => $item['product_name'],
                        'price' => (float) $item['price'],
                        'qty' => (int) $item['quantity'],
                        'image' => $item['product_image'],
                        'lensOption' => $item['lens_option'],
                        'prescriptionData' => $item['prescription_data'] ? json_decode($item['prescription_data'], true) : null
                    ];
                }
            }
        }
        
        echo json_encode($orders);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to fetch orders", "message" => $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    // Update order status
    $data = json_decode(file_get_contents('php://input'), true);
    $order_number = $data['id'] ?? null; // Frontend passes order string ID as 'id'
    $status = $data['status'] ?? null;
    
    if (!$order_number || !$status) {
        http_response_code(400);
        echo json_encode(["error" => "Order ID and Status required"]);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE orders SET status=? WHERE order_number=?");
        $stmt->execute([$status, $order_number]);
        
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update order", "message" => $e->getMessage()]);
    }
}
?>
