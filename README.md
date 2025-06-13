


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

