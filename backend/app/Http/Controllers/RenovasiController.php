<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Renovasi;
use Illuminate\Http\Request;

class RenovasiController extends Controller
{
    public function index()
    {
        $renovasis = Renovasi::with('item.kategoriItem')
            ->orderBy('tanggal_renovasi', 'desc')
            ->get();

        return response()->json($renovasis);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required_without:item|nullable|exists:items,id',
            'item' => 'required_without:item_id|nullable|exists:items,id',
            'tanggal_renovasi' => 'required|date',
            'biaya_renovasi' => 'required|numeric|min:0',
            'tambah_umur_tahun' => 'nullable|integer|min:0',
            'kapitalisasi' => 'nullable|boolean',
            'deskripsi' => 'nullable|string',
        ]);

        $itemId = $request->item_id ?? $request->item;
        $isKapitalisasi = $request->has('kapitalisasi') ? filter_var($request->kapitalisasi, FILTER_VALIDATE_BOOLEAN) : true;
        $tambahUmur = (int) ($request->tambah_umur_tahun ?? 0);

        $item = Item::findOrFail($itemId);

        // Jika dikapitalisasi, tambahkan nilai perolehan & pulihkan status kondisi barang ke 'baik'
        if ($isKapitalisasi) {
            $item->nilaiPerolehan += (float) $validated['biaya_renovasi'];
            $item->kondisi = 'baik';
            $item->status_penggunaan = 'digunakan';
            $item->save();
        }

        $renovasi = Renovasi::create([
            'item_id' => $itemId,
            'tanggal_renovasi' => $validated['tanggal_renovasi'],
            'biaya_renovasi' => $validated['biaya_renovasi'],
            'tambah_umur_tahun' => $tambahUmur,
            'kapitalisasi' => $isKapitalisasi,
            'deskripsi' => $validated['deskripsi'] ?? null,
        ]);

        $renovasi->load('item.kategoriItem');

        return response()->json($renovasi, 201);
    }

    public function destroy($id)
    {
        $renovasi = Renovasi::findOrFail($id);

        // Rollback nilai perolehan barang jika sebelumnya dikapitalisasi
        if ($renovasi->kapitalisasi) {
            $item = Item::find($renovasi->item_id);
            if ($item) {
                $item->nilaiPerolehan = max(0, $item->nilaiPerolehan - (float) $renovasi->biaya_renovasi);
                $item->save();
            }
        }

        $renovasi->delete();

        return response()->json([
            'message' => 'Riwayat renovasi berhasil dihapus.',
        ]);
    }
}
