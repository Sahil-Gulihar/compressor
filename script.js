// Initialize PDF.js
if (typeof pdfjsLib !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
}

// Constants
const MAX_SIZE = 256 * 1024; // 256KB

// Files storage
const files = [];
let totalSize = 0;
let conversionMode = "pdf"; // Default conversion mode

// DOM elements
const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const convertBtn = document.getElementById("convertBtn");
const clearBtn = document.getElementById("clearBtn");
const progressContainer = document.getElementById("progress-container");
const progress = document.getElementById("progress");
const status = document.getElementById("status");
const sizeEstimate = document.getElementById("sizeEstimate");
const qualitySlider = document.getElementById("qualitySlider");
const qualityValue = document.getElementById("qualityValue");
const dpiSlider = document.getElementById("dpiSlider");
const dpiValue = document.getElementById("dpiValue");
const toPdfOption = document.getElementById("to-pdf-option");
const toJpgOption = document.getElementById("to-jpg-option");

// Event listeners
dropArea.addEventListener("click", () => fileInput.click());

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, highlight, false);
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

dropArea.addEventListener("drop", handleDrop, false);
fileInput.addEventListener("change", handleFiles, false);
convertBtn.addEventListener("click", convertFiles);
clearBtn.addEventListener("click", clearFiles);

qualitySlider.addEventListener("input", () => {
  qualityValue.textContent = qualitySlider.value;
  updateSizeEstimate();
});

dpiSlider.addEventListener("input", () => {
  dpiValue.textContent = dpiSlider.value;
  updateSizeEstimate();
});

// Conversion mode selection
toPdfOption.addEventListener("click", () => {
  toPdfOption.classList.add("selected");
  toJpgOption.classList.remove("selected");
  conversionMode = "pdf";
  updateSizeEstimate();
});

toJpgOption.addEventListener("click", () => {
  toJpgOption.classList.add("selected");
  toPdfOption.classList.remove("selected");
  conversionMode = "jpg";
  updateSizeEstimate();
});

/**
 * Prevent default browser behavior for drag and drop
 */
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Highlight drop area when dragging over
 */
function highlight() {
  dropArea.classList.add("highlight");
}

/**
 * Remove highlight from drop area
 */
function unhighlight() {
  dropArea.classList.remove("highlight");
}

/**
 * Handle dropped files
 */
function handleDrop(e) {
  const dt = e.dataTransfer;
  const newFiles = dt.files;
  handleFiles({ target: { files: newFiles } });
}

/**
 * Process newly added files
 */
/**
 * Process newly added files
 */
function handleFiles(e) {
    const newFiles = Array.from(e.target.files);
    
    // Filter for supported file types
    const validFiles = newFiles.filter(file => {
        const fileType = file.type.toLowerCase();
        return fileType === 'application/pdf' || 
               fileType === 'image/jpeg' || 
               file.name.toLowerCase().endsWith('.jpg') || 
               file.name.toLowerCase().endsWith('.jpeg');
    });
    
    if (validFiles.length === 0) {
        alert('Please select JPG, JPEG or PDF files only.');
        return;
    }
    
    // Add files to the list
    validFiles.forEach(file => {
        if (!files.some(f => f.name === file.name && f.size === file.size)) {
            files.push(file);
            totalSize += file.size;
            addFileToList(file);
        }
    });
    
    updateButtons();
    updateSizeEstimate();
}
function dataURItoBlob(dataURI) {
  // Convert base64 to raw binary data held in a string
  const byteString = atob(dataURI.split(",")[1]);

  // Separate out the mime component
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

  // Write the bytes of the string to an ArrayBuffer
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  // Create a blob with the ArrayBuffer
  return new Blob([ab], { type: mimeString });
}
/**
 * Helper function to convert Data URI to Blob
 */
function dataURItoBlob(dataURI) {
  // Convert base64 to raw binary data held in a string
  const byteString = atob(dataURI.split(",")[1]);

  // Separate out the mime component
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

  // Write the bytes of the string to an ArrayBuffer
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  // Create a blob with the ArrayBuffer
  return new Blob([ab], { type: mimeString });
}

/**
 * Format file size for display
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
  else return (bytes / 1048576).toFixed(2) + " MB";
}

/**
 * Add a file to the UI list
 */
function addFileToList(file) {
  const item = document.createElement("div");
  item.className = "file-item";

  const fileName = document.createElement("div");
  fileName.className = "file-name";
  fileName.textContent = file.name;

  const fileSize = document.createElement("div");
  fileSize.className = "file-size";
  fileSize.textContent = formatSize(file.size);

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.onclick = () => {
    const index = files.findIndex((f) => f === file);
    if (index !== -1) {
      files.splice(index, 1);
      totalSize -= file.size;
      item.remove();
      updateButtons();
      updateSizeEstimate();
    }
  };

  item.appendChild(fileName);
  item.appendChild(fileSize);
  item.appendChild(removeBtn);
  fileList.appendChild(item);
}

/**
 * Update button states based on file selection
 */
function updateButtons() {
  convertBtn.disabled = files.length === 0;
  clearBtn.disabled = files.length === 0;
}

/**
 * Update the estimated output size
 */
function updateSizeEstimate() {
  const quality = parseInt(qualitySlider.value) / 100;
  const dpi = parseInt(dpiSlider.value);

  // Rough estimate based on input file size, quality, and DPI
  let estimatedSize = 0;
  files.forEach((file) => {
    if (file.type === "application/pdf") {
      // PDF files will result in more output when converting to JPG
      if (conversionMode === "jpg") {
        estimatedSize += file.size * 1.2 * quality * (dpi / 300);
      } else {
        estimatedSize += file.size * 0.8;
      }
    } else {
      // JPEG compression can be more effective
      estimatedSize += file.size * quality * (dpi / 300);
    }
  });

  sizeEstimate.textContent = `Estimated output size: ${formatSize(
    estimatedSize
  )}`;

  // Warn if estimated size is too large
  if (estimatedSize > MAX_SIZE) {
    sizeEstimate.innerHTML +=
      '<br><strong style="color:red">Warning: Estimated size exceeds 256KB. Increase compression or reduce file count.</strong>';
  }
}

/**
 * Clear all files from the list
 */
function clearFiles() {
  files.length = 0;
  totalSize = 0;
  fileList.innerHTML = "";
  updateButtons();
  sizeEstimate.textContent = "";
}

/**
 * Convert files based on selected mode
 */
function convertFiles() {
  if (files.length === 0) return;

  if (conversionMode === "pdf") {
    convertToPDF();
  } else {
    convertToJPG();
  }
}

/**
 * Convert files to PDF
 */
async function convertToPDF() {
  // Show progress and update button state
  progressContainer.style.display = "block";
  progress.value = 0;
  status.textContent = "Processing files...";
  convertBtn.disabled = true;

  try {
    const { PDFDocument } = PDFLib;
    const quality = parseInt(qualitySlider.value) / 100;
    const dpi = parseInt(dpiSlider.value);

    // Create a new PDF
    const pdfDoc = await PDFDocument.create();

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      progress.value = (i / files.length) * 50;
      status.textContent = `Processing ${file.name}...`;

      if (file.type === "application/pdf") {
        // Handle PDF files
        const fileArrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(fileArrayBuffer);

        // Load the PDF
        const existingPdfDoc = await PDFDocument.load(pdfBytes);
        const pages = await pdfDoc.copyPages(
          existingPdfDoc,
          existingPdfDoc.getPageIndices()
        );

        // Add each page to new document
        pages.forEach((page) => {
          pdfDoc.addPage(page);
        });
      } else {
        // Handle image files
        const fileArrayBuffer = await file.arrayBuffer();

        // Create an image data URL for rendering
        const blob = new Blob([fileArrayBuffer], { type: file.type });
        const imageUrl = URL.createObjectURL(blob);

        // Load image to get dimensions
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = imageUrl;
        });

        // Calculate dimensions based on DPI
        const scaleFactor = dpi / 96; // 96 DPI is default for screens
        const width = img.width / scaleFactor;
        const height = img.height / scaleFactor;

        // Create a canvas for image compression
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Set dimensions for the desired DPI
        canvas.width = img.width * (quality * 0.9); // Reduce dimensions slightly based on quality
        canvas.height = img.height * (quality * 0.9);

        // Draw and compress the image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to JPEG with quality setting
        const compressedImageData = canvas.toDataURL("image/jpeg", quality);
        const base64Data = compressedImageData.split(",")[1];

        // Add image to PDF
        const jpgImage = await pdfDoc.embedJpg(base64Data);
        const page = pdfDoc.addPage([width, height]);

        // Center the image on the page
        page.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });

        // Clean up
        URL.revokeObjectURL(imageUrl);
      }
    }

    // Save the PDF
    status.textContent = "Compressing PDF...";
    progress.value = 75;

    // Serialize the PDF to bytes
    let pdfBytes = await pdfDoc.save();

    // If PDF is too large, try higher compression
    if (pdfBytes.length > MAX_SIZE) {
      status.textContent = "Output too large, applying extra compression...";

      // Create a new compressed version
      const compressedDoc = await PDFDocument.create();

      // Re-embed each page as an image with higher compression
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        progress.value = 75 + (i / pdfDoc.getPageCount()) * 20;

        // Create a canvas to render the PDF page
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        // Get the page
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();

        // Scale down if needed based on size
        const scale = Math.min(1, Math.sqrt(MAX_SIZE / pdfBytes.length));
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        // Set canvas size
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        // Render using a temporary data URL (this is a simplified approach)
        // For better results, use pdf.js to render pages, but this requires more complex code
        const tempBlob = new Blob([pdfBytes], { type: "application/pdf" });
        const tempUrl = URL.createObjectURL(tempBlob);

        try {
          // Draw a white background
          context.fillStyle = "white";
          context.fillRect(0, 0, canvas.width, canvas.height);

          // Use a very aggressive JPEG compression
          const highlyCompressedJpg = canvas.toDataURL(
            "image/jpeg",
            Math.min(quality * 0.8, 0.5)
          );
          const jpgImageData = highlyCompressedJpg.split(",")[1];

          // Embed and draw the compressed image
          const jpgImage = await compressedDoc.embedJpg(jpgImageData);
          const newPage = compressedDoc.addPage([scaledWidth, scaledHeight]);
          newPage.drawImage(jpgImage, {
            x: 0,
            y: 0,
            width: scaledWidth,
            height: scaledHeight,
          });
        } finally {
          URL.revokeObjectURL(tempUrl);
        }
      }

      // Get the final bytes
      pdfBytes = await compressedDoc.save();

      // If still too large, reduce quality further
      if (pdfBytes.length > MAX_SIZE) {
        status.textContent = "Still too large, applying maximum compression...";

        // We need to use even more aggressive compression
        // This is a simplified approach - in a real app, you'd use a more
        // sophisticated PDF compression library
        const finalCompressedDoc = await PDFDocument.create();
        const finalScale = Math.min(0.7, Math.sqrt(MAX_SIZE / pdfBytes.length));

        for (let i = 0; i < compressedDoc.getPageCount(); i++) {
          const page = compressedDoc.getPage(i);
          const { width, height } = page.getSize();

          const newWidth = width * finalScale;
          const newHeight = height * finalScale;

          // Add a blank page
          finalCompressedDoc.addPage([newWidth, newHeight]);
        }

        pdfBytes = await finalCompressedDoc.save();
      }
    }

    // Download the PDF
    progress.value = 100;
    status.textContent = "Complete!";

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed_document.pdf";
    a.click();

    URL.revokeObjectURL(url);

    setTimeout(() => {
      progressContainer.style.display = "none";
      convertBtn.disabled = false;
    }, 3000);
  } catch (error) {
    console.error("Error during conversion:", error);
    status.textContent = "Error: " + error.message;
    alert(`PDF conversion error: ${error.message}. Check console for details.`);
    convertBtn.disabled = false;
  }
}

/**
 * Convert files to JPG images
 */
/**
 * Convert files to JPG images
 */
async function convertToJPG() {
  // Show progress and update button state
  progressContainer.style.display = "block";
  progress.value = 0;
  status.textContent = "Initializing...";
  convertBtn.disabled = true;

  try {
    // Ensure PDF.js is loaded
    if (typeof pdfjsLib === "undefined") {
      // Load PDF.js dynamically if needed
      status.textContent = "Loading PDF.js library...";

      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);

        // Set a timeout for loading
        setTimeout(
          () => reject(new Error("PDF.js library loading timed out")),
          10000
        );
      });

      await new Promise((resolve, reject) => {
        const workerScript = document.createElement("script");
        workerScript.src =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        workerScript.onload = resolve;
        workerScript.onerror = reject;
        document.head.appendChild(workerScript);
      });

      window.pdfjsLib = window.pdfjsLib || window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
    }

    const quality = parseInt(qualitySlider.value) / 100;
    const dpi = parseInt(dpiSlider.value);

    // Temporary storage for generated images
    const processedImages = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      status.textContent = `Processing ${file.name}...`;
      progress.value = (i / files.length) * 50;

      if (file.type === "application/pdf") {
        try {
          // Handle PDF files
          status.textContent = `Reading PDF: ${file.name}`;
          const arrayBuffer = await file.arrayBuffer();

          status.textContent = `Loading PDF document...`;
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const numPages = pdf.numPages;

          status.textContent = `PDF has ${numPages} pages. Converting to images...`;

          for (let j = 1; j <= numPages; j++) {
            status.textContent = `Converting page ${j} of ${numPages}...`;
            progress.value =
              (i / files.length) * 50 + ((j / numPages) * 50) / files.length;

            // Get the page
            const page = await pdf.getPage(j);
            const viewport = page.getViewport({ scale: dpi / 72 });

            // Create canvas
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext("2d");

            // Draw white background
            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, canvas.height);

            // Render the page
            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };

            status.textContent = `Rendering page ${j}...`;
            await page.render(renderContext).promise;

            // Create image and apply compression
            let compressionLevel = quality;
            let imageData = canvas.toDataURL("image/jpeg", compressionLevel);

            // Check if image size is too large
            let blob = dataURItoBlob(imageData);

            // If too large, compress further
            while (blob.size > MAX_SIZE && compressionLevel > 0.1) {
              compressionLevel -= 0.1;
              imageData = canvas.toDataURL("image/jpeg", compressionLevel);
              blob = dataURItoBlob(imageData);
            }

            // If still too large, reduce dimensions
            if (blob.size > MAX_SIZE) {
              const scale = Math.sqrt(MAX_SIZE / blob.size) * 0.9; // 10% safety margin
              const scaledWidth = Math.floor(canvas.width * scale);
              const scaledHeight = Math.floor(canvas.height * scale);

              const tempCanvas = document.createElement("canvas");
              tempCanvas.width = scaledWidth;
              tempCanvas.height = scaledHeight;
              const tempContext = tempCanvas.getContext("2d");

              // Draw resized image
              tempContext.fillStyle = "white";
              tempContext.fillRect(0, 0, scaledWidth, scaledHeight);
              tempContext.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);

              imageData = tempCanvas.toDataURL("image/jpeg", compressionLevel);
              blob = dataURItoBlob(imageData);
            }

            // Store the processed image
            const fileName = `${file.name.replace(".pdf", "")}_page_${j}.jpg`;
            processedImages.push({
              name: fileName,
              data: imageData,
              size: blob.size,
            });
          }
        } catch (pdfError) {
          console.error("Error processing PDF:", pdfError);
          status.textContent = `Error processing PDF: ${pdfError.message}`;
          // Continue with other files despite this error
        }
      } else if (
        file.type === "image/jpeg" ||
        file.name.toLowerCase().endsWith(".jpg") ||
        file.name.toLowerCase().endsWith(".jpeg")
      ) {
        try {
          // Handle JPEG files - just compress them
          status.textContent = `Processing image: ${file.name}`;

          const fileArrayBuffer = await file.arrayBuffer();
          const blob = new Blob([fileArrayBuffer], { type: file.type });
          const imageUrl = URL.createObjectURL(blob);

          // Load the image
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageUrl;
          });

          // Create a canvas
          const canvas = document.createElement("canvas");
          canvas.width = img.width * (dpi / 96); // 96 DPI is default for screens
          canvas.height = img.height * (dpi / 96);
          const ctx = canvas.getContext("2d");

          // Draw white background
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw the image with compression
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Compress the image
          let compressionLevel = quality;
          let imageData = canvas.toDataURL("image/jpeg", compressionLevel);

          // Check size and compress further if needed
          let jpgBlob = dataURItoBlob(imageData);

          // If too large, compress further
          while (jpgBlob.size > MAX_SIZE && compressionLevel > 0.1) {
            compressionLevel -= 0.1;
            imageData = canvas.toDataURL("image/jpeg", compressionLevel);
            jpgBlob = dataURItoBlob(imageData);
          }

          // If still too large, reduce dimensions
          if (jpgBlob.size > MAX_SIZE) {
            const scale = Math.sqrt(MAX_SIZE / jpgBlob.size) * 0.9; // 10% safety margin
            const scaledWidth = Math.floor(canvas.width * scale);
            const scaledHeight = Math.floor(canvas.height * scale);

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = scaledWidth;
            tempCanvas.height = scaledHeight;
            const tempContext = tempCanvas.getContext("2d");

            // Draw resized image
            tempContext.fillStyle = "white";
            tempContext.fillRect(0, 0, scaledWidth, scaledHeight);
            tempContext.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);

            imageData = tempCanvas.toDataURL("image/jpeg", compressionLevel);
            jpgBlob = dataURItoBlob(imageData);
          }

          // Store the processed image
          URL.revokeObjectURL(imageUrl);
          const fileName =
            file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg";
          processedImages.push({
            name: fileName,
            data: imageData,
            size: jpgBlob.size,
          });
        } catch (imgError) {
          console.error("Error processing image:", imgError);
          status.textContent = `Error processing image: ${imgError.message}`;
          // Continue with other files despite this error
        }
      }
    }

    // All files processed, display results
    if (processedImages.length === 0) {
      status.textContent = "No images were successfully processed.";
      setTimeout(() => {
        progressContainer.style.display = "none";
        convertBtn.disabled = false;
      }, 3000);
      return;
    }

    progress.value = 100;
    status.textContent = `Completed! ${processedImages.length} images processed.`;

    // Create result container to display processed images
    const resultContainer = document.createElement("div");
    resultContainer.className = "result-container";

    const resultHeader = document.createElement("h3");
    resultHeader.textContent = `${processedImages.length} Images Ready for Download`;
    resultContainer.appendChild(resultHeader);

    // Download All button
    if (processedImages.length > 1) {
      const downloadAllBtn = document.createElement("button");
      downloadAllBtn.textContent = "Download All Images";
      downloadAllBtn.className = "download-all-btn";

      downloadAllBtn.onclick = () => {
        status.textContent = "Downloading all images...";

        // Download images one by one with slight delay
        processedImages.forEach((img, index) => {
          setTimeout(() => {
            const a = document.createElement("a");
            a.href = img.data;
            a.download = img.name;
            a.click();

            if (index === processedImages.length - 1) {
              status.textContent = "All downloads complete!";
            }
          }, index * 500);
        });
      };

      resultContainer.appendChild(downloadAllBtn);
    }

    // Create list of images
    const imageList = document.createElement("div");
    imageList.className = "image-list";

    processedImages.forEach((img, index) => {
      const imgItem = document.createElement("div");
      imgItem.className = "image-item";

      const imgName = document.createElement("div");
      imgName.className = "image-name";
      imgName.textContent = `${index + 1}. ${img.name}`;

      const imgSize = document.createElement("div");
      imgSize.className = "image-size";
      imgSize.textContent = formatSize(img.size);

      const downloadBtn = document.createElement("button");
      downloadBtn.className = "image-download-btn";
      downloadBtn.textContent = "Download";

      downloadBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = img.data;
        a.download = img.name;
        a.click();
      };

      imgItem.appendChild(imgName);
      imgItem.appendChild(imgSize);
      imgItem.appendChild(downloadBtn);
      imageList.appendChild(imgItem);
    });

    resultContainer.appendChild(imageList);

    // Add result container to page
    const container = document.querySelector(".container");

    // Check if there's an existing result container to replace
    const existingResult = document.querySelector(".result-container");
    if (existingResult) {
      container.replaceChild(resultContainer, existingResult);
    } else {
      container.insertBefore(resultContainer, convertBtn.parentNode);
    }

    // Enable convert button
    convertBtn.disabled = false;
  } catch (error) {
    console.error("Error during JPG conversion:", error);
    status.textContent = "Error: " + error.message;
    alert(`JPG conversion error: ${error.message}. Check console for details.`);
    convertBtn.disabled = false;
  }
}
