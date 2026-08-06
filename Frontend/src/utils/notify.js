import Swal from 'sweetalert2';

const notify = {
  success: (message, title = 'Berhasil') => {
    Swal.fire({
      icon: 'success',
      title,
      text: message,
      timer: 1500,
      showConfirmButton: false,
    });
  },

  error: (message, title = 'Error') => {
    Swal.fire(title, message || 'Terjadi kesalahan, silakan coba lagi.', 'error');
  },

  warning: (message, title = 'Perhatian') => {
    Swal.fire(title, message, 'warning');
  },

  confirmDelete: (itemName = 'data ini') => {
    return Swal.fire({
      title: 'Hapus Data?',
      text: `Apakah Anda yakin ingin menghapus ${itemName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });
  },

  confirmLeave: () => {
    return Swal.fire({
      title: 'Keluar tanpa menyimpan?',
      text: 'Perubahan yang belum disimpan akan hilang.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Tetap di Halaman',
    });
  },
};

export default notify;
