import encodings
import requests

url = "http://127.0.0.1:8000/products"
product = {
    "pro_name": "iPhone 15",
    "cat_id": "c1a7f2b0-9d3a-4e1f-8a2a-1f9d8a7b1234",
    "brand": "Apple",
    "attributes": {
        "RAM": "8GB",
        "CPU": "A17 Bionic",
        "Battery": "4000mAh"
    },
    "description": "Apple’s flagship with A17 Bionic, sleek design, and smooth performance…",
    "reviews": [
        {"user": "Nam", "comment": "Máy chạy mượt", "rating": 5},
        {"user": "Lan", "comment": "Pin hơi yếu", "rating": 3}
    ],
    "price": 1200,
    "stock": 30
}

response = requests.post(url, json=product)
print(response.json())
