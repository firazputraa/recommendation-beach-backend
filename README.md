## Frontend

Bagian **frontend** dari proyek ini dibangun dengan kumpulan teknologi modern untuk menghadirkan pengalaman pengguna yang cepat, responsif, dan menyenangkan:

* **React.js**: Digunakan sebagai *library* utama untuk membangun antarmuka pengguna yang dinamis dan berbasis komponen. Kemampuan React untuk membuat *UI* interaktif dari komponen-komponen yang dapat digunakan kembali sangat penting dalam proyek ini.
* **Vite**: Berperan sebagai *bundler* super cepat dan *development server*. Vite secara signifikan mempercepat proses pengembangan Anda dengan *hot module replacement* (HMR) yang instan, memungkinkan Anda melihat perubahan kode secara *real-time*.
* **Tailwind CSS**: Diterapkan untuk *styling*, memungkinkan pengembangan UI yang fleksibel dan *customizable* dengan pendekatan *utility-first*. Dengan Tailwind, desain responsif dan konsisten menjadi jauh lebih mudah diimplementasikan.
* **React Router Dom**: Mengelola navigasi antar halaman dalam aplikasi *single-page* ini dengan mulus. Ini memastikan pengalaman pengguna yang lancar tanpa perlu *reload* halaman penuh setiap kali berpindah tampilan.

---

### Menjalankan Frontend Secara Lokal

Untuk menjalankan aplikasi frontend di lingkungan pengembangan Anda, ikuti langkah-langkah mudah di bawah ini. Pastikan Anda sudah menginstal **Node.js** (direkomendasikan versi LTS, misalnya 18.x atau 20.x) dan **npm** atau **Yarn**.

1.  **Navigasi** ke direktori `frontend` proyek ini melalui terminal atau *command prompt* Anda:

    ```bash
    cd frontend
    ```

2.  **Instal** semua dependensi yang diperlukan. Proses ini mungkin memakan waktu beberapa menit, tergantung pada kecepatan koneksi internet Anda:

    ```bash
    npm install
    # atau jika Anda menggunakan Yarn
    yarn install
    ```

3.  **Mulai** server pengembangan. Perintah ini akan mengompilasi kode Anda dan secara otomatis membuka aplikasi di *browser* default Anda:

    ```bash
    npm run dev
    # atau jika Anda menggunakan Yarn
    yarn dev
    ```

Aplikasi frontend akan secara otomatis terbuka di *browser* Anda pada alamat `http://localhost:3000`. Pastikan juga server *backend* (jika proyek Anda memiliki bagian *backend*) sudah berjalan agar aplikasi berfungsi sepenuhnya dan dapat berkomunikasi dengan API.


# 🌊 BiruLaut

Selamat datang di dokumentasi **API PantaiKu**. API ini memungkinkan Anda untuk mengelola data pantai, ulasan pengguna, dan akun pengguna.

**Base URL:**  
`http://localhost:5000`  
*(Sesuaikan dengan URL server pengembangan Anda)*

---

## 🔐 Autentikasi

Beberapa endpoint memerlukan autentikasi menggunakan **JSON Web Token (JWT)**. Sertakan token di header `Authorization` menggunakan skema **Bearer**.

**Contoh Header:**
```
Authorization: Bearer <TOKEN_ANDA_DISINI>
```

---

## 📚 Daftar Isi

- [🌴 Endpoint Pantai](#-endpoint-pantai)
- [👤 Endpoint Pengguna](#-endpoint-pengguna)
- [📝 Endpoint Ulasan](#-endpoint-ulasan)

---

## 🌴 Endpoint Pantai

### 1. Rekomendasi Pantai  
**POST** `/beach/recommend`

Mendapatkan rekomendasi pantai berdasarkan preferensi teks pengguna.

**Request Body:**
```json
{
  "preference_text": "Saya suka pantai yang sepi dengan air jernih dan pasir putih, cocok untuk snorkeling."
}
```

**Responses:**
- `200 OK`: Berhasil.
- `400 Bad Request`: Validasi gagal.
- `500 Internal Server Error`: Kesalahan server.

---

### 2. Cari Pantai  
**GET** `/beach/search`

Pencarian pantai berdasarkan kata kunci, nama, atau deskripsi.

**Query Parameters:**
- `search` *(opsional)*  
- `limit` *(default: 10)*  
- `page` *(default: 1)*

---

### 3. Cari Pantai Terdekat  
**GET** `/beach/nearby`

Cari pantai dalam radius tertentu dari koordinat pengguna.

**Query Parameters:**
- `lat` *(required)*  
- `lng` *(required)*  
- `radius` *(default: 10 km)*  
- `limit`, `page`

---

### 4. Detail Pantai  
**GET** `/beach/{placeId}`

Mengambil informasi lengkap tentang satu pantai berdasarkan `placeId`.

---

## 👤 Endpoint Pengguna

### 1. Registrasi  
**POST** `/user/register`

**Request Body:**
```json
{
  "username": "penggunabaru",
  "email": "penggunabaru@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

---

### 2. Login  
**POST** `/user/login`

**Request Body:**
```json
{
  "email": "penggunabaru@example.com",
  "password": "password123"
}
```

---

### 3. Perbarui Username  
**PATCH** `/user/update-username`  
*Memerlukan autentikasi*

**Request Body:**
```json
{
  "username": "username_baru_saya"
}
```

---

### 4. Perbarui Password  
**PATCH** `/user/update-password`  
*Memerlukan autentikasi*

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "passwordbaru456",
  "confirmNewPassword": "passwordbaru456"
}
```

---

## 📝 Endpoint Ulasan

### 1. Buat Ulasan  
**POST** `/review`  
*Memerlukan autentikasi*

**Request Body:**
```json
{
  "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "rating": 5,
  "review_text": "Pantai ini sangat luar biasa! Bersih dan pemandangannya indah sekali."
}
```

---

### 2. Dapatkan Ulasan Pantai  
**GET** `/review/{placeId}`

Mengambil semua ulasan untuk pantai berdasarkan `placeId`.

---

## 📌 Catatan Tambahan

- Semua response menggunakan format JSON.
- Pastikan untuk memvalidasi data input agar tidak terjadi kesalahan saat request.
- Pastikan token JWT tidak kadaluarsa untuk endpoint yang memerlukan autentikasi.

---

