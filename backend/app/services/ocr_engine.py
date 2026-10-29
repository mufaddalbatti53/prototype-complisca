import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from typing import List, Dict, Any

os.environ['PYTHONIOENCODING'] = 'utf-8'

try:
    import easyocr
    _easyocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
except Exception:
    _easyocr_reader = None

class OCREngine:
    """
    High-Precision Dual OCR & Spatial Dimension Engine:
    - Deep Learning Character Recognition via EasyOCR (CRAFT + CRNN)
    - Millimeter font height math relative to physical packaging scale
    - Statutory compliance bounding box visualizer
    """

    COLOR_MAP = {
        "COMPLIANT": (16, 185, 129),   # Emerald
        "WARNING": (245, 158, 11),     # Amber
        "VIOLATION": (239, 68, 68),    # Crimson Red
    }

    @classmethod
    def run_local_ocr(cls, image_path: str) -> List[Dict[str, Any]]:
        """
        Runs local Deep-Learning OCR to extract exact text tokens,
        bounding boxes [[x1, y1], [x2, y1], [x2, y2], [x1, y2]], and confidence scores.
        """
        if _easyocr_reader is None:
            return []

        try:
            results = _easyocr_reader.readtext(image_path)
            ocr_tokens = []
            img = cv2.imread(image_path)
            h, w = img.shape[:2] if img is not None else (1000, 1000)

            for bbox, text, conf in results:
                pts = np.array(bbox, dtype=np.int32)
                xmin = int(np.min(pts[:, 0]))
                xmax = int(np.max(pts[:, 0]))
                ymin = int(np.min(pts[:, 1]))
                ymax = int(np.max(pts[:, 1]))

                norm_box = [
                    int(ymin / max(1, h) * 1000),
                    int(xmin / max(1, w) * 1000),
                    int(ymax / max(1, h) * 1000),
                    int(xmax / max(1, w) * 1000),
                ]

                ocr_tokens.append({
                    "text": text.strip(),
                    "confidence": round(float(conf), 3),
                    "box_2d": norm_box,
                    "pixel_height": max(1, ymax - ymin)
                })

            return ocr_tokens
        except Exception as e:
            return []

    @staticmethod
    def draw_compliance_overlay(
        image_path: str,
        declarations: List[Dict[str, Any]],
        output_path: str,
        pdp_height_cm: float = 15.0
    ) -> str:
        img = Image.open(image_path).convert("RGB")
        draw = ImageDraw.Draw(img)
        w, h = img.size

        try:
            font = ImageFont.truetype("arial.ttf", size=max(14, int(h * 0.02)))
            small_font = ImageFont.truetype("arial.ttf", size=max(11, int(h * 0.014)))
        except Exception:
            font = ImageFont.load_default()
            small_font = font

        for decl in declarations:
            bbox = decl.get("bounding_box", [])
            status = decl.get("compliance_status", "COMPLIANT").upper()
            color = OCREngine.COLOR_MAP.get(status, (6, 182, 212))
            rule_ref = decl.get("statutory_rule_ref", "")
            font_height_mm = decl.get("measured_font_height_mm")

            if not bbox or len(bbox) < 4:
                continue

            ymin, xmin, ymax, xmax = bbox
            px_xmin = int(xmin / 1000.0 * w)
            px_ymin = int(ymin / 1000.0 * h)
            px_xmax = int(xmax / 1000.0 * w)
            px_ymax = int(ymax / 1000.0 * h)

            px_xmin = max(0, min(w - 1, px_xmin))
            px_xmax = max(px_xmin + 5, min(w - 1, px_xmax))
            px_ymin = max(0, min(h - 1, px_ymin))
            px_ymax = max(px_ymin + 5, min(h - 1, px_ymax))

            border_width = max(3, int(w * 0.0035))
            draw.rectangle([px_xmin, px_ymin, px_xmax, px_ymax], outline=color, width=border_width)

            label_text = f"[{rule_ref}] {status}"
            if font_height_mm:
                label_text += f" | {font_height_mm}mm"

            text_bbox = draw.textbbox((px_xmin, max(0, px_ymin - 24)), label_text, font=small_font)
            padded_bbox = [text_bbox[0] - 3, text_bbox[1] - 3, text_bbox[2] + 4, text_bbox[3] + 3]
            draw.rectangle(padded_bbox, fill=color)
            draw.text((px_xmin + 2, max(0, px_ymin - 22)), label_text, fill=(255, 255, 255), font=small_font)

        img.save(output_path, quality=94)
        return output_path
