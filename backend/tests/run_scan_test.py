import requests

url = 'http://127.0.0.1:8000/api/v1/scan/upload'
with open('backend/storage/samples/sample_wheat_biscuits.jpg', 'rb') as f:
    files = {'file': f}
    data = {
        'product_name': 'Delight Wheat Biscuits',
        'brand': 'Delight Nutrition',
        'category': 'Packaged Food & Beverage',
        'store_name': 'Metro Cash & Carry, Rohini',
        'location': 'New Delhi',
        'pdp_area_sqcm': 150.0
    }
    print('Sending packaging to CompliScan API...')
    resp = requests.post(url, files=files, data=data, timeout=90)
    print('Response Status:', resp.status_code)
    if resp.status_code == 200:
        res = resp.json()
        print('Inspection ID:', res.get('id'))
        print('Verdict:', res.get('compliance_verdict'))
        print('Score:', res.get('overall_compliance_score'))
        print('Violations Count:', res.get('violations_count'))
        print('Notice Number:', res.get('notice_number'))
        print('PDF Path:', res.get('report_pdf_path'))
        print('Declarations Extracted:', len(res.get('declarations', [])))
        for d in res.get('declarations', []):
            print(f" - [{d.get('statutory_rule_ref')}] {d.get('field_name')}: {d.get('compliance_status')} (Font: {d.get('measured_font_height_mm')}mm) | {d.get('detected_value')}")
            if d.get('violation_description'):
                print(f"     => Violation: {d.get('violation_description')}")
    else:
        print('Error:', resp.text)
