<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PegawaiController extends Controller
{
    /**
     * Display a listing of pegawais.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Pegawai::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%")
                    ->orWhere('jabatan', 'like', "%{$search}%")
                    ->orWhere('unit_kerja', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('unit_kerja') && $request->unit_kerja !== 'Semua Unit Kerja') {
            $query->where('unit_kerja', $request->unit_kerja);
        }

        if ($request->filled('status') && $request->status !== 'Semua Status') {
            $query->where('status', $request->status);
        }

        $pegawais = $query->orderBy('nama', 'asc')->get();

        return response()->json($pegawais);
    }

    /**
     * Store a newly created pegawai in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'nip' => 'nullable|string|max:100',
            'jabatan' => 'nullable|string|max:255',
            'unit_kerja' => 'nullable|string|max:255',
            'no_hp' => 'nullable|string|max:50',
            'email' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
            'keterangan' => 'nullable|string',
        ]);

        if (empty($validated['status'])) {
            $validated['status'] = (! empty($validated['nip']) && $validated['nip'] !== '-') ? 'PNS' : 'PTT / Non-ASN';
        }

        $pegawai = Pegawai::create($validated);

        return response()->json([
            'message' => 'Data pegawai berhasil ditambahkan.',
            'data' => $pegawai,
        ], 201);
    }

    /**
     * Display the specified pegawai.
     */
    public function show(int $id): JsonResponse
    {
        $pegawai = Pegawai::findOrFail($id);

        return response()->json($pegawai);
    }

    /**
     * Update the specified pegawai in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $pegawai = Pegawai::findOrFail($id);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'nip' => 'nullable|string|max:100',
            'jabatan' => 'nullable|string|max:255',
            'unit_kerja' => 'nullable|string|max:255',
            'no_hp' => 'nullable|string|max:50',
            'email' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
            'keterangan' => 'nullable|string',
        ]);

        $pegawai->update($validated);

        return response()->json([
            'message' => 'Data pegawai berhasil diperbarui.',
            'data' => $pegawai,
        ]);
    }

    /**
     * Remove the specified pegawai from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $pegawai = Pegawai::findOrFail($id);
        $pegawai->delete();

        return response()->json([
            'message' => 'Data pegawai berhasil dihapus.',
        ]);
    }

    /**
     * Batch import pegawai from parsed excel/csv data.
     */
    public function importBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.nama' => 'required|string|max:255',
            'items.*.nip' => 'nullable|string|max:100',
            'items.*.jabatan' => 'nullable|string|max:255',
            'items.*.unit_kerja' => 'nullable|string|max:255',
            'items.*.no_hp' => 'nullable|string|max:50',
            'items.*.email' => 'nullable|string|max:255',
            'items.*.status' => 'nullable|string|max:50',
            'items.*.keterangan' => 'nullable|string',
        ]);

        $createdCount = 0;
        $updatedCount = 0;

        foreach ($validated['items'] as $item) {
            $nama = trim($item['nama']);
            if (empty($nama) || strtolower($nama) === 'nama') {
                continue;
            }

            $nip = trim($item['nip'] ?? '');
            if ($nip === '-' || $nip === '0' || $nip === 'null') {
                $nip = null;
            }

            $jabatan = trim($item['jabatan'] ?? '');
            $unitKerja = trim($item['unit_kerja'] ?? '');
            if (empty($unitKerja)) {
                // Heuristic detection from jabatan text if unit_kerja is not explicit
                if (stripos($jabatan, 'Inspektorat I') !== false || stripos($jabatan, 'Irwil I') !== false) {
                    $unitKerja = 'Inspektorat Wilayah I';
                } elseif (stripos($jabatan, 'Inspektorat II') !== false || stripos($jabatan, 'Irwil II') !== false) {
                    $unitKerja = 'Inspektorat Wilayah II';
                } elseif (stripos($jabatan, 'Inspektorat III') !== false || stripos($jabatan, 'Irwil III') !== false) {
                    $unitKerja = 'Inspektorat Wilayah III';
                } elseif (stripos($jabatan, 'Inspektorat IV') !== false || stripos($jabatan, 'Irwil IV') !== false) {
                    $unitKerja = 'Inspektorat Wilayah IV';
                } elseif (stripos($jabatan, 'Inspektorat Khusus') !== false || stripos($jabatan, 'Iksus') !== false) {
                    $unitKerja = 'Inspektorat Khusus';
                } elseif (stripos($jabatan, 'Sekretariat') !== false || stripos($jabatan, 'Subbagian') !== false || stripos($jabatan, 'Bagian') !== false) {
                    $unitKerja = 'Sekretariat Itjen';
                } else {
                    $unitKerja = 'Sekretariat Itjen';
                }
            }

            $status = trim($item['status'] ?? '');
            if (empty($status)) {
                $status = (! empty($nip) && $nip !== '-') ? 'PNS' : 'PTT / Non-ASN';
            }

            // Find existing by NIP (if valid) or exact Name
            $existing = null;
            if (! empty($nip)) {
                $existing = Pegawai::where('nip', $nip)->first();
            }
            if (! $existing) {
                $existing = Pegawai::where('nama', $nama)->first();
            }

            $payload = [
                'nama' => $nama,
                'nip' => $nip,
                'jabatan' => $jabatan ?: null,
                'unit_kerja' => $unitKerja ?: 'Sekretariat Itjen',
                'no_hp' => ! empty($item['no_hp']) ? trim($item['no_hp']) : null,
                'email' => ! empty($item['email']) ? trim($item['email']) : null,
                'status' => $status,
                'keterangan' => ! empty($item['keterangan']) ? trim($item['keterangan']) : null,
            ];

            if ($existing) {
                $existing->update($payload);
                $updatedCount++;
            } else {
                Pegawai::create($payload);
                $createdCount++;
            }
        }

        return response()->json([
            'message' => "Import berhasil: {$createdCount} pegawai baru ditambahkan, {$updatedCount} data diperbarui.",
            'created_count' => $createdCount,
            'updated_count' => $updatedCount,
            'total_processed' => $createdCount + $updatedCount,
        ]);
    }
}
