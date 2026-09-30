<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\PeminjamanWasrik;
use Illuminate\Http\Request;

class PeminjamanWasrikController extends Controller
{
    public function index(Request $request)
    {
        $query = PeminjamanWasrik::with('item.kategoriItem')->orderBy('id', 'desc');

        if ($request->filled('tipe_peminjaman')) {
            $query->where('tipe_peminjaman', $request->tipe_peminjaman);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('nama_peminjam')) {
            $query->where('nama_peminjam', 'like', '%'.$request->nama_peminjam.'%');
        }

        if ($request->filled('nip_peminjam')) {
            $query->where('nip_peminjam', $request->nip_peminjam);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:items,id',
            'tipe_peminjaman' => 'nullable|in:wasrik,kendaraan',
            'jenis_kendaraan' => 'nullable|string|max:100',
            'nomor_polisi' => 'nullable|string|max:50',
            'warna' => 'nullable|string|max:50',
            'no_rangka' => 'nullable|string|max:100',
            'no_mesin' => 'nullable|string|max:100',
            'tahun_pembuatan' => 'nullable|string|max:20',
            'kelengkapan' => 'nullable',
            'nama_peminjam' => 'required|string|max:255',
            'nip_peminjam' => 'nullable|string|max:50',
            'jabatan_tim' => 'nullable|string|max:255',
            'no_surat_tugas' => 'required|string|max:255',
            'tujuan_wilayah' => 'required|string|max:255',
            'tanggal_berangkat' => 'required|date',
            'tanggal_kembali' => 'required|date|after_or_equal:tanggal_berangkat',
            'keterangan' => 'nullable|string',
            'status' => 'nullable|string',
            'pihak_pertama_nama' => 'nullable|string|max:255',
            'pihak_pertama_nip' => 'nullable|string|max:50',
            'pihak_pertama_jabatan' => 'nullable|string|max:255',
            'mengetahui_nama' => 'nullable|string|max:255',
            'mengetahui_nip' => 'nullable|string|max:50',
            'mengetahui_jabatan' => 'nullable|string|max:255',
        ]);

        $item = Item::findOrFail($validated['item_id']);
        $initialStatus = $request->status ?? 'diajukan';
        $tipePeminjaman = $validated['tipe_peminjaman'] ?? 'wasrik';

        $peminjaman = PeminjamanWasrik::create([
            'item_id' => $validated['item_id'],
            'tipe_peminjaman' => $tipePeminjaman,
            'jenis_kendaraan' => $validated['jenis_kendaraan'] ?? null,
            'nomor_polisi' => $validated['nomor_polisi'] ?? null,
            'warna' => $validated['warna'] ?? null,
            'no_rangka' => $validated['no_rangka'] ?? null,
            'no_mesin' => $validated['no_mesin'] ?? null,
            'tahun_pembuatan' => $validated['tahun_pembuatan'] ?? null,
            'kelengkapan' => $validated['kelengkapan'] ?? null,
            'nama_peminjam' => $validated['nama_peminjam'],
            'nip_peminjam' => $validated['nip_peminjam'] ?? null,
            'jabatan_tim' => $validated['jabatan_tim'] ?? ($tipePeminjaman === 'kendaraan' ? 'Penerima Kendaraan Dinas' : 'Anggota Tim Wasrik'),
            'no_surat_tugas' => $validated['no_surat_tugas'],
            'tujuan_wilayah' => $validated['tujuan_wilayah'],
            'tanggal_berangkat' => $validated['tanggal_berangkat'],
            'tanggal_kembali' => $validated['tanggal_kembali'],
            'status' => $initialStatus,
            'keterangan' => $validated['keterangan'] ?? null,
            'pihak_pertama_nama' => $validated['pihak_pertama_nama'] ?? 'Andi Agung Febrianto, S.STP, M.Kessos',
            'pihak_pertama_nip' => $validated['pihak_pertama_nip'] ?? '19900217 201206 1 002',
            'pihak_pertama_jabatan' => $validated['pihak_pertama_jabatan'] ?? 'Kepala Bagian Umum dan Keuangan pada Inspektorat Jenderal Kementerian Dalam Negeri',
            'mengetahui_nama' => $validated['mengetahui_nama'] ?? 'Dr. Ir. Bachril Bakri, M.App.Sc',
            'mengetahui_nip' => $validated['mengetahui_nip'] ?? '19661122 199303 1 001',
            'mengetahui_jabatan' => $validated['mengetahui_jabatan'] ?? 'Sekretaris Inspektorat Jenderal',
        ]);

        // Jika langsung dipinjam, update status aset
        if ($initialStatus === 'dipinjam') {
            $item->update([
                'status_penggunaan' => $tipePeminjaman === 'kendaraan' ? 'dipinjam_kendaraan' : 'dipinjam_wasrik',
            ]);
        }

        $peminjaman->load('item.kategoriItem');

        return response()->json($peminjaman, 201);
    }

    public function show($id)
    {
        $peminjaman = PeminjamanWasrik::with('item.kategoriItem')->findOrFail($id);

        return response()->json($peminjaman);
    }

    public function approve(Request $request, $id)
    {
        $peminjaman = PeminjamanWasrik::findOrFail($id);

        $peminjaman->update([
            'status' => 'dipinjam',
            'catatan_approval' => $request->catatan_approval ?? 'Disetujui untuk pelaksanaan penugasan wasrik.',
            'approved_by' => $request->approved_by ?? 'Inspektur Jenderal Kemendagri',
        ]);

        if ($peminjaman->item) {
            $peminjaman->item->update([
                'status_penggunaan' => $peminjaman->tipe_peminjaman === 'kendaraan' ? 'dipinjam_kendaraan' : 'dipinjam_wasrik',
            ]);
        }

        $peminjaman->load('item.kategoriItem');

        return response()->json([
            'message' => 'Permohonan peminjaman berhasil disetujui.',
            'data' => $peminjaman,
        ]);
    }

    public function reject(Request $request, $id)
    {
        $peminjaman = PeminjamanWasrik::findOrFail($id);

        $peminjaman->update([
            'status' => 'ditolak',
            'catatan_approval' => $request->catatan_approval ?? 'Permohonan belum dapat disetujui.',
            'approved_by' => $request->approved_by ?? 'Inspektur Jenderal Kemendagri',
        ]);

        if ($peminjaman->item) {
            $peminjaman->item->update([
                'status_penggunaan' => 'digunakan',
            ]);
        }

        $peminjaman->load('item.kategoriItem');

        return response()->json([
            'message' => 'Permohonan peminjaman telah ditolak.',
            'data' => $peminjaman,
        ]);
    }

    public function kembali(Request $request, $id)
    {
        $peminjaman = PeminjamanWasrik::findOrFail($id);

        $validated = $request->validate([
            'kondisi_kembali' => 'required|in:baik,evaluasi,perhatian',
            'keterangan' => 'nullable|string',
        ]);

        $peminjaman->update([
            'status' => 'kembali',
            'kondisi_kembali' => $validated['kondisi_kembali'],
            'keterangan' => $validated['keterangan'] ?? $peminjaman->keterangan,
        ]);

        // Kembalikan status aset
        if ($peminjaman->item) {
            $peminjaman->item->update([
                'status_penggunaan' => 'digunakan',
                'kondisi' => $validated['kondisi_kembali'],
            ]);
        }

        $peminjaman->load('item.kategoriItem');

        return response()->json($peminjaman);
    }

    public function destroy($id)
    {
        $peminjaman = PeminjamanWasrik::findOrFail($id);

        if ($peminjaman->status === 'dipinjam' && $peminjaman->item) {
            $peminjaman->item->update([
                'status_penggunaan' => 'digunakan',
            ]);
        }

        $peminjaman->delete();

        return response()->json([
            'message' => 'Catatan peminjaman wasrik berhasil dihapus.',
        ]);
    }
}
