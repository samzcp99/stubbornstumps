<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function json_response(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

$projectRoot = dirname(__DIR__);
$storageDir = $projectRoot . '/storage';
$uploadsDir = $storageDir . '/uploads';

if (!is_dir($storageDir) && !mkdir($storageDir, 0755, true) && !is_dir($storageDir)) {
    json_response(500, ['ok' => false, 'message' => 'Storage initialization failed.']);
}

if (!is_dir($uploadsDir) && !mkdir($uploadsDir, 0755, true) && !is_dir($uploadsDir)) {
    json_response(500, ['ok' => false, 'message' => 'Upload directory initialization failed.']);
}

$dbPath = $storageDir . '/quotes.sqlite';

try {
    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS quotes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            region TEXT NOT NULL,
            address TEXT NOT NULL,
            suburb TEXT NOT NULL,
            town TEXT NOT NULL,
            description TEXT NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS quote_photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quote_id INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(quote_id) REFERENCES quotes(id)
        )'
    );
} catch (Throwable $error) {
    json_response(500, ['ok' => false, 'message' => 'Database unavailable. Install/enable PHP SQLite support.']);
}

$honeypot = trim((string) ($_POST['website'] ?? ''));
if ($honeypot !== '') {
    json_response(200, ['ok' => true, 'message' => 'Submitted.']);
}

$startedAt = (int) ($_POST['started_at'] ?? 0);
if ($startedAt > 0) {
    $elapsedMs = (int) floor(microtime(true) * 1000) - $startedAt;
    if ($elapsedMs < 3000) {
        json_response(429, ['ok' => false, 'message' => 'Please wait a moment before submitting.']);
    }
}

$ipAddress = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
$userAgent = (string) ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown');

$rateCheck = $pdo->prepare(
    "SELECT COUNT(*) AS count
     FROM quotes
     WHERE ip_address = :ip
       AND datetime(created_at) >= datetime('now', '-60 seconds')"
);
$rateCheck->execute([':ip' => $ipAddress]);
$recentCount = (int) ($rateCheck->fetch()['count'] ?? 0);
if ($recentCount >= 8) {
    json_response(429, ['ok' => false, 'message' => 'Too many requests. Please try again in a minute.']);
}

$name = trim((string) ($_POST['name'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$region = trim((string) ($_POST['region'] ?? ''));
$address = trim((string) ($_POST['address'] ?? ''));
$suburb = trim((string) ($_POST['suburb'] ?? ''));
$town = trim((string) ($_POST['town'] ?? ''));
$description = trim((string) ($_POST['description'] ?? ''));

if (
    $name === '' ||
    $phone === '' ||
    $email === '' ||
    $region === '' ||
    $address === '' ||
    $suburb === '' ||
    $town === '' ||
    $description === ''
) {
    json_response(422, ['ok' => false, 'message' => 'Please complete all required fields.']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, ['ok' => false, 'message' => 'Please enter a valid email address.']);
}

$maxPhotoCount = 8;
$maxFileBytes = 10 * 1024 * 1024;
$maxTotalBytes = 30 * 1024 * 1024;

$photoFiles = [];
if (isset($_FILES['photos'])) {
    $files = $_FILES['photos'];
    if (is_array($files['name'])) {
        $total = count($files['name']);
        for ($index = 0; $index < $total; $index++) {
            if (($files['error'][$index] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            $photoFiles[] = [
                'name' => (string) ($files['name'][$index] ?? ''),
                'type' => (string) ($files['type'][$index] ?? ''),
                'tmp_name' => (string) ($files['tmp_name'][$index] ?? ''),
                'error' => (int) ($files['error'][$index] ?? UPLOAD_ERR_NO_FILE),
                'size' => (int) ($files['size'][$index] ?? 0),
            ];
        }
    } elseif (($files['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        $photoFiles[] = [
            'name' => (string) ($files['name'] ?? ''),
            'type' => (string) ($files['type'] ?? ''),
            'tmp_name' => (string) ($files['tmp_name'] ?? ''),
            'error' => (int) ($files['error'] ?? UPLOAD_ERR_NO_FILE),
            'size' => (int) ($files['size'] ?? 0),
        ];
    }
}

if (count($photoFiles) > $maxPhotoCount) {
    json_response(422, ['ok' => false, 'message' => 'Please upload up to 8 photos.']);
}

$totalPhotoBytes = 0;
foreach ($photoFiles as $photoFile) {
    if ($photoFile['error'] !== UPLOAD_ERR_OK) {
        json_response(422, ['ok' => false, 'message' => 'One of the uploaded photos failed. Please try again.']);
    }
    if ($photoFile['size'] > $maxFileBytes) {
        json_response(422, ['ok' => false, 'message' => 'Each photo must be under 10MB.']);
    }
    $totalPhotoBytes += $photoFile['size'];
}

if ($totalPhotoBytes > $maxTotalBytes) {
    json_response(422, ['ok' => false, 'message' => 'Total photo upload must be under 30MB.']);
}

$allowedMimeTypes = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/heic' => 'heic',
    'image/heif' => 'heif',
];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
if ($finfo === false) {
    json_response(500, ['ok' => false, 'message' => 'Server file inspection is not available.']);
}

try {
    $pdo->beginTransaction();

    $insertQuote = $pdo->prepare(
        'INSERT INTO quotes (name, phone, email, region, address, suburb, town, description, ip_address, user_agent)
         VALUES (:name, :phone, :email, :region, :address, :suburb, :town, :description, :ip_address, :user_agent)'
    );
    $insertQuote->execute([
        ':name' => $name,
        ':phone' => $phone,
        ':email' => $email,
        ':region' => $region,
        ':address' => $address,
        ':suburb' => $suburb,
        ':town' => $town,
        ':description' => $description,
        ':ip_address' => $ipAddress,
        ':user_agent' => substr($userAgent, 0, 500),
    ]);

    $quoteId = (int) $pdo->lastInsertId();

    $insertPhoto = $pdo->prepare(
        'INSERT INTO quote_photos (quote_id, file_path, original_name, mime_type, size_bytes)
         VALUES (:quote_id, :file_path, :original_name, :mime_type, :size_bytes)'
    );

    foreach ($photoFiles as $photoFile) {
        $tmpName = $photoFile['tmp_name'];
        $mimeType = (string) finfo_file($finfo, $tmpName);
        if (!array_key_exists($mimeType, $allowedMimeTypes)) {
            throw new RuntimeException('Unsupported image format.');
        }

        $extension = $allowedMimeTypes[$mimeType];
        $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $photoFile['name']) ?: 'photo';
        $storedName = date('Ymd_His') . '_' . $quoteId . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
        $targetPath = $uploadsDir . '/' . $storedName;

        if (!move_uploaded_file($tmpName, $targetPath)) {
            throw new RuntimeException('Unable to save uploaded image.');
        }

        $insertPhoto->execute([
            ':quote_id' => $quoteId,
            ':file_path' => 'storage/uploads/' . $storedName,
            ':original_name' => substr($safeName, 0, 255),
            ':mime_type' => $mimeType,
            ':size_bytes' => (int) $photoFile['size'],
        ]);
    }

    $pdo->commit();
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    finfo_close($finfo);
    json_response(500, ['ok' => false, 'message' => 'Submission failed on server. Please call us directly.']);
}

finfo_close($finfo);

json_response(200, [
    'ok' => true,
    'message' => 'Thanks! Your quote request was sent successfully.',
]);
