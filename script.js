const MAX_FILE_SIZE = 12 * 1024 * 1024;

const presets = {
  "photo-200-230-50": {
    mode: "photo",
    width: 200,
    height: 230,
    kb: 50,
    format: "image/jpeg",
    fit: "cover",
    whiteBg: true
  },
  "photo-300-400-100": {
    mode: "photo",
    width: 300,
    height: 400,
    kb: 100,
    format: "image/jpeg",
    fit: "cover",
    whiteBg: true
  },
  "photo-600-600-200": {
    mode: "photo",
    width: 600,
    height: 600,
    kb: 200,
    format: "image/jpeg",
    fit: "cover",
    whiteBg: true
  },
  "signature-140-60-20": {
    mode: "signature",
    width: 140,
    height: 60,
    kb: 20,
    format: "image/png",
    fit: "contain",
    whiteBg: true
  },
  "signature-300-100-50": {
    mode: "signature",
    width: 300,
    height: 100,
    kb: 50,
    format: "image/png",
    fit: "contain",
    whiteBg: true
  }
};

const state = {
  image: null,
  fileName: "",
  resultBlob: null,
  resultUrl: "",
  resultMime: "image/jpeg"
};

const imageInput = document.getElementById("imageInput");
const dropZone = document.getElementById("dropZone");
const statusMessage = document.getElementById("statusMessage");
const toastMessage = document.getElementById("toastMessage");

const originalSize = document.getElementById("originalSize");
const originalDimensions = document.getElementById("originalDimensions");

const modeSelect = document.getElementById("modeSelect");
const presetSelect = document.getElementById("presetSelect");
const targetWidth = document.getElementById("targetWidth");
const targetHeight = document.getElementById("targetHeight");
const targetKB = document.getElementById("targetKB");
const formatSelect = document.getElementById("formatSelect");
const whiteBgCheck = document.getElementById("whiteBgCheck");
const fitSelect = document.getElementById("fitSelect");

const processBtn = document.getElementById("processBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");
const emptyPreview = document.getElementById("emptyPreview");
const previewTag = document.getElementById("previewTag");

const outputSize = document.getElementById("outputSize");
const outputDimensions = document.getElementById("outputDimensions");
const outputFormat = document.getElementById("outputFormat");
const outputStatus = document.getElementById("outputStatus");
const outputNote = document.getElementById("outputNote");

dropZone.addEventListener("click", () => imageInput.click());

dropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    imageInput.click();
  }
});

imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) handleImageFile(file);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
  });
});

dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  if (file) handleImageFile(file);
});

presetSelect.addEventListener("change", applyPreset);
modeSelect.addEventListener("change", applyModeDefaults);
processBtn.addEventListener("click", processImage);
downloadBtn.addEventListener("click", downloadImage);
resetBtn.addEventListener("click", resetTool);

function handleImageFile(file) {
  if (!file.type.startsWith("image/")) {
    setStatus("Please upload a valid image file.", "error");
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    setStatus("This image is too large. Please upload an image under 12 MB.", "error");
    return;
  }

  setStatus("Loading your image...", "warning");

  const imageUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    URL.revokeObjectURL(imageUrl);

    state.image = image;
    state.fileName = file.name;
    clearResult();

    originalSize.textContent = formatFileSize(file.size);
    originalDimensions.textContent = `${image.naturalWidth} × ${image.naturalHeight}px`;

    processBtn.disabled = false;
    resetBtn.disabled = false;

    setStatus("Image loaded successfully. Choose settings and click Resize & Compress.", "success");
  };

  image.onerror = () => {
    URL.revokeObjectURL(imageUrl);
    setStatus("Could not load this image. Please try another file.", "error");
  };

  image.src = imageUrl;
}

function applyPreset() {
  const selected = presetSelect.value;

  if (selected === "custom") {
    modeSelect.value = "custom";
    return;
  }

  const preset = presets[selected];
  if (!preset) return;

  modeSelect.value = preset.mode;
  targetWidth.value = preset.width;
  targetHeight.value = preset.height;
  targetKB.value = preset.kb;
  formatSelect.value = preset.format;
  fitSelect.value = preset.fit;
  whiteBgCheck.checked = preset.whiteBg;

  clearResult();
}

function applyModeDefaults() {
  const mode = modeSelect.value;

  if (mode === "photo") {
    formatSelect.value = "image/jpeg";
    fitSelect.value = "cover";
    whiteBgCheck.checked = true;
  }

  if (mode === "signature") {
    formatSelect.value = "image/png";
    fitSelect.value = "contain";
    whiteBgCheck.checked = true;
  }

  if (mode === "custom") {
    presetSelect.value = "custom";
  }

  clearResult();
}

async function processImage() {
  if (!state.image) {
    setStatus("Upload an image before processing.", "error");
    return;
  }

  const width = Number(targetWidth.value);
  const height = Number(targetHeight.value);
  const kb = Number(targetKB.value);
  const mimeType = formatSelect.value;

  if (!isValidNumber(width, 20, 4000) || !isValidNumber(height, 20, 4000)) {
    setStatus("Please enter valid width and height between 20 and 4000 pixels.", "error");
    return;
  }

  if (!isValidNumber(kb, 5, 2000)) {
    setStatus("Please enter a valid target size between 5 KB and 2000 KB.", "error");
    return;
  }

  setStatus("Processing image...", "warning");
  processBtn.disabled = true;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    drawProcessedImage(ctx, canvas, state.image);

    const resultBlob = await compressCanvas(canvas, mimeType, kb);

    state.resultBlob = resultBlob;
    state.resultMime = mimeType;

    if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
    state.resultUrl = URL.createObjectURL(resultBlob);

    drawPreview(canvas);
    updateOutput(resultBlob, width, height, mimeType, kb);

    downloadBtn.disabled = false;
    setStatus("Image resized and compressed successfully.", "success");
  } catch (error) {
    setStatus("Something went wrong while processing. Try different settings.", "error");
    console.error(error);
  } finally {
    processBtn.disabled = false;
  }
}

function drawProcessedImage(ctx, canvas, image) {
  const width = canvas.width;
  const height = canvas.height;
  const useWhiteBg = whiteBgCheck.checked;
  const fitMethod = getFitMethod();

  ctx.clearRect(0, 0, width, height);

  if (useWhiteBg) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  if (fitMethod === "stretch") {
    ctx.drawImage(image, 0, 0, width, height);
    return;
  }

  if (fitMethod === "cover") {
    drawImageCover(ctx, image, width, height);
    return;
  }

  drawImageContain(ctx, image, width, height);
}

function getFitMethod() {
  const selected = fitSelect.value;

  if (selected !== "auto") return selected;

  if (modeSelect.value === "photo") return "cover";
  if (modeSelect.value === "signature") return "contain";

  return "contain";
}

function drawImageCover(ctx, image, canvasWidth, canvasHeight) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let sourceWidth;
  let sourceHeight;
  let sourceX;
  let sourceY;

  if (imageRatio > canvasRatio) {
    sourceHeight = image.naturalHeight;
    sourceWidth = sourceHeight * canvasRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
    sourceY = 0;
  } else {
    sourceWidth = image.naturalWidth;
    sourceHeight = sourceWidth / canvasRatio;
    sourceX = 0;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvasWidth,
    canvasHeight
  );
}

function drawImageContain(ctx, image, canvasWidth, canvasHeight) {
  const scale = Math.min(
    canvasWidth / image.naturalWidth,
    canvasHeight / image.naturalHeight
  );

  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = (canvasWidth - drawWidth) / 2;
  const drawY = (canvasHeight - drawHeight) / 2;

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

async function compressCanvas(canvas, mimeType, targetKBValue) {
  const targetBytes = targetKBValue * 1024;

  if (mimeType === "image/png") {
    const pngBlob = await canvasToBlob(canvas, "image/png");
    return pngBlob;
  }

  let minQuality = 0.1;
  let maxQuality = 0.95;
  let bestBlob = await canvasToBlob(canvas, mimeType, maxQuality);

  for (let i = 0; i < 8; i++) {
    const quality = (minQuality + maxQuality) / 2;
    const blob = await canvasToBlob(canvas, mimeType, quality);

    if (blob.size > targetBytes) {
      maxQuality = quality;
    } else {
      bestBlob = blob;
      minQuality = quality;
    }
  }

  if (bestBlob.size > targetBytes) {
    bestBlob = await canvasToBlob(canvas, mimeType, 0.08);
  }

  return bestBlob;
}

function canvasToBlob(canvas, mimeType, quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not create image blob."));
      }
    }, mimeType, quality);
  });
}

function drawPreview(sourceCanvas) {
  previewCanvas.width = sourceCanvas.width;
  previewCanvas.height = sourceCanvas.height;

  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.drawImage(sourceCanvas, 0, 0);

  previewCanvas.style.display = "block";
  emptyPreview.style.display = "none";
}

function updateOutput(blob, width, height, mimeType, targetKBValue) {
  const outputKB = blob.size / 1024;
  const isUnderTarget = outputKB <= targetKBValue;

  outputSize.textContent = formatFileSize(blob.size);
  outputDimensions.textContent = `${width} × ${height}px`;
  outputFormat.textContent = readableFormat(mimeType);
  previewTag.textContent = `${width} × ${height}`;

  if (isUnderTarget) {
    outputStatus.textContent = "Under target";
    outputStatus.style.color = "var(--success)";
    outputNote.textContent = "Great! Your image is under the selected target file size.";
  } else {
    outputStatus.textContent = "Above target";
    outputStatus.style.color = "var(--warning)";

    if (mimeType === "image/png") {
      outputNote.textContent =
        "PNG may not compress under the target KB. Try JPG or WebP if your form allows it.";
    } else {
      outputNote.textContent =
        "The image is still above target. Try smaller dimensions or a lower target size.";
    }
  }
}

function downloadImage() {
  if (!state.resultBlob || !state.resultUrl) {
    setStatus("Process an image before downloading.", "error");
    return;
  }

  const extension = extensionFromMime(state.resultMime);
  const cleanName = state.fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

  const link = document.createElement("a");
  link.href = state.resultUrl;
  link.download = `${cleanName || "formphotofit"}-resized.${extension}`;
  link.click();

setStatus("Image downloaded successfully.", "success");

downloadBtn.textContent = "Downloaded ✓";

setTimeout(() => {
  downloadBtn.textContent = "Download";
}, 2500);
}

function resetTool() {
  state.image = null;
  state.fileName = "";
  clearResult();

  imageInput.value = "";
  originalSize.textContent = "Not uploaded";
  originalDimensions.textContent = "Not uploaded";

  processBtn.disabled = true;
  downloadBtn.disabled = true;
  resetBtn.disabled = true;

  setStatus("Upload a photo or signature to start.", "");
}

function clearResult() {
  if (state.resultUrl) {
    URL.revokeObjectURL(state.resultUrl);
  }

  state.resultBlob = null;
  state.resultUrl = "";
  state.resultMime = "image/jpeg";

  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCanvas.style.display = "none";
  emptyPreview.style.display = "block";

  outputSize.textContent = "Not ready";
  outputDimensions.textContent = "Not ready";
  outputFormat.textContent = "Not ready";
  outputStatus.textContent = "Waiting";
  outputStatus.style.color = "inherit";
  outputNote.textContent =
    "Tip: JPG is usually best for photos. PNG is better for signatures but may not compress as much.";
  previewTag.textContent = "Waiting";

  downloadBtn.disabled = true;
}

function setStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = "status-message";

  if (type) {
    statusMessage.classList.add(type);
  }

  showToast(message, type);
}

function showToast(message, type) {
  if (!toastMessage) return;

  toastMessage.textContent = message;
  toastMessage.className = "toast-message";

  if (type) {
    toastMessage.classList.add(type);
  }

  toastMessage.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toastMessage.classList.remove("show");
  }, 3000);
}
function isValidNumber(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readableFormat(mimeType) {
  if (mimeType === "image/jpeg") return "JPG";
  if (mimeType === "image/png") return "PNG";
  if (mimeType === "image/webp") return "WebP";
  return mimeType;
}

function extensionFromMime(mimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}