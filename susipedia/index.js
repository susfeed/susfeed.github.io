document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `<img src="" alt="">`;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector("img");

  document.querySelectorAll(".thumb img").forEach(img => {
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightbox.classList.add("active");
    });
  });

  lightbox.addEventListener("click", () => {
    lightbox.classList.remove("active");
    lightboxImg.src = "";
  });
});
