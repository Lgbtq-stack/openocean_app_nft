import {showNFTDetails} from "./ProductDetailsLogic.js";
import {showErrorPopup} from "./PopupLogic.js";
import {scrollToTop} from "./Utilities.js";
import {user_Id} from "./index.js";

let currentPage = 1;
let currentCategory = 1;

let categoriesCache = [];
let currentItems;
let originalItems = [];

function renderCategoryCards(items) {
    const container = document.querySelector("#categories .cards");
    container.innerHTML = "";

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = item.isLimited ? "nft-card limited" : "nft-card";

        card.innerHTML = `
            <img src="https://miniappservcc.com/get-image?path=${item.image}" alt="${item.name}">
            <h4>${item.name}</h4>
            <p>$${item.price.toLocaleString()}</p>
        `;

        container.appendChild(card);
    });
}

function generatePagination(paging, onPageChange) {
    const { page, totalPages } = paging;
    const paginationContainer = document.getElementById("pagination-container");

    if (!paginationContainer) return;

    paginationContainer.innerHTML = "";

    if (currentCategory?.id === 53) {
        paginationContainer.classList.add("limited");
    } else {
        paginationContainer.classList.remove("limited");
    }

    if (page > 1) {
        const prevButton = document.createElement("button");
        prevButton.textContent = "<";
        prevButton.className = "pagination-btn";
        if (currentCategory?.id === 53) prevButton.classList.add("limited");
        prevButton.addEventListener("click", () => onPageChange(page - 1));
        paginationContainer.appendChild(prevButton);
    }

    const firstPage = createPageButton(1, page, onPageChange);
    paginationContainer.appendChild(firstPage);

    if (page > 3) {
        const dots = document.createElement("span");
        dots.textContent = "...";
        dots.className = "dots";
        paginationContainer.appendChild(dots);
    }

    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        const pageButton = createPageButton(i, page, onPageChange);
        paginationContainer.appendChild(pageButton);
    }

    if (page < totalPages - 2) {
        const dots = document.createElement("span");
        dots.textContent = "...";
        dots.className = "dots";
        paginationContainer.appendChild(dots);
    }

    if (totalPages > 1) {
        const lastPage = createPageButton(totalPages, page, onPageChange);
        paginationContainer.appendChild(lastPage);
    }

    if (page < totalPages) {
        const nextButton = document.createElement("button");
        nextButton.textContent = ">";
        nextButton.className = "pagination-btn";
        if (currentCategory?.id === 53) nextButton.classList.add("limited");
        nextButton.addEventListener("click", () => onPageChange(page + 1));
        paginationContainer.appendChild(nextButton);
    }
}

function createPageButton(pageNumber, currentPage, onPageChange) {
    const button = document.createElement("button");
    button.textContent = pageNumber;
    button.className = "pagination-btn";

    if (pageNumber === currentPage) {
        button.classList.add("active");
    }

    button.addEventListener("click", () => {
        onPageChange(pageNumber);
        scrollToTop();
    });

    return button;
}

export async function createCategories() {
    const sliderList = document.querySelector(".slider-category-list");
    if (!sliderList) {
        console.error("Element with class 'slider-category-list' not found in DOM.");
        return;
    }

    sliderList.innerHTML = "";

    const categories = await loadCategoriesOnce(false);
    if (categories.length === 0) {
        console.error("No categories available.");
        return;
    }

    let firstCategory = categories[0];
    currentCategory = firstCategory;
    currentPage = 1;

    categories.forEach(category => {
        const button = document.createElement("button");
        button.classList.add("slider-category-item");
        button.textContent = category.name;

        if (category.id === firstCategory.id) {
            button.classList.add("active-category");
        }

        if (category.id === 53) {
            button.classList.add("limited");
        }

        button.addEventListener("click", () => {
            document.querySelectorAll(".slider-category-item").forEach(btn => btn.classList.remove("active-category"));
            button.classList.add("active-category");

            currentCategory = category;
            currentPage = 1;
            document.getElementById("category-list").innerHTML = "";
            loadCategories(currentPage, currentCategory);
        });

        sliderList.appendChild(button);
    });

    document.getElementById("category-list").innerHTML = "";

    await loadCategories(currentPage, currentCategory);
    initializeSlider();
}

function showCategories() {
    document.getElementById("categories").style.display = "block";
    renderCategoryCards(nftItems);
}

document.querySelector("#categories input").addEventListener("input", (e) => {
    const searchValue = e.target.value.toLowerCase();
    const filtered = nftItems.filter(item =>
        item.name.toLowerCase().includes(searchValue)
    );
    renderCategoryCards(filtered);
});

export async function loadCategories(page = 1, category) {
    if (!category || !category.id) {
        console.error("Invalid category:", category);
        return;
    }

    try {
        const response = await fetch(`https://miniappservcc.com/api/collections?collection_id=${category.id}&page=${page}`);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

        const data = await response.json();
        const items = Array.isArray(data.data) ? data.data : [];
        const paging = data.paging || { page: 1, totalPages: 1 };
        const cardsContainer = document.getElementById("category-list");
        if (!cardsContainer) {
            console.error("Container #category-list not found");
            return;
        }

        cardsContainer.innerHTML = "";

        items.forEach(item => {
            const card = document.createElement("div");
            card.className = item.isLimited ? "card nft-card limited" : "card nft-card";

            const isSoldOut = true;
            const isLimited = item.isLimited;

            if (isSoldOut) {
                card.innerHTML = `
            <img src="https://miniappservcc.com/get-image?path=${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p class="collection"><strong>Collection</strong>: ${item.collection || 'Unknown'}</p>
            <button 
                class="card-btn ${isLimited ? 'limited' : ''}" 
                disabled 
                style="background: grey; cursor: not-allowed; color: white;"
            >
                Sold Out
            </button>
        `;
            } else {
                card.innerHTML = `
            <div class="card-content">
                <img src="https://miniappservcc.com/get-image?path=${item.image}" alt="${item.name}" class="nft-image">
                <p class="nft-price">
                    ${item.price}
                    <img src="content/money-icon.png" alt="Money Icon" class="price-icon" /> or 
                </p>
                <p class="nft-price">
                    1
                    <img src="content/nft_extra.png" alt="NFT Extra Icon" class="price-icon" />
                </p>
                <h4>${item.name}</h4>
                <p class="collection-label">🏷️ ${item.collection}</p>
            </div>
        `;

                const button = document.createElement("button");
                button.className = isLimited ? "details-button limited" : "details-button";
                button.textContent = "Details";

                button.addEventListener("click", () => {
                    if (isLimited) {
                        showLimitedNFTDetails(item.id, items);
                    } else {
                        showNFTDetails(item.id, items);
                    }
                });

                card.appendChild(button);
            }

            cardsContainer.appendChild(card);
        });

        lazyLoadImages();
        generatePagination(paging, (newPage) => loadCategories(newPage, category));
        currentItems = items;

        renderNFTList(items);
        scrollToTop();
    } catch (err) {
        console.error("Error loading categories:", err);
    }
}

function lazyLoadImages() {
    const lazyImages = document.querySelectorAll(".lazy-img");

    const observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                // if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.onload = () => {
                    const spinner = img.previousElementSibling;
                    if (spinner) spinner.style.display = "none";
                    img.style.display = "block";
                };
                img.onerror = () => {
                    const spinner = img.previousElementSibling;
                    if (spinner) spinner.style.display = "none";
                    img.src = "https://placehold.co/200x200?text=Error";
                };
                observer.unobserve(img);
                // }
            });
        },
        // { threshold: 0.1 }
    );

    lazyImages.forEach((img) => {
        observer.observe(img);
    });
}

async function loadCategoriesOnce(includeAll = false) {
    if (categoriesCache.length > 0) {
        console.log("✅ Using cached categories:", categoriesCache);
        return includeAll ? [{ id: "", name: "All" }, ...categoriesCache] : categoriesCache;
    }

    try {
        const response = await fetch("https://miniappservcc.com/api/collections?limit=100");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const collectionsData = await response.json();
        if (!Array.isArray(collectionsData.collections)) {
            throw new TypeError("Invalid data format: expected 'collections' to be an array.");
        }

        categoriesCache = collectionsData.collections.map(c => ({
            id: c.meta.id,
            name: c.meta.name,
        }));


        return includeAll ? [{ id: "", name: "All" }, ...categoriesCache] : categoriesCache;
    } catch (error) {
        showErrorPopup("error", `Error loading categories: ${error.message}`);
        return [];
    }
}

function initializeSlider() {
    const sliderWrapper = document.querySelector(".slider-wrapper");
    const prevArrow = document.querySelector(".slider-control.prev");
    const nextArrow = document.querySelector(".slider-control.next");

    prevArrow.style.visibility = "visible";
    nextArrow.style.visibility = "visible";

    function moveSlider(offset) {
        sliderWrapper.scrollBy({ left: offset, behavior: "smooth" });
    }

    prevArrow.addEventListener("click", () => moveSlider(-1000));
    nextArrow.addEventListener("click", () => moveSlider(1000));

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    sliderWrapper.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.pageX - sliderWrapper.offsetLeft;
        scrollLeft = sliderWrapper.scrollLeft;
        sliderWrapper.style.cursor = "grabbing";
    });

    sliderWrapper.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - sliderWrapper.offsetLeft;
        const walk = (x - startX) * 2;
        sliderWrapper.scrollLeft = scrollLeft - walk;
    });

    sliderWrapper.addEventListener("mouseup", () => {
        isDragging = false;
        sliderWrapper.style.cursor = "grab";
    });

    sliderWrapper.addEventListener("mouseleave", () => {
        isDragging = false;
        sliderWrapper.style.cursor = "grab";
    });

    sliderWrapper.addEventListener("touchstart", (e) => {
        isDragging = true;
        startX = e.touches[0].pageX - sliderWrapper.offsetLeft;
        scrollLeft = sliderWrapper.scrollLeft;
    });

    sliderWrapper.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.touches[0].pageX - sliderWrapper.offsetLeft;
        const walk = (x - startX) * 2;
        sliderWrapper.scrollLeft = scrollLeft - walk;
    });

    sliderWrapper.addEventListener("touchend", () => {
        isDragging = false;
    });
}

let searchDebounceTimeout;

const searchInput = document.querySelector('#categories input');
const categoryList = document.getElementById('category-list');
const pagination = document.getElementById('pagination-container');
const suggestionPanel = document.createElement('div');
suggestionPanel.id = 'search-suggestions';
suggestionPanel.classList.add('search-suggestions-panel');
document.querySelector('.search-container').appendChild(suggestionPanel);

let lastSearchQuery = '';

searchInput.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimeout);

    searchDebounceTimeout = setTimeout(() => {
        const searchText = e.target.value.trim().toLowerCase();
        lastSearchQuery = searchText;
        updateSuggestions(searchText);
    }, 400);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && lastSearchQuery) {
        performSearch(lastSearchQuery);
        suggestionPanel.innerHTML = '';
        suggestionPanel.classList.remove('visible');

        searchInput.blur();
    }
});

async function updateSuggestions(searchText) {
    if (searchText === '') {
        suggestionPanel.innerHTML = '';
        suggestionPanel.classList.remove('visible');
        return;
    }

    try {
        const suggestRes = await fetch(`https://miniappservcc.com/api/search?q=${encodeURIComponent(searchText)}`);
        const suggestJson = await suggestRes.json();
        const tags = suggestJson.tags?.slice(0, 10) || [];
        const nfts = suggestJson.nfts?.slice(0, 10) || [];

        if (tags.length === 0 && nfts.length === 0) {
            suggestionPanel.innerHTML = '';
            suggestionPanel.classList.remove('visible');
        } else {
            suggestionPanel.innerHTML = `
                <div class="suggestion-tags">
                    ${tags.map(tag => `<div class="suggestion-item tag">#${tag}</div>`).join('')}
                </div>
                <div class="suggestion-nfts">
                    ${nfts.map(n => `<div class="suggestion-item nft">${n}</div>`).join('')}
                </div>
            `;
            suggestionPanel.classList.add('visible');

            suggestionPanel.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const value = item.textContent.replace('#', '').trim();
                    searchInput.value = value;
                    lastSearchQuery = value.toLowerCase();
                    performSearch(lastSearchQuery);
                    suggestionPanel.classList.remove('visible');
                });
            });
        }
    } catch (err) {
        console.error('Suggestion error:', err);
        suggestionPanel.innerHTML = '';
        suggestionPanel.classList.remove('visible');
    }
}

async function performSearch(searchText) {
    if (searchText === '') {
        await loadCategories(1, currentCategory);
        return;
    }

    try {
        const res = await fetch(`https://miniappservcc.com/api/nfts/search-nft?q=${encodeURIComponent(searchText)}`);
        const json = await res.json();
        const allItems = json.results;

        const filteredItems = allItems.filter(item => {
            const nameMatch = item.name?.toLowerCase().includes(searchText);
            const tagMatch = (item.tags || []).some(tag => tag.name.toLowerCase().includes(searchText));
            return nameMatch || tagMatch;
        });

        categoryList.innerHTML = '';
        pagination.innerHTML = '';

        if (filteredItems.length === 0) {
            categoryList.innerHTML = '<p>No results found.</p>';
            return;
        }


        filteredItems.forEach(item => {
            const card = document.createElement('div');
            card.className = item.isLimited ? 'card nft-card limited' : 'card nft-card';

            card.innerHTML = `
                <div class="nft-image-container">
                    <img src="https://miniappservcc.com/get-image?path=${encodeURIComponent(item.image)}" alt="${item.name}" class="nft-image">
                </div>
                <div class="nft-details">
                    <h3 class="nft-title">${item.name}</h3>
                    <p class="nft-price">Price: ${item.price} <img src="content/money-icon.png" alt="Money Icon" class="price-icon" /></p>
                    <p>Collection: ${item.collection || 'Unknown'}</p>
                </div>
            `;

            const button = document.createElement("button");
            if (item.isLimited && item.limitedCount < 1) {
                button.className = "details-button sold-out";
                button.textContent = "Sold Out";
                button.disabled = true;
                button.style.backgroundColor = "#ccc";
                button.style.cursor = "not-allowed";
            } else {
                button.className = item.isLimited ? "details-button limited" : "details-button";
                button.textContent = "Details";
                button.addEventListener("click", () => {
                    if (item.isLimited) {
                        showLimitedNFTDetails(item.id, filteredItems);
                    } else {
                        showNFTDetails(item.id, filteredItems);
                    }
                });
            }

            card.appendChild(button);
            categoryList.appendChild(card);
        });


    } catch (err) {
        console.error('Search error:', err);
        categoryList.innerHTML = '<p>Error loading search results.</p>';
    }
}

document.querySelector('.filter-btn').addEventListener('click', () => {
    document.getElementById('sort-popup').style.display = 'flex';
});

function closeSortPopup() {
    document.getElementById('sort-popup').style.display = 'none';
}

function sortCategoryList(type) {
    if (!currentItems || !currentItems.length) {
        console.warn("No items to sort.");
        return;
    }

    let sorted = [...currentItems];

    switch (type) {
        case 'price-asc':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sorted.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'clear':
            sorted = [...currentItems];
            break;
    }

    renderNFTList(sorted);
    closeSortPopup();
}

function renderNFTList(items) {
    const container = document.getElementById("category-list");
    container.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = item.isLimited ? "card nft-card limited" : "card nft-card";
        card.setAttribute("data-price", item.price);
        card.setAttribute("data-name", item.name);

        card.innerHTML = `
          <div class="nft-image-container">
            <img src="https://miniappservcc.com/get-image?path=${item.image}" alt="${item.name}" class="nft-image">
          </div>
          <div class="nft-details">
            <h3 class="nft-title">${item.name}</h3>
            <p class="nft-price">Price: ${item.price} <img src="content/money-icon.png" alt="Money Icon" class="price-icon" /></p>
            <p>Collection: ${item.isLimited ? 'Limited' : item.collection.name || 'Unknown'}</p>
          </div>
        `;

        const button = document.createElement("button");
        if (item.isLimited && item.limitedCount < 1) {
            button.className = "details-button sold-out";
            button.textContent = "Sold Out";
            button.disabled = true;
            button.style.backgroundColor = "#ccc";
            button.style.cursor = "not-allowed";
        } else {
            button.className = item.isLimited ? "details-button limited" : "details-button";
            button.textContent = "Details";
            button.addEventListener("click", () => {
                if (item.isLimited) {
                    showLimitedNFTDetails(item.id, items);
                } else {
                    showNFTDetails(item.id, items);
                }
            });
        }

        card.appendChild(button);
        container.appendChild(card);
    });
}

window.sortCategoryList = sortCategoryList;
window.closeSortPopup = closeSortPopup;