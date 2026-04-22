let update_attributesArray = [];
let update_reviewsArray = [];

document.addEventListener("DOMContentLoaded", () => {
    const updateBtn = document.querySelector('.left-group .btn-tab:nth-child(2)');
    if (!updateBtn) return;

    updateBtn.addEventListener('click', async () => {
        const formArea = document.querySelector('.form-area');
        try {
            const response = await fetch('./update.html');
            const html = await response.text();
            formArea.innerHTML = html;

             // Add event listener for delete buttons
            formArea.addEventListener('click', async (e) => {
                if (e.target.classList.contains('delete-attr')) {
                    const attrName = e.target.dataset.attr;
                    const existing = e.target.dataset.existing === 'true';
                    if (existing) {
                        try {
                            const res = await fetch(`${API_BASE_URL}/products/${currentProductId}/attributes/${encodeURIComponent(attrName)}`, { method: 'DELETE' });
                            if (!res.ok) {
                                alert('Error deleting attribute');
                                return;
                            }
                        } catch (err) {
                            alert('Error deleting attribute');
                            return;
                        }
                    } else {
                        update_attributesArray = update_attributesArray.filter(a => a.name !== attrName);
                    }
                    e.target.closest('div').remove();
                }
                if (e.target.classList.contains('delete-review')) {
                    const revId = e.target.dataset.rev;
                    const existing = e.target.dataset.existing === 'true';
                    if (existing) {
                        try {
                            const res = await fetch(`${API_BASE_URL}/products/${currentProductId}/reviews/${revId}`, { method: 'DELETE' });
                            if (!res.ok) {
                                alert('Error deleting review');
                                return;
                            }
                        } catch (err) {
                            alert('Error deleting review');
                            return;
                        }
                    } else {
                        update_reviewsArray = update_reviewsArray.filter(r => r.rev_id !== revId);
                    }
                    e.target.closest('div').remove();
                }
            });

            // load combo box category
            const categorySelect = document.getElementById("update-category");
            const resCat = await fetch(`${API_BASE_URL}/categories`);
            const categories = await resCat.json();

            categorySelect.innerHTML = "<option value=''>--Select Category--</option>";
            categories.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.cat_id;
                opt.textContent = c.cat_name.charAt(0).toUpperCase() + c.cat_name.slice(1);
                categorySelect.appendChild(opt);
            });

            const productSelect = document.getElementById("update-product");
            const updateForm = document.getElementById("update-form");

            let currentProductId = null;

            // chọn category -> load sản phẩm và category info
            categorySelect.onchange = async () => {
                const catId = categorySelect.value;
                if (!catId) {
                    productSelect.innerHTML = "<option value=''>--Select Product--</option>";
                    return;
                }

                // load products
                const res = await fetch(`${API_BASE_URL}/products/by_category/${catId}`);
                const data = await res.json();

                productSelect.innerHTML = "<option value=''>--Select Product--</option>";
                data.products.forEach(p => {
                    const opt = document.createElement("option");
                    opt.value = p._id;
                    opt.textContent = p.pro_name;
                    productSelect.appendChild(opt);
                });
            };

            // chọn product -> load product info
            productSelect.onchange = async () => {
                const prodId = productSelect.value;
                currentProductId = prodId;
                if (!prodId) {
                    updateForm.style.display = "none";
                    return;
                }

                const res = await fetch(`${API_BASE_URL}/products/${prodId}`);
                if (!res.ok) {
                    console.error("Fetch failed:", res.status);
                return;
                }
                const product = await res.json();
                console.log(product); // kiểm tra object trả về

                // Convert attributes from dict to array if needed
                if (product.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)) {
                    product.attributes = Object.entries(product.attributes).map(([name, value]) => ({ name, value }));
                }

                // populate product fields
                document.getElementById("prod-name").value = product.pro_name || "";
                document.getElementById("prod-brand").value = product.brand || "";
                document.getElementById("prod-price").value = product.price || "";
                document.getElementById("prod-stock").value = product.stock || "";
                document.getElementById("prod-description").value = product.description || "";
                updateForm.style.display = "block";

                // populate attributes
                const attrList = document.getElementById("attributes-list");
                attrList.innerHTML = "";
                if (product.attributes && Array.isArray(product.attributes)) {
                    product.attributes.forEach(attr => {
                        const div = document.createElement("div");
                        div.innerHTML = `
                            <label>${attr.name}:</label>
                            <input type="text" value="${attr.value}" id="attr-${attr.name}">
                            <button type="button" class="delete-attr" data-attr="${attr.name}" data-existing="true">Delete</button>
                        `;
                        attrList.appendChild(div);
                    });
                }
                
                // populate reviews
                const revList = document.getElementById("reviews-list");
                revList.innerHTML = "";
                if (product.reviews) {
                    product.reviews.forEach(review => {
                        const div = document.createElement("div");
                        div.innerHTML = `
                            <input type="text" value="${review.reviewer}" id="rev-reviewer-${review.rev_id}">
                            <input type="number" min="1" max="5" value="${review.rating}" id="rev-rating-${review.rev_id}">
                            <input type="text" value="${review.content}" id="rev-content-${review.rev_id}">
                            <button type="button" class="delete-review" data-rev="${review.rev_id}" data-existing="true">Delete</button>
                        `;
                        revList.appendChild(div);
                    });
                }
            };

            // Cancel
            const cancelBtn = document.querySelector('.bottom-actions .btn:nth-child(1)');
            cancelBtn.onclick = () => {
                formArea.innerHTML = "";
                update_attributesArray = [];
                update_reviewsArray = [];
            };

            // Add Attribute
            const addAttrBtn = document.getElementById("btn-add-attribute");
            addAttrBtn.onclick = () => {
                const attrName = document.getElementById("name").value.trim();
                const attrValue = document.getElementById("value").value.trim();
                if (attrName && attrValue) {
                    update_attributesArray.push({ name: attrName, value: attrValue });

                    const attrList = document.getElementById("attributes-list");
                    const div = document.createElement("div");
                    div.innerHTML = `
                        <label>${attrName}:</label>
                        <input type="text" value="${attrValue}" id="attr-${attrName}">
                        <button type="button" class="delete-attr" data-attr="${attrName}">Delete</button>
                    `;
                    attrList.appendChild(div);

                    console.log("Attributes array:", update_attributesArray);
                    document.getElementById("name").value = "";
                    document.getElementById("value").value = "";
                } else {
                    alert("Please fill both attribute name and value!");
                }
            };

            // Add Review
            const addReviewBtn = document.getElementById("btn-add-review");
            addReviewBtn.onclick = () => {
                const reviewer = document.getElementById("reviewer").value.trim();
                const rating = document.getElementById("rating").value.trim();
                const content = document.getElementById("content").value.trim();
                if (reviewer && rating && content) {
                    const rev_id = `temp-${Date.now()}`;
                    update_reviewsArray.push({ rev_id, reviewer, rating: parseInt(rating), content });

                    const revList = document.getElementById("reviews-list");
                    const div = document.createElement("div");
                    div.innerHTML = `
                        <input type="text" value="${reviewer}" id="rev-reviewer-${rev_id}">
                        <input type="number" min="1" max="5" value="${rating}" id="rev-rating-${rev_id}">
                        <input type="text" value="${content}" id="rev-content-${rev_id}">
                        <button type="button" class="delete-review" data-rev="${rev_id}">Delete</button>
                    `;
                    revList.appendChild(div);

                    console.log("Reviews array:", update_reviewsArray);
                    document.getElementById("reviewer").value = "";
                    document.getElementById("rating").value = "";
                    document.getElementById("content").value = "";
                } else {
                    alert("Please fill all review fields!");
                }
            };          
            
            const confirmBtn = document.querySelector('.bottom-actions .btn:nth-child(2)');
            confirmBtn.onclick = async () => {
                // 1. Lấy thông tin sản phẩm
                const name = document.getElementById("prod-name").value.trim();
                const brand = document.getElementById("prod-brand").value.trim();
                const price = parseFloat(document.getElementById("prod-price").value);
                const stock = parseInt(document.getElementById("prod-stock").value);
                const description = document.getElementById("prod-description").value.trim();
            
                // 2. Lấy attributes
                const attributes = [];
                document.querySelectorAll("#attributes-list input").forEach(input => {
                    const key = input.id.replace("attr-", ""); // lấy tên attr từ id
                    const value = input.value;
                    attributes.push({ name: key, value: value });
                });
            
                // 3. Lấy reviews
                const reviews = [];
                document.querySelectorAll("#reviews-list div").forEach(div => {
                    const reviewerInput = div.querySelector("[id^='rev-reviewer']");
                    const ratingInput = div.querySelector("[id^='rev-rating']");
                    const contentInput = div.querySelector("[id^='rev-content']");
                
                    if (reviewerInput && ratingInput && contentInput) {
                        const revId = reviewerInput.id.replace("rev-reviewer-", "");
                        reviews.push({
                            rev_id: revId,
                            reviewer: reviewerInput.value,
                            rating: parseInt(ratingInput.value),
                            content: contentInput.value
                        });
                    }
                });
            
                // 4. Gom tất cả vào object
                if (confirm("Do you want to update this product?")) {
                    const updateData = {
                        pro_name: name,
                        brand,
                        price,
                        stock,
                        description,
                        attributes,
                        reviews
                    };
            
                    // 5. Gửi lên API
                    const res = await fetch(`${API_BASE_URL}/products/${currentProductId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updateData)
                    });
                
                    if (res.ok) {
                        alert("Product updated successfully!");
                        const catId = categorySelect.value;
                        if (catId) {
                            fetchProductsByCategory(catId);
                        }
                        formArea.innerHTML = "";
                    } else {
                        alert("Error updating product.");
                    }
                }
            };

        } catch (err) {
            formArea.innerHTML = '<p style="color:red;">Error loading update form.</p>';
        }
    });
});

