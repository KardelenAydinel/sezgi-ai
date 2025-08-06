# Sezgi: Adı dilinin ucunda, Sezgi ile bir tık uzağında.

Sezgi, kullanıcıların adını unuttuğu veya sadece tarif edebildiği ürünleri yapay zeka teknolojileriyle bulan, e-ticaret deneyimini kökten değiştiren bir alışveriş asistanıdır. 

## 🚀 Projenin Amacı ve Çözdüğü Problem

Geleneksel e-ticaret platformları, kullanıcıların aradıkları ürünün adını tam olarak bilmesini gerektirir. "Dilimin ucunda ama adı aklıma gelmiyor" anları, genellikle sonuçsuz kalan aramalara ve hayal kırıklığına yol açar. **Sezgi**, bu problemi ortadan kaldırır. Kullanıcılar, "ucunda fırçası olan, fayans aralarını temizleyen kalem gibi şey" gibi günlük konuşma diliyle yaptıkları tariflerle aradıklarını saniyeler içinde bulabilirler.

Hackathon teması olan "E-ticarette İnovasyon" kapsamında, projemiz şu temel hedeflere odaklanmıştır:
1.  **Agentic AI Mimarisi:** Kullanıcı niyetini anlayan, çok adımlı görevleri yürüten ve kendi kendine karar alabilen bir yapay zeka sistemi kurmak. **MCP bağlantısı ile** bu sistemi güçlendirmek, e-ticaret database'imize rahatlıkla ulaşmasını sağlamak.
2.  **Sezgisel Kullanıcı Deneyimi:** Karmaşık arka plan süreçlerini, kullanıcı için basit ve akıcı bir sohbete dönüştürmek.
3.  **Satıcılar için Değer Yaratma:** Satıcılara, ürünlerini daha etkili pazarlamaları için yapay zeka destekli A/B test imkanları sunmak.

## ✨ Temel Özellikler

-   **Konuşma Dilinde Ürün Arama:** Kullanıcılar, aradıkları ürünü doğal dilde tarif ederek yapay zeka asistanı ile sohbet edebilir.
-   **Dinamik Ürün Önerileri:** Yapay zeka, kullanıcının tarifine göre dinamik olarak ürün önerileri oluşturur ve bu ürünlerin görsellerini üretir.
-   **Satıcı Paneli (Business Panel):** Satıcıların kendi ürünlerini yönetebildiği ve A/B testleri oluşturabildiği özel bir arayüz.
-   **Yapay Zeka Destekli A/B Testleri:** Satıcılar, ürün başlıkları veya açıklamaları için yapay zekadan alternatif metin önerileri alabilir ve bu varyasyonları test ederek dönüşüm oranlarını optimize edebilir.


## 📊 Örnekler
![WhatsApp Image 2025-08-06 at 20 47 34](https://github.com/user-attachments/assets/e3875731-5cfe-47cd-b206-d6e74850951d)
![WhatsApp Image 2025-08-06 at 20 51 27](https://github.com/user-attachments/assets/d1bab7bd-7a69-4ad0-8a58-cfcd877970e6)
![WhatsApp Image 2025-08-06 at 20 53 08](https://github.com/user-attachments/assets/979a93a6-92a5-4274-8c8a-cbd43ca5ab3c)
![WhatsApp Image 2025-08-06 at 20 53 21](https://github.com/user-attachments/assets/4d39c325-8ae8-4fc6-9b29-a796ae383fbf)
![WhatsApp Image 2025-08-06 at 20 54 09](https://github.com/user-attachments/assets/dfed81b8-e1ab-4413-9942-0e6212573ed9)
![WhatsApp Image 2025-08-06 at 20 58 39](https://github.com/user-attachments/assets/001cb09f-23a5-4307-b715-fb8a4166f6e5)

## 🛠️ Teknik Mimari ve İşleyiş

Proje, modern bir teknoloji yığını üzerine inşa edilmiştir: **React (TypeScript)** ile geliştirilmiş dinamik bir ön uç ve **Python (FastAPI)** ile oluşturulmuş güçlü bir arka uç.

### Akış Diyagramı

```
Kullanıcı Arayüzü (React)
        |
        | 1.a Ürün Tarifi Gönderir
        v
FastAPI Backend
        |
        | 1.b İstek, ürün görseli oluşturulması için Gemini'a iletilir
        v
Gemini Image Generation
        |
        | 1.c Kullanıcı, ürün görsellerinden istediği ürünü seçer.
        |
        | 2. Ürün Agent'a İletilir
        v
+------------------------+
|   Agentic AI Sistemi   |
+------------------------+
        |
        | 3. Adım 1: Tag Üretici
        v
Gemini: Seçilen ürün için tag'ler oluşturulur.
        |
        | 4. Adım 2: Ürün Arama
        v
Veritabanı (Ecommerce DB)
        |
        | 5. Benzer Ürünleri Bulur (MCP)
        v
<--- geri Agentic AI Sistemi
        |
        | 6. Adım 3: Ürün Sıralayıcı
        v
Gemini: Ürünleri Değerlendirir ve Sıralar
        |
        | 7. Sonuçları Döndürür
        v
FastAPI Backend
        |
        | 8. Yanıtı Arayüze Gönderir
        v
Kullanıcı Arayüzü (React)

--------------------------------------------------------

          [ Satıcı Paneli Akışı ]

A/B Test Arayüzü
        |
        | a. Test Başlatma İsteği
        v
FastAPI Backend
        |
        | b. AI Öneri İsteği
        v
A/B Test Agent'ı
        |
        | c. Yeni Metin Önerir
        v
FastAPI Backend
        |
        | d. Öneriyi Arayüze Gönderir
        v
A/B Test Arayüzü
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

Projemizin kalbi, `backend/app/agent.py` dosyasında tanımlanan çok adımlı yapay zeka ajanıdır. Agentic AI sisteminin yapısı Agno Framework kullanıldı. Bu sistem, karmaşık görevleri daha küçük ve yönetilebilir adımlara bölerek çalışır:

1.  **Tag Generator Agent:** Kullanıcının ürün tarifini alır, Gemini modelini kullanarak bu tarife uygun e-ticaret etiketleri (`"bluetooth_kulaklik"`, `"ev_dekorasyonu"` vb.) üretir.
2.  **Product Search:** Üretilen etiketleri kullanarak `ecommerce.db` veritabanında, **kosinüs benzerliği (cosine similarity)** ile semantik bir arama gerçekleştirir. Bu, etiketlerin sırasından bağımsız olarak en alakalı sonuçların bulunmasını sağlar.
3.  **Product Evaluator Agent:** Bulunan ürünleri; etiket uyumu, fiyat ve kullanıcı puanları gibi kriterlere göre analiz eder ve en mantıklı sıralamayı yaparak kullanıcıya sunar.
4.  **A/B Test Suggestion Agent:** Satıcının bir ürünü için, mevcut kullanıcı arama sorgularını analiz ederek daha etkili olabilecek alternatif başlık ve açıklamalar önerir.

Bu mimari, hem daha isabetli sonuçlar üretmemizi sağlar hem de API çağrılarını optimize ederek maliyeti düşürür.

Copyright © Kardelen Aydınel, Ebru Naz Ayış 2025
All rights reserved.
