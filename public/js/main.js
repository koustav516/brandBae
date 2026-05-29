// ── NAV SCROLL EFFECT ──
const nav = document.getElementById("mainNav");
window.addEventListener(
    "scroll",
    () => {
        nav.classList.toggle("scrolled", window.scrollY > 40);
    },
    { passive: true },
);

// ── ANIMATED STAT COUNTERS ──
function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const duration = 1600;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(eased * target);
        el.textContent = prefix + value + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ── INTERSECTION OBSERVER ──
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const el = entry.target;

            // Scroll reveal
            if (el.classList.contains("reveal")) {
                el.classList.add("visible");
            }

            // Stat counter
            if (el.classList.contains("num") && el.dataset.target) {
                animateCounter(el);
                observer.unobserve(el);
            }
        });
    },
    { threshold: 0.15 },
);

// Observe all reveal elements
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Observe all stat counters
document
    .querySelectorAll(".num[data-target]")
    .forEach((el) => observer.observe(el));

// ── FEATURED CREATORS ──
const coverGradients = {
    Food:      "linear-gradient(135deg, #dce8ff, #c5d0f5)",
    Fashion:   "linear-gradient(135deg, #fce4ec, #f8bbd0)",
    Fitness:   "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
    Travel:    "linear-gradient(135deg, #e0f7fa, #b2ebf2)",
    Beauty:    "linear-gradient(135deg, #fce4ec, #f3e5f5)",
    Tech:      "linear-gradient(135deg, #e8eaf6, #c5cae9)",
    Lifestyle: "linear-gradient(135deg, #fff8e1, #ffecb3)",
    Gaming:    "linear-gradient(135deg, #ede7f6, #d1c4e9)",
    Finance:   "linear-gradient(135deg, #e8f5e9, #dcedc8)",
    Comedy:    "linear-gradient(135deg, #fff3e0, #ffe0b2)",
};

const nicheColors = {
    Food:      { bg: "rgba(59,91,219,0.12)",   color: "#3B5BDB" },
    Fashion:   { bg: "rgba(180,60,100,0.12)",  color: "#b43c64" },
    Fitness:   { bg: "rgba(26,122,69,0.12)",   color: "#1a7a45" },
    Travel:    { bg: "rgba(0,131,143,0.12)",   color: "#00838f" },
    Beauty:    { bg: "rgba(173,20,87,0.12)",   color: "#ad1457" },
    Tech:      { bg: "rgba(48,63,159,0.12)",   color: "#303f9f" },
    Lifestyle: { bg: "rgba(245,127,23,0.12)",  color: "#f57f17" },
    Gaming:    { bg: "rgba(94,53,177,0.12)",   color: "#5e35b1" },
    Finance:   { bg: "rgba(46,125,50,0.12)",   color: "#2e7d32" },
    Comedy:    { bg: "rgba(230,81,0,0.12)",    color: "#e65100" },
};

function fmtNum(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n);
}

function renderFeatured(creators) {
    const grid = document.getElementById("featuredGrid");
    if (!grid) return;

    // Top 3 by followers
    const featured = [...creators]
        .sort((a, b) => b.followers - a.followers)
        .slice(0, 3);

    grid.innerHTML = featured.map((c) => {
        const cover    = coverGradients[c.niche] || coverGradients.Food;
        const url      = `/creator/${c.instagramHandle}`;
        const engVal   = c.engagement > 0 ? c.engagement + "%" : "—";
        const engClass = c.engagement > 0 ? "stat-val stat-val--eng" : "stat-val";

        const photo = c.photoUrl
            ? `<img src="${c.photoUrl}" class="card-cover-img" loading="lazy" alt="${c.fullName || c.instagramHandle}" onerror="this.style.display='none'" />`
            : `<div class="card-cover-placeholder"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;

        const verified = c.verified
            ? `<span class="card-verified-check" title="Verified"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>`
            : "";

        const cityTag = c.city
            ? `<span class="card-tag card-tag--location">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                   ${c.city}
               </span>` : "";

        return `
        <article class="creator-card" onclick="window.location='${url}'"
            role="button" tabindex="0"
            onkeydown="if(event.key==='Enter')window.location='${url}'"
            aria-label="View ${c.fullName || c.instagramHandle} profile">

            <div class="card-cover" style="background:${cover}">
                ${photo}
                <div class="card-cover-scrim"></div>
                <span class="cover-niche-badge">${c.niche}</span>
                ${c.barter ? `<span class="cover-barter-badge"><span class="barter-dot"></span>Barter</span>` : ""}
            </div>

            <div class="card-body">
                <div class="card-identity">
                    <div class="card-name-row">
                        <span class="card-fullname">${c.fullName || c.instagramHandle || "Creator"}</span>
                        ${verified}
                    </div>
                    <div class="card-role">${c.niche} Creator</div>
                </div>

                <div class="card-tags">
                    ${cityTag}
                    ${c.barter ? `<span class="card-tag card-tag--barter"><span class="barter-dot"></span>Open to Barter</span>` : ""}
                </div>

                <div class="card-stats-row">
                    <div class="stat-col">
                        <div class="stat-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                        <span class="stat-val">${fmtNum(c.followers)}</span>
                        <span class="stat-key">Followers</span>
                    </div>
                    <div class="stat-sep"></div>
                    <div class="stat-col">
                        <div class="stat-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
                        <span class="${engClass}">${engVal}</span>
                        <span class="stat-key">Engagement</span>
                    </div>
                    <div class="stat-sep"></div>
                    <div class="stat-col">
                        <div class="stat-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
                        <span class="stat-val">${c.avgReelViews > 0 ? fmtNum(c.avgReelViews) : "—"}</span>
                        <span class="stat-key">Reel Views</span>
                    </div>
                </div>

                <div class="card-cta-btn">View Profile →</div>
            </div>

        </article>`;
    }).join("");

    // wire newly added cards into the scroll-reveal observer
    grid.querySelectorAll(".fc").forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.08}s`;
        el.classList.add("reveal");
        observer.observe(el);
    });
}

fetch("/api/creators")
    .then((r) => r.json())
    .then((data) => {
        renderFeatured(data);
    })
    .catch(() => {
        const grid = document.getElementById("featuredGrid");
        if (grid) grid.innerHTML = "";
    });
