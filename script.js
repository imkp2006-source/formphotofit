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
    resultMime: "image/jpeg",
    activeRequirement: "General online form"
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
const backgroundColorInput = document.getElementById("backgroundColor");
const quickPresetButtons = document.querySelectorAll(".quick-preset-btn");
const bgOptions = document.querySelectorAll(".bg-option");
const afterDownloadActions = document.getElementById("afterDownloadActions");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const fitSelect = document.getElementById("fitSelect");
const advancedSettings = document.getElementById("advancedSettings");
const requirementSearch = document.getElementById("requirementSearch");
const requirementCards = document.querySelectorAll(".requirement-card");
const requirementApplied = document.getElementById("requirementApplied");
const requirementAppliedTitle = document.getElementById("requirementAppliedTitle");
const requirementAppliedDetails = document.getElementById("requirementAppliedDetails");

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
const outputReadyFor = document.getElementById("outputReadyFor");
const processProgress = document.getElementById("processProgress");
const processProgressLabel = document.getElementById("processProgressLabel");
const processProgressPercent = document.getElementById("processProgressPercent");
const processProgressBar = document.getElementById("processProgressBar");
const processStepLabels = document.querySelectorAll(".process-steps span");
const validationReport = document.getElementById("validationReport");
const validationScore = document.getElementById("validationScore");
const validationScoreBar = document.getElementById("validationScoreBar");
const validationSummary = document.getElementById("validationSummary");
const validationAdvice = document.getElementById("validationAdvice");
const validationItems = {
    dimensions: document.getElementById("validationDimensions"),
    fileSize: document.getElementById("validationFileSize"),
    brightness: document.getElementById("validationBrightness"),
    contrast: document.getElementById("validationContrast"),
    sharpness: document.getElementById("validationSharpness"),
    background: document.getElementById("validationBackground")
};

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

quickPresetButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const presetValue = button.dataset.preset;

        if (presetSelect) {
            presetSelect.value = presetValue;
            applyPreset();
        }

        state.activeRequirement = getPresetReadyFor(presetValue);
        updateActivePresetChip(presetValue);
        trackFormPhotoEvent("quick_preset_selected", { preset: presetValue });
    });
});

requirementCards.forEach((card) => {
    card.addEventListener("click", () => {
        const presetValue = card.dataset.preset;
        const title = card.querySelector("strong")?.textContent || "Requirement";
        const details = card.querySelector("small")?.textContent || "Preset applied";

        requirementCards.forEach((item) => {
            const isActive = item === card;
            item.classList.toggle("active", isActive);
            item.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        state.activeRequirement = card.dataset.readyFor || title;
        presetSelect.value = presetValue;
        applyPreset();
        showRequirementApplied(title, details);
        trackFormPhotoEvent("requirement_selected", {
            requirement: card.dataset.requirement,
            preset: presetValue
        });
    });
});

if (requirementSearch) {
    requirementSearch.addEventListener("input", () => {
        const query = requirementSearch.value.trim().toLowerCase();
        let visibleCount = 0;

        requirementCards.forEach((card) => {
            const searchableText = `${card.dataset.requirement || ""} ${card.textContent}`.toLowerCase();
            const isVisible = !query || searchableText.includes(query);
            card.hidden = !isVisible;
            if (isVisible) visibleCount += 1;
        });

        requirementSearch.setAttribute(
            "aria-label",
            visibleCount === 1 ? "1 requirement found" : `${visibleCount} requirements found`
        );
    });
}

bgOptions.forEach((button) => {
    button.addEventListener("click", () => {
        setBackgroundOption(button.dataset.bg);
        clearResult();
    });
});

if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText("https://formphotofit.com/");
            setStatus("Website link copied.", "success");
            trackEvent("copy_link_click");
        } catch {
            setStatus("Could not copy link. You can manually copy formphotofit.com", "warning");
        }
    });
}

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
        trackEvent("image_upload_success", {
            file_size_kb: Math.round(file.size / 1024),
            width: image.naturalWidth,
            height: image.naturalHeight
        });
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
        showAdvancedSettings(true);
        updateActivePresetChip("custom");
        clearResult();
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
    setBackgroundOption(preset.whiteBg ? "#ffffff" : "transparent");
    showAdvancedSettings(false);

    updateActivePresetChip(selected);
    clearResult();
}

function applyModeDefaults() {
    const mode = modeSelect.value;

    if (mode === "photo") {
        formatSelect.value = "image/jpeg";
        fitSelect.value = "cover";
        setBackgroundOption("#ffffff");
    }

    if (mode === "signature") {
        formatSelect.value = "image/png";
        fitSelect.value = "contain";
        setBackgroundOption("#ffffff");
    }

    if (mode === "custom") {
        presetSelect.value = "custom";
        showAdvancedSettings(true);
    } else {
        showAdvancedSettings(false);
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
    document.body.classList.add("is-processing");
    processBtn.disabled = true;
    startProcessProgress();

    try {
        updateProcessProgress(20, "Preparing image…", "prepare");
        await nextFrame();

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        drawProcessedImage(ctx, canvas, state.image);
        updateProcessProgress(48, "Resizing to exact dimensions…", "resize");
        await nextFrame();

        const resultBlob = await compressCanvas(canvas, mimeType, kb);
        updateProcessProgress(82, "Optimizing file size…", "compress");
        await nextFrame();

        state.resultBlob = resultBlob;
        state.resultMime = mimeType;

        if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
        state.resultUrl = URL.createObjectURL(resultBlob);

        drawPreview(canvas);
        updateOutput(resultBlob, width, height, mimeType, kb);
        generateValidationReport(canvas, resultBlob, width, height, kb);

        downloadBtn.disabled = false;
        updateProcessProgress(100, "Done — your image is ready.", "done");
        setStatus("Image resized and compressed successfully.", "success");
        trackEvent("image_process_success", {
            mode: modeSelect.value,
            preset: presetSelect.value,
            target_kb: kb,
            output_kb: Math.round(resultBlob.size / 1024),
            format: readableFormat(mimeType)
        });
    } catch (error) {
        setStatus("Something went wrong while processing. Try different settings.", "error");
        console.error(error);
    } finally {
        document.body.classList.remove("is-processing");
        processBtn.disabled = false;
        window.setTimeout(() => {
            if (processProgress) processProgress.hidden = true;
        }, 900);
    }
}

function drawProcessedImage(ctx, canvas, image) {
    const width = canvas.width;
    const height = canvas.height;
    const selectedBackground = backgroundColorInput ? backgroundColorInput.value : "#ffffff";
    const fitMethod = getFitMethod();

    ctx.clearRect(0, 0, width, height);

    if (selectedBackground !== "transparent") {
        ctx.fillStyle = selectedBackground;
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
    if (outputReadyFor) outputReadyFor.textContent = state.activeRequirement || "General online form";

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

    if (afterDownloadActions) {
        afterDownloadActions.hidden = false;
    }

    trackFormPhotoEvent("image_download_success", {
        mode: modeSelect.value,
        preset: presetSelect.value,
        format: readableFormat(state.resultMime)
    });

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
    if (outputReadyFor) outputReadyFor.textContent = state.activeRequirement || "Choose a requirement";
    outputNote.textContent =
        "Tip: JPG is usually best for photos. PNG is better for signatures but may not compress as much.";
    previewTag.textContent = "Waiting";

    downloadBtn.disabled = true;

    if (afterDownloadActions) {
        afterDownloadActions.hidden = true;
    }

    resetValidationReport();
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

function updateActivePresetChip(selectedPreset) {
    quickPresetButtons.forEach((button) => {
        const isActive = button.dataset.preset === selectedPreset;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
}

function showRequirementApplied(title, details) {
    if (!requirementApplied || !requirementAppliedTitle || !requirementAppliedDetails) return;

    requirementAppliedTitle.textContent = `${title} preset applied`;
    requirementAppliedDetails.textContent = `${details}. Verify the official form instructions before submitting.`;
    requirementApplied.hidden = false;

    requirementApplied.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showAdvancedSettings(shouldShow) {
    if (!advancedSettings) return;
    advancedSettings.hidden = !shouldShow;
}

function setBackgroundOption(value) {
    if (backgroundColorInput) {
        backgroundColorInput.value = value;
    }

    bgOptions.forEach((button) => {
        const isActive = button.dataset.bg === value;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
}


function generateValidationReport(canvas, blob, width, height, targetKBValue) {
    if (!validationReport) return;

    const metrics = analyzeCanvasQuality(canvas);
    const sizePass = blob.size <= targetKBValue * 1024;
    const dimensionsPass = width >= 100 && height >= 60;
    const brightnessPass = metrics.meanBrightness >= 65 && metrics.meanBrightness <= 225;
    const contrastPass = metrics.contrast >= 28;
    const sharpnessPass = metrics.sharpness >= 10;
    const backgroundPass = metrics.edgeUniformity >= 0.55;

    let score = 100;
    const advice = [];

    if (!dimensionsPass) { score -= 20; advice.push("Use larger output dimensions when the portal allows it."); }
    if (!sizePass) { score -= 24; advice.push("Reduce dimensions or choose JPG/WebP to meet the target file size."); }
    if (!brightnessPass) {
        score -= 12;
        advice.push(metrics.meanBrightness < 65 ? "The image looks dark; increase lighting or exposure." : "The image looks very bright; reduce exposure to preserve detail.");
    }
    if (!contrastPass) { score -= 12; advice.push("Increase contrast slightly so the subject or signature is clearer."); }
    if (!sharpnessPass) { score -= 18; advice.push("The image may be soft or blurry; use a sharper original image."); }
    if (!backgroundPass && modeSelect.value === "photo") { score -= 8; advice.push("The outer edges are visually varied; official photos often work better with a plain background."); }

    score = Math.max(25, Math.min(100, Math.round(score)));
    validationReport.hidden = false;
    validationScore.textContent = String(score);
    validationScoreBar.style.width = `${score}%`;
    validationSummary.textContent = score >= 90 ? "Excellent technical quality." : score >= 75 ? "Good result with minor improvements possible." : score >= 55 ? "Usable, but review the warnings below." : "Needs improvement before submission.";

    setValidationItem(validationItems.dimensions, dimensionsPass ? "pass" : "warn", `${width} × ${height}px`);
    setValidationItem(validationItems.fileSize, sizePass ? "pass" : "fail", `${formatFileSize(blob.size)} ${sizePass ? "meets" : "exceeds"} the target`);
    setValidationItem(validationItems.brightness, brightnessPass ? "pass" : "warn", `${Math.round(metrics.meanBrightness)}/255 average`);
    setValidationItem(validationItems.contrast, contrastPass ? "pass" : "warn", `${Math.round(metrics.contrast)} contrast score`);
    setValidationItem(validationItems.sharpness, sharpnessPass ? "pass" : "warn", `${Math.round(metrics.sharpness)} detail score`);
    setValidationItem(validationItems.background, backgroundPass ? "pass" : "warn", `${Math.round(metrics.edgeUniformity * 100)}% edge consistency`);

    validationAdvice.innerHTML = "";
    (advice.length ? advice : ["The processed image passes the current technical checks. Verify the official portal instructions before submitting."]).forEach((message) => {
        const li = document.createElement("li");
        li.textContent = message;
        validationAdvice.appendChild(li);
    });

    trackFormPhotoEvent("validation_report_generated", {
        score,
        file_size_pass: sizePass,
        brightness_pass: brightnessPass,
        contrast_pass: contrastPass,
        sharpness_pass: sharpnessPass
    });
}

function analyzeCanvasQuality(canvas) {
    const sample = document.createElement("canvas");
    const maxSide = 180;
    const scale = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
    sample.width = Math.max(24, Math.round(canvas.width * scale));
    sample.height = Math.max(24, Math.round(canvas.height * scale));
    const ctx = sample.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0, sample.width, sample.height);
    const { data } = ctx.getImageData(0, 0, sample.width, sample.height);
    const luminance = new Float32Array(sample.width * sample.height);
    let sum = 0;

    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
        const value = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        luminance[p] = value;
        sum += value;
    }

    const mean = sum / luminance.length;
    let variance = 0;
    let edgeEnergy = 0;
    let edgeCount = 0;
    let edgeDeviation = 0;
    let borderCount = 0;

    for (let y = 0; y < sample.height; y += 1) {
        for (let x = 0; x < sample.width; x += 1) {
            const index = y * sample.width + x;
            const value = luminance[index];
            variance += (value - mean) ** 2;
            if (x > 0 && y > 0) {
                edgeEnergy += Math.abs(value - luminance[index - 1]) + Math.abs(value - luminance[index - sample.width]);
                edgeCount += 2;
            }
            const isBorder = x < 3 || y < 3 || x >= sample.width - 3 || y >= sample.height - 3;
            if (isBorder) {
                edgeDeviation += Math.abs(value - mean);
                borderCount += 1;
            }
        }
    }

    const contrast = Math.sqrt(variance / luminance.length);
    const sharpness = edgeCount ? edgeEnergy / edgeCount : 0;
    const meanEdgeDeviation = borderCount ? edgeDeviation / borderCount : 255;
    const edgeUniformity = Math.max(0, Math.min(1, 1 - meanEdgeDeviation / 90));

    return { meanBrightness: mean, contrast, sharpness, edgeUniformity };
}

function setValidationItem(element, status, message) {
    if (!element) return;
    element.classList.remove("pass", "warn", "fail");
    element.classList.add(status);
    const icon = element.querySelector(".validation-icon");
    const text = element.querySelector("small");
    if (icon) icon.textContent = status === "pass" ? "✓" : status === "fail" ? "×" : "!";
    if (text) text.textContent = message;
}

function resetValidationReport() {
    if (!validationReport) return;
    validationReport.hidden = true;
    if (validationScore) validationScore.textContent = "--";
    if (validationScoreBar) validationScoreBar.style.width = "0%";
}

function getPresetReadyFor(presetValue) {
    const labels = {
        "photo-200-230-50": "Photo form requiring under 50 KB",
        "photo-300-400-100": "Passport, admission, or ID-style form",
        "photo-600-600-200": "Profile or job application",
        "signature-140-60-20": "Signature form requiring under 20 KB",
        "signature-300-100-50": "Signature form requiring under 50 KB",
        "custom": "Custom requirement"
    };
    return labels[presetValue] || "General online form";
}

function startProcessProgress() {
    if (!processProgress) return;
    processProgress.hidden = false;
    updateProcessProgress(8, "Preparing image…", "prepare");
}

function updateProcessProgress(percent, label, activeStep) {
    if (processProgressLabel) processProgressLabel.textContent = label;
    if (processProgressPercent) processProgressPercent.textContent = `${percent}%`;
    if (processProgressBar) processProgressBar.style.width = `${percent}%`;

    processStepLabels.forEach((step) => {
        const order = ["prepare", "resize", "compress", "done"];
        const activeIndex = order.indexOf(activeStep);
        const stepIndex = order.indexOf(step.dataset.step);
        step.classList.toggle("active", stepIndex <= activeIndex);
    });
}

function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function trackEvent(eventName, params = {}) {
    if (typeof gtag === "function") {
        gtag("event", eventName, params);
    }
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


showAdvancedSettings(presetSelect && presetSelect.value === "custom");
updateActivePresetChip(presetSelect ? presetSelect.value : "photo-200-230-50");

function trackFormPhotoEvent(eventName, params = {}) {
    if (typeof gtag === "function") {
        gtag("event", eventName, {
            tool_name: "formphotofit",
            page_path: window.location.pathname,
            ...params
        });
    }
}

// FormPhotoFit v2.2 — Smart Requirement Center
const popularRequirementButtons = document.querySelectorAll("[data-requirement-target]");
const recentRequirementsBox = document.getElementById("recentRequirements");
const recentRequirementChips = document.getElementById("recentRequirementChips");
const clearRecentRequirements = document.getElementById("clearRecentRequirements");
const requirementDetailsTitle = document.getElementById("requirementDetailsTitle");
const requirementDetailDimensions = document.getElementById("requirementDetailDimensions");
const requirementDetailSize = document.getElementById("requirementDetailSize");
const requirementDetailFormat = document.getElementById("requirementDetailFormat");
const requirementDetailBackground = document.getElementById("requirementDetailBackground");
const copySettingsBtn = document.getElementById("copySettingsBtn");
const clearToolBtn = document.getElementById("clearToolBtn");
const RECENT_REQUIREMENTS_KEY = "formphotofit_recent_requirements_v1";

function getRequirementCardData(card) {
    const preset = presets[card.dataset.preset] || null;
    return {
        key: card.dataset.requirement || card.dataset.readyFor || "requirement",
        title: card.dataset.readyFor || card.querySelector("strong")?.textContent || "Requirement",
        details: card.querySelector("small")?.textContent || "Custom settings",
        preset: card.dataset.preset,
        width: preset?.width || Number(targetWidth.value),
        height: preset?.height || Number(targetHeight.value),
        kb: preset?.kb || Number(targetKB.value),
        format: readableFormat(preset?.format || formatSelect.value),
        background: preset?.whiteBg === false ? "Transparent" : "White"
    };
}

function updateRequirementDetails(data) {
    if (!data) return;
    if (requirementDetailsTitle) requirementDetailsTitle.textContent = data.title;
    if (requirementDetailDimensions) requirementDetailDimensions.textContent = `${data.width} × ${data.height} px`;
    if (requirementDetailSize) requirementDetailSize.textContent = `${data.kb} KB`;
    if (requirementDetailFormat) requirementDetailFormat.textContent = data.format;
    if (requirementDetailBackground) requirementDetailBackground.textContent = data.background;
}

function saveRecentRequirement(data) {
    try {
        const previous = JSON.parse(localStorage.getItem(RECENT_REQUIREMENTS_KEY) || "[]");
        const next = [data, ...previous.filter((item) => item.key !== data.key)].slice(0, 4);
        localStorage.setItem(RECENT_REQUIREMENTS_KEY, JSON.stringify(next));
        renderRecentRequirements();
    } catch (error) { console.warn("Recent requirements unavailable", error); }
}

function renderRecentRequirements() {
    if (!recentRequirementsBox || !recentRequirementChips) return;
    let items = [];
    try { items = JSON.parse(localStorage.getItem(RECENT_REQUIREMENTS_KEY) || "[]"); } catch {}
    recentRequirementChips.innerHTML = "";
    recentRequirementsBox.hidden = items.length === 0;
    items.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = item.title;
        button.addEventListener("click", () => {
            const card = [...requirementCards].find((candidate) => candidate.dataset.requirement === item.key || candidate.dataset.readyFor === item.title);
            if (card) card.click();
        });
        recentRequirementChips.appendChild(button);
    });
}

requirementCards.forEach((card) => {
    card.addEventListener("click", () => {
        const data = getRequirementCardData(card);
        updateRequirementDetails(data);
        saveRecentRequirement(data);
    });
});

popularRequirementButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const target = button.dataset.requirementTarget;
        const card = [...requirementCards].find((candidate) => (candidate.dataset.requirement || "").includes(target));
        if (card) card.click();
    });
});

if (clearRecentRequirements) clearRecentRequirements.addEventListener("click", () => {
    localStorage.removeItem(RECENT_REQUIREMENTS_KEY);
    renderRecentRequirements();
});

if (copySettingsBtn) copySettingsBtn.addEventListener("click", async () => {
    const text = [
        `Requirement: ${requirementDetailsTitle?.textContent || state.activeRequirement}`,
        `Width: ${targetWidth.value} px`,
        `Height: ${targetHeight.value} px`,
        `Maximum size: ${targetKB.value} KB`,
        `Format: ${readableFormat(formatSelect.value)}`,
        `Background: ${backgroundColorInput.value === "transparent" ? "Transparent" : "White"}`
    ].join("\n");
    try { await navigator.clipboard.writeText(text); setStatus("Settings copied.", "success"); trackFormPhotoEvent("requirement_settings_copied"); }
    catch { setStatus("Could not copy settings.", "warning"); }
});

if (clearToolBtn) clearToolBtn.addEventListener("click", () => {
    resetTool();
    if (requirementSearch) {
        requirementSearch.value = "";
        requirementCards.forEach((card) => card.hidden = false);
    }
    requirementCards.forEach((card) => { card.classList.remove("active"); card.setAttribute("aria-pressed", "false"); });
    if (requirementApplied) requirementApplied.hidden = true;
    state.activeRequirement = "General online form";
    updateRequirementDetails({title:"General online form",width:200,height:230,kb:50,format:"JPG",background:"White"});
    setStatus("Tool cleared. Choose a requirement or upload a new image.", "");
});

renderRecentRequirements();


// FormPhotoFit v2.2.1 — category filters, favorites, finished success flow
const requirementCategoryFilters = document.querySelectorAll('.category-filter');
const favoriteRequirementBtn = document.getElementById('favoriteRequirementBtn');
const requirementDetailCategory = document.getElementById('requirementDetailCategory');
const requirementDetailUpdated = document.getElementById('requirementDetailUpdated');
const successPanel = document.getElementById('successPanel');
const successPanelText = document.getElementById('successPanelText');
const successDownloadBtn = document.getElementById('successDownloadBtn');
const successCopyBtn = document.getElementById('successCopyBtn');
const successAnotherBtn = document.getElementById('successAnotherBtn');
const FAVORITES_KEY = 'formphotofit_favorite_requirements_v1';
let activeRequirementCategory = 'all';
let currentRequirementCard = null;

function readFavoriteRequirements(){ try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch { return []; } }
function writeFavoriteRequirements(items){ try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(items)); } catch {} }
function requirementKey(card){ return card?.dataset.requirement || card?.dataset.readyFor || ''; }
function refreshFavoriteUI(){
  const favorites = readFavoriteRequirements();
  requirementCards.forEach(card => card.classList.toggle('is-favorite', favorites.includes(requirementKey(card))));
  if (favoriteRequirementBtn) {
    const selected = currentRequirementCard && favorites.includes(requirementKey(currentRequirementCard));
    favoriteRequirementBtn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    favoriteRequirementBtn.textContent = selected ? '★ Favorited' : '☆ Add Favorite';
    favoriteRequirementBtn.disabled = !currentRequirementCard;
  }
}
function applyRequirementFilters(){
  const query = requirementSearch?.value.trim().toLowerCase() || '';
  const favorites = readFavoriteRequirements();
  let visible = 0;
  requirementCards.forEach(card => {
    const searchText = `${card.dataset.requirement || ''} ${card.textContent}`.toLowerCase();
    const searchMatch = !query || searchText.includes(query);
    const categoryMatch = activeRequirementCategory === 'all' ||
      (activeRequirementCategory === 'favorites' ? favorites.includes(requirementKey(card)) : card.dataset.category === activeRequirementCategory);
    card.hidden = !(searchMatch && categoryMatch);
    if (!card.hidden) visible += 1;
  });
  requirementSearch?.setAttribute('aria-label', `${visible} requirements found`);
}
requirementCategoryFilters.forEach(button => button.addEventListener('click', () => {
  activeRequirementCategory = button.dataset.category;
  requirementCategoryFilters.forEach(item => { const on = item === button; item.classList.toggle('active', on); item.setAttribute('aria-pressed', on ? 'true':'false'); });
  applyRequirementFilters();
}));
requirementSearch?.addEventListener('input', applyRequirementFilters);
requirementCards.forEach(card => card.addEventListener('click', () => {
  currentRequirementCard = card;
  const label = card.querySelector('strong')?.textContent || 'Requirement';
  if (requirementDetailCategory) requirementDetailCategory.textContent = ({exams:'Indian Exam',ids:'Government ID',international:'Passport / Visa',professional:'Professional',signature:'Signature'})[card.dataset.category] || 'General';
  if (requirementDetailUpdated) requirementDetailUpdated.textContent = 'July 2026';
  refreshFavoriteUI();
}));
favoriteRequirementBtn?.addEventListener('click', () => {
  if (!currentRequirementCard) return;
  const key = requirementKey(currentRequirementCard); let favorites = readFavoriteRequirements();
  favorites = favorites.includes(key) ? favorites.filter(item => item !== key) : [...favorites, key].slice(-20);
  writeFavoriteRequirements(favorites); refreshFavoriteUI(); applyRequirementFilters();
  setStatus(favorites.includes(key) ? 'Requirement added to favorites.' : 'Requirement removed from favorites.', 'success');
});

function showFinishedSuccessPanel(){
  if (!successPanel) return;
  successPanel.hidden = false;
  if (successPanelText) successPanelText.textContent = `${state.activeRequirement || 'Selected requirement'} settings are applied. Review the validation report, then download your image.`;
  const scoreNumber = Number(validationScore?.textContent || 0);
  const scoreCircle = validationScore?.closest('.validation-score');
  if (scoreCircle) scoreCircle.style.setProperty('--validation-score-angle', `${Math.max(0,Math.min(100,scoreNumber))*3.6}deg`);
}
successDownloadBtn?.addEventListener('click', downloadImage);
successCopyBtn?.addEventListener('click', () => copySettingsBtn?.click());
successAnotherBtn?.addEventListener('click', () => { requirementSearch?.focus(); document.querySelector('.requirement-finder')?.scrollIntoView({behavior:'smooth',block:'start'}); });

// hook into existing output/clear functions without replacing stable logic
const originalUpdateOutputV221 = updateOutput;
updateOutput = function(...args){ const result = originalUpdateOutputV221.apply(this,args); window.setTimeout(showFinishedSuccessPanel,60); return result; };
const originalClearResultV221 = clearResult;
clearResult = function(...args){ const result = originalClearResultV221.apply(this,args); if(successPanel) successPanel.hidden = true; return result; };
refreshFavoriteUI();

// Deep-link support: ?preset=photo-200-230-50 applies a preset and scrolls to the tool.
// Lets dedicated landing pages (e.g. an SSC or IBPS exam page) link straight into the
// correct pre-configured setting instead of asking the visitor to find it manually.
(function initPresetFromUrl() {
    try {
        const params = new URLSearchParams(window.location.search);
        const requestedPreset = params.get("preset");
        if (!requestedPreset || !presets[requestedPreset]) return;

        presetSelect.value = requestedPreset;
        applyPreset();

        const readyFor = getPresetReadyFor(requestedPreset);
        if (readyFor) {
            setStatus(`${readyFor} preset applied. Upload your image to continue.`, "success");
        }

        window.setTimeout(() => {
            document.getElementById("tool")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
    } catch (err) {
        // Fail silently — deep-linking is an enhancement, not required for the tool to work.
    }
})();
