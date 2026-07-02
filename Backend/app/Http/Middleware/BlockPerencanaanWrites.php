<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockPerencanaanWrites
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if ($user && strtolower($user->role) === 'perencanaan') {
            $method = strtoupper($request->method());
            $path = $request->path();
            
            // Block all write operations (POST, PUT, PATCH, DELETE) except logging out
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                if (!str_contains($path, 'logout')) {
                    return response()->json([
                        'message' => 'Akses ditolak. Role Perencanaan tidak diizinkan mengubah data.'
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
