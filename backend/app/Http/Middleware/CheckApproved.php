<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckApproved
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        // Pengurus / super admin is always approved
        if ($user->isPengurus()) {
            return $next($request);
        }

        if ($user->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda masih berstatus PENDING. Silakan menunggu konfirmasi dan persetujuan dari Pengurus RT setempat.',
                'status' => 'pending'
            ], 403);
        }

        return $next($request);
    }
}
