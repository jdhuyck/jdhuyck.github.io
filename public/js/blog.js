document.addEventListener("DOMContentLoaded", async () => {
    const postsGrid = document.getElementById("blog-posts");

    // Fetch all md posts
    const response = await fetch("../blogs/_posts/");
    const files = await response.json();  // Requires GitHub Pages API setup

    files.forEach(file => {
        if (file.name.endsWith(".md")) {
            fetch(`../blogs/_posts/${file_name}`)
                .then(res => res.text())
                .then(text => {
                    const {title, date, tags, abstract} = parseFrontMatter(text);
                    const slug = file.name.replace(".md", "");

                    const postCard = document.createElement("div");
                    postCard.className = "post-card";
                    postCard.className = "post-card";
                    postCard.onclick = () => window.location.href = `post/html?slug=${slug}`;

                    postCard.innerHTML = `
                        <h3 class="post-title">${title}</h3>
                        <small>${new Date(date).toLocaleDateString()}</small>
                        <p class="post-abstract">${abstract || text.substring(0, 150) + '...'}</p>
                        <div class="tags-container">
                            ${tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
                        </div>
                    `;

                    postsGrid.appendChild(postCard);
                });
        }
    });
});

function parseFrontMatter(text) {
    const frontMatter = text.match(/^---\n([\s\S]*?)\n---/)[1];
    return frontMatter.split("\n").reduce((acc, line) => {
        const [key, ...value] = line.split(":");
        acc[key.trim()] = JSON.parse(value.join(":").trim());
        return acc;
    }, {});
}