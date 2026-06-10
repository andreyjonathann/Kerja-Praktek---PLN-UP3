<?php
$dsn = 'pgsql:host=127.0.0.1;port=5432;dbname=pln_dashboard';
$password = 'Nurmala21';
$users = ['pln_user', 'postgres'];
foreach ($users as $user) {
    try {
        $pdo = new PDO($dsn, $user, $password);
        echo "CONNECTED as $user\n";
    } catch (PDOException $e) {
        echo "ERROR for $user: " . $e->getMessage() . "\n";
    }
}
