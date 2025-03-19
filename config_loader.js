// import {getAccountBalance} from "./backend/stellar_helper";
// import {get_config} from "./backend/datacontoller";

//walletTest = GAJDSJBEXLSF6K4D774YMQOLDIVTCEDMQVM3RCXWWHJN4PZ24JYZYD3B
// const user_Id = "488916773";
let user_Id = null;

let currentSection = null;
let currentCategoryId = null;

let tg = null;
document.addEventListener("DOMContentLoaded", () => {
    Telegram.WebApp.expand();
    tg = Telegram.WebApp;
});

let userDataCache = {
    data: null,
    timestamp: 0,
    ttl: 300000
};

let categoriesCache = [];

window.showSection = function(sectionId)  {
    if (currentSection === sectionId) {
        console.log(`Section "${sectionId}" is already active. Skipping request.`);
        return;
    }
    currentSection = sectionId;

    document.querySelectorAll("section").forEach(section => {
        section.style.display = "none";
    });

    const section = document.getElementById(sectionId);
    section.style.display = "block";

    if (sectionId === "trendings") {
        loadTrendingNFTs();
    } else if (sectionId === "my-nfts") {
        fetchUserNFTs(user_Id);
    }
    // } else if (sectionId === "categories") {
    //     loadCategoriesOnce().then(categories => {
    //         console.log("Loaded categories:", categories);
    //         renderCategories(categories);
    //     });
    // }
}

const navLinks = document.querySelectorAll('.nav-links li a');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        link.focus();
    });

    link.addEventListener('touchstart', (e) => {
        link.focus();
        link.click();
    });
});

function getUserIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    user_Id = urlParams.get("user_id");

    if (user_Id) {
        console.log(`User ID from URL: ${user_Id}`);
        return user_Id;
    } else {
        console.warn("User ID not found in the URL.");
        return null;
    }
}

function updateWalletInfo(nickname, balance, balance_bonus, level, extra_balance) {

    document.getElementById("wallet-address").textContent = `${nickname}`;
    document.getElementById("wallet-balance").innerHTML = `${balance + balance_bonus}
    <img src="content/money-icon.png" alt="NFT Icon" style="width: 25px; height: 20px; vertical-align: sub;">`;
    document.getElementById("user-level").innerHTML = `Level: ${level}`;
    document.getElementById("balance_extra").innerHTML = `${extra_balance}
    <img src="content/nft_extra.png" alt="NFT Icon" style="width: 25px; height: 20px; vertical-align: sub;">`;
}

async function loadCategoriesOnce(includeAll = false) {
    if (categoriesCache.length > 0) {
        console.log("Using cached categories.");
        return includeAll ? [{ id: "", name: "All" }, ...categoriesCache] : categoriesCache;
    }

    try {
        const response = await fetch("https://miniappservcc.com/api/collections");
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

        console.log("Categories loaded and cached:", categoriesCache);

        return includeAll ? [{ id: "", name: "All" }, ...categoriesCache] : categoriesCache;
    } catch (error) {
        showErrorPopup("error", `Error loading categories: ${error.message}`);
        return [];
    }
}

function renderCategories(categories) {
    const categoryContainer = document.getElementById("category-list");
    categoryContainer.innerHTML = "";

    categories.forEach(category => {
        const categoryCard = document.createElement("div");
        categoryCard.classList.add("category-card");
        categoryCard.textContent = category.name;

        categoryCard.addEventListener("click", () => fetchCategoryNFTs(category.id));
        categoryContainer.appendChild(categoryCard);
    });
}

function fetchCategoryNFTs(categoryId) {
    if (currentCategoryId === categoryId) {
        console.log(`Category "${categoryId}" is already selected. Skipping request.`);
        return;
    }
    currentCategoryId = categoryId;

    console.log(`Fetching NFTs for category: ${categoryId || "All"}`);
    fetchUserNFTs(user_Id, categoryId);
}

let currentIndex = 0;
let totalSlides = 0;

const sliderTrack = document.getElementById("sliderTrack");

function showNextSlide() {
    const slides = document.querySelectorAll(".slider-card img");
    totalSlides = slides.length;

    if (totalSlides === 0) {
        console.warn("No slides found!");
        return;
    }

    currentIndex = (currentIndex + 1) % totalSlides;
    sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
}

async function loadTrendingNFTs() {
    try {
        const response = await fetch("https://miniappservcc.com/api/trends");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const trendingData = await response.json();
        if (!Array.isArray(trendingData.trending)) {
            throw new TypeError("Invalid data format: expected 'trending' to be an array.");
        }

        const items = trendingData.trending;

        const sliderTrack = document.getElementById("sliderTrack");
        sliderTrack.innerHTML = "";

        items.slice(0, 4).forEach((nft) => {
            const slide = document.createElement("div");
            slide.classList.add("slider-item");

            slide.innerHTML = `
                <div class="slider-card">
                    <img class="trending-nft-image" src="${nft.image}" alt="${nft.name}">
                    <div class="slider-card-overlay">
                        <h3 class="trending-nft-title">${nft.name}</h3>
                        <div class="trending-info-row">
                            <div class="trending-info-item">🏷️ ${nft.collection || "Unknown"}</div>
                            <div class="trending-info-item"><img src="content/money-icon.png" alt="NFT Icon" style="width: 25px; height: 20px; margin-left: 15px; vertical-align: middle;"> ${nft.price}</div>
                        </div>
                    </div>
                </div>
            `;

            slide.addEventListener("click", () => {
                console.log(`Card clicked for NFT ID: ${nft.id}`);
                showNFTDetails(nft.id, items);
            });

            sliderTrack.appendChild(slide);
        });

        const cardsContainer = document.querySelector('.cards');
        if (!cardsContainer) {
            throw new Error("Element with class 'cards' not found in DOM.");
        }

        cardsContainer.innerHTML = "";

        items.slice(4).forEach((nft) => {
            const card = document.createElement("div");
            card.classList.add("card");

            card.innerHTML = `
                <div class="nft-image-container">
                    <img src="${nft.image}" alt="${nft.name}" class="nft-image">
                </div>
                <div class="nft-details">
                    <h3 class="nft-title">${nft.name}</h3>
                    
                    <div class="nft-info-row">
                        <div class="nft-info-item">🏷️ <span>${nft.collection || "Unknown"}</span></div>
                        <div class="nft-info-item">👥 <span>${nft.userCount}</span></div>
                        <div class="nft-info-item">📊 <span>${nft.totalBought}</span></div>
                    </div>
                    
                    <p class="nft-price"><img src="content/money-icon.png" alt="NFT Icon" style="width: 25px; height: 20px; vertical-align: sub;"> ${nft.price}</p>
                </div>

                <div class="nft-button-container">
                    <button class="details-button" id="details-${nft.id}">
                        <img class="info-icon" src="content/info.png" alt="Info"> Details
                    </button>
                </div>
            `;

            cardsContainer.appendChild(card);

            const detailsButton = card.querySelector('.details-button');
            detailsButton.addEventListener('click', () => {
                console.log(`Button clicked for NFT ID: ${nft.id}`);
                showNFTDetails(nft.id, items);
            });
        });

        console.log("Trending NFTs and cards successfully loaded and rendered.");
    } catch (error) {
        console.error("Error loading trending NFTs:", error);
        // Автоматически активируем категорию "All"
    }
}


async function showNFTDetails(id, dataSource) {
    try {
        disableScroll();
        if (!dataSource || !Array.isArray(dataSource)) {
            throw new TypeError("Invalid dataSource: expected an array of objects.");
        }

        const nft = dataSource.find((item) => item.id === Number(id));
        if (!nft) {
            console.error(`NFT with id=${id} not found in the provided data source.`);
            return;
        }

        document.getElementById('nft-title').textContent = nft.name;
        document.getElementById('nft-image').src = nft.image;
        document.getElementById('nft-collection').textContent = nft.collection.name || nft.collection;
        document.getElementById('nft-holders').textContent = `${nft.userCount}`;
        document.getElementById('nft-total-bought').textContent = `${nft.totalBought}`;
        document.getElementById('nft-description').textContent = `${nft.description}`;
        document.getElementById('nft-price').innerHTML = `<img src="content/money-icon.png" alt="NFT Icon" style="width: 35px; height: 25px; vertical-align: top">  ${nft.price}`;

        let nftCount = 1;
        document.getElementById('nft-count-display').textContent = `${nftCount}`;

        function updateBuyButton(price, count) {
            document.getElementById('buy-nft-price').textContent = (price * count).toFixed(2);
            document.getElementById('buy-nft-extra-price').textContent = count.toFixed(2);
        }

        updateBuyButton(nft.price, nftCount);

        document.getElementById('increase-count').onclick = () => {
            nftCount++;
            document.getElementById('nft-count-display').textContent = nftCount;
            updateBuyButton(nft.price, nftCount);
        };

        document.getElementById('decrease-count').onclick = () => {
            if (nftCount > 1) {
                nftCount--;
                document.getElementById('nft-count-display').textContent = nftCount;
                updateBuyButton(nft.price, nftCount);
            }
        };

        document.querySelector('.buy-nft-button').onclick = async () => {
            await refreshUserBalance(false);

            const response = await fetch(`https://miniappservcc.com/api/user?uid=${user_Id}`);
            if (!response.ok) {
                showErrorPopup("error", "Balance error.");
                return;
            }

            const userData = await response.json();
            const currentBalance = userData.balance + userData.balance_bonus;
            const totalCost = nftCount * nft.price;

            if (totalCost > currentBalance) {
                showErrorPopup("error", "You don't have enough <img src=\"content/money-icon.png\" alt=\"NFT Icon\" style=\"width: 25px; height: 20px; vertical-align: sub;\">!");
            } else {
                await sendDataToTelegramTest(user_Id, nft.id, nftCount);
                showErrorPopup("success", `You have bought ${nftCount} "${nft.name}" !`);

                await refreshUserBalance(false);
                await fetchUserNFTs(user_Id);
                closeNFTDetails();
            }
        };

        document.querySelector('.buy-nft-button-extra').onclick = async () => {
            await refreshUserBalance(false);

            const response = await fetch(`https://miniappservcc.com/api/user?uid=${user_Id}`);
            if (!response.ok) {
                showErrorPopup("error", "Balance error.");
                return;
            }

            const userData = await response.json();
            const currentBalance = userData.balance_extra;

            if (nftCount > currentBalance) {
                showErrorPopup("error", "You don't have enough <img src=\"content/nft_extra.png\" alt=\"NFT Extra Icon\" style=\"width: 25px; height: 20px; vertical-align: sub;\">!");
            } else {
                await sendDataToTelegramExtra(user_Id, nft.id, nftCount);
                showErrorPopup("success", `You have bought ${nftCount} "${nft.name}" !`);

                await refreshUserBalance(false);
                await fetchUserNFTs(user_Id);
                closeNFTDetails();
            }
        };

        document.querySelector('.close-panel').onclick = closeNFTDetails;
        document.getElementById('nftDetailsPanel').classList.add('show');
    } catch (error) {
        console.error('Error loading NFT details:', error);
    }
}

async function sendDataToTelegramTest(user_id, nft_id, count) {
    try {
        const apiUrl = `https://miniappservcc.com/api/nft/buy?uid=${user_id}&nft_id=${nft_id}&count=${count}`;
        const response = await fetch(apiUrl, {
            method: "GET"
        });

        if (!response.ok) throw new Error(`Failed to buy NFT: ${response.status}`);
        const result = await response.json();
        console.log("NFT purchase successful:", result);

        updateWalletInfo(result.nickname, result.balance, result.balance_bonus, result.level, result.balance_extra);

    } catch (error) {
        console.error("Error during NFT purchase:", error);
    }

}

async function sendDataToTelegramExtra(user_id, nft_id, count) {
    try {
        const apiUrl = `https://miniappservcc.com/api/nft/buyEx?uid=${user_id}&nft_id=${nft_id}&count=${count}`;
        const response = await fetch(apiUrl, {
            method: "GET"
        });

        if (!response.ok) throw new Error(`Failed to buy NFT: ${response.status}`);
        const result = await response.json();
        console.log("NFT purchase successful:", result);

        updateWalletInfo(result.nickname, result.balance, result.balance_bonus, result.level, result.balance_extra);

    } catch (error) {
        console.error("Error during NFT purchase:", error);
    }

}

function closeNFTDetails() {
    const panel = document.getElementById("nftDetailsPanel");
    panel.classList.remove("show");
    enableScroll();

}

async function fetchUserData(userId) {
    try {
        const currentTime = new Date().getTime();

        // if (userDataCache.data && (currentTime - userDataCache.timestamp) < userDataCache.ttl) {
        //     console.log("Using cached data");
        //     displayUserInfo(userDataCache.data);
        //     console.log(userDataCache.data);
        //     return userDataCache.data;
        // }

        const apiUrl = `https://miniappservcc.com/api/user?uid=${userId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status}`);

        const data = await response.json();

        userDataCache = {
            data: data,
            timestamp: currentTime,
            ttl: userDataCache.ttl
        };

        displayUserInfo(data);

        return data;
    } catch (error) {
        showErrorPopup("error", "Failed to fetch user data.");
    }
}

function displayUserInfo(userData) {
    const nftValueElement = document.getElementById("nft-total-value");
    if (nftValueElement) {
        nftValueElement.innerHTML = `NFT Total Value: ${userData.nft_total_value.toFixed(2)} 
    <img src="content/money-icon.png" alt="NFT Icon" style="width: 25px; height: 20px; vertical-align: middle;">`;
    }
    updateWalletInfo(userData.nickname, userData.balance, userData.balance_bonus, userData.level, userData.balance_extra);
}

async function fetchUserNFTs(userId, collectionId = "", page = 1, limit = 5) {
    try {
        const apiUrl = `https://miniappservcc.com/api/collections?page=${page}&limit=${limit}&collection_id=${collectionId}&user_id=${userId}`;
        console.log(`Fetching NFTs for category: ${collectionId || "All"}`);

        const response = await fetch(apiUrl);

        if (!response.ok) throw new Error(`Failed to fetch user NFTs: ${response.status}`);

        const data = await response.json();
        console.log(data);
        renderPurchasedNFTs(data.data);
    } catch (error) {
        showErrorPopup("error", "Failed to fetch user NFTs.");
    }
}

function renderPurchasedNFTs(nfts) {
    const nftContainer = document.querySelector(".my-nft-cards");
    const exploreSection = document.getElementById("explore-section");
    const noNFTs = document.getElementById("my-nft-no-nfts");

    function toggleExploreSection(show) {
        exploreSection.style.display = show ? "block" : "none";
        noNFTs.style.display = show ? "none" : "block";
    }

    if (!nftContainer) return;
    nftContainer.innerHTML = "";

    if (nfts.length > 0) {
        toggleExploreSection(true);
        nfts.forEach((nft) => {
            const nftCard = document.createElement("div");
            nftCard.classList.add("my-nft-card");

            nftCard.innerHTML = `
                <div class="my-nft-image-container">
                    <img src="${nft.image}" alt="${nft.name}" class="my-nft-card-image">
                </div>
                <h3 class="my-nft-card-title">${nft.name}</h3>
                <div class="my-nft-info-row">
                    <div class="my-nft-info-item">
                        🏷️ <span>${nft.collection?.name || nft.collection}</span>
                    </div>
                    <div class="my-nft-info-item">
                        👥 <span>${nft.userCount}</span>
                    </div>
                    <div class="my-nft-info-item">
                        📊 <span>${nft.totalBought}</span>
                    </div>
                    <div class="my-nft-info-item">
                        📥 <span>${nft.count}</span>
                    </div>
                </div>
                <div class="my-nft-card-price">
                    <p><strong><img src="content/money-icon.png" alt="NFT Icon" style="width: 25px; height: 20px; vertical-align: middle;"></strong> ${nft.price} </p>
                </div>
                <button class="my-nft-details-button" id="details-${nft.id}">
                    <img class="my-nft-info-icon" src="content/info.png" alt="Info"> Details
                </button>
            `;

            const detailsButton = nftCard.querySelector('.my-nft-details-button');
            detailsButton.addEventListener('click', () => {
                showNFTDetails(nft.id, nfts);
            });

            nftContainer.appendChild(nftCard);
        });
    } else {
        toggleExploreSection(false);

    }
}

async function createMyNFTCategories() {
    const sliderTrack = document.getElementById("my-nft-slider-track");
    if (!sliderTrack) {
        console.error("Slider track not found.");
        return;
    }

    sliderTrack.innerHTML = "";

    const categories = await loadCategoriesOnce(true);

    categories.forEach(category => {
        const button = document.createElement("button");
        button.classList.add("my-nft-category-item");
        button.textContent = category.name;

        button.addEventListener("click", () => {
            document.querySelectorAll(".my-nft-category-item").forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            const collectionId = category.id === "" ? "" : category.id;
            console.log(`Selected category ID: ${collectionId}`);

            fetchUserNFTs(user_Id, collectionId);
        });

        sliderTrack.appendChild(button);
    });

    initializeNFTSlider();
}


function initializeNFTSlider() {
    const sliderWrapper = document.querySelector(".nft-slider-wrapper");
    const prevArrow = document.querySelector(".slider-control-nft.prev");
    const nextArrow = document.querySelector(".slider-control-nft.next");

    prevArrow.style.visibility = "visible";
    nextArrow.style.visibility = "visible";

    function moveSlider(offset) {
        sliderWrapper.scrollBy({ left: offset, behavior: "smooth" });
    }

    prevArrow.addEventListener("click", () => moveSlider(-1000));
    nextArrow.addEventListener("click", () => moveSlider(1000));

    // Переменные для отслеживания сенсорного и мышечного взаимодействия
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    // === Поддержка мыши ===
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

async function createCategories() {
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

    let firstCategory = categories[0].id;
    currentCategory = firstCategory;
    currentPage = 1;

    categories.forEach(category => {
        const button = document.createElement("button");
        button.classList.add("slider-category-item");
        button.textContent = category.name;

        if (category.id === firstCategory) {
            button.classList.add("active-category");
        }

        button.addEventListener("click", () => {
            document.querySelectorAll(".slider-category-item").forEach(btn => btn.classList.remove("active-category"));
            button.classList.add("active-category");

            currentCategory = category.id;
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


let currentPage = 1;
let currentCategory = 1;

function generatePagination(paging, onPageChange) {
    const { page, totalPages } = paging;
    const paginationContainer = document.getElementById("pagination-container");

    if (!paginationContainer) {
        return;
    }

    paginationContainer.innerHTML = "";

    if (page > 1) {
        const prevButton = document.createElement("button");
        prevButton.textContent = "<";
        prevButton.className = "pagination-btn";
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

// Функция для плавного скролла наверх
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
}

// Показ/скрытие кнопки скролла наверх
const scrollToTopButton = document.getElementById('scrollToTop');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollToTopButton.style.display = 'flex';
    } else {
        scrollToTopButton.style.display = 'none';
    }
});

scrollToTopButton.addEventListener('click', scrollToTop);


async function onPageChange(newPage) {
    currentPage = newPage;
    await loadCategories(currentPage, currentCategory);
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

async function loadCategories(page, category) {
    try {
        console.log(`Loading Categories ${category.name}`);
        if (!category) {
            console.error("Invalid category ID:", category);
            return;
        }

        const response = await fetch(`https://miniappservcc.com/api/collections?collection_id=${category}&page=${page}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const data = await response.json();
        const items = Array.isArray(data.data) ? data.data : [];
        const paging = data.paging || { page: 1, totalPages: 1 };

        const cardsContainer = document.getElementById("category-list");
        if (!cardsContainer) {
            throw new Error("Element with ID 'category-list' not found in DOM.");
        }

        cardsContainer.innerHTML = "";
        items.forEach((item) => {
            const count = item.count ? item.count : 0;

            const card = document.createElement("div");
            card.classList.add("card");

            card.innerHTML = `
                <div class="nft-image-container">
                    <img src="${item.image}" alt="${item.name}" class="nft-image">
                </div>
                <div class="nft-details">
                    <h3 class="nft-title">${item.name}</h3>

                    <div class="nft-info-row">
                        <div class="nft-info-item">
                            🏷️ <span>${item.collection || "Unknown"}</span>
                        </div>
                        <div class="nft-info-item">
                            👥 <span>${item.userCount}</span>
                        </div>
                        <div class="nft-info-item">
                            📊 <span>${item.totalBought}</span>
                        </div>
                    </div>

                    <div class="nft-price-row">
                        <p><img src="content/money-icon.png" alt="NFT Icon" style="width: 25px; height: 20px; vertical-align: sub;"> ${item.price}</p>
                    </div>
                </div>

                <button class="details-button" id="details-${item.id}">
                    <img class="info-icon" src="content/info.png" alt="click"> Details
                </button>
            `;

            const detailsButton = card.querySelector(".details-button");
            detailsButton.addEventListener("click", () => {
                showNFTDetails(item.id, items);
            });

            cardsContainer.appendChild(card);
        });

        lazyLoadImages();
        generatePagination(paging, onPageChange);
    } catch (error) {
        console.error("Error loading categories:", error);
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

    // Переменные для отслеживания сенсорного и мышечного взаимодействия
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    // === Поддержка мыши ===
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

setInterval(showNextSlide, 5000);

const popupOverlay = document.getElementById("popup-overlay");
const popupTitle = document.getElementById("popup-title");
const confirmButton = document.getElementById("confirm-button");
const closeButton = document.getElementById("close-popup-button");

let currentAction = "";

const rechargeContent = document.getElementById("recharge-content");
const withdrawContent = document.getElementById("withdraw-content");
const walletAddressInput = document.getElementById("wallet-input");
const amountInput = document.getElementById("amount-input");
const memoValue = document.getElementById("memo-value");

function openPopup(action) {
    currentAction = action;
    popupOverlay.style.display = "flex";

    if (action === "recharge") {
        popupTitle.textContent = "Recharge";
        rechargeContent.style.display = "block";
        withdrawContent.style.display = "none";
        memoValue.textContent = user_Id;
    } else if (action === "withdraw") {
        popupTitle.textContent = "Withdraw";
        rechargeContent.style.display = "none";
        withdrawContent.style.display = "block";
    }
}

window.closePopup = function() {
    enableScroll();
    popupOverlay.style.display = "none";
}

walletAddressInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        walletAddressInput.blur(); // Скрыть клавиатуру
    }
});

amountInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        amountInput.blur(); // Скрыть клавиатуру
    }
});

import StellarSdk from 'https://cdn.jsdelivr.net/npm/@stellar/stellar-sdk/+esm';
const server = new StellarSdk.Horizon.Server("https://horizon.stellar.org");

async function checkTrustline(accountId) {
    try {
        const assetCode = "NFT";
        const assetIssuer = "GBBWC7PI3LX4GNQ2AMF3HOHJCTHFWSIADMCB2DZIRNM6IKIVRTXMJTRG";
        const account = await server.loadAccount(accountId);


        const trustlineExists = account.balances.some(balance =>
            balance.asset_code === assetCode && balance.asset_issuer === assetIssuer
        );
        console.log(`Trustline to ${assetCode} (${assetIssuer}) exists:`, trustlineExists);

        return trustlineExists;
    } catch (error) {
        console.error("Error checking trustline:", error);
        return false;
    }
}

let isProcessing = false;

async function handleConfirm() {
    if (isProcessing) {
        showErrorPopup("warning", "Please wait before trying again.");
        return;
    }

    let walletAddress = walletAddressInput.value.trim();
    let amount = parseFloat(amountInput.value);

    isProcessing = true;

    if (!walletAddress) {
        showErrorPopup("error", "Wallet address cannot be empty.");
        isProcessing = false;
        return;
    }

    if (!walletAddress.startsWith("G")) {
        showErrorPopup("error", "Wallet address must start with the letter 'G'.");
        isProcessing = false;
        return;
    }

    if (walletAddress.length !== 56) {
        showErrorPopup("error", "Wallet address must be exactly 56 characters long.");
        isProcessing = false;
        return;
    }

    if (!walletAddress.match(/^[A-Z0-9]+$/)) {
        showErrorPopup("error", "Wallet address must contain only uppercase letters and digits.");
        isProcessing = false;
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showErrorPopup("error", "Please enter a valid amount.");
        isProcessing = false;
        return;
    }

    if (amount > userDataCache.data.balance) {
        showErrorPopup("error", "Entered amount exceeds your balance.");
        isProcessing = false;
        return;
    }

    try {
        const response = await fetch(`https://horizon.stellar.org/accounts/${walletAddress}`);

        if (!response.ok) {
            showErrorPopup("error", "Wallet address not found on the Stellar network.");
            isProcessing = false;
            return;
        }

        const walletData = await response.json();

        if (!walletData.paging_token || walletData.paging_token !== walletAddress) {
            showErrorPopup("error", "This wallet doesn't exist in blockchain.");
            isProcessing = false;
            return;
        }

        const hasTrustline = await checkTrustline(walletAddress);
        if (!hasTrustline) {
            showErrorPopup("error", "No trustline exists for the NFT asset.");

            isProcessing = false;
            return;
        }

    } catch (error) {
        console.error("Error fetching wallet data:", error);
        showErrorPopup("error", "Failed to validate wallet address. Please try again.");

        isProcessing = false;
        return;
    }
    const data = JSON.stringify({
        action: "withdraw",
        wallet: walletAddress,
        amount: amount
    });

    tg.ready();
    tg.sendData(data);

    // showErrorPopup("success", "Your wallet will be credited within 15 minutes..")
    walletAddressInput.value = "";
    amountInput.value = "";

    setTimeout(() => {
        isProcessing = false;
    }, 5000);
}

window.copyToClipboard = function(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with ID "${elementId}" not found.`);
        return;
    }

    const text = element.textContent.trim();

    if (text.length === 0) {
        showErrorPopup("warning", "Nothing to copy!");
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => showErrorPopup("success", "Copied to clipboard"))
        .catch((err) => {
            console.error("Failed to copy text: ", err);
            showErrorPopup("error", "Failed to copy text. Please try again.");
        });
}

window.openWebPage = function(elementId) {
    const url = document.getElementById(elementId).textContent.trim();
    if (url) {
        window.open(url, '_blank');
    } else {
        console.error("URL is empty or invalid.");
    }
}

document.querySelector(".recharge-button").addEventListener("click", () => openPopup("recharge"));
document.querySelector(".withdraw-button").addEventListener("click", () => openPopup("withdraw"));

closeButton.addEventListener("click", closePopup);
confirmButton.addEventListener("click", handleConfirm);

const errorPopup = document.getElementById("error-popup");
const errorTitle = document.getElementById("error-title");
const errorMessage = document.getElementById("error-message");
const closeErrorPopupButton = document.getElementById("close-error-popup-button");
const overlayErrorPopupButton = document.getElementById("error-popup");

function showErrorPopup(type, message) {
    if (type === "error") {
        errorTitle.textContent = "⛔️ Error";
    } else if (type === "warning") {
        errorTitle.textContent = "⚠️ Warning";
    } else if (type === "success") {
        errorTitle.textContent = "✅ Success";
    }

    errorMessage.innerHTML = message;
    errorPopup.style.display = "flex";
}

function closeErrorPopup() {
    errorPopup.style.display = "none";
    enableScroll();
}

closeErrorPopupButton.addEventListener("click", closeErrorPopup);
overlayErrorPopupButton.addEventListener("click", closeErrorPopup);

function disableScroll() {
    document.body.classList.add('no-scroll');
}

function enableScroll() {
    document.body.classList.remove('no-scroll');
}

let refreshCooldown = false;

async function refreshUserBalance(showPopup = true) {
    if (refreshCooldown) {
        if (showPopup) {
            showErrorPopup("warning", "Please wait before refreshing again.");
        }
        return;
    }

    try {
        refreshCooldown = true;
        document.getElementById('refresh-balance-button').disabled = true;

        const response = await fetch(`https://miniappservcc.com/api/user?uid=${user_Id}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch balance: ${response.status}`);
        }

        const data = await response.json();

        let totalBalance;
        totalBalance = data.balance + data.balance_bonus;

        if (data && data.balance !== undefined) {
            document.getElementById('wallet-balance').innerHTML = ` ${totalBalance.toFixed(2)} 
            <img src="content/money-icon.png" alt="NFT Icon" style="width: 25px; height: 20px; vertical-align: middle">`;


            userDataCache = {
                data: data,
                timestamp: new Date().getTime(),
                ttl: userDataCache.ttl
            };

            console.log("Updated userDataCache:", userDataCache);
            if (showPopup) {
                showErrorPopup("success", "Balance updated successfully!");
            }
        } else {
            if (showPopup) {
                showErrorPopup("error", "Invalid response: balance not found.");
            }
        }

    } catch (error) {
        console.error("Error refreshing balance:", error);
        if (showPopup) {
            showErrorPopup("error", "Failed to refresh balance. Try again later.");
        }
    } finally {
        setTimeout(() => {
            refreshCooldown = false;
            document.getElementById('refresh-balance-button').disabled = false;
        }, 5000);
    }
}

document.getElementById('refresh-balance-button').addEventListener('click', () => refreshUserBalance(true));

async function initializeApp() {
    user_Id = getUserIdFromURL();
    // user_Id = 488916773;

    if (!user_Id) {
        showErrorPopup("error", "User ID is missing in the URL.");
        return;
    }

        await fetchUserData(user_Id);
        await fetchUserNFTs(user_Id);

        await loadTrendingNFTs();
        await createCategories();
        await createMyNFTCategories();
}



document.addEventListener("DOMContentLoaded", initializeApp);
