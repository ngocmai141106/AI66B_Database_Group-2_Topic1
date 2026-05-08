//seach module

let debounceTimer = null;
let selectedSuggestion = null;
let lastQuery = "";

//init
window.addEventListener("DOMContentLoaded", () => {
    const input = document.querySelector(".search-box input");

    //fix: đúng selector icon
    const searchIcon = document.querySelector(".right-group .icon-box");

    if (!input) return;

    input.addEventListener("input", onInputSearch);

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handleSearch(input.value.trim());
        }
    });

    if (searchIcon) {
        searchIcon.addEventListener("click", () => {
            handleSearch(input.value.trim());
        });
    }
});

//input
function onInputSearch(e) {
    const value = e.target.value.trim();
    lastQuery = value;

    // reset suggestion when user type again
    selectedSuggestion = null;

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        handleSearch(value);
    }, 250);
}

//core
function handleSearch(query) {
    const panel = document.getElementById("right-panel");

    //case 3: empty -> reset
    if (!query) {
        resetToCategory();
        return;
    }

    fuzzySearch(query);
}

//fuzzy search
async function fuzzySearch(query) {
    const panel = document.getElementById("right-panel");

    try {
        const res = await fetch(
            `/products/search/global?keyword=${encodeURIComponent(query)}`
        );

        if (!res.ok) {
            throw new Error("Search request failed");
        }

        const data = await res.json();

        window.renderProducts(panel, data.products || []);
    }
    catch(err) {
        console.error("MongoDB search failed:", err);

        // fallback local search
        const products = window.currentProducts || [];

        const q = query.toLowerCase();

        const results = products.filter(p => {
            return (
                (p.pro_name || "").toLowerCase().includes(q) ||
                (p.description || "").toLowerCase().includes(q) ||
                (p.brand || "").toLowerCase().includes(q)
            );
        });

        window.renderProducts(panel, results);
    }
}

//reset
function resetToCategory() {
    const panel = document.getElementById("right-panel");

    selectedSuggestion = null;
    lastQuery = "";

    if (window.currentProducts) {
        window.renderProducts(panel, window.currentProducts);
    }
}

//suggestion
function selectSuggestion(product) {
    selectedSuggestion = product;

    const panel = document.getElementById("right-panel");

    //click suggestion = show 1 product
    window.renderProducts(panel, [product]);

    //sync input
    const input = document.querySelector(".search-box input");
    if (input) input.value = product.pro_name || "";
}

//category change
function onCategoryChanged(newProducts) {
    window.currentProducts = newProducts;

    selectedSuggestion = null;
    lastQuery = "";

    const input = document.querySelector(".search-box input");
    if (input) input.value = "";

    resetToCategory();
}

//global
window.selectSuggestion = selectSuggestion;
window.onCategoryChanged = onCategoryChanged;

window.addEventListener("productsReady", () => {
    console.log("Products loaded:", window.currentProducts);
});

console.log("CURRENT PRODUCTS:", window.currentProducts);
console.log("LAST QUERY:", lastQuery);