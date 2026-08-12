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
        
        // --- SEND EMAIL NOTIFICATION TO ADMIN (VIA BREVO API) ---
        $emailDebug = null;
        try {
            $config = require 'config.php';
            $adminEmail = $config['ADMIN_EMAIL_NOTIFICATION'] ?? 'konceptnext99@gmail.com';
            
            // Extract Brevo API Key from .env (checking multiple paths)
            $envPaths = [
                __DIR__ . '/.env',
                __DIR__ . '/../.env',
                __DIR__ . '/../../.env'
            ];
            $brevoApiKey = '';
            foreach ($envPaths as $path) {
                if (file_exists($path)) {
                    $envContent = file_get_contents($path);
                    if (preg_match('/^BREVOAPIKEY=(.*)$/m', $envContent, $matches)) {
                        $brevoApiKey = trim($matches[1]);
                        break;
                    }
                }
            }
            
            if (!empty($brevoApiKey)) {
                $subject = "🎉 New Order Received! " . $order_number;
                
                $htmlContent = "<div style='font-family: Arial, sans-serif; color: #333;'>";
                $htmlContent .= "<h2 style='color:#111827; border-bottom: 2px solid #eee; padding-bottom: 10px;'>New Order Received: " . $order_number . "</h2>";
                $htmlContent .= "<p><strong>Customer:</strong> " . ($customer['fullName'] ?? 'Unknown') . "</p>";
                $htmlContent .= "<p><strong>Phone:</strong> " . ($customer['phone'] ?? 'N/A') . "</p>";
                $htmlContent .= "<p><strong>Email:</strong> " . ($customer['email'] ?? 'N/A') . "</p>";
                $htmlContent .= "<p><strong>Address:</strong> " . ($customer['address'] ?? 'N/A') . "</p>";
                $htmlContent .= "<h3>Order Details:</h3>";
                $htmlContent .= "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%; max-width: 600px;'>";
                $htmlContent .= "<tr style='background-color: #f3f4f6; text-align: left;'><th>Product</th><th>Qty</th><th>Price</th></tr>";
                
                foreach ($cart as $item) {
                    $productName = $item['name'] ?? 'Product';
                    if (!empty($item['selectedColor'])) $productName .= " (Color: " . $item['selectedColor'] . ")";
                    if (!empty($item['selectedSize'])) $productName .= " (Size: " . $item['selectedSize'] . ")";
                    if (!empty($item['lensOption']) && $item['lensOption'] !== 'no_eyesight') $productName .= " [Prescription Added]";
                    
                    $htmlContent .= "<tr>";
                    $htmlContent .= "<td>" . htmlspecialchars($productName) . "</td>";
                    $htmlContent .= "<td>" . ($item['quantity'] ?? 1) . "</td>";
                    $htmlContent .= "<td>Rs. " . number_format($item['price'] ?? 0) . "</td>";
                    $htmlContent .= "</tr>";
                }
                
                $htmlContent .= "</table>";
                $htmlContent .= "<p style='margin-top: 20px;'><strong>Subtotal:</strong> Rs. " . number_format($subtotal) . "</p>";
                $htmlContent .= "<p><strong>Delivery Charges:</strong> Rs. " . number_format($deliveryCharges) . "</p>";
                $htmlContent .= "<h2 style='color: #059669;'>Total Bill: Rs. " . number_format($total) . "</h2>";
                $htmlContent .= "<p style='margin-top: 30px;'><a href='https://kamaloptiks.com/admin.html' style='background-color: #111827; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Open Admin Panel</a></p>";
                $htmlContent .= "</div>";
                
                $data = [
                    "sender" => [
                        "name" => "Kamla Optiks Orders",
                        "email" => $adminEmail
                    ],
                    "to" => [
                        [
                            "email" => $adminEmail,
                            "name" => "Admin"
                        ]
                    ],
                    "subject" => $subject,
                    "htmlContent" => $htmlContent
                ];
                
                $ch = curl_init("https://api.brevo.com/v3/smtp/email");
                curl_setopt($ch, CURLOPT_POST, 1);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                    'accept: application/json',
                    'api-key: ' . $brevoApiKey,
                    'content-type: application/json'
                ));
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                $emailDebug = [
                    "success" => ($httpCode >= 200 && $httpCode < 300),
                    "http_code" => $httpCode,
                    "response" => json_decode($response, true) ?? $response
                ];
            } else {
                $emailDebug = [
                    "success" => false,
                    "error" => "Brevo API key is empty in env file"
                ];
            }
            
        } catch (Exception $e) {
            // Ignore email errors to prevent blocking the checkout success
            error_log("Failed to send order email via Brevo: " . $e->getMessage());
            $emailDebug = [
                "success" => false,
                "error" => $e->getMessage()
            ];
        }
        // ----------------------------------------
        
        echo json_encode([
            "success" => true,
            "orderNumber" => $order_number,
            "email_debug" => $emailDebug
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
