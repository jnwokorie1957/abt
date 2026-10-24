#!/usr/bin/env bash
# One-time setup. Run as the project owner in Google Cloud Shell.
set -euo pipefail
PROJECT=a-better-tomorrow-71ed0
NUMBER=1044824727019
RUNTIME="abt-api@${PROJECT}.iam.gserviceaccount.com"
DEPLOYER="abt-deployer@${PROJECT}.iam.gserviceaccount.com"

gcloud services enable run.googleapis.com artifactregistry.googleapis.com iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com cloudresourcemanager.googleapis.com firebasehosting.googleapis.com firebaserules.googleapis.com identitytoolkit.googleapis.com --project="$PROJECT"
for account in abt-api abt-deployer; do
  if ! gcloud iam service-accounts describe "${account}@${PROJECT}.iam.gserviceaccount.com" --project="$PROJECT" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$account" --display-name="$account" --project="$PROJECT"
  fi
done
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$RUNTIME" --role=roles/datastore.user --condition=None --quiet >/dev/null
for role in roles/run.admin roles/firebasehosting.admin roles/firebaserules.admin roles/firebase.viewer roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$DEPLOYER" --role="$role" --condition=None --quiet >/dev/null
done
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME" --member="serviceAccount:$DEPLOYER" --role=roles/iam.serviceAccountUser --project="$PROJECT" --quiet >/dev/null
if ! gcloud artifacts repositories describe abt-containers --location=us-central1 --project="$PROJECT" >/dev/null 2>&1; then
  gcloud artifacts repositories create abt-containers --repository-format=docker --location=us-central1 --project="$PROJECT"
fi
gcloud artifacts repositories add-iam-policy-binding abt-containers --location=us-central1 --project="$PROJECT" --member="serviceAccount:$DEPLOYER" --role=roles/artifactregistry.writer --quiet >/dev/null
if ! gcloud iam workload-identity-pools describe abt-github --location=global --project="$PROJECT" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create abt-github --location=global --display-name='ABT GitHub deploys' --project="$PROJECT"
fi
if ! gcloud iam workload-identity-pools providers describe github --workload-identity-pool=abt-github --location=global --project="$PROJECT" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc github --workload-identity-pool=abt-github --location=global --project="$PROJECT" --issuer-uri=https://token.actions.githubusercontent.com --attribute-mapping='google.subject=assertion.sub,attribute.repository_id=assertion.repository_id' --attribute-condition="assertion.repository_id == '1432372046' && assertion.repository_owner_id == '302289243' && assertion.ref == 'refs/heads/main'"
fi
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER" --project="$PROJECT" --role=roles/iam.workloadIdentityUser --member="principalSet://iam.googleapis.com/projects/$NUMBER/locations/global/workloadIdentityPools/abt-github/attribute.repository_id/1432372046" --quiet >/dev/null
printf '\nABT_INFRASTRUCTURE_READY\n'
