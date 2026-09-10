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
            'nama_peminjam' => 'required|string|max:255',
            'nip_peminjam' => 'nullable|string|max:50',
            'jabatan_tim' => 'nullable|string|max:100',
            'no_surat_tugas' => 'required|string|max:255',
            'tujuan_wilayah' => 'required|string|max:255',
            'tanggal_berangkat' => 'required|date',
            'tanggal_kembali' => 'required|date|after_or_equal:tanggal_berangkat',
            'keterangan' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $item = Item::findOrFail($validated['item_id']);
        $initialStatus = $request->status ?? 'diajukan';

        $peminjaman = PeminjamanWasrik::create([
            'item_id' => $validated['item_id'],
            'nama_peminjam' => $validated['nama_peminjam'],
            'nip_peminjam' => $validated['nip_peminjam'] ?? null,
            'jabatan_tim' => $validated['jabatan_tim'] ?? 'Anggota Tim Wasrik',
            'no_surat_tugas' => $validated['no_surat_tugas'],
            'tujuan_wilayah' => $validated['tujuan_wilayah'],
            'tanggal_berangkat' => $validated['tanggal_berangkat'],
            'tanggal_kembali' => $validated['tanggal_kembali'],
            'status' => $initialStatus,
            'keterangan' => $validated['keterangan'] ?? null,
        ]);

        // Jika langsung dipinjam, update status aset
        if ($initialStatus === 'dipinjam') {
            $item->update([
                'status_penggunaan' => 'dipinjam_wasrik',
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
                'status_penggunaan' => 'dipinjam_wasrik',
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
