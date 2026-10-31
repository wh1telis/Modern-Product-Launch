const track = document.querySelector(".carousel-track");
const originalSlides = Array.from(document.querySelectorAll(".carousel-slide"));
const dotsContainer = document.querySelector(".carousel-dots");
const viewport = document.querySelector(".carousel-viewport");

const totalOriginalSlides = originalSlides.length;

// === 1. КЛОНИРОВАНИЕ СЛАЙДОВ ===
// === 1. КЛОНИРОВАНИЕ СЛАЙДОВ ===
const firstClone = originalSlides[0].cloneNode(true);
const lastClone = originalSlides[totalOriginalSlides - 1].cloneNode(true);

// Вместо insertBefore используем современный prepend (вставляет в начало)
track.appendChild(firstClone); // Клон первого слайда идет в конец
track.prepend(lastClone); // Клон последнего слайда идет в самое начало

let currentIndex = 1;
let startX = 0;
let currentTranslate = 0; // Текущий сдвиг в пикселях
let prevTranslate = 0; // Сдвиг, который был до начала текущего свайпа
let isDragging = false; // Нажата ли мышь/палец прямо сейчас
let isTransitioning = false;
const swipeThreshold = 50; // Порог для переключения слайда (в пикселях)

// Функция для расчета ширины одного слайда в пикселях
function getSlideWidth() {
  return viewport.offsetWidth;
}

// Первоначальное выставление позиции на настоящий первый слайд
function setPositionByIndex() {
  currentTranslate = -currentIndex * getSlideWidth();
  prevTranslate = currentTranslate;
  track.style.transition = "none";
  track.style.transform = `translateX(${currentTranslate}px)`;
}
setPositionByIndex();

// === 2. СОЗДАНИЕ ТОЧЕК ===
originalSlides.forEach((_, index) => {
  const dot = document.createElement("div");
  dot.classList.add("dot");
  if (index === 0) dot.classList.add("active");

  dot.addEventListener("click", () => {
    if (isTransitioning || isDragging) return;
    currentIndex = index + 1;
    updateCarouselWithAnimation();
  });
  dotsContainer.appendChild(dot);
});
const dots = document.querySelectorAll(".dot");

function updateDots() {
  dots.forEach((dot) => dot.classList.remove("active"));
  let dotIndex = currentIndex - 1;
  if (currentIndex === 0) dotIndex = totalOriginalSlides - 1;
  if (currentIndex === totalOriginalSlides + 1) dotIndex = 0;
  if (dots[dotIndex]) dots[dotIndex].classList.add("active");
}

// === 3. ФУНКЦИИ АНИМАЦИИ И ТЕЛЕПОРТАЦИИ ===
function updateCarouselWithAnimation() {
  isTransitioning = true;
  track.style.transition = "transform 0.4s ease-out";
  currentTranslate = -currentIndex * getSlideWidth();
  prevTranslate = currentTranslate;
  track.style.transform = `translateX(${currentTranslate}px)`;
  updateDots();
}

track.addEventListener("transitionend", () => {
  isTransitioning = false;

  // Бесконечный прыжок вперед
  if (currentIndex === totalOriginalSlides + 1) {
    currentIndex = 1;
    setPositionByIndex();
  }
  // Бесконечный прыжок назад
  if (currentIndex === 0) {
    currentIndex = totalOriginalSlides;
    setPositionByIndex();
  }
  updateDots();
});

// Пересчитываем координаты, если пользователь изменил размер окна браузера
window.addEventListener("resize", setPositionByIndex);

// === 4. ОБРАБОТКА ДВИЖЕНИЯ (ЖИВОЙ СВАЙП) ===

function handleStart(e) {
  if (isTransitioning) return;
  isDragging = true;

  // Отключаем анимацию, чтобы лента мгновенно следовала за пальцем
  track.style.transition = "none";

  startX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
}

function handleMove(e) {
  if (!isDragging) return;

  const currentX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
  const currentDragMoved = currentX - startX; // Сколько пикселей прошел палец с момента нажатия

  // Двигаем ленту прямо во время движения пальца
  currentTranslate = prevTranslate + currentDragMoved;
  track.style.transform = `translateX(${currentTranslate}px)`;
}

function handleEnd() {
  if (!isDragging) return;
  isDragging = false;

  const movedBy = currentTranslate - prevTranslate; // Общая дистанция свайпа в пикселях

  // Если свайпнули влево (movedBy отрицательный) и превысили порог
  if (movedBy < -swipeThreshold) {
    currentIndex++;
  }
  // Если свайпнули вправо (movedBy положительный) и превысили порог
  else if (movedBy > swipeThreshold) {
    currentIndex--;
  }

  // Запускаем плавное дотягивание до нужного слайда
  updateCarouselWithAnimation();
}

// === 5. НАВЕШИВАНИЕ СОБЫТИЙ ===

// Мобильные устройства
viewport.addEventListener("touchstart", handleStart, { passive: true });
viewport.addEventListener("touchmove", handleMove, { passive: true });
viewport.addEventListener("touchend", handleEnd);

// Компьютеры (Мышь)
viewport.addEventListener("mousedown", handleStart);
viewport.addEventListener("mousemove", handleMove);
viewport.addEventListener("mouseup", handleEnd);
viewport.addEventListener("mouseleave", handleEnd); // Если мышка улетела за пределы карусели
// === 6. ПОДДЕРЖКА ТРЕКПАДА (СВАЙП ДВУМЯ ПАЛЬЦАМИ) ===

let wheelAccumulator = 0; // Переменная для накопления прокрутки
let wheelTimeout;

viewport.addEventListener(
  "wheel",
  (e) => {
    // Нам нужен только горизонтальный скролл (deltaX)
    // Если пользователь крутит колесико вверх-вниз (deltaY), мы не ломаем обычный скролл страницы
    if (Math.abs(e.deltaX) === 0) return;

    if (isTransitioning || isDragging) return;

    // Отменяем стандартное поведение браузера (переход по истории страниц назад/вперед)
    e.preventDefault();

    // Накапливаем значение скролла от трекпада
    wheelAccumulator += e.deltaX;

    // Очищаем старый таймер отпускания трекпада
    clearTimeout(wheelTimeout);

    // Ставим таймер: если пользователь перестал свайпать, проверяем, накопилось ли достаточное движение
    wheelTimeout = setTimeout(() => {
      // Если свайпнули влево (пальцы по трекпаду пошли влево, deltaX положительный)
      if (wheelAccumulator > swipeThreshold) {
        currentIndex++;
        updateCarouselWithAnimation();
      }
      // Если свайпнули вправо
      else if (wheelAccumulator < -swipeThreshold) {
        currentIndex--;
        updateCarouselWithAnimation();
      }

      // Сбрасываем накопитель для следующего жеста
      wheelAccumulator = 0;
    }, 50); // 50 миллисекунд задержки хватает, чтобы понять, что жест окончен
  },
  { passive: false },
); // Важно: passive: false позволяет использовать e.preventDefault()
