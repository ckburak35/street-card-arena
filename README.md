# Street Card Arena

Hayvan fotograflarini oyun kartina donusturen mobil odakli prototip.

Projede iki surum var:

- `web/`: Kalici website/PWA surumu. Safari veya Chrome ile acilir, ana ekrana eklenebilir.
- Expo/React Native dosyalari: iOS uygulama prototipi icin korunuyor.

## Web/PWA Ozellikleri

- Kamera ile fotograf cekme
- Galeriden fotograf secme
- Cekilen fotografi kart icin sticker sahnesine donusturme
- Ucretsiz yerel fotograf analizi: parlaklik, kontrast, renk, netlik
- Hiz, dayaniklilik, guc, cekicilik ve overall uretme
- Common, Uncommon, Rare, Epic, Legendary ve Mythic kart enderlikleri
- Kart koleksiyonu
- Koleksiyon kodu ile buluta kayit ve geri yukleme
- Iki kart arasinda basit kapisma
- Kartlari hem tarayicida hem Netlify Blobs uzerinde saklama
- Ana ekrana eklenebilir PWA yapisi

## Telefonda Kalici Kullanma

Web klasoru Netlify veya Vercel gibi bir servise yuklenir. Site HTTPS ile acildiginda telefon kamerasi calisir.

iPhone'da:

1. Safari ile site linkini ac.
2. Paylas butonuna bas.
3. Ana Ekrana Ekle sec.
4. Ikondan uygulama gibi ac.

## Otomatik Deploy

En rahat akis:

1. Bu projeyi GitHub'a yukle.
2. Netlify'da `Add new project` sec.
3. `Import a Git repository` altindan GitHub'i sec.
4. Repo olarak bu projeyi sec.
5. Build command alanini bos birak.
6. Publish directory alanina `web` yaz.
7. Deploy et.

Bundan sonra koda gelen her GitHub guncellemesi Netlify tarafinda otomatik yayinlanir.

## Yerelde Deneme

```powershell
C:\Users\oyunk\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m http.server 4173 -d web
```

Sonra tarayicida:

```text
http://localhost:4173
```

## Analiz Notu

Bu surum OpenAI veya ucretli API kullanmaz. Kart skorlarini tarayicida fotograf uzerinden ucretsiz hesaplar:

- Parlaklik
- Renk cesitliligi
- Kontrast
- Netlik tahmini

Koleksiyon kodu `SCA-XXXX-XXXX` formatindadir. Kullanici bu kodla tekrar giris yaparsa Netlify Blobs uzerindeki kartlarini geri yukleyebilir.
