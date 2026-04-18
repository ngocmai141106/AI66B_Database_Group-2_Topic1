document.addEventListener("DOMContentLoaded", () => {
    const updateBtn = document.querySelector('.left-group .btn-tab:nth-child(2)');
    if (!updateBtn) return;

    updateBtn.addEventListener('click', async () => {
        const formArea = document.querySelector('.form-area');
        try {
            const response = await fetch('./update.html');
            const html = await response.text();
            formArea.innerHTML = html;

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
                    document.getElementById("cat-description").value = "";
                    infoDiv.style.display = "none";
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

                // load category description
                const cat = categories.find(c => c.cat_id === catId);
                if (cat) {
                    document.getElementById("cat-description").value = cat.description || "";
                }
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
                const product = await res.json();

                // populate product fields
                document.getElementById("prod-name").value = product.pro_name || "";
                document.getElementById("prod-brand").value = product.brand || "";
                document.getElementById("prod-price").value = product.price || "";
                document.getElementById("prod-stock").value = product.stock || "";
                updateForm.style.display = "block";

                // populate attributes
                const attrList = document.getElementById("attributes-list");
                attrList.innerHTML = "";
                if (product.attributes) {
                    Object.entries(product.attributes).forEach(([key, value]) => {
                        const div = document.createElement("div");
                        div.innerHTML = `
                            <label>${key}:</label>
                            <input type="text" value="${value}" id="attr-${key}">
                            <button onclick="updateAttribute('${prodId}', '${key}')">Update</button>
                            <button onclick="deleteAttribute('${prodId}', '${key}')">Delete</button>
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
                            <button onclick="updateReview('${prodId}', '${review.rev_id}')">Update</button>
                            <button onclick="deleteReview('${prodId}', '${review.rev_id}')">Delete</button>
                        `;
                        revList.appendChild(div);
                    });
                }
            };

            // add attribute
            document.getElementById("btn-add-attribute").onclick = () => {
                if (!currentProductId) return;
                const name = document.getElementById("name").value.trim();
                const value = document.getElementById("value").value.trim();
                if (name && value) {
                    fetch(`${API_BASE_URL}/products/${currentProductId}/attributes`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ [name]: value })
                    }).then(res => {
                        if (res.ok) {
                            alert("Attribute added!");
                            productSelect.onchange(); // refresh
                        } else {
                            alert("Error adding attribute.");
                        }
                    });
                } else {
                    alert("Please fill both name and value.");
                }
            };

            // add review
            document.getElementById("btn-add-review").onclick = () => {
                if (!currentProductId) return;
                const reviewer = document.getElementById("reviewer").value.trim();
                const rating = parseInt(document.getElementById("rating").value);
                const content = document.getElementById("content").value.trim();
                if (reviewer && rating && content) {
                    fetch(`${API_BASE_URL}/products/${currentProductId}/reviews`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reviewer, rating, content })
                    }).then(res => {
                        if (res.ok) {
                            alert("Review added!");
                            productSelect.onchange(); // refresh
                        } else {
                            alert("Error adding review.");
                        }
                    });
                } else {
                    alert("Please fill all review fields.");
                }
            };

            // update category
            document.getElementById("btn-update-category").onclick = async () => {
                const catId = categorySelect.value;
                if (!catId) return;
                const description = document.getElementById("cat-description").value;
                const res = await fetch(`${API_BASE_URL}/categories/${catId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ description })
                });
                if (res.ok) {
                    alert("Category updated successfully!");
                } else {
                    alert("Error updating category.");
                }
            };

            // bottom actions
            const confirmBtn = document.querySelector('.bottom-actions .btn:nth-child(2)');
            confirmBtn.onclick = async () => {
                if (!currentProductId) return;
                const updateData = {
                    pro_name: document.getElementById("prod-name").value,
                    brand: document.getElementById("prod-brand").value,
                    price: parseFloat(document.getElementById("prod-price").value),
                    stock: parseInt(document.getElementById("prod-stock").value),
                    description: document.getElementById("prod-description").value
                };
                const res = await fetch(`${API_BASE_URL}/products/${currentProductId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updateData)
                });
                if (res.ok) {
                    alert("Product updated successfully!");
                } else {
                    alert("Error updating product.");
                }
            };

            const cancelBtn = document.querySelector('.bottom-actions .btn:nth-child(1)');
            cancelBtn.onclick = () => {
                formArea.innerHTML = "";
            };

        } catch (err) {
            formArea.innerHTML = '<p style="color:red;">Error loading update form.</p>';
        }
    });
});

// global functions for attributes and reviews
function updateAttribute(prodId, attrKey) {
    const value = document.getElementById(`attr-${attrKey}`).value;
    fetch(`${API_BASE_URL}/products/${prodId}/attributes/${attrKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({value})
    }).then(res => {
        if (res.ok) {
            alert("Attribute updated!");
        } else {
            alert("Error updating attribute.");
        }
    });
}

function deleteAttribute(prodId, attrKey) {
    fetch(`${API_BASE_URL}/products/${prodId}/attributes/${attrKey}`, {
        method: "DELETE"
    }).then(res => {
        if (res.ok) {
            alert("Attribute deleted!");
            // refresh product info
            document.getElementById("update-product").onchange();
        } else {
            alert("Error deleting attribute.");
        }
    });
}

function updateReview(prodId, revId) {
    const reviewer = document.getElementById(`rev-reviewer-${revId}`).value;
    const rating = parseInt(document.getElementById(`rev-rating-${revId}`).value);
    const content = document.getElementById(`rev-content-${revId}`).value;
    const updateData = { reviewer, rating, content };
    fetch(`${API_BASE_URL}/products/${prodId}/reviews/${revId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
    }).then(res => {
        if (res.ok) {
            alert("Review updated!");
        } else {
            alert("Error updating review.");
        }
    });
}

function deleteReview(prodId, revId) {
    fetch(`${API_BASE_URL}/products/${prodId}/reviews/${revId}`, {
        method: "DELETE"
    }).then(res => {
        if (res.ok) {
            alert("Review deleted!");
            // refresh product info
            document.getElementById("update-product").onchange();
        } else {
            alert("Error deleting review.");
        }
    });
}