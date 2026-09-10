<?php

namespace App\Http\Controllers;

use App\Models\PengajuanServis;
use App\Models\Renovasi;
use Illuminate\Http\Request;

class PengajuanServisController extends Controller
{
    public function index(Request $request)
    {
        $query = PengajuanServis::with('item.kategoriItem')->orderBy('id', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('nama_pemohon')) {
            $query->where('nama_pemohon', 'like', '%'.$request->nama_pemohon.'%');
        }

        if ($request->filled('unit_kerja')) {
            $query->where('unit_kerja', $request->unit_kerja);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'nullable|exists:items,id',
            'nama_barang_custom' => 'nullable|string|max:255',
            'nama_pemohon' => 'required|string|max:255',
            'nip_pemohon' => 'nullable|string|max:50',
            'unit_kerja' => 'required|string|max:255',
            'lokasi_barang' => 'nullable|string|max:255',
            'kategori_servis' => 'required|string|max:100',
            'deskripsi_kerusakan' => 'required|string',
            'tanggal_pengajuan' => 'required|date',
            'nomor_nota_dinas' => 'nullable|string|max:100',
            'estimasi_biaya' => 'nullable|numeric|min:0',
        ]);

        $pengajuan = PengajuanServis::create([
            'item_id' => $validated['item_id'] ?? null,
            'nama_barang_custom' => $validated['nama_barang_custom'] ?? null,
            'nama_pemohon' => $validated['nama_pemohon'],
            'nip_pemohon' => $validated['nip_pemohon'] ?? null,
            'unit_kerja' => $validated['unit_kerja'],
            'lokasi_barang' => $validated['lokasi_barang'] ?? null,
            'kategori_servis' => $validated['kategori_servis'],
            'deskripsi_kerusakan' => $validated['deskripsi_kerusakan'],
            'tanggal_pengajuan' => $validated['tanggal_pengajuan'],
            'nomor_nota_dinas' => $validated['nomor_nota_dinas'] ?? null,
            'status' => 'diajukan',
            'estimasi_biaya' => $validated['estimasi_biaya'] ?? null,
        ]);

        $pengajuan->load('item.kategoriItem');

        return response()->json($pengajuan, 201);
    }

    public function show($id)
    {
        $pengajuan = PengajuanServis::with('item.kategoriItem')->findOrFail($id);

        return response()->json($pengajuan);
    }

    /**
     * Tahap 1: Verifikasi oleh Operator TU / Unit
     */
    public function verify(Request $request, $id)
    {
        $pengajuan = PengajuanServis::findOrFail($id);

        $validated = $request->validate([
            'catatan_operator' => 'nullable|string',
            'verified_by_operator' => 'nullable|string|max:255',
            'estimasi_biaya' => 'nullable|numeric|min:0',
        ]);

        $pengajuan->update([
            'status' => 'diverifikasi_operator',
            'catatan_operator' => $validated['catatan_operator'] ?? 'Telah diverifikasi dan diteruskan ke Pimpinan untuk persetujuan.',
            'verified_by_operator' => $validated['verified_by_operator'] ?? 'Operator TU Unit',
            'tanggal_verifikasi_operator' => now(),
            'estimasi_biaya' => $validated['estimasi_biaya'] ?? $pengajuan->estimasi_biaya,
        ]);

        $pengajuan->load('item.kategoriItem');

        return response()->json([
            'message' => 'Pengajuan servis berhasil diverifikasi oleh Operator dan diteruskan ke Pimpinan.',
            'data' => $pengajuan,
        ]);
    }

    /**
     * Penolakan oleh Operator
     */
    public function rejectOperator(Request $request, $id)
    {
        $pengajuan = PengajuanServis::findOrFail($id);

        $pengajuan->update([
            'status' => 'ditolak_operator',
            'catatan_operator' => $request->catatan_operator ?? 'Usulan perbaikan tidak memenuhi kriteria / ditolak di tingkat Operator.',
            'verified_by_operator' => $request->verified_by_operator ?? 'Operator TU Unit',
            'tanggal_verifikasi_operator' => now(),
        ]);

        $pengajuan->load('item.kategoriItem');

        return response()->json([
            'message' => 'Pengajuan servis ditolak oleh Operator.',
            'data' => $pengajuan,
        ]);
    }

    /**
     * Tahap 2: Persetujuan Akhir oleh Pimpinan
     */
    public function approvePimpinan(Request $request, $id)
    {
        $pengajuan = PengajuanServis::findOrFail($id);

        $validated = $request->validate([
            'catatan_pimpinan' => 'nullable|string',
            'approved_by_pimpinan' => 'nullable|string|max:255',
        ]);

        $pengajuan->update([
            'status' => 'disetujui_pimpinan',
            'catatan_pimpinan' => $validated['catatan_pimpinan'] ?? 'Disetujui. Silakan diproses perbaikan sesuai ketentuan pengadaan/pemeliharaan.',
            'approved_by_pimpinan' => $validated['approved_by_pimpinan'] ?? 'Inspektur Jenderal Kemendagri',
            'tanggal_approval_pimpinan' => now(),
        ]);

        // Ubah status penggunaan barang jika ada item_id
        if ($pengajuan->item) {
            $pengajuan->item->update([
                'status_penggunaan' => 'dalam_perbaikan',
            ]);
        }

        $pengajuan->load('item.kategoriItem');

        return response()->json([
            'message' => 'Pengajuan servis berhasil disetujui oleh Pimpinan.',
            'data' => $pengajuan,
        ]);
    }

    /**
     * Penolakan oleh Pimpinan
     */
    public function rejectPimpinan(Request $request, $id)
    {
        $pengajuan = PengajuanServis::findOrFail($id);

        $pengajuan->update([
            'status' => 'ditolak_pimpinan',
            'catatan_pimpinan' => $request->catatan_pimpinan ?? 'Belum dapat disetujui oleh Pimpinan.',
            'approved_by_pimpinan' => $request->approved_by_pimpinan ?? 'Inspektur Jenderal Kemendagri',
            'tanggal_approval_pimpinan' => now(),
        ]);

        $pengajuan->load('item.kategoriItem');

        return response()->json([
            'message' => 'Pengajuan servis ditolak oleh Pimpinan.',
            'data' => $pengajuan,
        ]);
    }

    /**
     * Penyelesaian Servis (Pekerjaan Selesai)
     */
    public function selesai(Request $request, $id)
    {
        $pengajuan = PengajuanServis::findOrFail($id);

        $pengajuan->update([
            'status' => 'selesai',
        ]);

        if ($pengajuan->item) {
            $pengajuan->item->update([
                'kondisi' => 'baik',
                'status_penggunaan' => 'digunakan',
            ]);

            // Jika ada biaya dan opsi catat riwayat renovasi
            if ($request->boolean('catat_ke_renovasi') && $pengajuan->estimasi_biaya > 0) {
                Renovasi::create([
                    'item_id' => $pengajuan->item_id,
                    'tanggal_renovasi' => now()->toDateString(),
                    'biaya_renovasi' => $pengajuan->estimasi_biaya,
                    'tambah_umur_tahun' => 0,
                    'kapitalisasi' => false,
                    'deskripsi' => 'Perbaikan servis pengajuan dari '.$pengajuan->nama_pemohon.': '.$pengajuan->deskripsi_kerusakan,
                ]);
            }
        }

        $pengajuan->load('item.kategoriItem');

        return response()->json([
            'message' => 'Servis telah selesai dan barang siap digunakan kembali.',
            'data' => $pengajuan,
        ]);
    }

    public function destroy($id)
    {
        $pengajuan = PengajuanServis::findOrFail($id);
        $pengajuan->delete();

        return response()->json([
            'message' => 'Catatan pengajuan servis berhasil dihapus.',
        ]);
    }
}
