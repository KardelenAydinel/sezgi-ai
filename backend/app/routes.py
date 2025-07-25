import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
import base64
from io import BytesIO
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
import warnings

# Suppress the specific UserWarning from the Vertex AI SDK
warnings.filterwarnings(
    "ignore",
    message="This feature is deprecated as of June 24, 2025 and will be removed on June 24, 2026.",
    category=UserWarning
)

# Vertex AI SDK
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel

router = APIRouter()

class DescriptionRequest(BaseModel):
    description: str

def resize_image(image_bytes: bytes, size: tuple[int, int] = (256, 256)) -> bytes:
    """Resizes an image to the specified size."""
    with Image.open(BytesIO(image_bytes)) as img:
        img.thumbnail(size)
        buf = BytesIO()
        img.save(buf, format='PNG')
        return buf.getvalue()

def generate_image_with_vertex(prompt: str, negative_prompt: str) -> str | None:
    """Generates an image using Vertex AI, resizes it, and returns it as a Base64 encoded string."""
    try:
        model = ImageGenerationModel.from_pretrained("imagegeneration@006")
        response = model.generate_images(
            prompt=prompt,
            number_of_images=1,
            aspect_ratio="1:1",
            negative_prompt=negative_prompt,
        )
        if response.images:
            image_bytes = response.images[0]._image_bytes
            # Resize the image before encoding
            resized_image_bytes = resize_image(image_bytes)
            return base64.b64encode(resized_image_bytes).decode('utf-8')
        return None
    except Exception as e:
        print(f"Error during Vertex AI image generation: {e}")
        return None


def ask_llm_for_safer_prompt(original_representation: str) -> str:
    """If the initial visual representation fails, ask the text LLM to create a simpler, safer version."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "a generic product" # Fallback if key is missing

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={api_key}"
    
    prompt_for_llm = (
        f"The following visual description for an image generation AI failed, likely due to safety filters or being too complex: '{original_representation}'. "
        "Please rewrite this into a shorter, simpler, safer, and more direct visual description of the core product. "
        "Focus on the main object. Do not add extra commentary. Give me only the new description."
    )
    
    payload = {"contents": [{"parts": [{"text": prompt_for_llm}]}]}
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        safer_prompt = response.json()['candidates'][0]['content']['parts'][0]['text']
        print(f"LLM generated a safer prompt: '{safer_prompt}'")
        return safer_prompt
    except Exception as e:
        print(f"Could not get a safer prompt from LLM, falling back to product name. Error: {e}")
        return "a generic, new, and clean product"


def generate_and_encode_image(product: dict) -> dict:
    """Task function to generate an image for a single product and add the base64 string to it. Includes a retry mechanism."""
    
    # --- Primary Attempt using detailed visual representation ---
    visual_description = product.get('visual_representation')
    if not visual_description:
        subject = product.get('urun_adi_en') or product.get('urun_adi', 'product')
        visual_description = f"a generic, new, and clean {subject}"
    
    style_prompt = (
        f"Professional product photograph of {visual_description}. "
        "The product is shown by itself, isolated on a seamless, solid pure white background. "
        "The entire product must be fully visible and centered in the frame, not cropped or cut off. "
        "Shot in a professional photo studio with bright, soft, even commercial lighting. "
        "Photorealistic, hyper-detailed, 4K, e-commerce style, online marketplace photo."
    )
    
    negative_style_prompt = (
        "text, words, logo, branding, labels, writing, signature, watermark, packaging with text, "
        "people, person, human, hands, fingers, faces"
        "clutter, messy, floor, table, shadows, complex background, real-world environment, "
        "3D render, CGI, drawing, sketch, illustration, cartoon, painting, art, unrealistic"
    )

    base64_image = generate_image_with_vertex(
        prompt=style_prompt,
        negative_prompt=negative_style_prompt
    )
    
    # --- Fallback Attempt if the first one fails ---
    if base64_image is None:
        print(f"Primary image generation failed for '{product.get('urun_adi')}', '{product.get('visual_representation')}' . Asking LLM for a safer prompt.")
        
        # Ask the text LLM to refine the failing prompt
        safer_visual_description = ask_llm_for_safer_prompt(visual_description)
        
        # Retry with the new, safer prompt
        safer_style_prompt = (
            f"Professional product photograph of {safer_visual_description}. "
            "The entire product must be fully visible and centered in the frame, not cropped or cut off. "
            "The product is perfectly isolated on a seamless, solid pure white background. "
            "Shot in a professional photo studio with bright, soft, even commercial lighting. "
            "Photorealistic, hyper-detailed, 4K, e-commerce style, online marketplace photo."
        )
        
        base64_image = generate_image_with_vertex(
            prompt=safer_style_prompt,
            negative_prompt=negative_style_prompt
        )
        
        # If it still fails, use a final, super-safe fallback
        if base64_image is None:
            print("LLM-assisted retry also failed. Using a generic prompt as a last resort.")
            subject = product.get('urun_adi_en') or product.get('urun_adi', 'product')
            super_safe_prompt = f"Professional product photograph of a generic {subject}."
            base64_image = generate_image_with_vertex(
                prompt=super_safe_prompt,
                negative_prompt=negative_style_prompt
            )

    product['image_base64'] = base64_image
    return product


@router.post("/gemini_suggestions")
def gemini_suggestions(req: DescriptionRequest):
    # --- Environment Variable Checks ---
    api_key = os.getenv("GEMINI_API_KEY")
    project_id = os.getenv("GCP_PROJECT_ID")
    location = os.getenv("GCP_REGION")

    if not all([api_key, project_id, location]):
        raise HTTPException(status_code=500, detail="Required environment variables (GEMINI_API_KEY, GCP_PROJECT_ID, GCP_REGION) are not set.")

    # --- Initialize Vertex AI ---
    try:
        vertexai.init(project=project_id, location=location)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize Vertex AI: {e}")


    # --- AŞAMA 1: SİSTEM TALİMATINI GÜNCELLEME ---
    system_instructions = (
        "Sen bir e-ticaret asistanısın. Sana ürün ismi unutan insanlar gelip belirsiz kelimelerle ürünlerini tanımlar. "
        "Önce, kaç tane ürün önereceğini belirle (2, 3 veya 4). Eğer kullanıcının tarifi çok spesifikse 2, orta düzeyde açıksa 3, çok genişse ve birbirinden farklı viable seçenekler bulabiliyorsan 4 öneri yap. "
        "Bu sayıyı 'number_of_cards' alanında belirt. "
        "Bu önerileri, kullanıcının tarifine en çok uyandan en az uyana doğru sıralamalısın. "
        "Sonucu sadece JSON formatında döndür. JSON şu yapıda olmalı: { 'number_of_cards': [2, 3 veya 4], 'urunler': [...] }. "
        "Her ürün listesi objesi 'urun_adi' (Türkçe), 'urun_aciklama' (Türkçe), 'urun_adi_en' (İngilizce) ve 'visual_representation' (İngilizce) alanları içermelidir. "
        "Bu 'visual_representation' alanı, bir görsel üretim yapay zekası için talimattır. Ürünün markasız, jenerik bir versiyonunun nasıl göründüğünü detaylıca tarif etmelidir. Üründe renk sınırlaması yoktur. "
        "Örneğin, 'derz dolgusu' için 'a tube of thick paste-like grout filler with a nozzle at the end, shown next to a small amount of the product squeezed out' gibi bir tanım olmalıdır. "
        "Bu tanım, ürünün fiziksel özelliklerini, şeklini ve materyalini içermeli ancak marka, yazı veya logo içermemelidir. "
        "Ayrıca, bu tanım ürünün tamamının görüneceği ve hiçbir parçasının kırpılmayacağı/kesilmeyeceği şekilde yapılmalıdır. "
        "JSON dışında kesinlikle başka metin ekleme."
    )

    
    combined_prompt = f"{system_instructions}\n\nKullanıcı tarifi: '{req.description}'"
    text_generation_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={api_key}"
    payload = {"contents": [{"parts": [{"text": combined_prompt}]}]}

    try:
        # --- Text Generation ---
        response = requests.post(text_generation_url, json=payload, timeout=90)
        response.raise_for_status()

        gemini_response_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        if gemini_response_text.strip().startswith("```json"):
            gemini_response_text = gemini_response_text.strip()[7:-3].strip()
        
        product_data = json.loads(gemini_response_text)
        number_of_cards = product_data.get("number_of_cards", 4)
        products = product_data.get("urunler", [])
        
        # Ensure we don't exceed the specified number of cards
        products = products[:number_of_cards]

        print(f"Number of cards: {number_of_cards}")
        print(products)
        
        # --- Concurrent Image Generation ---
        with ThreadPoolExecutor(max_workers=4) as executor:
            # Submit all image generation tasks to the thread pool
            future_to_product = {executor.submit(generate_and_encode_image, p): p for p in products}
            
            # Collect results as they complete
            updated_products = []
            for future in as_completed(future_to_product):
                try:
                    updated_product = future.result()
                    updated_products.append(updated_product)
                    print(f"Added product: {updated_product.get('urun_adi')} - Total so far: {len(updated_products)}")
                except Exception as exc:
                    print(f"A product image generation task generated an exception: {exc}")
                    # Optionally, you can add the original product without an image
                    original_product = future_to_product[future]
                    original_product['image_base64'] = None
                    updated_products.append(original_product)
                    print(f"Added failed product: {original_product.get('urun_adi')} - Total so far: {len(updated_products)}")
            
            print(f"Final response: number_of_cards={number_of_cards}, products_count={len(updated_products)}")
            return {"number_of_cards": number_of_cards, "products": updated_products}

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"API request failed: {e}")
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {e}, Response Text: {gemini_response_text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")