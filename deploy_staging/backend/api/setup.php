<?php
// setup.php — Safe to run multiple times. Applies schema migrations.
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
require_once 'db.php';

$results = [];

try {
    // STEP 1: Schema Migrations (safe to re-run)
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

    // STEP 2: Fix foreign key to CASCADE delete (so deleting products works)
    try {
        $pdo->exec("ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_2");
        $pdo->exec("ALTER TABLE order_items ADD CONSTRAINT order_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE");
        $results[] = "Updated FK constraint to CASCADE";
    } catch (PDOException $e) {
        $results[] = "FK constraint already ok or skipped: " . $e->getMessage();
    }

    // STEP 3: Migrate existing base64 images to files
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $stmt = $pdo->query("SELECT id, image FROM products WHERE image LIKE 'data:image%'");
    $migratedCount = 0;
    while ($row = $stmt->fetch()) {
        $base64 = $row['image'];
        preg_match('/data:image\/(\w+);base64,/', $base64, $matches);
        $ext = isset($matches[1]) ? $matches[1] : 'png';
        $fileName = 'migrated_' . $row['id'] . '_' . time() . '.' . $ext;
        $data = preg_replace('/^data:image\/\w+;base64,/', '', $base64);
        $decoded = base64_decode($data);
        if ($decoded !== false) {
            file_put_contents($uploadDir . $fileName, $decoded);
            $newPath = '/backend/uploads/' . $fileName;
            $update = $pdo->prepare("UPDATE products SET image = ? WHERE id = ?");
            $update->execute([$newPath, $row['id']]);
            $migratedCount++;
        }
    }
    $results[] = "Migrated $migratedCount base64 images to files";
    
    // Same for categories
    $catUploadDir = $uploadDir . 'categories/';
    if (!is_dir($catUploadDir)) {
        mkdir($catUploadDir, 0755, true);
    }
    
    $stmt = $pdo->query("SELECT id, image FROM categories WHERE image LIKE 'data:image%'");
    $catMigrated = 0;
    while ($row = $stmt->fetch()) {
        $base64 = $row['image'];
        preg_match('/data:image\/(\w+);base64,/', $base64, $matches);
        $ext = isset($matches[1]) ? $matches[1] : 'png';
        $fileName = 'migrated_cat_' . $row['id'] . '_' . time() . '.' . $ext;
        $data = preg_replace('/^data:image\/\w+;base64,/', '', $base64);
        $decoded = base64_decode($data);
        if ($decoded !== false) {
            file_put_contents($catUploadDir . $fileName, $decoded);
            $newPath = '/backend/uploads/categories/' . $fileName;
            $update = $pdo->prepare("UPDATE categories SET image = ? WHERE id = ?");
            $update->execute([$newPath, $row['id']]);
            $catMigrated++;
        }
    }
    $results[] = "Migrated $catMigrated base64 category images to files";

    // STEP 4: Verify final state
    $productCount = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
    $catCount = $pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();

    echo json_encode([
        "status"   => "success",
        "message"  => "Setup complete! Products: $productCount, Categories: $catCount",
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
