import { user_Id } from './index.js';
import { levelsConfig } from './user_level_bonus_config.js';
import {showRechargePopup} from "./UserPageLogic.js";

export async function loadHomepageLevelSummary() {
    const progressFill = document.getElementById("summary-progress-fill");
    const bonusesEl = document.getElementById("summary-bonuses");

    try {
        const res = await fetch(`https://miniappservcc.com/api/user?uid=${user_Id}`);
        if (!res.ok) throw new Error("User fetch failed");

        const user = await res.json();

        // renderLevelButton(user.level);

        const levelData = levelsConfig.find(l => {
            const levelNum = parseInt(l.level.toString().replace(/\D/g, ''));
            return levelNum === parseInt(user.level.toString().replace(/\D/g, ''));
        });

        if (!levelData) {
            bonusesEl.innerHTML = "No level data.";
            return;
        }

        const maxRange = parseInt(levelData.range.split(/[-–—]/)[1].trim().replace(/,/g, ""));
        const totalDeposit = user.total_deposit || 0;
        const progress = Math.min((totalDeposit / maxRange) * 100, 100);

        progressFill.style.width = `${progress}%`;
        bonusesEl.innerHTML = levelData.description?.map(line => `<div>${line}</div>`).join("") || "No bonuses.";

        document.getElementById("add-fund-btn").addEventListener("click", () => {
            showRechargePopup();
        });

        // document.getElementById("see-all-level-home").addEventListener("click", () => {
        //     const list = document.getElementById("all-level-list");
        //     list.classList.toggle("expanded");
        //
        //     const toggleText = document.getElementById("see-all-level-home");
        //     toggleText.textContent = list.classList.contains("expanded") ? "🔼 Hide Levels" : "🔽 Show All Levels";
        // });
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
