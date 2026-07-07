<?php
$data = \App\Models\KinerjaJaringan::with('periode')->whereHas('periode', function($q) { $q->where('tahun', 2026); })->get();
echo json_encode($data);
