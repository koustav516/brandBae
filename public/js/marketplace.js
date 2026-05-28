const nicheConfig = {
    Food: { bg: "#dcfce7", text: "#166534", gradient: ["#84fab0", "#8fd3f4"] },
    Fashion: {
        bg: "#fce7f3",
        text: "#9d174d",
        gradient: ["#f093fb", "#f5576c"],
    },
    Fitness: {
        bg: "#ffedd5",
        text: "#9a3412",
        gradient: ["#f6d365", "#fda085"],
    },
    Travel: {
        bg: "#dbeafe",
        text: "#1e40af",
        gradient: ["#4facfe", "#00f2fe"],
    },
    Beauty: {
        bg: "#ede9fe",
        text: "#6d28d9",
        gradient: ["#a18cd1", "#fbc2eb"],
    },
    Tech: { bg: "#cffafe", text: "#155e75", gradient: ["#43e97b", "#38f9d7"] },
    Lifestyle: {
        bg: "#fee2e2",
        text: "#991b1b",
        gradient: ["#ffecd2", "#fcb69f"],
    },
    Gaming: {
        bg: "#f3e8ff",
        text: "#6b21a8",
        gradient: ["#6a11cb", "#2575fc"],
    },
    Finance: {
        bg: "#d1fae5",
        text: "#065f46",
        gradient: ["#11998e", "#38ef7d"],
    },
    Comedy: {
        bg: "#fef9c3",
        text: "#854d0e",
        gradient: ["#f7971e", "#ffd200"],
    },
};

let creators = [];

let activeNiche = "All";

function fmt(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
}
function inr(n) {
    return "₹" + n.toLocaleString("en-IN");
}
function engClass(r) {
    return r >= 5 ? "good" : r >= 3 ? "ok" : "";
}

function renderCreators(data) {
    const grid = document.getElementById("creatorsGrid");
    const count = document.getElementById("resultsCount");
    count.innerHTML = `Showing <strong>${data.length} creator${data.length !== 1 ? "s" : ""}</strong> <span>· India</span>`;

    if (!data.length) {
        grid.innerHTML = `<div class="empty-state"><div class="ei">🔍</div><h3>No creators found</h3><p>Try adjusting your filters.</p></div>`;
        return;
    }

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

    const nicheColors = {
        Food: { bg: "rgba(59,91,219,0.12)", color: "#3B5BDB" },
        Fashion: { bg: "rgba(180,60,100,0.12)", color: "#b43c64" },
        Fitness: { bg: "rgba(26,122,69,0.12)", color: "#1a7a45" },
        Travel: { bg: "rgba(0,131,143,0.12)", color: "#00838f" },
        Beauty: { bg: "rgba(173,20,87,0.12)", color: "#ad1457" },
        Tech: { bg: "rgba(48,63,159,0.12)", color: "#303f9f" },
        Lifestyle: { bg: "rgba(245,127,23,0.12)", color: "#f57f17" },
        Gaming: { bg: "rgba(94,53,177,0.12)", color: "#5e35b1" },
        Finance: { bg: "rgba(46,125,50,0.12)", color: "#2e7d32" },
        Comedy: { bg: "rgba(230,81,0,0.12)", color: "#e65100" },
    };

    grid.innerHTML = data
        .map((c) => {
            const cover = coverGradients[c.niche] || coverGradients.Food;
            const nColor = nicheColors[c.niche] || nicheColors.Food;
            const ec = engClass(c.engagement);
            const profileUrl = `/creator/${c.instagramHandle}`;

            return `
        <div class="creator-card" onclick="window.location='${profileUrl}'">

            <div class="card-photo" style="background:${cover}">
                ${c.photoUrl
                    ? `<img src="${c.photoUrl}" class="card-photo-img" onerror="this.style.display='none'" />`
                    : `<div class="card-photo-placeholder"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`
                }
            </div>

            <div class="card-body">
                <div class="creator-name-row">
                    ${c.fullName ? `<span class="creator-name">${c.fullName}</span>` : ""}
                    <span class="cover-niche" style="background:${nColor.bg};color:${nColor.color};border:1px solid ${nColor.color}33">${c.niche}</span>
                </div>
                ${c.city ? `<div class="creator-city">📍 ${c.city}</div>` : ""}
                <div class="card-stats-row">
                    <div class="stat-item">
                        <span class="stat-val">${fmt(c.followers)}</span>
                        <span class="stat-key">Followers</span>
                    </div>
                    ${c.engagement > 0 ? `<div class="stat-divider"></div>
                    <div class="stat-item">
                        <span class="stat-val ${ec}">${c.engagement}%</span>
                        <span class="stat-key">Engagement</span>
                    </div>` : ""}
                    ${c.avgReelViews > 0 ? `<div class="stat-divider"></div>
                    <div class="stat-item">
                        <span class="stat-val">${fmt(c.avgReelViews)}</span>
                        <span class="stat-key">Avg Views</span>
                    </div>` : ""}
                </div>
            </div>

            <div class="card-footer">
                View Profile
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>

        </div>`;
        })
        .join("");
}

function setNiche(btn) {
    document.querySelectorAll(".niche-chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    activeNiche = btn.dataset.niche;
    applyFilters();
}

function applyFilters() {
    const fol = document.getElementById("followersFilter").value;
    const sort = document.getElementById("sortFilter").value;
    const barter = document.getElementById("barterFilter").value;
    const q = document.getElementById("searchInput").value.toLowerCase().trim();

    let filtered = creators.filter((c) => {
        if (activeNiche !== "All" && c.niche !== activeNiche) return false;
        if (fol !== "all") {
            const [min, max] = fol.split("-").map(Number);
            if (c.followers < min || c.followers > max) return false;
        }
        if (barter === "barter" && !c.barter) return false;
        if (barter === "paid" && c.barter) return false;
        if (q && !`${c.niche} ${c.city}`.toLowerCase().includes(q))
            return false;
        return true;
    });

    if (sort === "engagement")
        filtered.sort((a, b) => b.engagement - a.engagement);
    else if (sort === "views")
        filtered.sort((a, b) => b.avgReelViews - a.avgReelViews);
    else if (sort === "price-low")
        filtered.sort((a, b) => a.reelPrice - b.reelPrice);
    else if (sort === "followers-high")
        filtered.sort((a, b) => b.followers - a.followers);

    renderCreators(filtered);
}


fetch("/api/creators")
    .then((r) => r.json())
    .then((data) => {
        creators = data;

        const preNiche = new URLSearchParams(window.location.search).get("niche");
        if (preNiche) {
            const btn = document.querySelector(`.niche-chip[data-niche="${preNiche}"]`);
            if (btn) setNiche(btn);
        } else {
            renderCreators(creators);
        }
    })
    .catch((err) => console.error("Failed to load creators:", err));
