//được rồi tách phần insert ra đây nhé

let attributesArray = [];
let reviewsArray = [];

document.addEventListener("DOMContentLoaded", () => {
    const insertBtn = document.querySelector('.left-group .btn-tab:nth-child(1)');
    if (!insertBtn) return;

    insertBtn.addEventListener('click', async () => {
        const formArea = document.querySelector('.form-area');
        try {
            const response = await fetch('./insert.html');
            const html = await response.text();
            formArea.innerHTML = html;

            // Cancel
            const cancelBtn = document.querySelector('.bottom-actions .btn:nth-child(1)');
            cancelBtn.onclick = () => {
                formArea.innerHTML = "";
                attributesArray = [];
                reviewsArray = [];
            };

            // Add Attribute
            const addAttrBtn = document.getElementById("btn-add-attribute");
            addAttrBtn.onclick = () => {
                const attrName = document.getElementById("name").value.trim();
                const attrValue = document.getElementById("value").value.trim();
                if (attrName && attrValue) {
                    attributesArray.push({ name: attrName, value: attrValue });
                    console.log("Attributes array:", attributesArray);
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
                    reviewsArray.push({ reviewer, rating: parseInt(rating), content });
                    console.log("Reviews array:", reviewsArray);
                    document.getElementById("reviewer").value = "";
                    document.getElementById("rating").value = "";
                    document.getElementById("content").value = "";
                } else {
                    alert("Please fill all review fields!");
                }
            };

            // Confirm
            const confirmBtn = document.querySelector('.bottom-actions .btn:nth-child(2)');
            confirmBtn.onclick = async () => {
                const nameInput = document.getElementById("input-name");
                const categoryInput = document.getElementById("input-category");
                const brandInput = document.getElementById("input-brand");
                const priceInput = document.getElementById("input-price");
                const stockInput = document.getElementById("input-stock");
                const descriptionInput = document.getElementById("input-description");

                const inputs = [nameInput, brandInput, priceInput, stockInput, descriptionInput, categoryInput];
                let valid = true;
                inputs.forEach(input => input.style.border = "");
                inputs.forEach(input => {
                    if (!input.value || input.value.trim() === "") {
                        input.style.border = "2px solid red";
                        valid = false;
                    }
                });
                if (!valid) {
                    alert("Please fill all required information!");
                    return;
                }

                if (confirm("Do you want to add this product?")) {
                    const categoryName = categoryInput.value.trim();
                    const productData = {
                        pro_name: nameInput.value,
                        cat_id: categoryMap[categoryName],
                        brand: brandInput.value,
                        price: parseFloat(priceInput.value),
                        stock: parseInt(stockInput.value),
                        description: descriptionInput.value,
                        attributes: attributesArray,
                        reviews: reviewsArray
                    };

                    const response = await fetch(`${API_BASE_URL}/products`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(productData)
                    });

                    if (response.ok) {
                        alert("Product added successfully!");
                        fetchProductsByCategory(productData.cat_id);
                        formArea.innerHTML = "";
                    } else {
                        alert("Error: Cannot add product.");
                    }
                }
            };

        } catch (err) {
            formArea.innerHTML = '<p style="color:red;">Error loading insert form.</p>';
        }
    });
});
