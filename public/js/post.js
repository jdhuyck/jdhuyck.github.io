document.addEventListener("DOMContentLoaded", async () => {
    const slug = new URLSearchParams(window.location.search).get("slug");
    const response = await fetch(`../blogs/_posts/${slug}.md`);
    const text = await response.text();

    const {title, date, tags} = parseFrontMatter(text);
    const content = text.split("---")[2];

    document.title = `${title} | Jody's Blog`;
    document.getElementById("post-title").textContent = title;
    document.getElementById("post-date").textContent = new Date(date).toLocaleDateString();

    const tagsContainer = document.getElementById("post-tags");
    tags.forEach(tag => {
        const tagEl = document.createElement("span");
        tagEl.className = "tag";
        tagEl.textContent = tag;
        tagsContainer.appendChild(tagEl);
    });

    document.getElementById("post-body").innerHTML = marked.parse(content);
})