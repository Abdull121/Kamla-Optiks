<?php
// setup.php — Safe to run multiple times.
header("Content-Type: application/json");
require_once 'db.php';

$results = [];

try {
    // STEP 1: Disable FK checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

    // STEP 2: DELETE all products & order_items (use DELETE instead of TRUNCATE — works on all privilege levels)
    $deleted_items = $pdo->exec("DELETE FROM order_items");
    $deleted_products = $pdo->exec("DELETE FROM products");
    $results[] = "Deleted $deleted_products products and $deleted_items order_items from DB";

    // STEP 3: Re-enable FK checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // STEP 4: Schema Migrations (safe to re-run)
    $migrations = [
        "sku column"      => "ALTER TABLE products ADD COLUMN sku varchar(100) DEFAULT NULL AFTER name",
        "is_trending col" => "ALTER TABLE products ADD COLUMN is_trending tinyint(1) NOT NULL DEFAULT 0 AFTER in_stock",
    ];
    foreach ($migrations as $label => $sql) {
        try {
            $pdo->exec($sql);
            $results[] = "Added $label";
        } catch (PDOException $e) {
            $results[] = "Skipped $label (already exists)";
        }
    }

    // STEP 5: Verify final count
    $count = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();

    echo json_encode([
        "status"   => "success",
        "message"  => "Database setup complete! Products in DB: " . (int)$count,
        "details"  => $results
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
