<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function index(Request $request)
    {
        $query = Item::with(['kategoriItem', 'peminjamanWasriks' => function ($q) {
            $q->where('status', 'dipinjam');
        }]);

        // Filter berdasarkan Unit Kerja Itjen
        if ($request->filled('unit_kerja') && $request->unit_kerja !== 'Semua Unit Kerja') {
            $query->where('unit_kerja', $request->unit_kerja);
        }

        // Filter berdasarkan Lokasi Ruangan
        if ($request->filled('lokasi_ruangan')) {
            $query->where('lokasi_ruangan', $request->lokasi_ruangan);
        }

        // Filter berdasarkan Penanggung Jawab (untuk Auditor / Aset Saya)
        if ($request->filled('penanggung_jawab')) {
            $query->where('penanggung_jawab', 'like', '%'.$request->penanggung_jawab.'%');
        }

        // Filter status penggunaan
        if ($request->filled('status_penggunaan')) {
            $query->where('status_penggunaan', $request->status_penggunaan);
        }

        // Search kata kunci
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('itemName', 'like', "%{$search}%")
                    ->orWhere('itemCode', 'like', "%{$search}%")
                    ->orWhere('nup', 'like', "%{$search}%")
                    ->orWhere('kode_bmn', 'like', "%{$search}%")
                    ->orWhere('merk_tipe', 'like', "%{$search}%")
                    ->orWhere('nomor_seri', 'like', "%{$search}%")
                    ->orWhere('penanggung_jawab', 'like', "%{$search}%");
            });
        }

        $items = $query->orderBy('id', 'desc')->get();

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kategoriItem' => 'nullable|exists:kategori_items,id',
            'kategori_item_id' => 'nullable|exists:kategori_items,id',
            'itemCode' => 'required|string|unique:items,itemCode',
            'nup' => 'nullable|string|max:50',
            'kode_bmn' => 'nullable|string|max:100',
            'itemName' => 'required|string',
            'merk_tipe' => 'nullable|string|max:255',
            'nomor_seri' => 'nullable|string|max:100',
            'tahunPerolehan' => 'required|numeric',
            'nilaiPerolehan' => 'required|numeric|min:0',
            'kondisi' => 'required|in:baik,evaluasi,perhatian',
            'status_penggunaan' => 'nullable|in:digunakan,dipinjam_wasrik,rusak_berat,dalam_pemeliharaan',
            'lokasi_ruangan' => 'nullable|string|max:255',
            'unit_kerja' => 'nullable|string|max:255',
            'penanggung_jawab' => 'nullable|string|max:255',
        ]);

        $kategoriId = $request->kategoriItem ?? $request->kategori_item_id;

        $item = Item::create([
            'kategori_item_id' => $kategoriId,
            'itemCode' => $validated['itemCode'],
            'nup' => $validated['nup'] ?? null,
            'kode_bmn' => $validated['kode_bmn'] ?? null,
            'itemName' => $validated['itemName'],
            'merk_tipe' => $validated['merk_tipe'] ?? null,
            'nomor_seri' => $validated['nomor_seri'] ?? null,
            'tahunPerolehan' => $validated['tahunPerolehan'],
            'nilaiPerolehan' => $validated['nilaiPerolehan'],
            'kondisi' => $validated['kondisi'],
            'status_penggunaan' => $validated['status_penggunaan'] ?? 'digunakan',
            'lokasi_ruangan' => $validated['lokasi_ruangan'] ?? null,
            'unit_kerja' => $validated['unit_kerja'] ?? 'Sekretariat Itjen',
            'penanggung_jawab' => $validated['penanggung_jawab'] ?? null,
        ]);

        $item->load('kategoriItem');

        return response()->json($item, 201);
    }

    public function show($id)
    {
        $item = Item::with([
            'kategoriItem',
            'mutasiLokasis' => function ($query) {
                $query->orderBy('tanggal_mutasi', 'desc');
            },
            'peminjamanWasriks' => function ($query) {
                $query->orderBy('tanggal_berangkat', 'desc');
            },
        ])->findOrFail($id);

        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = Item::findOrFail($id);

        $validated = $request->validate([
            'kategoriItem' => 'nullable|exists:kategori_items,id',
            'kategori_item_id' => 'nullable|exists:kategori_items,id',
            'itemCode' => 'required|string|unique:items,itemCode,'.$id,
            'nup' => 'nullable|string|max:50',
            'kode_bmn' => 'nullable|string|max:100',
            'itemName' => 'required|string',
            'merk_tipe' => 'nullable|string|max:255',
            'nomor_seri' => 'nullable|string|max:100',
            'tahunPerolehan' => 'required|numeric',
            'nilaiPerolehan' => 'required|numeric|min:0',
            'kondisi' => 'required|in:baik,evaluasi,perhatian',
            'status_penggunaan' => 'nullable|in:digunakan,dipinjam_wasrik,rusak_berat,dalam_pemeliharaan',
            'lokasi_ruangan' => 'nullable|string|max:255',
            'unit_kerja' => 'nullable|string|max:255',
            'penanggung_jawab' => 'nullable|string|max:255',
        ]);

        $kategoriId = $request->kategoriItem ?? $request->kategori_item_id ?? $item->kategori_item_id;

        $item->update([
            'kategori_item_id' => $kategoriId,
            'itemCode' => $validated['itemCode'],
            'nup' => $validated['nup'] ?? $item->nup,
            'kode_bmn' => $validated['kode_bmn'] ?? $item->kode_bmn,
            'itemName' => $validated['itemName'],
            'merk_tipe' => $validated['merk_tipe'] ?? $item->merk_tipe,
            'nomor_seri' => $validated['nomor_seri'] ?? $item->nomor_seri,
            'tahunPerolehan' => $validated['tahunPerolehan'],
            'nilaiPerolehan' => $validated['nilaiPerolehan'],
            'kondisi' => $validated['kondisi'],
            'status_penggunaan' => $validated['status_penggunaan'] ?? $item->status_penggunaan,
            'lokasi_ruangan' => $validated['lokasi_ruangan'] ?? $item->lokasi_ruangan,
            'unit_kerja' => $validated['unit_kerja'] ?? $item->unit_kerja,
            'penanggung_jawab' => $validated['penanggung_jawab'] ?? $item->penanggung_jawab,
        ]);

        $item->load('kategoriItem');

        return response()->json($item);
    }

    public function destroy($id)
    {
        $item = Item::findOrFail($id);
        $item->delete();

        return response()->json([
            'message' => 'Barang berhasil dihapus.',
        ]);
    }

    public function importBatch(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.itemName' => 'required|string',
            'items.*.itemCode' => 'required|string',
        ]);

        $imported = 0;
        $updated = 0;

        foreach ($request->items as $row) {
            $item = Item::updateOrCreate(
                ['itemCode' => trim($row['itemCode'])],
                [
                    'kategori_item_id' => $row['kategori_item_id'] ?? 1,
                    'nup' => $row['nup'] ?? '0001',
                    'kode_bmn' => $row['kode_bmn'] ?? '3.05.01.04.001',
                    'itemName' => $row['itemName'],
                    'merk_tipe' => $row['merk_tipe'] ?? null,
                    'nomor_seri' => $row['nomor_seri'] ?? null,
                    'tahunPerolehan' => isset($row['tahunPerolehan']) ? (int) $row['tahunPerolehan'] : (int) date('Y'),
                    'nilaiPerolehan' => isset($row['nilaiPerolehan']) ? (float) $row['nilaiPerolehan'] : 0,
                    'kondisi' => in_array($row['kondisi'] ?? '', ['baik', 'evaluasi', 'perhatian']) ? $row['kondisi'] : 'baik',
                    'status_penggunaan' => in_array($row['status_penggunaan'] ?? '', ['digunakan', 'dipinjam_wasrik', 'rusak_berat', 'dalam_pemeliharaan']) ? $row['status_penggunaan'] : 'digunakan',
                    'lokasi_ruangan' => $row['lokasi_ruangan'] ?? 'Belum Ditentukan',
                    'unit_kerja' => $row['unit_kerja'] ?? 'Sekretariat Itjen',
                    'penanggung_jawab' => $row['penanggung_jawab'] ?? null,
                ]
            );

            if ($item->wasRecentlyCreated) {
                $imported++;
            } else {
                $updated++;
            }
        }

        return response()->json([
            'message' => "Berhasil memproses {$imported} aset baru dan {$updated} pembaruan data BMN.",
            'imported_count' => $imported,
            'updated_count' => $updated,
        ]);
    }
}
