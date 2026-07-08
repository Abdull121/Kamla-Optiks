<?php
// cleanup.php â€” Wipe ALL products permanently using DELETE (not TRUNCATE)
header("Content-Type: application/json");
require_once 'db.php';

try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    $deleted_items = $pdo->exec("DELETE FROM order_items");
    $deleted_products = $pdo->exec("DELETE FROM products");
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    $count = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
    
    echo json_encode([
        "status"    => "success",
        "message"   => "All products and order items permanently deleted.",
        "deleted_products" => (int)$deleted_products,
        "deleted_items"    => (int)$deleted_items,
        "remaining" => (int)$count
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
