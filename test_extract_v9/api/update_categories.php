<?php
require_once 'db.php';
header("Content-Type: application/json");

try {
    // Delete all existing categories
    $pdo->exec("DELETE FROM categories");

    // Insert new categories with default images
    $seedCategories = [
        ['name' => 'Sunglasses', 'slug' => 'sunglasses', 'image' => 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80'],
        ['name' => 'Optical frames', 'slug' => 'optical-frames', 'image' => 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80'],
        ['name' => 'Contact Lenses', 'slug' => 'contact-lenses', 'image' => 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80'],
        ['name' => 'Solutions', 'slug' => 'solutions', 'image' => 'https://images.unsplash.com/photo-1633511195655-b44c0003b8cc?auto=format&fit=crop&w=800&q=80']
    ];

    $stmt = $pdo->prepare("INSERT INTO categories (name, slug, image) VALUES (?, ?, ?)");
    foreach ($seedCategories as $c) {
        $stmt->execute([$c['name'], $c['slug'], $c['image']]);
    }

    echo json_encode(["success" => true, "message" => "Categories successfully updated to: Sunglasses, Optical frames, Contact Lenses, Solutions."]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>
