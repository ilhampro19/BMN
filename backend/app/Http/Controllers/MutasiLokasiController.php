<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\MutasiLokasi;
use Illuminate\Http\Request;

class MutasiLokasiController extends Controller
{
    public function index(Request $request)
    {
        $query = MutasiLokasi::with('item.kategoriItem')
            ->orderBy('tanggal_mutasi', 'desc')
            ->orderBy('created_at', 'desc');

        if ($request->filled('status_approval')) {
            $query->where('status_approval', $request->status_approval);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required_without:item|nullable|exists:items,id',
            'item' => 'required_without:item_id|nullable|exists:items,id',
            'lokasi_tujuan' => 'required|string|max:255',
            'tanggal_mutasi' => 'required|date',
            'penanggung_jawab' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string',
            'status_approval' => 'nullable|string',
        ]);

        $itemId = $request->item_id ?? $request->item;
        $item = Item::findOrFail($itemId);

        $lokasiAsal = $item->lokasi_ruangan ?: 'Belum Ditentukan';
        $statusApproval = $request->status_approval ?? 'menunggu';

        $mutasi = MutasiLokasi::create([
            'item_id' => $itemId,
            'lokasi_asal' => $lokasiAsal,
            'lokasi_tujuan' => $validated['lokasi_tujuan'],
            'tanggal_mutasi' => $validated['tanggal_mutasi'],
            'penanggung_jawab' => $validated['penanggung_jawab'] ?? null,
            'keterangan' => $validated['keterangan'] ?? null,
            'status_approval' => $statusApproval,
        ]);

        // Jika langsung disetujui, update lokasi item sekarang
        if ($statusApproval === 'disetujui') {
            $item->lokasi_ruangan = $validated['lokasi_tujuan'];
            if (! empty($validated['penanggung_jawab'])) {
                $item->penanggung_jawab = $validated['penanggung_jawab'];
            }
            $item->save();
        }

        $mutasi->load('item.kategoriItem');

        return response()->json($mutasi, 201);
    }

    public function approve(Request $request, $id)
    {
        $mutasi = MutasiLokasi::findOrFail($id);

        $mutasi->update([
            'status_approval' => 'disetujui',
            'catatan_approval' => $request->catatan_approval ?? 'Disetujui pemindahan lokasi BMN.',
            'approved_by' => $request->approved_by ?? 'Inspektur Jenderal Kemendagri',
        ]);

        if ($mutasi->item) {
            $mutasi->item->lokasi_ruangan = $mutasi->lokasi_tujuan;
            if (! empty($mutasi->penanggung_jawab)) {
                $mutasi->item->penanggung_jawab = $mutasi->penanggung_jawab;
            }
            $mutasi->item->save();
        }

        $mutasi->load('item.kategoriItem');

        return response()->json([
            'message' => 'Mutasi aset berhasil disetujui dan lokasi resmi diperbarui.',
            'data' => $mutasi,
        ]);
    }

    public function reject(Request $request, $id)
    {
        $mutasi = MutasiLokasi::findOrFail($id);

        $mutasi->update([
            'status_approval' => 'ditolak',
            'catatan_approval' => $request->catatan_approval ?? 'Usulan mutasi belum dapat disetujui.',
            'approved_by' => $request->approved_by ?? 'Inspektur Jenderal Kemendagri',
        ]);

        $mutasi->load('item.kategoriItem');

        return response()->json([
            'message' => 'Usulan mutasi telah ditolak.',
            'data' => $mutasi,
        ]);
    }

    public function destroy($id)
    {
        $mutasi = MutasiLokasi::findOrFail($id);
        $mutasi->delete();

        return response()->json([
            'message' => 'Catatan riwayat mutasi berhasil dihapus.',
        ]);
    }
}
