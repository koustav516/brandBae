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
            <div class="skeleton skeleton-image"></div>
            <div class="card-content">
                <div class="skeleton skeleton-line" style="width:40%;height:9px;margin-bottom:8px"></div>
                <div class="skeleton skeleton-line" style="width:75%;height:14px;margin-bottom:5px"></div>
                <div class="skeleton skeleton-line" style="width:50%;height:11px;margin-bottom:12px"></div>
                <div class="skeleton skeleton-line" style="width:90%;height:11px;margin-bottom:14px"></div>
                <div class="skeleton skeleton-line" style="width:60%;height:17px;margin-bottom:12px"></div>
            </div>
            <div class="skeleton skeleton-btn"></div>
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
                <div class="ei">🔍</div>
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
            ? `<img src="${cdnCard(c.photoUrl)}" class="card-cover-img" ${loading} alt="${c.fullName || c.instagramHandle}" onerror="this.style.display='none'" />`
            : `<div class="card-cover-placeholder"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;

        const verified = c.verified
            ? `<span class="card-verified-check" title="Verified"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>`
            : "";

        const engVal   = c.engagement > 0 ? c.engagement + "%" : "—";
        const engClass = c.engagement > 0 ? "stat-val stat-val--eng" : "stat-val";

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
                    ${c.barter ? `<span class="card-tag card-tag--barter card-tag--barter-desktop"><span class="barter-dot"></span>Open to Barter</span>` : ""}
                </div>

                <div class="card-stats-row">
                    <div class="stat-col">
                        <div class="stat-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                        <span class="stat-val">${fmt(c.followers)}</span>
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
                        <span class="stat-val">${c.avgReelViews > 0 ? fmt(c.avgReelViews) : "—"}</span>
                        <span class="stat-key">Reel Views</span>
                    </div>
                </div>

                <div class="card-cta-btn">View Profile</div>
            </div>

        </article>`;
    }).join("");
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
        if (niches.length && !niches.includes(c.niche)) return false;
        if (size !== "all") {
            const [min, max] = size.split("-").map(Number);
            if (c.followers < min || c.followers > max) return false;
        }
        if (collab === "barter" && !c.barter) return false;
        if (collab === "paid" && c.barter) return false;
        if (q && !`${c.niche} ${c.city} ${c.instagramHandle} ${c.fullName}`.toLowerCase().includes(q)) return false;
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
