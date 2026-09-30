<?php

$zip = new ZipArchive;
if ($zip->open('d:/TUGAS/BMN/Daftar Aset Barang BMN.xlsx') === true) {
    // 1. Get sheet names from xl/workbook.xml
    $sheetNames = [];
    if ($fp = $zip->getStream('xl/workbook.xml')) {
        $xml = simplexml_load_string(stream_get_contents($fp));
        foreach ($xml->sheets->sheet as $s) {
            $sheetNames[] = (string) $s['name'];
        }
    }
    echo 'Sheets found: '.json_encode($sheetNames)."\n\n";

    // 2. Read shared strings
    $strings = [];
    if ($fp = $zip->getStream('xl/sharedStrings.xml')) {
        $xml = simplexml_load_string(stream_get_contents($fp));
        foreach ($xml->si as $val) {
            $t = '';
            if (isset($val->t)) {
                $t = (string) $val->t;
            } elseif (isset($val->r)) {
                foreach ($val->r as $r) {
                    $t .= (string) $r->t;
                }
            }
            $strings[] = $t;
        }
    }

    // 3. Read first sheet
    if ($fp = $zip->getStream('xl/worksheets/sheet1.xml')) {
        $xml = simplexml_load_string(stream_get_contents($fp));
        $rows = [];
        $count = 0;
        foreach ($xml->sheetData->row as $row) {
            $rowData = [];
            foreach ($row->c as $c) {
                $v = (string) $c->v;
                if ((string) $c['t'] === 's' && isset($strings[(int) $v])) {
                    $v = $strings[(int) $v];
                }
                $rowData[] = $v;
            }
            if ($count < 8) {
                $rows[] = $rowData;
            }
            $count++;
        }
        echo 'Total rows in Sheet 1: '.$count."\n";
        echo "Sample rows (0 - 7):\n";
        echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
    }
    $zip->close();
}
