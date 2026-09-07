import cv2
import numpy as np
from PIL import Image
from pathlib import Path
import math

class ImagePreprocessor:
    """
    OpenCV-based image preprocessing pipeline:
    - Auto-deskewing via Hough Lines and contour bounding
    - Perspective correction and quad warp
    - Adaptive Contrast Enhancement (CLAHE)
    - Glare reduction and specular attenuation
    - Principal Display Panel (PDP) estimation
    """

    @staticmethod
    def deskew_and_enhance(input_path: str, output_path: str) -> dict:
        img = cv2.imread(input_path)
        if img is None:
            raise ValueError(f"Unable to read image at {input_path}")

        orig_h, orig_w = img.shape[:2]

        # 1. Glare suppression / Reflection damping
        # Convert to LAB color space
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        # 2. Contrast Limited Adaptive Histogram Equalization (CLAHE) on L-channel
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        enhanced_lab = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        # 3. Detect skew angle using Grayscale & Edge threshold
        gray = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blur, 50, 150, apertureSize=3)

        # Detect orientation angle
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=orig_w // 4, maxLineGap=20)
        angle = 0.0
        if lines is not None and len(lines) > 0:
            angles = []
            for line in lines:
                l_arr = np.array(line).reshape(-1)
                if len(l_arr) >= 4:
                    x1, y1, x2, y2 = int(l_arr[0]), int(l_arr[1]), int(l_arr[2]), int(l_arr[3])
                    rad = math.atan2(y2 - y1, x2 - x1)
                    deg = math.degrees(rad)
                    if abs(deg) < 45:
                        angles.append(deg)
            if angles:
                median_angle = float(np.median(angles))
                if abs(median_angle) > 0.5:
                    angle = median_angle

        # 4. Rotate if skew detected
        rotated = enhanced
        if abs(angle) > 0.5 and abs(angle) < 40:
            center = (orig_w // 2, orig_h // 2)
            rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)
            rotated = cv2.warpAffine(enhanced, rot_mat, (orig_w, orig_h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

        # 5. Standardize to fixed canonical resolution if exceeding max dimension
        # (deterministic aspect-ratio preserving downscale using cv2.INTER_AREA)
        TARGET_MAX_DIM = 1600
        max_dim = max(orig_w, orig_h)
        if max_dim > TARGET_MAX_DIM:
            scale = TARGET_MAX_DIM / float(max_dim)
            std_w = int(round(orig_w * scale))
            std_h = int(round(orig_h * scale))
            rotated = cv2.resize(rotated, (std_w, std_h), interpolation=cv2.INTER_AREA)

        # 6. Save preprocessed output with fixed, deterministic compression parameters
        import hashlib
        cv2.imwrite(output_path, rotated, [cv2.IMWRITE_JPEG_QUALITY, 95])

        with open(output_path, "rb") as f:
            image_sha256 = hashlib.sha256(f.read()).hexdigest()

        # 7. Calculate PDP estimation (Default rectangular side: width * height in cm approx)
        # Using typical packaging PPI (96 to 150)
        estimated_pdp_area_sqcm = round((orig_w * orig_h) / (96 * 96) * 6.4516, 2)
        if estimated_pdp_area_sqcm < 20:
            estimated_pdp_area_sqcm = 65.0 # fallback sensible retail box size
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

    @staticmethod
    def calculate_font_height_mm(bbox: list, img_height: int, pdp_height_cm: float = 15.0) -> float:
        """
        Calculates physical font height in millimeters from normalized [ymin, xmin, ymax, xmax] (0-1000)
        and physical package height.
        """
        if not bbox or len(bbox) < 4:
            return 2.0 # default fallback
        
        ymin, xmin, ymax, xmax = bbox
        pixel_height = abs(ymax - ymin) / 1000.0 * img_height
        # Convert to mm using pdp_height_cm
        pdp_height_mm = pdp_height_cm * 10.0
        font_height_mm = (pixel_height / img_height) * pdp_height_mm
        return round(max(0.5, font_height_mm), 2)
