export function counter(bouncyCounter) {
  const verbsCounter = document.querySelectorAll(".enlisted_verb").length;
  bouncyCounter.innerHTML = verbsCounter;
  bouncyCounter.style.backgroundColor = "white";
  bouncyCounter.style.color = "black";
  setTimeout(function () {
    bouncyCounter.style.backgroundColor = "transparent";
    bouncyCounter.style.color = "white";
  }, 1000);
}
