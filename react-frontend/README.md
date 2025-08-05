# Sezgi: Akıllı Alışveriş Asistanı (E-Ticaret Hackathon Projesi)

Sezgi, kullanıcıların adını unuttuğu veya sadece tarif edebildiği ürünleri yapay zeka ve görsel arama teknolojileriyle bulan, e-ticaret deneyimini kökten değiştiren bir alışveriş asistanıdır. Bu proje, bir E-Ticaret Hackathonu için geliştirilmiştir ve hem son kullanıcıya sezgisel bir arayüz sunar hem de satıcılar için güçlü optimizasyon araçları içerir.

## 🚀 Projenin Amacı ve Çözdüğü Problem

Geleneksel e-ticaret platformları, kullanıcıların aradıkları ürünün adını tam olarak bilmesini gerektirir. "Dilimin ucunda ama adı aklıma gelmiyor" anları, genellikle sonuçsuz kalan aramalara ve hayal kırıklığına yol açar. **Sezgi**, bu problemi ortadan kaldırır. Kullanıcılar, "ucunda fırçası olan, fayans aralarını temizleyen kalem gibi şey" gibi günlük konuşma diliyle yaptıkları tariflerle veya bir ürünün fotoğrafını yükleyerek aradıklarını saniyeler içinde bulabilirler.

Hackathon teması olan "E-ticarette İnovasyon" kapsamında, projemiz şu temel hedeflere odaklanmıştır:
1.  **Agentic AI Mimarisi:** Kullanıcı niyetini anlayan, çok adımlı görevleri yürüten ve kendi kendine karar alabilen bir yapay zeka sistemi kurmak.
2.  **Sezgisel Kullanıcı Deneyimi:** Karmaşık arka plan süreçlerini, kullanıcı için basit ve akıcı bir sohbete dönüştürmek.
3.  **Satıcılar için Değer Yaratma:** Satıcılara, ürünlerini daha etkili pazarlamaları için yapay zeka destekli A/B test imkanları sunmak.

## ✨ Temel Özellikler

-   **Konuşarak Ürün Arama:** Kullanıcılar, aradıkları ürünü doğal dilde tarif ederek yapay zeka asistanı ile sohbet edebilir.
-   **Görselden Ürün Bulma:** Benzer bir ürünün fotoğrafını yükleyerek veya mevcut ürün görsellerine tıklayarak ilgili ürünleri keşfetme.
-   **Dinamik Ürün Önerileri:** Yapay zeka, kullanıcının tarifine göre dinamik olarak ürün önerileri oluşturur ve bu ürünlerin görsellerini üretir.
-   **Satıcı Paneli (Business Panel):** Satıcıların kendi ürünlerini yönetebildiği ve A/B testleri oluşturabildiği özel bir arayüz.
-   **Yapay Zeka Destekli A/B Testleri:** Satıcılar, ürün başlıkları veya açıklamaları için yapay zekadan alternatif metin önerileri alabilir ve bu varyasyonları test ederek dönüşüm oranlarını optimize edebilir.

## 🛠️ Teknik Mimari ve İşleyiş

Proje, modern bir teknoloji yığını üzerine inşa edilmiştir: **React (TypeScript)** ile geliştirilmiş dinamik bir ön uç ve **Python (FastAPI)** ile oluşturulmuş güçlü bir arka uç.

### Akış Diyagramı

```mermaid
graph TD
    A[Kullanıcı Arayüzü (React)] -->|1. Ürün Tarifi Gönderir| B(FastAPI Backend);
    B -->|2. İstek Agent'a İletilir| C{Agentic AI Sistemi};
    C -->|3. Adım 1: Tag Üretici| D[Gemini: Tarifi Anlar ve Etiket Üretir];
    D -->|4. Adım 2: Ürün Arama| E[Veritabanı (Ecommerce DB)];
    E -->|5. Benzer Ürünleri Bulur| C;
    C -->|6. Adım 3: Ürün Sıralayıcı| F[Gemini: Ürünleri Değerlendirir ve Sıralar];
    F -->|7. Sonuçları Döndürür| B;
    B -->|8. Yanıtı Arayüze Gönderir| A;

    subgraph "Satıcı Paneli"
        G[A/B Test Arayüzü] -->|a. Test Başlatma İsteği| B;
        B -->|b. AI Öneri İsteği| H{A/B Test Agent'ı};
        H -->|c. Yeni Metin Önerir| B;
        B -->|d. Öneriyi Arayüze Gönderir| G;
    end
```

### 1. **Ön Uç (React & TypeScript)**

Kullanıcı deneyiminin merkezinde, `react-frontend` dizininde yer alan ve aşağıdaki ana bileşenlerden oluşan arayüzümüz bulunmaktadır:
-   `WelcomeScreen.tsx`: Kullanıcıyı karşılayan ve arama çubuğunu içeren ana sayfa.
-   `ChatPage.tsx`: Yapay zeka ile etkileşimin gerçekleştiği sohbet arayüzü.
-   `BusinessPanel.tsx`: Satıcıların giriş yaptığı ve ürünlerini yönettiği panel.
-   `ABTestSetupScreen.tsx` & `ABTestResultsScreen.tsx`: A/B testlerinin oluşturulduğu ve sonuçlarının izlendiği ekranlar.

### 2. **Arka Uç (FastAPI)**

`backend/app` dizininde yer alan FastAPI uygulamamız, ön uçtan gelen istekleri karşılar ve yapay zeka ajanlarını tetikler. Ana endpoint'ler:
-   `/generate_suggestions_text`: Kullanıcının metin tabanlı tarifini alıp ürün önerileri oluşturur.
-   `/generate_suggestion_images`: Oluşturulan ürün önerileri için anlık olarak görseller üretir.
-   `/similar_products`: Mevcut bir ürüne benzer ürünleri bulmak için yapay zeka tabanlı etiketleme ve arama yapar.
-   `/ab-tests/ai-suggestion`: A/B testi için yapay zekadan metin önerisi alır.

### 3. **Agentic AI Sistemi (`agent.py`)**

Projemizin kalbi, `backend/app/agent.py` dosyasında tanımlanan çok adımlı yapay zeka ajanıdır. Bu sistem, karmaşık görevleri daha küçük ve yönetilebilir adımlara bölerek çalışır:

1.  **Tag Generator Agent:** Kullanıcının ürün tarifini alır, Gemini modelini kullanarak bu tarife uygun e-ticaret etiketleri (`"bluetooth_kulaklik"`, `"ev_dekorasyonu"` vb.) üretir.
2.  **Product Search:** Üretilen etiketleri kullanarak `ecommerce.db` veritabanında, **kosinüs benzerliği (cosine similarity)** ile semantik bir arama gerçekleştirir. Bu, etiketlerin sırasından bağımsız olarak en alakalı sonuçların bulunmasını sağlar.
3.  **Product Evaluator Agent:** Bulunan ürünleri; etiket uyumu, fiyat ve kullanıcı puanları gibi kriterlere göre analiz eder ve en mantıklı sıralamayı yaparak kullanıcıya sunar.
4.  **A/B Test Suggestion Agent:** Satıcının bir ürünü için, mevcut kullanıcı arama sorgularını analiz ederek daha etkili olabilecek alternatif başlık ve açıklamalar önerir.

Bu mimari, hem daha isabetli sonuçlar üretmemizi sağlar hem de API çağrılarını optimize ederek maliyeti düşürür.

## 🚀 Projeyi Çalıştırma

### Gereksinimler
-   Node.js (v16 veya üstü)
-   Python 3.10+
-   `pip` ve `npm` (veya `yarn`)

### Kurulum

1.  **Backend Kurulumu:**
    ```bash
    cd backend
    pip install -r requirements.txt
    # .env dosyasını oluşturup gerekli API anahtarlarını ekleyin (GEMINI_API_KEY, GCP_PROJECT_ID vb.)
    uvicorn main:app --reload --port 8000
    ```

2.  **Frontend Kurulumu:**
    ```bash
    cd react-frontend
    npm install
    npm start
    ```
Uygulama, `http://localhost:3000` adresinde açılacaktır. Arka uç sunucusunun `http://localhost:8000` adresinde çalıştığından emin olun.

## 💡 Hackathon Sonrası Gelecek Planları

-   **Gerçek Zamanlı Stok Takibi:** E-ticaret platformları ile entegre olarak canlı stok bilgisi sunma.
-   **Kişiselleştirilmiş Öneri Akışları:** Kullanıcının geçmiş aramalarına ve tercihlerine göre ana sayfada proaktif öneriler sunma.
-   **Sesli Komut Desteği:** Metin yazmak yerine, sesli komutlarla ürün arama imkanı.
-   **Gelişmiş Satıcı Analitikleri:** A/B test sonuçlarını daha detaylı grafikler ve metriklerle sunma.

---

Bu proje, bir fikrin nasıl hızlıca hayata geçirilebileceğini ve modern yapay zeka araçlarının e-ticarette ne gibi devrimsel yenilikler sunabileceğini göstermektedir.
