import {user_Id} from "./index.js";
import {levelsConfig} from "./user_level_bonus_config.js";
import {showPurchaseHistoryPage} from "./HistoryPageLogic.js";
import {showErrorPopup} from "./PopupLogic.js";
import {showSuccessPopup} from "./Utilities.js";
import {showDepositHistoryPage} from "./DepositHistroyPageLogic.js";

const avatars = [
    {id: 1, src: "content/AvatarIcons/nft_1.png"},
    {id: 2, src: "content/AvatarIcons/nft_2.png"},
    {id: 3, src: "content/AvatarIcons/nft_3.png"},
    {id: 4, src: "content/AvatarIcons/nft_4.png"},
    {id: 5, src: "content/AvatarIcons/nft_5.png"},
    {id: 6, src: "content/AvatarIcons/nft_6.png"},
    {id: 7, src: "content/AvatarIcons/nft_7.png"},
    {id: 8, src: "content/AvatarIcons/nft_8.png"},
    {id: 9, src: "content/AvatarIcons/nft_9.png"},
    {id: 10, src: "content/AvatarIcons/nft_10.png"},
];

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('see-all-levels').addEventListener('click', () => {
        const list = document.getElementById('level-list');
        list.classList.toggle('open');
        list.classList.toggle('closed');
        const toggle = document.getElementById('see-all-levels');
        toggle.textContent = list.classList.contains('open') ? '🔼 Hide Levels' : '🔽 Show All Levels';
    });
});

export async function loadUserData() {
    const response = await fetch(`https://miniappservcc.com/api/user?uid=${user_Id}`);
    if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status}`);

    const user = await response.json();

    document.querySelector(".profile-card h3").textContent = user.nickname;
    // document.querySelector(".bio").textContent = user.bio || "NFT Enthusiast & Collector";

    document.querySelectorAll(".balance-amount")[0].textContent = parseFloat(user.balance).toLocaleString();
    document.querySelectorAll(".balance-amount")[1].textContent = parseFloat(user.balance_extra).toLocaleString();

    renderUserProgressLevel(user);
    renderLevelButtons(user.level);

    const avatar = avatars.find(a => a.id === user.icon_id);
    if (avatar) {
        document.querySelector(".user-photo").src = avatar.src;
    }
    setupUserTransactions();

    await loadUserHistory();

}

function renderUserProgressLevel(user) {
    const progressEl = document.getElementById("progress-level");
    const levelData = levelsConfig.find(l => {
        const levelNum = parseInt(l.level.toString().replace(/\D/g, ''));
        return levelNum === parseInt(user.level.toString().replace(/\D/g, ''));
    });

    if (!levelData) {
        progressEl.innerHTML = "Level data not found.";
        return;
    }

    const maxRangeStr = levelData.range.split("–")[1].trim().replace(/,/g, "");
    const maxRange = parseInt(maxRangeStr, 10);

    const totalDeposit = user.total_deposit || 0;
    const progress = Math.min((totalDeposit / maxRange) * 100, 100);

    progressEl.innerHTML = "";

    const levelSpan = document.createElement("span");
    levelSpan.textContent = `Current Level: ${user.level}`;

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";

    const progressFill = document.createElement("div");
    progressFill.className = "progress";
    progressFill.style.width = `${progress}%`;

    progressBar.appendChild(progressFill);

    const benefitsWrapper = document.createElement("div");
    benefitsWrapper.className = "level-benefits collapsible open";
    benefitsWrapper.id = "level-benefits";

    const toggle = document.createElement("div");
    toggle.id = "benefits-toggle";
    toggle.className = "toggle-arrow";

    const toggleText = document.createElement("span");
    toggleText.textContent = "";

    const arrow = document.createElement("span");
    arrow.className = "arrow-icon";
    // arrow.textContent = " 🔽";

    toggle.appendChild(toggleText);
    toggle.appendChild(arrow);

    const desc = document.createElement("div");
    desc.id = "benefits-text";
    desc.innerHTML = levelData?.description?.map(line => `<div>${line}</div>`).join('') || 'No benefits available.';

    benefitsWrapper.appendChild(toggle);
    benefitsWrapper.appendChild(desc);

    progressEl.appendChild(levelSpan);
    progressEl.appendChild(progressBar);
    progressEl.appendChild(benefitsWrapper);

    // toggle.addEventListener('click', () => {
    //     benefitsWrapper.classList.toggle('open');
    //     benefitsWrapper.classList.toggle('closed');
    //     arrow.style.transform = benefitsWrapper.classList.contains('open') ? "rotate(180deg)" : "rotate(0deg)";
    // });

    document.getElementById("add-funds-btn").addEventListener("click", () => {
        showRechargePopup();
    });

    document.getElementById("history-btn").addEventListener("click", () => {
        showPurchaseHistoryPage();
    });

    document.getElementById("deposit-history-btn").addEventListener("click", () => {
        showDepositHistoryPage();
    });
}

function renderLevelButtons(currentLevel) {
    const levelList = document.getElementById("level-list");
    levelList.innerHTML = "";

    levelsConfig.forEach(({level, title, description}) => {
        const levelNum = parseInt(level.replace("Level ", ""));

        const btn = document.createElement("div");
        btn.classList.add("level-btn", "collapsable");

        if (levelNum < currentLevel) {
            btn.classList.add("completed");
        } else if (levelNum === currentLevel) {
            btn.classList.add("current", "completed");
        } else {
            btn.classList.add("locked");
        }

        btn.innerHTML = `
            <div class="level-title">
                ${level}: ${title}
                <span class="arrow">🔽</span>
            </div>
            <div class="collapsable-content">
                ${description.map(line => `<div>${line}</div>`).join("")}
            </div>
        `;

        btn.addEventListener("click", () => {
            document.querySelectorAll(".level-btn.open").forEach(el => {
                el.classList.remove("open");
            });

            btn.classList.add("open");
        });

        levelList.appendChild(btn);
    });
}

export function showRechargePopup() {
    const overlay = document.getElementById("popup-overlay");
    const content = document.getElementById("recharge-content");
    const memoField = document.getElementById("memo-value");

    memoField.textContent = user_Id;

    overlay.style.display = "flex";
    content.style.display = "block";
}

function closePopup() {
    document.getElementById("popup-overlay").style.display = "none";
    document.getElementById("recharge-content").style.display = "none";
}

async function selectIcon(iconId) {
    const res = await fetch(`https://miniappservcc.com/api/user/icon?uid=${user_Id}&icon_id=${iconId}`);
    if (res.ok) {
        const avatar = avatars.find(a => a.id === iconId);
        if (avatar) {
            document.querySelector(".user-photo").src = avatar.src;
        }
        closeIconPanel();
    } else {
        alert("Failed to update avatar");
    }
}

function renderIconPanel() {
    const grid = document.querySelector(".icon-grid");
    grid.innerHTML = "";

    avatars.forEach(({id, src}) => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = `Avatar ${id}`;
        img.title = `Select avatar #${id}`;
        img.addEventListener("click", () => selectIcon(id));
        grid.appendChild(img);
    });
}

function closeIconPanel() {
    document.getElementById("icon-panel-overlay").style.display = "none";
}

document.getElementById("user-photo-button").addEventListener("click", () => {
    document.getElementById("icon-panel-overlay").style.display = "block";
    renderIconPanel();
});


export function setupUserTransactions() {
    const toggleButtons = document.querySelectorAll(".purchase-history-btn");
    const historyContainer = document.getElementById("purchase-history-content");

    if (!toggleButtons.length || !historyContainer) return;

    // toggleButtons.forEach(btn => {
    //     btn.addEventListener("click", async () => {
    //         toggleButtons.forEach(b => b.classList.remove("active"));
    //         btn.classList.add("active");
    //
    //         const type = btn.dataset.type;
    //         await loadUserHistory(type);
    //     });
    // });

}

async function loadUserHistory() {
    const container = document.getElementById("purchase-history-content");
    container.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch(`https://miniappservcc.com/api/user/mynft?uid=${user_Id}`);
        const { data: list } = await res.json();

        if (!Array.isArray(list) || list.length === 0) {
            container.innerHTML = "<p>No items found.</p>";
            return;
        }

        container.innerHTML = "";

        list
            .filter(item => item.nft && Object.keys(item.nft).length > 0)
            .forEach(item => {
                const card = document.createElement("div");
                card.className = "purchase-history-card";

                const rentedCount = Array.isArray(item.rent)
                    ? item.rent.reduce((sum, r) => sum + (r.count || 0), 0)
                    : 0;
                const availableCount = item.count - rentedCount;

                const firstDuration = 1;
                const firstCount = 1;
                const pricePerOne = item.nft[`rent_price_${firstDuration}m`] || 0;
                const firstPrice = pricePerOne * firstCount;

                // const rentBlock = availableCount > 0 ? `
                //     <div class="rent-quantity-control" data-max="${availableCount}">
                //         <button class="qty-btn decrement" data-id="${item.id}">–</button>
                //         <span class="qty-value" id="qty-value-${item.id}">${firstCount}</span>
                //         <button class="qty-btn increment" data-id="${item.id}">+</button>
                //     </div>
                //
                //     <div class="rent-durations">
                //         ${[1, 3, 6, 12, 24, 60].map((m, i) => {
                //     const rentPrice = item.nft[`rent_price_${m}m`] || 0;
                //     const selected = i === 0 ? 'selected' : '';
                //     return `<button class="rent-duration-btn ${selected}"
                //                 data-id="${item.id}"
                //                 data-duration="${m}"
                //                 data-price-per-one="${rentPrice}">
                //                 ${m}m
                //             </button>`;
                // }).join('')}
                //     </div>
                //
                //     <div class="rent-price-display" id="rent-price-${item.id}">
                //         For ${firstCount}x ${firstDuration}m you will receive: ${firstPrice}
                //         <img src="/content/xml-icon.png" class="price-icon" />
                //     </div>
                //
                //     <button class="rent-now-btn"
                //         data-id="${item.id}"
                //         data-duration="${firstDuration}"
                //         data-count="${firstCount}"
                //         data-price-per-month="${pricePerOne}">
                //         Rent
                //     </button>
                // ` : `
                //     <div class="rent-price-display rent-receive-display">
                //         All ${item.count} items are rented out.
                //         <img src="/content/xml-icon.png" class="price-icon" />
                //     </div>
                // `;
                //
                const rentBlock = '';
                card.innerHTML = `
                    <img src="https://miniappservcc.com/get-image?path=${item.nft.image}" class="purchase-history-img" />
                    <div class="purchase-history-info">
                        <strong class="purchase-history-title">${item.nft.name}</strong>
                        <p><b>Collection:</b> ${item.nft.collection.name}</p>
                        <p><b>Count:</b> ${item.count}</p>
                        <!--<p>
                            <b>In Rent:</b> ${rentedCount} /
                            <b>Available:</b> ${availableCount}
                        </p>-->
                        <p><b>Price:</b> ${item.nft.price * item.count}
                            <img src="content/money-icon.png" class="price-icon" />
                        </p>
                    </div>
                    ${rentBlock}
                `;

                container.appendChild(card);
            });

        // + / -
        // container.querySelectorAll(".qty-btn").forEach(btn => {
        //     btn.addEventListener("click", () => {
        //         const id = btn.dataset.id;
        //         const control = btn.closest(".rent-quantity-control");
        //         const max = parseInt(control.dataset.max);
        //         const valueEl = control.querySelector(`#qty-value-${id}`);
        //         let value = parseInt(valueEl.textContent);
        //
        //         if (btn.classList.contains("increment") && value < max) value++;
        //         if (btn.classList.contains("decrement") && value > 1) value--;
        //
        //         valueEl.textContent = value;
        //
        //         const rentBtn = container.querySelector(`.rent-now-btn[data-id="${id}"]`);
        //         if (rentBtn) rentBtn.dataset.count = value;
        //
        //         const selectedBtn = container.querySelector(`.rent-duration-btn[data-id="${id}"].selected`);
        //         if (selectedBtn) {
        //             const duration = selectedBtn.dataset.duration;
        //             const pricePerOne = Number(selectedBtn.dataset["pricePerOne"]);
        //             const newTotal = pricePerOne * value;
        //
        //             const display = container.querySelector(`#rent-price-${id}`);
        //             if (display) {
        //                 display.innerHTML = `For ${value}x ${duration}m you will receive: ${newTotal}
        //                     <img src="/content/xml-icon.png" class="price-icon" />`;
        //             }
        //
        //             rentBtn.dataset.pricePerMonth = pricePerOne;
        //         }
        //
        //         control.querySelector(".increment").disabled = value >= max;
        //         control.querySelector(".decrement").disabled = value <= 1;
        //     });
        // });

        // Длительность аренды
        // container.querySelectorAll(".rent-duration-btn").forEach(btn => {
        //     btn.addEventListener("click", () => {
        //         const id = btn.dataset.id;
        //         const duration = btn.dataset.duration;
        //         const pricePerOne = Number(btn.dataset.pricePerOne);
        //
        //         const card = btn.closest(".purchase-history-card");
        //         const qty = parseInt(card.querySelector(`#qty-value-${id}`)?.textContent || "1");
        //         const newTotal = pricePerOne * qty;
        //
        //         card.querySelectorAll(`.rent-duration-btn[data-id='${id}']`)
        //             .forEach(b => b.classList.remove("selected"));
        //         btn.classList.add("selected");
        //
        //         const rentBtn = card.querySelector(`.rent-now-btn[data-id='${id}']`);
        //         if (rentBtn) {
        //             rentBtn.dataset.duration = duration;
        //             rentBtn.dataset.pricePerMonth = pricePerOne;
        //         }
        //
        //         const display = card.querySelector(`#rent-price-${id}`);
        //         if (display) {
        //             display.innerHTML = `For ${qty}x ${duration}m you will receive: ${newTotal}
        //                 <img src="/content/xml-icon.png" class="price-icon" />`;
        //         }
        //     });
        // });

        // Rent
        // container.querySelectorAll(".rent-now-btn").forEach(btn => {
        //     btn.addEventListener('click', async () => {
        //         const id = Number(btn.dataset.id);
        //         const duration = Number(btn.dataset.duration);
        //         const count = Number(btn.dataset.count);
        //         const pricePerMonth = Number(btn.dataset.pricePerMonth);
        //
        //         if (!duration || !count) return alert("Select duration and count");
        //
        //         try {
        //             const res = await fetch(`https://miniappservcc.com/api/nft/rent?uid=${user_Id}&user_nft_id=${id}&duration=${duration}&count=${count}`);
        //             if (!res.ok) throw new Error("Rent request failed");
        //
        //             showSuccessPopup("✅ Rented successfully!");
        //
        //             const card = btn.closest(".purchase-history-card");
        //             const display = card.querySelector(`#rent-price-${id}`);
        //             const totalPrice = count * pricePerMonth;
        //
        //             // Обновляем текст In Rent / Available
        //             const rentInfo = card.querySelector(".purchase-history-info p:nth-child(3)");
        //             const [currentInRent, currentAvailable] = rentInfo.textContent.match(/\d+/g).map(Number);
        //             const newInRent = currentInRent + count;
        //             const newAvailable = currentAvailable - count;
        //
        //             rentInfo.innerHTML = `
        //                 <b>In Rent:</b> ${newInRent} /
        //                 <b>Available:</b> ${newAvailable}
        //             `;
        //
        //             if (newAvailable <= 0) {
        //                 card.querySelectorAll(".rent-durations, .rent-now-btn, .rent-quantity-control").forEach(el => el.remove());
        //                 if (display) {
        //                     display.classList.add("rent-receive-display");
        //                     display.innerHTML = `
        //                         You will receive ${totalPrice}
        //                         <img src="/content/xml-icon.png" class="price-icon" />
        //                     `;
        //                 }
        //             } else {
        //                 if (display) {
        //                     display.innerHTML = `
        //                         You will receive ${totalPrice}
        //                         <img src="/content/xml-icon.png" class="price-icon" />
        //                     `;
        //                 }
        //             }
        //
        //         } catch (err) {
        //             showErrorPopup("warning", "Rent failed");
        //         }
        //     });
        // });

    } catch (err) {
        console.error("Error loading history:", err);
        container.innerHTML = "<p>Error loading history.</p>";
    }
}

window.closePopup = closePopup;
window.closeIconPanel = closeIconPanel;
window.selectIcon = selectIcon;
