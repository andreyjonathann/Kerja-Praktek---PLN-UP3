<?php

namespace Tests\Feature\Api\Jaringan;

use App\Models\MvodRealisasi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MvodSecurityTest extends TestCase
{
    use RefreshDatabase;

    private User $viewer;
    private User $picJaringan;
    private User $picJaringanLain;

    protected function setUp(): void
    {
        parent::setUp();

        $this->viewer = User::factory()->create([
            'role' => 'viewer',
            'up3' => 'Kebon Jeruk'
        ]);

        $this->picJaringan = User::factory()->create([
            'role' => 'pic_jaringan',
            'up3' => 'Kebon Jeruk'
        ]);

        $this->picJaringanLain = User::factory()->create([
            'role' => 'pic_jaringan',
            'up3' => 'Lain'
        ]);
    }

    public function test_viewer_cannot_store_mvod()
    {
        $payload = [
            'up3' => 'Kebon Jeruk',
            'tahun' => 2024,
            'bulan' => 5,
            'tipe_rct' => 'GI',
            'total_lama_padam_jam' => 10,
            'kali_padam' => 2,
        ];

        $response = $this->actingAs($this->viewer)
                         ->postJson('/api/v1/mvod', $payload);

        $response->assertStatus(403)
                 ->assertJson(['success' => false, 'message' => 'Unauthorized']);
    }

    public function test_viewer_cannot_update_mvod()
    {
        $mvod = MvodRealisasi::factory()->create([
            'up3' => 'Kebon Jeruk',
            'created_by' => $this->picJaringan->id
        ]);

        $payload = [
            'total_lama_padam_jam' => 5,
            'kali_padam' => 1,
        ];

        $response = $this->actingAs($this->viewer)
                         ->putJson('/api/v1/mvod/' . $mvod->id, $payload);

        $response->assertStatus(403)
                 ->assertJson(['success' => false, 'message' => 'Unauthorized']);
    }

    public function test_viewer_cannot_delete_mvod()
    {
        $mvod = MvodRealisasi::factory()->create([
            'up3' => 'Kebon Jeruk',
            'created_by' => $this->picJaringan->id
        ]);

        $response = $this->actingAs($this->viewer)
                         ->deleteJson('/api/v1/mvod/' . $mvod->id);

        $response->assertStatus(403)
                 ->assertJson(['success' => false, 'message' => 'Unauthorized']);
    }

    public function test_pic_jaringan_can_store_update_delete_own_mvod()
    {
        // Test Store
        $storePayload = [
            'up3' => 'Kebon Jeruk',
            'tahun' => 2024,
            'bulan' => 6,
            'tipe_rct' => 'JTM',
            'total_lama_padam_jam' => 2.5,
            'kali_padam' => 1,
        ];

        $storeResponse = $this->actingAs($this->picJaringan)
                              ->postJson('/api/v1/mvod', $storePayload);

        $storeResponse->assertStatus(200)
                      ->assertJson(['success' => true]);
        
        $mvodId = $storeResponse->json('data.id');

        // Test Update
        $updatePayload = [
            'total_lama_padam_jam' => 4,
            'kali_padam' => 2,
        ];

        $updateResponse = $this->actingAs($this->picJaringan)
                               ->putJson('/api/v1/mvod/' . $mvodId, $updatePayload);

        $updateResponse->assertStatus(200)
                       ->assertJson(['success' => true]);

        // Test Delete
        $deleteResponse = $this->actingAs($this->picJaringan)
                               ->deleteJson('/api/v1/mvod/' . $mvodId);

        $deleteResponse->assertStatus(200)
                       ->assertJson(['success' => true]);
        
        $this->assertDatabaseMissing('mvod_realisasis', [
            'id' => $mvodId
        ]);
    }

    public function test_pic_jaringan_cannot_delete_mvod_from_other_up3()
    {
        $mvod = MvodRealisasi::factory()->create([
            'up3' => 'Kebon Jeruk',
            'created_by' => $this->picJaringan->id
        ]);

        $response = $this->actingAs($this->picJaringanLain)
                         ->deleteJson('/api/v1/mvod/' . $mvod->id);

        $response->assertStatus(403)
                 ->assertJson(['success' => false, 'message' => 'Unauthorized - beda UP3']);
    }
}
