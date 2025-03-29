import { user_Id } from './index.js';
import { levelsConfig } from './user_level_bonus_config.js';
import {showRechargeChoicePopup} from "./UserPageLogic.js";

export async function loadHomepageLevelSummary() {
    const progressFill = document.getElementById("summary-progress-fill");
    const bonusesEl = document.getElementById("summary-bonuses");
    const progressHeading = document.getElementById("level-progress");

    try {
        const res = await fetch(`https://miniappservcc.com/api/user?uid=${user_Id}`);
        if (!res.ok) throw new Error("User fetch failed");

        const user = await res.json();
        const currentLevelNumber = parseInt(user.level);

        const levelData = levelsConfig.find(l => {
            const levelNum = parseInt(l.level.toString().replace(/\D/g, ''));
            return levelNum === currentLevelNumber;
        });

        if (!levelData) {
            bonusesEl.innerHTML = "No level data.";
            return;
        }

        const [rangeMin, rangeMax] = levelData.range
            .split(/[-–—]/)
            .map(val => parseInt(val.trim().replace(/,/g, "")));

        const totalDeposit = parseFloat(user.total_deposit || 0);
        const progress = Math.min((totalDeposit / rangeMax) * 100, 100);
        const remaining = Math.max(0, rangeMax - totalDeposit);

        progressFill.style.width = `${progress}%`;

        bonusesEl.innerHTML = levelData.description?.map(line => `<div>${line}</div>`).join("") || "No bonuses.";

        if (progressHeading) {
            progressHeading.innerHTML = `Level ${currentLevelNumber} – Remaining to next level: ~${Math.round(remaining).toLocaleString()} <img src="content/money-icon.png" class="price-icon"/>`;
        }

        document.getElementById("add-fund-btn")?.addEventListener("click", () => {
            showRechargeChoicePopup();
        });

    } catch (err) {
        console.error("Homepage level summary error:", err);
        if (bonusesEl) bonusesEl.textContent = "Error loading data.";
    }
}

//
// function renderLevelButton(currentLevel) {
//     const levelList = document.getElementById("all-level-list");
//     levelList.innerHTML = "";
//
//     levelsConfig.forEach(({ level, title, description }) => {
//         const levelNum = parseInt(level.replace("Level ", ""));
//
//         const btn = document.createElement("div");
//         btn.classList.add("level-btn", "collapsable");
//
//         if (levelNum < currentLevel) {
//             btn.classList.add("completed");
//         } else if (levelNum === currentLevel) {
//             btn.classList.add("current", "completed");
//         } else {
//             btn.classList.add("locked");
//         }
//
//         btn.innerHTML = `
//             <div class="level-title">
//                 ${level}: ${title}
//                 <span class="arrow">🔽</span>
//             </div>
//             <div class="collapsable-content">
//                 ${description.map(line => `<div>${line}</div>`).join("")}
//             </div>
//         `;
//
//         btn.addEventListener("click", () => {
//             document.querySelectorAll(".level-btn.open").forEach(el => {
//                 el.classList.remove("open");
//             });
//
//             btn.classList.add("open");
//         });
//
//         levelList.appendChild(btn);
//     });
// }
