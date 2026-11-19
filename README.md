# Clyptus.ai Employee Evaluation Report

A lightweight React + TypeScript + Vite application for creating and managing professional employee evaluation reports.

The app runs entirely in the browser. It does not require a backend, database, login, or API configuration.

## Requirements

Install the following before running the application:

- Node.js 18 or newer
- npm, included with Node.js

Check that they are installed:

```powershell
node --version
npm --version
```

## Run the application locally

### 1. Open a terminal

Open PowerShell or Windows Terminal.

### 2. Go to the project folder

```powershell
cd "S:\AI Team"
```

If the project is stored somewhere else, replace the path with the correct folder path.

### 3. Install dependencies

Run this once after downloading or copying the project:

```powershell
npm install
```

This installs React, Vite, TypeScript, Lucide icons, and the required type definitions.

### 4. Start the development server

```powershell
npm run dev
```

Vite will display a local address similar to:

```text
http://localhost:5173/
```

Open that address in your browser.

To stop the server, press `Ctrl + C` in the terminal.

## Application workflow

The application uses three screens:

1. Candidate List
2. Add/Edit Candidate Form
3. Individual Evaluation Dashboard

### Add a candidate

1. Click `Add candidate` on the Candidate List page.
2. Complete the candidate information fields.
3. Upload a candidate photograph if available.
4. Add projects and choose each project status.
5. Set the Team Lead Rating, including half-point ratings such as `4.5`.
6. Add capabilities, skills, project-worth points, summary, recommendation, and optional remarks.
7. Click `Save candidate`.
8. The candidate appears as one row in the Candidate List.

### Open and manage a candidate

- Click the candidate name or `View` to open the individual dashboard.
- Use `Edit` to reopen the form with all saved values prefilled.
- Use the delete button to remove a candidate after confirmation.
- Search candidates by name.
- Click the sort control to switch between name and rating sorting.
- Click `Print / Download PDF`, then choose `Save as PDF` in the browser print dialog.

Use `Save draft` when you want to keep an incomplete form locally without adding it to the Candidate List.

### Import candidates from Excel

1. Open the Candidate List page.
2. Click `Import Excel`.
3. Select `Interns_Access_Details (Responses).xlsx`.
4. The app imports the candidate name, phone number, email ID, and blood group.
5. Imported rows appear in the Candidate List as individual candidates.
6. Use `Edit` on each imported candidate to complete the evaluation details such as designation, experience, projects, rating, capabilities, skills, and summary.

Duplicate rows with the same name and email are skipped automatically.

## Production build

To create an optimized production build:

```powershell
npm run build
```

The compiled files are created in the `dist` folder.

## Preview the production build

After running the build command:

```powershell
npm run preview
```

Open the local URL shown in the terminal.

## Data storage

- Candidate records are saved using browser `localStorage`.
- Each candidate has a unique ID, so editing updates the existing record instead of creating a duplicate.
- Draft forms are stored separately in `localStorage`.
- Saved reports are available only in the same browser and device.
- Clearing browser site data removes saved reports.
- Uploaded photos are stored as browser data for the saved report.
- There is currently no cloud sync or shared database.

## Project structure

```text
S:\AI Team
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── src
    ├── main.tsx
    ├── styles.css
    └── vite-env.d.ts
```

## Useful commands

```powershell
# Install dependencies
npm install

# Start local development
npm run dev

# Check the production build
npm run build

# Preview the production build
npm run preview
```

