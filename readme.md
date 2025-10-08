# be-kas-bosgil-nodejs

## Deskripsi

API sederhana untuk manajemen user, login, dan data dummy menggunakan Express.js.

## Prasyarat

- Node.js (disarankan versi 18 ke atas)
- npm

## Instalasi

1. Clone repository ini.
2. Install dependencies:
   ```sh
   npm install
   ```

## Menjalankan Server

Jalankan perintah berikut untuk development:

```sh
npm run dev
```

Server akan berjalan di port 3000 (atau sesuai dengan `process.env.PORT`).

## Endpoint Utama

- `POST /api/login` — Login dan mendapatkan token JWT
- `GET /api/home` — Mendapatkan data user (butuh token JWT)
- `GET /api/users` — Mendapatkan daftar user (butuh token JWT)
- `GET /api/users/:id` — Mendapatkan detail user (butuh token JWT)
- `POST /api/users` — Menambah user baru (butuh token JWT)
- `PATCH /api/users/:id` — Update user (butuh token JWT)
- `PATCH /api/users/:id/deactivate` — Nonaktifkan user (butuh token JWT)
- `GET /api/roles/list` — Daftar role (butuh token JWT)
- `GET /api/branchs/list` — Daftar branch (butuh token JWT)

## Catatan

- Untuk endpoint yang membutuhkan autentikasi, gunakan token JWT yang didapat dari endpoint `/api/login` pada header:
  ```
  Authorization: Bearer <token>
  ```

## Lisensi

ISC
