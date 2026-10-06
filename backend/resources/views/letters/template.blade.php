<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Surat Pengantar SMART-WARGA</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            margin: 40px;
            color: #111;
        }
        .header {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 10px;
            margin-bottom: 25px;
        }
        .header h2 {
            margin: 0;
            text-transform: uppercase;
            font-size: 16pt;
        }
        .header h3 {
            margin: 0;
            font-size: 13pt;
            font-weight: normal;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 10pt;
            color: #555;
        }
        .title {
            text-align: center;
            margin: 20px 0;
        }
        .title h4 {
            margin: 0;
            text-decoration: underline;
            text-transform: uppercase;
            font-size: 13pt;
        }
        .title p {
            margin: 2px 0 0 0;
            font-size: 11pt;
        }
        table.content {
            width: 100%;
            margin-bottom: 20px;
        }
        table.content td {
            vertical-align: top;
            padding: 4px 0;
        }
        table.content td.label {
            width: 30%;
        }
        table.content td.colon {
            width: 3%;
        }
        .signatures {
            margin-top: 50px;
            width: 100%;
        }
        .signatures td {
            text-align: center;
            width: 50%;
            vertical-align: top;
        }
        .sig-space {
            height: 70px;
        }
        .badge-verified {
            display: inline-block;
            padding: 4px 10px;
            border: 1px solid #16a34a;
            color: #16a34a;
            font-size: 9pt;
            font-weight: bold;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>RUKUN TETANGGA {{ $letter->user->rt_number ?? '01' }} / RUKUN WARGA 05</h2>
        <h3>KELURAHAN DIGITAL - KECAMATAN MANDIRI</h3>
        <p>Sistem Administrasi Digital SMART-WARGA | Dokumen Sah Elektronik</p>
    </div>

    <div class="title">
        <h4>SURAT KETERANGAN PENGANTAR</h4>
        <p>Nomor: {{ str_pad($letter->id, 4, '0', STR_PAD_LEFT) }}/SKP/RT{{ $letter->user->rt_number }}/RW05/{{ date('Y') }}</p>
    </div>

    <p>Yang bertanda tangan di bawah ini Pengurus RT {{ $letter->user->rt_number }} dan Pengurus RW 05 menerangkan bahwa:</p>

    <table class="content">
        <tr>
            <td class="label">Nama Lengkap</td>
            <td class="colon">:</td>
            <td><strong>{{ strtoupper($letter->user->name) }}</strong></td>
        </tr>
        <tr>
            <td class="label">NIK / No. KTP</td>
            <td class="colon">:</td>
            <td><strong style="font-family: monospace;">{{ $letter->user->nik ?? '-' }}</strong></td>
        </tr>
        <tr>
            <td class="label">Nomor Kartu Keluarga</td>
            <td class="colon">:</td>
            <td><span style="font-family: monospace;">{{ $letter->user->no_kk ?? '-' }}</span></td>
        </tr>
        <tr>
            <td class="label">Tempat, Tanggal Lahir</td>
            <td class="colon">:</td>
            <td>
                {{ $letter->user->birth_place ?? '-' }}, 
                {{ $letter->user->birth_date ? \Carbon\Carbon::parse($letter->user->birth_date)->translatedFormat('d F Y') : '-' }}
            </td>
        </tr>
        <tr>
            <td class="label">Jenis Kelamin</td>
            <td class="colon">:</td>
            <td>{{ $letter->user->gender == 'L' || $letter->user->gender == 'Laki-laki' ? 'Laki-laki' : ($letter->user->gender == 'P' || $letter->user->gender == 'Perempuan' ? 'Perempuan' : ($letter->user->gender ?? '-')) }}</td>
        </tr>
        <tr>
            <td class="label">Agama</td>
            <td class="colon">:</td>
            <td>{{ $letter->user->religion ?? 'Islam' }}</td>
        </tr>
        <tr>
            <td class="label">Pekerjaan</td>
            <td class="colon">:</td>
            <td>{{ $letter->user->occupation ?? 'Wiraswasta / Karyawan' }}</td>
        </tr>
        <tr>
            <td class="label">Status Perkawinan</td>
            <td class="colon">:</td>
            <td>{{ $letter->user->marital_status ?? 'Kawin' }}</td>
        </tr>
        <tr>
            <td class="label">Nomor Telepon / WhatsApp</td>
            <td class="colon">:</td>
            <td>{{ $letter->user->phone ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Alamat Domisili</td>
            <td class="colon">:</td>
            <td>{{ $letter->user->house->full_address ?? ('RT ' . $letter->user->rt_number) }}</td>
        </tr>
        <tr>
            <td class="label">RT / RW</td>
            <td class="colon">:</td>
            <td>RT {{ $letter->user->rt_number }} / RW 05</td>
        </tr>
        <tr>
            <td class="label">Status Kependudukan</td>
            <td class="colon">:</td>
            <td>Terdaftar Resmi (Warga Aktif RW 05)</td>
        </tr>
        <tr>
            <td class="label">Keperluan Pengantar</td>
            <td class="colon">:</td>
            <td><strong>{{ strtoupper($letter->type) }}</strong> - {{ $letter->purpose }}</td>
        </tr>
    </table>

    <p>Demikian surat keterangan pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

    <div style="margin-top: 30px;">
        <table class="signatures">
            <tr>
                <td>
                    Mengetahui,<br>
                    <strong>Ketua RT {{ $letter->user->rt_number }}</strong>
                    <div class="sig-space">
                        @if($letter->rt_approved_at)
                            <br><span class="badge-verified">[TERVALIDASI DIGITAL RT]</span><br>
                            <small>{{ $letter->rt_approved_at->format('d/m/Y H:i') }}</small>
                        @endif
                    </div>
                    <u>{{ $letter->rtApprover->name ?? 'Pengurus RT ' . $letter->user->rt_number }}</u>
                </td>
                <td>
                    Disetujui,<br>
                    <strong>Ketua RW 05</strong>
                    <div class="sig-space">
                        @if($letter->rw_approved_at)
                            <br><span class="badge-verified">[TERVALIDASI DIGITAL RW]</span><br>
                            <small>{{ $letter->rw_approved_at->format('d/m/Y H:i') }}</small>
                        @endif
                    </div>
                    <u>{{ $letter->rwApprover->name ?? 'Pengurus RW 05' }}</u>
                </td>
            </tr>
        </table>
    </div>

    <div style="margin-top: 60px; font-size: 8pt; color: #777; border-top: 1px solid #ccc; padding-top: 5px;">
        <i>Dicetak secara otomatis melalui SMART-WARGA Digital Platform pada {{ date('d F Y, H:i') }} WIB. Verifikasi keaslian dokumen dapat dicek pada arsip sistem.</i>
    </div>
</body>
</html>
