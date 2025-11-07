# Employee Progress Tracker

Employee Progress Tracker is a full-stack web application that helps organisations monitor daily job-search activity for their employees. It pairs a FastAPI backend with a React/Tailwind dashboard, stores daily reflections as JSON in Amazon S3, and supports secure attachment uploads with presigned links.

## Highlights

- **Google sign-in with Firebase** – single-click authentication and role-based routing for employees vs. admins.
- **Daily log capture** – employees record day number, jobs applied, submissions, recruiter contact, and reflections.
- **Secure S3 storage** – FastAPI uploads JSON logs and PDF/DOCX attachments into dedicated buckets and returns presigned URLs.
- **Rich analytics** – admin dashboard includes summary metrics, bar/pie charts, top-performer callouts, and a six-week engagement heatmap.
- **Attachment preview** – inline PDF preview modals for both employees and admins.
- **Infrastructure as code** – Terraform modules provision versioned, encrypted S3 buckets for logs and attachments.

## Project Structure

```
student_progress_tracker/
├── backend/           # FastAPI application
├── frontend/          # React (Vite) dashboard
├── terraform/         # Infrastructure modules & stacks
├── README.md          # (this file)
└── SETUP_COMMANDS.md  # Helpful shell snippets
```

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS, Axios, Recharts
- **Backend:** FastAPI, Pydantic, boto3, Firebase Admin SDK
- **Auth:** Firebase Google Sign-In
- **Storage:** AWS S3 (daily logs + attachments)
- **Infrastructure:** Terraform (HashiCorp AWS provider)

## Prerequisites

- Node.js 18+
- Python 3.11+
- AWS account (S3 access)
- Firebase project (Google sign-in configured)
- Terraform 1.6+

## Local Development

### 1. Backend (FastAPI)

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` (see **Environment Variables**). Then start the server:

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend (React)

```powershell
cd frontend
npm install
npm run dev -- --host
```

Visit `http://localhost:5173`.

## Environment Variables

### Backend (`backend/.env`)

```
FIREBASE_PROJECT_ID=your-firebase-project
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_BUCKET=student-tracker-data
ATTACHMENTS_BUCKET=student-tracker-attachments
```

Place the Firebase service account JSON at `backend/firebase_key.json` (ignored by git).

### Frontend (`frontend/.env`)

```
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Deploying

- **Backend (recommended railway setup)**
  1. Push this repository to GitHub.
  2. In Railway, create a new project from GitHub, target the `backend/` folder, set Python buildpack.
  3. Add all backend environment variables, including AWS keys.
  4. Deploy – Railway provides the public API URL.

- **Frontend (Vercel or Railway Static)**
  1. Import repo, set root to `frontend/`.
  2. Add the same Firebase vars plus `VITE_API_BASE_URL` pointing to the deployed backend.
  3. Build & deploy.

## Terraform

The `terraform/` directory contains modules and two stacks:

- `main.tf` – provisions the primary S3 bucket (`student-tracker-data`).
- `attachments_bucket/` – optional stack to manage a separate attachments bucket.

Usage:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

> The `.terraform/` directories are ignored so providers are downloaded locally but never committed to git.

## Attachment Workflow

1. Employees submit the daily form with a PDF/DOCX attachment (template encourages listing companies and progress).
2. FastAPI validates the extension, uploads the file to the attachments bucket, and stores the key in the log JSON.
3. Dashboards render a `Preview` button (PDF iframe) and `Download` link via presigned URLs that expire automatically.

## Screenshots

| Landing Page | Admin Dashboard |
| --- | --- |
| ![Landing page screenshot](docs/landing.png?raw=1) | ![Admin dashboard screenshot](docs/admin-dashboard.png?raw=1) |

> Add captures under `docs/` (ignored by git unless you include them) to keep visuals up to date.

## Contributing

Pull requests are welcome. Please include tests or manual verification steps when altering backend endpoints or dashboard flows.

## License

MIT License – see `LICENSE` if provided, otherwise customise based on your organisation’s needs.


