const coverGradients = {
    Food:      "linear-gradient(135deg, #667eea, #764ba2)",
    Fashion:   "linear-gradient(135deg, #f093fb, #f5576c)",
    Fitness:   "linear-gradient(135deg, #4facfe, #00f2fe)",
    Travel:    "linear-gradient(135deg, #43e97b, #38f9d7)",
    Beauty:    "linear-gradient(135deg, #fa709a, #fee140)",
    Tech:      "linear-gradient(135deg, #30cfd0, #667eea)",
    Lifestyle: "linear-gradient(135deg, #f6d365, #fda085)",
    Gaming:    "linear-gradient(135deg, #6a11cb, #2575fc)",
    Finance:   "linear-gradient(135deg, #11998e, #38ef7d)",
    Comedy:    "linear-gradient(135deg, #f7971e, #ffd200)",
};

let creators    = [];
let activeNiche = "All";

function fmt(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
}

function cdnCard(url) {
    if (!url || !url.includes("cloudinary.com")) return url;
    return url.replace("/upload/", "/upload/q_auto,f_auto/");
}

function renderCreators(data) {
    const grid  = document.getElementById("creatorsGrid");
    const count = document.getElementById("resultsCount");
    count.innerHTML = `<strong>${data.length} creator${data.length !== 1 ? "s" : ""}</strong> <span>· India</span>`;

    if (!data.length) {
        const activeNicheLabel = activeNiche !== "All" ? ` in <strong>${activeNiche}</strong>` : "";
        grid.innerHTML = `
            <div class="empty-state">
                <div class="ei">🔍</div>
                <h3>No creators found${activeNicheLabel ? " " + activeNicheLabel.replace(/<[^>]+>/g, "") : ""}</h3>
                <p>Try a different niche or clear your filters.</p>
                <button onclick="document.querySelector('.niche-chip[data-niche=\\'All\\']').click()" class="empty-state-cta">Show all creators</button>
            </div>`;
        return;
    }

    grid.innerHTML = data.map((c, i) => {
        const cover      = coverGradients[c.niche] || coverGradients.Food;
        const profileUrl = `/creator/${c.instagramHandle}`;
        const loading    = i < 4 ? `fetchpriority="high"` : `loading="lazy"`;

        const photoHtml = c.photoUrl
            ? `<img src="${cdnCard(c.photoUrl)}" class="card-cover-img" ${loading} onerror="this.style.display='none'" />`
            : `<div class="card-cover-placeholder">
                   <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
               </div>`;

        const verifiedBadge = c.verified
            ? `<span class="card-verified-check" title="Verified">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
               </span>`
            : "";

        return `
        <div class="creator-card" onclick="window.location='${profileUrl}'">
            <div class="card-cover" style="background:${cover}">
                ${photoHtml}
                <span class="cover-niche-badge">${c.niche}</span>
            </div>
            <div class="card-info">
                <div class="card-name-row">
                    <span class="card-fullname">${c.fullName || c.instagramHandle || "Creator"}</span>
                    ${verifiedBadge}
                </div>
                ${c.city ? `<div class="card-location"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${c.city}</div>` : ""}
                <div class="card-bottom-row">
                    <div class="card-stats-inline">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <span>${fmt(c.followers)}</span>
                        ${c.engagement > 0 ? `<span class="stat-dot">·</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B5BDB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span class="eng-val">${c.engagement}%</span>` : ""}
                    </div>
                    <span class="view-profile-btn">View Profile</span>
                </div>
            </div>
        </div>`;
    }).join("");
}

function setNiche(btn) {
    document.querySelectorAll(".niche-chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    activeNiche = btn.dataset.niche;
    applyFilters();
}

function applyFilters() {
    const sort = document.getElementById("sortFilter").value;
    const q    = document.getElementById("searchInput").value.toLowerCase().trim();

    let filtered = creators.filter(c => {
        if (activeNiche !== "All" && c.niche !== activeNiche) return false;
        if (q && !`${c.niche} ${c.city} ${c.instagramHandle} ${c.fullName}`.toLowerCase().includes(q)) return false;
        return true;
    });

    if (sort === "engagement")     filtered.sort((a, b) => b.engagement - a.engagement);
    else if (sort === "views")     filtered.sort((a, b) => b.avgReelViews - a.avgReelViews);
    else if (sort === "followers-high") filtered.sort((a, b) => b.followers - a.followers);

    renderCreators(filtered);
}

function loadCreators() {
    const grid = document.getElementById("creatorsGrid");
    grid.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p>Finding creators for you…</p></div>`;

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
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="ei">⚠️</div>
                    <h3>Could not load creators</h3>
                    <p>Check your connection and try again.</p>
                    <button onclick="loadCreators()" class="empty-state-cta">Try again</button>
                </div>`;
            document.getElementById("resultsCount").innerHTML = "";
        });
}

loadCreators();
