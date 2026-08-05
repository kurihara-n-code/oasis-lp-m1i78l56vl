(function () {
  "use strict";

  var slider = document.querySelector("[data-customer-voices]");
  if (!slider) return;

  var viewport = slider.querySelector(".customer-voices-viewport");
  var track = slider.querySelector(".customer-voices-track");
  var slides = Array.from(track.querySelectorAll(".customer-voice-card"));
  var previousButton = slider.querySelector(".customer-voices-prev");
  var nextButton = slider.querySelector(".customer-voices-next");
  var position = slider.querySelector(".customer-voices-position span");

  if (!viewport || !track || !previousButton || !nextButton || slides.length < 2) return;

  var index = 0;
  var physicalIndex = 1;
  var animating = false;
  var animationTimer = 0;
  var resizeTimer = 0;
  var startX = 0;
  var startY = 0;
  var deltaX = 0;
  var swiping = false;

  var lastClone = slides[slides.length - 1].cloneNode(true);
  var firstClone = slides[0].cloneNode(true);
  [lastClone, firstClone].forEach(function (clone) {
    clone.setAttribute("aria-hidden", "true");
    clone.classList.add("is-clone");
    clone.classList.remove("is-active");
  });
  track.insertBefore(lastClone, track.firstChild);
  track.appendChild(firstClone);

  function updateHeight() {
    var activeSlide = track.children[physicalIndex];
    if (!activeSlide) return;
    viewport.style.height = activeSlide.offsetHeight + "px";
  }

  function setTransform(animate, dragOffset) {
    track.classList.toggle("is-dragging", !animate);
    var offset = typeof dragOffset === "number" ? dragOffset : 0;
    track.style.transform = "translate3d(calc(" + (-physicalIndex * 100) + "% + " + offset + "px), 0, 0)";
  }

  function updateState(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      var active = slideIndex === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    if (position) position.textContent = String(index + 1);
    window.requestAnimationFrame(updateHeight);
  }

  function finishAnimation() {
    window.clearTimeout(animationTimer);
    animating = false;
    if (physicalIndex === 0) {
      physicalIndex = slides.length;
      setTransform(false, 0);
    } else if (physicalIndex === slides.length + 1) {
      physicalIndex = 1;
      setTransform(false, 0);
    }
    updateHeight();
  }

  function queueAnimationFinish() {
    window.clearTimeout(animationTimer);
    animationTimer = window.setTimeout(finishAnimation, 560);
  }

  function move(step) {
    if (animating) return;
    physicalIndex += step;
    updateState(index + step);
    animating = true;
    setTransform(true, 0);
    queueAnimationFinish();
  }

  previousButton.addEventListener("click", function () { move(-1); });
  nextButton.addEventListener("click", function () { move(1); });

  viewport.addEventListener("keydown", function (event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    move(event.key === "ArrowRight" ? 1 : -1);
  });

  track.addEventListener("transitionend", function (event) {
    if (event.target === track && event.propertyName === "transform") finishAnimation();
  });

  viewport.addEventListener("touchstart", function (event) {
    if (animating || event.touches.length !== 1) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    deltaX = 0;
    swiping = false;
    track.classList.add("is-dragging");
  }, { passive: true });

  viewport.addEventListener("touchmove", function (event) {
    if (animating || event.touches.length !== 1) return;
    var nextDeltaX = event.touches[0].clientX - startX;
    var deltaY = event.touches[0].clientY - startY;
    if (!swiping && Math.abs(nextDeltaX) < 8) return;
    if (!swiping && Math.abs(nextDeltaX) <= Math.abs(deltaY) * 1.08) return;
    swiping = true;
    deltaX = nextDeltaX;
    event.preventDefault();
    setTransform(false, nextDeltaX);
  }, { passive: false });

  function finishSwipe() {
    if (animating) return;
    if (!swiping) {
      setTransform(true, 0);
      return;
    }
    var threshold = Math.min(70, viewport.clientWidth * 0.16);
    if (Math.abs(deltaX) >= threshold) move(deltaX < 0 ? 1 : -1);
    else setTransform(true, 0);
    swiping = false;
  }

  viewport.addEventListener("touchend", finishSwipe, { passive: true });
  viewport.addEventListener("touchcancel", finishSwipe, { passive: true });

  Array.from(slider.querySelectorAll("img")).forEach(function (image) {
    if (!image.complete) image.addEventListener("load", updateHeight, { once: true });
  });

  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(updateHeight, 120);
  });

  updateState(0);
  setTransform(false, 0);
})();