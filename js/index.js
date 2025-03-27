import {loadTrendingNFTs} from "./TrendingSectionLogic.js"
import {hideCartUserHeader, hideSuccessfulPurchase, renderCart, showCartUserHeader} from "./CartLogic.js";
import {closeNFTDetails} from "./ProductDetailsLogic.js";
import {showErrorPopup} from "./PopupLogic.js";
import {loadUserData} from "./UserPageLogic.js";
import {loadHomepageLevelSummary} from "./HomePageLogic.js";
import {createCategories} from "./CategorySectionLogic.js";
import {startLiquidityCoroutine} from "./StellarHandler.js";

export let user_Id = null;

export let tg = null;
let currentTab = 'main-menu';

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.querySelector('.footer').classList.add('visible');
    }, 100);
    Telegram.WebApp.expand();
    tg = Telegram.WebApp;
});

window.setActiveTab = async function (selectedTab) {
    // await showLoader();

    try {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        selectedTab.classList.add('active');

        let newTab = selectedTab.classList.contains('home') ? 'main-menu' :
            selectedTab.classList.contains('trending') ? 'trending-nfts' :
                selectedTab.classList.contains('categories') ? 'categories' :
                    selectedTab.classList.contains('cart') ? 'cart-section' :
                        selectedTab.classList.contains('myProfile') ? 'user-profile' : null;

        if (newTab === currentTab || newTab === null) {
            // await hideLoader();
            return;
        }

        currentTab = newTab;
        document.querySelectorAll('#main-menu, #trending-nfts, #cart-section, #categories, #user-profile')
            .forEach(section => {
                section.style.display = "none";
            });

        let activeSection = document.getElementById(currentTab);
        if (activeSection) {
            activeSection.style.display = "block";
        }

        await hideCartUserHeader();

        if (currentTab === 'main-menu') {
            await loadHomepageLevelSummary();
        } else if (currentTab === 'trending-nfts') {
            await loadTrendingNFTs();
        } else if (currentTab === 'cart-section') {
            await showCartUserHeader();
            renderCart();
        } else if (currentTab === 'categories') {
        } else if (currentTab === 'user-profile') {
            await loadUserData();
        }
    } catch (error) {
        console.error("Error when changing tabs:", error);
    } finally {
        // await hideLoader();
        closeNFTDetails();
        hideSuccessfulPurchase();
        goBack();
    }
};

async function initializeApp() {
    // user_Id = getUserIdFromURL();
    user_Id = 7568295563;

    if (!user_Id) {
        showErrorPopup("error", "User ID is missing in the URL.");
        return;
    }

    await loadTrendingNFTs();
    await loadHomepageLevelSummary();
    await createCategories();
    startLiquidityCoroutine();

}

document.addEventListener("DOMContentLoaded", initializeApp);