# PANDUAN DEPLOYMENT SMART-WARGA KE VPS (202.155.13.156)
## Arsitektur Harmonis Multi-Aplikasi (Port 8004)

Server VPS Anda (`202.155.13.156`) saat ini sudah menjalankan sistem **Yatindo System Hub** dengan rapi:
* Port 8001: SIAKAD SMP
* Port 8002: SIAKAD SMK
* Port 8003: SIAKAD Manager & Fleet Hub

Agar tidak mengganggu aplikasi-aplikasi yang sudah berjalan, **SMART-WARGA dialokasikan di Port 8004**.

---

### Langkah 1: Clone Repository ke VPS
Login ke SSH VPS Anda:
```bash
ssh root@202.155.13.156
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

Sesuaikan database di `.env` (buat database MariaDB baru, misal `smartwarga_db`):
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
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

---

### Langkah 3: Pasang Konfigurasi Nginx (Port 8004)
Salin konfigurasi Nginx:
```bash
cp /var/www/smartwarga/docs/smartwarga-nginx.conf /etc/nginx/sites-available/smartwarga
ln -s /etc/nginx/sites-available/smartwarga /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### Langkah 4: Tambahkan Menu SMART-WARGA di Halaman Utama (Port 80)
Buka file HTML index portal hub Anda (misal di `/var/www/html/index.html`):
Tambahkan blok kartu berikut ke dalam `<div class="links">`:
```html
<a class="link-item" href="http://202.155.13.156:8004">
    <div>
        <div>🏘️ SMART-WARGA</div>
        <div class="link-desc">Port 8004 &bull; Platform Terpadu RT/RW &amp; IoT</div>
    </div>
    <span class="status">● Masuk &rarr;</span>
</a>
```

---

### Langkah 5: Flash ESP32 & Jalankan!
Seluruh firmware di folder `firmware/` (`Node 1`, `Node 2`, `Node 3`) sudah disetel otomatis ke:
```cpp
const char* API_BASE_URL = "http://202.155.13.156:8004";
```
Tinggal upload via Arduino IDE, dan seluruh board ESP32 akan langsung terhubung ke VPS Anda!
