const imagePaths = {
    wheat: 'images/wheat.png',
    cutblock: 'images/ShortWheat.png',
    dirt: 'images/dirt.png',
    harvestorUp: 'images/harvestorUp.png',
    harvestorDown:'images/harvestorDown.png',
    harvestorLeft:'images/harvestorLeft.png',
    harvestorRight:'images/harvestorRight.png',
    chaserBinUp: 'images/chaserBinUp.png',
    chaserBinDown: 'images/chaserBinDown.png',
    chaserBinLeft: 'images/chaserBinLeft.png',
    chaserBinRight: 'images/chaserBinRight.png',
  };

  const images = {};


  function loadImages(callback) {
    let loadedImagesCount = 0;
    const totalImages = Object.keys(imagePaths).length;
  
    function onImageLoad() {
      loadedImagesCount++;
      if (loadedImagesCount === totalImages) {
        callback(images); // All images are loaded, execute the callback
      }
    }
  
    for (const [key, path] of Object.entries(imagePaths)) {
      images[key] = new Image();
      images[key].onload = onImageLoad;
      images[key].src = path;
    }
  }
  
  export { loadImages, images };