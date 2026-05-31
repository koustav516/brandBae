const coverGradients = {
    Food:      "linear-gradient(145deg, #ede9fe, #c4b5fd)",
    Fashion:   "linear-gradient(145deg, #fce7f3, #fbcfe8)",
    Fitness:   "linear-gradient(145deg, #dbeafe, #bfdbfe)",
    Travel:    "linear-gradient(145deg, #dcfce7, #bbf7d0)",
    Beauty:    "linear-gradient(145deg, #fdf2f8, #f9a8d4)",
    Tech:      "linear-gradient(145deg, #e0f2fe, #bae6fd)",
    Lifestyle: "linear-gradient(145deg, #fef3c7, #fde68a)",
    Gaming:    "linear-gradient(145deg, #ede9fe, #a78bfa)",
    Finance:   "linear-gradient(145deg, #dcfce7, #6ee7b7)",
    Comedy:    "linear-gradient(145deg, #ffedd5, #fed7aa)",
};

let creators = [];

function fmt(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
}

function inr(n) { return "₹" + Number(n).toLocaleString("en-IN"); }

function cdnCard(url) {
    if (!url || !url.includes("cloudinary.com")) return url;
    return url.replace("/upload/", "/upload/q_auto,f_auto/");
}

/* Engagement → star rating (0–5 scale) */
function engToStars(eng) {
    if (!eng || eng <= 0) return 0;
    if (eng >= 6)  return 5;
    if (eng >= 4)  return 4;
    if (eng >= 2.5) return 3;
    if (eng >= 1.5) return 2;
    return 1;
}

function renderStars(eng) {
    const filled = engToStars(eng);
    return Array.from({ length: 5 }, (_, i) =>
        `<svg width="11" height="11" viewBox="0 0 24 24" fill="${i < filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    ).join("");
}

/* ── SKELETON ── */
function renderSkeletons(count = 6) {
    const grid = document.getElementById("creatorsGrid");
    grid.innerHTML = Array.from({ length: count }, () => `
        <div class="creator-card skeleton-card" aria-hidden="true">
            <div class="skel-block" style="aspect-ratio:3/4;border-radius:0"></div>
            <div class="card-body">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                    <div class="skel-block" style="height:20px;width:55%;border-radius:5px"></div>
                    <div class="skel-block" style="width:18px;height:18px;border-radius:50%;flex-shrink:0"></div>
                </div>
                <div class="skel-block" style="height:11px;width:48%;border-radius:5px;margin-bottom:14px"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
                    <div class="skel-block" style="height:58px;border-radius:10px"></div>
                    <div class="skel-block" style="height:58px;border-radius:10px"></div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div class="skel-block" style="height:18px;width:80px;border-radius:5px"></div>
                    <div class="skel-block" style="height:36px;width:108px;border-radius:100px"></div>
                </div>
            </div>
        </div>`
    ).join("");
}

/* ── CARD TEMPLATE ── */
function renderCreators(data) {
    const grid  = document.getElementById("creatorsGrid");
    const count = document.getElementById("resultsCount");
    count.textContent = `${data.length} Result${data.length !== 1 ? "s" : ""}`;

    if (!data.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:12px;opacity:0.4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <h3>No creators found</h3>
                <p>Try adjusting your filters.</p>
                <button onclick="clearFilters()" class="empty-state-cta">Clear filters</button>
            </div>`;
        return;
    }

    grid.innerHTML = data.map((c, i) => {
        const cover   = coverGradients[c.niche] || coverGradients.Food;
        const url     = `/creator/${c.instagramHandle}`;
        const loading = i < 6 ? `fetchpriority="high"` : `loading="lazy"`;

        const photo = c.photoUrl
            ? `<img src="${cdnCard(c.photoUrl)}" class="card-photo-img" ${loading} alt="${c.fullName || c.instagramHandle}" onerror="this.style.display='none'" />`
            : `<div class="card-photo-placeholder"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;

        const verified = c.verified
            ? `<span class="card-verified" aria-label="Verified creator"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>`
            : "";

        const engVal = c.engagement > 0 ? c.engagement + "%" : "—";

        const handleParts = [
            c.instagramHandle ? `@${c.instagramHandle}` : null,
            c.city || null
        ].filter(Boolean);
        const handleLine = handleParts.join(" · ");

        // Lowest price with its natural label (varies per creator)
        const priceOptions = [
            { val: c.reelPrice,  label: "reel" },
            { val: c.storyPrice, label: "story" },
            { val: c.postPrice,  label: "post" },
        ].filter(p => p.val > 0);
        const minP = priceOptions.length ? priceOptions.reduce((a, b) => a.val <= b.val ? a : b) : null;

        const priceChips = c.barter
            ? `<div class="card-price-barter"><span class="barter-dot"></span>Open to barter</div>`
            : minP
            ? `<div class="card-price-single"><span class="cps-amount">${inr(minP.val)}</span><span class="cps-label">/${minP.label}</span></div>`
            : `<div class="card-price-single"><span class="cps-na">Inquire</span></div>`;

        return `
        <article class="creator-card" onclick="window.location='${url}'"
            role="button" tabindex="0"
            onkeydown="if(event.key==='Enter')window.location='${url}'"
            aria-label="View ${c.fullName || c.instagramHandle} profile">

            <div class="card-photo-outer">
                <div class="card-photo" style="background:${cover}">
                    ${photo}
                    <span class="card-niche-tag">${c.niche}</span>
                    ${c.barter ? `<span class="cover-barter-badge"><span class="barter-dot"></span>Barter</span>` : ""}
                </div>
            </div>

            <div class="card-body">
                <div class="card-identity">
                    <div class="card-name-row">
                        <span class="card-name">${c.fullName || c.instagramHandle || "Creator"}</span>
                        ${verified}
                    </div>
                    <div class="card-handle">${handleLine}</div>
                </div>

                <div class="card-stats">
                    <div class="stat-pill">
                        <span class="pill-label">Followers</span>
                        <span class="pill-val">${fmt(c.followers)}</span>
                    </div>
                    <div class="stat-pill">
                        <span class="pill-label">Engagement</span>
                        <span class="pill-val">${engVal}</span>
                    </div>
                </div>

                <div class="card-footer">
                    ${priceChips}
                    <div class="card-cta-btn">View →</div>
                </div>
            </div>

        </article>`;
    }).join("");

    // Stagger card reveal
    requestAnimationFrame(() => {
        const cards = grid.querySelectorAll(".creator-card:not(.skeleton-card)");
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("card-visible");
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.06 });
        cards.forEach((card, i) => {
            card.style.transitionDelay = `${i * 40}ms`;
            obs.observe(card);
        });
    });
}

/* ── FILTERS ── */
function getActiveNiches() {
    return Array.from(document.querySelectorAll(".niche-cb:checked")).map(cb => cb.value);
}

function getActiveSize() {
    const cb = document.querySelector('input[name="size"]:checked');
    return cb ? cb.value : "all";
}

function getActiveCollab() {
    const cb = document.querySelector('input[name="collab"]:checked');
    return cb ? cb.value : "all";
}

function applyFilters() {
    const sort    = document.getElementById("sortFilter").value;
    const q       = document.getElementById("searchInput").value.toLowerCase().trim();
    const niches  = getActiveNiches();
    const size    = getActiveSize();
    const collab  = getActiveCollab();

    let filtered = creators.filter(c => {
        if (niches.length) {
            const sub = c.nicheSubcategories ? c.nicheSubcategories.split(",").map(s => s.trim()) : [];
            const allNiches = [c.niche, ...sub];
            if (!niches.some(n => allNiches.includes(n))) return false;
        }
        if (size !== "all") {
            const [min, max] = size.split("-").map(Number);
            if (c.followers < min || c.followers > max) return false;
        }
        if (collab === "barter" && !c.barter) return false;
        if (collab === "paid" && c.barter) return false;
        if (q && !`${c.niche} ${c.nicheSubcategories || ""} ${c.city} ${c.instagramHandle} ${c.fullName}`.toLowerCase().includes(q)) return false;
        return true;
    });

    if (sort === "engagement")      filtered.sort((a, b) => b.engagement - a.engagement);
    else if (sort === "views")      filtered.sort((a, b) => b.avgReelViews - a.avgReelViews);
    else if (sort === "followers-high") filtered.sort((a, b) => b.followers - a.followers);

    renderCreators(filtered);
}

function clearFilters() {
    document.querySelectorAll(".niche-cb").forEach(cb => cb.checked = false);
    const allSize  = document.querySelector('input[name="size"][value="all"]');
    const allCollab = document.querySelector('input[name="collab"][value="all"]');
    if (allSize)  allSize.checked  = true;
    if (allCollab) allCollab.checked = true;
    document.getElementById("searchInput").value = "";
    applyFilters();
}

function toggleSection(sectionId) {
    document.getElementById(sectionId).classList.toggle("collapsed");
}

/* ── BOOT ── */
function loadCreators() {
    renderSkeletons(6);
    document.getElementById("resultsCount").textContent = "Loading…";

    fetch("/api/creators")
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(data => {
            creators = data;
            const preNiche = new URLSearchParams(window.location.search).get("niche");
            if (preNiche) {
                const cb = document.querySelector(`.niche-cb[value="${preNiche}"]`);
                if (cb) { cb.checked = true; }
            }
            applyFilters();
        })
        .catch(() => {
            document.getElementById("creatorsGrid").innerHTML = `
                <div class="empty-state">
                    <div class="ei">⚠️</div>
                    <h3>Could not load creators</h3>
                    <p>Check your connection and try again.</p>
                    <button onclick="loadCreators()" class="empty-state-cta">Try again</button>
                </div>`;
            document.getElementById("resultsCount").textContent = "";
        });
}

loadCreators();
