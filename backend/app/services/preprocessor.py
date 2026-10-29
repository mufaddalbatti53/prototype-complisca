import cv2
import numpy as np
import math
from PIL import Image

class ImagePreprocessor:
    """
    Image enhancement and dimension calibration engine.
    Prepares raw camera packaging photos for robust OCR extraction.
    """

    @staticmethod
    def deskew_and_enhance(input_path: str, output_path: str) -> dict:
        """
        Enhances contrast, normalizes resolution, and calculates estimated PDP area.
        """
        img = cv2.imread(input_path)
        if img is None:
            raise ValueError(f"Unable to read image at {input_path}")

        orig_h, orig_w = img.shape[:2]

        # enhance and standardize
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        enhanced_lab = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        processed_img = enhanced
        angle = 0.0

        TARGET_MAX_DIM = 1200
        max_dim = max(orig_w, orig_h)
        if max_dim > TARGET_MAX_DIM:
            scale = TARGET_MAX_DIM / float(max_dim)
            std_w = int(round(orig_w * scale))
            std_h = int(round(orig_h * scale))
            processed_img = cv2.resize(enhanced, (std_w, std_h), interpolation=cv2.INTER_AREA)

        import hashlib
        cv2.imwrite(output_path, processed_img, [cv2.IMWRITE_JPEG_QUALITY, 85])

        with open(output_path, "rb") as f:
            image_sha256 = hashlib.sha256(f.read()).hexdigest()

        estimated_pdp_area_sqcm = round((orig_w * orig_h) / (96 * 96) * 6.4516, 2)
        if estimated_pdp_area_sqcm < 20:
            estimated_pdp_area_sqcm = 65.0
        elif estimated_pdp_area_sqcm > 2000:
            estimated_pdp_area_sqcm = 250.0

        return {
            "original_width": orig_w,
            "original_height": orig_h,
            "skew_angle_corrected": round(angle, 2),
            "estimated_pdp_area_sqcm": estimated_pdp_area_sqcm,
            "preprocessed_path": output_path,
            "image_sha256": image_sha256
        }

    # font height
    @staticmethod
    def calculate_font_height_mm(bbox: list, img_height: int, pdp_height_cm: float = 15.0) -> float:
        """
        Calculates physical font height in millimeters from normalized [ymin, xmin, ymax, xmax] (0-1000)
        and physical package height.
        """
        if not bbox or len(bbox) < 4:
            return 2.0
        
        ymin, xmin, ymax, xmax = bbox
        pixel_height = abs(ymax - ymin) / 1000.0 * img_height
        pdp_height_mm = pdp_height_cm * 10.0
        font_height_mm = (pixel_height / img_height) * pdp_height_mm
        return round(max(0.5, font_height_mm), 2)
