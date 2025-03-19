document.addEventListener("DOMContentLoaded", () => {
    startNFTShowcaseAnimation();
});

function startNFTShowcaseAnimation() {
    const showcaseImages = document.querySelectorAll(".nft-showcase img");
    showcaseImages.forEach(image => {
        image.style.transform = "translate(0, 0) rotate(0deg)";

        setTimeout(() => {
            image.removeAttribute("style");
        }, 10);
    });
}


// function showSection(sectionId) {
//     document.querySelectorAll("section").forEach(section => {
//         section.style.display = "none";
//     });
//
//     const section = document.getElementById(sectionId);
//     section.style.display = "block";
//
//     if (sectionId === "hero") {
//         startNFTShowcaseAnimation();
//     }
// }

document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        const category = button.textContent.trim().toLowerCase();
        const cards = document.querySelectorAll('.card');

        cards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            if (category === 'all' || cardCategory === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

const scrollToTopButton = document.getElementById('scrollToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollToTopButton.style.display = 'flex';
    } else {
        scrollToTopButton.style.display = 'none';
    }
});

scrollToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
});