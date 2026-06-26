# FormPhotoFit

**FormPhotoFit** is a free browser-based photo and signature resizer for online forms, exam forms, admission forms, job applications, and document upload portals.

Users can upload an image, resize it to custom dimensions, compress it under a target KB size, preview the result, and download the final file instantly.

## Live Demo

Coming soon

<!-- Add your deployed link here later -->

<!-- Example: https://formphotofit.com -->

## Features

* Upload photo or signature image
* Show original image size and dimensions
* Resize image using width and height in pixels
* Compress image under a target KB size
* Choose output format: JPG, PNG, or WebP
* Built-in presets for photos and signatures
* Custom size option
* White background option for signatures
* Fit methods: auto, contain, cover, and stretch
* Preview resized/compressed image before downloading
* Download final processed image
* Reset button
* Friendly error and success messages
* Floating toast notification for clear user feedback
* Mobile-first responsive design
* SEO-friendly homepage with FAQ section
* Privacy, Terms, About, Contact, and 404 pages

## Presets Included

* Photo: 200 × 230 px, under 50 KB
* Photo: 300 × 400 px, under 100 KB
* Photo: 600 × 600 px, under 200 KB
* Signature: 140 × 60 px, under 20 KB
* Signature: 300 × 100 px, under 50 KB
* Custom size

## Privacy

FormPhotoFit processes images directly inside the browser using JavaScript and Canvas.

Images are **not uploaded to any server**.
No backend, database, login, or paid API is used.

## Tech Stack

* HTML
* CSS
* Vanilla JavaScript
* Canvas API
* Cloudflare Pages / Workers deployment ready

## Project Structure

```txt
formphotofit/
│
├── index.html
├── style.css
├── script.js
├── privacy.html
├── terms.html
├── about.html
├── contact.html
├── 404.html
├── robots.txt
├── sitemap.xml
└── assets/
    └── logo.svg
```

## How to Run Locally

1. Download or clone the repository.
2. Open the folder in VS Code.
3. Install the **Live Server** extension.
4. Right-click `index.html`.
5. Click **Open with Live Server**.

## Use Cases

FormPhotoFit can be useful for:

* Exam photo resizing
* Signature resizing
* Online application forms
* College admission forms
* Job application portals
* Scholarship forms
* Passport-style photo resizing
* Compressing photos under required KB limits

## Important Note

Always check the official instructions of the form, exam, or portal before submitting your final image. Different portals may require different dimensions, formats, and file size limits.

## Future Improvements

* More exam-specific presets
* Drag-to-crop feature
* Background cleanup for signatures
* PDF support
* Batch image processing
* Download result card
* Google Analytics custom event tracking

## Disclaimer

FormPhotoFit is an independent tool. It is not affiliated with any exam board, university, government portal, or application platform.

## License

This project is open for learning and personal use.
