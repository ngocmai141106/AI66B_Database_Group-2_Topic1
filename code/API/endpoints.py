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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
def convert_objectid(doc):
    if isinstance(doc, list):
        return [convert_objectid(d) for d in doc]
    elif isinstance(doc, dict):
        new_doc = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                new_doc[k] = str(v)
            elif isinstance(v, (dict, list)):
                new_doc[k] = convert_objectid(v)
            else:
                new_doc[k] = v
        return new_doc
    else:
        return doc

app = FastAPI()

origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
client = MongoClient("mongodb://localhost:27017")
db = client["ecommerce_catalog"]

#create unique index as starting the app
#create text index on prd's name and description too
@app.on_event("startup")
def startup_event():# event cho nút confirm if insert
    db.products.create_index("reviews.rev_id", unique=True, sparse=True)
    db.products.create_index([("pro_name", "text"), ("description", "text")])
    db.products.create_index([("cat_id", 1)])
    db.products.create_index([("brand", 1)])
    db.products.create_index([("price", 1)])


#C-type:
#add new product
#input: cat_id, pro_name, description, price, brand, attributes (dict), reviews (list of dict)
@app.post("/products")
def create_product(product: dict):
    if "cat_id" not in product:
        raise HTTPException(status_code=400, detail="cat_id is required")
    product["cat_id"] = str(product["cat_id"])
    if "category" in product:
        product.pop("category")
        # Convert attributes from dict to list if necessary
    if "attributes" in product and isinstance(product["attributes"], dict):
        product["attributes"] = [{"name": k, "value": v} for k, v in product["attributes"].items()]
    result = db.products.insert_one(product)
    return {
        "message": "Product created successfully",
        "id": str(result.inserted_id)
    }

#add new attribute for an existed product
@app.post("/products/{id}/attributes")
def add_attribute(id: str, attribute: dict):
    #get the key and value from the attribute dict to check if it exists yet
    attr_key = list(attribute.keys())[0]
    attr_value = list(attribute.values())[0]
    try:
        product = db.products.find_one({"_id": ObjectId(id)}, {"attributes": 1})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ObjectId format")
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.get("attributes"):
        for attr in product["attributes"]:
            if attr["name"] == attr_key:
                raise HTTPException(status_code=400, detail=f"Attribute '{attr_key}' already exists for this product")
    product = db.products.find_one({"pro_id": id}, {"_id": 0, f"attributes.{attr_key}": 1})
    if product and "attributes" in product and attr_key in product["attributes"]:
        #if already exists, do not allow
        raise HTTPException(status_code=400, detail=f"Attribute '{attr_key}' already exists for this product")
    #if no, allow the system to create this attribute
    db.products.update_one(
        {"_id": ObjectId(id)},
        {"$push": {"attributes": {"name": attr_key, "value": attr_value}}}
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
#view cat
@app.get("/categories")
def get_categories():
    return list(db.categories.find({}, {"_id":0}))

#view products in a cat
@app.get("/products/by_category/{cat_id}")
def list_products_by_category(cat_id: str):
    pipeline = [
        {"$match": {"cat_id": cat_id}},
        {"$project": {
            "_id": {"$toString": "$_id"},
            "pro_name": 1,
            "brand": 1,
            "description": 1,
            "price": 1,
            "stock": 1,
            "attributes": 1,
            "reviews": 1,
            "avg_rating": {"$avg": "$reviews.rating"}
        }}
    ]
    products = list(db.products.aggregate(pipeline))
    #products = convert_objectid(products)
    return {"products": products}

#view one product
@app.get("/products")
def list_products():
    pipeline = [
        {"$project": {
            "_id": {"$toString": "$_id"},
            "pro_id": 1,
            "pro_name": 1,
            "description": 1,
            "brand": 1,
            "price": 1,
            "stock": 1,
            "attributes": 1,
            "reviews": 1,
            "avg_rating": {"$avg": "$reviews.rating"},
            #"score": {"$meta": "textScore"}
        }}
    ]
    products = list(db.products.aggregate(pipeline))
    return {"products": products}

#view a product's in4
from bson import ObjectId
from fastapi import HTTPException

@app.get("/products/{id}")
def get_product(id: str):
    try:
        product = db.products.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ObjectId format")

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return convert_objectid(product)

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
        match_stage["attributes"] = {
            "$elemMatch": {"name": attr_key, "value": {"$regex": attr_value, "$options": "i"}}
        }
    if min_price is not None and max_price is not None:
        match_stage["price"] = {"$gte": min_price, "$lte": max_price}
    pipeline = [
        {"$match": match_stage},
        {"$project": {
            "_id": {"$toString": "$_id"},
            "pro_name": 1,
            "description": 1,
            "brand": 1,
            "price": 1,
            "stock": 1,
            "attributes": 1,
            "reviews": 1,
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
        match_stage["attributes"] = {
            "$elemMatch": {"name": attr_key, "value": {"$regex": attr_value, "$options": "i"}}
        }
    if min_price is not None and max_price is not None:
        match_stage["price"] = {"$gte": min_price, "$lte": max_price}
    pipeline = [
        {"$match": match_stage},
        {"$project": {
            "_id": {"$toString": "$_id"},
            "pro_name": 1,
            "description": 1,
            "brand": 1,
            "price": 1,
            "stock": 1,
            "attributes": 1,
            "reviews": 1,
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
    try:
        db.products.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ObjectId format")
    return {"message": "Product updated"}

#update a product's attribute
@app.put("/products/{id}/attributes/{attr_key}")
def update_attribute(id: str, attr_key: str, data: dict):
    try:
        value = data.get("value")
        result = db.products.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"attributes.$[elem].value": value}},
            array_filters=[{"elem.name": attr_key}]
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Attribute not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ObjectId format")
    return {"message": "Attribute updated", "attribute": {attr_key: value}}

#update a product's review
@app.put("/products/{id}/reviews/{rev_id}")
def update_review(id: str, rev_id: str, update_data: dict):
    try:
        db.products.update_one(
            {"_id": ObjectId(id), "reviews.rev_id": rev_id},
            {"$set": {f"reviews.$.{k}": v for k, v in update_data.items()}}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ObjectId format")
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
    try:
        result = db.products.delete_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ObjectId format")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted", "id": id}

#delete a product's attribute
@app.delete("/products/{id}/attributes/{attr_key}")
def delete_attribute(id: str, attr_key: str):
    try:
        result = db.products.update_one(
            {"_id": ObjectId(id)},
            {"$pull": {"attributes": {"name": attr_key}}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Attribute not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ObjectId format")
    return {"message": "Attribute deleted", "attr_key": attr_key}

#delete a product's review
@app.delete("/products/{id}/reviews/{rev_id}")
def delete_review(id: str, rev_id: str):
    try:
        db.products.update_one(
            {"_id": ObjectId(id)},
            {"$pull": {"reviews": {"rev_id": rev_id}}}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ObjectId format")
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


#ae có phải chạy uvicorn trong terminal trước rồi mới chạy file này thì mới được không?
#giờ tao thêm đoạn này vào thì sẽ không phải vậy nữa
#ae cứ bấm chạy file endpoints.py này thôi, sau đó mở html bằng live server thì sẽ ngon nhé
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)