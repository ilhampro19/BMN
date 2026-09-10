<?php

namespace App\Http\Controllers;

use App\Models\KategoriItem;
use Illuminate\Http\Request;

class KategoriItemController extends Controller
{
    public function index()
    {
        return response()->json(KategoriItem::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kategoriItemCode' => 'required|string|unique:kategori_items,kategoriItemCode',
            'kategoriItemName' => 'required|string',
            'umurEkonomisTahun' => 'required|numeric|min:1',
            'tarifPenyusutanPersen' => 'required|numeric|min:0',
        ]);

        $kategori = KategoriItem::create($validated);

        return response()->json($kategori, 201);
    }

    public function show($id)
    {
        $kategori = KategoriItem::findOrFail($id);

        return response()->json($kategori);
    }

    public function update(Request $request, $id)
    {
        $kategori = KategoriItem::findOrFail($id);

        $validated = $request->validate([
            'kategoriItemCode' => 'required|string|unique:kategori_items,kategoriItemCode,'.$id,
            'kategoriItemName' => 'required|string',
            'umurEkonomisTahun' => 'required|numeric|min:1',
            'tarifPenyusutanPersen' => 'required|numeric|min:0',
        ]);

        $kategori->update($validated);

        return response()->json($kategori);
    }

    public function destroy($id)
    {
        $kategori = KategoriItem::findOrFail($id);
        $kategori->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus.',
        ]);
    }
}
