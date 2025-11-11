document
  .querySelectorAll("div.post__thumbnail > figure > a")
  .forEach((div, index) => {
    setTimeout(() => div.click(), 500 * index);
  });
