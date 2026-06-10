<?php
$dsn = 'pgsql:host=127.0.0.1;port=5433;dbname=kpi_pln_up3';
$user = 'postgres';
$pass = 'nurmala21';
try {
    $pdo = new PDO($dsn, $user, $pass);
    echo "CONNECTED\n";
} catch (PDOException $e) {
    echo 'ERROR: ' . $e->getMessage() . PHP_EOL;
}
