import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
import base64
from io import BytesIO
from PIL import Image

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


    # 1. Generate product descriptions with a text model
        # 1. Generate product descriptions with a text model
        # 1. Generate product descriptions with a text model
    system_instructions = (
        "Sen bir e-ticaret asistanısın. Sana ürün ismi unutan insanlar gelip belirsiz kelimelerle ürünlerini tanımlar. "
        "Görevin, bu kelimelerle en çok uyuşan ve birbirinden farklı 4 ürün önermek. "
        "Sonucu sadece JSON formatında, 'urunler' adında bir anahtar altında bir liste olarak döndür. "
        "Her ürün listesi objesi 'urun_adi' (Türkçe), 'urun_aciklama' (Türkçe), 'urun_adi_en' (İngilizce) ve 'visual_representation' (İngilizce) alanları içermelidir. "
        "Bu 'visual_representation' alanı, bir görsel üretim yapay zekası için talimattır. Ürünün markasız, jenerik bir versiyonunun nasıl göründüğünü detaylıca tarif etmelidir. Üründe renk sınırlaması yoktur."
        "Örneğin, 'derz dolgusu' için 'a tube of thick paste-like grout filler with a nozzle at the end, shown next to a small amount of the product squeezed out' gibi bir tanım olmalıdır. "
        "Bu tanım, ürünün fiziksel özelliklerini, şeklini ve materyalini içermeli ancak marka, yazı veya logo içermemelidir. "
        "Ayrıca, bu tanım ürünün tamamının görüneceği ve hiçbir parçasının kırpılmayacağı/kesilmeyeceği şekilde yapılmalıdır. "
        "JSON dışında kesinlikle başka metin ekleme."
    )

    combined_prompt = f"{system_instructions}\n\nKullanıcı tarifi: '{req.description}'"
    text_generation_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=" + api_key
    payload = {"contents": [{"parts": [{"text": combined_prompt}]}]}

    try:
        # --- Text Generation ---
        response = requests.post(text_generation_url, json=payload, timeout=90)
        response.raise_for_status()

        gemini_response_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        if gemini_response_text.strip().startswith("```json"):
            gemini_response_text = gemini_response_text.strip()[7:-3].strip()
        
        product_data = json.loads(gemini_response_text)
        products = product_data.get("urunler", [])

        print(products)
        
        # --- Image Generation ---
        for product in products:
            visual_description = product.get('visual_representation')

            if not visual_description:
                subject = product.get('urun_adi_en') or product.get('urun_adi', 'product')
                visual_description = f"a generic, new, and clean {subject}"
            
            # YENİ PROMPT: Detaylı görsel tanımı ve sabit sanat stilini birleştirirken, ürünün tamamının görünmesi gerektiğini vurgular.
            style_prompt = (
                f"Professional product photograph of {visual_description}. "
                "The entire product must be fully visible and centered in the frame, not cropped or cut off. "
                "The product is perfectly isolated on a seamless, solid pure white background. "
                "Shot in a professional photo studio with bright, soft, even commercial lighting. "
                "Photorealistic, hyper-detailed, 4K, e-commerce style, online marketplace photo."
            )
            
            # NEGATİF PROMPT: Aynı kalır.
            negative_style_prompt = (
                "text, words, logo, branding, labels, writing, signature, watermark, packaging with text, "
                "people, person, human, hands, fingers,"
                "clutter, messy, floor, table, shadows, complex background, real-world environment, "
                "3D render, CGI, drawing, sketch, illustration, cartoon, painting, art, unrealistic"
            )

            base64_image = generate_image_with_vertex(
                prompt=style_prompt,
                negative_prompt=negative_style_prompt
            )
            product['image_base64'] = base64_image

        return {"products": products}

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"API request failed: {e}")
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {e}, Response Text: {gemini_response_text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")