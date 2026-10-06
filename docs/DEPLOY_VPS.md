# PANDUAN DEPLOYMENT SMART-WARGA KE CLOUD VPS
## Arsitektur Deployment Multi-Aplikasi Mandiri

Panduan ini menjelaskan langkah deployment SMART-WARGA ke server cloud Linux (Ubuntu 22.04 LTS) agar berjalan berdampingan secara harmonis dengan aplikasi lain yang telah ada di server:

---

### Langkah 1: Clone Repository ke Server
Login ke SSH VPS Anda menggunakan IP atau hostname privat Anda:
```bash
ssh root@<IP_ATAU_HOST_SERVER_ANDA>
```
Pindah ke direktori web dan clone repo:
```bash
cd /var/www
git clone <URL_REPO_GITHUB_ANDA> smartwarga
cd /var/www/smartwarga/backend
```

---

### Langkah 2: Setup Backend Laravel
Jalankan perintah berikut di folder `backend`:
```bash
cp .env.example .env
composer install --no-dev --optimize-autoloader
php artisan key:generate
```

Sesuaikan konfigurasi database di `.env`:
```bash
nano .env
```
Isi konfigurasi database:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=smartwarga_db
DB_USERNAME=root
DB_PASSWORD=<password_mariadb_anda>
```

Jalankan migrasi & data awal:
```bash
php artisan migrate --seed --force
chown -R www-data:www-data storage bootstrap/cache public
chmod -R 775 storage bootstrap/cache
```

---

### Langkah 3: Pasang Konfigurasi Nginx
Salin konfigurasi Nginx:
```bash
cp /var/www/smartwarga/docs/smartwarga-nginx.conf /etc/nginx/sites-available/smartwarga
ln -s /etc/nginx/sites-available/smartwarga /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### Langkah 4: Setup Firmware ESP32
Seluruh firmware di folder `firmware/` (`Node 1`, `Node 2`, `Node 3`) dapat diarahkan ke domain publik terenkripsi SSL atau port privat:
```cpp
const char* API_BASE_URL = "https://swarga.manajemensystem.my.id";
// Atau menggunakan port backend privat jika di jaringan lokal/VPN:
// const char* API_BASE_URL = "http://<SERVER_HOST>:8004";
```
Upload via Arduino IDE, dan seluruh board ESP32 akan langsung terhubung ke sistem SMART-WARGA.
