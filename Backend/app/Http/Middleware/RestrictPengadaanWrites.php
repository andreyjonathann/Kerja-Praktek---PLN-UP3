<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestrictPengadaanWrites
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If user is logged in, and tries to modify pengadaan or pagu-anggaran
        if ($user) {
            $role = strtolower($user->role);
            
            // Only allow 'pic_pengadaan' to perform write actions for pengadaan / pagu-anggaran
            if ($role !== 'pic_pengadaan') {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Hanya PIC Pengadaan yang dapat mengelola pagu dan data kontrak.'
                ], 403);
            }
        }

        return $next($request);
    }
}
