//dlt ở đây

document.addEventListener("DOMContentLoaded", () => {
    const deleteBtn = document.querySelector('.left-group .btn-tab:nth-child(3)');
    if (!deleteBtn) return;

    deleteBtn.addEventListener('click', async () => {
        const formArea = document.querySelector('.form-area');
        try {
            const response = await fetch('./delete.html');
            const html = await response.text();
            formArea.innerHTML = html;

            // load combo box category
            const categorySelect = document.getElementById("delete-category");
            const resCat = await fetch(`${API_BASE_URL}/categories`);
            const categories = await resCat.json();

            categorySelect.innerHTML = "<option value=''>--Select Category--</option>";
            categories.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.cat_id;
                opt.textContent = c.cat_name.charAt(0).toUpperCase() + c.cat_name.slice(1);
                categorySelect.appendChild(opt);
            });

            const productSelect = document.getElementById("delete-product");
            const infoDiv = document.getElementById("delete-product-info");

            // chọn category -> load sản phẩm
            categorySelect.onchange = async () => {
                const catId = categorySelect.value;
                if (!catId) return;

                const res = await fetch(`${API_BASE_URL}/products/by_category/${catId}`);
                const data = await res.json();

                productSelect.innerHTML = "<option value=''>--Select Product--</option>";
                data.products.forEach(p => {
                    const opt = document.createElement("option");
                    opt.value = p._id; // dùng _id để xóa
                    opt.textContent = p.pro_name;
                    productSelect.appendChild(opt);
                });
            };

            // chọn sản phẩm -> hiện chi tiết
            productSelect.onchange = async () => {
                const productId = productSelect.value;
                if (!productId) return;

                const res = await fetch(`${API_BASE_URL}/products/${productId}`);
                const product = await res.json();

                infoDiv.innerHTML = `
                    <p><strong>Name:</strong> ${product.pro_name}</p>
                    <p><strong>Brand:</strong> ${product.brand}</p>
                    <p><strong>Price:</strong> ${product.price}</p>
                    <p><strong>Stock:</strong> ${product.stock}</p>
                    <p><strong>Description:</strong> ${product.description}</p>
                `;
                //render attributes
                const attrContainer = document.createElement("div");
                attrContainer.className = "attributes"; // thêm class
                attrContainer.innerHTML = "<h3>Attributes</h3>";
                product.attributes.forEach(attr => {
                    const p = document.createElement("p");
                    p.className = "attribute-item"; // thêm class
                    p.textContent = `${attr.name}: ${attr.value}`;
                    attrContainer.appendChild(p);
                });
                infoDiv.appendChild(attrContainer);

                //render reviews
                const reviewContainer = document.createElement("div");
                reviewContainer.className = "reviews"; // thêm class
                reviewContainer.innerHTML = "<h3>Reviews</h3>";
                product.reviews.forEach(review => {
                    const p = document.createElement("div");
                    p.className = "review-card"; // thêm class
                    p.textContent = `${review.reviewer} (${review.rating}/5): ${review.content}`;
                    reviewContainer.appendChild(p);
                });
                infoDiv.appendChild(reviewContainer);
            };

            // Cancel & Confirm
            const cancelBtn = document.querySelector('.bottom-actions .btn:nth-child(1)');
            const confirmBtn = document.querySelector('.bottom-actions .btn:nth-child(2)');

            cancelBtn.onclick = () => {
                formArea.innerHTML = "";
            };

            confirmBtn.onclick = async () => {
                const productId = productSelect.value;
                if (!productId) {
                    alert("Please select a product to delete!");
                    return;
                }
                if (confirm("Do you really want to delete this product?")) {
                    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
                        method: "DELETE"
                    });
                    if (res.ok) {
                        alert("Product deleted successfully!");
                        // reload category view
                        const catId = categorySelect.value;
                        if (catId) {
                            fetchProductsByCategory(catId);
                        }
                        formArea.innerHTML = "";
                    } else {
                        alert("Error: Cannot delete product.");
                    }
                }
            };

        } catch (err) {
            formArea.innerHTML = '<p style="color:red;">Error loading delete form.</p>';
        }
    });
});
