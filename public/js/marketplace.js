const coverGradients = {
    Food:      "linear-gradient(145deg, #5046e5 0%, #7c3aed 100%)",
    Fashion:   "linear-gradient(145deg, #db2777 0%, #9d174d 100%)",
    Fitness:   "linear-gradient(145deg, #0284c7 0%, #0369a1 100%)",
    Travel:    "linear-gradient(145deg, #059669 0%, #0f766e 100%)",
    Beauty:    "linear-gradient(145deg, #c026d3 0%, #9333ea 100%)",
    Tech:      "linear-gradient(145deg, #1d4ed8 0%, #1e3a8a 100%)",
    Lifestyle: "linear-gradient(145deg, #d97706 0%, #b45309 100%)",
    Gaming:    "linear-gradient(145deg, #6d28d9 0%, #4c1d95 100%)",
    Finance:   "linear-gradient(145deg, #0f766e 0%, #134e4a 100%)",
    Comedy:    "linear-gradient(145deg, #ea580c 0%, #c2410c 100%)",
};

let creators    = [];
let activeNiche = "All";

function fmt(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
}

function cdnCard(url) {
    if (!url || !url.includes("cloudinary.com")) return url;
    return url.replace("/upload/", "/upload/q_auto,f_auto/");
}

/* ── SKELETON LOADING ── */
function renderSkeletons(count = 8) {
    const grid = document.getElementById("creatorsGrid");
    grid.innerHTML = Array.from({ length: count }, () => `
        <div class="creator-card skeleton-card" aria-hidden="true">
            <div class="skeleton-cover skeleton"></div>
            <div class="card-body">
                <div class="skeleton skeleton-line w-70" style="height:18px;margin-bottom:6px"></div>
                <div class="skeleton skeleton-line w-45" style="height:13px;margin-bottom:14px"></div>
                <div class="skeleton skeleton-line w-55" style="height:26px;border-radius:100px;margin-bottom:14px"></div>
                <div class="skeleton skeleton-stats"></div>
                <div class="skeleton skeleton-btn"></div>
            </div>
        </div>`
    ).join("");
}

/* ── CARD TEMPLATE ── */
function renderCreators(data) {
    const grid  = document.getElementById("creatorsGrid");
    const count = document.getElementById("resultsCount");
    count.innerHTML = `<strong>${data.length} creator${data.length !== 1 ? "s" : ""}</strong> <span>in India</span>`;

    if (!data.length) {
        const nicheLabel = activeNiche !== "All" ? ` in <strong>${activeNiche}</strong>` : "";
        grid.innerHTML = `
            <div class="empty-state">
                <div class="ei">🔍</div>
                <h3>No creators found${nicheLabel ? " " + nicheLabel.replace(/<[^>]+>/g, "") : ""}</h3>
                <p>Try a different niche or search term.</p>
                <button onclick="resetFilters()" class="empty-state-cta">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    Show all creators
                </button>
            </div>`;
        return;
    }

    grid.innerHTML = data.map((c, i) => {
        const cover   = coverGradients[c.niche] || coverGradients.Food;
        const url     = `/creator/${c.instagramHandle}`;
        const loading = i < 4 ? `fetchpriority="high"` : `loading="lazy"`;

        const photo = c.photoUrl
            ? `<img src="${cdnCard(c.photoUrl)}" class="card-cover-img" ${loading} alt="${c.fullName || c.instagramHandle}" onerror="this.style.display='none'" />`
            : `<div class="card-cover-placeholder">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
               </div>`;

        const verified = c.verified
            ? `<span class="card-verified-check" title="Verified creator">
                   <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
               </span>`
            : "";

        const engVal   = c.engagement > 0 ? c.engagement + "%" : "—";
        const engClass = c.engagement > 0 ? "stat-val stat-val--eng" : "stat-val";
        const viewsVal = c.avgReelViews > 0 ? fmt(c.avgReelViews) : "—";

        const cityTag = c.city
            ? `<span class="card-tag card-tag--location">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                   ${c.city}
               </span>` : "";

        return `
        <article class="creator-card" onclick="window.location='${url}'" role="button" tabindex="0"
            onkeydown="if(event.key==='Enter'||event.key===' ')window.location='${url}'"
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
                        <div class="stat-icon">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <span class="stat-val">${fmt(c.followers)}</span>
                        <span class="stat-key">Followers</span>
                    </div>
                    <div class="stat-sep"></div>
                    <div class="stat-col">
                        <div class="stat-icon">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </div>
                        <span class="${engClass}">${engVal}</span>
                        <span class="stat-key">Engagement</span>
                    </div>
                    <div class="stat-sep"></div>
                    <div class="stat-col">
                        <div class="stat-icon">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                        <span class="stat-val">${viewsVal}</span>
                        <span class="stat-key">Reel Views</span>
                    </div>
                </div>

                <div class="card-cta-btn">View Profile</div>
            </div>

        </article>`;
    }).join("");
}

/* ── FILTERS ── */
function setNiche(btn) {
    document.querySelectorAll(".niche-chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    activeNiche = btn.dataset.niche;
    applyFilters();
}

function resetFilters() {
    document.getElementById("searchInput").value = "";
    const allBtn = document.querySelector(".niche-chip[data-niche='All']");
    if (allBtn) setNiche(allBtn);
}

function applyFilters() {
    const sort = document.getElementById("sortFilter").value;
    const q    = document.getElementById("searchInput").value.toLowerCase().trim();

    let filtered = creators.filter(c => {
        if (activeNiche !== "All" && c.niche !== activeNiche) return false;
        if (q && !`${c.niche} ${c.city} ${c.instagramHandle} ${c.fullName}`.toLowerCase().includes(q)) return false;
        return true;
    });

    if (sort === "engagement")      filtered.sort((a, b) => b.engagement - a.engagement);
    else if (sort === "views")      filtered.sort((a, b) => b.avgReelViews - a.avgReelViews);
    else if (sort === "followers-high") filtered.sort((a, b) => b.followers - a.followers);

    renderCreators(filtered);
}

/* ── BOOT ── */
function loadCreators() {
    renderSkeletons(8);
    document.getElementById("resultsCount").innerHTML = "Loading creators…";

    fetch("/api/creators")
        .then(r => { if (!r.ok) throw new Error("Server error"); return r.json(); })
        .then(data => {
            creators = data;
            const preNiche = new URLSearchParams(window.location.search).get("niche");
            if (preNiche) {
                const btn = document.querySelector(`.niche-chip[data-niche="${preNiche}"]`);
                if (btn) { setNiche(btn); return; }
            }
            renderCreators(creators);
        })
        .catch(() => {
            document.getElementById("creatorsGrid").innerHTML = `
                <div class="empty-state">
                    <div class="ei">⚠️</div>
                    <h3>Something went wrong</h3>
                    <p>Could not load creators. Check your connection.</p>
                    <button onclick="loadCreators()" class="empty-state-cta">Try again</button>
                </div>`;
            document.getElementById("resultsCount").innerHTML = "";
        });
}

loadCreators();
