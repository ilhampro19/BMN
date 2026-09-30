<?php

require __DIR__.'/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;

$file = 'D:/TUGAS/BMN/Daftar Aset Barang BMN.xlsx';
if (! file_exists($file)) {
    echo 'File not found: '.$file."\n";
    exit;
}

$spreadsheet = IOFactory::load($file);
$sheetNames = $spreadsheet->getSheetNames();
echo 'Sheets found: '.count($sheetNames)."\n";

foreach ($sheetNames as $name) {
    $sheet = $spreadsheet->getSheetByName($name);
    $highestRow = $sheet->getHighestRow();
    $highestCol = $sheet->getHighestColumn();
    echo "\n======================================================\n";
    echo "Sheet [{$name}]: rows={$highestRow}, cols={$highestCol}\n";
    echo "======================================================\n";

    // Print rows 1 to 10 to see headers and first data rows
    for ($r = 1; $r <= min(15, $highestRow); $r++) {
        $rowVal = [];
        $colIndex = 1;
        while (true) {
            $colLetter = Coordinate::stringFromColumnIndex($colIndex);
            $val = $sheet->getCell($colLetter.$r)->getFormattedValue();
            if ($val !== null && trim($val) !== '') {
                $rowVal[] = "[{$colLetter}] ".trim($val);
            }
            if ($colLetter === $highestCol || $colIndex > 40) {
                break;
            }
            $colIndex++;
        }
        if (! empty($rowVal)) {
            echo "Row {$r}: ".implode(' | ', $rowVal)."\n";
        }
    }
}
