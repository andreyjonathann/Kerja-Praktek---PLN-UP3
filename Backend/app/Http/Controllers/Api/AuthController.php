<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\EmailOtp;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        // Support login by email or username
        $user = User::where('username', $request->username)
                    ->orWhere('email', $request->username)
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Kredensial tidak valid.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Akun tidak aktif.'], 403);
        }

        $user->tokens()->delete();

        $token = $user->createToken('sigap-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Send OTP Code to Gmail / Email for Register or Reset Password
     */
    public function sendOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email|max:255',
            'action' => 'required|string|in:register,reset_password',
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'action.in' => 'Tindakan verifikasi tidak valid.',
        ]);

        $email = trim(strtolower($validated['email']));
        $action = $validated['action'];

        // Validation for registration: email must NOT exist
        if ($action === 'register') {
            if (User::where('email', $email)->exists()) {
                return response()->json([
                    'message' => 'Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.'
                ], 422);
            }
        }

        // Validation for reset_password: email MUST exist
        if ($action === 'reset_password') {
            if (!User::where('email', $email)->exists()) {
                return response()->json([
                    'message' => 'Email tidak terdaftar di sistem PLN UP3.'
                ], 422);
            }
        }

        // Generate 6-digit OTP code
        $otpCode = sprintf('%06d', mt_rand(100000, 999999));

        // Delete any existing active OTPs for this email and action
        EmailOtp::where('email', $email)
            ->where('action', $action)
            ->delete();

        // Save new OTP code
        EmailOtp::create([
            'email' => $email,
            'otp_code' => $otpCode,
            'action' => $action,
            'expires_at' => now()->addMinutes(10),
        ]);

        // Attempt sending email via Mailer
        $mailSent = false;
        try {
            $actionTitle = $action === 'register' ? 'Pendaftaran Akun Baru' : 'Atur Ulang Kata Sandi';
            Mail::raw(
                "Halo,\n\nKode verifikasi (OTP) SIGAP PLN UP3 Kebon Jeruk untuk " . $actionTitle . " adalah:\n\n" . $otpCode . "\n\nKode ini berlaku selama 10 menit. Mohon untuk tidak membagikan kode verifikasi ini kepada siapapun demi keamanan akun Anda.\n\nSalam,\nTim Administrator SIGAP PLN UP3",
                function ($message) use ($email, $actionTitle, $otpCode) {
                    $message->to($email)
                            ->subject('Kode Verifikasi OTP (' . $otpCode . ') - ' . $actionTitle);
                }
            );
            $mailSent = true;
        } catch (\Exception $e) {
            Log::error('Gagal mengirim email OTP ke ' . $email . ': ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Kode OTP berhasil dikirim ke alamat email ' . $email . '. Silakan cek kotak masuk/spam Gmail Anda.',
            'mail_sent' => $mailSent,
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'nullable|string',
            'up3' => 'nullable|string',
            'otp_code' => 'required|string|size:6',
        ], [
            'username.unique' => 'Username sudah digunakan.',
            'email.unique' => 'Email sudah terdaftar.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
            'otp_code.required' => 'Kode verifikasi OTP wajib diisi.',
            'otp_code.size' => 'Kode OTP harus terdiri dari 6 digit.',
        ]);

        $email = trim(strtolower($validated['email']));

        // Verify OTP
        $otpRecord = EmailOtp::where('email', $email)
            ->where('action', 'register')
            ->where('otp_code', $validated['otp_code'])
            ->where('expires_at', '>=', now())
            ->first();

        if (!$otpRecord) {
            return response()->json([
                'message' => 'Kode OTP verifikasi tidak valid atau telah kadaluarsa. Silakan minta kode OTP baru.'
            ], 422);
        }

        // Delete verified OTP record
        $otpRecord->delete();

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $email,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'pic_jaringan',
            'up3' => $validated['up3'] ?? 'UP3 Kebon Jeruk',
            'is_active' => true,
        ]);

        $token = $user->createToken('sigap-token')->plainTextToken;

        return response()->json([
            'message' => 'Verifikasi email berhasil. Akun Anda berhasil terdaftar.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6|confirmed',
            'otp_code' => 'required|string|size:6',
        ], [
            'email.required' => 'Email wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
            'otp_code.required' => 'Kode verifikasi OTP wajib diisi.',
            'otp_code.size' => 'Kode OTP harus terdiri dari 6 digit.',
        ]);

        $email = trim(strtolower($validated['email']));

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Email tidak terdaftar di sistem.'
            ], 422);
        }

        // Verify OTP
        $otpRecord = EmailOtp::where('email', $email)
            ->where('action', 'reset_password')
            ->where('otp_code', $validated['otp_code'])
            ->where('expires_at', '>=', now())
            ->first();

        if (!$otpRecord) {
            return response()->json([
                'message' => 'Kode OTP verifikasi tidak valid atau telah kadaluarsa. Silakan minta kode OTP baru.'
            ], 422);
        }

        // Delete verified OTP record
        $otpRecord->delete();

        $user->password = Hash::make($validated['password']);
        $user->save();

        $user->tokens()->delete();

        return response()->json([
            'message' => 'Kata sandi berhasil diperbarui. Silakan login kembali dengan kata sandi baru Anda.'
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
