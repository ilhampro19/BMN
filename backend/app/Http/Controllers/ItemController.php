<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\KategoriItem;
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

        // Filter sifat aset (terikat_ruangan vs bergerak)
        if ($request->filled('sifat_aset')) {
            $query->where('sifat_aset', $request->sifat_aset);
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
                    ->orWhere('nomor_polisi', 'like', "%{$search}%")
                    ->orWhere('no_rangka', 'like', "%{$search}%")
                    ->orWhere('no_mesin', 'like', "%{$search}%")
                    ->orWhere('warna', 'like', "%{$search}%")
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
            'jenis_kendaraan' => 'nullable|string|max:100',
            'merk_tipe' => 'nullable|string|max:255',
            'nomor_seri' => 'nullable|string|max:100',
            'nomor_polisi' => 'nullable|string|max:50',
            'no_rangka' => 'nullable|string|max:100',
            'no_mesin' => 'nullable|string|max:100',
            'warna' => 'nullable|string|max:100',
            'kelengkapan_standar' => 'nullable|array',
            'tahunPerolehan' => 'required|numeric',
            'nilaiPerolehan' => 'required|numeric|min:0',
            'nilai_buku' => 'nullable|numeric|min:0',
            'kondisi' => 'required|in:baik,evaluasi,perhatian',
            'status_penggunaan' => 'nullable|in:digunakan,dipinjam,dipinjam_wasrik,rusak_berat,dalam_pemeliharaan,tersedia',
            'sifat_aset' => 'nullable|string|max:50',
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
            'jenis_kendaraan' => $validated['jenis_kendaraan'] ?? null,
            'merk_tipe' => $validated['merk_tipe'] ?? null,
            'nomor_seri' => $validated['nomor_seri'] ?? null,
            'nomor_polisi' => $validated['nomor_polisi'] ?? null,
            'no_rangka' => $validated['no_rangka'] ?? null,
            'no_mesin' => $validated['no_mesin'] ?? null,
            'warna' => $validated['warna'] ?? null,
            'kelengkapan_standar' => $validated['kelengkapan_standar'] ?? null,
            'tahunPerolehan' => $validated['tahunPerolehan'],
            'nilaiPerolehan' => $validated['nilaiPerolehan'],
            'nilai_buku' => $validated['nilai_buku'] ?? null,
            'kondisi' => $validated['kondisi'],
            'status_penggunaan' => $validated['status_penggunaan'] ?? 'digunakan',
            'sifat_aset' => $validated['sifat_aset'] ?? 'terikat_ruangan',
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
            'jenis_kendaraan' => 'nullable|string|max:100',
            'merk_tipe' => 'nullable|string|max:255',
            'nomor_seri' => 'nullable|string|max:100',
            'nomor_polisi' => 'nullable|string|max:50',
            'no_rangka' => 'nullable|string|max:100',
            'no_mesin' => 'nullable|string|max:100',
            'warna' => 'nullable|string|max:100',
            'kelengkapan_standar' => 'nullable|array',
            'tahunPerolehan' => 'required|numeric',
            'nilaiPerolehan' => 'required|numeric|min:0',
            'nilai_buku' => 'nullable|numeric|min:0',
            'kondisi' => 'required|in:baik,evaluasi,perhatian',
            'status_penggunaan' => 'nullable|in:digunakan,dipinjam,dipinjam_wasrik,rusak_berat,dalam_pemeliharaan,tersedia',
            'sifat_aset' => 'nullable|string|max:50',
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
            'jenis_kendaraan' => $validated['jenis_kendaraan'] ?? $item->jenis_kendaraan,
            'merk_tipe' => $validated['merk_tipe'] ?? $item->merk_tipe,
            'nomor_seri' => $validated['nomor_seri'] ?? $item->nomor_seri,
            'nomor_polisi' => $validated['nomor_polisi'] ?? $item->nomor_polisi,
            'no_rangka' => $validated['no_rangka'] ?? $item->no_rangka,
            'no_mesin' => $validated['no_mesin'] ?? $item->no_mesin,
            'warna' => $validated['warna'] ?? $item->warna,
            'kelengkapan_standar' => $validated['kelengkapan_standar'] ?? $item->kelengkapan_standar,
            'tahunPerolehan' => $validated['tahunPerolehan'],
            'nilaiPerolehan' => $validated['nilaiPerolehan'],
            'nilai_buku' => $validated['nilai_buku'] ?? $item->nilai_buku,
            'kondisi' => $validated['kondisi'],
            'status_penggunaan' => $validated['status_penggunaan'] ?? $item->status_penggunaan,
            'sifat_aset' => $validated['sifat_aset'] ?? $item->sifat_aset ?? 'terikat_ruangan',
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

        // Preload all kategori
        $kategoriByCode = KategoriItem::all()->keyBy('kategoriItemCode');

        $kategoriKndId = $kategoriByCode['KAT-KND']?->id ?? 2;
        $kategoriTikId = $kategoriByCode['KAT-TIK']?->id ?? 1;
        $kategoriMblId = $kategoriByCode['KAT-MBL']?->id ?? 3;
        $kategoriBgnId = $kategoriByCode['KAT-BGN']?->id ?? 4;

        /** Map Jenis BMN (kolom SIMAN) ke kategori_item_id */
        $jenisBmnKategoriMap = [
            'TANAH' => $kategoriBgnId,
            'ALAT BESAR' => $kategoriMblId,
            'ALAT ANGKUTAN BERMOTOR' => $kategoriKndId,
            'MESIN PERALATAN NON TIK' => $kategoriMblId,
            'MESIN PERALATAN KHUSUS TIK' => $kategoriTikId,
            'BANGUNAN DAN GEDUNG' => $kategoriBgnId,
            'ASET TAK BERWUJUD' => $kategoriTikId,
        ];

        /** Map Jenis BMN ke sifat_aset */
        $jenisBmnSifatMap = [
            'TANAH' => 'terikat_ruangan',
            'ALAT BESAR' => 'terikat_ruangan',
            'ALAT ANGKUTAN BERMOTOR' => 'bergerak',
            'MESIN PERALATAN NON TIK' => 'terikat_ruangan',
            'MESIN PERALATAN KHUSUS TIK' => 'bergerak',
            'BANGUNAN DAN GEDUNG' => 'terikat_ruangan',
            'ASET TAK BERWUJUD' => 'terikat_ruangan',
        ];

        foreach ($request->items as $row) {
            $jenisBmn = strtoupper(trim($row['jenis_bmn'] ?? ''));

            // Resolve kategori: jenis_bmn map → explicit id → pattern detection
            if ($jenisBmn && isset($jenisBmnKategoriMap[$jenisBmn])) {
                $kategoriId = $jenisBmnKategoriMap[$jenisBmn];
            } elseif (! empty($row['kategori_item_id'])) {
                $kategoriId = (int) $row['kategori_item_id'];
            } else {
                $isKendaraan = ! empty($row['nomor_polisi'])
                    || ! empty($row['jenis_kendaraan'])
                    || ! empty($row['no_rangka'])
                    || (isset($row['kode_bmn']) && (str_starts_with($row['kode_bmn'], '3.01') || str_starts_with($row['kode_bmn'], '3.02')));
                $kategoriId = $isKendaraan ? $kategoriKndId : $kategoriMblId;
            }

            // Resolve sifat_aset
            if ($jenisBmn && isset($jenisBmnSifatMap[$jenisBmn])) {
                $sifatAset = $jenisBmnSifatMap[$jenisBmn];
            } elseif (! empty($row['sifat_aset'])) {
                $sifatAset = $row['sifat_aset'];
            } else {
                $sifatAset = ($kategoriId === $kategoriKndId) ? 'bergerak' : 'terikat_ruangan';
            }

            $isKendaraanFinal = $kategoriId === $kategoriKndId;

            // Kelengkapan standar
            $kelengkapan = null;
            if (isset($row['kelengkapan_standar'])) {
                if (is_array($row['kelengkapan_standar'])) {
                    $kelengkapan = $row['kelengkapan_standar'];
                } elseif (is_string($row['kelengkapan_standar']) && trim($row['kelengkapan_standar']) !== '') {
                    $kelengkapan = array_values(array_filter(array_map('trim', explode(',', $row['kelengkapan_standar']))));
                }
            }

            // Kondisi normalization (SIMAN: "Baik" / "Rusak Berat")
            $kondisiRaw = strtolower(trim($row['kondisi'] ?? ''));
            if (str_contains($kondisiRaw, 'berat')) {
                $kondisi = 'perhatian';
            } elseif (str_contains($kondisiRaw, 'ringan') || str_contains($kondisiRaw, 'sedang')) {
                $kondisi = 'evaluasi';
            } elseif (in_array($kondisiRaw, ['baik', 'evaluasi', 'perhatian'])) {
                $kondisi = $kondisiRaw;
            } else {
                $kondisi = 'baik';
            }

            // Status penggunaan normalization
            $validStatuses = ['digunakan', 'dipinjam', 'dipinjam_wasrik', 'rusak_berat', 'dalam_pemeliharaan', 'tersedia'];
            $statusRaw = strtolower(str_replace(' ', '_', trim($row['status_penggunaan'] ?? '')));
            $statusPenggunaan = in_array($statusRaw, $validStatuses) ? $statusRaw : ($isKendaraanFinal ? 'tersedia' : 'digunakan');

            $item = Item::updateOrCreate(
                ['itemCode' => trim($row['itemCode'])],
                [
                    'kategori_item_id' => $kategoriId,
                    'nup' => $row['nup'] ?? '0001',
                    'kode_bmn' => $row['kode_bmn'] ?? ($isKendaraanFinal ? '3.02.01.01.002' : '3.05.01.04.001'),
                    'itemName' => $row['itemName'],
                    'jenis_kendaraan' => $row['jenis_kendaraan'] ?? ($isKendaraanFinal ? 'Mobil Dinas Operasional' : null),
                    'merk_tipe' => $row['merk_tipe'] ?? null,
                    'nomor_seri' => $row['nomor_seri'] ?? ($row['no_rangka'] ?? null),
                    'nomor_polisi' => $row['nomor_polisi'] ?? null,
                    'no_rangka' => $row['no_rangka'] ?? null,
                    'no_mesin' => $row['no_mesin'] ?? null,
                    'warna' => $row['warna'] ?? null,
                    'kelengkapan_standar' => $kelengkapan,
                    'tahunPerolehan' => isset($row['tahunPerolehan']) ? (int) $row['tahunPerolehan'] : (int) date('Y'),
                    'nilaiPerolehan' => isset($row['nilaiPerolehan']) ? (float) $row['nilaiPerolehan'] : 0,
                    'nilai_buku' => isset($row['nilai_buku']) ? (float) $row['nilai_buku'] : null,
                    'kondisi' => $kondisi,
                    'status_penggunaan' => $statusPenggunaan,
                    'sifat_aset' => $sifatAset,
                    'lokasi_ruangan' => $row['lokasi_ruangan'] ?? ($isKendaraanFinal ? 'Pool Kendaraan Dinas Gedung B' : 'Belum berlokasi'),
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
