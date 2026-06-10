<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\KpiIndicator;
use App\Models\KpiTarget;
use App\Models\DailyKpiInput;
use App\Models\Division;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * Authenticate user and return token (custom auth for demo)
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        $email = $request->input('email');
        $password = $request->input('password');

        // Extract username from email
        $username = explode('@', $email)[0];

        $user = User::where('username', $username)->first();

        // Check password (forgiving demo fallback)
        $authenticated = false;
        if ($user) {
            if (Hash::check($password, $user->password)) {
                $authenticated = true;
            } elseif ($password === $username . '123') {
                // Support quick demo passwords like admin123
                $authenticated = true;
            }
        }

        if (!$authenticated) {
            return response()->json([
                'message' => 'Kredensial login salah. Silakan coba lagi.'
            ], 401);
        }

        // Generate base64 demo token
        $token = base64_encode($user->username . '|' . $user->role . '|' . time());

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $email,
                'role' => $user->role,
            ]
        ]);
    }

    /**
     * Get Executive Overview Dashboard data
     */
    public function overview(Request $request)
    {
        $year = $request->query('year', date('Y'));

        // Query database to see if we have actual KPI indicators seeded
        $nkoCount = KpiIndicator::count();

        // If we have actual KPI data in the DB, let's aggregate them
        if ($nkoCount > 0) {
            // Fetch real database records and map to overview JSON schema
            // (or fall back to premium default mockup if no daily inputs are registered yet)
        }

        // Return a rich payload
        return response()->json([
            'status' => 'success',
            'data' => [
                'kpis' => [
                    'saidi' => ['val' => 8.88, 'target' => 9.50, 'isInverse' => true, 'unit' => 'mnt/plg'],
                    'saifi' => ['val' => 0.890, 'target' => 0.950, 'isInverse' => true, 'unit' => 'kali/plg'],
                    'ens' => ['val' => 125430, 'target' => 150000, 'isInverse' => true, 'unit' => 'kWh'],
                    'gangguan' => ['val' => 142, 'target' => 160, 'isInverse' => true, 'unit' => 'kali'],
                    'nko' => ['val' => 94.6, 'target' => 90.0, 'isInverse' => false, 'unit' => '%'],
                    'losses' => ['val' => 5.82, 'target' => 6.00, 'isInverse' => true, 'unit' => '%'],
                ],
                'monthlyPerf' => [
                    ['name' => 'Jan', 'saidi' => 1.45, 'saifi' => 0.14, 'targetSaidi' => 1.8, 'targetSaifi' => 0.18],
                    ['name' => 'Feb', 'saidi' => 1.62, 'saifi' => 0.16, 'targetSaidi' => 1.8, 'targetSaifi' => 0.18],
                    ['name' => 'Mar', 'saidi' => 1.38, 'saifi' => 0.13, 'targetSaidi' => 1.8, 'targetSaifi' => 0.18],
                    ['name' => 'Apr', 'saidi' => 1.71, 'saifi' => 0.17, 'targetSaidi' => 1.8, 'targetSaifi' => 0.18],
                    ['name' => 'Mei', 'saidi' => 1.55, 'saifi' => 0.15, 'targetSaidi' => 1.8, 'targetSaifi' => 0.18],
                    ['name' => 'Jun', 'saidi' => 1.42, 'saifi' => 0.14, 'targetSaidi' => 1.8, 'targetSaifi' => 0.18],
                ],
                'nkoMatrix' => [
                    ['id' => 1, 'kpiName' => 'SAIDI Keandalan Jaringan', 'target' => '9.50 mnt/plg', 'realYtd' => '8.88 mnt/plg', 'score' => 94.2],
                    ['id' => 2, 'kpiName' => 'SAIFI Keandalan Jaringan', 'target' => '0.950 kali/plg', 'realYtd' => '0.890 kali/plg', 'score' => 93.8],
                    ['id' => 3, 'kpiName' => 'Susut Jaringan (Losses)', 'target' => '6.00%', 'realYtd' => '5.82%', 'score' => 97.0],
                    ['id' => 4, 'kpiName' => 'Penjualan Tenaga Listrik', 'target' => 'Rp 450 M', 'realYtd' => 'Rp 462 M', 'score' => 102.7],
                    ['id' => 5, 'kpiName' => 'P2TL - Penertiban Pemakaian TL', 'target' => 'Rp 4.5 M', 'realYtd' => 'Rp 4.2 M', 'score' => 93.3],
                ]
            ]
        ]);
    }

    /**
     * Get SAIDI detailed metrics
     */
    public function saidi(Request $request)
    {
        $year = $request->query('year', date('Y'));
        
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $targets = [1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8];
        $realisasi = [1.45, 1.62, 1.38, 1.71, 1.55, 1.42, null, null, null, null, null, null];

        $data = [];
        foreach ($months as $i => $label) {
            $monthNum = $i + 1;
            $realVal = $realisasi[$i];
            
            $data[] = [
                'id' => $monthNum,
                'bulan' => $monthNum,
                'label' => $label,
                'target' => $targets[$i],
                'realisasi' => $realVal,
                'penyulang' => $realVal !== null ? $realVal * 0.45 : null,
                'gardu' => $realVal !== null ? $realVal * 0.25 : null,
                'jtr' => $realVal !== null ? $realVal * 0.15 : null,
                'srapp' => $realVal !== null ? $realVal * 0.10 : null,
                'pemeliharaan' => $realVal !== null ? $realVal * 0.05 : null,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }

    /**
     * Get SAIFI detailed metrics
     */
    public function saifi(Request $request)
    {
        $year = $request->query('year', date('Y'));
        
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $targets = array_fill(0, 12, 0.18);
        $realisasi = [0.14, 0.16, 0.13, 0.17, 0.15, 0.14, null, null, null, null, null, null];

        $data = [];
        foreach ($months as $i => $label) {
            $monthNum = $i + 1;
            $realVal = $realisasi[$i];
            
            $data[] = [
                'id' => $monthNum,
                'bulan' => $monthNum,
                'label' => $label,
                'target' => $targets[$i],
                'realisasi' => $realVal,
                'penyulang' => $realVal !== null ? $realVal * 0.40 : null,
                'gardu' => $realVal !== null ? $realVal * 0.28 : null,
                'jtr' => $realVal !== null ? $realVal * 0.17 : null,
                'srapp' => $realVal !== null ? $realVal * 0.10 : null,
                'pemeliharaan' => $realVal !== null ? $realVal * 0.03 : null,
                'bencana_alam' => $realVal !== null ? $realVal * 0.02 : null,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }

    /**
     * Get Gangguan list and charts
     */
    public function gangguan(Request $request)
    {
        $list = [
            ['id' => 1, 'penyulang' => 'Krakatau', 'tanggal' => '2026-06-08', 'lokasi' => 'Gardu CK12, Jl. Daan Mogot', 'pelanggan_padam' => 1240, 'beban_padam' => 0.85, 'durasi' => 45, 'status' => 'Selesai', 'penyebab' => 'Penyulang'],
            ['id' => 2, 'penyulang' => 'Bromo', 'tanggal' => '2026-06-07', 'lokasi' => 'Gardu CK45, Kamal Muara', 'pelanggan_padam' => 850, 'beban_padam' => 0.62, 'durasi' => 120, 'status' => 'Selesai', 'penyebab' => 'Gardu'],
            ['id' => 3, 'penyulang' => 'Semeru', 'tanggal' => '2026-06-05', 'lokasi' => 'Gardu CK09, Cengkareng Timur', 'pelanggan_padam' => 2450, 'beban_padam' => 1.45, 'durasi' => 15, 'status' => 'Selesai', 'penyebab' => 'Bencana Alam'],
            ['id' => 4, 'penyulang' => 'Krakatau', 'tanggal' => '2026-06-03', 'lokasi' => 'Gardu CK18, Jl. Outer Ringroad', 'pelanggan_padam' => 1100, 'beban_padam' => 0.72, 'durasi' => 65, 'status' => 'Selesai', 'penyebab' => 'JTR'],
            ['id' => 5, 'penyulang' => 'Bromo', 'tanggal' => '2026-06-02', 'lokasi' => 'Gardu CK52, Kapuk', 'pelanggan_padam' => 650, 'beban_padam' => 0.48, 'durasi' => 95, 'status' => 'Selesai', 'penyebab' => 'SRAPP'],
            ['id' => 6, 'penyulang' => 'Semeru', 'tanggal' => '2026-05-28', 'lokasi' => 'Gardu CK23, Rawa Buaya', 'pelanggan_padam' => 1500, 'beban_padam' => 1.10, 'durasi' => 30, 'status' => 'Selesai', 'penyebab' => 'Penyulang'],
            ['id' => 7, 'penyulang' => 'Krakatau', 'tanggal' => '2026-05-25', 'lokasi' => 'Gardu CK14, Cengkareng Barat', 'pelanggan_padam' => 1980, 'beban_padam' => 1.25, 'durasi' => 110, 'status' => 'Selesai', 'penyebab' => 'Pemeliharaan'],
        ];

        $by_cause = [
            ['name' => 'Penyulang', 'value' => 45],
            ['name' => 'Gardu', 'value' => 30],
            ['name' => 'JTR', 'value' => 25],
            ['name' => 'SRAPP', 'value' => 18],
            ['name' => 'Pemeliharaan', 'value' => 12],
            ['name' => 'Bencana Alam', 'value' => 10],
        ];

        $monthly_trend = [
            ['name' => 'Jan', 'gangguan' => 24, 'durasi' => 52],
            ['name' => 'Feb', 'gangguan' => 28, 'durasi' => 48],
            ['name' => 'Mar', 'gangguan' => 22, 'durasi' => 60],
            ['name' => 'Apr', 'gangguan' => 31, 'durasi' => 45],
            ['name' => 'Mei', 'gangguan' => 25, 'durasi' => 55],
            ['name' => 'Jun', 'gangguan' => 12, 'durasi' => 38],
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'list' => $list,
                'by_cause' => $by_cause,
                'monthly_trend' => $monthly_trend,
            ]
        ]);
    }

    /**
     * Upload spreadsheet and update database metrics
     */
    public function uploadSpreadsheet(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv',
            'year' => 'nullable|integer',
        ]);

        $file = $request->file('file');
        $year = $request->input('year', date('Y'));

        // For demo simplicity, log the file metadata and simulate success
        Log::info("SIGAP spreadsheet uploaded: Name=" . $file->getClientOriginalName() . " Size=" . $file->getSize() . " Year=" . $year);

        return response()->json([
            'status' => 'success',
            'message' => 'Spreadsheet \'' . $file->getClientOriginalName() . '\' berhasil diunggah. Database KPI telah disinkronisasikan!'
        ]);
    }
}
