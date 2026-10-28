import requests
from bs4 import BeautifulSoup
import re
import os
import uuid
from pathlib import Path
from backend.app.core.config import settings

class EcommerceScraperService:
    """
    Fetches product packaging images and listing text from Indian e-commerce platforms
    (Amazon India, Flipkart, Blinkit, Zepto, generic e-commerce).
    """

    @staticmethod
    def extract_product_from_url(url: str) -> dict:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
        }

        try:
            resp = requests.get(url, headers=headers, timeout=12)
        except requests.exceptions.MissingSchema:
            raise Exception("No URL scheme supplied. Please enter a complete URL starting with https://")
        except requests.exceptions.InvalidURL:
            raise Exception("The URL provided is malformed or invalid.")
        except requests.exceptions.ConnectionError:
            raise Exception("Unable to connect to the provided website. Please verify the link is publicly accessible.")
        except requests.exceptions.Timeout:
            raise Exception("Connection timed out while trying to reach the product URL.")
        except Exception as e:
            raise Exception(f"Network error accessing URL: {str(e)}")

        if resp.status_code != 200:
            raise Exception(f"E-commerce server responded with status code {resp.status_code}")

        soup = BeautifulSoup(resp.text, "html.parser")
        
        # 1. Product title
        title = "Packaged Product"
        title_tag = soup.find("span", {"id": "productTitle"}) or soup.find("h1") or soup.find("title")
        if title_tag:
            title = title_tag.get_text(strip=True)

        # 2. Extract best high-res packaging image
        image_url = None
        
        # Amazon image patterns
        landing_img = soup.find("img", {"id": "landingImage"})
        if landing_img and landing_img.get("src"):
            image_url = landing_img.get("src")
        
        # OpenGraph image
        if not image_url:
            og_img = soup.find("meta", property="og:image")
            if og_img and og_img.get("content"):
                image_url = og_img.get("content")

        # Any large product image fallback
        if not image_url:
            for img in soup.find_all("img"):
                src = img.get("src", "")
                if "product" in src.lower() or "media" in src.lower() or "images" in src.lower():
                    image_url = src
                    break

        if not image_url:
            raise Exception("Could not detect high-resolution product packaging image from listing.")

        # 3. Download image to uploads folder
        img_resp = requests.get(image_url, headers=headers, timeout=15)
        if img_resp.status_code != 200:
            raise Exception("Failed to download packaging image from e-commerce page.")

        ext = ".jpg"
        if ".png" in image_url.lower():
            ext = ".png"
        elif ".webp" in image_url.lower():
            ext = ".webp"

        file_id = f"ecom_{uuid.uuid4().hex[:10]}"
        dest_filename = f"{file_id}{ext}"
        dest_path = str(settings.UPLOAD_DIR / dest_filename)

        with open(dest_path, "wb") as f:
            f.write(img_resp.content)

        return {
            "title": title[:200],
            "image_url": image_url,
            "local_image_path": dest_path,
            "file_id": file_id
        }
