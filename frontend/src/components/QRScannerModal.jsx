import { useState, useRef, useEffect } from 'react'
import { X, Camera, Image, CheckCircle, AlertCircle, RefreshCw, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'

function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [hasCamera, setHasCamera] = useState(true)
  const [cameraError, setCameraError] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  async function startCamera() {
    setCameraError('')
    setIsScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Check for native BarcodeDetector
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] })
        intervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current)
              if (barcodes.length > 0) {
                handleDetect(barcodes[0].rawValue)
              }
            } catch (err) {
              // frame detection pass
            }
          }
        }, 400)
      }
    } catch (err) {
      console.warn('Kamera tidak dapat diakses', err)
      setHasCamera(false)
      setCameraError('Kamera tidak tersedia atau izin akses ditolak. Anda dapat memasukkan kode secara manual.')
    }
  }

  function stopCamera() {
    setIsScanning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  function handleDetect(rawValue) {
    stopCamera()
    let extractedCode = String(rawValue || '').trim()
    try {
      const parsed = JSON.parse(rawValue)
      if (parsed.kode_bmn) extractedCode = parsed.kode_bmn
      else if (parsed.sakti) extractedCode = parsed.sakti
      else if (parsed.kode) extractedCode = parsed.kode
      else if (parsed.itemCode) extractedCode = parsed.itemCode
    } catch (e) {
      // raw string, e.g. "3050201003" or "3050201003-1578"
    }
    onScanSuccess(extractedCode)
  }

  function handleManualSubmit(e) {
    e.preventDefault()
    if (!manualCode.trim()) return
    handleDetect(manualCode.trim())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-black/10">
        {/* HEADER */}
        <div className="bg-navy text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-gold" />
            <h3 className="font-semibold text-base">Pemindai QR Code Aset BMN</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* SCANNER VIEWPORT */}
        <div className="p-6">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center shadow-inner mb-4">
            {hasCamera && !cameraError ? (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {/* VIEWFINDER TARGET */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-44 h-44 border-2 border-gold/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-gold rounded-tl-sm" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-gold rounded-tr-sm" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-gold rounded-bl-sm" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-gold rounded-br-sm" />
                    <div className="w-full h-0.5 bg-red-500/80 absolute top-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-white/80">
                <AlertCircle size={36} className="mx-auto text-amber-400 mb-2" />
                <p className="text-xs text-white/70">{cameraError || 'Kamera tidak aktif.'}</p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-center text-ink/50 mb-4">
            Arahkan kamera ke stiker barcode / QR Code pada fisik BMN Itjen Kemendagri
          </p>

          {/* INPUT MANUAL / SIMULASI SCANNER */}
          <form onSubmit={handleManualSubmit} className="pt-3 border-t border-black/10">
            <label className="text-xs font-semibold text-ink/70 block mb-1.5 flex items-center gap-1">
              <QrCode size={14} className="text-navy" /> Atau Masukkan / Tempel Kode Barang:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Contoh: 3050201003 atau BMN-ITJ-2023-LTP01"
                className="flex-1 text-xs border border-black/15 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white outline-none focus:border-navy font-mono"
              />
              <Button type="submit" className="bg-navy hover:bg-navy-light text-white text-xs px-4">
                Cari Aset
              </Button>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 bg-gray-50 border-t border-black/5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-ink/60 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

export default QRScannerModal
