<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Penyusutan;
use Illuminate\Http\Request;

class PenyusutanController extends Controller
{
    public function index()
    {
        $penyusutans = Penyusutan::with('item.kategoriItem')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($penyusutans);
    }

    public function store(Request $request)
    {
        $request->validate([
            'item' => 'required|exists:items,id',
            'tahun' => 'required|numeric',
        ]);

        $item = Item::with('kategoriItem')->findOrFail($request->item);
        $tahun = (int) $request->tahun;

        if ($tahun < $item->tahunPerolehan) {
            return response()->json([
                'message' => 'Tahun perhitungan ('.$tahun.') tidak boleh lebih kecil dari tahun perolehan ('.$item->tahunPerolehan.').',
            ], 422);
        }

        $umurEkonomis = $item->kategoriItem ? (int) $item->kategoriItem->umurEkonomisTahun : 5;
        $tarif = $item->kategoriItem ? (float) $item->kategoriItem->tarifPenyusutanPersen : (100 / max(1, $umurEkonomis));

        $umurBerjalan = $tahun - $item->tahunPerolehan;
        $nilaiAwal = (float) $item->nilaiPerolehan;

        $bebanPenyusutan = round($nilaiAwal * ($tarif / 100), 2);
        $akumulasiPenyusutan = min($nilaiAwal, round($bebanPenyusutan * $umurBerjalan, 2));
        $nilaiBukuAkhir = max(0, round($nilaiAwal - $akumulasiPenyusutan, 2));
        $persenUmur = min(100, round(($umurBerjalan / max(1, $umurEkonomis)) * 100, 2));

        if ($persenUmur >= 100) {
            $status = 'perhatian';
        } elseif ($persenUmur >= 60) {
            $status = 'evaluasi';
        } else {
            $status = 'baik';
        }

        $penyusutan = Penyusutan::updateOrCreate(
            [
                'item_id' => $item->id,
                'tahun' => $tahun,
            ],
            [
                'nilaiAwal' => $nilaiAwal,
                'bebanPenyusutan' => $bebanPenyusutan,
                'akumulasiPenyusutan' => $akumulasiPenyusutan,
                'nilaiBukuAkhir' => $nilaiBukuAkhir,
                'persenUmur' => $persenUmur,
                'status' => $status,
            ]
        );

        $penyusutan->load('item.kategoriItem');

        return response()->json($penyusutan, 201);
    }
}
