const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

export function mountSliders(scope = document) {
  scope.querySelectorAll("[data-slider]").forEach((root) => {
    if (root.dataset.sliderReady === "true") return;
    const viewport = root.querySelector(".slider-viewport");
    const track = root.querySelector(".slider-track");
    if (!viewport || !track) return;
    const slides = [...track.children].filter((node) => node.tagName === "IMG");
    if (!slides.length) return;
    root.dataset.sliderReady = "true";
    if (slides.length < 2) return;

    let index = 0;
    let paused = reduceMotion.matches;
    let timer = null;
    let touchX = null;
    let announced = false;
    const interval = Number(root.dataset.interval) || 5000;
    const pauseButton = root.querySelector("[data-slider-pause]");
    const count = root.querySelector("[data-slider-count]");
    const caption = root.querySelector("[data-slider-caption]");
    const live = root.querySelector("[data-slider-live]");

    function layout() {
      const width = viewport.clientWidth;
      slides.forEach((slide) => {
        slide.style.width = `${width}px`;
      });
      track.style.transform = `translateX(-${index * width}px)`;
    }

    function show(next) {
      index = (next + slides.length) % slides.length;
      layout();
      const slide = slides[index];
      const text = slide.dataset.caption || "";
      slides.forEach((item, itemIndex) => {
        const current = itemIndex === index;
        item.alt = current ? (item.dataset.caption || "") : "";
        item.toggleAttribute("aria-hidden", !current);
      });
      if (count) count.textContent = `Photo ${index + 1} of ${slides.length}`;
      if (caption) caption.textContent = text;
      if (live) live.textContent = announced ? `Photo ${index + 1} of ${slides.length}. ${text}` : "";
      announced = true;
      root.querySelectorAll("[data-slider-go]").forEach((button) => {
        const selected = Number(button.dataset.sliderGo) === index;
        button.classList.toggle("is-selected", selected);
        if (selected) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    function play() {
      stop();
      if (paused || reduceMotion.matches || document.hidden || root._sliderVisible === false) return;
      timer = window.setInterval(() => show(index + 1), interval);
    }

    function setPaused(next) {
      paused = next;
      if (pauseButton) {
        pauseButton.setAttribute("aria-pressed", String(paused));
        pauseButton.textContent = paused ? "Play" : "Pause";
      }
      if (paused) stop();
      else play();
    }

    root.querySelector("[data-slider-prev]")?.addEventListener("click", () => {
      show(index - 1);
      play();
    });
    root.querySelector("[data-slider-next]")?.addEventListener("click", () => {
      show(index + 1);
      play();
    });
    pauseButton?.addEventListener("click", () => setPaused(!paused));
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-slider-go]");
      if (!button || !root.contains(button)) return;
      show(Number(button.dataset.sliderGo));
      play();
    });
    root.addEventListener("keydown", (event) => {
      if (event.target.closest("input, textarea, select")) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(index - 1);
        play();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        show(index + 1);
        play();
      }
    });
    viewport.addEventListener("touchstart", (event) => {
      touchX = event.changedTouches[0].clientX;
    }, { passive: true });
    viewport.addEventListener("touchend", (event) => {
      if (touchX == null) return;
      const delta = event.changedTouches[0].clientX - touchX;
      if (Math.abs(delta) > 40) {
        show(delta < 0 ? index + 1 : index - 1);
        play();
      }
      touchX = null;
    }, { passive: true });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", play);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", (event) => {
      if (!root.contains(event.relatedTarget)) play();
    });

    const resize = new ResizeObserver(layout);
    resize.observe(viewport);
    const visibility = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        root._sliderVisible = entry.isIntersecting;
        if (entry.isIntersecting) play();
        else stop();
      });
    }, { threshold: 0.25 });
    visibility.observe(viewport);

    if (paused) setPaused(true);
    show(0);
    play();
  });

  if (!document.documentElement.dataset.sliderVisibilityBound) {
    document.documentElement.dataset.sliderVisibilityBound = "true";
    document.addEventListener("visibilitychange", () => {
      document.querySelectorAll("[data-slider]").forEach((root) => {
        root.dispatchEvent(new Event(document.hidden ? "mouseenter" : "mouseleave"));
      });
    });
  }
}
