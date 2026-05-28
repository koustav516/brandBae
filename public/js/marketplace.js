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
        grid.innerHTML = `<div class="empty-state"><div class="ei">🔍</div><h3>No creators found</h3><p>Try adjusting your filters.</p></div>`;
        return;
    }

    grid.innerHTML = data.map((c, i) => {
        const cover      = coverGradients[c.niche] || coverGradients.Food;
        const profileUrl = `/creator/${c.instagramHandle}`;
        const loading    = i < 4 ? `fetchpriority="high"` : `loading="lazy"`;
        const engVal     = c.engagement > 0 ? c.engagement + "%" : "—";
        const engClass   = c.engagement > 0 ? "cs-val eng" : "cs-val";

        const photoHtml = c.photoUrl
            ? `<img src="${cdnCard(c.photoUrl)}" class="card-cover-img" ${loading} onerror="this.style.display='none'" />`
            : `<div class="card-cover-placeholder">
                   <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
               </div>`;

        return `
        <div class="creator-card" onclick="window.location='${profileUrl}'">
            <div class="card-cover" style="background:${cover}">
                ${photoHtml}
                <span class="cover-niche-badge">${c.niche}</span>
            </div>
            <div class="card-body">
                <div class="card-identity">
                    <span class="card-handle">${c.instagramHandle ? "@" + c.instagramHandle : c.fullName || "Creator"}</span>
                    ${c.city ? `<span class="card-city">📍 ${c.city}</span>` : ""}
                </div>
                <div class="card-stats">
                    <div class="card-stat">
                        <div class="cs-val">${fmt(c.followers)}</div>
                        <div class="cs-key">Followers</div>
                    </div>
                    <div class="card-stat">
                        <div class="${engClass}">${engVal}</div>
                        <div class="cs-key">Engagement</div>
                    </div>
                </div>
            </div>
            <div class="card-footer-link">
                View Profile
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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

fetch("/api/creators")
    .then(r => r.json())
    .then(data => {
        creators = data;
        const preNiche = new URLSearchParams(window.location.search).get("niche");
        if (preNiche) {
            const btn = document.querySelector(`.niche-chip[data-niche="${preNiche}"]`);
            if (btn) { setNiche(btn); return; }
        }
        renderCreators(creators);
    })
    .catch(err => console.error("Failed to load creators:", err));
