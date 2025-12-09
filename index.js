async function loadAndDisplayContent(jsonPath, containerId, baseDir) {
      try {
        const response = await fetch(jsonPath);
        const data = await response.json();

        data.sort((a, b) => parseInt(b.folder) - parseInt(a.folder));

        const topThree = data.slice(0, 2);
        const container = document.getElementById(containerId);

        topThree.forEach(item => {
          const title = item.file.replace(/_/g, ' ').replace(/\.html$/, '');
          const card = document.createElement('a');
          card.href = `${baseDir}/${item.folder}/${item.file}`;
          card.className = 'block-card';
          card.innerHTML = `
            <div class="card-image" style="background-image: url('${baseDir}/${item.folder}/cover.webp');"></div>
            <div class="card-content">
              <h3 class="card-title">${title}</h3>
            </div>
          `;
          container.appendChild(card);
        });
      } catch (error) {
        console.error(`Failed to load ${jsonPath}:`, error);
      }
    }

    loadAndDisplayContent('articles/index.json', 'new-articles', 'articles');
    loadAndDisplayContent('quizzes/index.json', 'new-quizzes', 'quizzes');
    loadAndDisplayContent('games/index.json', 'new-games', 'games');