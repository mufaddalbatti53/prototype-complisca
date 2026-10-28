import time
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_packaging_upload_scan():
    print("Testing Legal Metrology Packaging Scan on upload...")
    with open("backend/storage/samples/sample_wheat_biscuits.jpg", "rb") as f:
        t0 = time.time()
        resp = client.post(
            "/api/v1/scan/upload",
            files={"file": ("sample_wheat_biscuits.jpg", f, "image/jpeg")},
            data={
                "product_name": "Delight Wheat Biscuits",
                "brand": "Delight Nutrition",
                "category": "Packaged Food & Beverage",
                "store_name": "Metro Cash & Carry, Rohini",
                "location": "New Delhi",
                "pdp_area_sqcm": 150.0
            }
        )
        latency = time.time() - t0
        print(f"Packaging Scan Status: {resp.status_code}, Latency: {latency:.3f}s")
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert "compliance_verdict" in data
        assert "overall_compliance_score" in data
        assert "declarations" in data
        assert len(data["declarations"]) > 0
        print("Inspection ID:", data.get("id"))
        print("Verdict:", data.get("compliance_verdict"))
        print("Score:", data.get("overall_compliance_score"))
        print("Declarations count:", len(data["declarations"]))

