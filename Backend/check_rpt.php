<?php
$data = \App\Models\RptGangguan::where('tahun', 2026)->get();
echo json_encode($data);
