<?php
function verifyAdminToken() {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $jwt = $matches[1];
        $tokenParts = explode('.', $jwt);
        if (count($tokenParts) == 3) {
            $env = require __DIR__ . '/config.php';
            $JWT_SECRET = $env['JWT_SECRET'] ?? 'default_secret_key';
            
            $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
            $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
            $signatureProvided = $tokenParts[2];
            
            // Recreate signature
            $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
            $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
            $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $JWT_SECRET, true);
            $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
            
            if (hash_equals($base64UrlSignature, $signatureProvided)) {
                $payloadData = json_decode($payload, true);
                if (isset($payloadData['exp']) && $payloadData['exp'] > time()) {
                    return true;
                }
            }
        }
    }
    
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized access. Invalid or expired token."]);
    exit();
}
?>
