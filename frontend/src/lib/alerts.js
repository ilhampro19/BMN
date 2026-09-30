import Swal from 'sweetalert2'
import { toast } from 'sonner'

// Custom SweetAlert2 Theme matching Kemendagri / Itjen Navy Design System
const customSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-2xl shadow-2xl border border-slate-200 font-sans text-slate-800 p-6',
    title: 'text-lg font-bold text-slate-900',
    htmlContainer: 'text-xs text-slate-600 leading-relaxed',
    confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2',
    cancelButton: 'px-4 py-2.5 rounded-xl font-medium text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer ml-2',
    actions: 'mt-5 gap-2',
  },
  buttonsStyling: false,
})

export const showAlert = {
  success: (title = 'Berhasil!', text = 'Data berhasil disimpan.') => {
    return customSwal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonText: 'Tutup',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-slate-200 font-sans text-slate-800 p-6',
        title: 'text-lg font-bold text-slate-900',
        htmlContainer: 'text-xs text-slate-600 leading-relaxed',
        confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 cursor-pointer',
      },
      timer: 3000,
      timerProgressBar: true,
    })
  },

  error: (title = 'Terjadi Kesalahan', text = 'Gagal memproses permintaan.') => {
    return customSwal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText: 'Mengerti',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-slate-200 font-sans text-slate-800 p-6',
        title: 'text-lg font-bold text-slate-900',
        htmlContainer: 'text-xs text-slate-600 leading-relaxed',
        confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer',
      },
    })
  },

  info: (title = 'Informasi', text = '') => {
    return customSwal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonText: 'OK',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-slate-200 font-sans text-slate-800 p-6',
        title: 'text-lg font-bold text-slate-900',
        htmlContainer: 'text-xs text-slate-600 leading-relaxed',
        confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs bg-navy text-white hover:bg-navy-light shadow-md cursor-pointer',
      },
    })
  },

  confirm: async ({
    title = 'Konfirmasi Tindakan',
    text = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    isDestructive = false,
    icon = 'question',
  }) => {
    const result = await customSwal.fire({
      icon: isDestructive ? 'warning' : icon,
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      focusCancel: isDestructive,
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-slate-200 font-sans text-slate-800 p-6',
        title: 'text-lg font-bold text-slate-900',
        htmlContainer: 'text-xs text-slate-600 leading-relaxed',
        confirmButton: isDestructive
          ? 'px-5 py-2.5 rounded-xl font-semibold text-xs bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer'
          : 'px-5 py-2.5 rounded-xl font-semibold text-xs bg-navy text-white hover:bg-navy-light shadow-md shadow-navy/20 cursor-pointer',
        cancelButton: 'px-4 py-2.5 rounded-xl font-medium text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer',
        actions: 'mt-5 gap-2',
      },
    })
    return result.isConfirmed
  },
}

// Sonner Toast Helper for non-blocking quick feedback
export const showToast = {
  success: (message, description) => {
    toast.success(message, {
      description,
      duration: 3500,
    })
  },
  error: (message, description) => {
    toast.error(message, {
      description,
      duration: 4500,
    })
  },
  info: (message, description) => {
    toast.info(message, {
      description,
      duration: 3500,
    })
  },
  warning: (message, description) => {
    toast.warning(message, {
      description,
      duration: 4000,
    })
  },
}
