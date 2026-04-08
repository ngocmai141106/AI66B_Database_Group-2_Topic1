#ok file này để viết các endpoint chức năng đồ ơ
#cop tn ngày 7/4:
#-C: Tạo product mới, tạo thêm attribute hoặc review cho 1 product đã tồn tại
#-R: Xem 2 bảng dữ liệu (phiên bản thường), sort theo brand, category, mức giá, hoặc từ khóa tên spham. Đồng thời thì đánh giá (0-5 sao) cũng phải luôn hiển thị
#-U: Update tất cả các trường ttin (trừ id) cho spham; update mô tả một category
#-D: Xóa 1 sản phẩm, hoặc 1 attribute hoặc review của 1 spham
#chốt chế độ hiển thị mặc định là 3 bảng nhé ! nào bấm vào glb search thì mới trộn một (trừ khi search theo cat)

#lần đầu tiên chạy file, ae chạy các dòng sau trong terminal:
#pip install fastapi
#pip install pymongo
#cd code\API
#uvicorn endpoints:app --reload
#báo application startup complete là thành công.

from fastapi import FastAPI
from uuid import uuid4
from pymongo import MongoClient

app = FastAPI()
client = MongoClient("mongodb://localhost:27017")
db = client["ecommerce_catalog"]

#create unique index as starting the app
#create text index on prd's name and description too
@app.on_event("startup")
def startup_event():
    db.products.create_index("pro_id", unique=True)
    db.products.create_index("reviews.rev_id", unique=True, sparse=True)
    db.products.create_index([("pro_name", "text"), ("description", "text")])
    db.products.create_index([("cat_id", 1)])
    db.products.create_index([("brand", 1)])
    db.products.create_index([("price", 1)])


#C-type:
#add new product
@app.post("/products")
def create_product(product: dict):
    product["pro_id"] = str(uuid4())
    try:
        db.products.insert_one(product)
        return {"message": "Product created", "product": product}
    except DuplicateKeyError:
        # Nếu trùng, sinh lại UUID và thử insert lại
        product["pro_id"] = str(uuid4())
        db.products.insert_one(product)
        return {"message": "Product created after retry", "product": product}

#add new attribute for an existed product
@app.post("/products/{id}/attributes")
def add_attribute(id: str, attribute: dict):
    #get the key and value from the attribute dict to check if it exists yet
    attr_key = list(attribute.keys())[0]
    attr_value = list(attribute.values())[0]
    product = db.products.find_one({"pro_id": id}, {"_id": 0, f"attributes.{attr_key}": 1})
    if product and "attributes" in product and attr_key in product["attributes"]:
        #if already exists, do not allow
        raise HTTPException(status_code=400, detail=f"Attribute '{attr_key}' already exists for this product")
    #if no, allow the system to create this attribute
    db.products.update_one(
        {"pro_id": id},
        {"$set": {f"attributes.{attr_key}": attr_value}}
    )
    return {"message": "Attribute added", "attribute": {attr_key: attr_value}}

#add new review for an existed product
@app.post("/products/{id}/reviews")
def add_review(id: str, review: dict):
    review["rev_id"] = str(uuid4())
    try:
        db.products.update_one(
            {"pro_id": id},
            {"$push": {"reviews": review}}
        )
        return {"message": "Review added", "review": review}
    except DuplicateKeyError:
        #if duplicate, re-generate another
        review["rev_id"] = str(uuid4())
        db.products.update_one(
            {"pro_id": id},
            {"$push": {"reviews": review}}
        )
        return {"message": "Review added after retry", "review": review}


#R type (including searching)
#this has been combined with avg computing
#local view (view by each category's table/collection)
@app.get("/products/by_category/{cat_id}")
def list_products_by_category(cat_id: str):
    pipeline = [
        {"$match": {"cat_id": cat_id}},
        {"$project": {
            "_id": 0,
            "pro_id": 1,
            "pro_name": 1,
            "description": 1,
            "avg_rating": {"$avg": "$reviews.rating"}
        }}
    ]
    products = list(db.products.aggregate(pipeline))
    return {"products": products}

#view one product
@app.get("/products")
def list_products():
    pipeline = [
        {"$project": {
            "_id": 0,
            "pro_id": 1,
            "pro_name": 1,
            "description": 1,
            "avg_rating": {"$avg": "$reviews.rating"}
        }}
    ]
    products = list(db.products.aggregate(pipeline))
    return {"products": products}

#local search
@app.get("/products/search/local/{cat_id}")
def search_local(
    cat_id: str,
    keyword: str,
    name: str = None,
    brand: str = None,
    attr_key: str = None,
    attr_value: str = None,
    min_price: float = None,
    max_price: float = None
):
    match_stage = {
        "cat_id": cat_id,
        "$text": {"$search": keyword}
    }
    if name:
        match_stage["pro_name"] = {"$regex": name, "$options": "i"}
    if brand:
        match_stage["brand"] = {"$regex": brand, "$options": "i"}
    if attr_key and attr_value:
        match_stage[f"attributes.{attr_key}"] = {"$regex": attr_value, "$options": "i"}
    if min_price is not None and max_price is not None:
        match_stage["price"] = {"$gte": min_price, "$lte": max_price}
    pipeline = [
        {"$match": match_stage},
        {"$project": {
            "_id": 0,
            "pro_id": 1,
            "pro_name": 1,
            "description": 1,
            "avg_rating": {"$avg": "$reviews.rating"},
            "score": {"$meta": "textScore"}
        }},
        {"$sort": {"score": {"$meta": "textScore"}}}
    ]
    products = list(db.products.aggregate(pipeline))
    return {"products": products}

#glb search
@app.get("/products/search/global")
def search_global(
    keyword: str,
    name: str = None,
    brand: str = None,
    attr_key: str = None,
    attr_value: str = None,
    min_price: float = None,
    max_price: float = None
):
    match_stage = {"$text": {"$search": keyword}}

    if name:
        match_stage["pro_name"] = {"$regex": name, "$options": "i"}
    if brand:
        match_stage["brand"] = {"$regex": brand, "$options": "i"}
    if attr_key and attr_value:
        match_stage[f"attributes.{attr_key}"] = {"$regex": attr_value, "$options": "i"}
    if min_price is not None and max_price is not None:
        match_stage["price"] = {"$gte": min_price, "$lte": max_price}
    pipeline = [
        {"$match": match_stage},
        {"$project": {
            "_id": 0,
            "pro_id": 1,
            "pro_name": 1,
            "description": 1,
            "avg_rating": {"$avg": "$reviews.rating"},
            "score": {"$meta": "textScore"}
        }},
        {"$sort": {"score": {"$meta": "textScore"}}}
    ]

    products = list(db.products.aggregate(pipeline))
    return {"products": products}



#U type
#all U functions don't allow modifying id so no need for unique uuid constraint
#update a product
@app.put("/products/{id}")
def update_product(id: str, update_data: dict):
    if "pro_id" in update_data:
        update_data.pop("pro_id")
    db.products.update_one({"pro_id": id}, {"$set": update_data})
    return {"message": "Product updated", "update": update_data}

#update a product's attribute
@app.put("/products/{id}/attributes/{attr_key}")
def update_attribute(id: str, attr_key: str, value: str):
    db.products.update_one(
        {"pro_id": id},
        {"$set": {f"attributes.{attr_key}": value}}
    )
    return {"message": "Attribute updated", "attribute": {attr_key: value}}

#update a product's review
@app.put("/products/{id}/reviews/{rev_id}")
def update_review(id: str, rev_id: str, update_data: dict):
    db.products.update_one(
        {"pro_id": id, "reviews.rev_id": rev_id},
        {"$set": {f"reviews.$.{k}": v for k, v in update_data.items()}}
    )
    return {"message": "Review updated", "update": update_data}

#update a category's description
@app.put("/categories/{id}")
def update_category(id: str, update_data: dict):
    db.categories.update_one({"cat_id": id}, {"$set": update_data})
    return {"message": "Category updated", "update": update_data}



#D type
#delete a product
@app.delete("/products/{id}")
def delete_product(id: str):
    db.products.delete_one({"pro_id": id})
    return {"message": "Product deleted", "pro_id": id}

#delete a product's attribute
@app.delete("/products/{id}/attributes/{attr_key}")
def delete_attribute(id: str, attr_key: str):
    db.products.update_one(
        {"pro_id": id},
        {"$unset": {f"attributes.{attr_key}": ""}}
    )
    return {"message": "Attribute deleted", "attr_key": attr_key}

#delete a product's review
@app.delete("/products/{id}/reviews/{rev_id}")
def delete_review(id: str, rev_id: str):
    db.products.update_one(
        {"pro_id": id},
        {"$pull": {"reviews": {"rev_id": rev_id}}}
    )
    return {"message": "Review deleted", "rev_id": rev_id}



#endpoints for advanced ft
#full text search only bc computing avg rating has been included in searching ft
@app.get("/products/search/text")
def search_text(query: str):
    products = list(db.products.find(
        {"$text": {"$search": query}},
        #include relevence score and sort by it
        {"_id": 0, "score": {"$meta": "textScore"}}
    ).sort([("score", {"$meta": "textScore"})]))
    return {"products": products}