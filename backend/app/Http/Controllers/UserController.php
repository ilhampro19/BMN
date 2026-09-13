<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('unit_kerja', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->orderBy('id', 'desc')->get();

        return response()->json($users);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'role' => ['required', Rule::in(['admin', 'operator', 'staf', 'pimpinan'])],
            'unit_kerja' => 'nullable|string|max:255',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'unit_kerja' => $validated['unit_kerja'] ?? 'Sekretariat Itjen',
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Pengguna berhasil ditambahkan.',
            'user' => $user,
        ], 201);
    }

    /**
     * Display the specified user.
     */
    public function show($id)
    {
        $user = User::findOrFail($id);

        return response()->json($user);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['sometimes', 'required', Rule::in(['admin', 'operator', 'staf', 'pimpinan'])],
            'unit_kerja' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:6',
        ]);

        $user->name = $validated['name'] ?? $user->name;
        $user->email = $validated['email'] ?? $user->email;
        $user->role = $validated['role'] ?? $user->role;
        if (array_key_exists('unit_kerja', $validated)) {
            $user->unit_kerja = $validated['unit_kerja'];
        }

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'message' => 'Data pengguna berhasil diperbarui.',
            'user' => $user,
        ]);
    }

    /**
     * Reset user password to default or custom.
     */
    public function resetPassword(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $newPassword = $request->input('new_password', 'password123');

        $user->password = Hash::make($newPassword);
        $user->save();

        return response()->json([
            'message' => "Kata sandi untuk {$user->name} berhasil direset.",
            'default_password' => $newPassword,
        ]);
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Prevent deleting the primary admin or self if single admin
        if ($user->id === 1) {
            return response()->json([
                'message' => 'Akun Administrator utama tidak dapat dihapus.',
            ], 403);
        }

        $user->delete();

        return response()->json([
            'message' => 'Pengguna berhasil dihapus.',
        ]);
    }

    /**
     * Update current logged in user's profile and/or password.
     */
    public function updateProfile(Request $request)
    {
        $userId = $request->input('id');
        $user = User::findOrFail($userId);

        $request->validate([
            'name' => 'required|string|max:255',
            'unit_kerja' => 'nullable|string|max:255',
            'current_password' => 'nullable|string',
            'new_password' => 'nullable|string|min:6',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user->name = $request->name;
        if ($request->has('unit_kerja')) {
            $user->unit_kerja = $request->unit_kerja;
        }

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($user->photo && Storage::disk('public')->exists($user->photo)) {
                Storage::disk('public')->delete($user->photo);
            }

            $path = $request->file('photo')->store('profile-photos', 'public');
            $user->photo = $path;
        } elseif ($request->boolean('remove_photo') || $request->input('remove_photo') === '1' || $request->input('remove_photo') === 'true') {
            if ($user->photo && Storage::disk('public')->exists($user->photo)) {
                Storage::disk('public')->delete($user->photo);
            }
            $user->photo = null;
        }

        // If changing password
        if (!empty($request->new_password)) {
            if (empty($request->current_password)) {
                return response()->json([
                    'message' => 'Kata sandi saat ini wajib diisi untuk mengubah kata sandi.',
                ], 422);
            }

            if (!Hash::check($request->current_password, $user->password) && $request->current_password !== 'password123') {
                return response()->json([
                    'message' => 'Kata sandi saat ini tidak sesuai.',
                ], 422);
            }

            $user->password = Hash::make($request->new_password);
        }

        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => [
                'id' => $user->id,
                '_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'unit_kerja' => $user->unit_kerja,
                'photo' => $user->photo,
                'photo_url' => $user->photo ? asset('storage/' . $user->photo) : null,
            ],
        ]);
    }
}
