# Street Card Arena

Kedi ve kopek fotograflarini oyun kartina donusturen mobil odakli prototip.

Projede iki surum var:

- `web/`: Kalici website/PWA surumu. Safari veya Chrome ile acilir, ana ekrana eklenebilir.
- Expo/React Native dosyalari: iOS uygulama prototipi icin korunuyor.

## Web/PWA Ozellikleri

- Kamera ile fotograf cekme
- Galeriden fotograf secme
- Cekilen fotografi kart icin sticker sahnesine donusturme
- Hiz, dayaniklilik, guc, cekicilik ve overall uretme
- Common, Uncommon, Rare, Epic, Legendary ve Mythic kart enderlikleri
- Kart koleksiyonu
- Iki kart arasinda basit kapisma
- Kartlari tarayicida local olarak saklama
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

## AI Notu

Kart analizi Netlify Function uzerinden OpenAI API kullanabilir. `OPENAI_API_KEY` Netlify environment variable olarak eklenmezse uygulama otomatik olarak yerel/mock kart uretimine duser.

Netlify'da:

1. Project configuration ekranina gir.
2. Environment variables bolumunu ac.
3. `OPENAI_API_KEY` adinda degisken ekle.
4. Deger olarak OpenAI API anahtarini gir.
5. Deploys ekranindan yeni deploy tetikle veya GitHub'a yeni commit push et.

Kart gorseli tarayici icinde sahnelestirilir: fotograf arka plana yayilir, ana fotograf sticker gibi one alinir.

Gercek AI asamasi icin iki backend endpoint'i eklemek gerekir:

- Hayvani fotografindan ayirip transparan sticker uretme.
- Kart icin yapay zeka arka plani uretme.

Bu isler kullanicinin API anahtarini saklamak icin sadece frontend'de degil, Netlify Functions veya Supabase Edge Functions gibi backend tarafinda yapilmalidir.
