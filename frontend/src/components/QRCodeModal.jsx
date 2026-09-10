import { useEffect, useState, useId } from 'react'
import QRCode from 'qrcode'
import { X, Printer, QrCode as QrIcon, Settings2, Check, RefreshCw } from 'lucide-react'
import SearchableSelect from './ui/SearchableSelect'
import logoKemendagri from '../assets/logo-kemendagri.jpeg'

function QRCodeModal({ item, onClose }) {
  const [qrUrl, setQrUrl] = useState('')
  // Pilihan format isi QR Code:
  // 'sakti_raw': Hanya nomor SAKTI tanpa titik (contoh: 3050201003) - Sesuai stiker fisik asli Kemendagri
  // 'sakti_nup': Nomor SAKTI + NUP (contoh: 3050201003-1578)
  // 'item_code': Kode inventaris internal (contoh: BMN-ITJ-2023-LTP01)
  // 'json_full': Data JSON lengkap
  const [qrFormat, setQrFormat] = useState('sakti_raw')
  
  // Kode Satker / Registrasi UAKPB pada header (sesuai contoh asli: 010020199027203000KP.2019)
  const defaultSatker = `010020199027203000KP.${item?.tahunPerolehan || '2019'}`
  const [satkerCode, setSatkerCode] = useState(defaultSatker)
  const [showConfig, setShowConfig] = useState(false)

  // Bersihkan titik dari kode BMN (misal 3.05.02.01.003 -> 3050201003)
  const rawSakti = item?.kode_bmn ? item.kode_bmn.replace(/\./g, '') : '3050201003'
  const displayNup = item?.nup ? String(item.nup).padStart(4, '0') : '0001'

  // Hitung isi payload QR Code berdasarkan format yang dipilih
  function getQrPayload() {
    if (!item) return '3050201003'
    switch (qrFormat) {
      case 'sakti_raw':
        return rawSakti
      case 'sakti_nup':
        return `${rawSakti}-${displayNup}`
      case 'item_code':
        return item.itemCode || rawSakti
      case 'json_full':
        return JSON.stringify({
          kode_bmn: rawSakti,
          nup: displayNup,
          nama: item.itemName,
          merk: item.merk_tipe || '-',
          satker: satkerCode,
        })
      default:
        return rawSakti
    }
  }

  const qrPayload = getQrPayload()

  useEffect(() => {
    if (!item) return
    QRCode.toDataURL(qrPayload, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error('Gagal generate QR', err))
  }, [item, qrPayload])

  if (!item) return null

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      {/* CSS KHUSUS CETAK STIKER LABEL */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #kemendagri-bmn-sticker, #kemendagri-bmn-sticker * {
            visibility: visible !important;
          }
          #kemendagri-bmn-sticker {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 85mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: auto;
            margin: 4mm;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-black/10 animate-in fade-in zoom-in-95 duration-150">
        {/* MODAL HEADER */}
        <div className="bg-navy text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <QrIcon size={18} className="text-gold" />
            <h2 className="text-base font-semibold">Stiker Label Resmi BMN Kemendagri</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
              title="Pengaturan Label & QR"
            >
              <Settings2 size={16} />
              <span className="hidden sm:inline">Opsi QR</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PANEL PENGATURAN / CONFIGURATION (OPTIONAL TOGGLE) */}
        {showConfig && (
          <div className="bg-amber-50/80 border-b border-amber-200 px-6 py-3.5 text-xs print:hidden animate-in slide-in-from-top duration-150">
            <p className="font-bold text-ink mb-2 flex items-center gap-1.5">
              <Settings2 size={14} className="text-amber-700" /> Pengaturan Format Stiker & QR Code:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink/70 mb-1">
                  Isi QR Code (Payload):
                </label>
                <SearchableSelect
                  value={qrFormat}
                  onChange={(val) => setQrFormat(val)}
                  options={[
                    { value: 'sakti_raw', label: `Hanya Nomor SAKTI (${rawSakti}) - Standar Fisik` },
                    { value: 'sakti_nup', label: `Nomor SAKTI + NUP (${rawSakti}-${displayNup})` },
                    { value: 'item_code', label: `Kode Barang (${item.itemCode})` },
                    { value: 'json_full', label: 'JSON Lengkap (Semua Info)' },
                  ]}
                  placeholder="Pilih format QR..."
                />
                <p className="text-[10px] text-ink/60 mt-1">
                  *Saat ini QR Code berisi: <strong className="font-mono text-navy">{qrPayload}</strong>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink/70 mb-1">
                  Kode Satker / UAKPB di Kop Stiker:
                </label>
                <input
                  type="text"
                  value={satkerCode}
                  onChange={(e) => setSatkerCode(e.target.value)}
                  placeholder="010020199027203000KP.2019"
                  className="w-full bg-white border border-amber-300 rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STICKER PREVIEW (PERSIS SEPERTI FOTO STIKER FISIK ASLI KEMENDAGRI) */}
        <div className="p-6 bg-gray-100 flex flex-col items-center justify-center">
          <p className="text-[11px] text-ink/50 mb-2 font-medium print:hidden">
            Pratinjau Stiker Fisik (Sesuai Standar SIMAK-BMN / SAKTI Kemendagri):
          </p>

          <div
            id="kemendagri-bmn-sticker"
            className="w-full max-w-[440px] bg-white border-2 border-black rounded-lg overflow-hidden shadow-md font-sans text-black select-none"
            style={{ minHeight: '180px' }}
          >
            {/* 1. HEADER ROW: LOGO KEMENDAGRI (KIRI) & NAMA KEMENTERIAN + KODE SATKER (KANAN) */}
            <div className="flex border-b-2 border-black bg-white">
              {/* KOTAK LOGO KEMENDAGRI */}
              <div className="w-20 shrink-0 border-r-2 border-black p-1.5 flex items-center justify-center bg-white">
                <img
                  src={logoKemendagri}
                  alt="Lambang Kemendagri"
                  className="w-full h-14 object-contain"
                />
              </div>

              {/* KOTAK TEKS KEMENTERIAN */}
              <div className="flex-1 flex flex-col justify-center items-center py-2 px-3 text-center">
                <h3 className="text-sm font-black tracking-wide uppercase leading-tight font-sans">
                  KEMENTERIAN DALAM NEGERI
                </h3>
                <p className="text-[11px] font-bold tracking-tight font-mono text-black mt-1">
                  {satkerCode}
                </p>
              </div>
            </div>

            {/* 2. BODY ROW: KIRI (KODE, NUP, NAMA, MERK) & KANAN (QR CODE KOTAK) */}
            <div className="flex bg-white">
              {/* KOLOM KIRI: DATA BARANG */}
              <div className="flex-1 p-3 flex flex-col justify-between">
                {/* BARIS 1: KODE SAKTI (KIRI) DAN NUP (KANAN) */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm sm:text-base font-mono tracking-tight text-black">
                    {rawSakti}
                  </span>
                  <span className="font-bold text-sm sm:text-base font-mono tracking-tight text-black">
                    {displayNup}
                  </span>
                </div>

                {/* BARIS 2: NAMA BARANG */}
                <div className="my-1.5">
                  <p className="font-semibold text-xs sm:text-sm text-black leading-snug">
                    {item.itemName || 'Barang Milik Negara'}
                  </p>
                </div>

                {/* BARIS 3: MERK / TIPE */}
                <div className="mt-auto pt-1">
                  <p className="text-[11px] sm:text-xs font-medium text-black">
                    Merk : <span className="uppercase font-semibold">{item.merk_tipe || '-'}</span>
                  </p>
                </div>
              </div>

              {/* KOLOM KANAN: QR CODE */}
              <div className="w-32 shrink-0 border-l-2 border-black p-2 flex flex-col items-center justify-center bg-white">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    className="w-24 h-24 object-contain"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                    Memuat QR...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-ink/60 print:hidden text-center">
            <span>Isi QR Code:</span>
            <code className="bg-white px-2 py-0.5 rounded border border-black/15 font-mono text-navy font-bold">
              {qrPayload}
            </code>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-black/10 flex items-center justify-between print:hidden">
          <p className="text-xs text-ink/50">
            Dapat dicetak langsung ke kertas stiker label atau printer thermal BMN.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-ink/70 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-navy hover:bg-navy-light text-white text-xs px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Printer size={15} /> Cetak Stiker
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRCodeModal
