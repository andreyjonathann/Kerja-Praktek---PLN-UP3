<?php
$url = 'https://docs.google.com/spreadsheets/d/1PH1QJfsEsVKt8Ub91DS22xf6FCwrHxvz/gviz/tq?tqx=out:csv&sheet=MASTER_DATA';
$context = stream_context_create([
    "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false,
    ]
]);

$csvData = @file_get_contents($url, false, $context);
$lines = explode("\n", str_replace("\r", "", $csvData));
array_shift($lines);

$kpis = [];
foreach ($lines as $line) {
    if (empty($line)) continue;
    $row = str_getcsv($line);
    $name = trim($row[0], '"');
    if (!in_array($name, $kpis)) {
        $kpis[] = $name;
    }
}
echo implode(PHP_EOL, $kpis);
