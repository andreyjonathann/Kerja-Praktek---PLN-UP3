<?php

$models = ['KinerjaAset', 'KinerjaTransaksiEnergi', 'KinerjaNiaga', 'KinerjaPemasaran', 'KinerjaKeuangan'];

foreach ($models as $model) {
    $table = 'kinerja_' . strtolower(str_replace('Kinerja', '', $model));
    if ($model == 'KinerjaTransaksiEnergi') $table = 'kinerja_transaksi_energi';
    
    $content = <<<PHP
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class $model extends Model
{
    use HasFactory;

    protected \$table = '$table';

    protected \$fillable = [
        'periode_id',
        'data_realisasi',
        'nko_score'
    ];

    protected function casts(): array
    {
        return [
            'data_realisasi' => 'array',
        ];
    }

    public function periode()
    {
        return \$this->belongsTo(Periode::class);
    }
}
PHP;
    file_put_contents(__DIR__ . "/app/Models/{$model}.php", $content);
}

// Rekap Nko
$rekap_content = <<<PHP
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RekapNko extends Model
{
    use HasFactory;

    protected \$table = 'rekap_nko';

    protected \$fillable = [
        'periode_id',
        'score_aset', 'score_jaringan', 'score_transaksi_energi', 'score_niaga', 'score_pemasaran', 'score_keuangan', 'total_nko'
    ];

    public function periode()
    {
        return \$this->belongsTo(Periode::class);
    }
}
PHP;
file_put_contents(__DIR__ . "/app/Models/RekapNko.php", $rekap_content);

// Periode
$periode_content = <<<PHP
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Periode extends Model
{
    use HasFactory;

    protected \$table = 'periode';

    protected \$fillable = [
        'bulan', 'tahun'
    ];
}
PHP;
file_put_contents(__DIR__ . "/app/Models/Periode.php", $periode_content);

echo "Models updated successfully.";
